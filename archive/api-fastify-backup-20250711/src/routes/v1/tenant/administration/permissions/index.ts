import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * Tenant Administration Permissions Routes
 * Manage tenant-wide permissions and roles
 */
export const tenantPermissionsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all permissions
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.permissions.read')],
    schema: {
      tags: ['tenant.permissions'],
      summary: 'Get tenant permissions',
      description: 'Get all permissions available in the tenant',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 50 })),
        search: Type.Optional(Type.String()),
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
              level: Type.String(),
              isSystem: Type.Boolean(),
              assignedRoles: Type.Number(),
              assignedUsers: Type.Number(),
              createdAt: Type.String(),
              updatedAt: Type.String(),
            })),
            groupedPermissions: Type.Object({}, { additionalProperties: Type.Array(Type.Any()) }),
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
      const { page = 1, limit = 50, search, resource, level } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {};

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { resource: { contains: search, mode: 'insensitive' } },
            { action: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ];
        }

        if (resource) {
          where.resource = resource;
        }

        if (level) {
          where.name = { startsWith: `${level}.` };
        }

        const [permissions, total] = await Promise.all([
          fastify.prisma.permission.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: [
              { resource: 'asc' },
              { action: 'asc' },
            ],
            include: {
              _count: {
                select: {
                  rolePermissions: true,
                  userPermissions: true,
                },
              },
            },
          }),
          fastify.prisma.permission.count({ where }),
        ]);

        // Group permissions by resource
        const groupedPermissions = permissions.reduce((groups, permission) => {
          if (!groups[permission.resource]) {
            groups[permission.resource] = [];
          }
          groups[permission.resource].push({
            name: permission.name,
            action: permission.action,
            description: permission.description,
            level: permission.name.split('.')[0],
            isSystem: permission.isSystem,
            assignedRoles: permission._count.rolePermissions,
            assignedUsers: permission._count.userPermissions,
          });
          return groups;
        }, {} as Record<string, any[]>);

        return {
          success: true,
          data: {
            permissions: permissions.map(permission => ({
              name: permission.name,
              resource: permission.resource,
              action: permission.action,
              description: permission.description,
              level: permission.name.split('.')[0],
              isSystem: permission.isSystem,
              assignedRoles: permission._count.rolePermissions,
              assignedUsers: permission._count.userPermissions,
              createdAt: permission.createdAt.toISOString(),
              updatedAt: permission.updatedAt.toISOString(),
            })),
            groupedPermissions,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get tenant permissions');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_TENANT_PERMISSIONS',
        });
      }
    },
  });

  // Create custom permission
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.permissions.create')],
    schema: {
      tags: ['tenant.permissions'],
      summary: 'Create permission',
      description: 'Create a new custom permission',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        resource: Type.String(),
        action: Type.String(),
        description: Type.Optional(Type.String()),
        level: Type.Union([
          Type.Literal('tenant'),
          Type.Literal('account'),
          Type.Literal('user'),
        ]),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            permission: Type.Object({
              name: Type.String(),
              resource: Type.String(),
              action: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { name, resource, action, description, level } = request.body;

      try {
        // Ensure permission name follows the pattern: level.resource.action
        const formattedName = name.startsWith(`${level}.`) 
          ? name 
          : `${level}.${resource}.${action}`;

        // Check if permission already exists
        const existingPermission = await fastify.prisma.permission.findUnique({
          where: { tenantId: request.user.tenantId, name: formattedName },
        });

        if (existingPermission) {
          return reply.status(400).send({
            success: false,
            error: 'PERMISSION_ALREADY_EXISTS',
          });
        }

        const permission = await fastify.prisma.permission.create({
          data: {
            name: formattedName,
            resource,
            action,
            description,
            isSystem: false,
            tenantId: request.user!.tenantId,
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            permission: {
              name: permission.name,
              resource: permission.resource,
              action: permission.action,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to create permission');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CREATE_PERMISSION',
        });
      }
    },
  });

  // Get roles
  fastify.get('/roles', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.roles.read')],
    schema: {
      tags: ['tenant.permissions'],
      summary: 'Get tenant roles',
      description: 'Get all roles available in the tenant',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        level: Type.Optional(Type.String()),
        includeSystem: Type.Optional(Type.Boolean({ default: true })),
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
              permissionCount: Type.Number(),
              userCount: Type.Number(),
              accountId: Type.Optional(Type.Number()),
              accountName: Type.Optional(Type.String()),
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
      const { page = 1, limit = 20, search, level, includeSystem = true } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          tenantId: request.user!.tenantId,
        };

        if (!includeSystem) {
          where.isSystem = false;
        }

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ];
        }

        if (level) {
          where.level = level;
        }

        const [roles, total] = await Promise.all([
          fastify.prisma.role.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: [
              { isSystem: 'desc' },
              { level: 'asc' },
              { name: 'asc' },
            ],
            include: {
              account: {
                select: {
                  id: true,
                  name: true,
                },
              },
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
              _count: {
                select: {
                  permissions: true,
                  userRoles: true,
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
              permissionCount: role._count.permissions,
              userCount: role._count.userRoles,
              accountId: role.account?.id,
              accountName: role.account?.name,
              createdBy: role.createdBy,
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
        request.log.error({ error }, 'Failed to get tenant roles');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_TENANT_ROLES',
        });
      }
    },
  });

  // Create tenant role
  fastify.post('/roles', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.roles.create')],
    schema: {
      tags: ['tenant.permissions'],
      summary: 'Create tenant role',
      description: 'Create a new tenant-level role',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        description: Type.Optional(Type.String()),
        level: Type.Union([
          Type.Literal('tenant'),
          Type.Literal('account'),
          Type.Literal('user'),
        ]),
        permissions: Type.Array(Type.Number()),
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
      const { name, description, level, permissions } = request.body;

      try {
        // Check if role name already exists in this tenant
        const existingRole = await fastify.prisma.role.findFirst({
          where: {
            name,
            tenantId: request.user!.tenantId,
          },
        });

        if (existingRole) {
          return reply.status(400).send({
            success: false,
            error: 'ROLE_NAME_ALREADY_EXISTS_IN_THIS_TENANT',
          });
        }

        // Validate permissions exist and match the role level
        const validPermissions = await fastify.prisma.permission.findMany({
          where: { tenantId: request.user.tenantId, id: { in: permissions },
            name: { startsWith: `${level}.` },
          },
          select: { id: true },
        });

        const role = await fastify.prisma.role.create({
          data: {
            name,
            description,
            level,
            isSystem: false,
            tenantId: request.user!.tenantId,
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
        request.log.error({ error }, 'Failed to create tenant role');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CREATE_TENANT_ROLE',
        });
      }
    },
  });

  // Get role details
  fastify.get('/roles/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.roles.read')],
    schema: {
      tags: ['tenant.permissions'],
      summary: 'Get role details',
      description: 'Get detailed information about a specific role',
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
                accountName: Type.String(),
                assignedAt: Type.String(),
              })),
              accountId: Type.Optional(Type.Number()),
              accountName: Type.Optional(Type.String()),
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
          where: {
            uuid,
            tenantId: request.user!.tenantId,
          },
          include: {
            account: {
              select: {
                id: true,
                name: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
            permissions: {
              include: {
                permission: true,
              },
            },
            userRoles: {
              include: {
                user: {
                  select: {
                    id: true,
                    uuid: true,
                    name: true,
                    email: true,
                    account: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
              take: 20,
              orderBy: { createdAt: 'desc' },
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
                accountName: ur.user.account.name,
                assignedAt: ur.createdAt.toISOString(),
              })),
              accountId: role.account?.id,
              accountName: role.account?.name,
              createdBy: role.createdBy,
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
  fastify.put('/roles/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.roles.update')],
    schema: {
      tags: ['tenant.permissions'],
      summary: 'Update role',
      description: 'Update role information and permissions',
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
          where: {
            uuid,
            tenantId: request.user!.tenantId,
            isSystem: false,
          },
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
            where: {
              name,
              tenantId: request.user!.tenantId,
              id: { not: role.uuid as UUID },
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
          const roleLevel = role.level || 'account';
          
          // Validate permissions
          const validPermissions = await fastify.prisma.permission.findMany({
            where: { tenantId: request.user.tenantId, id: { in: permissions },
              name: { startsWith: `${roleLevel}.` },
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
          where: { tenantId: request.user.tenantId, roleId: role.uuid as UUID },
          select: { userId: true },
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
  fastify.delete('/roles/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.roles.delete')],
    schema: {
      tags: ['tenant.permissions'],
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
          where: {
            uuid,
            tenantId: request.user!.tenantId,
            isSystem: false,
          },
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

  // Permission matrix
  fastify.get('/matrix', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.permissions.read')],
    schema: {
      tags: ['tenant.permissions'],
      summary: 'Get permission matrix',
      description: 'Get a matrix view of roles and their permissions',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            matrix: Type.Object({
              roles: Type.Array(Type.Object({
                name: Type.String(),
                level: Type.String(),
                isSystem: Type.Boolean(),
              })),
              permissions: Type.Array(Type.Object({
                name: Type.String(),
                resource: Type.String(),
                action: Type.String(),
              })),
              assignments: Type.Object({}, { additionalProperties: Type.Array(Type.Number()) }),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const [roles, permissions, rolePermissions] = await Promise.all([
          fastify.prisma.role.findMany({
            where: { tenantId: request.user!.tenantId },
            select: {
              id: true,
              name: true,
              level: true,
              isSystem: true,
            },
            orderBy: [
              { isSystem: 'desc' },
              { level: 'asc' },
              { name: 'asc' },
            ],
          }),
          fastify.prisma.permission.findMany({
            select: {
              id: true,
              name: true,
              resource: true,
              action: true,
            },
            orderBy: [
              { resource: 'asc' },
              { action: 'asc' },
            ],
          }),
          fastify.prisma.rolePermission.findMany({
            where: {
              role: { tenantId: request.user!.tenantId },
            },
            select: {
              roleId: true,
              permissionId: true,
            },
          }),
        ]);

        // Build assignment matrix
        const assignments: Record<string, number[]> = {};
        
        rolePermissions.forEach(rp => {
          const key = `role_${rp.roleId}`;
          if (!assignments[key]) {
            assignments[key] = [];
          }
          assignments[key].push(rp.permissionId);
        });

        return {
          success: true,
          data: {
            matrix: {
              roles,
              permissions,
              assignments,
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get permission matrix');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_PERMISSION_MATRIX',
        });
      }
    },
  });
};