import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import crypto from 'crypto';

const PlatformTagSchema = Type.Object({
  uuid: uuidSchema,
  slug: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  category: Type.Optional(Type.String()),
  isActive: Type.Boolean(),
  isSystem: Type.Boolean(),
  usageCount: Type.Number(),
  inheritedByTenants: Type.Number(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const platformTagsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all platform tags
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.tags.read')
    ],
    schema: {
      tags: ['platform.tags'],
      summary: 'Get all platform-level tags',
      description: 'Retrieve all tags available at the platform level. These tags can be inherited by tenants.',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
        includeInherited: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tags: Type.Array(PlatformTagSchema),
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
    const { page = 1, limit = 20, search, category, includeInherited = false } = request.query;
    const offset = (page - 1) * limit;

    // Build where clause - platform tags have no tenantId/accountId
    const where: any = {
      scope: 'platform',
      tenantId: null,
      accountId: null,
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

    // Get tags with inheritance count
    const [tags, total] = await Promise.all([
      fastify.prisma.tag.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { name: 'asc' },
        include: includeInherited ? {
          inheritances: {
            select: {
              targetTenantId: true,
            },
          },
        } : undefined,
      }),
      fastify.prisma.tag.count({ where }),
    ]);

    // Get inheritance counts
    const inheritanceCounts = includeInherited ? 
      await fastify.prisma.tagInheritance.groupBy({
        by: ['sourceTagId'],
        where: {
          sourceTagId: { in: tags.map(t => t.id) }
        },
        _count: {
          sourceTagId: true
        }
      }) : [];

    const inheritanceMap = new Map(
      inheritanceCounts.map(c => [c.sourceTagId, c._count.sourceTagId])
    );

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
          usageCount: tag.usageCount || 0,
          inheritedByTenants: inheritanceMap.get(tag.id) || 0,
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

  // Create platform tag
  fastify.post('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.tags.create')
    ],
    schema: {
      tags: ['platform.tags'],
      summary: 'Create a platform-level tag',
      description: 'Create a new tag at the platform level that can be inherited by all tenants.',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        slug: Type.Optional(Type.String()),
        description: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
        isActive: Type.Optional(Type.Boolean({ default: true })),
        isSystem: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tag: PlatformTagSchema,
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { name, description, category, isActive = true, isSystem = false } = request.body;
    let { slug } = request.body;

    // Auto-generate slug if not provided
    if (!slug) {
      slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Check if slug already exists at platform level
    const existingTag = await fastify.prisma.tag.findFirst({
      where: { 
        slug,
        scope: 'platform',
        tenantId: null,
        accountId: null
      },
    });

    if (existingTag) {
      return reply.code(409).send({
        success: false,
        error: 'TAG_SLUG_EXISTS',
        message: 'A platform tag with this slug already exists',
      });
    }

    const tag = await fastify.prisma.tag.create({
      data: {
        uuid: crypto.randomUUID(),
        name,
        slug,
        description,
        category,
        scope: 'platform',
        isActive,
        isSystem,
        createdBy: request.user!.id,
        updatedAt: new Date(),
      },
    });

    // Log platform tag creation
    await fastify.prisma.audit_logs.create({
      data: {
        userId: request.user!.id,
        userUuid: request.user!.uuid,
        email: request.user!.email,
        action: 'PLATFORM_TAG_CREATED',
        resource: 'tag',
        resourceId: tag.id.toString(),
        details: {
          tagName: tag.name,
          tagSlug: tag.slug,
          scope: 'platform',
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
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
          usageCount: tag.usageCount || 0,
          inheritedByTenants: 0,
          createdAt: tag.createdAt.toISOString(),
          updatedAt: tag.updatedAt.toISOString(),
        },
      },
    });
  });

  // Update platform tag
  fastify.patch('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.tags.update')
    ],
    schema: {
      tags: ['platform.tags'],
      summary: 'Update a platform-level tag',
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
            tag: PlatformTagSchema,
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);

    // Find platform tag
    const existingTag = await fastify.prisma.tag.findFirst({
      where: {
        uuid,
        scope: 'platform',
        tenantId: null,
        accountId: null,
      },
    });

    if (!existingTag) {
      return reply.code(404).send({
        success: false,
        error: 'TAG_NOT_FOUND',
        message: 'Platform tag not found',
      });
    }

    // Prevent modification of system tags by non-super-admins
    if (existingTag.isSystem && !request.user!.roles.includes('super_admin')) {
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

    // Get inheritance count
    const inheritanceCount = await fastify.prisma.tagInheritance.count({
      where: { sourceTagId: tag.id }
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
          inheritedByTenants: inheritanceCount,
          createdAt: tag.createdAt.toISOString(),
          updatedAt: tag.updatedAt.toISOString(),
        },
      },
    };
  });

  // Delete platform tag
  fastify.delete('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.tags.delete')
    ],
    schema: {
      tags: ['platform.tags'],
      summary: 'Delete a platform-level tag',
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

    // Find platform tag
    const tag = await fastify.prisma.tag.findFirst({
      where: {
        uuid,
        scope: 'platform',
        tenantId: null,
        accountId: null,
      },
    });

    if (!tag) {
      return reply.code(404).send({
        success: false,
        error: 'TAG_NOT_FOUND',
        message: 'Platform tag not found',
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

    // Check if tag has been inherited
    const inheritanceCount = await fastify.prisma.tagInheritance.count({
      where: { sourceTagId: tag.id }
    });

    if (inheritanceCount > 0) {
      return reply.code(409).send({
        success: false,
        error: 'TAG_INHERITED',
        message: `Cannot delete tag that has been inherited by ${inheritanceCount} tenants`,
      });
    }

    // Delete tag
    await fastify.prisma.tag.delete({
      where: { id: tag.id },
    });

    return {
      success: true,
      message: 'Platform tag deleted successfully',
    };
  });

  // Grant platform tag to specific tenants
  fastify.post('/:uuid/grant', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.tags.manage')
    ],
    schema: {
      tags: ['platform.tags'],
      summary: 'Grant platform tag to specific tenants',
      description: 'Allow specific tenants to inherit and use a platform tag.',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        tenantIds: Type.Array(Type.Number()),
        grantToAll: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            granted: Type.Number(),
            skipped: Type.Number(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const { tenantIds, grantToAll = false } = request.body;

    // Find platform tag
    const tag = await fastify.prisma.tag.findFirst({
      where: {
        uuid,
        scope: 'platform',
        tenantId: null,
        accountId: null,
      },
    });

    if (!tag) {
      return reply.code(404).send({
        success: false,
        error: 'TAG_NOT_FOUND',
        message: 'Platform tag not found',
      });
    }

    let targetTenantIds = tenantIds;

    // If grantToAll, get all active tenants
    if (grantToAll) {
      const allTenants = await fastify.prisma.tenant.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      targetTenantIds = allTenants.map(t => t.id);
    }

    // Get existing inheritances
    const existingInheritances = await fastify.prisma.tagInheritance.findMany({
      where: {
        sourceTagId: tag.id,
        targetScope: 'tenant',
        targetTenantId: { in: targetTenantIds },
      },
    });

    const existingTenantIds = new Set(existingInheritances.map(i => i.targetTenantId));
    const newTenantIds = targetTenantIds.filter(id => !existingTenantIds.has(id));

    // Create new inheritances
    if (newTenantIds.length > 0) {
      await fastify.prisma.tagInheritance.createMany({
        data: newTenantIds.map(tenantId => ({
          sourceTagId: tag.id,
          targetScope: 'tenant',
          targetTenantId: tenantId,
          inheritedBy: request.user!.id,
        })),
      });
    }

    return {
      success: true,
      data: {
        granted: newTenantIds.length,
        skipped: existingTenantIds.size,
      },
    };
  });

  // Revoke platform tag from tenants
  fastify.post('/:uuid/revoke', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.tags.manage')
    ],
    schema: {
      tags: ['platform.tags'],
      summary: 'Revoke platform tag from tenants',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        tenantIds: Type.Array(Type.Number()),
        revokeFromAll: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            revoked: Type.Number(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const { tenantIds, revokeFromAll = false } = request.body;

    // Find platform tag
    const tag = await fastify.prisma.tag.findFirst({
      where: {
        uuid,
        scope: 'platform',
        tenantId: null,
        accountId: null,
      },
    });

    if (!tag) {
      return reply.code(404).send({
        success: false,
        error: 'TAG_NOT_FOUND',
        message: 'Platform tag not found',
      });
    }

    // Build delete where clause
    const deleteWhere: any = {
      sourceTagId: tag.id,
      targetScope: 'tenant',
    };

    if (!revokeFromAll) {
      deleteWhere.targetTenantId = { in: tenantIds };
    }

    // Delete inheritances
    const result = await fastify.prisma.tagInheritance.deleteMany({
      where: deleteWhere,
    });

    return {
      success: true,
      data: {
        revoked: result.count,
      },
    };
  });

  // Get tag categories at platform level
  fastify.get('/categories', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.tags.read')
    ],
    schema: {
      tags: ['platform.tags'],
      summary: 'Get distinct tag categories',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            categories: Type.Array(Type.String()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const categories = await fastify.prisma.tag.findMany({
      where: {
        scope: 'platform',
        tenantId: null,
        accountId: null,
        category: { not: null },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc',
      },
    });

    return {
      success: true,
      data: {
        categories: categories.map(c => c.category!).filter(Boolean),
      },
    };
  });
};