import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';
import { LoggerService } from '@common/logger/logger.service';
import { PermissionService } from '@modules/permissions/permission.service';
import type { Prisma } from '@prisma/client';

export interface Role {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    users: number;
    permissions: number;
  };
  permissions?: RolePermission[];
}

export interface RolePermission {
  permission: {
    id: number;
    name: string;
    description: string | null;
    category: string;
  };
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionIds: number[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissionIds?: number[];
}

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logger: LoggerService,
    private readonly permissionService: PermissionService,
  ) {}

  /**
   * Get all roles with Redis caching
   */
  async getAllRoles(userId: number, tenantId: number | null): Promise<Role[]> {
    // Check permissions first
    const hasPermission = await this.permissionService.checkUserPermission(
      userId.toString(), 'admin.roles.view'
    );

    if (!hasPermission) {
      throw new ForbiddenException('Permission denied: Cannot read roles');
    }

    const cacheKey = `cache:${tenantId ?? 'global'}:roles:list`;
    
    try {
      // Try Redis cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.log('Retrieved roles from cache', { tenantId, userId });
        return JSON.parse(cached);
      }

      // Fetch from database
      const roles = await this.prisma.role.findMany({
        where: tenantId ? { tenantId } : {},
        include: {
          _count: {
            select: {
              userRoles: true,
              rolePermissions: true,
            },
          },
          rolePermissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: true,
                },
              },
            },
          },
        },
        orderBy: [
          { isSystem: 'desc' },
          { name: 'asc' },
        ],
      });

      // Transform the data to match expected interface
      const transformedRoles = roles.map(role => ({
        ...role,
        _count: {
          users: role._count.userRoles,
          permissions: role._count.rolePermissions,
        },
        permissions: role.rolePermissions.map(rp => ({
          permission: rp.permission,
        })),
      }));

      // Cache for 10 minutes
      await this.redis.setex(cacheKey, 600, JSON.stringify(transformedRoles));
      
      this.logger.log('Retrieved roles from database', { 
        count: transformedRoles.length, 
        tenantId, 
        userId 
      });

      return transformedRoles;
    } catch (error) {
      this.logger.error('Failed to get roles', { error: error.message, tenantId, userId });
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(userId: number, tenantId: number | null, roleId: number): Promise<Role> {
    // Check permissions
    const hasPermission = await this.permissionService.checkUserPermission(
      userId.toString(), 'admin.roles.view'
    );

    if (!hasPermission) {
      throw new ForbiddenException('Permission denied: Cannot read roles');
    }

    try {
      const role = await this.prisma.role.findFirst({
        where: { 
          id: roleId,
          ...(tenantId && { tenantId }),
        },
        include: {
          _count: {
            select: {
              userRoles: true,
              rolePermissions: true,
            },
          },
          rolePermissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: true,
                },
              },
            },
          },
        },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Transform the data
      const transformedRole = {
        ...role,
        _count: {
          users: role._count.userRoles,
          permissions: role._count.rolePermissions,
        },
        permissions: role.rolePermissions.map(rp => ({
          permission: rp.permission,
        })),
      };

      return transformedRole;
    } catch (error) {
      this.logger.error('Failed to get role by ID', { error: error.message, roleId, tenantId, userId });
      throw error;
    }
  }

  /**
   * Create new role with permission validation
   */
  async createRole(
    userId: number, 
    tenantId: number | null, 
    data: CreateRoleRequest
  ): Promise<Role> {
    // Check permissions
    const hasPermission = await this.permissionService.checkUserPermission(
      userId.toString(), 'admin.roles.create'
    );

    if (!hasPermission) {
      throw new ForbiddenException('Permission denied: Cannot create roles');
    }

    try {
      const role = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Create role
        const newRole = await tx.role.create({
          data: {
            name: data.name,
            description: data.description,
            tenantId,
            isSystem: false,
          },
          include: {
            _count: {
              select: {
                userRoles: true,
                rolePermissions: true,
              },
            },
          },
        });

        // Assign permissions
        if (data.permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: data.permissionIds.map(permissionId => ({
              roleId: newRole.id,
              permissionId,
            })),
          });
        }

        return newRole;
      });

      // Clear cache
      await this.clearRolesCaches(tenantId);
      
      this.logger.log('Role created successfully', { 
        roleId: role.id, 
        name: data.name, 
        tenantId, 
        userId 
      });

      // Return with proper structure
      return {
        ...role,
        _count: {
          users: role._count.userRoles,
          permissions: role._count.rolePermissions,
        },
      };
    } catch (error) {
      this.logger.error('Failed to create role', { error: error.message, data, tenantId, userId });
      throw error;
    }
  }

  /**
   * Update existing role
   */
  async updateRole(
    userId: number, 
    tenantId: number | null, 
    roleId: number, 
    data: UpdateRoleRequest
  ): Promise<Role> {
    // Check permissions
    const hasPermission = await this.permissionService.checkUserPermission(
      userId.toString(), 'admin.roles.update'
    );

    if (!hasPermission) {
      throw new ForbiddenException('Permission denied: Cannot update roles');
    }

    try {
      const role = await this.prisma.$transaction(async (tx) => {
        // Update role
        const updatedRole = await tx.role.update({
          where: { id: roleId },
          data: {
            ...(data.name && { name: data.name }),
            ...(data.description !== undefined && { description: data.description }),
          },
          include: {
            _count: {
              select: {
                userRoles: true,
                rolePermissions: true,
              },
            },
          },
        });

        // Update permissions if provided
        if (data.permissionIds) {
          // Remove existing permissions
          await tx.rolePermission.deleteMany({
            where: { roleId },
          });

          // Add new permissions
          if (data.permissionIds.length > 0) {
            await tx.rolePermission.createMany({
              data: data.permissionIds.map(permissionId => ({
                roleId,
                permissionId,
              })),
            });
          }
        }

        return updatedRole;
      });

      // Clear cache
      await this.clearRolesCaches(tenantId);
      
      this.logger.log('Role updated successfully', { 
        roleId, 
        tenantId, 
        userId 
      });

      return {
        ...role,
        _count: {
          users: role._count.userRoles,
          permissions: role._count.rolePermissions,
        },
      };
    } catch (error) {
      this.logger.error('Failed to update role', { error: error.message, roleId, data, tenantId, userId });
      throw error;
    }
  }

  /**
   * Delete role with validation
   */
  async deleteRole(userId: number, tenantId: number | null, roleId: number): Promise<void> {
    // Check permissions
    const hasPermission = await this.permissionService.checkUserPermission(
      userId.toString(), 'admin.roles.delete'
    );

    if (!hasPermission) {
      throw new ForbiddenException('Permission denied: Cannot delete roles');
    }

    try {
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Check if role exists and is not system role
        const role = await tx.role.findUnique({
          where: { id: roleId },
          include: {
            _count: {
              select: { userRoles: true },
            },
          },
        });

        if (!role) {
          throw new NotFoundException('Role not found');
        }

        if (role.isSystem) {
          // Only super admin can delete system roles
          const isSuperAdmin = await this.permissionService.checkUserPermission(
            userId.toString(), 'admin.full_access'
          );
          
          if (!isSuperAdmin) {
            throw new ForbiddenException('Cannot delete system roles');
          }
        }

        if (role._count.userRoles > 0) {
          throw new BadRequestException('Cannot delete role with assigned users');
        }

        // Delete role permissions first
        await tx.rolePermission.deleteMany({
          where: { roleId },
        });

        // Delete role
        await tx.role.delete({
          where: { id: roleId },
        });
      });

      // Clear cache
      await this.clearRolesCaches(tenantId);
      
      this.logger.log('Role deleted successfully', { 
        roleId, 
        tenantId, 
        userId 
      });
    } catch (error) {
      this.logger.error('Failed to delete role', { error: error.message, roleId, tenantId, userId });
      throw error;
    }
  }

  /**
   * Clear all role-related caches
   */
  private async clearRolesCaches(tenantId: number | null): Promise<void> {
    try {
      const patterns = [
        `cache:${tenantId ?? 'global'}:roles:*`,
        `cache:${tenantId ?? 'global'}:permissions:*`,
        `cache:${tenantId ?? 'global'}:users:*`,
      ];

      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      this.logger.log('Cleared role caches', { tenantId });
    } catch (error) {
      this.logger.warn('Failed to clear role caches', { error: error.message, tenantId });
    }
  }
}