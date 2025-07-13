import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

export const tenantsRoutes: FastifyPluginAsync = async (fastify) => {
  // List tenants
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.tenants.read')
    ],
    schema: {
      tags: ['platform.tenants'],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        isActive: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tenants: Type.Array(Type.Any()),
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
    const { page = 1, limit = 20, search, isActive } = request.query as any;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    const [tenants, total] = await Promise.all([
      fastify.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              accounts: true,
            },
          },
          subscriptions: {
            where: { status: 'active' },
            include: {
              plan: true,
            },
          },
        },
      }),
      fastify.prisma.tenant.count({ where }),
    ]);

    return {
      success: true,
      data: {
        tenants,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  });

  // Get tenant by ID
  fastify.get('/:id', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.tenants.read')
    ],
    schema: {
      tags: ['platform.tenants'],
      params: Type.Object({
        id: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tenant: Type.Any(),
          }),
        }),
        404: Type.Object({
          success: Type.Boolean({ default: false }),
          error: Type.String(),
        }),
      },
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const tenant = await fastify.prisma.tenant.findFirst({
      where: {
        OR: [
          { id: parseInt(id, 10) || 0 },
          { uuid: id },
        ],
      },
      include: {
        accounts: {
          include: {
            users: true,
          },
        },
        subscriptions: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!tenant) {
      return reply.code(404).send({
        success: false,
        error: 'TENANT_NOT_FOUND',
      });
    }

    // Verify access
    await fastify.verifyTenantAccess(request, tenant.id);

    return {
      success: true,
      data: { tenant },
    };
  });

  // Create tenant
  fastify.post('/', {
    preHandler: [fastify.verifySuperAdmin],
    schema: {
      tags: ['platform.tenants'],
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        domain: Type.String({ minLength: 1 }),
        slug: Type.Optional(Type.String()),
        description: Type.Optional(Type.Object({}, { additionalProperties: true })),
        settings: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tenant: Type.Any(),
          }),
        }),
        400: Type.Object({
          success: Type.Boolean({ default: false }),
          error: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    const data = request.body;

    // Check if domain already exists
    const existing = await fastify.prisma.tenant.findFirst({
      where: {
        OR: [
          { domain: data.domain },
          { slug: data.slug || data.domain },
        ],
      },
    });

    if (existing) {
      return reply.code(400).send({
        success: false,
        error: 'DOMAIN_OR_SLUG_ALREADY_EXISTS',
      });
    }

    const tenant = await fastify.prisma.tenant.create({
      data: {
        ...data,
        slug: data.slug || data.domain,
        isActive: true,
      },
    });

    return {
      success: true,
      data: { tenant },
    };
  });

  // Update tenant
  fastify.patch('/:id', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.tenants.read')
    ],
    schema: {
      tags: ['platform.tenants'],
      params: Type.Object({
        id: Type.String(),
      }),
      body: Type.Object({
        name: Type.Optional(Type.String()),
        domain: Type.Optional(Type.String()),
        slug: Type.Optional(Type.String()),
        description: Type.Optional(Type.Object({}, { additionalProperties: true })),
        settings: Type.Optional(Type.Object({}, { additionalProperties: true })),
        isActive: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            tenant: Type.Any(),
          }),
        }),
        404: Type.Object({
          success: Type.Boolean({ default: false }),
          error: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const updates = request.body;

    const tenant = await fastify.prisma.tenant.findFirst({
      where: {
        OR: [
          { id: parseInt(id, 10) || 0 },
          { uuid: id },
        ],
      },
    });

    if (!tenant) {
      return reply.code(404).send({
        success: false,
        error: 'TENANT_NOT_FOUND',
      });
    }

    // Verify access
    await fastify.verifyTenantAccess(request, tenant.id);

    const updated = await fastify.prisma.tenant.update({
      where: { },
      data: updates,
    });

    return {
      success: true,
      data: { tenant: updated },
    };
  });
};