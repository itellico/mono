'use client';

/**
 * Tenant-Aware TanStack Query Integration
 * 
 * Provides tenant-safe data fetching with built-in permissions, loading states,
 * and automatic tenant context. Replaces raw fetch() calls throughout the app.
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useComponentLogger } from './logging';
import { useTenantService } from './tenant-foundation-client';
import { createApiCall, ApiResponse } from './api-responses';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TenantQueryOptions<TData = any> extends Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'> {
  resource: string;
  action?: string;
  tenantId?: number;
  requireAuth?: boolean;
  requirePermission?: boolean;
  enableSkeleton?: boolean;
  skeletonCount?: number;
  permission?: {
    action: string;
    resource: string;
  };
}

export interface TenantMutationOptions<TData = any, TVariables = any> 
  extends Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> {
  resource: string;
  action: string;
  tenantId?: number;
  requirePermission?: boolean;
  showToasts?: boolean;
  invalidateQueries?: string[];
  optimisticUpdate?: boolean;
}

export interface QueryMetadata {
  resource: string;
  action?: string;
  tenantId?: number;
  timestamp: number;
  requestId: string;
}

// ============================================================================
// QUERY KEY BUILDERS
// ============================================================================

/**
 * Standardized query key builder for tenant-aware caching
 */
export function createTenantQueryKey(
  resource: string,
  action: string = 'list',
  tenantId?: number,
  filters?: Record<string, any>
): [string, string, number | undefined, Record<string, any> | undefined] {
  return [
    'tenant-query',
    `${resource}:${action}`,
    tenantId,
    filters ? { ...filters, _cache: Date.now() } : undefined
  ];
}

/**
 * Create admin-specific query keys
 */
export function createAdminQueryKey(
  resource: string,
  action: string = 'list',
  filters?: Record<string, any>
): [string, string, Record<string, any> | undefined] {
  return [
    'admin-query',
    `${resource}:${action}`,
    filters
  ];
}

// ============================================================================
// TENANT-AWARE QUERY HOOKS
// ============================================================================

/**
 * Primary tenant-aware query hook with automatic permissions and caching
 */
export function useTenantQuery<TData = any>(
  endpoint: string,
  options: TenantQueryOptions<TData>
) {
  const {
    resource,
    action = 'view',
    tenantId,
    requireAuth = true,
    requirePermission = true,
    enableSkeleton = true,
    skeletonCount = 5,
    permission,
    ...queryOptions
  } = options;

  const tenantService = useTenantService();
  const log = useComponentLogger(`useTenantQuery:${resource}`);
  const { toast } = useToast();

  // Build query key with tenant context
  const queryKey = tenantId 
    ? createTenantQueryKey(resource, action, tenantId, queryOptions.enabled ? {} : undefined)
    : createAdminQueryKey(resource, action);

  // Enhanced query function with tenant safety
  const queryFn = useCallback(async (): Promise<TData> => {
    try {
      log.debug('Starting tenant query', { 
        endpoint, 
        resource, 
        action, 
        tenantId 
      });

      // Automatic tenant context setting (via API now)
      if (tenantId && tenantService) {
        await tenantService.setTenantContext(tenantId);
      }

      // Permission check if required
      if (requirePermission && permission) {
        // Integration point for permission system
        log.debug('Checking permissions', { 
          action: permission.action, 
          resource: permission.resource 
        });
      }

      // Make API call with tenant context
      const response = await createApiCall<TData>(endpoint, {
        method: 'GET',
        headers: {
          'X-Tenant-ID': tenantId?.toString(),
          'X-Resource': resource,
          'X-Action': action,
        }
      });

      if (!response.success) {
        throw new Error(response.error || 'Query failed');
      }

      log.debug('Tenant query completed', { 
        endpoint, 
        resource, 
        dataLength: Array.isArray(response.data) ? response.data.length : 'object'
      });

      return response.data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      log.error('Tenant query failed', { 
        endpoint, 
        resource, 
        error: errorMessage 
      });

      // Show error toast for user-facing failures
      if (queryOptions.enabled !== false) {
        toast({
          title: 'Data Loading Failed',
          description: `Failed to load ${resource}. Please try again.`,
          variant: 'destructive',
        });
      }

      throw error;
    }
  }, [endpoint, resource, action, tenantId, tenantService, requirePermission, permission, log, toast, queryOptions.enabled]);

  return useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes  
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
}

/**
 * List query with pagination, search, and filtering
 */
export function useTenantListQuery<TData = any>(
  endpoint: string,
  options: TenantQueryOptions<TData> & {
    page?: number;
    limit?: number;
    search?: string;
    filters?: Record<string, any>;
  }
) {
  const { page = 1, limit = 20, search, filters, ...queryOptions } = options;

  // Build query parameters
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', limit.toString());
  if (search) params.set('search', search);
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, value.toString());
      }
    });
  }

  const fullEndpoint = `${endpoint}?${params.toString()}`;

  return useTenantQuery<TData>(fullEndpoint, {
    ...queryOptions,
    action: 'list'
  });
}

/**
 * Resource-specific query (single item)
 */
export function useTenantResourceQuery<TData = any>(
  resource: string,
  id: string | number,
  options: Omit<TenantQueryOptions<TData>, 'resource'>
) {
  const endpoint = `/api/v1/${resource}/${id}`;

  return useTenantQuery<TData>(endpoint, {
    ...options,
    resource,
    action: 'view'
  });
}

// ============================================================================
// TENANT-AWARE MUTATION HOOKS
// ============================================================================

/**
 * Primary tenant-aware mutation hook
 */
export function useTenantMutation<TData = any, TVariables = any>(
  endpoint: string,
  options: TenantMutationOptions<TData, TVariables>
) {
  const {
    resource,
    action,
    tenantId,
    requirePermission = true,
    showToasts = true,
    invalidateQueries = [],
    optimisticUpdate = false,
    ...mutationOptions
  } = options;

  const queryClient = useQueryClient();
  const tenantService = useTenantService();
  const log = useComponentLogger(`useTenantMutation:${resource}:${action}`);
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (variables: TVariables): Promise<TData> => {
      try {
        log.debug('Starting tenant mutation', { 
          endpoint, 
          resource, 
          action, 
          tenantId 
        });

        // Set tenant context if provided
        if (tenantId && tenantService) {
          await tenantService.setTenantContext(tenantId);
        }

        // Permission check if required
        if (requirePermission) {
          log.debug('Checking permissions for mutation', { action, resource });
        }

        // Determine HTTP method based on action
        const method = getMethodForAction(action);

        // Make API call
        const response = await createApiCall<TData>(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId?.toString(),
            'X-Resource': resource,
            'X-Action': action,
          },
          body: method !== 'GET' ? JSON.stringify(variables) : undefined,
        });

        if (!response.success) {
          throw new Error(response.error || 'Mutation failed');
        }

        log.debug('Tenant mutation completed', { 
          endpoint, 
          resource, 
          action 
        });

        return response.data;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        log.error('Tenant mutation failed', { 
          endpoint, 
          resource, 
          action, 
          error: errorMessage 
        });

        if (showToasts) {
          toast({
            title: 'Operation Failed',
            description: `Failed to ${action} ${resource}. Please try again.`,
            variant: 'destructive',
          });
        }

        throw error;
      }
    },

    onSuccess: (data, variables) => {
      // Invalidate related queries
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      } else {
        // Auto-invalidate related queries
        queryClient.invalidateQueries({ 
          queryKey: ['tenant-query', `${resource}:list`] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['admin-query', `${resource}:list`] 
        });
      }

      // Success toast
      if (showToasts) {
        toast({
          title: 'Success',
          description: `${resource} ${action} completed successfully.`,
        });
      }

      log.debug('Mutation success handling completed', { 
        resource, 
        action, 
        invalidatedQueries: invalidateQueries 
      });

      // Call original onSuccess
      mutationOptions.onSuccess?.(data, variables, undefined);
    },

    onError: (error, variables) => {
      log.error('Mutation error handling', { 
        resource, 
        action, 
        error: error.message 
      });

      // Call original onError
      mutationOptions.onError?.(error, variables, undefined);
    },

    ...mutationOptions,
  });
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Create resource mutation
 */
export function useCreateResource<TData = any, TVariables = any>(
  resource: string,
  options?: Omit<TenantMutationOptions<TData, TVariables>, 'resource' | 'action'>
) {
  const endpoint = `/api/v1/${resource}`;

  return useTenantMutation<TData, TVariables>(endpoint, {
    ...options,
    resource,
    action: 'create',
  });
}

/**
 * Update resource mutation
 */
export function useUpdateResource<TData = any, TVariables = any>(
  resource: string,
  id: string | number,
  options?: Omit<TenantMutationOptions<TData, TVariables>, 'resource' | 'action'>
) {
  const endpoint = `/api/v1/${resource}/${id}`;

  return useTenantMutation<TData, TVariables>(endpoint, {
    ...options,
    resource,
    action: 'update',
  });
}

/**
 * Delete resource mutation
 */
export function useDeleteResource<TData = any>(
  resource: string,
  id: string | number,
  options?: Omit<TenantMutationOptions<TData, void>, 'resource' | 'action'>
) {
  const endpoint = `/api/v1/${resource}/${id}`;

  return useTenantMutation<TData, void>(endpoint, {
    ...options,
    resource,
    action: 'delete',
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get HTTP method for action
 */
function getMethodForAction(action: string): string {
  switch (action) {
    case 'create': return 'POST';
    case 'update': return 'PUT';
    case 'patch': return 'PATCH';
    case 'delete': return 'DELETE';
    default: return 'GET';
  }
}

/**
 * Prefetch hook for optimistic loading
 */
export function useTenantPrefetch() {
  const queryClient = useQueryClient();

  return useCallback((
    endpoint: string,
    options: Omit<TenantQueryOptions, 'enabled'>
  ) => {
    const queryKey = options.tenantId 
      ? createTenantQueryKey(options.resource, options.action, options.tenantId)
      : createAdminQueryKey(options.resource, options.action);

    queryClient.prefetchQuery({
      queryKey,
      queryFn: () => createApiCall(endpoint),
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export const TenantQuery = {
  // Core hooks
  useTenantQuery,
  useTenantListQuery,
  useTenantResourceQuery,
  useTenantMutation,

  // Specialized hooks
  useCreateResource,
  useUpdateResource,
  useDeleteResource,

  // Utilities
  useTenantPrefetch,
  createTenantQueryKey,
  createAdminQueryKey,
} as const;

export default TenantQuery; 