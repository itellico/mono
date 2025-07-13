import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';

export interface UserPermission {
  id: number;
  name: string;
  module: string;
  resource: string;
  action: string;
  scope: string;
  description: string;
}

export interface UserRole {
  id: number;
  code: string;
  name: string;
  tier: string;
  level: number;
}

export interface PermissionCheck {
  userId: string;
  permission: string;
  resource?: string;
  resourceId?: string;
}

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'perms:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Check if user has a specific permission (with wildcard support)
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      const userRoles = await this.getUserRoles(userId);

      // Super admin bypass - has all permissions
      if (userRoles.some(r => r.code === 'super_admin')) {
        return true;
      }
      
      // Check permissions with wildcard matching
      return userPermissions.some(userPerm => 
        this.patternMatchesPermission(userPerm.name, permission)
      );
    } catch (error) {
      this.logger.error(`Error checking permission ${permission} for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Enhanced pattern matching with wildcard support
   * Supports patterns like:
   * - "*" (matches everything)
   * - "platform.*" (matches all platform permissions)
   * - "*.users.*" (matches all user operations across modules)
   * - "*.*.read" (matches all read operations)
   * - "platform.*.manage" (matches all manage operations in platform)
   */
  private patternMatchesPermission(pattern: string, permission: string): boolean {
    // Exact match
    if (pattern === permission) {
      return true;
    }

    // Super wildcard
    if (pattern === '*') {
      return true;
    }

    const patternParts = pattern.split('.');
    const permissionParts = permission.split('.');

    // Module wildcard (e.g., "platform.*")
    if (patternParts.length === 2 && patternParts[1] === '*') {
      return permission.startsWith(patternParts[0] + '.');
    }

    // Same length patterns with wildcards
    if (patternParts.length === permissionParts.length) {
      return patternParts.every((part, index) => 
        part === '*' || part === permissionParts[index]
      );
    }

    return false;
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user has all of the specified permissions
   */
  async hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get all permissions for a user (with caching)
   */
  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    const cacheKey = `${this.CACHE_PREFIX}user:${userId}`;
    
    try {
      // Try to get from cache first
      const cached = await this.redis.get<string>(cacheKey);
      if (cached) {
        return JSON.parse(cached) as UserPermission[];
      }

      // Convert string userId to number for database query
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        return [];
      }

      // Fetch from database
      const user = await this.prisma.user.findUnique({
        where: { id: userIdNum },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
          userPermissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!user) {
        return [];
      }

      // Collect permissions from roles
      const rolePermissions = user.userRoles
        .flatMap(ur => ur.role.rolePermissions)
        .map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          module: rp.permission.module,
          resource: rp.permission.resource,
          action: rp.permission.action,
          scope: rp.permission.scope,
          description: rp.permission.description,
        }));

      // Collect direct user permissions
      const directPermissions = user.userPermissions.map(up => ({
        id: up.permission.id,
        name: up.permission.name,
        module: up.permission.module,
        resource: up.permission.resource,
        action: up.permission.action,
        scope: up.permission.scope,
        description: up.permission.description,
      }));

      // Combine and deduplicate permissions
      const allPermissions = [...rolePermissions, ...directPermissions];
      const uniquePermissions = allPermissions.filter(
        (permission, index, self) =>
          index === self.findIndex(p => p.id === permission.id)
      );

      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(uniquePermissions), this.CACHE_TTL);

      return uniquePermissions;
    } catch (error) {
      this.logger.error(`Error fetching permissions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get all roles for a user (with caching)
   */
  async getUserRoles(userId: string): Promise<UserRole[]> {
    const cacheKey = `${this.CACHE_PREFIX}roles:${userId}`;
    
    try {
      // Try to get from cache first
      const cached = await this.redis.get<string>(cacheKey);
      if (cached) {
        return JSON.parse(cached) as UserRole[];
      }

      // Convert string userId to number for database query
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        return [];
      }

      // Fetch from database
      const userRoles = await this.prisma.userRole.findMany({
        where: { user_id: userIdNum },
        include: {
          role: true,
        },
      });

      const roles = userRoles.map(ur => ({
        id: ur.role.id,
        code: ur.role.code,
        name: ur.role.name,
        tier: ur.role.module || 'user', // Use module as tier
        level: ur.role.level,
      }));

      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(roles), this.CACHE_TTL);

      return roles;
    } catch (error) {
      this.logger.error(`Error fetching roles for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(userId: string, roleCode: string): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    return userRoles.some(r => r.code === roleCode);
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(userId: string, roleCodes: string[]): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    const userRoleCodes = userRoles.map(r => r.code);
    return roleCodes.some(code => userRoleCodes.includes(code));
  }

  /**
   * Get permissions by module for a user
   */
  async getUserPermissionsByModule(userId: string, module: string): Promise<UserPermission[]> {
    const allPermissions = await this.getUserPermissions(userId);
    return allPermissions.filter(p => p.module === module);
  }

  /**
   * Get permissions by resource for a user
   */
  async getUserPermissionsByResource(userId: string, resource: string): Promise<UserPermission[]> {
    const allPermissions = await this.getUserPermissions(userId);
    return allPermissions.filter(p => p.resource === resource);
  }

  /**
   * Check resource-level permissions (e.g., can edit specific tenant)
   */
  async hasResourcePermission(
    userId: string,
    permission: string,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    // First check if user has the basic permission
    if (!(await this.hasPermission(userId, permission))) {
      return false;
    }

    // For super_admin, always allow
    if (await this.hasRole(userId, 'super_admin')) {
      return true;
    }

    // Add resource-specific permission logic here
    // This would typically involve checking user's relationship to the resource
    // For now, we'll implement basic tier-based access

    const userRoles = await this.getUserRoles(userId);
    const userPermissions = await this.getUserPermissions(userId);
    
    // Find the permission details
    const permissionDetails = userPermissions.find(p => p.name === permission);
    if (!permissionDetails) {
      return false;
    }

    // Implement tier-based access control
    switch (permissionDetails.scope) {
      case 'platform':
        return userRoles.some(r => ['super_admin', 'platform_admin'].includes(r.code));
      
      case 'tenant':
        return userRoles.some(r => 
          ['super_admin', 'platform_admin', 'tenant_admin', 'tenant_manager'].includes(r.code)
        );
      
      case 'account':
        return userRoles.some(r => 
          ['super_admin', 'platform_admin', 'tenant_admin', 'tenant_manager', 'account_admin', 'account_manager'].includes(r.code)
        );
      
      case 'own':
        // For 'own' scope, check if the resource belongs to the user
        return await this.isResourceOwner(userId, resourceType, resourceId);
      
      case 'public':
        return true; // Public permissions are available to everyone
      
      default:
        return false;
    }
  }

  /**
   * Check if user owns a specific resource
   */
  private async isResourceOwner(userId: string, resourceType: string, resourceId: string): Promise<boolean> {
    try {
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        return false;
      }

      switch (resourceType) {
        case 'user':
          return userId === resourceId;
        
        case 'account':
          const user = await this.prisma.user.findUnique({
            where: { id: userIdNum },
            select: { account_id: true },
          });
          return user?.account_id.toString() === resourceId;
        
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Error checking resource ownership:`, error);
      return false;
    }
  }

  /**
   * Clear user permission cache
   */
  async clearUserCache(userId: string): Promise<void> {
    try {
      await this.redis.del(`${this.CACHE_PREFIX}user:${userId}`);
      await this.redis.del(`${this.CACHE_PREFIX}roles:${userId}`);
      this.logger.log(`Cleared permission cache for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error clearing cache for user ${userId}:`, error);
    }
  }

  /**
   * Clear all permission caches
   */
  async clearAllCache(): Promise<void> {
    try {
      // Use the Redis client directly for pattern-based deletion
      const client = this.redis.getClient();
      const keys = await client.keys(`${this.CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await client.del(keys);
        this.logger.log(`Cleared ${keys.length} permission cache entries`);
      }
    } catch (error) {
      this.logger.error('Error clearing all permission caches:', error);
    }
  }

  /**
   * Get user's highest role level
   */
  async getUserMaxRoleLevel(userId: string): Promise<number> {
    const userRoles = await this.getUserRoles(userId);
    if (userRoles.length === 0) {
      return 0;
    }
    return Math.max(...userRoles.map(r => r.level));
  }

  /**
   * Validate permission name format
   */
  validatePermissionName(permission: string): boolean {
    // Permission should be in format: module.resource.action
    const parts = permission.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  /**
   * Parse permission into components
   */
  parsePermission(permission: string): { module: string; resource: string; action: string } | null {
    if (!this.validatePermissionName(permission)) {
      return null;
    }
    
    const [module, resource, action] = permission.split('.');
    return { module, resource, action };
  }
}