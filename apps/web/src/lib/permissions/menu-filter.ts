/**
 * Menu filtering utilities for permission-based navigation
 */

export interface MenuItem {
  label: string;
  href: string;
  icon?: React.ComponentType;
  permissions?: string[];
  children?: MenuItem[];
}

/**
 * Filter menu items based on user permissions
 */
export function filterMenuByPermissions(
  menu: MenuItem[],
  userPermissions: string[]
): MenuItem[] {
  return menu
    .filter(item => {
      // If no permissions required, always show
      if (!item.permissions || item.permissions.length === 0) {
        return true;
      }

      // Check if user has any required permission
      return item.permissions.some(permission => 
        userPermissions.includes(permission) ||
        userPermissions.includes('platform.*.global') || // Super admin bypass
        userPermissions.includes('admin.*') // Admin wildcard
      );
    })
    .map(item => ({
      ...item,
      children: item.children ? filterMenuByPermissions(item.children, userPermissions) : undefined
    }));
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(route: string, userPermissions: string[], routePermissions: Record<string, string[]>): boolean {
  const requiredPermissions = routePermissions[route];
  
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  return requiredPermissions.some(permission => 
    userPermissions.includes(permission) ||
    userPermissions.includes('platform.*.global') ||
    userPermissions.includes('admin.*')
  );
}

/**
 * Get accessible routes for a user
 */
export function getAccessibleRoutes(userPermissions: string[], routePermissions: Record<string, string[]>): string[] {
  return Object.keys(routePermissions).filter(route => 
    canAccessRoute(route, userPermissions, routePermissions)
  );
}