/**
 * Detailed Permission Checker - Database-backed permission checking
 * 
 * This extends the unified permission system with database access for
 * detailed permission validation. Used in:
 * - API routes
 * - Server components
 * - Server actions
 */

import { db } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import {
  type BasicUserContext,
  type DetailedUserContext,
  type PermissionCheck,
  type PermissionResult,
  type AdminRoleType,
  hasAdminAccess,
  canAccessRoute as basicCanAccessRoute,
  canAccessAPI as basicCanAccessAPI,
  formatPermission
} from './unified-permission-system';

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const PERMISSION_CACHE_TTL = 5 * 60; // 5 minutes
const PERMISSION_CACHE_PREFIX = 'permissions:user:';

// ============================================================================
// DETAILED PERMISSION CHECKING
// ============================================================================

/**
 * Get detailed user context with database-backed permissions
 */
export async function getDetailedUserContext(basicContext: BasicUserContext): Promise<DetailedUserContext> {
  if (!basicContext.isAuthenticated || !basicContext.userId) {
    return { ...basicContext };
  }

  // Check cache first
  const cached = await getCachedPermissions(basicContext.userId);
  if (cached) {
    return { ...basicContext, ...cached };
  }

  try {
    // Get role-specific permissions from enhanced permission system
    if (basicContext.userId) {
      const userRolesData = await db.userRole.findMany({
        where: {
          userId: parseInt(basicContext.userId),
          OR: [
            { validUntil: null }, // Permanent roles
            { validUntil: { gte: new Date() } } // Active roles
          ]
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });

      // Flatten the permissions data
      const userPermissions = [];
      for (const userRole of userRolesData) {
        for (const rp of userRole.role.permissions) {
          userPermissions.push({
            roleName: userRole.role.name,
            roleLevel: userRole.role.level,
            permissionName: rp.permission.name,
            permissionAction: rp.permission.action,
            permissionResource: rp.permission.resource,
            permissionScope: rp.permission.scope
          });
        }
      }

      if (userPermissions.length === 0) {
        // No active roles found
        const detailedContext: DetailedUserContext = {
          ...basicContext,
          permissions: [],
          tenantPermissions: {},
          lastPermissionCheck: Date.now()
        };

        await cachePermissions(basicContext.userId, detailedContext);
        return detailedContext;
      }

      // Check if user has super admin role
      const isSuperAdmin = userPermissions.some(p => p.roleName === 'super_admin');
      const adminRole = userPermissions.find(p => ['super_admin', 'tenant_admin', 'content_moderator'].includes(p.roleName));

      // Convert permissions to the expected format
      const permissionStrings: string[] = [];

      // Super admin gets all permissions automatically
      if (isSuperAdmin) {
        const allPermissions = [
          'view:dashboard', 'manage:dashboard',
          'view:users', 'create:users', 'update:users', 'delete:users', 'manage:users',
          'view:applications', 'create:applications', 'update:applications', 'delete:applications', 'approve:applications',
          'view:media', 'create:media', 'update:media', 'delete:media', 'review:media',
          'view:analytics', 'export:analytics',
          'view:settings', 'update:settings', 'manage:settings',
          'view:translations', 'create:translations', 'update:translations', 'delete:translations', 'manage:translations',
          'view:workflows', 'create:workflows', 'update:workflows', 'delete:workflows', 'manage:workflows',
          'view:tenants', 'create:tenants', 'update:tenants', 'delete:tenants', 'manage:tenants',
          'view:audit', 'export:audit',
          'view:preferences', 'update:preferences'
        ];

        const detailedContext: DetailedUserContext = {
          ...basicContext,
          adminRole: 'super_admin' as any,
          permissions: allPermissions,
          tenantPermissions: {},
          lastPermissionCheck: Date.now()
        };

        await cachePermissions(basicContext.userId, detailedContext);
        return detailedContext;
      }

      // For other roles, map enhanced permissions to legacy permission strings
      const permissionMap = new Set(userPermissions.map(p => `${p.permissionAction}.${p.permissionResource}`));

      // Map enhanced permissions to legacy permission strings
      if (permissionMap.has('approve.applications')) {
        permissionStrings.push('approve:applications', 'view:applications');
      }

      if (permissionMap.has('moderate.media') || permissionMap.has('review.media')) {
        permissionStrings.push('review:media', 'view:media');
      }

      if (permissionMap.has('manage.users')) {
        permissionStrings.push('manage:users', 'view:users', 'create:users', 'update:users', 'delete:users');
      }

      if (permissionMap.has('read.analytics')) {
        permissionStrings.push('view:analytics', 'export:analytics');
      }

      if (permissionMap.has('manage.translations') || permissionMap.has('manage.media')) {
        permissionStrings.push('manage:translations', 'view:translations', 'create:translations', 'update:translations');
      }

      // Role-specific permissions
      if (adminRole) {
        switch (adminRole.roleName) {
          case 'tenant_admin':
            permissionStrings.push('view:dashboard', 'manage:dashboard', 'view:preferences', 'update:preferences');
            break;
          case 'content_moderator':
            permissionStrings.push('view:dashboard', 'view:preferences', 'update:preferences');
            break;
          default:
            permissionStrings.push('view:dashboard', 'view:preferences', 'update:preferences');
        }
      }

      const detailedContext: DetailedUserContext = {
        ...basicContext,
        adminRole: (adminRole?.roleName as any) || undefined,
        permissions: [...new Set(permissionStrings)], // Remove duplicates
        tenantPermissions: {},
        lastPermissionCheck: Date.now()
      };

      await cachePermissions(basicContext.userId, detailedContext);
      return detailedContext;
    }

    // Regular user - no admin permissions
    const detailedContext: DetailedUserContext = {
      ...basicContext,
      permissions: [],
      tenantPermissions: {},
      lastPermissionCheck: Date.now()
    };

    await cachePermissions(basicContext.userId, detailedContext);
    return detailedContext;

  } catch (error) {
    logger.error('Failed to get detailed user context', { 
      userId: basicContext.userId, 
      error: error instanceof Error ? error.message : String(error)
    });

    // Fallback to basic context
    return { ...basicContext };
  }
}

/**
 * Enhanced route access check with database-backed permissions
 */
export async function canAccessRoute(userContext: BasicUserContext, path: string): Promise<PermissionResult> {
  // First check basic permissions
  const basicResult = basicCanAccessRoute(userContext, path);

  // If basic check succeeds without needing detailed check, return it
  if (basicResult.allowed && !basicResult.requiresDetailedCheck) {
    return basicResult;
  }

  // If basic check fails due to admin access required, check detailed permissions
  if (!basicResult.allowed && basicResult.reason?.includes('Admin access required')) {
    // Get detailed permissions to check if user is actually an admin
    const detailedContext = await getDetailedUserContext(userContext);

    if (detailedContext.adminRole) {
      // User is an admin, allow access
      return { 
        allowed: true, 
        reason: `Admin access granted via ${detailedContext.adminRole}` 
      };
    }
  }

  // For other cases that require detailed check, get detailed context
  if (basicResult.requiresDetailedCheck) {
    const detailedContext = await getDetailedUserContext(userContext);

    // Check if user has admin role for admin routes
    if (path.startsWith('/admin') && detailedContext.adminRole) {
      return { 
        allowed: true, 
        reason: `Admin route access granted via ${detailedContext.adminRole}` 
      };
    }
  }

  return basicResult;
}

/**
 * Enhanced API access check with database-backed permissions
 */
export async function canAccessAPI(
  userContext: BasicUserContext, 
  path: string, 
  method: string = 'GET'
): Promise<PermissionResult> {
  // First check basic permissions
  const basicResult = basicCanAccessAPI(userContext, path, method);

  // If basic check succeeds without needing detailed check, return it
  if (basicResult.allowed && !basicResult.requiresDetailedCheck) {
    return basicResult;
  }

  // If basic check fails due to admin access required, check detailed permissions
  if (!basicResult.allowed && basicResult.reason?.includes('Admin access required')) {
    // Get detailed permissions to check if user is actually an admin
    const detailedContext = await getDetailedUserContext(userContext);

    if (detailedContext.adminRole) {
      // User is an admin, allow access
      return { 
        allowed: true, 
        reason: `Admin API access granted via ${detailedContext.adminRole}` 
      };
    }
  }

  // For other cases that require detailed check, get detailed context
  if (basicResult.requiresDetailedCheck) {
    const detailedContext = await getDetailedUserContext(userContext);

    // Check if user has admin role for admin APIs
    if (path.includes('/admin') && detailedContext.adminRole) {
      return { 
        allowed: true, 
        reason: `Admin API access granted via ${detailedContext.adminRole}` 
      };
    }
  }

  return basicResult;
}

/**
 * Check specific permission with database validation
 */
export async function checkPermission(
  userContext: BasicUserContext,
  check: PermissionCheck
): Promise<PermissionResult> {
  if (!userContext.isAuthenticated) {
    return { allowed: false, reason: 'Not authenticated' };
  }

  // Super admin bypasses all checks
  if (userContext.adminRole === 'super_admin') {
    return { allowed: true, reason: 'Super admin access' };
  }

  // Get detailed permissions
  const detailedContext = await getDetailedUserContext(userContext);

  if (!detailedContext.permissions) {
    return { allowed: false, reason: 'Unable to load permissions' };
  }

  const requiredPermission = formatPermission(check.action, check.resource);

  if (detailedContext.permissions.includes(requiredPermission)) {
    return { allowed: true, reason: `Permission ${requiredPermission} granted` };
  }

  // Check for broader 'manage' permission
  if (check.action !== 'manage') {
    const managePermission = formatPermission('manage', check.resource);
    if (detailedContext.permissions.includes(managePermission)) {
      return { allowed: true, reason: `Manage permission ${managePermission} granted` };
    }
  }

  return { 
    allowed: false, 
    reason: `Permission ${requiredPermission} not granted` 
  };
}

/**
 * Check multiple permissions at once
 */
export async function checkMultiplePermissions(
  userContext: BasicUserContext,
  checks: PermissionCheck[]
): Promise<PermissionResult[]> {
  return Promise.all(checks.map(check => checkPermission(userContext, check)));
}

/**
 * Check if user has any of the specified permissions (OR logic)
 */
export async function hasAnyPermission(
  userContext: BasicUserContext,
  checks: PermissionCheck[]
): Promise<PermissionResult> {
  const results = await checkMultiplePermissions(userContext, checks);

  const allowed = results.some(result => result.allowed);
  const allowedChecks = results.filter(result => result.allowed);

  if (allowed) {
    return { 
      allowed: true, 
      reason: `Granted via: ${allowedChecks.map(r => r.reason).join(', ')}` 
    };
  }

  return { 
    allowed: false, 
    reason: `None of the required permissions granted: ${results.map(r => r.reason).join(', ')}` 
  };
}

/**
 * Check if user has all of the specified permissions (AND logic)
 */
export async function hasAllPermissions(
  userContext: BasicUserContext,
  checks: PermissionCheck[]
): Promise<PermissionResult> {
  const results = await checkMultiplePermissions(userContext, checks);

  const allAllowed = results.every(result => result.allowed);
  const deniedChecks = results.filter(result => !result.allowed);

  if (allAllowed) {
    return { 
      allowed: true, 
      reason: 'All required permissions granted' 
    };
  }

  return { 
    allowed: false, 
    reason: `Missing permissions: ${deniedChecks.map(r => r.reason).join(', ')}` 
  };
}

// ============================================================================
// PERMISSION CACHE UTILITIES
// ============================================================================

async function getCachedPermissions(userId: string): Promise<Partial<DetailedUserContext> | null> {
  try {
    const redis = await getRedisClient();
    const cached = await redis.get(`${PERMISSION_CACHE_PREFIX}${userId}`);

    if (cached) {
      const parsed = JSON.parse(cached);

      // Check if cache is still valid (not older than 5 minutes)
      if (parsed.lastPermissionCheck && (Date.now() - parsed.lastPermissionCheck) < PERMISSION_CACHE_TTL * 1000) {
        return parsed;
      }
    }

    return null;
  } catch (error) {
    logger.warn('Failed to get cached permissions', { userId, error });
    return null;
  }
}

async function cachePermissions(userId: string, context: DetailedUserContext): Promise<void> {
  try {
    const redis = await getRedisClient();

    const cacheData = {
      permissions: context.permissions,
      tenantPermissions: context.tenantPermissions,
      lastPermissionCheck: context.lastPermissionCheck
    };

    await redis.setex(
      `${PERMISSION_CACHE_PREFIX}${userId}`,
      PERMISSION_CACHE_TTL,
      JSON.stringify(cacheData)
    );
  } catch (error) {
    logger.warn('Failed to cache permissions', { userId, error });
  }
}

/**
 * Clear permission cache for user (call when permissions change)
 */
export async function clearPermissionCache(userId: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.del(`${PERMISSION_CACHE_PREFIX}${userId}`);
  } catch (error) {
    logger.warn('Failed to clear permission cache', { userId, error });
  }
} 