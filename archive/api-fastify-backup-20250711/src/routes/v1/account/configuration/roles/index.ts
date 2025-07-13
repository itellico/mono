import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * Account Configuration Roles Routes
 * Manage custom roles for account
 */
export const accountRolesRoutes: FastifyPluginAsync = async (fastify) => {
  // Get roles
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.roles.read')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Get account roles',
      description: 'Get all roles available for the account',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        includeSystem: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            roles: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              description: Type.Optional(Type.String()),
              level: Type.String(),
              isSystem: Type.Boolean(),
              isCustom: Type.Boolean(),
              permissions: Type.Array(Type.Object({
                name: Type.String(),
                resource: Type.String(),
                action: Type.String(),
                description: Type.Optional(Type.String()),
              })),
              userCount: Type.Number(),
              createdBy: Type.Optional(Type.Object({
                name: Type.String(),
              })),
              createdAt: Type.String(),
              updatedAt: Type.String(),
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
      const { page = 1, limit = 20, search, includeSystem = false } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          OR: [
            // Account-specific custom roles
            {
              tenantId: request.user!.tenantId,
              accountId: request.user!.accountId,
              isSystem: false,
            },
            // Account-level system roles
            {
              level: 'account',
              isSystem: true,
            },
          ],
        };

        if (!includeSystem) {
          where.OR = where.OR.filter((condition: any) => !condition.isSystem);
        }

        if (search) {
          where.AND = {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          };
        }

        const [roles, total] = await Promise.all([
          fastify.prisma.role.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: [
              { isSystem: 'desc' },
              { name: 'asc' },
            ],
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
              _count: {
                select: {
                  userRoles: {
                    where: { tenantId: request.user.tenantId, user: {
                        accountId: request.user!.accountId, },
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
          }),
          fastify.prisma.role.count({ where }),
        ]);

        return {
          success: true,
          data: {
            roles: roles.map(role => ({
              uuid: role.uuid,
              name: role.name,
              description: role.description,
              level: role.level || 'account',
              isSystem: role.isSystem,
              isCustom: !role.isSystem && role.accountId === request.user!.accountId,
              permissions: role.permissions.map(rp => ({
                id: rp.permission.uuid as UUID,
                name: rp.permission.name,
                resource: rp.permission.resource,
                action: rp.permission.action,
                description: rp.permission.description,
              })),
              userCount: role._count.userRoles,
              createdBy: role.createdBy ? {
                id: role.createdBy.uuid as UUID,
                name: role.createdBy.name,
              } : undefined,
              createdAt: role.createdAt.toISOString(),
              updatedAt: role.updatedAt.toISOString(),
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
        request.log.error({ error }, 'Failed to get roles');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_ROLES',
        });
      }
    },
  });

  // Get available permissions
  fastify.get('/permissions', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.roles.read')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Get available permissions',
      description: 'Get all permissions that can be assigned to roles',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        resource: Type.Optional(Type.String()),
        level: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            permissions: Type.Array(Type.Object({
              name: Type.String(),
              resource: Type.String(),
              action: Type.String(),
              description: Type.Optional(Type.String()),
              category: Type.String(),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { resource, level = 'account' } = request.query;

      try {
        const where: any = {
          name: {
            startsWith: `${level}.`,
          },
        };

        if (resource) {
          where.resource = resource;
        }

        const permissions = await fastify.prisma.permission.findMany({
          where,
          orderBy: [
            { resource: 'asc' },
            { action: 'asc' },
          ],
        });

        // Group permissions by category
        const categorized = permissions.map(perm => {
          const parts = perm.resource.split('.');
          const category = parts.length > 1 ? parts[1] : 'general';
          
          return {
            name: perm.name,
            resource: perm.resource,
            action: perm.action,
            description: perm.description,
            category,
          };
        });

        return {
          success: true,
          data: {
            permissions: categorized,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get permissions');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_PERMISSIONS',
        });
      }
    },
  });

  // Create role
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.roles.create')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Create role',
      description: 'Create a new custom role',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        description: Type.Optional(Type.String()),
        permissions: Type.Array(Type.Number()),
        copyFromRoleId: Type.Optional(Type.Number()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            role: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { name, description, permissions, copyFromRoleId } = request.body;

      try {
        // Check if role name already exists
        const existingRole = await fastify.prisma.role.findFirst({
          where: { tenantId: request.user.tenantId, name,
            OR: [
              { accountId: request.user!.accountId },
              { level: 'account', isSystem: true },
            ],
          },
        });

        if (existingRole) {
          return reply.status(400).send({
            success: false,
            error: 'ROLE_NAME_ALREADY_EXISTS',
          });
        }

        let permissionIds = permissions;

        // If copying from another role
        if (copyFromRoleId) {
          const sourceRole = await fastify.prisma.role.findFirst({
            where: { tenantId: request.user.tenantId, id: copyFromRoleId,
              OR: [
                { accountId: request.user!.accountId },
                { level: 'account', isSystem: true },
              ],
            },
            include: {
              permissions: {
                select: {
                  permissionId: true,
                },
              },
            },
          });

          if (sourceRole) {
            permissionIds = [...new Set([
              ...permissionIds,
              ...sourceRole.permissions.map(p => p.permissionId),
            ])];
          }
        }

        // Validate permissions
        const validPermissions = await fastify.prisma.permission.findMany({
          where: { tenantId: request.user.tenantId, id: { in: permissionIds },
            name: { startsWith: 'account.' },
          },
          select: { id: true },
        });

        const role = await fastify.prisma.role.create({
          data: {
            name,
            description,
            level: 'account',
            isSystem: false,
            tenantId: request.user!.tenantId,
            accountId: request.user!.accountId,
            createdById: request.user!.id,
            permissions: {
              create: validPermissions.map(p => ({
                permissionId: p.uuid as UUID,
              })),
            },
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            role: {
              uuid: role.uuid,
              name: role.name,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to create role');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CREATE_ROLE',
        });
      }
    },
  });

  // Get role details
  fastify.get('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.roles.read')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Get role details',
      description: 'Get detailed information about a role',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            role: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              description: Type.Optional(Type.String()),
              level: Type.String(),
              isSystem: Type.Boolean(),
              isCustom: Type.Boolean(),
              permissions: Type.Array(Type.Object({
                name: Type.String(),
                resource: Type.String(),
                action: Type.String(),
                description: Type.Optional(Type.String()),
              })),
              users: Type.Array(Type.Object({
                uuid: uuidSchema,
                name: Type.String(),
                email: Type.String(),
                avatar: Type.Optional(Type.String()),
                assignedAt: Type.String(),
              })),
              createdBy: Type.Optional(Type.Object({
                name: Type.String(),
              })),
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
        const role = await fastify.prisma.role.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            OR: [
              { accountId: request.user!.accountId },
              { level: 'account', isSystem: true },
            ],
          },
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
            userRoles: {
              where: { tenantId: request.user.tenantId, user: {
                  accountId: request.user!.accountId, },
              },
              include: {
                user: {
                  select: {
                    id: true,
                    uuid: true,
                    name: true,
                    email: true,
                    avatar: true,
                  },
                },
              },
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (!role) {
          return reply.status(404).send({
            success: false,
            error: 'ROLE_NOT_FOUND',
          });
        }

        return {
          success: true,
          data: {
            role: {
              uuid: role.uuid,
              name: role.name,
              description: role.description,
              level: role.level || 'account',
              isSystem: role.isSystem,
              isCustom: !role.isSystem && role.accountId === request.user!.accountId,
              permissions: role.permissions.map(rp => ({
                id: rp.permission.uuid as UUID,
                name: rp.permission.name,
                resource: rp.permission.resource,
                action: rp.permission.action,
                description: rp.permission.description,
              })),
              users: role.userRoles.map(ur => ({
                id: ur.user.uuid as UUID,
                uuid: ur.user.uuid,
                name: ur.user.name,
                email: ur.user.email,
                avatar: ur.user.avatar,
                assignedAt: ur.createdAt.toISOString(),
              })),
              createdBy: role.createdBy ? {
                id: role.createdBy.uuid as UUID,
                name: role.createdBy.name,
              } : undefined,
              createdAt: role.createdAt.toISOString(),
              updatedAt: role.updatedAt.toISOString(),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get role details');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_ROLE_DETAILS',
        });
      }
    },
  });

  // Update role
  fastify.put('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.roles.update')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Update role',
      description: 'Update a custom role',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1 })),
        description: Type.Optional(Type.String()),
        permissions: Type.Optional(Type.Array(Type.Number())),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { name, description, permissions } = request.body;

      try {
        const role = await fastify.prisma.role.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId,
            isSystem: false, },
        });

        if (!role) {
          return reply.status(404).send({
            success: false,
            error: 'CUSTOM_ROLE_NOT_FOUND',
          });
        }

        const updates: any = {};

        if (name !== undefined) {
          // Check if new name already exists
          const existingRole = await fastify.prisma.role.findFirst({
            where: { tenantId: request.user.tenantId, name,
              id: { not: role.uuid as UUID },
              OR: [
                { accountId: request.user!.accountId },
                { level: 'account', isSystem: true },
              ],
            },
          });

          if (existingRole) {
            return reply.status(400).send({
              success: false,
              error: 'ROLE_NAME_ALREADY_EXISTS',
            });
          }

          updates.name = name;
        }

        if (description !== undefined) {
          updates.description = description;
        }

        // Update basic fields
        if (Object.keys(updates).length > 0) {
          await fastify.prisma.role.update({
            where: { tenantId: request.user.tenantId },
            data: {
              ...updates,
              updatedAt: new Date(),
            },
          });
        }

        // Update permissions if provided
        if (permissions !== undefined) {
          // Validate permissions
          const validPermissions = await fastify.prisma.permission.findMany({
            where: { tenantId: request.user.tenantId, id: { in: permissions },
              name: { startsWith: 'account.' },
            },
            select: { id: true },
          });

          // Remove all existing permissions
          await fastify.prisma.rolePermission.deleteMany({
            where: { tenantId: request.user.tenantId, roleId: role.uuid as UUID },
          });

          // Add new permissions
          if (validPermissions.length > 0) {
            await fastify.prisma.rolePermission.createMany({
              data: validPermissions.map(p => ({
                roleId: role.uuid as UUID,
                permissionId: p.uuid as UUID,
              })),
            });
          }
        }

        // Clear permission cache for all users with this role
        const usersWithRole = await fastify.prisma.userRole.findMany({
          where: { tenantId: request.user.tenantId, roleId: role.uuid as UUID,
            user: {
              accountId: request.user!.accountId, },
          },
          select: {
            userId: true,
          },
        });

        const cacheKeys = usersWithRole.map(ur => 
          `permissions:user:${ur.userId}:tenant:${request.user!.tenantId}`
        );

        if (cacheKeys.length > 0) {
          await fastify.redis.del(...cacheKeys);
        }

        return {
          success: true,
          data: {
            message: 'Role updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update role');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_ROLE',
        });
      }
    },
  });

  // Delete role
  fastify.delete('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.roles.delete')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Delete role',
      description: 'Delete a custom role',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const role = await fastify.prisma.role.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId,
            isSystem: false, },
          include: {
            _count: {
              select: {
                userRoles: true,
              },
            },
          },
        });

        if (!role) {
          return reply.status(404).send({
            success: false,
            error: 'CUSTOM_ROLE_NOT_FOUND',
          });
        }

        if (role._count.userRoles > 0) {
          return reply.status(400).send({
            success: false,
            error: 'CANNOT_DELETE_ROLE_THAT_IS_ASSIGNED_TO_USERS',
          });
        }

        // Delete role (cascade will delete permissions)
        await fastify.prisma.role.delete({
          where: { tenantId: request.user.tenantId },
        });

        return {
          success: true,
          data: {
            message: 'Role deleted successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to delete role');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_ROLE',
        });
      }
    },
  });

  // Clone role
  fastify.post('/:uuid/clone', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.roles.create')],
    schema: {
      tags: ['account.configuration'],
      summary: 'Clone role',
      description: 'Create a copy of an existing role',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        description: Type.Optional(Type.String()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            role: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { name, description } = request.body;

      try {
        const sourceRole = await fastify.prisma.role.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            OR: [
              { accountId: request.user!.accountId },
              { level: 'account', isSystem: true },
            ],
          },
          include: {
            permissions: {
              select: {
                permissionId: true,
              },
            },
          },
        });

        if (!sourceRole) {
          return reply.status(404).send({
            success: false,
            error: 'SOURCE_ROLE_NOT_FOUND',
          });
        }

        // Check if new name already exists
        const existingRole = await fastify.prisma.role.findFirst({
          where: { tenantId: request.user.tenantId, name,
            OR: [
              { accountId: request.user!.accountId },
              { level: 'account', isSystem: true },
            ],
          },
        });

        if (existingRole) {
          return reply.status(400).send({
            success: false,
            error: 'ROLE_NAME_ALREADY_EXISTS',
          });
        }

        const role = await fastify.prisma.role.create({
          data: {
            name,
            description: description || `Cloned from ${sourceRole.name}`,
            level: 'account',
            isSystem: false,
            tenantId: request.user!.tenantId,
            accountId: request.user!.accountId,
            createdById: request.user!.id,
            permissions: {
              create: sourceRole.permissions.map(p => ({
                permissionId: p.permissionId,
              })),
            },
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            role: {
              uuid: role.uuid,
              name: role.name,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to clone role');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CLONE_ROLE',
        });
      }
    },
  });
};