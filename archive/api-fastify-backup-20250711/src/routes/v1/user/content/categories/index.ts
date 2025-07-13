import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * User Content Categories Routes
 * Access categories available to users
 */
export const userCategoriesRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all categories
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.content.categories.read')
    ],
    schema: {
      tags: ['user.content'],
      summary: 'Get categories',
      description: 'Get all categories available to the user',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        parentId: Type.Optional(Type.Number()),
        type: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            categories: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              slug: Type.String(),
              description: Type.Optional(Type.String()),
              type: Type.String(),
              parentId: Type.Optional(Type.Number()),
              displayOrder: Type.Number(),
              isActive: Type.Boolean(),
              metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
              childrenCount: Type.Number(),
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
      const { page = 1, limit = 20, search, parentId, type } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          tenantId: request.user!.tenantId,
          isActive: true,
        };

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ];
        }

        if (parentId !== undefined) {
          where.parentId = parentId;
        }

        if (type) {
          where.type = type;
        }

        const [categories, total] = await Promise.all([
          fastify.prisma.category.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: [
              { displayOrder: 'asc' },
              { name: 'asc' },
            ],
            include: {
              _count: {
                select: { children: true },
              },
            },
          }),
          fastify.prisma.category.count({ where }),
        ]);

        return {
          success: true,
          data: {
            categories: categories.map(cat => ({
              uuid: cat.uuid,
              name: cat.name,
              slug: cat.slug,
              description: cat.description,
              type: cat.type,
              parentId: cat.parentId,
              displayOrder: cat.displayOrder,
              isActive: cat.isActive,
              metadata: cat.metadata,
              childrenCount: cat._count.children,
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
        request.log.error({ error }, 'Failed to get categories');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_CATEGORIES',
        });
      }
    },
  });

  // Get category by UUID
  fastify.get('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.content.categories.read')
    ],
    schema: {
      tags: ['user.content'],
      summary: 'Get category details',
      description: 'Get detailed information about a specific category',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            category: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              slug: Type.String(),
              description: Type.Optional(Type.String()),
              type: Type.String(),
              parentId: Type.Optional(Type.Number()),
              displayOrder: Type.Number(),
              isActive: Type.Boolean(),
              metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
              parent: Type.Optional(Type.Object({
                name: Type.String(),
                slug: Type.String(),
              })),
              children: Type.Array(Type.Object({
                uuid: uuidSchema,
                name: Type.String(),
                slug: Type.String(),
              })),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const category = await fastify.prisma.category.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
            isActive: true,
          },
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            children: {
              where: { tenantId: request.user.tenantId, isActive: true },
              select: {
                id: true,
                uuid: true,
                name: true,
                slug: true,
              },
              orderBy: [
                { displayOrder: 'asc' },
                { name: 'asc' },
              ],
            },
          },
        });

        if (!category) {
          return reply.status(404).send({
            success: false,
            error: 'CATEGORY_NOT_FOUND',
          });
        }

        return {
          success: true,
          data: {
            category,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get category');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_CATEGORY',
        });
      }
    },
  });

  // Get category tree
  fastify.get('/tree', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.content.categories.read')
    ],
    schema: {
      tags: ['user.content'],
      summary: 'Get category tree',
      description: 'Get hierarchical category tree structure',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        type: Type.Optional(Type.String()),
        maxDepth: Type.Optional(Type.Number({ minimum: 1, maximum: 10, default: 3 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tree: Type.Array(Type.Any()),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { type, maxDepth = 3 } = request.query;

      try {
        // Get all categories
        const where: any = {
          tenantId: request.user!.tenantId,
          isActive: true,
        };

        if (type) {
          where.type = type;
        }

        const categories = await fastify.prisma.category.findMany({
          where,
          orderBy: [
            { displayOrder: 'asc' },
            { name: 'asc' },
          ],
        });

        // Build tree structure
        const buildTree = (parentId: number | null, depth: number): any[] => {
          if (depth > maxDepth) return [];

          return categories
            .filter(cat => cat.parentId === parentId)
            .map(cat => ({
              uuid: cat.uuid,
              name: cat.name,
              slug: cat.slug,
              type: cat.type,
              children: buildTree(cat.uuid as UUID, depth + 1),
            }));
        };

        const tree = buildTree(null, 1);

        return {
          success: true,
          data: {
            tree,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get category tree');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_CATEGORY_TREE',
        });
      }
    },
  });
};