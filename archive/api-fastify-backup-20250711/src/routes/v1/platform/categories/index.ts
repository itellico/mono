import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import crypto from 'crypto';

const PlatformCategorySchema = Type.Object({
  uuid: uuidSchema,
  slug: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  parentId: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
  isActive: Type.Boolean(),
  isSystem: Type.Boolean(),
  childCount: Type.Number(),
  tagCount: Type.Number(),
  inheritedByTenants: Type.Number(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

const CategoryTreeNodeSchema = Type.Recursive((This) => Type.Object({
  uuid: uuidSchema,
  slug: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  isActive: Type.Boolean(),
  isSystem: Type.Boolean(),
  childCount: Type.Number(),
  tagCount: Type.Number(),
  children: Type.Array(This),
}));

export const platformCategoriesRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all platform categories
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.categories.read')
    ],
    schema: {
      tags: ['platform.categories'],
      summary: 'Get all platform-level categories',
      description: 'Retrieve all categories available at the platform level. These categories can be inherited by tenants.',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        parentId: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
        includeInherited: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            categories: Type.Array(PlatformCategorySchema),
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
    const { page = 1, limit = 20, search, parentId, includeInherited = false } = request.query;
    const offset = (page - 1) * limit;

    // Build where clause - platform categories have no tenantId/accountId
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

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    // Get categories with counts
    const [categories, total] = await Promise.all([
      fastify.prisma.category.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              children: true,
              tags: true,
            },
          },
        },
      }),
      fastify.prisma.category.count({ where }),
    ]);

    // Get inheritance counts if requested
    const inheritanceCounts = includeInherited ? 
      await fastify.prisma.categoryInheritance.groupBy({
        by: ['sourceCategoryId'],
        where: {
          sourceCategoryId: { in: categories.map(c => c.id) }
        },
        _count: {
          sourceCategoryId: true
        }
      }) : [];

    const inheritanceMap = new Map(
      inheritanceCounts.map(c => [c.sourceCategoryId, c._count.sourceCategoryId])
    );

    return {
      success: true,
      data: {
        categories: categories.map(category => ({
          uuid: category.uuid,
          slug: category.slug,
          name: category.name,
          description: category.description,
          parentId: category.parentId,
          isActive: category.isActive,
          isSystem: category.isSystem || false,
          childCount: category._count.children,
          tagCount: category._count.tags,
          inheritedByTenants: inheritanceMap.get(category.id) || 0,
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString(),
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

  // Get category tree
  fastify.get('/tree', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.categories.read')
    ],
    schema: {
      tags: ['platform.categories'],
      summary: 'Get platform category tree',
      description: 'Get hierarchical tree structure of platform categories',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tree: Type.Array(CategoryTreeNodeSchema),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    // Get all platform categories
    const categories = await fastify.prisma.category.findMany({
      where: {
        scope: 'platform',
        tenantId: null,
        accountId: null,
      },
      include: {
        _count: {
          select: {
            children: true,
            tags: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Build tree structure
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    const rootCategories: any[] = [];

    const buildNode = (category: any): any => ({
      uuid: category.uuid,
      slug: category.slug,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      isSystem: category.isSystem || false,
      childCount: category._count.children,
      tagCount: category._count.tags,
      children: categories
        .filter(c => c.parentId === category.id)
        .map(buildNode),
    });

    // Find root categories and build tree
    categories
      .filter(c => !c.parentId)
      .forEach(category => {
        rootCategories.push(buildNode(category));
      });

    return {
      success: true,
      data: {
        tree: rootCategories,
      },
    };
  });

  // Create platform category
  fastify.post('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.categories.create')
    ],
    schema: {
      tags: ['platform.categories'],
      summary: 'Create a platform-level category',
      description: 'Create a new category at the platform level that can be inherited by all tenants.',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        slug: Type.Optional(Type.String()),
        description: Type.Optional(Type.String()),
        parentId: Type.Optional(Type.Number()),
        isActive: Type.Optional(Type.Boolean({ default: true })),
        isSystem: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            category: PlatformCategorySchema,
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { name, description, parentId, isActive = true, isSystem = false } = request.body;
    let { slug } = request.body;

    // Auto-generate slug if not provided
    if (!slug) {
      slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Check if slug already exists at platform level
    const existingCategory = await fastify.prisma.category.findFirst({
      where: { 
        slug,
        scope: 'platform',
        tenantId: null,
        accountId: null
      },
    });

    if (existingCategory) {
      return reply.code(409).send({
        success: false,
        error: 'CATEGORY_SLUG_EXISTS',
        message: 'A platform category with this slug already exists',
      });
    }

    // Validate parent if provided
    if (parentId) {
      const parentCategory = await fastify.prisma.category.findFirst({
        where: {
          id: parentId,
          scope: 'platform',
          tenantId: null,
          accountId: null,
        },
      });

      if (!parentCategory) {
        return reply.code(400).send({
          success: false,
          error: 'INVALID_PARENT',
          message: 'Parent category not found or not a platform category',
        });
      }
    }

    const category = await fastify.prisma.category.create({
      data: {
        uuid: crypto.randomUUID(),
        name,
        slug,
        description,
        parentId,
        scope: 'platform',
        isActive,
        isSystem,
        createdBy: request.user!.id,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            children: true,
            tags: true,
          },
        },
      },
    });

    // Log platform category creation
    await fastify.prisma.audit_logs.create({
      data: {
        userId: request.user!.id,
        userUuid: request.user!.uuid,
        email: request.user!.email,
        action: 'PLATFORM_CATEGORY_CREATED',
        resource: 'category',
        resourceId: category.id.toString(),
        details: {
          categoryName: category.name,
          categorySlug: category.slug,
          scope: 'platform',
          parentId: category.parentId,
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      },
    });

    return reply.code(201).send({
      success: true,
      data: {
        category: {
          uuid: category.uuid,
          slug: category.slug,
          name: category.name,
          description: category.description,
          parentId: category.parentId,
          isActive: category.isActive,
          isSystem: category.isSystem || false,
          childCount: category._count.children,
          tagCount: category._count.tags,
          inheritedByTenants: 0,
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString(),
        },
      },
    });
  });

  // Update platform category
  fastify.patch('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.categories.update')
    ],
    schema: {
      tags: ['platform.categories'],
      summary: 'Update a platform-level category',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1 })),
        description: Type.Optional(Type.String()),
        parentId: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
        isActive: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            category: PlatformCategorySchema,
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);

    // Find platform category
    const existingCategory = await fastify.prisma.category.findFirst({
      where: {
        uuid,
        scope: 'platform',
        tenantId: null,
        accountId: null,
      },
    });

    if (!existingCategory) {
      return reply.code(404).send({
        success: false,
        error: 'CATEGORY_NOT_FOUND',
        message: 'Platform category not found',
      });
    }

    // Prevent modification of system categories by non-super-admins
    if (existingCategory.isSystem && !request.user!.roles.includes('super_admin')) {
      return reply.code(403).send({
        success: false,
        error: 'SYSTEM_CATEGORY_PROTECTED',
        message: 'Cannot modify system category',
      });
    }

    // Validate parent if changing
    if (request.body.parentId !== undefined && request.body.parentId !== existingCategory.parentId) {
      if (request.body.parentId === existingCategory.id) {
        return reply.code(400).send({
          success: false,
          error: 'CIRCULAR_REFERENCE',
          message: 'Category cannot be its own parent',
        });
      }

      if (request.body.parentId) {
        const parentCategory = await fastify.prisma.category.findFirst({
          where: {
            id: request.body.parentId,
            scope: 'platform',
            tenantId: null,
            accountId: null,
          },
        });

        if (!parentCategory) {
          return reply.code(400).send({
            success: false,
            error: 'INVALID_PARENT',
            message: 'Parent category not found or not a platform category',
          });
        }

        // Check for circular reference
        const checkCircular = async (catId: number, targetId: number): Promise<boolean> => {
          if (catId === targetId) return true;
          const cat = await fastify.prisma.category.findUnique({
            where: { id: catId },
            select: { parentId: true },
          });
          if (!cat || !cat.parentId) return false;
          return checkCircular(cat.parentId, targetId);
        };

        if (await checkCircular(request.body.parentId, existingCategory.id)) {
          return reply.code(400).send({
            success: false,
            error: 'CIRCULAR_REFERENCE',
            message: 'This would create a circular reference',
          });
        }
      }
    }

    // Update category
    const category = await fastify.prisma.category.update({
      where: { id: existingCategory.id },
      data: {
        ...request.body,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            children: true,
            tags: true,
          },
        },
      },
    });

    // Get inheritance count
    const inheritanceCount = await fastify.prisma.categoryInheritance.count({
      where: { sourceCategoryId: category.id }
    });

    return {
      success: true,
      data: {
        category: {
          uuid: category.uuid,
          slug: category.slug,
          name: category.name,
          description: category.description,
          parentId: category.parentId,
          isActive: category.isActive,
          isSystem: category.isSystem || false,
          childCount: category._count.children,
          tagCount: category._count.tags,
          inheritedByTenants: inheritanceCount,
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString(),
        },
      },
    };
  });

  // Delete platform category
  fastify.delete('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.categories.delete')
    ],
    schema: {
      tags: ['platform.categories'],
      summary: 'Delete a platform-level category',
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

    // Find platform category
    const category = await fastify.prisma.category.findFirst({
      where: {
        uuid,
        scope: 'platform',
        tenantId: null,
        accountId: null,
      },
      include: {
        _count: {
          select: {
            children: true,
            tags: true,
          },
        },
      },
    });

    if (!category) {
      return reply.code(404).send({
        success: false,
        error: 'CATEGORY_NOT_FOUND',
        message: 'Platform category not found',
      });
    }

    // Prevent deletion of system categories
    if (category.isSystem) {
      return reply.code(403).send({
        success: false,
        error: 'SYSTEM_CATEGORY_PROTECTED',
        message: 'Cannot delete system category',
      });
    }

    // Check if category has children
    if (category._count.children > 0) {
      return reply.code(409).send({
        success: false,
        error: 'CATEGORY_HAS_CHILDREN',
        message: `Cannot delete category with ${category._count.children} child categories`,
      });
    }

    // Check if category has been inherited
    const inheritanceCount = await fastify.prisma.categoryInheritance.count({
      where: { sourceCategoryId: category.id }
    });

    if (inheritanceCount > 0) {
      return reply.code(409).send({
        success: false,
        error: 'CATEGORY_INHERITED',
        message: `Cannot delete category that has been inherited by ${inheritanceCount} tenants`,
      });
    }

    // Delete category (tags associations will cascade)
    await fastify.prisma.category.delete({
      where: { id: category.id },
    });

    return {
      success: true,
      message: 'Platform category deleted successfully',
    };
  });

  // Grant platform category to specific tenants
  fastify.post('/:uuid/grant', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.categories.manage')
    ],
    schema: {
      tags: ['platform.categories'],
      summary: 'Grant platform category to specific tenants',
      description: 'Allow specific tenants to inherit and use a platform category.',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        tenantIds: Type.Array(Type.Number()),
        grantToAll: Type.Optional(Type.Boolean({ default: false })),
        includeChildren: Type.Optional(Type.Boolean({ default: true })),
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
    const { tenantIds, grantToAll = false, includeChildren = true } = request.body;

    // Find platform category
    const category = await fastify.prisma.category.findFirst({
      where: {
        uuid,
        scope: 'platform',
        tenantId: null,
        accountId: null,
      },
    });

    if (!category) {
      return reply.code(404).send({
        success: false,
        error: 'CATEGORY_NOT_FOUND',
        message: 'Platform category not found',
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

    // Get categories to grant (including children if requested)
    const categoriesToGrant = [category.id];
    if (includeChildren) {
      const getDescendants = async (parentId: number): Promise<number[]> => {
        const children = await fastify.prisma.category.findMany({
          where: {
            parentId,
            scope: 'platform',
            tenantId: null,
            accountId: null,
          },
          select: { id: true },
        });
        const childIds = children.map(c => c.id);
        const descendantIds = await Promise.all(childIds.map(getDescendants));
        return [...childIds, ...descendantIds.flat()];
      };
      const descendants = await getDescendants(category.id);
      categoriesToGrant.push(...descendants);
    }

    // Get existing inheritances
    const existingInheritances = await fastify.prisma.categoryInheritance.findMany({
      where: {
        sourceCategoryId: { in: categoriesToGrant },
        targetScope: 'tenant',
        targetTenantId: { in: targetTenantIds },
      },
    });

    const existingMap = new Set(
      existingInheritances.map(i => `${i.sourceCategoryId}-${i.targetTenantId}`)
    );

    // Create new inheritances
    const newInheritances: any[] = [];
    for (const categoryId of categoriesToGrant) {
      for (const tenantId of targetTenantIds) {
        const key = `${categoryId}-${tenantId}`;
        if (!existingMap.has(key)) {
          newInheritances.push({
            sourceCategoryId: categoryId,
            targetScope: 'tenant',
            targetTenantId: tenantId,
            inheritedBy: request.user!.id,
          });
        }
      }
    }

    if (newInheritances.length > 0) {
      await fastify.prisma.categoryInheritance.createMany({
        data: newInheritances,
      });
    }

    return {
      success: true,
      data: {
        granted: newInheritances.length,
        skipped: existingMap.size,
      },
    };
  });

  // Revoke platform category from tenants
  fastify.post('/:uuid/revoke', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.categories.manage')
    ],
    schema: {
      tags: ['platform.categories'],
      summary: 'Revoke platform category from tenants',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        tenantIds: Type.Array(Type.Number()),
        revokeFromAll: Type.Optional(Type.Boolean({ default: false })),
        includeChildren: Type.Optional(Type.Boolean({ default: true })),
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
    const { tenantIds, revokeFromAll = false, includeChildren = true } = request.body;

    // Find platform category
    const category = await fastify.prisma.category.findFirst({
      where: {
        uuid,
        scope: 'platform',
        tenantId: null,
        accountId: null,
      },
    });

    if (!category) {
      return reply.code(404).send({
        success: false,
        error: 'CATEGORY_NOT_FOUND',
        message: 'Platform category not found',
      });
    }

    // Get categories to revoke (including children if requested)
    const categoriesToRevoke = [category.id];
    if (includeChildren) {
      const getDescendants = async (parentId: number): Promise<number[]> => {
        const children = await fastify.prisma.category.findMany({
          where: {
            parentId,
            scope: 'platform',
            tenantId: null,
            accountId: null,
          },
          select: { id: true },
        });
        const childIds = children.map(c => c.id);
        const descendantIds = await Promise.all(childIds.map(getDescendants));
        return [...childIds, ...descendantIds.flat()];
      };
      const descendants = await getDescendants(category.id);
      categoriesToRevoke.push(...descendants);
    }

    // Build delete where clause
    const deleteWhere: any = {
      sourceCategoryId: { in: categoriesToRevoke },
      targetScope: 'tenant',
    };

    if (!revokeFromAll) {
      deleteWhere.targetTenantId = { in: tenantIds };
    }

    // Delete inheritances
    const result = await fastify.prisma.categoryInheritance.deleteMany({
      where: deleteWhere,
    });

    return {
      success: true,
      data: {
        revoked: result.count,
      },
    };
  });

  // Manage tags for platform category
  fastify.post('/:uuid/tags', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.categories.update')
    ],
    schema: {
      tags: ['platform.categories'],
      summary: 'Manage tags for a platform category',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        tagIds: Type.Array(Type.Number()),
        action: Type.Enum({ add: 'add', remove: 'remove', set: 'set' }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            added: Type.Number(),
            removed: Type.Number(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const { tagIds, action } = request.body;

    // Find platform category
    const category = await fastify.prisma.category.findFirst({
      where: {
        uuid,
        scope: 'platform',
        tenantId: null,
        accountId: null,
      },
    });

    if (!category) {
      return reply.code(404).send({
        success: false,
        error: 'CATEGORY_NOT_FOUND',
        message: 'Platform category not found',
      });
    }

    // Verify all tags are platform tags
    const tags = await fastify.prisma.tag.findMany({
      where: {
        id: { in: tagIds },
        scope: 'platform',
        tenantId: null,
        accountId: null,
      },
    });

    if (tags.length !== tagIds.length) {
      return reply.code(400).send({
        success: false,
        error: 'INVALID_TAGS',
        message: 'Some tags are not valid platform tags',
      });
    }

    let added = 0;
    let removed = 0;

    if (action === 'set') {
      // Remove all existing tags
      const deleteResult = await fastify.prisma.categoryTag.deleteMany({
        where: {
          categoryId: category.id,
          scope: 'platform',
        },
      });
      removed = deleteResult.count;

      // Add new tags
      if (tagIds.length > 0) {
        const createResult = await fastify.prisma.categoryTag.createMany({
          data: tagIds.map(tagId => ({
            categoryId: category.id,
            tagId,
            scope: 'platform',
            createdBy: request.user!.id,
          })),
          skipDuplicates: true,
        });
        added = createResult.count;
      }
    } else if (action === 'add') {
      // Add tags
      const createResult = await fastify.prisma.categoryTag.createMany({
        data: tagIds.map(tagId => ({
          categoryId: category.id,
          tagId,
          scope: 'platform',
          createdBy: request.user!.id,
        })),
        skipDuplicates: true,
      });
      added = createResult.count;
    } else if (action === 'remove') {
      // Remove tags
      const deleteResult = await fastify.prisma.categoryTag.deleteMany({
        where: {
          categoryId: category.id,
          tagId: { in: tagIds },
          scope: 'platform',
        },
      });
      removed = deleteResult.count;
    }

    return {
      success: true,
      data: {
        added,
        removed,
      },
    };
  });
};