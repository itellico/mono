'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// Fetch tenants with pagination and filtering
export function useTenants(params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  domain?: string;
}) {
  return useQuery({
    queryKey: ['tenants', params],
    queryFn: async () => {
      const response = await apiClient.getTenants(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch tenants');
      }
      return response.data;
    },
  });
}

// Fetch single tenant
export function useTenant(uuid: string) {
  return useQuery({
    queryKey: ['tenant', uuid],
    queryFn: async () => {
      const response = await apiClient.getTenant(uuid);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch tenant');
      }
      return response.data;
    },
    enabled: !!uuid,
  });
}

// Create tenant
export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      domain: string;
      slug?: string;
      description?: any;
      features?: any;
      settings?: any;
      categories?: any;
      allowedCountries?: any;
      defaultCurrency?: string;
      isActive?: boolean;
      planId?: number;
    }) => {
      const response = await apiClient.createTenant(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create tenant');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create tenant');
    },
  });
}

// Update tenant
export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, data }: {
      uuid: string;
      data: {
        name?: string;
        domain?: string;
        slug?: string;
        description?: any;
        features?: any;
        settings?: any;
        categories?: any;
        allowedCountries?: any;
        defaultCurrency?: string;
        isActive?: boolean;
      };
    }) => {
      const response = await apiClient.updateTenant(uuid, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update tenant');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', variables.uuid] });
      toast.success('Tenant updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update tenant');
    },
  });
}

// Delete tenant
export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uuid: string) => {
      const response = await apiClient.deleteTenant(uuid);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete tenant');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete tenant');
    },
  });
}

// Get tenant statistics
export function useTenantStats(uuid: string) {
  return useQuery({
    queryKey: ['tenant-stats', uuid],
    queryFn: async () => {
      const response = await apiClient.getTenantStats(uuid);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch tenant statistics');
      }
      return response.data;
    },
    enabled: !!uuid,
  });
}

// Update tenant subscription
export function useUpdateTenantSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, data }: {
      uuid: string;
      data: {
        planId: number;
        startDate?: string;
        endDate?: string;
        status?: string;
      };
    }) => {
      const response = await apiClient.updateTenantSubscription(uuid, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update tenant subscription');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant', variables.uuid] });
      queryClient.invalidateQueries({ queryKey: ['tenant-stats', variables.uuid] });
      toast.success('Tenant subscription updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update tenant subscription');
    },
  });
}

// Get tenant configuration
export function useTenantConfig(uuid: string) {
  return useQuery({
    queryKey: ['tenant-config', uuid],
    queryFn: async () => {
      const response = await apiClient.getTenantConfig(uuid);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch tenant configuration');
      }
      return response.data;
    },
    enabled: !!uuid,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}