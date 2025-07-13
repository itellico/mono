/**
 * @fileoverview Unified Permission Service - Centralized permission checking for itellico Mono
 * @version 1.0.0
 * @author itellico Mono
 * 
 * @description
 * This service provides unified permission validation across all platform features,
 * replacing the old admin_roles system with enhanced permissions that support:
 * - Tenant isolation
 * - Hierarchical scopes (global, tenant, account, resource, self)
 * - Redis caching for performance
 * - Permission inheritance validation
 */

import { db } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import type { 
  Permission,
  Role,
  UserRole,
  RolePermission
} from '@/lib/schemas/permissions';

// Type definitions are now imported from schema file

/**
 * Permission validation result with detailed context
 */
export interface PermissionValidationResult {
  hasPermission: boolean;
  reason?: string;
  grantedBy?: 'role' | 'direct' | 'inheritance';
  scope?: string;
  tenantContext?: number | null;
  accountContext?: number | null;
  resourceContext?: string | null;
}

/**
 * Enhanced permission context for validation
 */
export interface PermissionContext {
  tenantId?: number | null;
  accountId?: number | null;
  resourceId?: string | null;
  resourceType?: string | null;
  requireExactScope?: boolean;
  allowInheritance?: boolean;
}

/**
 * User permission summary with all granted permissions
 */
export interface UserPermissionSummary {
  userId: number;
  directPermissions: Permission[];
  roleBasedPermissions: Permission[];
  inheritedPermissions: Permission[];
  effectivePermissions: string[];
  roles: Role[];
  tenantContexts: number[];
  accountContexts: number[];
}

/**
 * Unified Permission Service
 * 
 * @description Central service for all permission validation across itellico Mono.
 * Replaces legacy admin_roles system with enhanced permission checking.
 */
export class UnifiedPermissionService {
  private static readonly CACHE_TTL = 300; // 5 minutes
  private static readonly CACHE_PREFIX = 'permission:';

  /**
   * Check if user has specific permission with context validation
   */
  static async hasPermission(
    userId: number,
    permissionName: string,
    context: PermissionContext = {}
  ): Promise<PermissionValidationResult> {
    try {
      const cacheKey = this.buildCacheKey(userId, permissionName, context);
      
      // Try cache first with graceful fallback
      try {
        const redis = await getRedisClient();
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.debug('Permission check cache hit', { 
            userId, 
            permission: permissionName, 
            context 
          });
          return JSON.parse(cached) as PermissionValidationResult;
        }
      } catch (redisError) {
        logger.warn('Redis unavailable, proceeding without cache', {
          error: redisError instanceof Error ? redisError.message : String(redisError)
        });
      }

      // Perform permission validation
      const result = await this.validatePermission(userId, permissionName, context);

      // Cache result if Redis is available
      try {
        const redis = await getRedisClient();
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      } catch (redisError) {
        logger.warn('Failed to cache permission result', {
          error: redisError instanceof Error ? redisError.message : String(redisError)
        });
      }

      logger.debug('Permission validated', {
        userId,
        permission: permissionName,
        context,
        result: result.hasPermission,
        grantedBy: result.grantedBy
      });

      return result;
    } catch (error) {
      logger.error('Permission validation failed', {
        userId,
        permission: permissionName,
        context,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        hasPermission: false,
        reason: 'Permission validation error',
        scope: undefined
      };
    }
  }

  /**
   * Get comprehensive permission summary for user
   */
  static async getUserPermissionSummary(
    userId: number,
    tenantId?: number
  ): Promise<UserPermissionSummary> {
    const cacheKey = `${this.CACHE_PREFIX}summary:${userId}:${tenantId || 'global'}`;
    
    // Try cache first
    try {
      const redis = await getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as UserPermissionSummary;
      }
    } catch (redisError) {
      logger.warn('Redis unavailable for permission summary', {
        error: redisError instanceof Error ? redisError.message : String(redisError)
      });
    }

    // Note: Direct user permissions are not implemented in current schema
    const directPermissions = [];

    // Get user's role-based permissions
    const roleBasedQuery = await db.userRole.findMany({
      where: {
        userId,
        isActive: true,
        role: {
          isActive: true
        },
        ...(tenantId && { tenantId })
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    // Get user's roles
    const userRolesList = await db.userRole.findMany({
      where: {
        userId,
        isActive: true,
        ...(tenantId && { tenantId })
      },
      include: {
        role: true
      }
    });

    // Extract role-based permissions from nested structure
    const roleBasedPermissions: Permission[] = [];
    roleBasedQuery.forEach(userRole => {
      userRole.role.rolePermissions.forEach(rp => {
        roleBasedPermissions.push(rp.permission);
      });
    });

    // Build summary
    const summary: UserPermissionSummary = {
      userId,
      directPermissions: directPermissions,
      roleBasedPermissions: roleBasedPermissions,
      inheritedPermissions: [], // TODO: Implement inheritance logic
      effectivePermissions: [
        ...roleBasedPermissions.map(p => p.name)
      ],
      roles: userRolesList.map(r => r.role),
      tenantContexts: [], // TODO: Get from user memberships
      accountContexts: [] // TODO: Get from user memberships
    };

    // Cache summary if Redis is available
    try {
      const redis = await getRedisClient();
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(summary));
    } catch (redisError) {
      logger.warn('Failed to cache permission summary', {
        error: redisError instanceof Error ? redisError.message : String(redisError)
      });
    }

    return summary;
  }

  /**
   * Validate multiple permissions at once
   */
  static async hasPermissions(
    userId: number,
    permissionNames: string[],
    context: PermissionContext = {}
  ): Promise<Record<string, PermissionValidationResult>> {
    const results: Record<string, PermissionValidationResult> = {};

    // Validate all permissions in parallel
    const validations = permissionNames.map(async (permissionName) => {
      const result = await this.hasPermission(userId, permissionName, context);
      return { permissionName, result };
    });

    const completed = await Promise.all(validations);
    
    for (const { permissionName, result } of completed) {
      results[permissionName] = result;
    }

    return results;
  }

  /**
   * Check if user has ANY of the specified permissions
   */
  static async hasAnyPermission(
    userId: number,
    permissionNames: string[],
    context: PermissionContext = {}
  ): Promise<PermissionValidationResult> {
    const results = await this.hasPermissions(userId, permissionNames, context);
    
    for (const [permissionName, result] of Object.entries(results)) {
      if (result.hasPermission) {
        return {
          ...result,
          reason: `Granted via permission: ${permissionName}`
        };
      }
    }

    return {
      hasPermission: false,
      reason: `Missing all required permissions: ${permissionNames.join(', ')}`
    };
  }

  /**
   * Check if user has ALL of the specified permissions
   */
  static async hasAllPermissions(
    userId: number,
    permissionNames: string[],
    context: PermissionContext = {}
  ): Promise<PermissionValidationResult> {
    const results = await this.hasPermissions(userId, permissionNames, context);
    
    for (const [permissionName, result] of Object.entries(results)) {
      if (!result.hasPermission) {
        return {
          hasPermission: false,
          reason: `Missing required permission: ${permissionName}`
        };
      }
    }

    return {
      hasPermission: true,
      reason: 'All required permissions granted',
      grantedBy: 'role' // TODO: Determine actual grant source
    };
  }

  /**
   * Invalidate permission cache for user
   */
  static async invalidateUserCache(userId: number, tenantId?: number): Promise<void> {
    try {
      const redis = await getRedisClient();

      if (tenantId) {
        // Invalidate specific tenant context
        const pattern = `${this.CACHE_PREFIX}*:${userId}:*:${tenantId}:*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        // Invalidate all user permissions
        const pattern = `${this.CACHE_PREFIX}*:${userId}:*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }

      logger.debug('Permission cache invalidated', { userId, tenantId });
    } catch (error) {
      logger.error('Permission cache invalidation failed', { 
        userId, 
        tenantId, 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Internal permission validation logic
   */
  private static async validatePermission(
    userId: number,
    permissionName: string,
    context: PermissionContext
  ): Promise<PermissionValidationResult> {
    // Note: Direct user permissions are not implemented in current Prisma schema
    // All permissions are granted through roles only

    // Check role-based permissions
    const rolePermission = await db.userRole.findFirst({
      where: {
        userId,
        isActive: true,
        role: {
          isActive: true,
          rolePermissions: {
            some: {
              permission: {
                name: permissionName
              }
            }
          }
        },
        ...(context.tenantId && { tenantId: context.tenantId }),
        ...(context.accountId && { accountId: context.accountId })
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              where: {
                permission: {
                  name: permissionName
                }
              },
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (rolePermission && rolePermission.role.rolePermissions.length > 0) {
      const permission = rolePermission.role.rolePermissions[0].permission;
      return {
        hasPermission: true,
        grantedBy: 'role',
        scope: permission.scope,
        tenantContext: rolePermission.tenantId,
        accountContext: rolePermission.accountId
      };
    }

    // No permission found
    return {
      hasPermission: false,
      reason: 'Permission not granted',
      scope: undefined
    };
  }


  /**
   * Build cache key for permission check
   */
  private static buildCacheKey(
    userId: number,
    permissionName: string,
    context: PermissionContext
  ): string {
    return `${this.CACHE_PREFIX}${userId}:${permissionName}:${context.tenantId || 'null'}:${context.accountId || 'null'}:${context.resourceId || 'null'}`;
  }
}

/**
 * Convenience function for permission checking (maintains compatibility)
 */
export async function hasUnifiedPermission(
  userId: number,
  permission: string,
  tenantId?: number | null,
  accountId?: number | null
): Promise<boolean> {
  const result = await UnifiedPermissionService.hasPermission(userId, permission, {
    tenantId,
    accountId
  });
  return result.hasPermission;
}

/**
 * Enhanced permission checking with detailed context
 */
export async function validateUnifiedPermission(
  userId: number,
  permission: string,
  context: PermissionContext = {}
): Promise<PermissionValidationResult> {
  return UnifiedPermissionService.hasPermission(userId, permission, context);
} 