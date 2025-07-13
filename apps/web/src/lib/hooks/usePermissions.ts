/**
 * Unified Permission Hook for React Components
 * 
 * This hook provides centralized permission checking for client components
 * using the unified permission system. It integrates with NextAuth session
 * and provides real-time permission validation.
 */
'use client';
import { useAuth } from '@/contexts/auth-context';
import { useCallback  } from 'react';
import { 
  canAccessRoute as basicCanAccessRoute,
  type BasicUserContext,
  type PermissionResult,
  type PermissionAction,
  type PermissionResource,
  type EnhancedRoleType
} from '@/lib/permissions/client-permissions';
import { canAccessAPI as basicCanAccessAPI } from '@/lib/permissions/canAccessAPI';
import { 
  checkPermission as basicCheckPermission,
  type UserContext
} from '@/lib/permissions/enhanced-rbac-system';
// ============================================================================
// PERMISSION HOOK
// ============================================================================
export function usePermissions() {
  const { user, isLoading } = useAuth();
  // Extract user context from auth
  const userContext: BasicUserContext = (() => {
    if (isLoading || !user) {
      return {
        isAuthenticated: false
      };
    }
    return {
      userId: user.id || user.uuid || '',
      roles: (user.roles || []) as EnhancedRoleType[],
      tenantId: user.tenantId?.toString() || undefined,
      accountId: user.accountId?.toString() || undefined,
      isAuthenticated: true,
      email: user.email
    };
  })();
  // Check if user can access a specific route
  const canAccessRoute = useCallback((path: string): PermissionResult => {
    return basicCanAccessRoute(userContext, path);
  }, [userContext]);
  // Check if user can access a specific API
  const canAccessAPI = useCallback((path: string, method: string = 'GET'): PermissionResult => {
    return basicCanAccessAPI(userContext, path, method);
  }, [userContext]);
  // Check specific permission
  const checkPermission = useCallback(async (action: PermissionAction, resource: PermissionResource): Promise<PermissionResult> => {
    // Convert BasicUserContext to UserContext for server-side check
    const serverContext: UserContext = {
      userId: userContext.userId || '',
      tenantId: userContext.tenantId ? parseInt(userContext.tenantId) : 0,
      accountId: userContext.accountId ? parseInt(userContext.accountId) : null,
      roles: userContext.roles || [],
      permissions: []
    };
    return basicCheckPermission(serverContext, action, resource);
  }, [userContext]);
  // Check permission by action and resource (sync version)
  const hasPermission = useCallback((action: PermissionAction, resource: PermissionResource): boolean => {
    // For sync checks, we'll do a simple role-based check
    // Super admin has all permissions
    if (userContext.roles?.includes('super_admin')) {
      return true;
    }
    // For now, allow admin roles basic access
    if (userContext.roles?.some(role => ['tenant_admin', 'content_moderator'].includes(role))) {
      return true;
    }
    return false;
  }, [userContext]);
  // Check if user has any admin access
  const isAdmin = userContext.roles?.some(role => 
    ['super_admin', 'tenant_admin', 'content_moderator'].includes(role)
  ) || false;
  // Check if user is super admin
  const isSuperAdmin = userContext.roles?.includes('super_admin') || false;
  // Check if authenticated
  const isAuthenticated = !!userContext.userId && userContext.userId !== '';
  // Check loading state
  // isLoading already defined from useAuth
  return {
    // User context
    userContext,
    isAuthenticated,
    isLoading,
    isAdmin,
    isSuperAdmin,
    // Permission checking functions
    canAccessRoute,
    canAccessAPI,
    checkPermission,
    hasPermission,
    // Session data
    user,
    status
  };
}
// ============================================================================
// SPECIFIC PERMISSION HOOKS
// ============================================================================
/**
 * Hook for checking admin dashboard access
 */
export function useAdminAccess() {
  const { isAdmin, canAccessRoute } = usePermissions();
  if (!isAdmin) return { allowed: false, reason: 'Not an admin' };
  return canAccessRoute('/admin');
}
/**
 * Hook for checking user management permissions
 */
export function useUserManagement() {
  const { hasPermission } = usePermissions();
  return {
    canView: hasPermission('view', 'users'),
    canCreate: hasPermission('create', 'users'),
    canUpdate: hasPermission('update', 'users'),
    canDelete: hasPermission('delete', 'users'),
    canManage: hasPermission('manage', 'users')
  };
}
/**
 * Hook for checking translation management permissions
 */
export function useTranslationManagement() {
  const { hasPermission } = usePermissions();
  return {
    canView: hasPermission('view', 'translations'),
    canCreate: hasPermission('create', 'translations'),
    canUpdate: hasPermission('update', 'translations'),
    canDelete: hasPermission('delete', 'translations'),
    canManage: hasPermission('manage', 'translations')
  };
}
/**
 * Hook for checking workflow management permissions
 */
export function useWorkflowManagement() {
  const { hasPermission } = usePermissions();
  return {
    canView: hasPermission('view', 'workflows'),
    canCreate: hasPermission('create', 'workflows'),
    canUpdate: hasPermission('update', 'workflows'),
    canDelete: hasPermission('delete', 'workflows'),
    canManage: hasPermission('manage', 'workflows')
  };
}
/**
 * Hook for checking analytics permissions
 */
export function useAnalyticsAccess() {
  const { hasPermission } = usePermissions();
  return {
    canView: hasPermission('view', 'analytics'),
    canExport: hasPermission('export', 'analytics')
  };
}
/**
 * Hook for checking audit permissions
 */
export function useAuditAccess() {
  const { hasPermission } = usePermissions();
  return {
    canView: hasPermission('view', 'audit'),
    canExport: hasPermission('export', 'audit')
  };
}
// ============================================================================
// UTILITY HOOKS
// ============================================================================
/**
 * Hook for checking multiple permissions at once
 */
export function useMultiplePermissions(checks: PermissionCheck[]) {
  const { checkPermission } = usePermissions();
  return checks.map(check => ({
    check,
    result: checkPermission(check)
  }));
}
/**
 * Hook for checking if user has ANY of the specified permissions (OR logic)
 */
export function useHasAnyPermission(checks: PermissionCheck[]) {
  const results = useMultiplePermissions(checks);
  const allowed = results.some(({ result }) => result.allowed);
  return {
    allowed,
    results
  };
}
/**
 * Hook for checking if user has ALL of the specified permissions (AND logic)
 */
export function useHasAllPermissions(checks: PermissionCheck[]) {
  const results = useMultiplePermissions(checks);
  const allowed = results.every(({ result }) => result.allowed);
  return {
    allowed,
    results
  };
} 