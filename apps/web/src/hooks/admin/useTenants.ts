import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { browserLogger } from '@/lib/browser-logger';

interface UpdateTenantParams {
  uuid: string;
  data: Record<string, unknown>;
}

interface TenantListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  currency?: string;
  userCountRange?: string;
}

interface TenantData {
  id: string;
  uuid: string;
  name: string;
  domain: string;
  isActive: boolean;
  userCount?: number;
  defaultCurrency?: string;
  createdAt: string;
  updatedAt: string;
}

interface TenantsResponse {
  tenants: TenantData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// API functions
async function updateTenant({ uuid, data }: UpdateTenantParams) {
  const response = await fetch(`/api/v1/admin/tenants/${uuid}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update tenant');
  }

  return response.json();
}

async function fetchTenantsList(params: TenantListParams) {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.search) searchParams.set('search', params.search);
  if (params.status) searchParams.set('status', params.status);
  if (params.currency) searchParams.set('currency', params.currency);
  if (params.userCountRange) searchParams.set('userCountRange', params.userCountRange);

  const response = await fetch(`/api/v1/admin/tenants?${searchParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch tenants');
  }

  const result = await response.json();
  
  // Handle the API response structure: { success: boolean, data: { tenants: [], pagination: {} } }
  if (!result.success || !result.data) {
    throw new Error(result.message || 'Invalid response format');
  }

  // Ensure tenants is always an array
  const tenants = Array.isArray(result.data.tenants) ? result.data.tenants : [];
  
  // Ensure pagination has default values
  const pagination = {
    page: result.data.pagination?.page || params.page || 1,
    limit: result.data.pagination?.limit || params.limit || 20,
    total: result.data.pagination?.total || 0,
    totalPages: result.data.pagination?.totalPages || 1,
    hasMore: result.data.pagination?.hasMore || false
  };

  return {
    tenants,
    pagination
  };
}

async function deleteTenant(uuid: string): Promise<void> {
  const response = await fetch(`/api/v1/admin/tenants/${uuid}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete tenant');
  }
}

async function suspendTenant(uuid: string): Promise<void> {
  const response = await fetch(`/api/v1/admin/tenants/${uuid}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isActive: false }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to suspend tenant');
  }
}


// TanStack Query hooks
export const useAdminTenantsList = (params: TenantListParams) => {
  return useQuery<TenantsResponse, Error>({
    queryKey: ['admin-tenants', params],
    queryFn: () => fetchTenantsList(params),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new
    staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
    refetchOnWindowFocus: false, // Disable refetch on window focus
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTenant,
    onMutate: async ({ uuid, data }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['admin-tenants'] });
      await queryClient.cancelQueries({ queryKey: ['admin-tenant', uuid] });

      // Snapshot the previous values
      const previousTenantsList = queryClient.getQueriesData({ queryKey: ['admin-tenants'] });
      const previousTenant = queryClient.getQueryData(['admin-tenant', uuid]);

      // Optimistically update all admin-tenants queries
      queryClient.setQueriesData(
        { queryKey: ['admin-tenants'] },
        (oldData: unknown) => {
          const typedOldData = oldData as TenantsResponse | undefined;
          if (!typedOldData?.tenants) return typedOldData;
          
          return {
            ...typedOldData,
            tenants: typedOldData.tenants.map((tenant: TenantData) =>
              tenant.uuid === uuid
                ? { ...tenant, ...data, updatedAt: new Date().toISOString() }
                : tenant
            ),
          };
        }
      );

      // Optimistically update specific tenant query
      queryClient.setQueryData(['admin-tenant', uuid], (oldData: unknown) => {
        const typedOldData = oldData as TenantData | undefined;
        if (!typedOldData) return typedOldData;
        return { ...typedOldData, ...data, updatedAt: new Date().toISOString() };
      });

      // Return a context object with the snapshotted values
      return { previousTenantsList, previousTenant, uuid };
    },
    onError: (error: Error, variables, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousTenantsList) {
        context.previousTenantsList.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData);
        });
      }
      if (context?.previousTenant) {
        queryClient.setQueryData(['admin-tenant', context.uuid], context.previousTenant);
      }
      
      toast.error(`Failed to update tenant: ${error.message}`);
      browserLogger.error('Failed to update tenant', { error: error.message });
    },
    onSuccess: async (updatedTenant, variables) => {
      // ✅ Use only TanStack Query cache management - no server-side cache
      
      // Invalidate ALL admin-tenants queries (with any filters)
      await queryClient.invalidateQueries({ 
        queryKey: ['admin-tenants'],
        exact: false // This will invalidate all queries that start with ['admin-tenants']
      });
      
      // Also invalidate specific tenant queries
      await queryClient.invalidateQueries({
        queryKey: ['admin-tenant', updatedTenant.data?.uuid || variables.uuid],
        exact: false
      });
      
      // Refetch any active admin-tenants queries to ensure fresh data
      await queryClient.refetchQueries({
        queryKey: ['admin-tenants'],
        type: 'active'
      });
      
      // Dispatch a custom event for manual cache listeners
      window.dispatchEvent(new CustomEvent('clearTanStackCache'));
      
      toast.success('Tenant updated successfully');
      browserLogger.info('Tenant updated successfully', { 
        tenantId: updatedTenant.data?.id || variables.uuid,
        changes: variables.data 
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    },
  });
};

export const useDeleteTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTenant,
    onMutate: async (uuid) => {
      await queryClient.cancelQueries({ queryKey: ['admin-tenants'] });
      const previousTenantsList = queryClient.getQueriesData({ queryKey: ['admin-tenants'] });
      const previousTenant = queryClient.getQueryData(['admin-tenant', uuid]);

      queryClient.setQueriesData(
        { queryKey: ['admin-tenants'] },
        (oldData: unknown) => {
          const typedOldData = oldData as TenantsResponse | undefined;
          if (!typedOldData?.tenants) return typedOldData;
          
          return {
            ...typedOldData,
            tenants: typedOldData.tenants.filter((tenant: TenantData) => tenant.uuid !== uuid),
          };
        }
      );
      queryClient.setQueryData(['admin-tenant', uuid], undefined);

      return { previousTenantsList, previousTenant, uuid };
    },
    onError: (error: Error, uuid, context) => {
      if (context?.previousTenantsList) {
        context.previousTenantsList.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData);
        });
      }
      if (context?.previousTenant) {
        queryClient.setQueryData(['admin-tenant', context.uuid], context.previousTenant);
      }
      toast.error(`Failed to delete tenant: ${error.message}`);
      browserLogger.error('Failed to delete tenant', { error: error.message });
    },
    onSuccess: async (data, uuid) => {
      // ✅ Use only TanStack Query cache management - no server-side cache
      await queryClient.invalidateQueries({ queryKey: ['admin-tenants'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['admin-tenant', uuid], exact: false });
      window.dispatchEvent(new CustomEvent('clearTanStackCache'));
      toast.success('Tenant deleted successfully');
      browserLogger.info('Tenant deleted successfully', { tenantId: uuid });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    },
  });
};

export const useSuspendTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uuid }: { uuid: string }) => suspendTenant(uuid),
    onMutate: async ({ uuid }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-tenants'] });
      await queryClient.cancelQueries({ queryKey: ['admin-tenant', uuid] });

      const previousTenantsList = queryClient.getQueriesData({ queryKey: ['admin-tenants'] });
      const previousTenant = queryClient.getQueryData(['admin-tenant', uuid]);

      queryClient.setQueriesData(
        { queryKey: ['admin-tenants'] },
        (oldData: unknown) => {
          const typedOldData = oldData as TenantsResponse | undefined;
          if (!typedOldData?.tenants) return typedOldData;
          
          return {
            ...typedOldData,
            tenants: typedOldData.tenants.map((tenant: TenantData) =>
              tenant.uuid === uuid
                ? { ...tenant, isActive: false, updatedAt: new Date().toISOString() }
                : tenant
            ),
          };
        }
      );
      queryClient.setQueryData(['admin-tenant', uuid], (oldData: unknown) => {
        const typedOldData = oldData as TenantData | undefined;
        if (!typedOldData) return typedOldData;
        return { ...typedOldData, isActive: false, updatedAt: new Date().toISOString() };
      });

      return { previousTenantsList, previousTenant, uuid };
    },
    onError: (error: Error, { uuid }, context) => {
      if (context?.previousTenantsList) {
        context.previousTenantsList.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData);
        });
      }
      if (context?.previousTenant) {
        queryClient.setQueryData(['admin-tenant', context.uuid], context.previousTenant);
      }
      toast.error(`Failed to suspend tenant: ${error.message}`);
      browserLogger.error('Failed to suspend tenant', { error: error.message });
    },
    onSuccess: async (data, { uuid }) => {
      // ✅ Use only TanStack Query cache management - no server-side cache
      await queryClient.invalidateQueries({ queryKey: ['admin-tenants'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['admin-tenant', uuid], exact: false });
      window.dispatchEvent(new CustomEvent('clearTanStackCache'));
      toast.success('Tenant suspended successfully');
      browserLogger.info('Tenant suspended successfully', { tenantId: uuid });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    },
  });
};


