import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * Account Business Integrations Routes
 * Manage third-party integrations
 */
export const accountIntegrationsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get integrations
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.integrations.read')],
    schema: {
      tags: ['account.business'],
      summary: 'Get integrations',
      description: 'Get all configured integrations for the account',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        provider: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            integrations: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              provider: Type.String(),
              status: Type.String(),
              config: Type.Object({}, { additionalProperties: true }),
              metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
              lastSyncAt: Type.Optional(Type.String()),
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
      const { page = 1, limit = 20, search, provider, status } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          accountId: request.user!.accountId,
        };

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { provider: { contains: search, mode: 'insensitive' } },
          ];
        }

        if (provider) {
          where.provider = provider;
        }

        if (status) {
          where.status = status;
        }

        const [integrations, total] = await Promise.all([
          fastify.prisma.integration.findMany({
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
            },
          }),
          fastify.prisma.integration.count({ where }),
        ]);

        return {
          success: true,
          data: {
            integrations: integrations.map(integration => ({
              uuid: integration.uuid,
              name: integration.name,
              provider: integration.provider,
              status: integration.status,
              config: integration.config,
              metadata: integration.metadata,
              lastSyncAt: integration.lastSyncAt?.toISOString(),
              createdBy: integration.createdBy,
              createdAt: integration.createdAt.toISOString(),
              updatedAt: integration.updatedAt.toISOString(),
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
        request.log.error({ error }, 'Failed to get integrations');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_INTEGRATIONS',
        });
      }
    },
  });

  // Get available providers
  fastify.get('/providers', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.integrations.read')],
    schema: {
      tags: ['account.business'],
      summary: 'Get available providers',
      description: 'Get list of available integration providers',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            providers: Type.Array(Type.Object({
              id: Type.String(),
              name: Type.String(),
              description: Type.String(),
              category: Type.String(),
              features: Type.Array(Type.String()),
              requiredFields: Type.Array(Type.Object({
                name: Type.String(),
                type: Type.String(),
                label: Type.String(),
                required: Type.Boolean(),
                secret: Type.Optional(Type.Boolean()),
              })),
              icon: Type.Optional(Type.String()),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        // Define available providers
        const providers = [
          {
            id: 'stripe',
            name: 'Stripe',
            description: 'Payment processing and billing',
            category: 'payments',
            features: ['payments', 'subscriptions', 'invoicing'],
            requiredFields: [
              { name: 'apiKey', type: 'string', label: 'API Key', required: true, secret: true },
              { name: 'webhookSecret', type: 'string', label: 'Webhook Secret', required: false, secret: true },
            ],
            icon: 'stripe',
          },
          {
            id: 'mailchimp',
            name: 'Mailchimp',
            description: 'Email marketing and automation',
            category: 'marketing',
            features: ['email', 'campaigns', 'automation'],
            requiredFields: [
              { name: 'apiKey', type: 'string', label: 'API Key', required: true, secret: true },
              { name: 'server', type: 'string', label: 'Server Prefix', required: true },
            ],
            icon: 'mailchimp',
          },
          {
            id: 'zapier',
            name: 'Zapier',
            description: 'Workflow automation',
            category: 'automation',
            features: ['webhooks', 'automation', 'triggers'],
            requiredFields: [
              { name: 'webhookUrl', type: 'string', label: 'Webhook URL', required: true },
            ],
            icon: 'zapier',
          },
          {
            id: 'google-analytics',
            name: 'Google Analytics',
            description: 'Website analytics and tracking',
            category: 'analytics',
            features: ['analytics', 'tracking', 'reporting'],
            requiredFields: [
              { name: 'measurementId', type: 'string', label: 'Measurement ID', required: true },
              { name: 'apiSecret', type: 'string', label: 'API Secret', required: false, secret: true },
            ],
            icon: 'google',
          },
          {
            id: 'slack',
            name: 'Slack',
            description: 'Team communication and notifications',
            category: 'communication',
            features: ['notifications', 'messaging', 'webhooks'],
            requiredFields: [
              { name: 'webhookUrl', type: 'string', label: 'Webhook URL', required: true, secret: true },
              { name: 'channel', type: 'string', label: 'Default Channel', required: false },
            ],
            icon: 'slack',
          },
        ];

        return {
          success: true,
          data: {
            providers,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get providers');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_PROVIDERS',
        });
      }
    },
  });

  // Create integration
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.integrations.create')],
    schema: {
      tags: ['account.business'],
      summary: 'Create integration',
      description: 'Configure a new integration',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        provider: Type.String(),
        config: Type.Object({}, { additionalProperties: true }),
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            integration: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              status: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { name, provider, config, metadata } = request.body;

      try {
        // Check if integration already exists
        const existing = await fastify.prisma.integration.findFirst({
          where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
            provider,
            status: { not: 'deleted' },
          },
        });

        if (existing) {
          return reply.status(400).send({
            success: false,
            error: 'AN_INTEGRATION_WITH_THIS_PROVIDER_ALREADY_EXISTS',
          });
        }

        // Create integration
        const integration = await fastify.prisma.integration.create({
          data: {
            name,
            provider,
            config,
            metadata: metadata || {},
            status: 'pending',
            accountId: request.user!.accountId,
            createdById: request.user!.id,
          },
        });

        // TODO: Test connection and update status

        return reply.status(201).send({
          success: true,
          data: {
            integration: {
              uuid: integration.uuid,
              name: integration.name,
              status: integration.status,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to create integration');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CREATE_INTEGRATION',
        });
      }
    },
  });

  // Test integration
  fastify.post('/:uuid/test', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.integrations.update')],
    schema: {
      tags: ['account.business'],
      summary: 'Test integration',
      description: 'Test integration connection',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            status: Type.String(),
            message: Type.String(),
            details: Type.Optional(Type.Object({}, { additionalProperties: true })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const integration = await fastify.prisma.integration.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!integration) {
          return reply.status(404).send({
            success: false,
            error: 'INTEGRATION_NOT_FOUND',
          });
        }

        // TODO: Implement actual testing logic per provider
        // For now, simulate test
        const testResult = {
          status: 'success',
          message: 'Connection successful',
          details: {
            provider: integration.provider,
            timestamp: new Date().toISOString(),
          },
        };

        // Update status if successful
        await fastify.prisma.integration.update({
          where: { tenantId: request.user.tenantId },
          data: {
            status: 'active',
            lastSyncAt: new Date(),
          },
        });

        return {
          success: true,
          data: testResult,
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to test integration');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_TEST_INTEGRATION',
        });
      }
    },
  });

  // Sync integration
  fastify.post('/:uuid/sync', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.integrations.execute')],
    schema: {
      tags: ['account.business'],
      summary: 'Sync integration',
      description: 'Trigger manual sync for integration',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        options: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            syncId: Type.String(),
            status: Type.String(),
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { options } = request.body;

      try {
        const integration = await fastify.prisma.integration.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId,
            status: 'active', },
        });

        if (!integration) {
          return reply.status(404).send({
            success: false,
            error: 'ACTIVE_INTEGRATION_NOT_FOUND',
          });
        }

        // Create sync record
        const sync = await fastify.prisma.integrationSync.create({
          data: {
            integrationId: integration.uuid as UUID,
            status: 'running',
            startedAt: new Date(),
            options,
          },
        });

        // TODO: Implement actual sync logic per provider
        // For now, simulate async sync
        setTimeout(async () => {
          await fastify.prisma.integrationSync.update({
            where: { tenantId: request.user.tenantId },
            data: {
              status: 'completed',
              completedAt: new Date(),
              result: {
                recordsProcessed: 100,
                errors: 0,
              },
            },
          });

          await fastify.prisma.integration.update({
            where: { tenantId: request.user.tenantId },
            data: {
              lastSyncAt: new Date(),
            },
          });
        }, 5000);

        return {
          success: true,
          data: {
            syncId: sync.uuid,
            status: 'running',
            message: 'Sync started successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to sync integration');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_SYNC_INTEGRATION',
        });
      }
    },
  });

  // Get integration logs
  fastify.get('/:uuid/logs', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.integrations.read')],
    schema: {
      tags: ['account.business'],
      summary: 'Get integration logs',
      description: 'Get activity logs for integration',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        level: Type.Optional(Type.String()),
        startDate: Type.Optional(Type.String()),
        endDate: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            logs: Type.Array(Type.Object({
              level: Type.String(),
              message: Type.String(),
              details: Type.Optional(Type.Object({}, { additionalProperties: true })),
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
      const { page = 1, limit = 20, level, startDate, endDate } = request.query;
      const offset = (page - 1) * limit;

      try {
        const integration = await fastify.prisma.integration.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!integration) {
          return reply.status(404).send({
            success: false,
            error: 'INTEGRATION_NOT_FOUND',
          });
        }

        const where: any = {
          integrationId: integration.uuid as UUID,
        };

        if (level) {
          where.level = level;
        }

        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) {
            where.createdAt.gte = new Date(startDate);
          }
          if (endDate) {
            where.createdAt.lte = new Date(endDate);
          }
        }

        const [logs, total] = await Promise.all([
          fastify.prisma.integrationLog.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          fastify.prisma.integrationLog.count({ where }),
        ]);

        return {
          success: true,
          data: {
            logs: logs.map(log => ({
              level: log.level,
              message: log.message,
              details: log.details,
              createdAt: log.createdAt.toISOString(),
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
        request.log.error({ error }, 'Failed to get integration logs');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_INTEGRATION_LOGS',
        });
      }
    },
  });

  // Update integration
  fastify.put('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.integrations.update')],
    schema: {
      tags: ['account.business'],
      summary: 'Update integration',
      description: 'Update integration configuration',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1 })),
        config: Type.Optional(Type.Object({}, { additionalProperties: true })),
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
        status: Type.Optional(Type.String()),
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
        const integration = await fastify.prisma.integration.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!integration) {
          return reply.status(404).send({
            success: false,
            error: 'INTEGRATION_NOT_FOUND',
          });
        }

        await fastify.prisma.integration.update({
          where: { tenantId: request.user.tenantId },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'Integration updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update integration');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_INTEGRATION',
        });
      }
    },
  });

  // Delete integration
  fastify.delete('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.integrations.delete')],
    schema: {
      tags: ['account.business'],
      summary: 'Delete integration',
      description: 'Remove integration configuration',
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
        const integration = await fastify.prisma.integration.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!integration) {
          return reply.status(404).send({
            success: false,
            error: 'INTEGRATION_NOT_FOUND',
          });
        }

        // Soft delete
        await fastify.prisma.integration.update({
          where: { tenantId: request.user.tenantId },
          data: {
            status: 'deleted',
            deletedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'Integration deleted successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to delete integration');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_INTEGRATION',
        });
      }
    },
  });
};