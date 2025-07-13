import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * User Content Templates Routes
 * Access and use templates
 */
export const userTemplatesRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all templates
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.content.templates.read')
    ],
    schema: {
      tags: ['user.content'],
      summary: 'Get templates',
      description: 'Get all templates available to the user',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        type: Type.Optional(Type.String()),
        categoryId: Type.Optional(Type.Number()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            templates: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              slug: Type.String(),
              description: Type.Optional(Type.String()),
              type: Type.String(),
              category: Type.Optional(Type.Object({
                name: Type.String(),
              })),
              tags: Type.Array(Type.String()),
              thumbnail: Type.Optional(Type.String()),
              previewUrl: Type.Optional(Type.String()),
              isPublic: Type.Boolean(),
              usageCount: Type.Number(),
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
      const { page = 1, limit = 20, search, type, categoryId } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          tenantId: request.user!.tenantId,
          isActive: true,
          OR: [
            { isPublic: true },
            { createdById: request.user!.id },
          ],
        };

        if (search) {
          where.AND = {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          };
        }

        if (type) {
          where.type = type;
        }

        if (categoryId) {
          where.categoryId = categoryId;
        }

        const [templates, total] = await Promise.all([
          fastify.prisma.template.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              tags: {
                select: {
                  tag: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  usages: true,
                },
              },
            },
          }),
          fastify.prisma.template.count({ where }),
        ]);

        return {
          success: true,
          data: {
            templates: templates.map(template => ({
              uuid: template.uuid,
              name: template.name,
              slug: template.slug,
              description: template.description,
              type: template.type,
              category: template.category,
              tags: template.tags.map(t => t.tag.name),
              thumbnail: template.thumbnail,
              previewUrl: template.previewUrl,
              isPublic: template.isPublic,
              usageCount: template._count.usages,
              createdAt: template.createdAt.toISOString(),
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
        request.log.error({ error }, 'Failed to get templates');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_TEMPLATES',
        });
      }
    },
  });

  // Get template by UUID
  fastify.get('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.content.templates.read')
    ],
    schema: {
      tags: ['user.content'],
      summary: 'Get template details',
      description: 'Get detailed information about a specific template',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            template: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              slug: Type.String(),
              description: Type.Optional(Type.String()),
              type: Type.String(),
              content: Type.Object({}, { additionalProperties: true }),
              metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
              settings: Type.Optional(Type.Object({}, { additionalProperties: true })),
              category: Type.Optional(Type.Object({
                name: Type.String(),
              })),
              tags: Type.Array(Type.String()),
              thumbnail: Type.Optional(Type.String()),
              previewUrl: Type.Optional(Type.String()),
              isPublic: Type.Boolean(),
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
        const template = await fastify.prisma.template.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
            isActive: true,
            OR: [
              { isPublic: true },
              { createdById: request.user!.id },
            ],
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            tags: {
              select: {
                tag: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (!template) {
          return reply.status(404).send({
            success: false,
            error: 'TEMPLATE_NOT_FOUND',
          });
        }

        // Track template view
        await fastify.prisma.templateUsage.create({
          data: {
            templateId: template.uuid as UUID,
            userId: request.user!.id,
            action: 'view',
          },
        });

        return {
          success: true,
          data: {
            template: {
              uuid: template.uuid,
              name: template.name,
              slug: template.slug,
              description: template.description,
              type: template.type,
              content: template.content,
              metadata: template.metadata,
              settings: template.settings,
              category: template.category,
              tags: template.tags.map(t => t.tag.name),
              thumbnail: template.thumbnail,
              previewUrl: template.previewUrl,
              isPublic: template.isPublic,
              createdBy: template.createdBy,
              createdAt: template.createdAt.toISOString(),
              updatedAt: template.updatedAt.toISOString(),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get template');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_TEMPLATE',
        });
      }
    },
  });

  // Use template
  fastify.post('/:uuid/use', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.content.templates.read')
    ],
    schema: {
      tags: ['user.content'],
      summary: 'Use template',
      description: 'Create new content from a template',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        variables: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            contentId: Type.String(),
            contentType: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { name, variables } = request.body;

      try {
        const template = await fastify.prisma.template.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
            isActive: true,
            OR: [
              { isPublic: true },
              { createdById: request.user!.id },
            ],
          },
        });

        if (!template) {
          return reply.status(404).send({
            success: false,
            error: 'TEMPLATE_NOT_FOUND',
          });
        }

        // Track template usage
        await fastify.prisma.templateUsage.create({
          data: {
            templateId: template.uuid as UUID,
            userId: request.user!.id,
            action: 'use',
            metadata: { name, variables },
          },
        });

        // TODO: Create actual content from template
        const contentId = crypto.randomUUID();

        return reply.status(201).send({
          success: true,
          data: {
            message: 'Content created from template successfully',
            contentId,
            contentType: template.type,
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to use template');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_USE_TEMPLATE',
        });
      }
    },
  });
};