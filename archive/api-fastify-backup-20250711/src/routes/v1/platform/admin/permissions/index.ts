import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

export const permissionsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get user permissions
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('permissions:read')],
    schema: {
      tags: ['platform.permissions'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        userId: Type.Optional(Type.Number()),
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            permissions: Type.Array(Type.Object({
              name: Type.String(),
              description: Type.Optional(Type.String()),
              resource: Type.String(),
              action: Type.String(),
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
  }, async (request, reply) => {
    const { userId, page = 1, limit = 20 } = request.query;
    const offset = (page - 1) * limit;

    try {
      let whereClause = {};
      if (userId) {
        // Get permissions for specific user
        whereClause = {
          OR: [
            {
              userPermissions: {
                some: { userId }
              }
            },
            {
              rolePermissions: {
                some: {
                  role: {
                    userRoles: {
                      some: { userId }
                    }
                  }
                }
              }
            }
          ]
        };
      }

      const [permissions, total] = await Promise.all([
        fastify.prisma.permission.findMany({
          where: whereClause,
          skip: offset,
          take: limit,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            resource: true,
            action: true,
            createdAt: true,
          },
        }),
        fastify.prisma.permission.count({ where: whereClause }),
      ]);

      return {
        success: true,
        data: {
          permissions: permissions.map(p => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: any) {
      fastify.log.error('Failed to fetch permissions', error);
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_PERMISSIONS',
      });
    }
  });

  // Create permission
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('permissions:create')],
    schema: {
      tags: ['platform.permissions'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1, maxLength: 100 }),
        description: Type.Optional(Type.String({ maxLength: 500 })),
        resource: Type.String({ minLength: 1, maxLength: 50 }),
        action: Type.String({ minLength: 1, maxLength: 50 }),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            permission: Type.Object({
              name: Type.String(),
              description: Type.Optional(Type.String()),
              resource: Type.String(),
              action: Type.String(),
              createdAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { name, description, resource, action } = request.body;

    try {
      // Check for duplicate
      const existing = await fastify.prisma.permission.findUnique({
        where: { name },
      });

      if (existing) {
        return reply.code(409).send({
          success: false,
          error: 'PERMISSION_WITH_THIS_NAME_ALREADY_EXISTS',
        });
      }

      const permission = await fastify.prisma.permission.create({
        data: {
          name,
          description,
          resource,
          action,
        },
      });

      return reply.code(201).send({
        success: true,
        data: {
          permission: {
            ...permission,
            createdAt: permission.createdAt.toISOString(),
          },
        },
      });
    } catch (error: any) {
      fastify.log.error('Failed to create permission', error);
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_CREATE_PERMISSION',
      });
    }
  });

  // Update permission
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate, fastify.requirePermission('permissions:update')],
    schema: {
      tags: ['platform.permissions'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
        description: Type.Optional(Type.String({ maxLength: 500 })),
        resource: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
        action: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            permission: Type.Object({
              name: Type.String(),
              description: Type.Optional(Type.String()),
              resource: Type.String(),
              action: Type.String(),
              updatedAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const updates = request.body;

    try {
      const permission = await fastify.prisma.permission.update({
        where: { id },
        data: updates,
      });

      return {
        success: true,
        data: {
          permission: {
            ...permission,
            updatedAt: permission.updatedAt.toISOString(),
          },
        },
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.code(404).send({
          success: false,
          error: 'PERMISSION_NOT_FOUND',
        });
      }

      fastify.log.error('Failed to update permission', error);
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_UPDATE_PERMISSION',
      });
    }
  });

  // Delete permission
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate, fastify.requirePermission('permissions:delete')],
    schema: {
      tags: ['platform.permissions'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    try {
      await fastify.prisma.permission.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Permission deleted successfully',
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        return reply.code(404).send({
          success: false,
          error: 'PERMISSION_NOT_FOUND',
        });
      }

      fastify.log.error('Failed to delete permission', error);
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_DELETE_PERMISSION',
      });
    }
  });

  // Get permission statistics
  fastify.get('/stats', {
    preHandler: [fastify.authenticate, fastify.requirePermission('permissions:read')],
    schema: {
      tags: ['platform.permissions'],
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            total: Type.Number(),
            byResource: Type.Array(Type.Object({
              resource: Type.String(),
              count: Type.Number(),
            })),
            byAction: Type.Array(Type.Object({
              action: Type.String(),
              count: Type.Number(),
            })),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const [total, byResource, byAction] = await Promise.all([
        fastify.prisma.permission.count(),
        fastify.prisma.permission.groupBy({
          by: ['resource'],
          _count: { id: true },
          orderBy: { resource: 'asc' },
        }),
        fastify.prisma.permission.groupBy({
          by: ['action'],
          _count: { id: true },
          orderBy: { action: 'asc' },
        }),
      ]);

      return {
        success: true,
        data: {
          total,
          byResource: byResource.map(item => ({
            resource: item.resource,
            count: item._count.uuid as UUID,
          })),
          byAction: byAction.map(item => ({
            action: item.action,
            count: item._count.uuid as UUID,
          })),
        },
      };
    } catch (error: any) {
      fastify.log.error('Failed to fetch permission statistics', error);
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_PERMISSION_STATISTICS',
      });
    }
  });
};