import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * User Saved Searches Routes
 * Manage saved searches
 */
export const userSavedSearchesRoutes: FastifyPluginAsync = async (fastify) => {
  // Get saved searches
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.search.saved.read')
    ],
    schema: {
      tags: ['user.search'],
      summary: 'Get saved searches',
      description: 'Get user\'s saved searches',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        entityType: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            searches: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              description: Type.Optional(Type.String()),
              entityType: Type.String(),
              filters: Type.Object({}, { additionalProperties: true }),
              sortBy: Type.Optional(Type.String()),
              sortOrder: Type.Optional(Type.String()),
              isDefault: Type.Boolean(),
              isShared: Type.Boolean(),
              lastUsedAt: Type.Optional(Type.String()),
              useCount: Type.Number(),
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
      const { page = 1, limit = 20, entityType } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          userId: request.user!.id,
        };

        if (entityType) {
          where.entityType = entityType;
        }

        const [searches, total] = await Promise.all([
          fastify.prisma.savedSearch.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: [
              { isDefault: 'desc' },
              { lastUsedAt: 'desc' },
              { createdAt: 'desc' },
            ],
          }),
          fastify.prisma.savedSearch.count({ where }),
        ]);

        return {
          success: true,
          data: {
            searches: searches.map(search => ({
              uuid: search.uuid,
              name: search.name,
              description: search.description,
              entityType: search.entityType,
              filters: search.filters,
              sortBy: search.sortBy,
              sortOrder: search.sortOrder,
              isDefault: search.isDefault,
              isShared: search.isShared,
              lastUsedAt: search.lastUsedAt?.toISOString(),
              useCount: search.useCount,
              createdAt: search.createdAt.toISOString(),
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
        request.log.error({ error }, 'Failed to get saved searches');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_SAVED_SEARCHES',
        });
      }
    },
  });

  // Create saved search
  fastify.post('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.search.saved.read')
    ],
    schema: {
      tags: ['user.search'],
      summary: 'Save search',
      description: 'Save a search for later use',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1, maxLength: 100 }),
        description: Type.Optional(Type.String({ maxLength: 500 })),
        entityType: Type.String(),
        filters: Type.Object({}, { additionalProperties: true }),
        sortBy: Type.Optional(Type.String()),
        sortOrder: Type.Optional(Type.String()),
        isDefault: Type.Optional(Type.Boolean({ default: false })),
        isShared: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            search: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { name, description, entityType, filters, sortBy, sortOrder, isDefault = false, isShared = false } = request.body;

      try {
        // If setting as default, unset other defaults for this entity type
        if (isDefault) {
          await fastify.prisma.savedSearch.updateMany({
            where: { tenantId: request.user.tenantId, userId: request.user!.id,
              entityType,
              isDefault: true, },
            data: {
              isDefault: false,
            },
          });
        }

        const search = await fastify.prisma.savedSearch.create({
          data: {
            userId: request.user!.id,
            name,
            description,
            entityType,
            filters,
            sortBy,
            sortOrder,
            isDefault,
            isShared,
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            search: {
              uuid: search.uuid,
              name: search.name,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to save search');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_SAVE_SEARCH',
        });
      }
    },
  });

  // Update saved search
  fastify.put('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.search.saved.read')
    ],
    schema: {
      tags: ['user.search'],
      summary: 'Update saved search',
      description: 'Update a saved search',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
        description: Type.Optional(Type.String({ maxLength: 500 })),
        filters: Type.Optional(Type.Object({}, { additionalProperties: true })),
        sortBy: Type.Optional(Type.String()),
        sortOrder: Type.Optional(Type.String()),
        isDefault: Type.Optional(Type.Boolean()),
        isShared: Type.Optional(Type.Boolean()),
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
        const search = await fastify.prisma.savedSearch.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            userId: request.user!.id, },
        });

        if (!search) {
          return reply.status(404).send({
            success: false,
            error: 'SAVED_SEARCH_NOT_FOUND',
          });
        }

        // If setting as default, unset other defaults
        if (updates.isDefault === true) {
          await fastify.prisma.savedSearch.updateMany({
            where: { tenantId: request.user.tenantId, userId: request.user!.id,
              entityType: search.entityType,
              isDefault: true,
              id: { not: search.uuid as UUID },
            },
            data: {
              isDefault: false,
            },
          });
        }

        await fastify.prisma.savedSearch.update({
          where: { tenantId: request.user.tenantId },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'Saved search updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update saved search');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_SAVED_SEARCH',
        });
      }
    },
  });

  // Use saved search (track usage)
  fastify.post('/:uuid/use', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.search.saved.read')
    ],
    schema: {
      tags: ['user.search'],
      summary: 'Use saved search',
      description: 'Track usage of a saved search',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            search: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              entityType: Type.String(),
              filters: Type.Object({}, { additionalProperties: true }),
              sortBy: Type.Optional(Type.String()),
              sortOrder: Type.Optional(Type.String()),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const search = await fastify.prisma.savedSearch.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            OR: [
              { userId: request.user!.id },
              { isShared: true },
            ],
          },
        });

        if (!search) {
          return reply.status(404).send({
            success: false,
            error: 'SAVED_SEARCH_NOT_FOUND',
          });
        }

        // Update usage stats
        await fastify.prisma.savedSearch.update({
          where: { tenantId: request.user.tenantId },
          data: {
            lastUsedAt: new Date(),
            useCount: { increment: 1 },
          },
        });

        return {
          success: true,
          data: {
            search: {
              uuid: search.uuid,
              name: search.name,
              entityType: search.entityType,
              filters: search.filters,
              sortBy: search.sortBy,
              sortOrder: search.sortOrder,
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to use saved search');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_USE_SAVED_SEARCH',
        });
      }
    },
  });

  // Delete saved search
  fastify.delete('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.search.saved.read')
    ],
    schema: {
      tags: ['user.search'],
      summary: 'Delete saved search',
      description: 'Delete a saved search',
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
        const search = await fastify.prisma.savedSearch.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            userId: request.user!.id, },
        });

        if (!search) {
          return reply.status(404).send({
            success: false,
            error: 'SAVED_SEARCH_NOT_FOUND',
          });
        }

        await fastify.prisma.savedSearch.delete({
          where: { tenantId: request.user.tenantId },
        });

        return {
          success: true,
          data: {
            message: 'Saved search deleted successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to delete saved search');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_SAVED_SEARCH',
        });
      }
    },
  });
};