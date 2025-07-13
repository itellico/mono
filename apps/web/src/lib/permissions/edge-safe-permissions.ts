/**
 * ✅ EDGE RUNTIME SAFE PERMISSION CHECKS
 * 
 * This module provides lightweight permission checking that works in Edge Runtime
 * Used in middleware where full Node.js APIs (Prisma/Redis) aren't available
 * 
 * @description itellico Mono Edge-Safe Permissions
 * @module EdgeSafePermissions
 */

// ✅ EDGE RUNTIME COMPATIBLE: Basic role hierarchy for middleware
const ROLE_HIERARCHY = {
  'super_admin': 100,
  'tenant_admin': 80,
  'content_moderator': 60,
  'approver': 50,
  'support_agent': 40,
  'analytics_viewer': 30,
  'account_owner': 20,
  'user': 10
} as const;

type UserRole = keyof typeof ROLE_HIERARCHY;

// ✅ ADMIN ROLES - Edge Runtime compatible
export const ADMIN_ROLES: readonly UserRole[] = [
  'super_admin',
  'tenant_admin',
  'content_moderator',
  'approver',
  'support_agent',
  'analytics_viewer'
] as const;

// ✅ PATH-BASED PERMISSIONS - No database lookup needed
export const ROUTE_PERMISSIONS = {
  '/admin': {
    allowedRoles: ADMIN_ROLES,
    requiredLevel: 30
  },
  '/admin/tenants': {
    allowedRoles: ['super_admin'] as const,
    requiredLevel: 100
  },
  '/admin/users': {
    allowedRoles: ['super_admin', 'tenant_admin'] as const,
    requiredLevel: 80
  },
  '/admin/content': {
    allowedRoles: ['super_admin', 'tenant_admin', 'content_moderator'] as const,
    requiredLevel: 60
  },
  '/api/v1/admin': {
    allowedRoles: ADMIN_ROLES,
    requiredLevel: 30
  },
  '/api/v1/admin/tenants': {
    allowedRoles: ['super_admin'] as const,
    requiredLevel: 100
  }
} as const;

/**
 * ✅ EDGE RUNTIME SAFE: Basic admin access check
 * Used in middleware for quick validation before database lookup
 */
export function hasBasicAdminAccess(userRole?: string): boolean {
  if (!userRole) return false;
  return ADMIN_ROLES.includes(userRole as UserRole);
}

/**
 * ✅ EDGE RUNTIME SAFE: Path-based permission check
 * Used in middleware for route protection
 */
export function canAccessPath(userRole?: string, path: string = ''): {
  allowed: boolean;
  reason?: string;
  requiresDetailedCheck?: boolean;
} {
  if (!userRole) {
    return { allowed: false, reason: 'No user role provided' };
  }

  // Find matching route pattern
  const matchingRoute = Object.keys(ROUTE_PERMISSIONS).find(routePath => 
    path.startsWith(routePath)
  );

  if (!matchingRoute) {
    // No specific restrictions found, allow if user has any admin role
    if (hasBasicAdminAccess(userRole)) {
      return { allowed: true, requiresDetailedCheck: true };
    }
    return { allowed: false, reason: 'No route permissions found' };
  }

  const routeConfig = ROUTE_PERMISSIONS[matchingRoute as keyof typeof ROUTE_PERMISSIONS];
  const userRoleLevel = ROLE_HIERARCHY[userRole as UserRole] || 0;

  // Check if user role is in allowed roles
  if (!routeConfig.allowedRoles.includes(userRole as UserRole)) {
    return { 
      allowed: false, 
      reason: `Role '${userRole}' not allowed for path '${path}'` 
    };
  }

  // Check role hierarchy level
  if (userRoleLevel < routeConfig.requiredLevel) {
    return { 
      allowed: false, 
      reason: `Insufficient role level for path '${path}'` 
    };
  }

  return { allowed: true };
}

/**
 * ✅ EDGE RUNTIME SAFE: API method permission check
 */
export function canAccessAPIMethod(
  userRole?: string, 
  path: string = '', 
  method: string = 'GET'
): {
  allowed: boolean;
  reason?: string;
  requiresDetailedCheck?: boolean;
} {
  // First check basic path access
  const pathCheck = canAccessPath(userRole, path);
  if (!pathCheck.allowed) {
    return pathCheck;
  }

  // Additional method-based restrictions
  const writeOperations = ['POST', 'PUT', 'PATCH', 'DELETE'];
  const isWriteOperation = writeOperations.includes(method.toUpperCase());

  if (isWriteOperation) {
    // Tenant operations require super admin
    if (path.includes('/tenants') && userRole !== 'super_admin') {
      return { 
        allowed: false, 
        reason: 'Super admin required for tenant modifications' 
      };
    }

    // User modifications require tenant admin or higher
    if (path.includes('/users') && !['super_admin', 'tenant_admin'].includes(userRole as string)) {
      return { 
        allowed: false, 
        reason: 'Tenant admin or higher required for user modifications' 
      };
    }
  }

  return { allowed: true, requiresDetailedCheck: isWriteOperation };
}

/**
 * ✅ EDGE RUNTIME SAFE: Get user role level
 */
export function getUserRoleLevel(userRole?: string): number {
  if (!userRole) return 0;
  return ROLE_HIERARCHY[userRole as UserRole] || 0;
}

/**
 * ✅ EDGE RUNTIME SAFE: Check if role is higher than required
 */
export function hasMinimumRoleLevel(userRole?: string, minimumRole: UserRole = 'user'): boolean {
  const userLevel = getUserRoleLevel(userRole);
  const requiredLevel = ROLE_HIERARCHY[minimumRole];
  return userLevel >= requiredLevel;
}

/**
 * ✅ Helper to determine if detailed permission check is needed
 * Returns true if the operation requires database lookup
 */
export function requiresDetailedCheck(
  userRole?: string, 
  path: string = '', 
  method: string = 'GET'
): boolean {
  // Super admin always gets basic approval, detailed check optional
  if (userRole === 'super_admin') {
    return false;
  }

  // Write operations always need detailed check
  const writeOperations = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (writeOperations.includes(method.toUpperCase())) {
    return true;
  }

  // Sensitive paths need detailed check
  const sensitivePaths = ['/admin/users', '/admin/tenants', '/admin/settings'];
  if (sensitivePaths.some(sensitivePath => path.startsWith(sensitivePath))) {
    return true;
  }

  return false;
} 