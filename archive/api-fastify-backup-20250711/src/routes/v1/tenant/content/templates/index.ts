import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

export const templateRoutes: FastifyPluginAsync = async (fastify) => {
  // Get templates with filtering and pagination
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('templates:read')],
    schema: {
      tags: ['tenant.content'],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        category: Type.Optional(Type.String()),
        industry: Type.Optional(Type.String()),
        search: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
        sortBy: Type.Optional(Type.String({ default: 'createdAt' })),
        sortOrder: Type.Optional(Type.String({ default: 'desc' })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            templates: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              description: Type.Optional(Type.String()),
              category: Type.String(),
              industry: Type.Optional(Type.String()),
              version: Type.String(),
              status: Type.String(),
              isPublic: Type.Boolean(),
              usageCount: Type.Number(),
              rating: Type.Optional(Type.Number()),
              preview: Type.Optional(Type.String()),
              tags: Type.Array(Type.String()),
              author: Type.Object({
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
            filters: Type.Object({
              categories: Type.Array(Type.String()),
              industries: Type.Array(Type.String()),
              statuses: Type.Array(Type.String()),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const {
      page = 1,
      limit = 20,
      category,
      industry,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = request.query as any;

    const skip = (page - 1) * limit;

    try {
      // Build where clause
      const where: any = {
        tenantId: request.user!.tenantId,
      };

      if (category) where.category = category;
      if (industry) where.industry = industry;
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ];
      }

      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      const [templates, total, filters] = await Promise.all([
        fastify.prisma.template.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
        fastify.prisma.template.count({ where }),
        // Get filter options
        Promise.all([
          fastify.prisma.template.groupBy({
            by: ['category'],
            where: { tenantId: request.user!.tenantId },
          }),
          fastify.prisma.template.groupBy({
            by: ['industry'],
            where: { 
              tenantId: request.user!.tenantId,
              industry: { not: null },
            },
          }),
          fastify.prisma.template.groupBy({
            by: ['status'],
            where: { tenantId: request.user!.tenantId },
          }),
        ]),
      ]);

      const [categories, industries, statuses] = filters;

      return {
        success: true,
        data: {
          templates: templates.map(template => ({
            uuid: template.uuid,
            name: template.name,
            description: template.description,
            category: template.category,
            industry: template.industry,
            version: template.version,
            status: template.status,
            isPublic: template.isPublic,
            usageCount: template.usageCount,
            rating: template.rating,
            preview: template.preview,
            tags: template.tags as string[],
            author: {
              id: template.author.uuid as UUID,
              name: `${template.author.firstName} ${template.author.lastName}`,
            },
            createdAt: template.createdAt.toISOString(),
            updatedAt: template.updatedAt.toISOString(),
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          filters: {
            categories: categories.map(c => c.category),
            industries: industries.map(i => i.industry!),
            statuses: statuses.map(s => s.status),
          },
        },
      };

    } catch (error: any) {
      request.log.error('Failed to get templates', { error: error.message });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_GET_TEMPLATES',
      });
    }
  });

  // Get single template
  fastify.get('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('templates:read')],
    schema: {
      tags: ['tenant.content'],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            uuid: uuidSchema,
            name: Type.String(),
            description: Type.Optional(Type.String()),
            category: Type.String(),
            industry: Type.Optional(Type.String()),
            version: Type.String(),
            status: Type.String(),
            isPublic: Type.Boolean(),
            content: Type.Object({}, { additionalProperties: true }),
            config: Type.Optional(Type.Object({}, { additionalProperties: true })),
            variables: Type.Optional(Type.Array(Type.Object({
              name: Type.String(),
              type: Type.String(),
              required: Type.Boolean(),
              defaultValue: Type.Optional(Type.Object({}, { additionalProperties: true })),
              description: Type.Optional(Type.String()),
            }))),
            usageCount: Type.Number(),
            rating: Type.Optional(Type.Number()),
            preview: Type.Optional(Type.String()),
            tags: Type.Array(Type.String()),
            author: Type.Object({
              name: Type.String(),
              avatar: Type.Optional(Type.String()),
            }),
            versions: Type.Array(Type.Object({
              version: Type.String(),
              createdAt: Type.String(),
              changelog: Type.Optional(Type.String()),
            })),
            createdAt: Type.String(),
            updatedAt: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { uuid } = request.params as { uuid: string };

    try {
      const template = await fastify.prisma.template.findFirst({
        where: {
          uuid,
          tenantId: request.user!.tenantId,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhotoUrl: true,
            },
          },
          versions: {
            orderBy: { createdAt: 'desc' },
            select: {
              version: true,
              createdAt: true,
              changelog: true,
            },
          },
        },
      });

      if (!template) {
        return reply.code(404).send({
          success: false,
          error: 'TEMPLATE_NOT_FOUND',
        });
      }

      // Increment usage count
      await fastify.prisma.template.update({
        where: { tenantId: request.user.tenantId },
        data: { usageCount: { increment: 1 } },
      });

      return {
        success: true,
        data: {
          uuid: template.uuid,
          name: template.name,
          description: template.description,
          category: template.category,
          industry: template.industry,
          version: template.version,
          status: template.status,
          isPublic: template.isPublic,
          content: template.content,
          config: template.config,
          variables: template.variables as any,
          usageCount: template.usageCount + 1,
          rating: template.rating,
          preview: template.preview,
          tags: template.tags as string[],
          author: {
            id: template.author.uuid as UUID,
            name: `${template.author.firstName} ${template.author.lastName}`,
            avatar: template.author.profilePhotoUrl,
          },
          versions: template.versions.map(v => ({
            version: v.version,
            createdAt: v.createdAt.toISOString(),
            changelog: v.changelog,
          })),
          createdAt: template.createdAt.toISOString(),
          updatedAt: template.updatedAt.toISOString(),
        },
      };

    } catch (error: any) {
      request.log.error('Failed to get template', { error: error.message, uuid });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_GET_TEMPLATE',
      });
    }
  });

  // Create template
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('templates:create')],
    schema: {
      tags: ['tenant.content'],
      body: Type.Object({
        name: Type.String({ minLength: 1, maxLength: 100 }),
        description: Type.Optional(Type.String({ maxLength: 500 })),
        category: Type.String(),
        industry: Type.Optional(Type.String()),
        content: Type.Object({}, { additionalProperties: true }),
        config: Type.Optional(Type.Object({}, { additionalProperties: true })),
        variables: Type.Optional(Type.Array(Type.Object({
          name: Type.String(),
          type: Type.String(),
          required: Type.Boolean(),
          defaultValue: Type.Optional(Type.Object({}, { additionalProperties: true })),
          description: Type.Optional(Type.String()),
        }))),
        isPublic: Type.Optional(Type.Boolean({ default: false })),
        tags: Type.Optional(Type.Array(Type.String())),
        preview: Type.Optional(Type.String()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            uuid: uuidSchema,
            name: Type.String(),
            version: Type.String(),
            status: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const {
      name,
      description,
      category,
      industry,
      content,
      config,
      variables,
      isPublic = false,
      tags = [],
      preview,
    } = request.body;

    try {
      const template = await fastify.prisma.template.create({
        data: {
          tenantId: request.user!.tenantId,
          authorId: request.user!.id,
          name,
          description,
          category,
          industry,
          version: '1.0.0',
          status: 'draft',
          content,
          config,
          variables,
          isPublic,
          tags,
          preview,
          usageCount: 0,
        },
      });

      // Create initial version
      await fastify.prisma.templateVersion.create({
        data: {
          templateId: template.uuid as UUID,
          version: '1.0.0',
          content,
          config,
          variables,
          changelog: 'Initial version',
        },
      });

      request.log.info('Template created', {
        templateId: template.uuid as UUID,
        name,
        category,
      });

      return reply.code(201).send({
        success: true,
        data: {
          uuid: template.uuid,
          name: template.name,
          version: template.version,
          status: template.status,
        },
      });

    } catch (error: any) {
      request.log.error('Failed to create template', { error: error.message });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_CREATE_TEMPLATE',
      });
    }
  });

  // Update template
  fastify.patch('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('templates:update')],
    schema: {
      tags: ['tenant.content'],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
        description: Type.Optional(Type.String({ maxLength: 500 })),
        category: Type.Optional(Type.String()),
        industry: Type.Optional(Type.String()),
        content: Type.Optional(Type.Object({}, { additionalProperties: true })),
        config: Type.Optional(Type.Object({}, { additionalProperties: true })),
        variables: Type.Optional(Type.Array(Type.Object({
          name: Type.String(),
          type: Type.String(),
          required: Type.Boolean(),
          defaultValue: Type.Optional(Type.Object({}, { additionalProperties: true })),
          description: Type.Optional(Type.String()),
        }))),
        status: Type.Optional(Type.String()),
        isPublic: Type.Optional(Type.Boolean()),
        tags: Type.Optional(Type.Array(Type.String())),
        preview: Type.Optional(Type.String()),
        versionBump: Type.Optional(Type.String({ default: 'patch' })), // major, minor, patch
        changelog: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            uuid: uuidSchema,
            name: Type.String(),
            version: Type.String(),
            status: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { uuid } = request.params as { uuid: string };
    const {
      name,
      description,
      category,
      industry,
      content,
      config,
      variables,
      status,
      isPublic,
      tags,
      preview,
      versionBump = 'patch',
      changelog,
    } = request.body;

    try {
      const template = await fastify.prisma.template.findFirst({
        where: {
          uuid,
          tenantId: request.user!.tenantId,
        },
      });

      if (!template) {
        return reply.code(404).send({
          success: false,
          error: 'TEMPLATE_NOT_FOUND',
        });
      }

      // Check ownership
      if (template.authorId !== request.user!.id && !request.user!.roles.includes('admin')) {
        return reply.code(403).send({
          success: false,
          error: 'PERMISSION_DENIED',
        });
      }

      // Calculate new version if content changed
      let newVersion = template.version;
      if (content && content !== template.content) {
        const [major, minor, patch] = template.version.split('.').map(Number);
        switch (versionBump) {
          case 'major':
            newVersion = `${major + 1}.0.0`;
            break;
          case 'minor':
            newVersion = `${major}.${minor + 1}.0`;
            break;
          case 'patch':
          default:
            newVersion = `${major}.${minor}.${patch + 1}`;
            break;
        }
      }

      // Update template
      const updatedTemplate = await fastify.prisma.template.update({
        where: { tenantId: request.user.tenantId },
        data: {
          name: name ?? template.name,
          description: description ?? template.description,
          category: category ?? template.category,
          industry: industry ?? template.industry,
          content: content ?? template.content,
          config: config ?? template.config,
          variables: variables ?? template.variables,
          status: status ?? template.status,
          isPublic: isPublic ?? template.isPublic,
          tags: tags ?? template.tags,
          preview: preview ?? template.preview,
          version: newVersion,
          updatedAt: new Date(),
        },
      });

      // Create new version if content changed
      if (content && newVersion !== template.version) {
        await fastify.prisma.templateVersion.create({
          data: {
            templateId: template.uuid as UUID,
            version: newVersion,
            content,
            config: config ?? template.config,
            variables: variables ?? template.variables,
            changelog: changelog || `Updated to version ${newVersion}`,
          },
        });
      }

      request.log.info('Template updated', {
        templateId: template.uuid as UUID,
        oldVersion: template.version,
        newVersion,
      });

      return {
        success: true,
        data: {
          uuid: updatedTemplate.uuid,
          name: updatedTemplate.name,
          version: updatedTemplate.version,
          status: updatedTemplate.status,
        },
      };

    } catch (error: any) {
      request.log.error('Failed to update template', { error: error.message, uuid });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_UPDATE_TEMPLATE',
      });
    }
  });

  // Delete template
  fastify.delete('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('templates:delete')],
    schema: {
      tags: ['tenant.content'],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    const { uuid } = request.params as { uuid: string };

    try {
      const template = await fastify.prisma.template.findFirst({
        where: {
          uuid,
          tenantId: request.user!.tenantId,
        },
      });

      if (!template) {
        return reply.code(404).send({
          success: false,
          error: 'TEMPLATE_NOT_FOUND',
        });
      }

      // Check ownership
      if (template.authorId !== request.user!.id && !request.user!.roles.includes('admin')) {
        return reply.code(403).send({
          success: false,
          error: 'PERMISSION_DENIED',
        });
      }

      // Soft delete
      await fastify.prisma.template.update({
        where: { tenantId: request.user.tenantId },
        data: { 
          status: 'deleted',
          deletedAt: new Date(),
        },
      });

      request.log.info('Template deleted', {
        templateId: template.uuid as UUID,
        name: template.name,
      });

      return {
        success: true,
        message: 'Template deleted successfully',
      };

    } catch (error: any) {
      request.log.error('Failed to delete template', { error: error.message, uuid });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_DELETE_TEMPLATE',
      });
    }
  });

  // Clone template
  fastify.post('/:uuid/clone', {
    preHandler: [fastify.authenticate, fastify.requirePermission('templates:create')],
    schema: {
      tags: ['tenant.content'],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.String({ minLength: 1, maxLength: 100 }),
        description: Type.Optional(Type.String({ maxLength: 500 })),
        isPublic: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            uuid: uuidSchema,
            name: Type.String(),
            version: Type.String(),
            status: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { uuid } = request.params as { uuid: string };
    const { name, description, isPublic = false } = request.body;

    try {
      const originalTemplate = await fastify.prisma.template.findFirst({
        where: {
          uuid,
          tenantId: request.user!.tenantId,
          status: { not: 'deleted' },
        },
      });

      if (!originalTemplate) {
        return reply.code(404).send({
          success: false,
          error: 'TEMPLATE_NOT_FOUND',
        });
      }

      // Create cloned template
      const clonedTemplate = await fastify.prisma.template.create({
        data: {
          tenantId: request.user!.tenantId,
          authorId: request.user!.id,
          name,
          description: description || `Clone of ${originalTemplate.name}`,
          category: originalTemplate.category,
          industry: originalTemplate.industry,
          version: '1.0.0',
          status: 'draft',
          content: originalTemplate.content,
          config: originalTemplate.config,
          variables: originalTemplate.variables,
          isPublic,
          tags: originalTemplate.tags,
          preview: originalTemplate.preview,
          usageCount: 0,
        },
      });

      // Create initial version for cloned template
      await fastify.prisma.templateVersion.create({
        data: {
          templateId: clonedTemplate.uuid as UUID,
          version: '1.0.0',
          content: originalTemplate.content,
          config: originalTemplate.config,
          variables: originalTemplate.variables,
          changelog: `Cloned from ${originalTemplate.name}`,
        },
      });

      request.log.info('Template cloned', {
        originalId: originalTemplate.uuid as UUID,
        clonedId: clonedTemplate.uuid as UUID,
        name,
      });

      return reply.code(201).send({
        success: true,
        data: {
          uuid: clonedTemplate.uuid,
          name: clonedTemplate.name,
          version: clonedTemplate.version,
          status: clonedTemplate.status,
        },
      });

    } catch (error: any) {
      request.log.error('Failed to clone template', { error: error.message, uuid });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_CLONE_TEMPLATE',
      });
    }
  });

  // Rate template
  fastify.post('/:uuid/rate', {
    preHandler: [fastify.authenticate, fastify.requirePermission('templates:rate')],
    schema: {
      tags: ['tenant.content'],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        rating: Type.Number({ minimum: 1, maximum: 5 }),
        review: Type.Optional(Type.String({ maxLength: 1000 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            averageRating: Type.Number(),
            totalRatings: Type.Number(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { uuid } = request.params as { uuid: string };
    const { rating, review } = request.body;

    try {
      const template = await fastify.prisma.template.findFirst({
        where: {
          uuid,
          tenantId: request.user!.tenantId,
        },
      });

      if (!template) {
        return reply.code(404).send({
          success: false,
          error: 'TEMPLATE_NOT_FOUND',
        });
      }

      // Upsert rating
      await fastify.prisma.templateRating.upsert({
        where: { tenantId: request.user.tenantId, templateId_userId: {
            templateId: template.uuid as UUID,
            userId: request.user!.id, },
        },
        update: {
          rating,
          review,
          updatedAt: new Date(),
        },
        create: {
          templateId: template.uuid as UUID,
          userId: request.user!.id,
          rating,
          review,
        },
      });

      // Recalculate average rating
      const ratings = await fastify.prisma.templateRating.aggregate({
        where: { tenantId: request.user.tenantId, templateId: template.uuid as UUID },
        _avg: { rating: true },
        _count: { rating: true },
      });

      // Update template with new average
      await fastify.prisma.template.update({
        where: { tenantId: request.user.tenantId },
        data: { rating: ratings._avg.rating },
      });

      request.log.info('Template rated', {
        templateId: template.uuid as UUID,
        rating,
        userId: request.user!.id,
      });

      return {
        success: true,
        data: {
          averageRating: ratings._avg.rating || 0,
          totalRatings: ratings._count.rating,
        },
      };

    } catch (error: any) {
      request.log.error('Failed to rate template', { error: error.message, uuid });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_RATE_TEMPLATE',
      });
    }
  });
};