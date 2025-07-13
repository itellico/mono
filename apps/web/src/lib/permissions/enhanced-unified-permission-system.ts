/**
 * Enhanced Unified Permission System for itellico Mono
 * 
 * This module provides permission checking using the enhanced RBAC tables
 * (enhanced_permissions, enhanced_roles, enhanced_user_roles)
 * 
 * Features:
 * - Hierarchical permission system (Super Admin → Tenant → Account → User)
 * - Context-aware permissions (global, tenant, account, resource-specific)
 * - Database-backed with Redis caching
 * - Full audit trail integration
 */

// JWT User type

import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { db as prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

// ============================================================================
// TYPES AND INTERFACES  
// ============================================================================

export type UserRole = 'user' | 'account_owner' | 'moderator' | 'admin' | 'super_admin';

export type EnhancedRoleType = 
  | 'super_admin'
  | 'tenant_admin' 
  | 'content_moderator'
  | 'account_owner'
  | 'talent'
  | 'client';

export type PermissionAction = 
  | 'view' | 'create' | 'update' | 'delete' | 'manage'
  | 'approve' | 'moderate' | 'export' | 'import' | 'read';

export type PermissionResource = 
  | 'users' | 'profiles' | 'applications' | 'media' | 'analytics'
  | 'settings' | 'translations' | 'workflows' | 'tenants' | 'audit'
  | 'preferences' | 'dashboard' | 'billing' | 'jobs' | 'platform';

export type PermissionScope = 
  | 'global' | 'tenant' | 'account' | 'own' | 'managed';

export type PermissionLevel = 
  | 'super_admin' | 'tenant' | 'account' | 'user';

export interface BasicUserContext {
  userId?: string;
  roles?: EnhancedRoleType[];
  tenantId?: string;
  accountId?: string;
  isAuthenticated: boolean;
  email?: string;
}

export interface DetailedUserContext extends BasicUserContext {
  permissions?: EnhancedPermission[];
  tenantPermissions?: Record<string, EnhancedPermission[]>;
  lastPermissionCheck?: number;
}

export interface EnhancedPermission {
  name: string;
  display_name: string;
  action: PermissionAction;
  resource: PermissionResource;
  scope: PermissionScope;
  level: PermissionLevel;
  tenantId?: string;
  accountId?: string;
  resourceId?: string;
}

export interface PermissionCheck {
  action: PermissionAction;
  resource: PermissionResource;
  scope?: PermissionScope;
  tenantId?: string;
  accountId?: string;
  resourceId?: string;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  requiresDetailedCheck?: boolean;
  matchedPermission?: EnhancedPermission;
}

// ============================================================================
// ENHANCED PERMISSION CONSTANTS
// ============================================================================

/**
 * Enhanced admin roles that have access to admin interface
 */
export const ENHANCED_ADMIN_ROLES = [
  'super_admin',
  'tenant_admin', 
  'content_moderator'
] as const;

/**
 * Route-based access matrix using enhanced permission names
 */
export const ENHANCED_ROUTE_ACCESS_MATRIX = {
  '/admin': {
    allowedRoles: ['super_admin', 'tenant_admin', 'content_moderator'] as const,
    requiredPermissions: ['platform.manage.global', 'users.read.tenant', 'analytics.read.tenant']
  },

  '/admin/users': {
    allowedRoles: ['super_admin', 'tenant_admin'] as const,
    requiredPermissions: ['users.manage.tenant', 'users.read.tenant']
  },

  '/admin/applications': {
    allowedRoles: ['super_admin', 'tenant_admin', 'content_moderator'] as const,
    requiredPermissions: ['profiles.moderate.tenant', 'users.read.tenant']
  },

  '/admin/media-review': {
    allowedRoles: ['super_admin', 'tenant_admin', 'content_moderator'] as const,
    requiredPermissions: ['media.moderate.tenant', 'media.approve.tenant']
  },

  '/admin/analytics': {
    allowedRoles: ['super_admin', 'tenant_admin'] as const,
    requiredPermissions: ['analytics.read.tenant', 'platform.analytics.global']
  },

  '/admin/settings': {
    allowedRoles: ['super_admin'] as const,
    requiredPermissions: ['platform.manage.global']
  },

  '/admin/translations': {
    allowedRoles: ['super_admin', 'tenant_admin'] as const,
    requiredPermissions: ['platform.manage.global']
  },

  '/admin/workflows': {
    allowedRoles: ['super_admin', 'tenant_admin'] as const,
    requiredPermissions: ['platform.manage.global', 'analytics.read.tenant']
  },

  '/admin/preferences': {
    allowedRoles: ['super_admin', 'tenant_admin', 'content_moderator'] as const,
    requiredPermissions: ['users.read.tenant']
  },

  '/admin/tenants': {
    allowedRoles: ['super_admin'] as const,
    requiredPermissions: ['platform.manage.global']
  },

  '/admin/audit': {
    allowedRoles: ['super_admin', 'tenant_admin'] as const,
    requiredPermissions: ['platform.analytics.global', 'analytics.read.tenant']
  }
} as const;

/**
 * Enhanced API endpoint access matrix
 */
export const ENHANCED_API_ACCESS_MATRIX = {
  '/api/v1/admin/users': {
    GET: { allowedRoles: ['super_admin', 'tenant_admin'] as const, permissions: ['users.read.tenant'] },
    POST: { allowedRoles: ['super_admin', 'tenant_admin'] as const, permissions: ['users.create.tenant'] },
    PUT: { allowedRoles: ['super_admin', 'tenant_admin'] as const, permissions: ['users.update.tenant'] },
    DELETE: { allowedRoles: ['super_admin'] as const, permissions: ['users.delete.tenant'] }
  },

  '/api/v1/admin/translations': {
    GET: { allowedRoles: ['super_admin', 'tenant_admin', 'content_moderator'] as const, permissions: ['platform.manage.global'] },
    POST: { allowedRoles: ['super_admin', 'tenant_admin'] as const, permissions: ['platform.manage.global'] },
    PUT: { allowedRoles: ['super_admin', 'tenant_admin'] as const, permissions: ['platform.manage.global'] },
    DELETE: { allowedRoles: ['super_admin'] as const, permissions: ['platform.manage.global'] }
  },

  '/api/v1/admin/translations/scan-strings': {
    GET: { allowedRoles: ['super_admin'] as const, permissions: ['platform.manage.global'] }
  },

  '/api/v1/admin/dev/scan-cursor-rules': {
    GET: { allowedRoles: ['super_admin'] as const, permissions: ['platform.manage.global'] }
  },

  '/api/v1/workflows': {
    GET: { allowedRoles: ['super_admin', 'tenant_admin'] as const, permissions: ['analytics.read.tenant'] },
    POST: { allowedRoles: ['super_admin'] as const, permissions: ['platform.manage.global'] },
    PUT: { allowedRoles: ['super_admin'] as const, permissions: ['platform.manage.global'] },
    DELETE: { allowedRoles: ['super_admin'] as const, permissions: ['platform.manage.global'] }
  },

  '/api/v1/admin/preferences': {
    GET: { allowedRoles: ['super_admin', 'tenant_admin', 'content_moderator'] as const, permissions: ['users.read.tenant'] },
    PUT: { allowedRoles: ['super_admin', 'tenant_admin', 'content_moderator'] as const, permissions: ['users.update.tenant'] }
  },

  '/api/v1/admin/categories': {
    GET: { allowedRoles: ['super_admin', 'tenant_admin', 'content_moderator'] as const, permissions: ['categories.read.tenant'] },
    POST: { allowedRoles: ['super_admin', 'tenant_admin', 'content_moderator'] as const, permissions: ['categories.create.tenant'] },
    PUT: { allowedRoles: ['super_admin', 'tenant_admin', 'content_moderator'] as const, permissions: ['categories.update.tenant'] },
    DELETE: { allowedRoles: ['super_admin', 'tenant_admin'] as const, permissions: ['categories.delete.tenant'] }
  },

  '/api/v1/admin/tags': {
    GET: { allowedRoles: ['super_admin', 'tenant_admin', 'content_moderator'] as const, permissions: ['tags.read.tenant'] },
    POST: { allowedRoles: ['super_admin', 'tenant_admin', 'content_moderator'] as const, permissions: ['tags.create.tenant'] },
    PUT: { allowedRoles: ['super_admin', 'tenant_admin', 'content_moderator'] as const, permissions: ['tags.update.tenant'] },
    DELETE: { allowedRoles: ['super_admin', 'tenant_admin'] as const, permissions: ['tags.delete.tenant'] }
  },

  '/api/v1/profiles': {
    GET: { allowedRoles: ['super_admin', 'tenant_admin', 'content_moderator'] as const, permissions: ['profiles.moderate.tenant'] },
    POST: { allowedRoles: ['talent', 'client'] as const, permissions: ['profiles.create.own'] },
    PUT: { allowedRoles: ['talent', 'client'] as const, permissions: ['profiles.update.own'] }
  },

  '/api/v1/media': {
    GET: { allowedRoles: ['super_admin', 'tenant_admin', 'content_moderator'] as const, permissions: ['media.moderate.tenant'] },
    POST: { allowedRoles: ['talent'] as const, permissions: ['media.upload.own'] },
    PUT: { allowedRoles: ['talent'] as const, permissions: ['media.manage.own'] },
    DELETE: { allowedRoles: ['talent'] as const, permissions: ['media.manage.own'] }
  },

  '/api/v1/jobs': {
    GET: { allowedRoles: ['client', 'talent'] as const, permissions: ['jobs.apply.tenant'] },
    POST: { allowedRoles: ['client'] as const, permissions: ['jobs.create.tenant'] },
    PUT: { allowedRoles: ['client'] as const, permissions: ['jobs.manage.own'] }
  }
} as const;

// ============================================================================
// CACHING AND DATABASE
// ============================================================================

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const REDIS_KEY_PREFIX = 'enhanced_permissions';

/**
 * Get database connection for permission queries
 */
function getPermissionDatabase() {
  return prisma;
}

// ============================================================================
// ENHANCED PERMISSION CHECKING
// ============================================================================

/**
 * Extract enhanced user context from session
 */
export function extractUserContext(sessionOrToken: any): BasicUserContext {
  if (!sessionOrToken) {
    return { isAuthenticated: false };
  }

  const session = sessionOrToken as Session;
  const user = session.user as any;

  if (!user) {
    return { isAuthenticated: false };
  }

  // Get enhanced roles from session (JWT auth system)
  const roles: EnhancedRoleType[] = user.roles || [];

  // Enhanced roles are now loaded from the JWT token
  // This replaces the legacy admin_roles system

  return {
    userId: user.id?.toString(),
    roles,
    tenantId: user.adminRole?.tenantId?.toString(),
    accountId: user.accountId?.toString(),
    isAuthenticated: true,
    email: user.email
  };
}

/**
 * Check if user has admin access using enhanced roles
 */
export function hasAdminAccess(userContext: BasicUserContext): boolean {
  if (!userContext.isAuthenticated || !userContext.roles) {
    return false;
  }

  return userContext.roles.some(role => 
    ENHANCED_ADMIN_ROLES.includes(role as typeof ENHANCED_ADMIN_ROLES[number])
  );
}

/**
 * Check route access using enhanced permission system
 */
export function canAccessRoute(userContext: BasicUserContext, path: string): PermissionResult {
  if (!userContext.isAuthenticated) {
    logger.warn({
      eventType: 'route_access_denied',
      path,
      reason: 'User not authenticated',
      type: 'security_event'
    }, 'Security Event: route_access_denied');

    return { 
      allowed: false, 
      reason: 'User not authenticated' 
    };
  }

  const matchingRoute = getMatchingRoute(path);
  if (!matchingRoute) {
    return { 
      allowed: true, 
      reason: 'No specific restrictions for this route' 
    };
  }

  const routeConfig = ENHANCED_ROUTE_ACCESS_MATRIX[matchingRoute as keyof typeof ENHANCED_ROUTE_ACCESS_MATRIX];

  const hasRoleAccess = userContext.roles?.some(role => 
    routeConfig.allowedRoles.includes(role as any)
  );

  if (!hasRoleAccess) {
    logger.warn({
      eventType: 'route_access_denied',
      path,
      userId: userContext.userId,
      userRoles: userContext.roles,
      requiredRoles: routeConfig.allowedRoles,
      reason: 'Insufficient role access',
      type: 'security_event'
    }, 'Security Event: route_access_denied');

    return { 
      allowed: false, 
      reason: `Insufficient role access. Required: ${routeConfig.allowedRoles.join(', ')}` 
    };
  }

  logger.info({
    eventType: 'route_access_granted',
    path,
    userId: userContext.userId,
    userRoles: userContext.roles,
    type: 'security_event'
  }, 'Security Event: route_access_granted');

  return { 
    allowed: true, 
    reason: 'Enhanced role check passed',
    requiresDetailedCheck: true
  };
}

/**
 * Check API access using enhanced permission system
 */
export function canAccessAPI(
  userContext: BasicUserContext, 
  path: string, 
  method: string = 'GET'
): PermissionResult {
  if (!userContext.isAuthenticated) {
    logger.warn({
      eventType: 'api_access_denied',
      path,
      method,
      reason: 'User not authenticated',
      type: 'security_event'
    }, 'Security Event: api_access_denied');

    return { 
      allowed: false, 
      reason: 'User not authenticated' 
    };
  }

  const matchingAPI = getMatchingAPI(path);
  if (!matchingAPI) {
    return { 
      allowed: true, 
      reason: 'No specific restrictions for this API endpoint' 
    };
  }

  const apiConfig = ENHANCED_API_ACCESS_MATRIX[matchingAPI as keyof typeof ENHANCED_API_ACCESS_MATRIX];
  const methodConfig = apiConfig[method as keyof typeof apiConfig] as any;

  if (!methodConfig) {
    logger.warn({
      eventType: 'api_access_denied',
      path,
      method,
      userId: userContext.userId,
      reason: 'Method not allowed',
      type: 'security_event'
    }, 'Security Event: api_access_denied');

    return { 
      allowed: false, 
      reason: `Method ${method} not allowed for this endpoint` 
    };
  }

  const hasRoleAccess = userContext.roles?.some(role => 
    methodConfig.allowedRoles.includes(role as any)
  );

  if (!hasRoleAccess) {
    logger.warn({
      eventType: 'api_access_denied',
      path,
      method,
      userId: userContext.userId,
      userRoles: userContext.roles,
      requiredRoles: methodConfig.allowedRoles,
      reason: 'Insufficient role access',
      type: 'security_event'
    }, 'Security Event: api_access_denied');

    return { 
      allowed: false, 
      reason: `Insufficient role access. Required: ${methodConfig.allowedRoles.join(', ')}` 
    };
  }

  logger.info({
    eventType: 'api_access_granted',
    path,
    method,
    userId: userContext.userId,
    userRoles: userContext.roles,
    type: 'security_event'
  }, 'Security Event: api_access_granted');

  return { 
    allowed: true, 
    reason: 'Enhanced role check passed',
    requiresDetailedCheck: true
  };
}

/**
 * Detailed permission check using enhanced database tables with Redis caching
 */
export async function checkEnhancedPermission(
  userContext: BasicUserContext,
  check: PermissionCheck
): Promise<PermissionResult> {
  if (!userContext.isAuthenticated || !userContext.userId) {
    return { 
      allowed: false, 
      reason: 'User not authenticated' 
    };
  }

  try {
    // Check Redis cache first
    const cacheKey = `${REDIS_KEY_PREFIX}:${userContext.userId}:${userContext.tenantId || 'global'}`;
    const redis = await getRedisClient();

    let userPermissions: EnhancedPermission[];

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        userPermissions = JSON.parse(cached);
        logger.info({
          eventType: 'permission_check_cache_hit',
          userId: userContext.userId,
          tenantId: userContext.tenantId,
          check,
          type: 'api_request'
        }, 'API Request: permission_check_cache_hit');
      } else {
        // Query database for user's permissions
        userPermissions = await getUserEnhancedPermissions(
          parseInt(userContext.userId), 
          userContext.tenantId ? parseInt(userContext.tenantId) : null
        );

        // Cache the result
        await redis.setex(cacheKey, CACHE_TTL / 1000, JSON.stringify(userPermissions));

        logger.info({
          eventType: 'permission_check_cache_miss',
          userId: userContext.userId,
          tenantId: userContext.tenantId,
          permissionsFound: userPermissions.length,
          check,
          type: 'api_request'
        }, 'API Request: permission_check_cache_miss');
      }
    } catch (redisError) {
      logger.error({
        eventType: 'permission_check_redis_error',
        userId: userContext.userId,
        error: redisError,
        fallbackToDb: true,
        type: 'api_request'
      }, 'API Request: permission_check_redis_error');

      // Fallback to database if Redis fails
      userPermissions = await getUserEnhancedPermissions(
        parseInt(userContext.userId), 
        userContext.tenantId ? parseInt(userContext.tenantId) : null
      );
    }

    // Find matching permission
    const matchingPermission = userPermissions.find(perm => {
      // Match action and resource
      if (perm.action !== check.action || perm.resource !== check.resource) {
        return false;
      }

      // Check scope compatibility
      if (check.scope && perm.scope !== check.scope) {
        // Allow higher scope to cover lower scope
        const scopeHierarchy = ['global', 'tenant', 'account', 'own'];
        const permScopeIndex = scopeHierarchy.indexOf(perm.scope);
        const checkScopeIndex = scopeHierarchy.indexOf(check.scope);

        if (permScopeIndex === -1 || checkScopeIndex === -1 || permScopeIndex > checkScopeIndex) {
          return false;
        }
      }

      // Check tenant context
      if (check.tenantId && perm.tenantId && perm.tenantId !== check.tenantId) {
        return false;
      }

      return true;
    });

    if (matchingPermission) {
      logger.info({
        eventType: 'permission_granted',
        userId: userContext.userId,
        permission: matchingPermission.name,
        check,
        type: 'security_event'
      }, 'Security Event: permission_granted');

      return {
        allowed: true,
        reason: `Permission granted via ${matchingPermission.name}`,
        matchedPermission: matchingPermission
      };
    }

    logger.warn({
      eventType: 'permission_denied',
      userId: userContext.userId,
      check,
      availablePermissions: userPermissions.map(p => p.name),
      type: 'security_event'
    }, 'Security Event: permission_denied');

    return {
      allowed: false,
      reason: `No matching permission found for ${check.action}:${check.resource} in scope ${check.scope || 'any'}`
    };

  } catch (error) {
    logger.error({
      eventType: 'permission_check_error',
      userId: userContext.userId,
      error,
      check,
      type: 'api_request'
    }, 'API Request: permission_check_error');

    return {
      allowed: false,
      reason: 'Permission check failed due to system error'
    };
  }
}

/**
 * Get user's enhanced permissions from database with tenant isolation
 */
async function getUserEnhancedPermissions(
  userId: number, 
  tenantId: number | null
): Promise<EnhancedPermission[]> {
  try {
    const userPermissions = await prisma.userRole.findMany({
      where: {
        userId: userId,
        isActive: true,
        role: {
          isActive: true,
        },
        permission: {
          isActive: true,
        },
        OR: [
          { tenantId: tenantId },
          { tenantId: null },
        ],
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const formattedPermissions: EnhancedPermission[] = [];

    userPermissions.forEach(userRole => {
      userRole.role.permissions.forEach(rp => {
        formattedPermissions.push({
          name: rp.permission.name,
          display_name: rp.permission.displayName || rp.permission.name,
          action: rp.permission.action as PermissionAction,
          resource: rp.permission.resource as PermissionResource,
          scope: rp.permission.scope as PermissionScope,
          level: rp.permission.level as PermissionLevel,
          tenantId: userRole.tenantId?.toString(),
          accountId: userRole.accountId?.toString(),
          resourceId: userRole.resourceId || undefined,
        });
      });
    });

    return formattedPermissions;

  } catch (error) {
    logger.error({
      eventType: 'permission_fetch_error',
      userId,
      tenantId,
      error,
      type: 'api_request'
    }, 'API Request: permission_fetch_error');
    return [];
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getMatchingRoute(path: string): string | null {
  const routes = Object.keys(ENHANCED_ROUTE_ACCESS_MATRIX);

  if (routes.includes(path)) {
    return path;
  }

  for (const route of routes) {
    if (path.startsWith(route + '/') || path.startsWith(route + '?')) {
      return route;
    }
  }

  return null;
}

function getMatchingAPI(path: string): string | null {
  const apis = Object.keys(ENHANCED_API_ACCESS_MATRIX);

  if (apis.includes(path)) {
    return path;
  }

  for (const api of apis) {
    if (path.startsWith(api.replace(/\[.*?\]/g, ''))) {
      return api;
    }
  }

  return null;
}

/**
 * Format permission as string
 */
export function formatPermission(
  action: PermissionAction, 
  resource: PermissionResource, 
  scope: PermissionScope
): string {
  return `${resource}.${action}.${scope}`;
}

/**
 * Parse permission string
 */
export function parsePermission(permission: string): {
  action: PermissionAction;
  resource: PermissionResource;
  scope: PermissionScope;
} | null {
  const parts = permission.split('.');
  if (parts.length !== 3) return null;

  return {
    resource: parts[0] as PermissionResource,
    action: parts[1] as PermissionAction,
    scope: parts[2] as PermissionScope
  };
}

/**
 * Clear permission cache for user (useful when permissions change)
 */
export async function clearPermissionCache(userId: string, tenantId?: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    const cacheKey = `${REDIS_KEY_PREFIX}:${userId}:${tenantId || 'global'}`;
    await redis.del(cacheKey);

    logger.info({
      eventType: 'permission_cache_cleared',
      userId,
      tenantId,
      cacheKey,
      type: 'api_request'
    }, 'API Request: permission_cache_cleared');
  } catch (error) {
    logger.error({
      eventType: 'permission_cache_clear_error',
      userId,
      tenantId,
      error,
      type: 'api_request'
    }, 'API Request: permission_cache_clear_error');
  }
} 