import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * User Content Tags Routes
 * Access and manage tags
 */
export const userTagsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all tags
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.content.tags.read')
    ],
    schema: {
      tags: ['user.content'],
      summary: 'Get tags',
      description: 'Get all tags available to the user',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        categoryId: Type.Optional(Type.Number()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tags: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              slug: Type.String(),
              description: Type.Optional(Type.String()),
              color: Type.Optional(Type.String()),
              icon: Type.Optional(Type.String()),
              usageCount: Type.Number(),
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
      const { page = 1, limit = 20, search, categoryId } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          tenantId: request.user!.tenantId,
        };

        if (search) {
          where.name = { contains: search, mode: 'insensitive' };
        }

        if (categoryId) {
          where.tagCategories = {
            some: {
              categoryId,
            },
          };
        }

        const [tags, total] = await Promise.all([
          fastify.prisma.tag.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { name: 'asc' },
            include: {
              _count: {
                select: {
                  taggedItems: true,
                },
              },
            },
          }),
          fastify.prisma.tag.count({ where }),
        ]);

        return {
          success: true,
          data: {
            tags: tags.map(tag => ({
              uuid: tag.uuid,
              name: tag.name,
              slug: tag.slug,
              description: tag.description,
              color: tag.color,
              icon: tag.icon,
              usageCount: tag._count.taggedItems,
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
        request.log.error({ error }, 'Failed to get tags');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_TAGS',
        });
      }
    },
  });

  // Get popular tags
  fastify.get('/popular', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.content.tags.read')
    ],
    schema: {
      tags: ['user.content'],
      summary: 'Get popular tags',
      description: 'Get most used tags',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 10 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tags: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              slug: Type.String(),
              color: Type.Optional(Type.String()),
              usageCount: Type.Number(),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { limit = 10 } = request.query;

      try {
        const tags = await fastify.prisma.tag.findMany({
          where: {
            tenantId: request.user!.tenantId,
          },
          orderBy: {
            taggedItems: {
              _count: 'desc',
            },
          },
          take: limit,
          include: {
            _count: {
              select: {
                taggedItems: true,
              },
            },
          },
        });

        return {
          success: true,
          data: {
            tags: tags.map(tag => ({
              uuid: tag.uuid,
              name: tag.name,
              slug: tag.slug,
              color: tag.color,
              usageCount: tag._count.taggedItems,
            })),
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get popular tags');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_POPULAR_TAGS',
        });
      }
    },
  });

  // Search tags (autocomplete)
  fastify.get('/search', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.content.tags.read')
    ],
    schema: {
      tags: ['user.content'],
      summary: 'Search tags',
      description: 'Search tags for autocomplete',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        q: Type.String({ minLength: 1 }),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 20, default: 10 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            suggestions: Type.Array(Type.Object({
              name: Type.String(),
              slug: Type.String(),
              color: Type.Optional(Type.String()),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { q, limit = 10 } = request.query;

      try {
        const tags = await fastify.prisma.tag.findMany({
          where: {
            tenantId: request.user!.tenantId,
            name: {
              contains: q,
              mode: 'insensitive',
            },
          },
          take: limit,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        });

        return {
          success: true,
          data: {
            suggestions: tags,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to search tags');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_SEARCH_TAGS',
        });
      }
    },
  });
};