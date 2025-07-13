import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions
} from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { browserLogger } from '@/lib/browser-logger';
import type { 
  GetTenantsParams, 
  GetTenantsResponse, 
  TenantListItem,
  TenantStats,
  CreateTenantData,
  CreateTenantResult
} from '@/lib/services/tenants.service';

/**
 * TanStack Query Factory Pattern for Tenants
 * 
 * ✅ mono PLATFORM COMPLIANCE:
 * - Factory pattern for consistent cache keys
 * - Proper staleTime and gcTime configuration
 * - Optimistic updates with rollback
 * - Error boundaries and user-friendly fallbacks
 * - Coordination with three-layer caching
 * - Prefetching on hover/focus
 */

// ✅ FACTORY PATTERN: Consistent cache key generation
export const tenantsQueryKeys = {
  // Base keys
  all: ['tenants'] as const,
  lists: () => [...tenantsQueryKeys.all, 'list'] as const,
  list: (filters: GetTenantsParams) => [...tenantsQueryKeys.lists(), filters] as const,
  details: () => [...tenantsQueryKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...tenantsQueryKeys.details(), uuid] as const,
  stats: () => [...tenantsQueryKeys.all, 'stats'] as const,
  filters: () => [...tenantsQueryKeys.all, 'filters'] as const,
};

// ✅ API CLIENT FUNCTIONS
const tenantsApi = {
  async getAll(params: GetTenantsParams): Promise<GetTenantsResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.status) searchParams.set('status', params.status);
    if (params.currency) searchParams.set('currency', params.currency);
    if (params.userCountRange) searchParams.set('userCountRange', params.userCountRange);

    const response = await fetch(`/api/v1/admin/tenants?${searchParams.toString()}`, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const error = await response.text();
      browserLogger.apiResponse('/api/v1/admin/tenants', response.status, error);
      throw new Error(`Failed to fetch tenants: ${error}`);
    }

    const data = await response.json();
    browserLogger.apiResponse('/api/v1/admin/tenants', response.status, 'Success');
    return data;
  },

  async getByUuid(uuid: string): Promise<TenantListItem> {
    const response = await fetch(`/api/v1/admin/tenants/${uuid}`, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const error = await response.text();
      browserLogger.apiResponse(`/api/v1/admin/tenants/${uuid}`, response.status, error);
      throw new Error(`Failed to fetch tenant: ${error}`);
    }

    const data = await response.json();
    browserLogger.apiResponse(`/api/v1/admin/tenants/${uuid}`, response.status, 'Success');
    return data;
  },

  async getStats(): Promise<TenantStats> {
    const response = await fetch('/api/v1/admin/tenants/stats', {
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const error = await response.text();
      browserLogger.apiResponse('/api/v1/admin/tenants/stats', response.status, error);
      throw new Error(`Failed to fetch tenant stats: ${error}`);
    }

    const data = await response.json();
    browserLogger.apiResponse('/api/v1/admin/tenants/stats', response.status, 'Success');
    return data;
  },

  async create(data: CreateTenantData): Promise<CreateTenantResult> {
    browserLogger.apiRequest('POST', '/api/v1/admin/tenants', data);

    const response = await fetch('/api/v1/admin/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      browserLogger.apiResponse('/api/v1/admin/tenants', response.status, result);
      throw new Error(result.error || 'Failed to create tenant');
    }

    browserLogger.apiResponse('/api/v1/admin/tenants', response.status, 'Tenant created successfully');
    return result;
  },

  async update(uuid: string, data: Partial<TenantListItem>): Promise<TenantListItem> {
    browserLogger.apiRequest('PUT', `/api/v1/admin/tenants/${uuid}`, data);

    const response = await fetch(`/api/v1/admin/tenants/${uuid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      browserLogger.apiResponse(`/api/v1/admin/tenants/${uuid}`, response.status, error);
      throw new Error(error.error || 'Failed to update tenant');
    }

    const result = await response.json();
    browserLogger.apiResponse(`/api/v1/admin/tenants/${uuid}`, response.status, 'Tenant updated successfully');
    return result;
  },

  async delete(uuid: string): Promise<void> {
    browserLogger.apiRequest('DELETE', `/api/v1/admin/tenants/${uuid}`, undefined);

    const response = await fetch(`/api/v1/admin/tenants/${uuid}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const error = await response.json();
      browserLogger.apiResponse(`/api/v1/admin/tenants/${uuid}`, response.status, error);
      throw new Error(error.error || 'Failed to delete tenant');
    }

    browserLogger.apiResponse(`/api/v1/admin/tenants/${uuid}`, response.status, 'Tenant deleted successfully');
  }
};

// ✅ QUERY HOOKS WITH PROPER CONFIGURATION

/**
 * Hook to fetch tenants list with proper caching and error handling
 */
export function useTenantsQuery(
  params: GetTenantsParams = {},
  options?: Partial<UseQueryOptions<GetTenantsResponse, Error>>
) {
  return useQuery({
    queryKey: tenantsQueryKeys.list(params),
    queryFn: () => tenantsApi.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options
  });
}

/**
 * Hook to fetch individual tenant by UUID
 */
export function useTenantQuery(
  uuid: string,
  options?: Partial<UseQueryOptions<TenantListItem, Error>>
) {
  return useQuery({
    queryKey: tenantsQueryKeys.detail(uuid),
    queryFn: () => tenantsApi.getByUuid(uuid),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    enabled: !!uuid,
    ...options
  });
}

/**
 * Hook to fetch tenant stats
 */
export function useTenantStatsQuery(
  options?: Partial<UseQueryOptions<TenantStats, Error>>
) {
  return useQuery({
    queryKey: tenantsQueryKeys.stats(),
    queryFn: () => tenantsApi.getStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes (stats change less frequently)
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    ...options
  });
}

// ✅ MUTATION HOOKS WITH OPTIMISTIC UPDATES

/**
 * Hook to create a tenant with optimistic updates and cache coordination
 */
export function useCreateTenantMutation(
  options?: Partial<UseMutationOptions<CreateTenantResult, Error, CreateTenantData>>
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: tenantsApi.create,
    onMutate: async (newTenant: CreateTenantData) => {
      browserLogger.userAction('create_tenant_attempt', { name: newTenant.name });

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tenantsQueryKeys.all });

      // Snapshot previous values for rollback
      const previousTenants = queryClient.getQueriesData({
        queryKey: tenantsQueryKeys.lists()
      });

      const previousStats = queryClient.getQueryData(tenantsQueryKeys.stats());

      // Optimistically update tenant lists
      queryClient.setQueriesData(
        { queryKey: tenantsQueryKeys.lists() },
        (old: GetTenantsResponse | undefined) => {
          if (!old) return old;

          const optimisticTenant: TenantListItem = {
            id: 'temp-' + Date.now(),
            uuid: 'temp-' + Date.now(),
            name: newTenant.name,
            domain: newTenant.domain || `${newTenant.name.toLowerCase().replace(/\s+/g, '-')}.example.com`,
            slug: newTenant.slug || newTenant.name.toLowerCase().replace(/\s+/g, '-'),
            description: newTenant.description || null,
            defaultCurrency: newTenant.primaryCurrency,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userCount: 0,
            accountCount: 0,
            status: 'active',
            contactEmail: newTenant.email,
            contactPhone: '',
            plan: 'basic',
            currency: newTenant.primaryCurrency,
            timezone: 'UTC'
          };

          return {
            ...old,
            tenants: [optimisticTenant, ...old.tenants],
            pagination: {
              ...old.pagination,
              total: old.pagination.total + 1
            }
          };
        }
      );

      // Optimistically update stats
      queryClient.setQueryData(
        tenantsQueryKeys.stats(),
        (old: TenantStats | undefined) => {
          if (!old) return old;
          return {
            ...old,
            totalTenants: old.totalTenants + 1,
            activeTenants: old.activeTenants + 1,
            newTenantsToday: old.newTenantsToday + 1
          };
        }
      );

      return { previousTenants, previousStats };
    },
    onError: (error: Error, newTenant: CreateTenantData, context) => {
      browserLogger.userAction('create_tenant_error', { 
        error: error.message,
        name: newTenant.name 
      });

      // Rollback optimistic updates
      if (context?.previousTenants) {
        context.previousTenants.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      if (context?.previousStats) {
        queryClient.setQueryData(tenantsQueryKeys.stats(), context.previousStats);
      }

      toast({
        variant: 'destructive',
        title: 'Failed to create tenant',
        description: error.message || 'An unexpected error occurred.'
      });
    },
    onSuccess: (result: CreateTenantResult, variables: CreateTenantData) => {
      if (result.success && result.tenant) {
        browserLogger.userAction('create_tenant_success', { 
          tenantUuid: result.tenant.uuid,
          name: variables.name 
        });

        toast({
          title: 'Tenant created successfully',
          description: `${variables.name} has been created and is now active.`
        });

        // ✅ THREE-LAYER CACHE INVALIDATION COORDINATION
        // Invalidate all tenant-related queries to trigger fresh fetches
        queryClient.invalidateQueries({ queryKey: tenantsQueryKeys.all });
      } else {
        // Handle business logic errors
        const errorMessage = result.errors?.join(', ') || result.error || 'Unknown error';
        
        browserLogger.userAction('create_tenant_business_error', {
          error: errorMessage,
          name: variables.name
        });

        toast({
          variant: 'destructive',
          title: 'Cannot create tenant',
          description: errorMessage
        });
      }
    },
    onSettled: () => {
      // Always refetch tenant data after mutation settles
      queryClient.invalidateQueries({ queryKey: tenantsQueryKeys.all });
    },
    ...options
  });
}

/**
 * Hook to update a tenant with optimistic updates
 */
export function useUpdateTenantMutation(
  options?: Partial<UseMutationOptions<TenantListItem, Error, { uuid: string; data: Partial<TenantListItem> }>>
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ uuid, data }) => tenantsApi.update(uuid, data),
    onMutate: async ({ uuid, data }) => {
      browserLogger.userAction('update_tenant_attempt', { uuid, fields: Object.keys(data) });

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tenantsQueryKeys.detail(uuid) });
      await queryClient.cancelQueries({ queryKey: tenantsQueryKeys.lists() });

      // Snapshot previous values
      const previousTenant = queryClient.getQueryData(tenantsQueryKeys.detail(uuid));
      const previousLists = queryClient.getQueriesData({ queryKey: tenantsQueryKeys.lists() });

      // Optimistically update individual tenant
      queryClient.setQueryData(
        tenantsQueryKeys.detail(uuid),
        (old: TenantListItem | undefined) => {
          if (!old) return old;
          return { ...old, ...data, updatedAt: new Date().toISOString() };
        }
      );

      // Optimistically update in lists
      queryClient.setQueriesData(
        { queryKey: tenantsQueryKeys.lists() },
        (old: GetTenantsResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            tenants: old.tenants.map(tenant =>
              tenant.uuid === uuid 
                ? { ...tenant, ...data, updatedAt: new Date().toISOString() }
                : tenant
            )
          };
        }
      );

      return { previousTenant, previousLists };
    },
    onError: (error: Error, { uuid, data }, context) => {
      browserLogger.userAction('update_tenant_error', { 
        uuid,
        error: error.message,
        fields: Object.keys(data)
      });

      // Rollback optimistic updates
      if (context?.previousTenant) {
        queryClient.setQueryData(tenantsQueryKeys.detail(uuid), context.previousTenant);
      }

      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast({
        variant: 'destructive',
        title: 'Failed to update tenant',
        description: error.message || 'An unexpected error occurred.'
      });
    },
    onSuccess: (result: TenantListItem, { uuid, data }) => {
      browserLogger.userAction('update_tenant_success', { 
        uuid,
        fields: Object.keys(data)
      });

      toast({
        title: 'Tenant updated successfully',
        description: `${result.name} has been updated.`
      });

      // Update cache with real data from server
      queryClient.setQueryData(tenantsQueryKeys.detail(uuid), result);
    },
    onSettled: (_, __, { uuid }) => {
      // Refetch related data
      queryClient.invalidateQueries({ queryKey: tenantsQueryKeys.detail(uuid) });
      queryClient.invalidateQueries({ queryKey: tenantsQueryKeys.lists() });
    },
    ...options
  });
}

/**
 * Hook to delete a tenant with optimistic updates
 */
export function useDeleteTenantMutation(
  options?: Partial<UseMutationOptions<void, Error, string>>
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: tenantsApi.delete,
    onMutate: async (uuid: string) => {
      browserLogger.userAction('delete_tenant_attempt', { uuid });

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tenantsQueryKeys.all });

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData({ queryKey: tenantsQueryKeys.lists() });
      const previousStats = queryClient.getQueryData(tenantsQueryKeys.stats());
      const previousTenant = queryClient.getQueryData(tenantsQueryKeys.detail(uuid));

      // Optimistically remove from lists
      queryClient.setQueriesData(
        { queryKey: tenantsQueryKeys.lists() },
        (old: GetTenantsResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            tenants: old.tenants.filter(tenant => tenant.uuid !== uuid),
            pagination: {
              ...old.pagination,
              total: Math.max(0, old.pagination.total - 1)
            }
          };
        }
      );

      // Optimistically update stats
      queryClient.setQueryData(
        tenantsQueryKeys.stats(),
        (old: TenantStats | undefined) => {
          if (!old) return old;
          return {
            ...old,
            totalTenants: Math.max(0, old.totalTenants - 1),
            activeTenants: Math.max(0, old.activeTenants - 1)
          };
        }
      );

      // Remove individual tenant from cache
      queryClient.removeQueries({ queryKey: tenantsQueryKeys.detail(uuid) });

      return { previousLists, previousStats, previousTenant };
    },
    onError: (error: Error, uuid: string, context) => {
      browserLogger.userAction('delete_tenant_error', { 
        uuid,
        error: error.message
      });

      // Rollback optimistic updates
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      if (context?.previousStats) {
        queryClient.setQueryData(tenantsQueryKeys.stats(), context.previousStats);
      }

      if (context?.previousTenant) {
        queryClient.setQueryData(tenantsQueryKeys.detail(uuid), context.previousTenant);
      }

      toast({
        variant: 'destructive',
        title: 'Failed to delete tenant',
        description: error.message || 'An unexpected error occurred.'
      });
    },
    onSuccess: (_, uuid) => {
      browserLogger.userAction('delete_tenant_success', { uuid });

      toast({
        title: 'Tenant deleted successfully',
        description: 'The tenant and all associated data have been removed.'
      });
    },
    onSettled: () => {
      // Refetch all tenant data to ensure consistency
      queryClient.invalidateQueries({ queryKey: tenantsQueryKeys.all });
    },
    ...options
  });
}

// ✅ PREFETCHING UTILITIES

/**
 * Prefetch tenants list for instant navigation
 */
export function usePrefetchTenants() {
  const queryClient = useQueryClient();

  return (params: GetTenantsParams = {}) => {
    queryClient.prefetchQuery({
      queryKey: tenantsQueryKeys.list(params),
      queryFn: () => tenantsApi.getAll(params),
      staleTime: 5 * 60 * 1000
    });
  };
}

/**
 * Prefetch individual tenant for instant navigation
 */
export function usePrefetchTenant() {
  const queryClient = useQueryClient();

  return (uuid: string) => {
    queryClient.prefetchQuery({
      queryKey: tenantsQueryKeys.detail(uuid),
      queryFn: () => tenantsApi.getByUuid(uuid),
      staleTime: 5 * 60 * 1000
    });
  };
} 