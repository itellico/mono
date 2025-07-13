import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { logger } from '@/lib/logger';
import { AuditService } from '@/lib/services/audit.service';
import { type SubscriptionPlan, type PlatformFeature, type FeatureLimit } from '@prisma/client';

export class SubscriptionService {
  private static instance: SubscriptionService;

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await prisma.subscriptionPlan.findMany();
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | null> {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: id },
    });
    return plan;
  }

  async getSubscriptions(filters: any, pagination: { limit: number; offset: number }) {
    const whereConditions: any = {};

    if (filters.tenantId !== undefined && filters.tenantId !== null) {
      whereConditions.tenantId = filters.tenantId;
    }
    if (filters.subscriptionType) {
      whereConditions.subscriptionType = filters.subscriptionType;
    }
    if (filters.isActive !== undefined) {
      whereConditions.isActive = filters.isActive;
    }
    if (filters.search) {
      whereConditions.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const subscriptions = await prisma.subscriptionPlan.findMany({
      where: whereConditions,
      orderBy: { createdAt: 'desc' },
      take: pagination.limit,
      skip: pagination.offset,
    });

    const total = await prisma.subscriptionPlan.count({
      where: whereConditions,
    });

    return { subscriptions, total };
  }

  async createSubscription(planData: any): Promise<SubscriptionPlan> {
    const newPlan = await prisma.subscriptionPlan.create({
      data: planData,
    });

    // Audit logging
    await AuditService.logEntityChange(
      0, // tenantId (assuming global for platform plans)
      'subscription_plan',
      newPlan.id,
      'create',
      0, // TODO: Replace with actual userId
      null,
      newPlan,
      { name: newPlan.name, type: newPlan.planType }
    );

    return newPlan;
  }

  async updateSubscriptionPlan(id: string, plan: any): Promise<SubscriptionPlan> {
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: id },
    });

    if (!existingPlan) {
      throw new Error('Subscription plan not found');
    }

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id: id },
      data: plan,
    });

    // Audit logging
    await AuditService.logEntityChange(
      0, // tenantId (assuming global for platform plans)
      'subscription_plan',
      updatedPlan.id,
      'update',
      0, // TODO: Replace with actual userId
      existingPlan,
      updatedPlan,
      { name: updatedPlan.name, type: updatedPlan.planType } // context
    );

    return updatedPlan;
  }

  async deleteSubscriptionPlan(id: string): Promise<SubscriptionPlan> {
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: id },
    });

    if (!existingPlan) {
      throw new Error('Subscription plan not found');
    }

    const deletedPlan = await prisma.subscriptionPlan.delete({
      where: { id: id },
    });

    // Audit logging
    await AuditService.logEntityChange(
      0, // tenantId (assuming global for platform plans)
      'subscription_plan',
      deletedPlan.id,
      'delete',
      0, // TODO: Replace with actual userId
      existingPlan,
      null,
      { name: existingPlan.name, type: existingPlan.planType } // context
    );

    return deletedPlan;
  }

  async getPlatformFeatures(): Promise<PlatformFeature[]> {
    return await prisma.platformFeature.findMany();
  }

  async getFeatureLimits(): Promise<FeatureLimit[]> {
    return await prisma.featureLimit.findMany();
  }
}

export const subscriptionService = SubscriptionService.getInstance();