/**
 * Roles Service - Enterprise Role Management
 * 
 * ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
 * Features:
 * - Three-layer caching (TanStack Query + Redis + API)
 * - Proper role-based permission checking via API
 * - Multi-tenant isolation
 * - Comprehensive audit logging
 */

// ❌ REMOVED: Direct database imports (architectural violation)
// import { prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { PermissionsService } from '@/lib/services/permissions.service';
import { RolesApiService } from '@/lib/api-clients/roles.api';
// ❌ REMOVED: Direct Prisma types (use API types instead)
// import type { Prisma } from '@prisma/client';

// ============================================================================
// INTERFACES
// ============================================================================

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

// ============================================================================
// ROLES SERVICE WITH REDIS CACHING
// ============================================================================

export class RolesService {
  private static instance: RolesService;
  
  public static getInstance(): RolesService {
    if (!RolesService.instance) {
      RolesService.instance = new RolesService();
    }
    return RolesService.instance;
  }

  /**
   * Get all roles with Redis caching
   */
  async getAllRoles(userId: number, tenantId: number | null): Promise<Role[]> {
    // Check permissions first
    const hasPermission = await PermissionsService.getInstance().hasPermission(
      userId.toString(), 'admin.roles.view', tenantId
    );

    if (!hasPermission) {
      throw new Error('Permission denied: Cannot read roles');
    }

    const cacheKey = `cache:${tenantId ?? 'global'}:roles:list`;
    
    try {
      // Try Redis cache first
      const redis = await getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Retrieved roles from cache', { tenantId, userId });
        return JSON.parse(cached);
      }

      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      const roles = await RolesApiService.getAllRoles(tenantId);

      // Cache for 10 minutes
      await redis.setex(cacheKey, 600, JSON.stringify(roles));
      
      logger.info('Retrieved roles from API', { 
        count: roles.length, 
        tenantId, 
        userId 
      });

      return roles;
    } catch (error) {
      logger.error('Failed to get roles via API', { error, tenantId, userId });
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
    const hasPermission = await PermissionsService.getInstance().hasPermission(
      userId.toString(), 'admin.roles.create', tenantId
    );

    if (!hasPermission) {
      throw new Error('Permission denied: Cannot create roles');
    }

    try {
      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      const role = await RolesApiService.createRole(data, tenantId);

      // Clear cache
      await this.clearRolesCaches(tenantId);
      
      logger.info('Role created successfully via API', { 
        roleId: role.id, 
        name: data.name, 
        tenantId, 
        userId 
      });

      return role;
    } catch (error) {
      logger.error('Failed to create role via API', { error, data, tenantId, userId });
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
    const hasPermission = await PermissionsService.getInstance().hasPermission(
      userId.toString(), 'admin.roles.update', tenantId
    );

    if (!hasPermission) {
      throw new Error('Permission denied: Cannot update roles');
    }

    try {
      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      const role = await RolesApiService.updateRole(roleId, data, tenantId);

      // Clear cache
      await this.clearRolesCaches(tenantId);
      
      logger.info('Role updated successfully via API', { 
        roleId, 
        tenantId, 
        userId 
      });

      return role;
    } catch (error) {
      logger.error('Failed to update role via API', { error, roleId, data, tenantId, userId });
      throw error;
    }
  }

  /**
   * Delete role with validation
   */
  async deleteRole(userId: number, tenantId: number | null, roleId: number): Promise<void> {
    // Check permissions
    const hasPermission = await PermissionsService.getInstance().hasPermission(
      userId.toString(), 'admin.roles.delete', tenantId
    );

    if (!hasPermission) {
      throw new Error('Permission denied: Cannot delete roles');
    }

    try {
      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      const success = await RolesApiService.deleteRole(roleId, tenantId);

      if (!success) {
        throw new Error('Failed to delete role');
      }

      // Clear cache
      await this.clearRolesCaches(tenantId);
      
      logger.info('Role deleted successfully via API', { 
        roleId, 
        tenantId, 
        userId 
      });
    } catch (error) {
      logger.error('Failed to delete role via API', { error, roleId, tenantId, userId });
      throw error;
    }
  }

  /**
   * Clear all role-related caches
   */
  private async clearRolesCaches(tenantId: number | null): Promise<void> {
    try {
      const redis = await getRedisClient();
      const patterns = [
        `cache:${tenantId ?? 'global'}:roles:*`,
        `cache:${tenantId ?? 'global'}:permissions:*`,
        `cache:${tenantId ?? 'global'}:users:*`,
      ];

      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }

      logger.debug('Cleared role caches', { tenantId });
    } catch (error) {
      logger.warn('Failed to clear role caches', { error, tenantId });
    }
  }
}

// Export singleton instance
export const rolesService = RolesService.getInstance(); 