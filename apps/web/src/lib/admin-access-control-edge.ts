// Edge Runtime compatible admin access control
// This file contains simplified logic that doesn't use database connections
// For use in middleware and other edge runtime contexts

// Admin role types that have access to admin interface
export const ADMIN_ROLE_TYPES = [
  'super_admin',
  'tenant_admin', 
  'content_moderator',
  'model_approver',
  'gocare_reviewer',
  'support_agent',
  'analytics_viewer'
] as const;

// Access matrix defining which role types can access which admin routes
export const ADMIN_ACCESS_MATRIX = {
  // Base admin access - all admin roles can access dashboard
  '/admin': ['super_admin', 'tenant_admin', 'content_moderator', 'model_approver', 'gocare_reviewer', 'support_agent', 'analytics_viewer'],

  // User management - only full admins
  '/admin/users': ['super_admin', 'tenant_admin'],

  // Model applications - approvers and full admins
  '/admin/applications': ['super_admin', 'tenant_admin', 'model_approver', 'content_moderator'],

  // Media review - content moderators and GoCare reviewers
  '/admin/media-review': ['super_admin', 'tenant_admin', 'content_moderator', 'gocare_reviewer'],

  // Analytics - viewers and full admins
  '/admin/analytics': ['super_admin', 'tenant_admin', 'analytics_viewer'],

  // Settings - only super admins
  '/admin/settings': ['super_admin']
} as const;

export type AdminRoleType = typeof ADMIN_ROLE_TYPES[number];

/**
 * Check if a role type has basic admin access
 */
export function hasAdminAccessByRole(roleType: string | undefined): boolean {
  if (!roleType) return false;
  return ADMIN_ROLE_TYPES.includes(roleType as AdminRoleType);
}

/**
 * Check if a role can access specific admin route
 */
export function canAccessAdminRouteByRole(roleType: string | undefined, path: string): boolean {
  if (!hasAdminAccessByRole(roleType)) {
    return false;
  }

  const allowedRoles = ADMIN_ACCESS_MATRIX[path as keyof typeof ADMIN_ACCESS_MATRIX];
  if (!allowedRoles) {
    // If route not in matrix, allow access if user has basic admin access
    return true;
  }

  return allowedRoles.includes(roleType as any);
}

/**
 * Get the most specific matching route from the access matrix
 */
export function getMatchingAdminRoute(path: string): string | null {
  const routes = Object.keys(ADMIN_ACCESS_MATRIX);

  // Sort routes by length (longest first) to get most specific match
  const sortedRoutes = routes.sort((a, b) => b.length - a.length);

  for (const route of sortedRoutes) {
    if (path.startsWith(route)) {
      return route;
    }
  }

  return null;
} 