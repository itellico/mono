// ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
// ❌ REMOVED: Direct database imports (architectural violation)
// import { db as prisma } from '@/lib/db'
import { cache, CacheKeyBuilder } from '@/lib/cache/cache-middleware'
import { logger } from '@/lib/logger'
import { PermissionsApiService } from '@/lib/api-clients/permissions.api';

/**
 * Enhanced Permissions Service
 * Unified Role/Permission system with Redis caching
 */

export interface UserPermissionData {
  userId: string;
  tenantId: number;
  accountId: string;
  roles: Array<{
    id: number;
    name: string;
    code: string;
    description?: string;
  }>;
  permissions: string[];
  lastUpdated: number;
}

export interface PermissionCheckContext {
  userId: string;
  tenantId?: number;
  path?: string;
  method?: string;
  resource?: string;
  action?: string;
}

export class PermissionsService {
  private static instance: PermissionsService;

  private constructor() {}

  public static getInstance(): PermissionsService {
    if (!PermissionsService.instance) {
      PermissionsService.instance = new PermissionsService();
    }
    return PermissionsService.instance;
  }

  /**
   * ✅ Get user permissions with unified cache middleware
   * Cache TTL: 5 minutes (permissions change infrequently)
   * ✅ GRACEFUL REDIS DEGRADATION: Works without Redis if it fails
   */
  async getUserPermissions(userId: string): Promise<UserPermissionData | null> {
    try {
      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      
      // Create cache key (we still use caching but get data from API)
      const cacheKey = CacheKeyBuilder.user(0, userId, 'permissions'); // Use 0 as tenant fallback
      
      // Use unified cache middleware with API fallback
      const permissionData = await cache.get<UserPermissionData>(cacheKey, {
        ttl: 300, // 5 minutes
        tags: ['permissions', `user:${userId}`],
        fallback: async () => {
          // ✅ Fetch from NestJS API instead of direct database
          const apiPermissionData = await PermissionsApiService.getUserPermissions(userId);
          
          if (!apiPermissionData) {
            logger.warn('❌ User not found for permissions via API', { userId });
            return null;
          }

          logger.info('✅ Permissions loaded from API', { 
            userId, 
            tenantId: apiPermissionData.tenantId,
            rolesCount: apiPermissionData.roles.length,
            permissionsCount: apiPermissionData.permissions.length
          });

          return apiPermissionData;
        }
      });

      return permissionData;

    } catch (error) {
      logger.error('❌ Failed to get user permissions via API', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }

  /**
   * ✅ Check if user has specific permission
   * SUPER ADMIN BYPASS: Super admin always returns true regardless of specific permissions
   */
  async hasPermission(userId: string, permission: string, tenantId?: number): Promise<boolean> {
    try {
      const permissionData = await this.getUserPermissions(userId);
      
      if (!permissionData) {
        return false;
      }

      // 🔥 SUPER ADMIN BYPASS - Super admin has access to everything
      const isSuperAdmin = permissionData.roles.some(role => role.name === 'super_admin');
      if (isSuperAdmin) {
        logger.debug('✅ Super admin bypass - full access granted', { 
          userId, 
          permission,
          tenantId: permissionData.tenantId
        });
        return true;
      }

      // Check tenant isolation for non-super admins
      if (tenantId && permissionData.tenantId !== tenantId) {
        logger.warn('❌ Tenant isolation violation', { userId, tenantId, userTenantId: permissionData.tenantId });
        return false;
      }

      // Check if user has the permission using pattern matching for wildcards
      const hasPermission = this.checkPermissionWithWildcards(permissionData.permissions, permission);
      
      logger.debug('🔍 Permission check', { 
        userId, 
        permission, 
        hasPermission,
        tenantId: permissionData.tenantId,
        userPermissions: permissionData.permissions
      });

      return hasPermission;

    } catch (error) {
      logger.error('❌ Permission check failed', { 
        userId, 
        permission,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Check permission with wildcard support
   */
  private checkPermissionWithWildcards(userPermissions: string[], requiredPermission: string): boolean {
    // Direct match
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Check wildcard patterns
    const requiredParts = requiredPermission.split('.');
    
    for (const userPerm of userPermissions) {
      const userParts = userPerm.split('.');
      
      // Check if pattern lengths match
      if (userParts.length !== requiredParts.length) {
        continue;
      }
      
      // Check if all parts match (with wildcard support)
      const matches = userParts.every((part, index) => 
        part === '*' || part === requiredParts[index]
      );
      
      if (matches) {
        logger.debug('✅ Wildcard permission match', { 
          userPermission: userPerm, 
          requiredPermission,
          matchedPattern: userPerm
        });
        return true;
      }
    }
    
    return false;
  }

  /**
   * ✅ Check if user has specific role
   */
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    try {
      const permissionData = await this.getUserPermissions(userId);
      
      if (!permissionData) {
        return false;
      }

      const hasRole = permissionData.roles.some(role => role.name === roleName);
      
      logger.debug('🔍 Role check', { userId, roleName, hasRole });

      return hasRole;

    } catch (error) {
      logger.error('❌ Role check failed', { 
        userId, 
        roleName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * ✅ Check if user has admin access (replaces AdminRole system)
   * SUPER ADMIN BYPASS: Super admin always has admin access
   */
  async canAccessAdmin(userId: string): Promise<boolean> {
    try {
      const permissionData = await this.getUserPermissions(userId);
      
      if (!permissionData) {
        return false;
      }

      // 🔥 SUPER ADMIN BYPASS - Super admin always has admin access
      const isSuperAdmin = permissionData.roles.some(role => role.name === 'super_admin');
      if (isSuperAdmin) {
        logger.debug('✅ Super admin bypass - admin access granted', { userId });
        return true;
      }

      // Check if user has any admin role
      const adminRoles = ['tenant_admin', 'content_moderator', 'approver', 'support_agent', 'analytics_viewer'];
      const hasAdminRole = permissionData.roles.some(role => 
        adminRoles.includes(role.name)
      );

      // Check if user has admin permissions
      const adminPermissions = ['admin.full_access', 'tenant.manage', 'users.manage', 'content.manage'];
      const hasAdminPermission = permissionData.permissions.some(permission =>
        adminPermissions.includes(permission)
      );

      const canAccess = hasAdminRole || hasAdminPermission;

      logger.debug('🔍 Admin access check', { userId, canAccess, hasAdminRole, hasAdminPermission });

      return canAccess;

    } catch (error) {
      logger.error('❌ Admin access check failed', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * ✅ Check specific admin capability (replaces AdminRole boolean flags)
   * SUPER ADMIN BYPASS: Super admin always has all capabilities
   */
  async hasAdminCapability(userId: string, capability: string): Promise<boolean> {
    try {
      const permissionData = await this.getUserPermissions(userId);
      
      if (!permissionData) {
        return false;
      }

      // 🔥 SUPER ADMIN BYPASS - Super admin has all capabilities
      const isSuperAdmin = permissionData.roles.some(role => role.name === 'super_admin');
      if (isSuperAdmin) {
        logger.debug('✅ Super admin bypass - capability access granted', { userId, capability });
        return true;
      }

      const capabilityMap: Record<string, string[]> = {
        canApproveModels: ['models.approve'],
        canReviewPictures: ['pictures.review'],
        canManageUsers: ['users.manage'],
        canAccessAnalytics: ['analytics.access'],
        canManageContent: ['content.manage'],
        canImpersonateUsers: ['users.impersonate']
      };

      const requiredPermissions = capabilityMap[capability];
      if (!requiredPermissions) {
        logger.warn('❌ Unknown admin capability', { capability });
        return false;
      }

      // Check if user has any of the required permissions
      for (const permission of requiredPermissions) {
        if (await this.hasPermission(userId, permission)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('❌ Admin capability check failed', { 
        userId, 
        capability,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * ✅ Invalidate user permissions cache using unified cache middleware
   */
  async invalidateUserPermissions(userId: string): Promise<void> {
    try {
      // ✅ ARCHITECTURE COMPLIANCE: Use simplified cache invalidation without direct database access
      // Since we cache using fallback tenant 0, we can invalidate directly
      const cacheKey = CacheKeyBuilder.user(0, userId, 'permissions');
      
      // Use unified cache middleware for invalidation
      await cache.delete(cacheKey);
      
      // Also invalidate by tags
      await cache.invalidateByTag(`user:${userId}`);
      
      logger.info('✅ Permissions cache invalidated via API pattern', { userId, cacheKey });
    } catch (error) {
      logger.error('❌ Failed to invalidate permissions cache', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * ✅ Check API access with path-based permissions
   * SUPER ADMIN BYPASS: Super admin always has API access
   */
  async checkAPIAccess(
    userId: string, 
    path: string, 
    method: string = 'GET',
    tenantId?: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const permissionData = await this.getUserPermissions(userId);
      
      if (!permissionData) {
        return { allowed: false, reason: 'User not found' };
      }

      // 🔥 SUPER ADMIN BYPASS - Super admin has access to all APIs
      const isSuperAdmin = permissionData.roles.some(role => role.name === 'super_admin');
      if (isSuperAdmin) {
        logger.debug('✅ Super admin bypass - API access granted', { userId, path });
        return { allowed: true };
      }

      // Check tenant isolation for tenant-specific APIs
      if (tenantId && permissionData.tenantId !== tenantId) {
        return { allowed: false, reason: 'Tenant access denied' };
      }

      // Admin API access check
      if (path.startsWith('/api/v2/admin/')) {
        const canAccess = await this.canAccessAdmin(userId);
        if (!canAccess) {
          return { allowed: false, reason: 'Admin access required' };
        }
      }

      // Path-specific permission checking could be added here
      // For now, basic access is granted if user has valid permissions
      
      return { allowed: true };

    } catch (error) {
      logger.error('❌ API access check failed', { 
        userId, 
        path, 
        method,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { allowed: false, reason: 'Permission check failed' };
    }
  }

  /**
   * ✅ Bulk permission check for multiple permissions
   * SUPER ADMIN BYPASS: Super admin always returns true
   */
  async hasAnyPermission(userId: string, permissions: string[], tenantId?: number): Promise<boolean> {
    try {
      const permissionData = await this.getUserPermissions(userId);
      
      if (!permissionData) {
        return false;
      }

      // 🔥 SUPER ADMIN BYPASS - Super admin has all permissions
      const isSuperAdmin = permissionData.roles.some(role => role.name === 'super_admin');
      if (isSuperAdmin) {
        logger.debug('✅ Super admin bypass - bulk permissions granted', { userId, permissions });
        return true;
      }

      for (const permission of permissions) {
        if (await this.hasPermission(userId, permission, tenantId)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error('❌ Bulk permission check failed', { 
        userId, 
        permissions,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * ✅ Check if user has all specified permissions
   * SUPER ADMIN BYPASS: Super admin always returns true
   */
  async hasAllPermissions(userId: string, permissions: string[], tenantId?: number): Promise<boolean> {
    try {
      const permissionData = await this.getUserPermissions(userId);
      
      if (!permissionData) {
        return false;
      }

      // 🔥 SUPER ADMIN BYPASS - Super admin has all permissions
      const isSuperAdmin = permissionData.roles.some(role => role.name === 'super_admin');
      if (isSuperAdmin) {
        logger.debug('✅ Super admin bypass - all permissions granted', { userId, permissions });
        return true;
      }

      for (const permission of permissions) {
        if (!(await this.hasPermission(userId, permission, tenantId))) {
          return false;
        }
      }
      return true;
    } catch (error) {
      logger.error('❌ All permissions check failed', { 
        userId, 
        permissions,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
}

// Export singleton instance
export const permissionsService = PermissionsService.getInstance(); 