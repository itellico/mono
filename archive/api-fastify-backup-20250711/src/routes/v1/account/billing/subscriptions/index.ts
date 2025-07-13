import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * Account Billing Subscriptions Routes
 * Manage account subscriptions
 */
export const accountSubscriptionsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get current subscription
  fastify.get('/current', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.billing.read')],
    schema: {
      tags: ['account.billing'],
      summary: 'Get current subscription',
      description: 'Get the current active subscription for the account',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            subscription: Type.Union([
              Type.Object({
                uuid: uuidSchema,
                plan: Type.Object({
                  name: Type.String(),
                  description: Type.String(),
                  price: Type.Number(),
                  currency: Type.String(),
                  interval: Type.String(),
                  features: Type.Array(Type.String()),
                  limits: Type.Object({}, { additionalProperties: true }),
                }),
                status: Type.String(),
                currentPeriodStart: Type.String(),
                currentPeriodEnd: Type.String(),
                cancelAtPeriodEnd: Type.Boolean(),
                trialEndDate: Type.Optional(Type.String()),
                usage: Type.Object({
                  users: Type.Object({
                    current: Type.Number(),
                    limit: Type.Number(),
                  }),
                  storage: Type.Object({
                    current: Type.Number(),
                    limit: Type.Number(),
                    unit: Type.String(),
                  }),
                  apiCalls: Type.Object({
                    current: Type.Number(),
                    limit: Type.Number(),
                    period: Type.String(),
                  }),
                }),
                paymentMethod: Type.Object({
                  type: Type.String(),
                  last4: Type.String(),
                  brand: Type.Optional(Type.String()),
                }),
                createdAt: Type.String(),
                updatedAt: Type.String(),
              }),
              Type.Null(),
            ]),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const subscription = await fastify.prisma.subscription.findFirst({
          where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
            status: { in: ['active', 'trialing'] },
          },
          include: {
            plan: true,
            paymentMethod: {
              select: {
                type: true,
                last4: true,
                brand: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!subscription) {
          return {
            success: true,
            data: {
              subscription: null,
            },
          };
        }

        // Get current usage
        const [userCount, storageUsed, apiCallsThisMonth] = await Promise.all([
          fastify.prisma.user.count({
            where: { tenantId: request.user.tenantId, accountId: request.user!.accountId },
          }),
          fastify.prisma.media.aggregate({
            where: { tenantId: request.user.tenantId, accountId: request.user!.accountId },
            _sum: { size: true },
          }),
          fastify.prisma.apiUsage.aggregate({
            where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
              createdAt: {
                gte: new Date(subscription.currentPeriodStart), },
            },
            _sum: { count: true },
          }),
        ]);

        return {
          success: true,
          data: {
            subscription: {
              uuid: subscription.uuid,
              plan: {
                id: subscription.plan.uuid as UUID,
                name: subscription.plan.name,
                description: subscription.plan.description || '',
                price: subscription.plan.price,
                currency: subscription.plan.currency,
                interval: subscription.plan.interval,
                features: subscription.plan.features,
                limits: subscription.plan.limits,
              },
              status: subscription.status,
              currentPeriodStart: subscription.currentPeriodStart.toISOString(),
              currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              trialEndDate: subscription.trialEndDate?.toISOString(),
              usage: {
                users: {
                  current: userCount,
                  limit: (subscription.plan.limits as any)?.users || 5,
                },
                storage: {
                  current: storageUsed._sum.size || 0,
                  limit: (subscription.plan.limits as any)?.storage || 5368709120, // 5GB
                  unit: 'bytes',
                },
                apiCalls: {
                  current: apiCallsThisMonth._sum.count || 0,
                  limit: (subscription.plan.limits as any)?.apiCalls || 10000,
                  period: 'month',
                },
              },
              paymentMethod: subscription.paymentMethod,
              createdAt: subscription.createdAt.toISOString(),
              updatedAt: subscription.updatedAt.toISOString(),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get current subscription');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_CURRENT_SUBSCRIPTION',
        });
      }
    },
  });

  // Get available plans
  fastify.get('/plans', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('account.billing.subscriptions.read')
    ],
    schema: {
      tags: ['account.billing'],
      summary: 'Get available plans',
      description: 'Get all available subscription plans',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            plans: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              description: Type.String(),
              price: Type.Number(),
              currency: Type.String(),
              interval: Type.String(),
              features: Type.Array(Type.String()),
              limits: Type.Object({}, { additionalProperties: true }),
              popularBadge: Type.Optional(Type.Boolean()),
              trialDays: Type.Number(),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const plans = await fastify.prisma.plan.findMany({
          where: {
            isActive: true,
            tenantId: request.user!.tenantId,
          },
          orderBy: { sortOrder: 'asc' },
        });

        return {
          success: true,
          data: {
            plans: plans.map(plan => ({
              uuid: plan.uuid,
              name: plan.name,
              description: plan.description || '',
              price: plan.price,
              currency: plan.currency,
              interval: plan.interval,
              features: plan.features,
              limits: plan.limits,
              popularBadge: plan.metadata?.popular === true,
              trialDays: plan.trialDays || 0,
            })),
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get available plans');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_AVAILABLE_PLANS',
        });
      }
    },
  });

  // Subscribe to plan
  fastify.post('/subscribe', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.billing.update')],
    schema: {
      tags: ['account.billing'],
      summary: 'Subscribe to plan',
      description: 'Subscribe to a new plan or upgrade existing subscription',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        planId: Type.Number(),
        paymentMethodId: Type.Optional(Type.Number()),
        startTrial: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            subscription: Type.Object({
              uuid: uuidSchema,
              status: Type.String(),
              requiresPaymentMethod: Type.Boolean(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { planId, paymentMethodId, startTrial } = request.body;

      try {
        // Check if already has active subscription
        const existingSubscription = await fastify.prisma.subscription.findFirst({
          where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
            status: { in: ['active', 'trialing'] },
          },
        });

        if (existingSubscription) {
          return reply.status(400).send({
            success: false,
            error: 'ACCOUNT_ALREADY_HAS_AN_ACTIVE_SUBSCRIPTION',
          });
        }

        // Get plan details
        const plan = await fastify.prisma.plan.findUnique({
          where: { tenantId: request.user.tenantId, id: planId },
        });

        if (!plan || !plan.isActive) {
          return reply.status(404).send({
            success: false,
            error: 'PLAN_NOT_FOUND',
          });
        }

        // Check if payment method is required
        const requiresPayment = plan.price > 0 && (!startTrial || plan.trialDays === 0);
        
        if (requiresPayment && !paymentMethodId) {
          return reply.status(400).send({
            success: false,
            error: 'PAYMENT_METHOD_REQUIRED_FOR_THIS_PLAN',
          });
        }

        // Verify payment method if provided
        if (paymentMethodId) {
          const paymentMethod = await fastify.prisma.paymentMethod.findFirst({
            where: { tenantId: request.user.tenantId, id: paymentMethodId,
              accountId: request.user!.accountId, },
          });

          if (!paymentMethod) {
            return reply.status(404).send({
              success: false,
              error: 'PAYMENT_METHOD_NOT_FOUND',
            });
          }
        }

        // Calculate billing dates
        const now = new Date();
        const trialEnd = startTrial && plan.trialDays > 0
          ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
          : null;
        
        const currentPeriodStart = now;
        const currentPeriodEnd = new Date(now);
        if (plan.interval === 'month') {
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        } else if (plan.interval === 'year') {
          currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
        }

        // Create subscription
        const subscription = await fastify.prisma.subscription.create({
          data: {
            accountId: request.user!.accountId,
            planId: plan.uuid as UUID,
            status: trialEnd ? 'trialing' : 'active',
            currentPeriodStart,
            currentPeriodEnd,
            trialEndDate: trialEnd,
            paymentMethodId,
            metadata: {
              subscribedBy: request.user!.id,
              subscribedAt: now.toISOString(),
            },
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            subscription: {
              uuid: subscription.uuid,
              status: subscription.status,
              requiresPaymentMethod: requiresPayment && !paymentMethodId,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to subscribe to plan');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_SUBSCRIBE_TO_PLAN',
        });
      }
    },
  });

  // Update subscription
  fastify.put('/current', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.billing.update')],
    schema: {
      tags: ['account.billing'],
      summary: 'Update subscription',
      description: 'Update current subscription (upgrade/downgrade)',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        planId: Type.Optional(Type.Number()),
        paymentMethodId: Type.Optional(Type.Number()),
        cancelAtPeriodEnd: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            effectiveDate: Type.Optional(Type.String()),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { planId, paymentMethodId, cancelAtPeriodEnd } = request.body;

      try {
        const subscription = await fastify.prisma.subscription.findFirst({
          where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
            status: { in: ['active', 'trialing'] },
          },
          include: {
            plan: true,
          },
        });

        if (!subscription) {
          return reply.status(404).send({
            success: false,
            error: 'NO_ACTIVE_SUBSCRIPTION_FOUND',
          });
        }

        const updates: any = {};

        // Handle plan change
        if (planId && planId !== subscription.planId) {
          const newPlan = await fastify.prisma.plan.findUnique({
            where: { tenantId: request.user.tenantId, id: planId },
          });

          if (!newPlan || !newPlan.isActive) {
            return reply.status(404).send({
              success: false,
              error: 'NEW_PLAN_NOT_FOUND',
            });
          }

          // Schedule plan change for end of current period
          updates.nextPlanId = planId;
          updates.metadata = {
            ...subscription.metadata,
            planChangeScheduled: {
              from: subscription.plan.name,
              to: newPlan.name,
              effectiveDate: subscription.currentPeriodEnd.toISOString(),
            },
          };
        }

        // Handle payment method change
        if (paymentMethodId) {
          const paymentMethod = await fastify.prisma.paymentMethod.findFirst({
            where: { tenantId: request.user.tenantId, id: paymentMethodId,
              accountId: request.user!.accountId, },
          });

          if (!paymentMethod) {
            return reply.status(404).send({
              success: false,
              error: 'PAYMENT_METHOD_NOT_FOUND',
            });
          }

          updates.paymentMethodId = paymentMethodId;
        }

        // Handle cancellation
        if (cancelAtPeriodEnd !== undefined) {
          updates.cancelAtPeriodEnd = cancelAtPeriodEnd;
          
          if (cancelAtPeriodEnd) {
            updates.metadata = {
              ...subscription.metadata,
              cancellationScheduled: {
                requestedAt: new Date().toISOString(),
                requestedBy: request.user!.id,
                effectiveDate: subscription.currentPeriodEnd.toISOString(),
              },
            };
          } else {
            // Remove cancellation
            const metadata = { ...subscription.metadata };
            delete metadata.cancellationScheduled;
            updates.metadata = metadata;
          }
        }

        await fastify.prisma.subscription.update({
          where: { tenantId: request.user.tenantId },
          data: updates,
        });

        let message = 'Subscription updated successfully';
        let effectiveDate;

        if (planId && planId !== subscription.planId) {
          message = 'Plan change scheduled for end of billing period';
          effectiveDate = subscription.currentPeriodEnd.toISOString();
        } else if (cancelAtPeriodEnd === true) {
          message = 'Subscription scheduled for cancellation';
          effectiveDate = subscription.currentPeriodEnd.toISOString();
        } else if (cancelAtPeriodEnd === false) {
          message = 'Subscription cancellation removed';
        }

        return {
          success: true,
          data: {
            message,
            effectiveDate,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update subscription');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_SUBSCRIPTION',
        });
      }
    },
  });

  // Get subscription history
  fastify.get('/history', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.billing.read')],
    schema: {
      tags: ['account.billing'],
      summary: 'Get subscription history',
      description: 'Get all past and current subscriptions',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            subscriptions: Type.Array(Type.Object({
              uuid: uuidSchema,
              plan: Type.Object({
                name: Type.String(),
                price: Type.Number(),
                currency: Type.String(),
                interval: Type.String(),
              }),
              status: Type.String(),
              startDate: Type.String(),
              endDate: Type.Optional(Type.String()),
              cancelledAt: Type.Optional(Type.String()),
              totalPaid: Type.Optional(Type.Number()),
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
      const { page = 1, limit = 20 } = request.query;
      const offset = (page - 1) * limit;

      try {
        const [subscriptions, total] = await Promise.all([
          fastify.prisma.subscription.findMany({
            where: { tenantId: request.user.tenantId, accountId: request.user!.accountId, },
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              plan: {
                select: {
                  name: true,
                  price: true,
                  currency: true,
                  interval: true,
                },
              },
              _count: {
                select: {
                  invoices: {
                    where: { tenantId: request.user.tenantId, status: 'paid' },
                  },
                },
              },
              invoices: {
                where: { tenantId: request.user.tenantId, status: 'paid' },
                select: {
                  total: true,
                },
              },
            },
          }),
          fastify.prisma.subscription.count({
            where: { tenantId: request.user.tenantId, accountId: request.user!.accountId, },
          }),
        ]);

        return {
          success: true,
          data: {
            subscriptions: subscriptions.map(sub => ({
              uuid: sub.uuid,
              plan: sub.plan,
              status: sub.status,
              startDate: sub.createdAt.toISOString(),
              endDate: sub.endedAt?.toISOString(),
              cancelledAt: sub.cancelledAt?.toISOString(),
              totalPaid: sub.invoices.reduce((sum, inv) => sum + inv.total, 0),
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
        request.log.error({ error }, 'Failed to get subscription history');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_SUBSCRIPTION_HISTORY',
        });
      }
    },
  });

  // Cancel subscription immediately
  fastify.delete('/current', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.billing.delete')],
    schema: {
      tags: ['account.billing'],
      summary: 'Cancel subscription immediately',
      description: 'Cancel the current subscription immediately (no refund)',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        reason: Type.Optional(Type.String()),
        feedback: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            endDate: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { reason, feedback } = request.body;

      try {
        const subscription = await fastify.prisma.subscription.findFirst({
          where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
            status: { in: ['active', 'trialing'] },
          },
        });

        if (!subscription) {
          return reply.status(404).send({
            success: false,
            error: 'NO_ACTIVE_SUBSCRIPTION_FOUND',
          });
        }

        const now = new Date();

        await fastify.prisma.subscription.update({
          where: { tenantId: request.user.tenantId },
          data: {
            status: 'cancelled',
            cancelledAt: now,
            endedAt: now,
            metadata: {
              ...subscription.metadata,
              cancellation: {
                reason,
                feedback,
                cancelledBy: request.user!.id,
                cancelledAt: now.toISOString(),
              },
            },
          },
        });

        // TODO: Handle any cleanup (disable features, notify user, etc.)

        return {
          success: true,
          data: {
            message: 'Subscription cancelled successfully',
            endDate: now.toISOString(),
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to cancel subscription');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CANCEL_SUBSCRIPTION',
        });
      }
    },
  });
};