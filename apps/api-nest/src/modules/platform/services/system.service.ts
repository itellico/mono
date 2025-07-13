import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';

@Injectable()
export class SystemService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // ==================== SUBSCRIPTION MANAGEMENT ====================

  async getSubscriptions(query: { 
    page?: number; 
    limit?: number; 
    search?: string;
    status?: 'active' | 'expired' | 'trial' | 'cancelled';
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { tenant: { name: { contains: query.search, mode: 'insensitive' } } },
        { plan: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        include: {
          tenant: {
            select: { id: true, name: true, domain: true }
          },
          plan: {
            select: { id: true, name: true, price: true, currency: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.subscription.count({ where })
    ]);

    return {
      success: true,
      data: {
        items: subscriptions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  }

  async getSubscription(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        tenant: {
          select: { id: true, name: true, domain: true, isActive: true }
        },
        plan: {
          select: { id: true, name: true, description: true, price: true, currency: true, billingCycle: true },
          include: {
            planFeatures: {
              include: {
                feature: {
                  select: { id: true, key: true, name: true, description: true }
                }
              }
            }
          }
        }
      }
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return {
      success: true,
      data: subscription
    };
  }

  async createSubscription(userId: string, createSubscriptionDto: {
    tenantId: string;
    planId: string;
    startDate: string;
    endDate?: string;
    status: string;
  }) {
    // Verify tenant and plan exist
    const [tenant, plan] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: createSubscriptionDto.tenantId } }),
      this.prisma.plan.findUnique({ where: { id: createSubscriptionDto.planId } })
    ]);

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    if (!plan) {
      throw new BadRequestException('Plan not found');
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        tenantId: createSubscriptionDto.tenantId,
        planId: createSubscriptionDto.planId,
        startDate: new Date(createSubscriptionDto.startDate),
        endDate: createSubscriptionDto.endDate ? new Date(createSubscriptionDto.endDate) : null,
        status: createSubscriptionDto.status,
        createdById: userId
      },
      include: {
        tenant: {
          select: { id: true, name: true, domain: true }
        },
        plan: {
          select: { id: true, name: true, price: true, currency: true }
        }
      }
    });

    // Clear cache for tenant subscriptions
    await this.redis.del(`tenant:${createSubscriptionDto.tenantId}:subscription`);

    return {
      success: true,
      data: subscription
    };
  }

  async updateSubscription(subscriptionId: string, updateSubscriptionDto: {
    tenantId?: string;
    planId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!existingSubscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Verify new tenant and plan exist if being updated
    if (updateSubscriptionDto.tenantId && updateSubscriptionDto.tenantId !== existingSubscription.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: updateSubscriptionDto.tenantId } });
      if (!tenant) {
        throw new BadRequestException('Tenant not found');
      }
    }

    if (updateSubscriptionDto.planId && updateSubscriptionDto.planId !== existingSubscription.planId) {
      const plan = await this.prisma.plan.findUnique({ where: { id: updateSubscriptionDto.planId } });
      if (!plan) {
        throw new BadRequestException('Plan not found');
      }
    }

    const updateData: any = { ...updateSubscriptionDto };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const subscription = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        tenant: {
          select: { id: true, name: true, domain: true }
        },
        plan: {
          select: { id: true, name: true, price: true, currency: true }
        }
      }
    });

    // Clear cache for old and new tenant subscriptions
    await Promise.all([
      this.redis.del(`tenant:${existingSubscription.tenantId}:subscription`),
      updateSubscriptionDto.tenantId && updateSubscriptionDto.tenantId !== existingSubscription.tenantId
        ? this.redis.del(`tenant:${updateSubscriptionDto.tenantId}:subscription`)
        : Promise.resolve()
    ]);

    return {
      success: true,
      data: subscription
    };
  }

  async deleteSubscription(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    await this.prisma.subscription.delete({
      where: { id: subscriptionId }
    });

    // Clear cache
    await this.redis.del(`tenant:${subscription.tenantId}:subscription`);

    return {
      success: true,
      message: 'Subscription deleted successfully'
    };
  }

  // ==================== PLAN MANAGEMENT ====================

  async getPlans(query: { 
    page?: number; 
    limit?: number; 
    search?: string;
    active?: boolean;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.active !== undefined) {
      where.isActive = query.active;
    }

    const [plans, total] = await Promise.all([
      this.prisma.plan.findMany({
        where,
        skip,
        take: limit,
        include: {
          planFeatures: {
            include: {
              feature: {
                select: { id: true, key: true, name: true }
              }
            }
          },
          _count: {
            select: { subscriptions: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.plan.count({ where })
    ]);

    return {
      success: true,
      data: {
        items: plans,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  }

  async getPlan(planId: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      include: {
        planFeatures: {
          include: {
            feature: {
              select: { id: true, key: true, name: true, description: true }
            }
          }
        },
        subscriptions: {
          select: { id: true, status: true, tenant: { select: { name: true } } }
        }
      }
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return {
      success: true,
      data: plan
    };
  }

  async createPlan(userId: string, createPlanDto: {
    name: string;
    description?: string;
    price: number;
    currency: string;
    billingCycle: string;
    features: { featureId: string; limit: number }[];
  }) {
    // Verify all features exist
    const featureIds = createPlanDto.features.map(f => f.featureId);
    const features = await this.prisma.feature.findMany({
      where: { id: { in: featureIds } }
    });

    if (features.length !== featureIds.length) {
      throw new BadRequestException('One or more features not found');
    }

    const plan = await this.prisma.plan.create({
      data: {
        name: createPlanDto.name,
        description: createPlanDto.description,
        price: createPlanDto.price,
        currency: createPlanDto.currency,
        billingCycle: createPlanDto.billingCycle,
        createdById: userId,
        planFeatures: {
          create: createPlanDto.features.map(feature => ({
            featureId: feature.featureId,
            limit: feature.limit
          }))
        }
      },
      include: {
        planFeatures: {
          include: {
            feature: {
              select: { id: true, key: true, name: true }
            }
          }
        }
      }
    });

    return {
      success: true,
      data: plan
    };
  }

  async updatePlan(planId: string, updatePlanDto: {
    name?: string;
    description?: string;
    price?: number;
    currency?: string;
    billingCycle?: string;
    features?: { featureId: string; limit: number }[];
  }) {
    const existingPlan = await this.prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!existingPlan) {
      throw new NotFoundException('Plan not found');
    }

    const updateData: any = { ...updatePlanDto };
    delete updateData.features; // Handle features separately

    // If features are being updated, verify they exist
    if (updatePlanDto.features) {
      const featureIds = updatePlanDto.features.map(f => f.featureId);
      const features = await this.prisma.feature.findMany({
        where: { id: { in: featureIds } }
      });

      if (features.length !== featureIds.length) {
        throw new BadRequestException('One or more features not found');
      }

      // Delete existing plan features and create new ones
      await this.prisma.planFeature.deleteMany({
        where: { planId }
      });

      updateData.planFeatures = {
        create: updatePlanDto.features.map(feature => ({
          featureId: feature.featureId,
          limit: feature.limit
        }))
      };
    }

    const plan = await this.prisma.plan.update({
      where: { id: planId },
      data: updateData,
      include: {
        planFeatures: {
          include: {
            feature: {
              select: { id: true, key: true, name: true }
            }
          }
        }
      }
    });

    return {
      success: true,
      data: plan
    };
  }

  async deletePlan(planId: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      include: {
        _count: {
          select: { subscriptions: true }
        }
      }
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (plan._count.subscriptions > 0) {
      throw new BadRequestException('Cannot delete plan with active subscriptions');
    }

    await this.prisma.plan.delete({
      where: { id: planId }
    });

    return {
      success: true,
      message: 'Plan deleted successfully'
    };
  }

  // ==================== FEATURE MANAGEMENT ====================

  async getFeatures(query: { 
    page?: number; 
    limit?: number; 
    search?: string;
    active?: boolean;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { key: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.active !== undefined) {
      where.isActive = query.active;
    }

    const [features, total] = await Promise.all([
      this.prisma.feature.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { planFeatures: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.feature.count({ where })
    ]);

    return {
      success: true,
      data: {
        items: features,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  }

  async getFeature(featureId: string) {
    const feature = await this.prisma.feature.findUnique({
      where: { id: featureId },
      include: {
        planFeatures: {
          include: {
            plan: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!feature) {
      throw new NotFoundException('Feature not found');
    }

    return {
      success: true,
      data: feature
    };
  }

  async createFeature(userId: string, createFeatureDto: {
    key: string;
    name: string;
    description?: string;
  }) {
    // Check if feature key already exists
    const existingFeature = await this.prisma.feature.findUnique({
      where: { key: createFeatureDto.key }
    });

    if (existingFeature) {
      throw new BadRequestException('Feature key already exists');
    }

    const feature = await this.prisma.feature.create({
      data: {
        key: createFeatureDto.key,
        name: createFeatureDto.name,
        description: createFeatureDto.description,
        createdById: userId
      }
    });

    return {
      success: true,
      data: feature
    };
  }

  async updateFeature(featureId: string, updateFeatureDto: {
    key?: string;
    name?: string;
    description?: string;
    isActive?: boolean;
  }) {
    const existingFeature = await this.prisma.feature.findUnique({
      where: { id: featureId }
    });

    if (!existingFeature) {
      throw new NotFoundException('Feature not found');
    }

    // Check if new key already exists (if being updated)
    if (updateFeatureDto.key && updateFeatureDto.key !== existingFeature.key) {
      const keyExists = await this.prisma.feature.findUnique({
        where: { key: updateFeatureDto.key }
      });

      if (keyExists) {
        throw new BadRequestException('Feature key already exists');
      }
    }

    const feature = await this.prisma.feature.update({
      where: { id: featureId },
      data: updateFeatureDto
    });

    return {
      success: true,
      data: feature
    };
  }

  async deleteFeature(featureId: string) {
    const feature = await this.prisma.feature.findUnique({
      where: { id: featureId },
      include: {
        _count: {
          select: { planFeatures: true }
        }
      }
    });

    if (!feature) {
      throw new NotFoundException('Feature not found');
    }

    if (feature._count.planFeatures > 0) {
      throw new BadRequestException('Cannot delete feature that is used in plans');
    }

    await this.prisma.feature.delete({
      where: { id: featureId }
    });

    return {
      success: true,
      message: 'Feature deleted successfully'
    };
  }
}
