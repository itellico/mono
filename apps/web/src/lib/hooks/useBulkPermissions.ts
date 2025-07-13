/**
 * @fileoverview Bulk Permissions Hook - Efficient permission checking for React components
 * @version 1.0.0
 * @author itellico Mono
 * 
 * @description
 * React hook that provides efficient bulk permission loading and checking.
 * Dramatically reduces API calls by loading all permissions once and caching them.
 * 
 * Performance Benefits:
 * - Reduces N permission API calls to 1 bulk load
 * - Client-side caching with TanStack Query
 * - Automatic invalidation on permission changes
 * - Graceful fallback when Redis is disabled
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { browserLogger } from '@/lib/browser-logger';

/**
 * Bulk permission API response
 */
interface BulkPermissionResponse {
  success: boolean;
  data?: {
    userId: number;
    tenantId?: number;
    permissions: Record<string, boolean>;
    cachedAt: number;
    source: 'cache' | 'database' | 'hybrid';
  };
  error?: string;
}

/**
 * Hook options for bulk permission loading
 */
interface UseBulkPermissionsOptions {
  tenantId?: number;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Bulk permission hook result
 */
interface UseBulkPermissionsResult {
  // Permission checking methods
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  checkMultiplePermissions: (permissions: string[]) => Record<string, boolean>;
  getAllPermissions: () => string[];
  
  // Query state
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isStale: boolean;
  isFetching: boolean;
  
  // Cache management
  refetch: () => void;
  invalidate: () => void;
  
  // Metadata
  permissionCount: number;
  source: 'cache' | 'database' | 'hybrid' | 'loading';
  lastUpdated?: number;
}

/**
 * Fetch bulk permissions from API
 */
async function fetchBulkPermissions(
  userId: string, 
  tenantId?: number
): Promise<BulkPermissionResponse> {
  const url = new URL('/api/v1/permissions/bulk', window.location.origin);
  if (tenantId) {
    url.searchParams.set('tenantId', tenantId.toString());
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch bulk permissions: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Primary hook for bulk permission loading and checking
 * 
 * @example
 * ```tsx
 * function AdminComponent() {
 *   const { 
 *     hasPermission, 
 *     hasAnyPermission, 
 *     checkMultiplePermissions,
 *     isLoading 
 *   } = useBulkPermissions({ tenantId: 1 });
 *   
 *   if (isLoading) return <Skeleton />;
 *   
 *   const canViewUsers = hasPermission('users.view');
 *   const canManageAny = hasAnyPermission(['users.manage', 'settings.manage']);
 *   const adminPermissions = checkMultiplePermissions([
 *     'users.view', 'users.create', 'users.update', 'users.delete'
 *   ]);
 *   
 *   return (
 *     <div>
 *       {canViewUsers && <UsersList />}
 *       {canManageAny && <ManagementPanel />}
 *       {adminPermissions['users.create'] && <CreateUserButton />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBulkPermissions(
  options: UseBulkPermissionsOptions = {}
): UseBulkPermissionsResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const {
    tenantId,
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    gcTime = 10 * 60 * 1000,   // 10 minutes
    refetchOnWindowFocus = false
  } = options;

  const userId = user?.id;

  // Query key for TanStack Query
  const queryKey = useMemo(() => [
    'bulk-permissions',
    userId,
    tenantId || 'global'
  ], [userId, tenantId]);

  // Main query for bulk permissions
  const query = useQuery({
    queryKey,
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return fetchBulkPermissions(userId, tenantId);
    },
    enabled: enabled && !!userId,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors
      if (failureCount < 2 && error.message.includes('fetch')) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Extract permissions data
  const permissionsData = query.data?.data;
  const permissions = permissionsData?.permissions || {};

  // Permission checking methods
  const hasPermission = useCallback((permission: string): boolean => {
    const result = permissions[permission] || false;
    
    browserLogger.debug('Permission checked', {
      permission,
      result,
      userId,
      tenantId,
      source: permissionsData?.source
    });
    
    return result;
  }, [permissions, userId, tenantId, permissionsData?.source]);

  const hasAnyPermission = useCallback((permissionList: string[]): boolean => {
    const result = permissionList.some(permission => permissions[permission]);
    
    browserLogger.debug('Any permission checked', {
      permissions: permissionList,
      result,
      grantedPermissions: permissionList.filter(p => permissions[p]),
      userId,
      tenantId
    });
    
    return result;
  }, [permissions, userId, tenantId]);

  const hasAllPermissions = useCallback((permissionList: string[]): boolean => {
    const result = permissionList.every(permission => permissions[permission]);
    
    browserLogger.debug('All permissions checked', {
      permissions: permissionList,
      result,
      missingPermissions: permissionList.filter(p => !permissions[p]),
      userId,
      tenantId
    });
    
    return result;
  }, [permissions, userId, tenantId]);

  const checkMultiplePermissions = useCallback((permissionList: string[]): Record<string, boolean> => {
    const results: Record<string, boolean> = {};
    
    for (const permission of permissionList) {
      results[permission] = permissions[permission] || false;
    }
    
    browserLogger.debug('Multiple permissions checked', {
      requestedCount: permissionList.length,
      grantedCount: Object.values(results).filter(Boolean).length,
      results,
      userId,
      tenantId
    });
    
    return results;
  }, [permissions, userId, tenantId]);

  const getAllPermissions = useCallback((): string[] => {
    const allPermissions = Object.keys(permissions).filter(key => permissions[key]);
    
    browserLogger.debug('All permissions retrieved', {
      count: allPermissions.length,
      userId,
      tenantId
    });
    
    return allPermissions;
  }, [permissions, userId, tenantId]);

  // Cache management methods
  const refetch = useCallback(() => {
    browserLogger.userAction('Bulk permissions refetch requested', {
      userId,
      tenantId,
      queryKey
    });
    
    return query.refetch();
  }, [query, userId, tenantId, queryKey]);

  const invalidate = useCallback(() => {
    browserLogger.userAction('Bulk permissions cache invalidated', {
      userId,
      tenantId,
      queryKey
    });
    
    return queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey, userId, tenantId]);

  // Log performance metrics
  useMemo(() => {
    if (permissionsData) {
      browserLogger.performance('Bulk permissions loaded', {
        userId,
        tenantId,
        permissionCount: Object.keys(permissions).length,
        source: permissionsData.source,
        cachedAt: permissionsData.cachedAt,
        loadTime: Date.now() - (permissionsData.cachedAt || Date.now())
      });
    }
  }, [permissionsData, permissions, userId, tenantId]);

  return {
    // Permission checking methods
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkMultiplePermissions,
    getAllPermissions,
    
    // Query state
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isStale: query.isStale,
    isFetching: query.isFetching,
    
    // Cache management
    refetch,
    invalidate,
    
    // Metadata
    permissionCount: Object.keys(permissions).length,
    source: permissionsData?.source || 'loading',
    lastUpdated: permissionsData?.cachedAt
  };
}

/**
 * Hook for checking a single permission efficiently
 * 
 * Uses bulk loading under the hood but provides a simpler interface
 * for components that only need to check one permission.
 */
export function usePermission(
  permission: string,
  options: UseBulkPermissionsOptions = {}
): {
  hasPermission: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const { hasPermission: checkPermission, isLoading, isError, error } = useBulkPermissions(options);
  
  const hasPermission = useMemo(() => {
    return checkPermission(permission);
  }, [checkPermission, permission]);

  return {
    hasPermission,
    isLoading,
    isError,
    error
  };
}

/**
 * Hook for permission-based conditional rendering
 * 
 * @example
 * ```tsx
 * function ConditionalComponent() {
 *   const { show } = usePermissionGuard('users.view');
 *   
 *   if (!show) return null;
 *   
 *   return <UsersList />;
 * }
 * ```
 */
export function usePermissionGuard(
  permission: string | string[],
  options: UseBulkPermissionsOptions & { requireAll?: boolean } = {}
): {
  show: boolean;
  isLoading: boolean;
  isError: boolean;
} {
  const { requireAll = false, ...bulkOptions } = options;
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading, isError } = useBulkPermissions(bulkOptions);

  const show = useMemo(() => {
    if (Array.isArray(permission)) {
      return requireAll ? hasAllPermissions(permission) : hasAnyPermission(permission);
    }
    return hasPermission(permission);
  }, [permission, requireAll, hasPermission, hasAnyPermission, hasAllPermissions]);

  return {
    show,
    isLoading,
    isError
  };
}

/**
 * Hook for invalidating permission cache when permissions change
 * 
 * Call this after role assignments, permission updates, etc.
 */
export function usePermissionInvalidation() {
  const queryClient = useQueryClient();

  const invalidateUserPermissions = useCallback((userId: string, tenantId?: number) => {
    const queryKey = ['bulk-permissions', userId, tenantId || 'global'];
    
    browserLogger.userAction('Permission invalidation triggered', {
      userId,
      tenantId,
      queryKey
    });
    
    return queryClient.invalidateQueries({ queryKey });
  }, [queryClient]);

  const invalidateAllPermissions = useCallback(() => {
    browserLogger.userAction('All permissions invalidated');
    return queryClient.invalidateQueries({ queryKey: ['bulk-permissions'] });
  }, [queryClient]);

  return {
    invalidateUserPermissions,
    invalidateAllPermissions
  };
} 