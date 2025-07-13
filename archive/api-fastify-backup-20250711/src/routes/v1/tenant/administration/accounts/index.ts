import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * Tenant Administration Accounts Routes
 * Manage all accounts within the tenant
 */
export const tenantAccountsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get accounts
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.accounts.read')],
    schema: {
      tags: ['tenant.accounts'],
      summary: 'Get tenant accounts',
      description: 'Get all accounts within the tenant',
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
            accounts: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              status: Type.String(),
              plan: Type.Optional(Type.Object({
                name: Type.String(),
                price: Type.Number(),
                currency: Type.String(),
              })),
              userCount: Type.Number(),
              lastActivity: Type.Optional(Type.String()),
              billingEmail: Type.Optional(Type.String()),
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
        const where: any = {
          tenantId: request.user!.tenantId,
        };

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { billingEmail: { contains: search, mode: 'insensitive' } },
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

        const [accounts, total] = await Promise.all([
          fastify.prisma.account.findMany({
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
                where: { tenantId: request.user.tenantId, status: { in: ['active', 'trialing'] } },
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
                  users: true,
                },
              },
              users: {
                orderBy: { lastLoginAt: 'desc' },
                take: 1,
                select: {
                  lastLoginAt: true,
                },
              },
            },
          }),
          fastify.prisma.account.count({ where }),
        ]);

        return {
          success: true,
          data: {
            accounts: accounts.map(account => ({
              uuid: account.uuid,
              name: account.name,
              status: account.status,
              plan: account.subscriptions[0]?.plan,
              userCount: account._count.users,
              lastActivity: account.users[0]?.lastLoginAt?.toISOString(),
              billingEmail: account.billingEmail,
              createdBy: account.createdBy,
              createdAt: account.createdAt.toISOString(),
              updatedAt: account.updatedAt.toISOString(),
            })),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get tenant accounts');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_TENANT_ACCOUNTS',
        });
      }
    },
  });

  // Get account details
  fastify.get('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.accounts.read')],
    schema: {
      tags: ['tenant.accounts'],
      summary: 'Get account details',
      description: 'Get detailed information about a specific account',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            account: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              status: Type.String(),
              billingEmail: Type.Optional(Type.String()),
              billingAddress: Type.Optional(Type.Object({}, { additionalProperties: true })),
              taxId: Type.Optional(Type.String()),
              logo: Type.Optional(Type.String()),
              metadata: Type.Object({}, { additionalProperties: true }),
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
              users: Type.Array(Type.Object({
                uuid: uuidSchema,
                name: Type.String(),
                email: Type.String(),
                status: Type.String(),
                lastLoginAt: Type.Optional(Type.String()),
                createdAt: Type.String(),
              })),
              usage: Type.Object({
                storage: Type.Number(),
                apiCalls: Type.Number(),
                bandwidth: Type.Number(),
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
        const account = await fastify.prisma.account.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
          },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            subscriptions: {
              where: { tenantId: request.user.tenantId, status: { in: ['active', 'trialing'] } },
              include: {
                plan: true,
              },
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
            users: {
              select: {
                id: true,
                uuid: true,
                name: true,
                email: true,
                status: true,
                lastLoginAt: true,
                createdAt: true,
              },
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (!account) {
          return reply.status(404).send({
            success: false,
            error: 'ACCOUNT_NOT_FOUND',
          });
        }

        // Get usage statistics
        const [storageUsage, apiUsage, bandwidthUsage] = await Promise.all([
          fastify.prisma.media.aggregate({
            where: { tenantId: request.user.tenantId, accountId: account.uuid as UUID },
            _sum: { size: true },
          }),
          fastify.prisma.apiUsage.count({
            where: { tenantId: request.user.tenantId, accountId: account.uuid as UUID,
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), },
            },
          }),
          // Mock bandwidth usage for now
          Promise.resolve({ _sum: { bytes: 1024 * 1024 * 500 } }),
        ]);

        return {
          success: true,
          data: {
            account: {
              uuid: account.uuid,
              name: account.name,
              status: account.status,
              billingEmail: account.billingEmail,
              billingAddress: account.billingAddress as any,
              taxId: account.taxId,
              logo: account.logo,
              metadata: account.metadata as any,
              subscription: account.subscriptions[0] ? {
                id: account.subscriptions[0].id,
                plan: {
                  name: account.subscriptions[0].plan.name,
                  price: account.subscriptions[0].plan.price,
                  currency: account.subscriptions[0].plan.currency,
                  features: account.subscriptions[0].plan.features,
                },
                status: account.subscriptions[0].status,
                currentPeriodStart: account.subscriptions[0].currentPeriodStart.toISOString(),
                currentPeriodEnd: account.subscriptions[0].currentPeriodEnd.toISOString(),
              } : undefined,
              users: account.users.map(user => ({
                uuid: user.uuid,
                name: user.name,
                email: user.email,
                status: user.status,
                lastLoginAt: user.lastLoginAt?.toISOString(),
                createdAt: user.createdAt.toISOString(),
              })),
              usage: {
                storage: storageUsage._sum.size || 0,
                apiCalls: apiUsage,
                bandwidth: bandwidthUsage._sum.bytes || 0,
              },
              createdBy: account.createdBy,
              createdAt: account.createdAt.toISOString(),
              updatedAt: account.updatedAt.toISOString(),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get account details');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_ACCOUNT_DETAILS',
        });
      }
    },
  });

  // Update account
  fastify.put('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.accounts.update')],
    schema: {
      tags: ['tenant.accounts'],
      summary: 'Update account',
      description: 'Update account information and settings',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String()),
        status: Type.Optional(Type.Union([
          Type.Literal('active'),
          Type.Literal('suspended'),
          Type.Literal('inactive'),
        ])),
        billingEmail: Type.Optional(Type.String({ format: 'email' })),
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
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
        const account = await fastify.prisma.account.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
          },
        });

        if (!account) {
          return reply.status(404).send({
            success: false,
            error: 'ACCOUNT_NOT_FOUND',
          });
        }

        await fastify.prisma.account.update({
          where: { tenantId: request.user.tenantId },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'Account updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update account');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_ACCOUNT',
        });
      }
    },
  });

  // Suspend account
  fastify.post('/:uuid/suspend', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.accounts.suspend')],
    schema: {
      tags: ['tenant.accounts'],
      summary: 'Suspend account',
      description: 'Suspend an account and all its users',
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
        const account = await fastify.prisma.account.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
          },
        });

        if (!account) {
          return reply.status(404).send({
            success: false,
            error: 'ACCOUNT_NOT_FOUND',
          });
        }

        // Update account status
        await fastify.prisma.account.update({
          where: { tenantId: request.user.tenantId },
          data: {
            status: 'suspended',
            metadata: {
              ...account.metadata,
              suspension: {
                reason,
                suspendedAt: new Date().toISOString(),
                suspendedBy: request.user!.id,
              },
            },
          },
        });

        // Suspend all users in the account
        await fastify.prisma.user.updateMany({
          where: { tenantId: request.user.tenantId, accountId: account.uuid as UUID },
          data: { status: 'suspended' },
        });

        // TODO: Send notification emails if notifyUsers is true

        return {
          success: true,
          data: {
            message: 'Account suspended successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to suspend account');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_SUSPEND_ACCOUNT',
        });
      }
    },
  });

  // Reactivate account
  fastify.post('/:uuid/reactivate', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.accounts.update')],
    schema: {
      tags: ['tenant.accounts'],
      summary: 'Reactivate account',
      description: 'Reactivate a suspended account',
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
        const account = await fastify.prisma.account.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
            status: 'suspended',
          },
        });

        if (!account) {
          return reply.status(404).send({
            success: false,
            error: 'SUSPENDED_ACCOUNT_NOT_FOUND',
          });
        }

        // Update account status
        await fastify.prisma.account.update({
          where: { tenantId: request.user.tenantId },
          data: {
            status: 'active',
            metadata: {
              ...account.metadata,
              reactivation: {
                reactivatedAt: new Date().toISOString(),
                reactivatedBy: request.user!.id,
              },
            },
          },
        });

        // Reactivate all users in the account
        await fastify.prisma.user.updateMany({
          where: { tenantId: request.user.tenantId, accountId: account.uuid as UUID,
            status: 'suspended', },
          data: { status: 'active' },
        });

        return {
          success: true,
          data: {
            message: 'Account reactivated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to reactivate account');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_REACTIVATE_ACCOUNT',
        });
      }
    },
  });

  // Delete account
  fastify.delete('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.accounts.delete')],
    schema: {
      tags: ['tenant.accounts'],
      summary: 'Delete account',
      description: 'Permanently delete an account and all its data',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        confirmDeletion: Type.Literal(true),
        transferDataTo: Type.Optional(Type.String()),
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
      const { confirmDeletion, transferDataTo } = request.body;

      try {
        const account = await fastify.prisma.account.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
          },
        });

        if (!account) {
          return reply.status(404).send({
            success: false,
            error: 'ACCOUNT_NOT_FOUND',
          });
        }

        // Check if there's an active subscription
        const activeSubscription = await fastify.prisma.subscription.findFirst({
          where: { tenantId: request.user.tenantId, accountId: account.uuid as UUID,
            status: { in: ['active', 'trialing'] },
          },
        });

        if (activeSubscription) {
          return reply.status(400).send({
            success: false,
            error: 'CANNOT_DELETE_ACCOUNT_WITH_ACTIVE_SUBSCRIPTION',
          });
        }

        // Handle data transfer if specified
        if (transferDataTo) {
          const targetAccount = await fastify.prisma.account.findFirst({
            where: {
              uuid: transferDataTo,
              tenantId: request.user!.tenantId,
            },
          });

          if (!targetAccount) {
            return reply.status(404).send({
              success: false,
              error: 'TARGET_ACCOUNT_FOR_DATA_TRANSFER_NOT_FOUND',
            });
          }

          // TODO: Implement data transfer logic
        }

        // Delete account (cascade will handle related data)
        await fastify.prisma.account.delete({
          where: { tenantId: request.user.tenantId },
        });

        return {
          success: true,
          data: {
            message: 'Account deleted successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to delete account');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_ACCOUNT',
        });
      }
    },
  });

  // Get account statistics
  fastify.get('/statistics', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.accounts.read')],
    schema: {
      tags: ['tenant.accounts'],
      summary: 'Get accounts statistics',
      description: 'Get statistical overview of all tenant accounts',
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
              topAccounts: Type.Array(Type.Object({
                name: Type.String(),
                userCount: Type.Number(),
                revenue: Type.Number(),
                lastActivity: Type.Optional(Type.String()),
              })),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const tenantId = request.user!.tenantId;
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Get basic counts
        const [total, active, suspended, inactive] = await Promise.all([
          fastify.prisma.account.count({
            where: { tenantId },
          }),
          fastify.prisma.account.count({
            where: { tenantId, status: 'active' },
          }),
          fastify.prisma.account.count({
            where: { tenantId, status: 'suspended' },
          }),
          fastify.prisma.account.count({
            where: { tenantId, status: 'inactive' },
          }),
        ]);

        // Get growth metrics
        const [thisMonth, lastMonth] = await Promise.all([
          fastify.prisma.account.count({
            where: {
              tenantId,
              createdAt: { gte: thisMonthStart },
            },
          }),
          fastify.prisma.account.count({
            where: {
              tenantId,
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

        // Get accounts by plan
        const byPlan = await fastify.prisma.subscription.groupBy({
          by: ['planId'],
          where: {
            account: { tenantId },
            status: { in: ['active', 'trialing'] },
          },
          _count: { planId: true },
          _sum: { amount: true },
        });

        const planStats = await Promise.all(
          byPlan.map(async (stat) => {
            const plan = await fastify.prisma.plan.findUnique({
              where: { tenantId: request.user.tenantId, id: stat.planId },
              select: { name: true },
            });
            return {
              planName: plan?.name || 'Unknown',
              count: stat._count.planId,
              revenue: stat._sum.amount || 0,
            };
          })
        );

        // Get top accounts
        const topAccounts = await fastify.prisma.account.findMany({
          where: { tenantId },
          include: {
            _count: {
              select: { users: true },
            },
            subscriptions: {
              where: { tenantId: request.user.tenantId, status: { in: ['active', 'trialing'] } },
              select: { amount: true },
              take: 1,
            },
            users: {
              orderBy: { lastLoginAt: 'desc' },
              take: 1,
              select: { lastLoginAt: true },
            },
          },
          orderBy: {
            users: {
              _count: 'desc',
            },
          },
          take: 5,
        });

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
              topAccounts: topAccounts.map(account => ({
                name: account.name,
                userCount: account._count.users,
                revenue: account.subscriptions[0]?.amount || 0,
                lastActivity: account.users[0]?.lastLoginAt?.toISOString(),
              })),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get account statistics');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_ACCOUNT_STATISTICS',
        });
      }
    },
  });
};