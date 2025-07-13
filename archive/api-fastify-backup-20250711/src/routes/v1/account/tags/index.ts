import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import crypto from 'crypto';

const AccountTagSchema = Type.Object({
  uuid: uuidSchema,
  slug: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  category: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  isActive: Type.Boolean(),
  inheritedFrom: Type.Optional(Type.Union([Type.Enum({ platform: 'platform', tenant: 'tenant' }), Type.Null()])),
  usageCount: Type.Number(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const accountTagsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all account tags (including inherited)
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('account.tags.read')
    ],
    schema: {
      tags: ['account.tags'],
      summary: 'Get all account-level tags',
      description: 'Retrieve all tags available at the account level, including inherited tags from platform and tenant.',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
        showInherited: Type.Optional(Type.Boolean({ default: true })),
        ownOnly: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tags: Type.Array(AccountTagSchema),
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
    const { page = 1, limit = 20, search, category, showInherited = true, ownOnly = false } = request.query;
    const offset = (page - 1) * limit;
    const accountId = request.user!.accountId;
    const tenantId = request.user!.tenantId;

    // Build base where clause for account tags
    const baseWhere: any = {
      scope: 'account',
      accountId,
    };

    if (search) {
      baseWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      baseWhere.category = category;
    }

    let tags: any[] = [];
    let total = 0;

    if (ownOnly) {
      // Only get account's own tags
      [tags, total] = await Promise.all([
        fastify.prisma.tag.findMany({
          where: baseWhere,
          skip: offset,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        fastify.prisma.tag.count({ where: baseWhere }),
      ]);
    } else {
      // Get account's own tags
      const accountTags = await fastify.prisma.tag.findMany({
        where: baseWhere,
      });

      // Get inherited tags if requested
      let inheritedTags: any[] = [];
      
      if (showInherited) {
        // Get inherited tags from tenant
        const tenantInheritances = await fastify.prisma.tagInheritance.findMany({
          where: {
            targetScope: 'account',
            targetAccountId: accountId,
          },
          include: {
            sourceTag: true,
          },
        });

        // Get tenant's own tags
        const tenantTags = await fastify.prisma.tag.findMany({
          where: {
            scope: 'tenant',
            tenantId,
            ...(search && {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
              ],
            }),
            ...(category && { category }),
          },
        });

        // Get platform tags inherited by tenant
        const platformInheritances = await fastify.prisma.tagInheritance.findMany({
          where: {
            targetScope: 'tenant',
            targetTenantId: tenantId,
          },
          include: {
            sourceTag: {
              where: {
                ...(search && {
                  OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { slug: { contains: search, mode: 'insensitive' } },
                  ],
                }),
                ...(category && { category }),
              },
            },
          },
        });

        inheritedTags = [
          ...tenantInheritances.map(i => ({ ...i.sourceTag, inheritedFrom: i.sourceTag.scope })),
          ...tenantTags.map(t => ({ ...t, inheritedFrom: 'tenant' })),
          ...platformInheritances.filter(i => i.sourceTag).map(i => ({ ...i.sourceTag, inheritedFrom: 'platform' })),
        ];
      }

      // Combine and deduplicate tags
      const allTags = [...accountTags, ...inheritedTags];
      const uniqueTags = Array.from(
        new Map(allTags.map(t => [t.slug, t])).values()
      );

      // Apply pagination
      tags = uniqueTags
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(offset, offset + limit);
      total = uniqueTags.length;
    }

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

  // Create account tag
  fastify.post('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('account.tags.create')
    ],
    schema: {
      tags: ['account.tags'],
      summary: 'Create an account-level tag',
      description: 'Create a new tag at the account level.',
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
            tag: AccountTagSchema,
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { name, description, category, isActive = true } = request.body;
    let { slug } = request.body;
    const accountId = request.user!.accountId;
    const tenantId = request.user!.tenantId;

    // Auto-generate slug if not provided
    if (!slug) {
      slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Check if slug already exists at account level
    const existingTag = await fastify.prisma.tag.findFirst({
      where: { 
        slug,
        scope: 'account',
        accountId,
      },
    });

    if (existingTag) {
      return reply.code(409).send({
        success: false,
        error: 'TAG_SLUG_EXISTS',
        message: 'An account tag with this slug already exists',
      });
    }

    const tag = await fastify.prisma.tag.create({
      data: {
        uuid: crypto.randomUUID(),
        name,
        slug,
        description,
        category,
        scope: 'account',
        tenantId,
        accountId,
        isActive,
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
          inheritedFrom: null,
          usageCount: tag.usageCount || 0,
          createdAt: tag.createdAt.toISOString(),
          updatedAt: tag.updatedAt.toISOString(),
        },
      },
    });
  });

  // Update account tag
  fastify.patch('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('account.tags.update')
    ],
    schema: {
      tags: ['account.tags'],
      summary: 'Update an account-level tag',
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
            tag: AccountTagSchema,
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const accountId = request.user!.accountId;

    // Find account tag
    const existingTag = await fastify.prisma.tag.findFirst({
      where: {
        uuid,
        scope: 'account',
        accountId,
      },
    });

    if (!existingTag) {
      return reply.code(404).send({
        success: false,
        error: 'TAG_NOT_FOUND',
        message: 'Account tag not found',
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
          inheritedFrom: null,
          usageCount: tag.usageCount || 0,
          createdAt: tag.createdAt.toISOString(),
          updatedAt: tag.updatedAt.toISOString(),
        },
      },
    };
  });

  // Delete account tag
  fastify.delete('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('account.tags.delete')
    ],
    schema: {
      tags: ['account.tags'],
      summary: 'Delete an account-level tag',
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
    const accountId = request.user!.accountId;

    // Find account tag
    const tag = await fastify.prisma.tag.findFirst({
      where: {
        uuid,
        scope: 'account',
        accountId,
      },
    });

    if (!tag) {
      return reply.code(404).send({
        success: false,
        error: 'TAG_NOT_FOUND',
        message: 'Account tag not found',
      });
    }

    // Check if tag is in use
    const usageCount = await fastify.prisma.entityTag.count({
      where: { tagId: tag.id },
    });

    if (usageCount > 0) {
      return reply.code(409).send({
        success: false,
        error: 'TAG_IN_USE',
        message: `Cannot delete tag that is in use by ${usageCount} entities`,
      });
    }

    // Delete tag
    await fastify.prisma.tag.delete({
      where: { id: tag.id },
    });

    return {
      success: true,
      message: 'Account tag deleted successfully',
    };
  });

  // Bulk operations
  fastify.post('/bulk', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('account.tags.create')
    ],
    schema: {
      tags: ['account.tags'],
      summary: 'Bulk create account tags',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        tags: Type.Array(Type.Object({
          name: Type.String({ minLength: 1 }),
          slug: Type.Optional(Type.String()),
          description: Type.Optional(Type.String()),
          category: Type.Optional(Type.String()),
        })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            created: Type.Number(),
            skipped: Type.Number(),
            errors: Type.Array(Type.Object({
              name: Type.String(),
              error: Type.String(),
            })),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { tags } = request.body;
    const accountId = request.user!.accountId;
    const tenantId = request.user!.tenantId;

    const created: string[] = [];
    const errors: { name: string; error: string }[] = [];

    for (const tagData of tags) {
      try {
        const slug = tagData.slug || tagData.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        // Check if already exists
        const existing = await fastify.prisma.tag.findFirst({
          where: {
            slug,
            scope: 'account',
            accountId,
          },
        });

        if (existing) {
          errors.push({ name: tagData.name, error: 'TAG_SLUG_EXISTS' });
          continue;
        }

        await fastify.prisma.tag.create({
          data: {
            uuid: crypto.randomUUID(),
            name: tagData.name,
            slug,
            description: tagData.description,
            category: tagData.category,
            scope: 'account',
            tenantId,
            accountId,
            isActive: true,
            createdBy: request.user!.id,
            updatedAt: new Date(),
          },
        });

        created.push(tagData.name);
      } catch (error) {
        errors.push({ name: tagData.name, error: 'CREATE_FAILED' });
      }
    }

    return reply.code(201).send({
      success: true,
      data: {
        created: created.length,
        skipped: errors.length,
        errors,
      },
    });
  });

  // Get tag categories at account level
  fastify.get('/categories', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('account.tags.read')
    ],
    schema: {
      tags: ['account.tags'],
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
    const accountId = request.user!.accountId;

    const categories = await fastify.prisma.tag.findMany({
      where: {
        scope: 'account',
        accountId,
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