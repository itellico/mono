/**
 * Client-Safe Permission System for itellico Mono
 * 
 * This module provides client-side permission checking without server dependencies.
 * It extracts the client-safe parts from enhanced-unified-permission-system.ts
 * 
 * Features:
 * - Client-side permission checks based on user roles
 * - No server dependencies (Redis, Prisma, etc.)
 * - Type-safe interfaces shared with server
 */

// ============================================================================
// TYPES AND INTERFACES (Shared with server)
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

// ============================================================================
// CLIENT-SAFE PERMISSION CHECKING
// ============================================================================

/**
 * Extract enhanced user context from session (client-safe version)
 */
export function extractUserContext(sessionOrToken: any): BasicUserContext {
  if (!sessionOrToken) {
    return { isAuthenticated: false };
  }

  const user = sessionOrToken.user || sessionOrToken;

  if (!user) {
    return { isAuthenticated: false };
  }

  // Get enhanced roles from user object
  const roles: EnhancedRoleType[] = user.roles || [];

  return {
    userId: user.id?.toString(),
    roles,
    tenantId: user.tenantId?.toString() || user.adminRole?.tenantId?.toString(),
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
 * Check route access using enhanced permission system (client-side)
 */
export function canAccessRoute(userContext: BasicUserContext, path: string): PermissionResult {
  if (!userContext.isAuthenticated) {
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
    return { 
      allowed: false, 
      reason: `Insufficient role access. Required: ${routeConfig.allowedRoles.join(', ')}` 
    };
  }

  return { 
    allowed: true, 
    reason: 'Enhanced role check passed',
    requiresDetailedCheck: true
  };
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