import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * Platform System Tenants Routes
 * Manage all tenants in the platform
 */
export const platformTenantsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get tenants
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.tenants.read')],
    schema: {
      tags: ['platform.tenants'],
      summary: 'Get platform tenants',
      description: 'Get all tenants in the platform',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
        plan: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tenants: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              subdomain: Type.String(),
              status: Type.String(),
              plan: Type.Optional(Type.Object({
                name: Type.String(),
                price: Type.Number(),
                currency: Type.String(),
              })),
              accountCount: Type.Number(),
              userCount: Type.Number(),
              storageUsed: Type.Number(),
              lastActivity: Type.Optional(Type.String()),
              billingContact: Type.Optional(Type.Object({
                name: Type.String(),
                email: Type.String(),
              })),
              createdBy: Type.Object({
                name: Type.String(),
                email: Type.String(),
              }),
              createdAt: Type.String(),
              updatedAt: Type.String(),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              totalPages: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { page = 1, limit = 20, search, status, plan } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {};

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { subdomain: { contains: search, mode: 'insensitive' } },
            { createdBy: { 
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }},
          ];
        }

        if (status) {
          where.status = status;
        }

        if (plan) {
          where.subscription = {
            some: {
              plan: { name: plan },
              status: { in: ['active', 'trialing'] },
            },
          };
        }

        const [tenants, total] = await Promise.all([
          fastify.prisma.tenant.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              subscriptions: {
                where: { status: { in: ['active', 'trialing'] } },
                include: {
                  plan: {
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      currency: true,
                    },
                  },
                },
                take: 1,
                orderBy: { createdAt: 'desc' },
              },
              _count: {
                select: {
                  accounts: true,
                },
              },
            },
          }),
          fastify.prisma.tenant.count({ where }),
        ]);

        // Get additional statistics for each tenant
        const tenantsWithStats = await Promise.all(
          tenants.map(async (tenant) => {
            const [userCount, storageUsed, lastActivity] = await Promise.all([
              fastify.prisma.user.count({
                where: { account: { tenantId: tenant.uuid as UUID } },
              }),
              fastify.prisma.media.aggregate({
                where: { account: { tenantId: tenant.uuid as UUID } },
                _sum: { size: true },
              }),
              fastify.prisma.user.findFirst({
                where: { account: { tenantId: tenant.uuid as UUID } },
                orderBy: { lastLoginAt: 'desc' },
                select: { lastLoginAt: true },
              }),
            ]);

            return {
              uuid: tenant.uuid,
              name: tenant.name,
              subdomain: tenant.subdomain,
              status: tenant.status,
              plan: tenant.subscriptions[0]?.plan,
              accountCount: tenant._count.accounts,
              userCount,
              storageUsed: storageUsed._sum.size || 0,
              lastActivity: lastActivity?.lastLoginAt?.toISOString(),
              billingContact: tenant.billingContact ? {
                name: (tenant.billingContact as any).name,
                email: (tenant.billingContact as any).email,
              } : undefined,
              createdBy: tenant.createdBy,
              createdAt: tenant.createdAt.toISOString(),
              updatedAt: tenant.updatedAt.toISOString(),
            };
          })
        );

        return {
          success: true,
          data: {
            tenants: tenantsWithStats,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get platform tenants');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_PLATFORM_TENANTS',
        });
      }
    },
  });

  // Create tenant
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.tenants.create')],
    schema: {
      tags: ['platform.tenants'],
      summary: 'Create tenant',
      description: 'Create a new tenant in the platform',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        subdomain: Type.String({ minLength: 1 }),
        description: Type.Optional(Type.String()),
        settings: Type.Optional(Type.Object({}, { additionalProperties: true })),
        billingContact: Type.Optional(Type.Object({
          name: Type.String(),
          email: Type.String({ format: 'email' }),
          phone: Type.Optional(Type.String()),
        })),
        planId: Type.Optional(Type.Number()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tenant: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              subdomain: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { name, subdomain, description, settings, billingContact, planId } = request.body;

      try {
        // Check if subdomain is already taken
        const existingTenant = await fastify.prisma.tenant.findFirst({
          where: { subdomain },
        });

        if (existingTenant) {
          return reply.status(400).send({
            success: false,
            error: 'SUBDOMAIN_IS_ALREADY_TAKEN',
          });
        }

        // Validate plan if provided
        let plan = null;
        if (planId) {
          plan = await fastify.prisma.plan.findUnique({
            where: { id: planId },
          });

          if (!plan) {
            return reply.status(400).send({
              success: false,
              error: 'INVALID_PLAN_ID',
            });
          }
        }

        const tenant = await fastify.prisma.tenant.create({
          data: {
            name,
            subdomain,
            description,
            status: 'active',
            settings: settings || {},
            billingContact: billingContact || {},
            createdById: request.user!.id,
          },
        });

        // Create subscription if plan is provided
        if (plan) {
          await fastify.prisma.subscription.create({
            data: {
              tenantId: tenant.uuid as UUID,
              planId: plan.uuid as UUID,
              status: 'trialing',
              amount: plan.price,
              currency: plan.currency,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
            },
          });
        }

        return reply.status(201).send({
          success: true,
          data: {
            tenant: {
              uuid: tenant.uuid,
              name: tenant.name,
              subdomain: tenant.subdomain,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to create tenant');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CREATE_TENANT',
        });
      }
    },
  });

  // Get tenant details
  fastify.get('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.tenants.read')],
    schema: {
      tags: ['platform.tenants'],
      summary: 'Get tenant details',
      description: 'Get detailed information about a specific tenant',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tenant: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              subdomain: Type.String(),
              description: Type.Optional(Type.String()),
              status: Type.String(),
              settings: Type.Object({}, { additionalProperties: true }),
              billingContact: Type.Object({}, { additionalProperties: true }),
              subscription: Type.Optional(Type.Object({
                plan: Type.Object({
                  name: Type.String(),
                  price: Type.Number(),
                  currency: Type.String(),
                  features: Type.Array(Type.String()),
                }),
                status: Type.String(),
                currentPeriodStart: Type.String(),
                currentPeriodEnd: Type.String(),
              })),
              accounts: Type.Array(Type.Object({
                uuid: uuidSchema,
                name: Type.String(),
                status: Type.String(),
                userCount: Type.Number(),
                createdAt: Type.String(),
              })),
              usage: Type.Object({
                accounts: Type.Number(),
                users: Type.Number(),
                storage: Type.Number(),
                apiCalls: Type.Number(),
              }),
              activity: Type.Object({
                lastLogin: Type.Optional(Type.String()),
                dailyActiveUsers: Type.Number(),
                monthlyActiveUsers: Type.Number(),
              }),
              createdBy: Type.Object({
                name: Type.String(),
                email: Type.String(),
              }),
              createdAt: Type.String(),
              updatedAt: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const tenant = await fastify.prisma.tenant.findFirst({
          where: { uuid },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            subscriptions: {
              where: { status: { in: ['active', 'trialing'] } },
              include: {
                plan: true,
              },
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
            accounts: {
              select: {
                id: true,
                uuid: true,
                name: true,
                status: true,
                createdAt: true,
                _count: {
                  select: {
                    users: true,
                  },
                },
              },
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (!tenant) {
          return reply.status(404).send({
            success: false,
            error: 'TENANT_NOT_FOUND',
          });
        }

        // Get usage statistics
        const [userCount, storageUsage, apiUsage, lastLogin, dailyActiveUsers, monthlyActiveUsers] = await Promise.all([
          fastify.prisma.user.count({
            where: { account: { tenantId: tenant.uuid as UUID } },
          }),
          fastify.prisma.media.aggregate({
            where: { account: { tenantId: tenant.uuid as UUID } },
            _sum: { size: true },
          }),
          fastify.prisma.apiUsage.count({
            where: {
              account: { tenantId: tenant.uuid as UUID },
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          }),
          fastify.prisma.user.findFirst({
            where: { account: { tenantId: tenant.uuid as UUID } },
            orderBy: { lastLoginAt: 'desc' },
            select: { lastLoginAt: true },
          }),
          fastify.prisma.user.count({
            where: {
              account: { tenantId: tenant.uuid as UUID },
              lastLoginAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            },
          }),
          fastify.prisma.user.count({
            where: {
              account: { tenantId: tenant.uuid as UUID },
              lastLoginAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          }),
        ]);

        return {
          success: true,
          data: {
            tenant: {
              uuid: tenant.uuid,
              name: tenant.name,
              subdomain: tenant.subdomain,
              description: tenant.description,
              status: tenant.status,
              settings: tenant.settings as any,
              billingContact: tenant.billingContact as any,
              subscription: tenant.subscriptions[0] ? {
                id: tenant.subscriptions[0].id,
                plan: {
                  name: tenant.subscriptions[0].plan.name,
                  price: tenant.subscriptions[0].plan.price,
                  currency: tenant.subscriptions[0].plan.currency,
                  features: tenant.subscriptions[0].plan.features,
                },
                status: tenant.subscriptions[0].status,
                currentPeriodStart: tenant.subscriptions[0].currentPeriodStart.toISOString(),
                currentPeriodEnd: tenant.subscriptions[0].currentPeriodEnd.toISOString(),
              } : undefined,
              accounts: tenant.accounts.map(account => ({
                uuid: account.uuid,
                name: account.name,
                status: account.status,
                userCount: account._count.users,
                createdAt: account.createdAt.toISOString(),
              })),
              usage: {
                accounts: tenant.accounts.length,
                users: userCount,
                storage: storageUsage._sum.size || 0,
                apiCalls: apiUsage,
              },
              activity: {
                lastLogin: lastLogin?.lastLoginAt?.toISOString(),
                dailyActiveUsers,
                monthlyActiveUsers,
              },
              createdBy: tenant.createdBy,
              createdAt: tenant.createdAt.toISOString(),
              updatedAt: tenant.updatedAt.toISOString(),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get tenant details');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_TENANT_DETAILS',
        });
      }
    },
  });

  // Update tenant
  fastify.put('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.tenants.update')],
    schema: {
      tags: ['platform.tenants'],
      summary: 'Update tenant',
      description: 'Update tenant information and settings',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String()),
        description: Type.Optional(Type.String()),
        status: Type.Optional(Type.Union([
          Type.Literal('active'),
          Type.Literal('suspended'),
          Type.Literal('inactive'),
        ])),
        settings: Type.Optional(Type.Object({}, { additionalProperties: true })),
        billingContact: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const updates = request.body;

      try {
        const tenant = await fastify.prisma.tenant.findFirst({
          where: { uuid },
        });

        if (!tenant) {
          return reply.status(404).send({
            success: false,
            error: 'TENANT_NOT_FOUND',
          });
        }

        await fastify.prisma.tenant.update({
          where: { },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'Tenant updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update tenant');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_TENANT',
        });
      }
    },
  });

  // Suspend tenant
  fastify.post('/:uuid/suspend', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.tenants.suspend')],
    schema: {
      tags: ['platform.tenants'],
      summary: 'Suspend tenant',
      description: 'Suspend a tenant and all its accounts/users',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        reason: Type.String(),
        notifyUsers: Type.Optional(Type.Boolean({ default: true })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { reason, notifyUsers } = request.body;

      try {
        const tenant = await fastify.prisma.tenant.findFirst({
          where: { uuid },
        });

        if (!tenant) {
          return reply.status(404).send({
            success: false,
            error: 'TENANT_NOT_FOUND',
          });
        }

        // Update tenant status
        await fastify.prisma.tenant.update({
          where: { },
          data: {
            status: 'suspended',
            settings: {
              ...tenant.settings,
              suspension: {
                reason,
                suspendedAt: new Date().toISOString(),
                suspendedBy: request.user!.id,
              },
            },
          },
        });

        // Suspend all accounts in the tenant
        await fastify.prisma.account.updateMany({
          where: { tenantId: tenant.uuid as UUID },
          data: { status: 'suspended' },
        });

        // Suspend all users in the tenant
        await fastify.prisma.user.updateMany({
          where: { account: { tenantId: tenant.uuid as UUID } },
          data: { status: 'suspended' },
        });

        // TODO: Send notification emails if notifyUsers is true

        return {
          success: true,
          data: {
            message: 'Tenant suspended successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to suspend tenant');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_SUSPEND_TENANT',
        });
      }
    },
  });

  // Reactivate tenant
  fastify.post('/:uuid/reactivate', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.tenants.update')],
    schema: {
      tags: ['platform.tenants'],
      summary: 'Reactivate tenant',
      description: 'Reactivate a suspended tenant',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const tenant = await fastify.prisma.tenant.findFirst({
          where: {
            uuid,
            status: 'suspended',
          },
        });

        if (!tenant) {
          return reply.status(404).send({
            success: false,
            error: 'SUSPENDED_TENANT_NOT_FOUND',
          });
        }

        // Update tenant status
        await fastify.prisma.tenant.update({
          where: { },
          data: {
            status: 'active',
            settings: {
              ...tenant.settings,
              reactivation: {
                reactivatedAt: new Date().toISOString(),
                reactivatedBy: request.user!.id,
              },
            },
          },
        });

        // Reactivate all accounts in the tenant
        await fastify.prisma.account.updateMany({
          where: { 
            tenantId: tenant.uuid as UUID,
            status: 'suspended',
          },
          data: { status: 'active' },
        });

        // Reactivate all users in the tenant
        await fastify.prisma.user.updateMany({
          where: { 
            account: { tenantId: tenant.uuid as UUID },
            status: 'suspended',
          },
          data: { status: 'active' },
        });

        return {
          success: true,
          data: {
            message: 'Tenant reactivated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to reactivate tenant');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_REACTIVATE_TENANT',
        });
      }
    },
  });

  // Delete tenant
  fastify.delete('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.tenants.delete')],
    schema: {
      tags: ['platform.tenants'],
      summary: 'Delete tenant',
      description: 'Permanently delete a tenant and all its data',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        confirmDeletion: Type.Literal(true),
        backupData: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { confirmDeletion, backupData } = request.body;

      try {
        const tenant = await fastify.prisma.tenant.findFirst({
          where: { uuid },
        });

        if (!tenant) {
          return reply.status(404).send({
            success: false,
            error: 'TENANT_NOT_FOUND',
          });
        }

        // Check if there are active subscriptions
        const activeSubscription = await fastify.prisma.subscription.findFirst({
          where: {
            tenantId: tenant.uuid as UUID,
            status: { in: ['active', 'trialing'] },
          },
        });

        if (activeSubscription) {
          return reply.status(400).send({
            success: false,
            error: 'CANNOT_DELETE_TENANT_WITH_ACTIVE_SUBSCRIPTION',
          });
        }

        // TODO: Create backup if requested
        if (backupData) {
          // Implement backup logic
        }

        // Delete tenant (cascade will handle related data)
        await fastify.prisma.tenant.delete({
          where: { },
        });

        return {
          success: true,
          data: {
            message: 'Tenant deleted successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to delete tenant');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_TENANT',
        });
      }
    },
  });

  // Get tenant statistics
  fastify.get('/statistics', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.tenants.read')],
    schema: {
      tags: ['platform.tenants'],
      summary: 'Get tenant statistics',
      description: 'Get statistical overview of all platform tenants',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            statistics: Type.Object({
              total: Type.Number(),
              active: Type.Number(),
              suspended: Type.Number(),
              inactive: Type.Number(),
              growth: Type.Object({
                thisMonth: Type.Number(),
                lastMonth: Type.Number(),
                percentage: Type.Number(),
              }),
              byPlan: Type.Array(Type.Object({
                planName: Type.String(),
                count: Type.Number(),
                revenue: Type.Number(),
              })),
              topTenants: Type.Array(Type.Object({
                name: Type.String(),
                accountCount: Type.Number(),
                userCount: Type.Number(),
                revenue: Type.Number(),
                lastActivity: Type.Optional(Type.String()),
              })),
              resources: Type.Object({
                totalAccounts: Type.Number(),
                totalUsers: Type.Number(),
                totalStorage: Type.Number(),
              }),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Get basic counts
        const [total, active, suspended, inactive] = await Promise.all([
          fastify.prisma.tenant.count(),
          fastify.prisma.tenant.count({ where: { status: 'active' } }),
          fastify.prisma.tenant.count({ where: { status: 'suspended' } }),
          fastify.prisma.tenant.count({ where: { status: 'inactive' } }),
        ]);

        // Get growth metrics
        const [thisMonth, lastMonth] = await Promise.all([
          fastify.prisma.tenant.count({
            where: { createdAt: { gte: thisMonthStart } },
          }),
          fastify.prisma.tenant.count({
            where: {
              createdAt: {
                gte: lastMonthStart,
                lt: thisMonthStart,
              },
            },
          }),
        ]);

        const growthPercentage = lastMonth > 0 
          ? ((thisMonth - lastMonth) / lastMonth) * 100 
          : 0;

        // Get tenants by plan
        const byPlan = await fastify.prisma.subscription.groupBy({
          by: ['planId'],
          where: { status: { in: ['active', 'trialing'] } },
          _count: { planId: true },
          _sum: { amount: true },
        });

        const planStats = await Promise.all(
          byPlan.map(async (stat) => {
            const plan = await fastify.prisma.plan.findUnique({
              where: { id: stat.planId },
              select: { name: true },
            });
            return {
              planName: plan?.name || 'Unknown',
              count: stat._count.planId,
              revenue: stat._sum.amount || 0,
            };
          })
        );

        // Get top tenants
        const topTenants = await fastify.prisma.tenant.findMany({
          include: {
            _count: {
              select: { accounts: true },
            },
            subscriptions: {
              where: { status: { in: ['active', 'trialing'] } },
              select: { amount: true },
              take: 1,
            },
          },
          orderBy: {
            accounts: {
              _count: 'desc',
            },
          },
          take: 5,
        });

        // Get tenant usage statistics with user counts
        const tenantsWithUserCounts = await Promise.all(
          topTenants.map(async (tenant) => {
            const [userCount, lastActivity] = await Promise.all([
              fastify.prisma.user.count({
                where: { account: { tenantId: tenant.uuid as UUID } },
              }),
              fastify.prisma.user.findFirst({
                where: { account: { tenantId: tenant.uuid as UUID } },
                orderBy: { lastLoginAt: 'desc' },
                select: { lastLoginAt: true },
              }),
            ]);

            return {
              name: tenant.name,
              accountCount: tenant._count.accounts,
              userCount,
              revenue: tenant.subscriptions[0]?.amount || 0,
              lastActivity: lastActivity?.lastLoginAt?.toISOString(),
            };
          })
        );

        // Get resource totals
        const [totalAccounts, totalUsers, totalStorage] = await Promise.all([
          fastify.prisma.account.count(),
          fastify.prisma.user.count(),
          fastify.prisma.media.aggregate({
            _sum: { size: true },
          }),
        ]);

        return {
          success: true,
          data: {
            statistics: {
              total,
              active,
              suspended,
              inactive,
              growth: {
                thisMonth,
                lastMonth,
                percentage: growthPercentage,
              },
              byPlan: planStats,
              topTenants: tenantsWithUserCounts,
              resources: {
                totalAccounts,
                totalUsers,
                totalStorage: totalStorage._sum.size || 0,
              },
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get tenant statistics');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_TENANT_STATISTICS',
        });
      }
    },
  });
};