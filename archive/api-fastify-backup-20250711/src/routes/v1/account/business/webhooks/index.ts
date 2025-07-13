import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import crypto from 'crypto';

/**
 * Account Business Webhooks Routes
 * Manage webhook endpoints
 */
export const accountWebhooksRoutes: FastifyPluginAsync = async (fastify) => {
  // Get webhooks
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.webhooks.read')],
    schema: {
      tags: ['account.business'],
      summary: 'Get webhooks',
      description: 'Get all configured webhooks for the account',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        event: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            webhooks: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              url: Type.String(),
              events: Type.Array(Type.String()),
              status: Type.String(),
              secret: Type.String(),
              headers: Type.Optional(Type.Object({}, { additionalProperties: true })),
              retryConfig: Type.Object({
                maxRetries: Type.Number(),
                retryDelay: Type.Number(),
              }),
              lastTriggeredAt: Type.Optional(Type.String()),
              successCount: Type.Number(),
              failureCount: Type.Number(),
              createdBy: Type.Object({
                name: Type.String(),
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
      const { page = 1, limit = 20, search, event, status } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          accountId: request.user!.accountId,
        };

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { url: { contains: search, mode: 'insensitive' } },
          ];
        }

        if (event) {
          where.events = {
            has: event,
          };
        }

        if (status) {
          where.status = status;
        }

        const [webhooks, total] = await Promise.all([
          fastify.prisma.webhook.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
              _count: {
                select: {
                  deliveries: {
                    where: { tenantId: request.user.tenantId, status: 'success' },
                  },
                  failures: {
                    where: { tenantId: request.user.tenantId, status: 'failed' },
                  },
                },
              },
              deliveries: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  createdAt: true,
                },
              },
            },
          }),
          fastify.prisma.webhook.count({ where }),
        ]);

        return {
          success: true,
          data: {
            webhooks: webhooks.map(webhook => ({
              uuid: webhook.uuid,
              name: webhook.name,
              url: webhook.url,
              events: webhook.events,
              status: webhook.status,
              secret: webhook.secret,
              headers: webhook.headers,
              retryConfig: webhook.retryConfig as any,
              lastTriggeredAt: webhook.deliveries[0]?.createdAt.toISOString(),
              successCount: webhook._count.deliveries,
              failureCount: webhook._count.failures,
              createdBy: webhook.createdBy,
              createdAt: webhook.createdAt.toISOString(),
              updatedAt: webhook.updatedAt.toISOString(),
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
        request.log.error({ error }, 'Failed to get webhooks');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_WEBHOOKS',
        });
      }
    },
  });

  // Get available events
  fastify.get('/events', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.webhooks.read')],
    schema: {
      tags: ['account.business'],
      summary: 'Get available events',
      description: 'Get list of webhook events that can be subscribed to',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            events: Type.Array(Type.Object({
              id: Type.String(),
              name: Type.String(),
              description: Type.String(),
              category: Type.String(),
              samplePayload: Type.Object({}, { additionalProperties: true }),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const events = [
          {
            id: 'user.created',
            name: 'User Created',
            description: 'Triggered when a new user is created in the account',
            category: 'users',
            samplePayload: {
              event: 'user.created',
              timestamp: '2024-01-01T00:00:00Z',
              data: {
                userId: 123,
                email: 'user@example.com',
                name: 'John Doe',
              },
            },
          },
          {
            id: 'user.updated',
            name: 'User Updated',
            description: 'Triggered when user information is updated',
            category: 'users',
            samplePayload: {
              event: 'user.updated',
              timestamp: '2024-01-01T00:00:00Z',
              data: {
                userId: 123,
                changes: {
                  name: { old: 'John Doe', new: 'Jane Doe' },
                },
              },
            },
          },
          {
            id: 'user.deleted',
            name: 'User Deleted',
            description: 'Triggered when a user is removed from the account',
            category: 'users',
            samplePayload: {
              event: 'user.deleted',
              timestamp: '2024-01-01T00:00:00Z',
              data: {
                userId: 123,
                deletedAt: '2024-01-01T00:00:00Z',
              },
            },
          },
          {
            id: 'content.published',
            name: 'Content Published',
            description: 'Triggered when content is published',
            category: 'content',
            samplePayload: {
              event: 'content.published',
              timestamp: '2024-01-01T00:00:00Z',
              data: {
                contentId: 456,
                type: 'article',
                title: 'New Article',
                publishedBy: 123,
              },
            },
          },
          {
            id: 'form.submitted',
            name: 'Form Submitted',
            description: 'Triggered when a form is submitted',
            category: 'forms',
            samplePayload: {
              event: 'form.submitted',
              timestamp: '2024-01-01T00:00:00Z',
              data: {
                formId: 789,
                submissionId: 'sub_123',
                formData: {},
              },
            },
          },
          {
            id: 'workflow.completed',
            name: 'Workflow Completed',
            description: 'Triggered when a workflow execution completes',
            category: 'workflows',
            samplePayload: {
              event: 'workflow.completed',
              timestamp: '2024-01-01T00:00:00Z',
              data: {
                workflowId: 101,
                executionId: 'exec_123',
                status: 'success',
                duration: 5000,
              },
            },
          },
          {
            id: 'payment.received',
            name: 'Payment Received',
            description: 'Triggered when a payment is received',
            category: 'billing',
            samplePayload: {
              event: 'payment.received',
              timestamp: '2024-01-01T00:00:00Z',
              data: {
                paymentId: 'pay_123',
                amount: 9900,
                currency: 'USD',
                customerId: 123,
              },
            },
          },
          {
            id: 'subscription.created',
            name: 'Subscription Created',
            description: 'Triggered when a new subscription is created',
            category: 'billing',
            samplePayload: {
              event: 'subscription.created',
              timestamp: '2024-01-01T00:00:00Z',
              data: {
                subscriptionId: 'sub_123',
                planId: 'plan_pro',
                customerId: 123,
              },
            },
          },
        ];

        return {
          success: true,
          data: {
            events,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get events');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_EVENTS',
        });
      }
    },
  });

  // Create webhook
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.webhooks.create')],
    schema: {
      tags: ['account.business'],
      summary: 'Create webhook',
      description: 'Create a new webhook endpoint',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        url: Type.String({ format: 'uri' }),
        events: Type.Array(Type.String(), { minItems: 1 }),
        headers: Type.Optional(Type.Object({}, { additionalProperties: true })),
        retryConfig: Type.Optional(Type.Object({
          maxRetries: Type.Number({ minimum: 0, maximum: 10, default: 3 }),
          retryDelay: Type.Number({ minimum: 1000, maximum: 60000, default: 5000 }),
        })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            webhook: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              secret: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { name, url, events, headers, retryConfig } = request.body;

      try {
        // Generate webhook secret
        const secret = crypto.randomBytes(32).toString('hex');

        const webhook = await fastify.prisma.webhook.create({
          data: {
            name,
            url,
            events,
            secret,
            headers: headers || {},
            retryConfig: retryConfig || {
              maxRetries: 3,
              retryDelay: 5000,
            },
            status: 'active',
            accountId: request.user!.accountId,
            createdById: request.user!.id,
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            webhook: {
              uuid: webhook.uuid,
              name: webhook.name,
              secret: webhook.secret,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to create webhook');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CREATE_WEBHOOK',
        });
      }
    },
  });

  // Test webhook
  fastify.post('/:uuid/test', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.webhooks.execute')],
    schema: {
      tags: ['account.business'],
      summary: 'Test webhook',
      description: 'Send a test payload to webhook',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        event: Type.Optional(Type.String()),
        payload: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            status: Type.String(),
            statusCode: Type.Number(),
            responseTime: Type.Number(),
            response: Type.Optional(Type.Any()),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { event = 'test.webhook', payload } = request.body;

      try {
        const webhook = await fastify.prisma.webhook.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!webhook) {
          return reply.status(404).send({
            success: false,
            error: 'WEBHOOK_NOT_FOUND',
          });
        }

        const testPayload = payload || {
          event,
          timestamp: new Date().toISOString(),
          data: {
            message: 'This is a test webhook delivery',
            webhookId: webhook.uuid,
          },
        };

        // Calculate signature
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(testPayload))
          .digest('hex');

        const startTime = Date.now();

        // Send test request
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event,
            ...webhook.headers,
          },
          body: JSON.stringify(testPayload),
        });

        const responseTime = Date.now() - startTime;
        const responseData = await response.text();

        // Log delivery
        await fastify.prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.uuid as UUID,
            event,
            payload: testPayload,
            status: response.ok ? 'success' : 'failed',
            statusCode: response.status,
            responseTime,
            response: responseData,
          },
        });

        return {
          success: true,
          data: {
            status: response.ok ? 'success' : 'failed',
            statusCode: response.status,
            responseTime,
            response: responseData,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to test webhook');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_TEST_WEBHOOK',
        });
      }
    },
  });

  // Get webhook deliveries
  fastify.get('/:uuid/deliveries', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.webhooks.read')],
    schema: {
      tags: ['account.business'],
      summary: 'Get webhook deliveries',
      description: 'Get delivery history for a webhook',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        status: Type.Optional(Type.String()),
        event: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            deliveries: Type.Array(Type.Object({
              uuid: uuidSchema,
              event: Type.String(),
              status: Type.String(),
              statusCode: Type.Optional(Type.Number()),
              responseTime: Type.Optional(Type.Number()),
              attempts: Type.Number(),
              nextRetryAt: Type.Optional(Type.String()),
              createdAt: Type.String(),
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
      const { uuid } = request.params as { uuid: string };
      const { page = 1, limit = 20, status, event } = request.query;
      const offset = (page - 1) * limit;

      try {
        const webhook = await fastify.prisma.webhook.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!webhook) {
          return reply.status(404).send({
            success: false,
            error: 'WEBHOOK_NOT_FOUND',
          });
        }

        const where: any = {
          webhookId: webhook.uuid as UUID,
        };

        if (status) {
          where.status = status;
        }

        if (event) {
          where.event = event;
        }

        const [deliveries, total] = await Promise.all([
          fastify.prisma.webhookDelivery.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          fastify.prisma.webhookDelivery.count({ where }),
        ]);

        return {
          success: true,
          data: {
            deliveries: deliveries.map(delivery => ({
              uuid: delivery.uuid,
              event: delivery.event,
              status: delivery.status,
              statusCode: delivery.statusCode,
              responseTime: delivery.responseTime,
              attempts: delivery.attempts,
              nextRetryAt: delivery.nextRetryAt?.toISOString(),
              createdAt: delivery.createdAt.toISOString(),
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
        request.log.error({ error }, 'Failed to get webhook deliveries');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_WEBHOOK_DELIVERIES',
        });
      }
    },
  });

  // Retry webhook delivery
  fastify.post('/:uuid/deliveries/:deliveryUuid/retry', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.webhooks.execute')],
    schema: {
      tags: ['account.business'],
      summary: 'Retry webhook delivery',
      description: 'Retry a failed webhook delivery',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
        deliveryUuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            deliveryId: Type.Number(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid, deliveryUuid } = request.params as { uuid: string; deliveryUuid: string };

      try {
        const webhook = await fastify.prisma.webhook.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!webhook) {
          return reply.status(404).send({
            success: false,
            error: 'WEBHOOK_NOT_FOUND',
          });
        }

        const delivery = await fastify.prisma.webhookDelivery.findFirst({
          where: { tenantId: request.user.tenantId, uuid: deliveryUuid,
            webhookId: webhook.uuid as UUID,
            status: 'failed', },
        });

        if (!delivery) {
          return reply.status(404).send({
            success: false,
            error: 'FAILED_DELIVERY_NOT_FOUND',
          });
        }

        // Update delivery status
        await fastify.prisma.webhookDelivery.update({
          where: { tenantId: request.user.tenantId },
          data: {
            status: 'pending',
            nextRetryAt: new Date(),
            attempts: delivery.attempts + 1,
          },
        });

        // TODO: Trigger webhook delivery worker

        return {
          success: true,
          data: {
            message: 'Webhook delivery retry scheduled',
            deliveryId: delivery.uuid as UUID,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to retry webhook delivery');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_RETRY_WEBHOOK_DELIVERY',
        });
      }
    },
  });

  // Update webhook
  fastify.put('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.webhooks.update')],
    schema: {
      tags: ['account.business'],
      summary: 'Update webhook',
      description: 'Update webhook configuration',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1 })),
        url: Type.Optional(Type.String({ format: 'uri' })),
        events: Type.Optional(Type.Array(Type.String(), { minItems: 1 })),
        headers: Type.Optional(Type.Object({}, { additionalProperties: true })),
        retryConfig: Type.Optional(Type.Object({}, { additionalProperties: true })),
        status: Type.Optional(Type.Union([Type.Literal('active'), Type.Literal('paused')])),
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
        const webhook = await fastify.prisma.webhook.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!webhook) {
          return reply.status(404).send({
            success: false,
            error: 'WEBHOOK_NOT_FOUND',
          });
        }

        await fastify.prisma.webhook.update({
          where: { tenantId: request.user.tenantId },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'Webhook updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update webhook');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_WEBHOOK',
        });
      }
    },
  });

  // Delete webhook
  fastify.delete('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.webhooks.delete')],
    schema: {
      tags: ['account.business'],
      summary: 'Delete webhook',
      description: 'Delete a webhook endpoint',
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
        const webhook = await fastify.prisma.webhook.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!webhook) {
          return reply.status(404).send({
            success: false,
            error: 'WEBHOOK_NOT_FOUND',
          });
        }

        // Delete webhook and all related data
        await fastify.prisma.webhook.delete({
          where: { tenantId: request.user.tenantId },
        });

        return {
          success: true,
          data: {
            message: 'Webhook deleted successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to delete webhook');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_WEBHOOK',
        });
      }
    },
  });
};