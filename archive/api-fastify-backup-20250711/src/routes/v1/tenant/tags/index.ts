import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { TagService } from '@/services/tag.service';
import crypto from 'crypto';

const TenantTagSchema = Type.Object({
  uuid: uuidSchema,
  slug: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  category: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  isActive: Type.Boolean(),
  isSystem: Type.Boolean(),
  inheritedFrom: Type.Optional(Type.Union([Type.Literal('platform'), Type.Null()])),
  usageCount: Type.Number(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const tagsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all tags with filtering and pagination
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.tags.read')
    ],
    schema: {
      tags: ['tenant.tags'],
      summary: 'Get all tenant-level tags',
      description: 'Retrieve all tags available at the tenant level, including inherited platform tags.',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
        includeInherited: Type.Optional(Type.Boolean({ default: true })),
        ownOnly: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tags: Type.Array(TenantTagSchema),
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
  }, async (request, reply) => {
    const { page = 1, limit = 20, search, category, includeInherited = true, ownOnly = false } = request.query;
    const offset = (page - 1) * limit;
    const tenantId = request.user!.tenantId;
    const tagService = new TagService(fastify.prisma);

    // If ownOnly, just get tenant's own tags
    if (ownOnly) {
      const where: any = {
        scope: 'tenant',
        tenantId,
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (category) {
        where.category = category;
      }

      const [tags, total] = await Promise.all([
        fastify.prisma.tag.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        fastify.prisma.tag.count({ where }),
      ]);

      return {
        success: true,
        data: {
          tags: tags.map(tag => ({
            uuid: tag.uuid,
            slug: tag.slug,
            name: tag.name,
            description: tag.description,
            category: tag.category,
            isActive: tag.isActive,
            isSystem: tag.isSystem || false,
            inheritedFrom: null,
            usageCount: tag.usageCount || 0,
            createdAt: tag.createdAt.toISOString(),
            updatedAt: tag.updatedAt.toISOString(),
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    }

    // Get all tags including inherited
    const allTags = await tagService.getTags('tenant', tenantId, {
      search,
      category,
      includeInherited,
    });

    // Apply pagination
    const paginatedTags = allTags.slice(offset, offset + limit);
    const total = allTags.length;

    return {
      success: true,
      data: {
        tags: paginatedTags.map(tag => ({
          uuid: tag.uuid,
          slug: tag.slug,
          name: tag.name,
          description: tag.description,
          category: tag.category,
          isActive: tag.isActive,
          isSystem: tag.isSystem || false,
          inheritedFrom: tag.inheritedFrom || null,
          usageCount: tag.usageCount || 0,
          createdAt: tag.createdAt.toISOString(),
          updatedAt: tag.updatedAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  });

  // Get tag by UUID
  fastify.get('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.tags.read')
    ],
    schema: {
      tags: ['tenant.tags'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tag: TenantTagSchema,
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const tenantId = request.user!.tenantId;
    const tagService = new TagService(fastify.prisma);

    // First check tenant's own tags
    const tag = await fastify.prisma.tag.findFirst({
      where: {
        uuid,
        OR: [
          { scope: 'tenant', tenantId },
          { scope: 'platform', tenantId: null },
        ],
      },
    });

    if (!tag) {
      return reply.code(404).send({
        success: false,
        error: 'TAG_NOT_FOUND',
        message: 'Tag not found',
      });
    }

    // Check if it's an inherited tag
    let inheritedFrom = null;
    if (tag.scope === 'platform') {
      const inheritance = await fastify.prisma.tagInheritance.findFirst({
        where: {
          sourceTagId: tag.id,
          targetScope: 'tenant',
          targetTenantId: tenantId,
        },
      });
      if (inheritance) {
        inheritedFrom = 'platform';
      } else if (tag.scope === 'platform') {
        // Platform tag not inherited - not accessible
        return reply.code(404).send({
          success: false,
          error: 'TAG_NOT_FOUND',
          message: 'Tag not found',
        });
      }
    }

    return {
      success: true,
      data: {
        tag: {
          uuid: tag.uuid,
          slug: tag.slug,
          name: tag.name,
          description: tag.description,
          category: tag.category,
          isActive: tag.isActive,
          isSystem: tag.isSystem || false,
          inheritedFrom,
          usageCount: tag.usageCount || 0,
          createdAt: tag.createdAt.toISOString(),
          updatedAt: tag.updatedAt.toISOString(),
        },
      },
    };
  });

  // Create tag
  fastify.post('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.tags.create')
    ],
    schema: {
      tags: ['tenant.tags'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        slug: Type.Optional(Type.String()),
        description: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
        isActive: Type.Optional(Type.Boolean({ default: true })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tag: TenantTagSchema,
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { name, description, category, isActive = true } = request.body;
    let { slug } = request.body;

    // Auto-generate slug if not provided
    if (!slug) {
      slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Check if slug already exists at tenant level
    const existingTag = await fastify.prisma.tag.findFirst({
      where: { 
        slug,
        scope: 'tenant',
        tenantId: request.user!.tenantId,
      },
    });

    if (existingTag) {
      return reply.code(409).send({
        success: false,
        error: 'TAG_SLUG_EXISTS',
        message: 'A tag with this slug already exists',
      });
    }

    const tag = await fastify.prisma.tag.create({
      data: {
        uuid: crypto.randomUUID(),
        name,
        slug,
        description,
        category,
        scope: 'tenant',
        isActive,
        tenantId: request.user!.tenantId,
        createdBy: request.user!.id,
        updatedAt: new Date(),
      },
    });

    return reply.code(201).send({
      success: true,
      data: {
        tag: {
          uuid: tag.uuid,
          slug: tag.slug,
          name: tag.name,
          description: tag.description,
          category: tag.category,
          isActive: tag.isActive,
          isSystem: tag.isSystem || false,
          inheritedFrom: null,
          usageCount: tag.usageCount || 0,
          createdAt: tag.createdAt.toISOString(),
          updatedAt: tag.updatedAt.toISOString(),
        },
      },
    });
  });

  // Update tag
  fastify.patch('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.tags.update')
    ],
    schema: {
      tags: ['tenant.tags'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1 })),
        description: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
        isActive: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tag: TenantTagSchema,
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);

    // Find tag
    const existingTag = await fastify.prisma.tag.findFirst({
      where: {
        uuid,
        tenantId: request.user!.tenantId,
      },
    });

    if (!existingTag) {
      return reply.code(404).send({
        success: false,
        error: 'TAG_NOT_FOUND',
        message: 'Tag not found',
      });
    }

    // Prevent modification of system tags
    if (existingTag.isSystem) {
      return reply.code(403).send({
        success: false,
        error: 'SYSTEM_TAG_PROTECTED',
        message: 'Cannot modify system tag',
      });
    }

    // Update tag
    const tag = await fastify.prisma.tag.update({
      where: { id: existingTag.id },
      data: {
        ...request.body,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        tag: {
          uuid: tag.uuid,
          slug: tag.slug,
          name: tag.name,
          description: tag.description,
          category: tag.category,
          isActive: tag.isActive,
          isSystem: tag.isSystem || false,
          usageCount: tag.usageCount || 0,
          createdAt: tag.createdAt.toISOString(),
          updatedAt: tag.updatedAt.toISOString(),
        },
      },
    };
  });

  // Delete tag
  fastify.delete('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.tags.delete')
    ],
    schema: {
      tags: ['tenant.tags'],
      security: [{ bearerAuth: [] }],
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
    const uuid = toUUID(request.params.uuid);

    // Find tag
    const tag = await fastify.prisma.tag.findFirst({
      where: {
        uuid,
        tenantId: request.user!.tenantId,
      },
    });

    if (!tag) {
      return reply.code(404).send({
        success: false,
        error: 'TAG_NOT_FOUND',
        message: 'Tag not found',
      });
    }

    // Prevent deletion of system tags
    if (tag.isSystem) {
      return reply.code(403).send({
        success: false,
        error: 'SYSTEM_TAG_PROTECTED',
        message: 'Cannot delete system tag',
      });
    }

    // Check if tag is in use
    if (tag.usageCount && tag.usageCount > 0) {
      return reply.code(409).send({
        success: false,
        error: 'TAG_IN_USE',
        message: 'Cannot delete tag that is in use',
      });
    }

    // Delete tag
    await fastify.prisma.tag.delete({
      where: { id: tag.id },
    });

    return {
      success: true,
      message: 'Tag deleted successfully',
    };
  });

  // Bulk create tags
  fastify.post('/bulk', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.tags.create')
    ],
    schema: {
      tags: ['tenant.tags'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        tags: Type.Array(Type.Object({
          name: Type.String({ minLength: 1 }),
          slug: Type.Optional(Type.String()),
          category: Type.Optional(Type.String()),
        })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            created: Type.Number(),
            tags: Type.Array(TenantTagSchema),
          }),
        }),
        207: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            created: Type.Number(),
            failed: Type.Number(),
            tags: Type.Array(TenantTagSchema),
            errors: Type.Array(Type.Object({
              tag: Type.String(),
              error: Type.String(),
            })),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { tags: tagsToCreate } = request.body;
    const createdTags = [];
    const errors = [];

    for (const tagData of tagsToCreate) {
      try {
        let slug = tagData.slug;
        if (!slug) {
          slug = tagData.name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        }

        const tag = await fastify.prisma.tag.create({
          data: {
            uuid: crypto.randomUUID(),
            name: tagData.name,
            slug,
            category: tagData.category,
            isActive: true,
            tenantId: request.user!.tenantId,
            createdBy: request.user!.id,
            updatedAt: new Date(),
          },
        });

        createdTags.push({
          uuid: tag.uuid,
          slug: tag.slug,
          name: tag.name,
          description: tag.description,
          category: tag.category,
          isActive: tag.isActive,
          isSystem: tag.isSystem || false,
          usageCount: tag.usageCount || 0,
          createdAt: tag.createdAt.toISOString(),
          updatedAt: tag.updatedAt.toISOString(),
        });
      } catch (error: any) {
        errors.push({
          tag: tagData.name,
          error: error.message,
        });
      }
    }

    if (errors.length > 0) {
      return reply.code(207).send({
        success: true,
        data: {
          created: createdTags.length,
          failed: errors.length,
          tags: createdTags,
          errors,
        },
      });
    }

    return reply.code(201).send({
      success: true,
      data: {
        created: createdTags.length,
        tags: createdTags,
      },
    });
  });
};

// Add missing crypto import
import crypto from 'crypto';