import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import crypto from 'crypto';

/**
 * Account Configuration API Keys Routes
 * Manage API keys for account
 */
export const accountApiKeysRoutes: FastifyPluginAsync = async (fastify) => {
  // Get API keys
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.apikeys.read')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Get API keys',
      description: 'Get all API keys for the account',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        status: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            apiKeys: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              description: Type.Optional(Type.String()),
              keyPrefix: Type.String(),
              permissions: Type.Array(Type.String()),
              rateLimit: Type.Object({
                requests: Type.Number(),
                window: Type.String(),
              }),
              ipWhitelist: Type.Array(Type.String()),
              expiresAt: Type.Optional(Type.String()),
              lastUsedAt: Type.Optional(Type.String()),
              usageCount: Type.Number(),
              status: Type.String(),
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
      const { page = 1, limit = 20, status } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          accountId: request.user!.accountId,
        };

        if (status) {
          where.status = status;
        }

        const [apiKeys, total] = await Promise.all([
          fastify.prisma.apiKey.findMany({
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
                  usage: true,
                },
              },
            },
          }),
          fastify.prisma.apiKey.count({ where }),
        ]);

        return {
          success: true,
          data: {
            apiKeys: apiKeys.map(key => ({
              uuid: key.uuid,
              name: key.name,
              description: key.description,
              keyPrefix: key.key.substring(0, 8) + '...',
              permissions: key.permissions,
              rateLimit: key.rateLimit as any,
              ipWhitelist: key.ipWhitelist || [],
              expiresAt: key.expiresAt?.toISOString(),
              lastUsedAt: key.lastUsedAt?.toISOString(),
              usageCount: key._count.usage,
              status: key.status,
              createdBy: key.createdBy,
              createdAt: key.createdAt.toISOString(),
              updatedAt: key.updatedAt.toISOString(),
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
        request.log.error({ error }, 'Failed to get API keys');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_API_KEYS',
        });
      }
    },
  });

  // Create API key
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.apikeys.create')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Create API key',
      description: 'Create a new API key',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        description: Type.Optional(Type.String()),
        permissions: Type.Array(Type.String()),
        rateLimit: Type.Optional(Type.Object({
          requests: Type.Number({ minimum: 1 }),
          window: Type.String(),
        })),
        ipWhitelist: Type.Optional(Type.Array(Type.String())),
        expiresAt: Type.Optional(Type.String()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            apiKey: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              key: Type.String(),
              warning: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { name, description, permissions, rateLimit, ipWhitelist, expiresAt } = request.body;

      try {
        // Generate API key
        const keyPrefix = 'kp_';
        const randomBytes = crypto.randomBytes(32).toString('hex');
        const apiKeyValue = `${keyPrefix}${randomBytes}`;

        // Hash the key for storage
        const hashedKey = crypto
          .createHash('sha256')
          .update(apiKeyValue)
          .digest('hex');

        // Validate permissions
        const validPermissions = await fastify.prisma.permission.findMany({
          where: { tenantId: request.user.tenantId, name: {
              in: permissions,
              startsWith: 'account.', },
          },
          select: { name: true },
        });

        const validPermissionNames = validPermissions.map(p => p.name);

        const apiKey = await fastify.prisma.apiKey.create({
          data: {
            name,
            description,
            key: hashedKey,
            keyPrefix: apiKeyValue.substring(0, 8),
            permissions: validPermissionNames,
            rateLimit: rateLimit || {
              requests: 1000,
              window: 'hour',
            },
            ipWhitelist: ipWhitelist || [],
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            status: 'active',
            accountId: request.user!.accountId,
            createdById: request.user!.id,
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            apiKey: {
              uuid: apiKey.uuid,
              name: apiKey.name,
              key: apiKeyValue,
              warning: 'Please save this API key securely. You will not be able to see it again.',
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to create API key');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CREATE_API_KEY',
        });
      }
    },
  });

  // Get API key details
  fastify.get('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.apikeys.read')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Get API key details',
      description: 'Get detailed information about an API key',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            apiKey: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              description: Type.Optional(Type.String()),
              keyPrefix: Type.String(),
              permissions: Type.Array(Type.String()),
              rateLimit: Type.Object({
                requests: Type.Number(),
                window: Type.String(),
              }),
              ipWhitelist: Type.Array(Type.String()),
              expiresAt: Type.Optional(Type.String()),
              lastUsedAt: Type.Optional(Type.String()),
              status: Type.String(),
              usage: Type.Object({
                total: Type.Number(),
                last24Hours: Type.Number(),
                last7Days: Type.Number(),
                last30Days: Type.Number(),
              }),
              recentActivity: Type.Array(Type.Object({
                timestamp: Type.String(),
                endpoint: Type.String(),
                method: Type.String(),
                statusCode: Type.Number(),
                ipAddress: Type.String(),
              })),
              createdBy: Type.Object({
                name: Type.String(),
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
        const apiKey = await fastify.prisma.apiKey.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
            usage: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              select: {
                endpoint: true,
                method: true,
                statusCode: true,
                ipAddress: true,
                createdAt: true,
              },
            },
            _count: {
              select: {
                usage: true,
              },
            },
          },
        });

        if (!apiKey) {
          return reply.status(404).send({
            success: false,
            error: 'API_KEY_NOT_FOUND',
          });
        }

        // Calculate usage statistics
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [usage24h, usage7d, usage30d] = await Promise.all([
          fastify.prisma.apiKeyUsage.count({
            where: { tenantId: request.user.tenantId, apiKeyId: apiKey.uuid as UUID,
              createdAt: { gte: last24Hours },
            },
          }),
          fastify.prisma.apiKeyUsage.count({
            where: { tenantId: request.user.tenantId, apiKeyId: apiKey.uuid as UUID,
              createdAt: { gte: last7Days },
            },
          }),
          fastify.prisma.apiKeyUsage.count({
            where: { tenantId: request.user.tenantId, apiKeyId: apiKey.uuid as UUID,
              createdAt: { gte: last30Days },
            },
          }),
        ]);

        return {
          success: true,
          data: {
            apiKey: {
              uuid: apiKey.uuid,
              name: apiKey.name,
              description: apiKey.description,
              keyPrefix: apiKey.keyPrefix || apiKey.key.substring(0, 8) + '...',
              permissions: apiKey.permissions,
              rateLimit: apiKey.rateLimit as any,
              ipWhitelist: apiKey.ipWhitelist || [],
              expiresAt: apiKey.expiresAt?.toISOString(),
              lastUsedAt: apiKey.lastUsedAt?.toISOString(),
              status: apiKey.status,
              usage: {
                total: apiKey._count.usage,
                last24Hours: usage24h,
                last7Days: usage7d,
                last30Days: usage30d,
              },
              recentActivity: apiKey.usage.map(u => ({
                timestamp: u.createdAt.toISOString(),
                endpoint: u.endpoint,
                method: u.method,
                statusCode: u.statusCode,
                ipAddress: u.ipAddress,
              })),
              createdBy: apiKey.createdBy,
              createdAt: apiKey.createdAt.toISOString(),
              updatedAt: apiKey.updatedAt.toISOString(),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get API key details');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_API_KEY_DETAILS',
        });
      }
    },
  });

  // Update API key
  fastify.put('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.apikeys.update')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Update API key',
      description: 'Update API key configuration',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1 })),
        description: Type.Optional(Type.String()),
        permissions: Type.Optional(Type.Array(Type.String())),
        rateLimit: Type.Optional(Type.Object({
          requests: Type.Number({ minimum: 1 }),
          window: Type.String(),
        })),
        ipWhitelist: Type.Optional(Type.Array(Type.String())),
        expiresAt: Type.Optional(Type.Union([Type.String(), Type.Null()])),
        status: Type.Optional(Type.Union([Type.Literal('active'), Type.Literal('inactive')])),
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
        const apiKey = await fastify.prisma.apiKey.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!apiKey) {
          return reply.status(404).send({
            success: false,
            error: 'API_KEY_NOT_FOUND',
          });
        }

        const updateData: any = {};

        if (updates.name !== undefined) {
          updateData.name = updates.name;
        }

        if (updates.description !== undefined) {
          updateData.description = updates.description;
        }

        if (updates.permissions !== undefined) {
          // Validate permissions
          const validPermissions = await fastify.prisma.permission.findMany({
            where: { tenantId: request.user.tenantId, name: {
                in: updates.permissions,
                startsWith: 'account.', },
            },
            select: { name: true },
          });

          updateData.permissions = validPermissions.map(p => p.name);
        }

        if (updates.rateLimit !== undefined) {
          updateData.rateLimit = updates.rateLimit;
        }

        if (updates.ipWhitelist !== undefined) {
          updateData.ipWhitelist = updates.ipWhitelist;
        }

        if (updates.expiresAt !== undefined) {
          updateData.expiresAt = updates.expiresAt ? new Date(updates.expiresAt) : null;
        }

        if (updates.status !== undefined) {
          updateData.status = updates.status;
        }

        await fastify.prisma.apiKey.update({
          where: { tenantId: request.user.tenantId },
          data: {
            ...updateData,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'API key updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update API key');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_API_KEY',
        });
      }
    },
  });

  // Regenerate API key
  fastify.post('/:uuid/regenerate', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.apikeys.update')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Regenerate API key',
      description: 'Generate a new key value for an API key',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            key: Type.String(),
            warning: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const apiKey = await fastify.prisma.apiKey.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!apiKey) {
          return reply.status(404).send({
            success: false,
            error: 'API_KEY_NOT_FOUND',
          });
        }

        // Generate new API key
        const keyPrefix = 'kp_';
        const randomBytes = crypto.randomBytes(32).toString('hex');
        const newApiKeyValue = `${keyPrefix}${randomBytes}`;

        // Hash the key for storage
        const hashedKey = crypto
          .createHash('sha256')
          .update(newApiKeyValue)
          .digest('hex');

        await fastify.prisma.apiKey.update({
          where: { tenantId: request.user.tenantId },
          data: {
            key: hashedKey,
            keyPrefix: newApiKeyValue.substring(0, 8),
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            key: newApiKeyValue,
            warning: 'Please save this API key securely. You will not be able to see it again. The old key has been invalidated.',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to regenerate API key');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_REGENERATE_API_KEY',
        });
      }
    },
  });

  // Delete API key
  fastify.delete('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.apikeys.delete')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Delete API key',
      description: 'Permanently delete an API key',
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
        const apiKey = await fastify.prisma.apiKey.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!apiKey) {
          return reply.status(404).send({
            success: false,
            error: 'API_KEY_NOT_FOUND',
          });
        }

        // Delete API key and all related usage data
        await fastify.prisma.apiKey.delete({
          where: { tenantId: request.user.tenantId },
        });

        return {
          success: true,
          data: {
            message: 'API key deleted successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to delete API key');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_API_KEY',
        });
      }
    },
  });

  // Get API key usage statistics
  fastify.get('/:uuid/usage', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.apikeys.read')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Get API key usage',
      description: 'Get detailed usage statistics for an API key',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      querystring: Type.Object({
        startDate: Type.Optional(Type.String()),
        endDate: Type.Optional(Type.String()),
        groupBy: Type.Optional(Type.Union([
          Type.Literal('hour'),
          Type.Literal('day'),
          Type.Literal('week'),
          Type.Literal('month'),
        ])),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            usage: Type.Object({
              total: Type.Number(),
              successful: Type.Number(),
              failed: Type.Number(),
              averageResponseTime: Type.Number(),
              byEndpoint: Type.Array(Type.Object({
                endpoint: Type.String(),
                method: Type.String(),
                count: Type.Number(),
                averageResponseTime: Type.Number(),
              })),
              byStatusCode: Type.Array(Type.Object({
                statusCode: Type.Number(),
                count: Type.Number(),
              })),
              byTimePeriod: Type.Array(Type.Object({
                period: Type.String(),
                count: Type.Number(),
              })),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { startDate, endDate, groupBy = 'day' } = request.query;

      try {
        const apiKey = await fastify.prisma.apiKey.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!apiKey) {
          return reply.status(404).send({
            success: false,
            error: 'API_KEY_NOT_FOUND',
          });
        }

        const where: any = {
          apiKeyId: apiKey.uuid as UUID,
        };

        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) {
            where.createdAt.gte = new Date(startDate);
          }
          if (endDate) {
            where.createdAt.lte = new Date(endDate);
          }
        }

        // Get overall statistics
        const [total, successful, failed, avgResponseTime] = await Promise.all([
          fastify.prisma.apiKeyUsage.count({ where }),
          fastify.prisma.apiKeyUsage.count({
            where: { tenantId: request.user.tenantId, ...where, statusCode: { gte: 200, lt: 300 } },
          }),
          fastify.prisma.apiKeyUsage.count({
            where: { tenantId: request.user.tenantId, ...where, statusCode: { gte: 400 } },
          }),
          fastify.prisma.apiKeyUsage.aggregate({
            where,
            _avg: { responseTime: true },
          }),
        ]);

        // Get endpoint statistics
        const endpointStats = await fastify.prisma.apiKeyUsage.groupBy({
          by: ['endpoint', 'method'],
          where,
          _count: true,
          _avg: { responseTime: true },
          orderBy: { _count: { endpoint: 'desc' } },
          take: 10,
        });

        // Get status code distribution
        const statusCodeStats = await fastify.prisma.apiKeyUsage.groupBy({
          by: ['statusCode'],
          where,
          _count: true,
          orderBy: { statusCode: 'asc' },
        });

        // TODO: Implement time period grouping based on groupBy parameter

        return {
          success: true,
          data: {
            usage: {
              total,
              successful,
              failed,
              averageResponseTime: avgResponseTime._avg.responseTime || 0,
              byEndpoint: endpointStats.map(stat => ({
                endpoint: stat.endpoint,
                method: stat.method,
                count: stat._count,
                averageResponseTime: stat._avg.responseTime || 0,
              })),
              byStatusCode: statusCodeStats.map(stat => ({
                statusCode: stat.statusCode,
                count: stat._count,
              })),
              byTimePeriod: [], // TODO: Implement based on groupBy
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get API key usage');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_API_KEY_USAGE',
        });
      }
    },
  });
};