import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import crypto from 'crypto';

const CategorySchema = Type.Object({
  uuid: uuidSchema,
  slug: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  parentId: Type.Optional(Type.Number()),
  isActive: Type.Boolean(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

const CategoryWithRelationsSchema = Type.Object({
  uuid: uuidSchema,
  slug: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  parentId: Type.Optional(Type.Number()),
  isActive: Type.Boolean(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  parent: Type.Optional(CategorySchema),
  children: Type.Optional(Type.Array(CategorySchema)),
});

export const categoriesRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all categories with filtering and pagination
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.categories.read')
    ],
    schema: {
      tags: ['tenant.categories'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        parentId: Type.Optional(Type.Number()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            categories: Type.Array(CategorySchema),
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
    const { page = 1, limit = 20, search, parentId } = request.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (parentId !== undefined) {
      where.parentId = parentId === 0 ? null : parentId;
    }

    // Get categories with count
    const [categories, total] = await Promise.all([
      fastify.prisma.category.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      fastify.prisma.category.count({ where }),
    ]);

    return {
      success: true,
      data: {
        categories: categories.map(cat => ({
          uuid: cat.uuid,
          slug: cat.slug,
          name: cat.name,
          description: cat.description,
          parentId: cat.parentId,
          isActive: cat.isActive,
          createdAt: cat.createdAt.toISOString(),
          updatedAt: cat.updatedAt.toISOString(),
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
      fastify.requirePermission('tenant.categories.read')
    ],
    schema: {
      tags: ['tenant.categories'],
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tree: Type.Array(Type.Any()), // Recursive structure
          }),
        }),
      },
    },
  }, async (request, reply) => {
    // Get all active categories
    const categories = await fastify.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // Build tree structure
    const buildTree = (parentId: number | null = null): any[] => {
      return categories
        .filter(cat => cat.parentId === parentId)
        .map(cat => ({
          uuid: cat.uuid,
          slug: cat.slug,
          name: cat.name,
          description: cat.description,
          children: buildTree(cat.id),
        }));
    };

    return {
      success: true,
      data: {
        tree: buildTree(),
      },
    };
  });

  // Get category by UUID
  fastify.get('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.categories.read')
    ],
    schema: {
      tags: ['tenant.categories'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            category: CategoryWithRelationsSchema,
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);

    const category = await fastify.prisma.category.findFirst({
      where: { uuid },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      return reply.code(404).send({
        success: false,
        error: 'CATEGORY_NOT_FOUND',
        message: 'Category not found',
      });
    }

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
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString(),
          parent: category.parent ? {
            uuid: category.parent.uuid,
            slug: category.parent.slug,
            name: category.parent.name,
            description: category.parent.description,
            parentId: category.parent.parentId,
            isActive: category.parent.isActive,
            createdAt: category.parent.createdAt.toISOString(),
            updatedAt: category.parent.updatedAt.toISOString(),
          } : undefined,
          children: category.children?.map(child => ({
            uuid: child.uuid,
            slug: child.slug,
            name: child.name,
            description: child.description,
            parentId: child.parentId,
            isActive: child.isActive,
            createdAt: child.createdAt.toISOString(),
            updatedAt: child.updatedAt.toISOString(),
          })),
        },
      },
    };
  });

  // Create category
  fastify.post('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.categories.create')
    ],
    schema: {
      tags: ['tenant.categories'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        slug: Type.Optional(Type.String()),
        description: Type.Optional(Type.String()),
        parentId: Type.Optional(Type.Number()),
        isActive: Type.Optional(Type.Boolean({ default: true })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            category: CategorySchema,
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { name, description, parentId, isActive = true } = request.body;
    let { slug } = request.body;

    // Auto-generate slug if not provided
    if (!slug) {
      slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Check if slug already exists
    const existingCategory = await fastify.prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      return reply.code(409).send({
        success: false,
        error: 'CATEGORY_SLUG_EXISTS',
        message: 'A category with this slug already exists',
      });
    }

    const category = await fastify.prisma.category.create({
      data: {
        uuid: crypto.randomUUID(),
        name,
        slug,
        description,
        parentId,
        isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
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
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString(),
        },
      },
    });
  });

  // Update category
  fastify.patch('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.categories.update')
    ],
    schema: {
      tags: ['tenant.categories'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1 })),
        description: Type.Optional(Type.String()),
        parentId: Type.Optional(Type.Number()),
        isActive: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            category: CategorySchema,
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);

    // Find category
    const existingCategory = await fastify.prisma.category.findFirst({
      where: { uuid },
    });

    if (!existingCategory) {
      return reply.code(404).send({
        success: false,
        error: 'CATEGORY_NOT_FOUND',
        message: 'Category not found',
      });
    }

    // Check for circular parent reference if parentId is being updated
    if (request.body.parentId !== undefined) {
      const wouldCreateCircularReference = async (categoryId: number, newParentId: number): Promise<boolean> => {
        if (categoryId === newParentId) return true;
        
        const parent = await fastify.prisma.category.findUnique({
          where: { id: newParentId },
        });
        
        if (!parent || !parent.parentId) return false;
        return wouldCreateCircularReference(categoryId, parent.parentId);
      };

      if (await wouldCreateCircularReference(existingCategory.id, request.body.parentId)) {
        return reply.code(400).send({
          success: false,
          error: 'CIRCULAR_REFERENCE',
          message: 'Cannot create circular parent reference',
        });
      }
    }

    // Update category
    const category = await fastify.prisma.category.update({
      where: { id: existingCategory.id },
      data: {
        ...request.body,
        updatedAt: new Date(),
      },
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
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString(),
        },
      },
    };
  });

  // Delete category
  fastify.delete('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.categories.delete')
    ],
    schema: {
      tags: ['tenant.categories'],
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

    // Find category
    const category = await fastify.prisma.category.findFirst({
      where: { uuid },
      include: {
        children: true,
      },
    });

    if (!category) {
      return reply.code(404).send({
        success: false,
        error: 'CATEGORY_NOT_FOUND',
        message: 'Category not found',
      });
    }

    // Check if category has children
    if (category.children && category.children.length > 0) {
      return reply.code(409).send({
        success: false,
        error: 'CATEGORY_HAS_CHILDREN',
        message: 'Cannot delete category that has children',
      });
    }

    // Delete category
    await fastify.prisma.category.delete({
      where: { id: category.id },
    });

    return {
      success: true,
      message: 'Category deleted successfully',
    };
  });

  // Assign tags to category
  fastify.post('/:uuid/tags', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.categories.update')
    ],
    schema: {
      tags: ['tenant.categories'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        tagIds: Type.Array(Type.Number()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            assigned: Type.Number(),
            skipped: Type.Number(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const { tagIds } = request.body;

    // Find category
    const category = await fastify.prisma.category.findFirst({
      where: { uuid },
    });

    if (!category) {
      return reply.code(404).send({
        success: false,
        error: 'CATEGORY_NOT_FOUND',
        message: 'Category not found',
      });
    }

    // Get existing tag assignments
    const existingAssignments = await fastify.prisma.categoryTag.findMany({
      where: {
        categoryId: category.id,
        tagId: { in: tagIds },
      },
    });

    const existingTagIds = new Set(existingAssignments.map(a => a.tagId));
    const newTagIds = tagIds.filter(id => !existingTagIds.has(id));

    // Create new assignments
    if (newTagIds.length > 0) {
      await fastify.prisma.categoryTag.createMany({
        data: newTagIds.map(tagId => ({
          categoryId: category.id,
          tagId,
        })),
        skipDuplicates: true,
      });
    }

    return {
      success: true,
      data: {
        assigned: newTagIds.length,
        skipped: existingTagIds.size,
      },
    };
  });
};

// Add missing Prisma relations
declare module '@prisma/client' {
  interface Category {
    parent?: Category | null;
    children?: Category[];
  }
}