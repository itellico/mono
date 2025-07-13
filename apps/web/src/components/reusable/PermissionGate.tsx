import React from 'react';
import { useAuth } from '@/contexts/auth-context';

interface PermissionGateProps {
  action?: string;
  resource?: string;
  context?: { scope?: string };
  permissions?: string[];
  requireAll?: boolean;
  showFallback?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Permission Gate component for controlling access to UI elements
 * 
 * Usage patterns:
 * 1. New pattern (recommended): <PermissionGate permissions={['admin.settings.read']} />
 * 2. Legacy pattern: <PermissionGate action="read" resource="settings" context={{ scope: 'global' }} />
 * 3. Multiple permissions: <PermissionGate permissions={['perm1', 'perm2']} requireAll={false} />
 */
export function PermissionGate({ 
  action,
  resource,
  context,
  permissions = [],
  requireAll = false,
  children, 
  fallback = null,
  showFallback = true 
}: PermissionGateProps) {
  const { user, loading } = useAuth();

  // Show loading state if auth is still loading
  if (loading) {
    return null;
  }

  // If user is not authenticated, deny access
  if (!user) {
    return showFallback ? <>{fallback}</> : null;
  }

  // Build required permissions list
  const requiredPermissions: string[] = [...permissions];

  // Handle legacy action/resource pattern
  if (action && resource) {
    const scope = context?.scope || 'tenant';
    const legacyPermission = `${resource}.${action}.${scope}`;
    
    // Also check for admin.* pattern used by API
    const adminPermission = `admin.${resource}.${action}`;
    
    requiredPermissions.push(legacyPermission, adminPermission);
  }

  // If no permissions specified, allow access (for backward compatibility)
  if (requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  // Check user permissions
  const userPermissions = user.permissions || [];
  const userRoles = user.roles || [];

  // Super admin has access to everything
  if (userRoles.includes('Super Admin') || userRoles.includes('super_admin')) {
    return <>{children}</>;
  }

  // Check if user has required permissions
  const hasPermission = requireAll 
    ? requiredPermissions.every(perm => 
        userPermissions.includes(perm) || 
        userPermissions.some(userPerm => userPerm.startsWith(perm.split('.')[0]))
      )
    : requiredPermissions.some(perm => 
        userPermissions.includes(perm) ||
        userPermissions.some(userPerm => userPerm.startsWith(perm.split('.')[0]))
      );

  // Additional role-based checks for admin access
  if (resource === 'settings' && (action === 'manage' || context?.scope === 'global')) {
    const hasAdminRole = userRoles.some(role => 
      ['Admin', 'Tenant Admin', 'Super Admin'].includes(role)
    );
    if (!hasAdminRole && !hasPermission) {
      return showFallback ? <>{fallback}</> : null;
    }
  }

  if (hasPermission) {
    return <>{children}</>;
  }

  // Log permission denial for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.warn('PermissionGate: Access denied', {
      requiredPermissions,
      userPermissions,
      userRoles,
      action,
      resource,
      context
    });
  }

  return showFallback ? <>{fallback}</> : null;
}

export default PermissionGate;
