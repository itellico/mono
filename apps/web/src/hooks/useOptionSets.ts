'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// Fetch option sets with pagination and filtering
export function useOptionSets(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isGlobal?: boolean;
  tenantId?: number;
}) {
  return useQuery({
    queryKey: ['option-sets', params],
    queryFn: async () => {
      const response = await apiClient.getOptionSets(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch option sets');
      }
      return response.data;
    },
  });
}

// Fetch single option set
export function useOptionSet(uuid: string) {
  return useQuery({
    queryKey: ['option-set', uuid],
    queryFn: async () => {
      const response = await apiClient.getOptionSet(uuid);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch option set');
      }
      return response.data;
    },
    enabled: !!uuid,
  });
}

// Create option set
export function useCreateOptionSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      category: string;
      isGlobal?: boolean;
      allowCustomValues?: boolean;
      isRequired?: boolean;
      metadata?: any;
      values?: Array<{
        value: string;
        label: string;
        description?: string;
        orderIndex?: number;
        metadata?: any;
      }>;
    }) => {
      const response = await apiClient.createOptionSet(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create option set');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['option-sets'] });
      toast.success('Option set created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create option set');
    },
  });
}

// Update option set
export function useUpdateOptionSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, data }: {
      uuid: string;
      data: {
        name?: string;
        description?: string;
        category?: string;
        allowCustomValues?: boolean;
        isRequired?: boolean;
        metadata?: any;
      };
    }) => {
      const response = await apiClient.updateOptionSet(uuid, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update option set');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['option-sets'] });
      queryClient.invalidateQueries({ queryKey: ['option-set', variables.uuid] });
      toast.success('Option set updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update option set');
    },
  });
}

// Delete option set
export function useDeleteOptionSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uuid: string) => {
      const response = await apiClient.deleteOptionSet(uuid);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete option set');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['option-sets'] });
      toast.success('Option set deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete option set');
    },
  });
}

// Get option values for a specific set
export function useOptionValues(uuid: string, params?: {
  search?: string;
}) {
  return useQuery({
    queryKey: ['option-values', uuid, params],
    queryFn: async () => {
      const response = await apiClient.getOptionValues(uuid, params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch option values');
      }
      return response.data;
    },
    enabled: !!uuid,
  });
}

// Add value to option set
export function useAddOptionValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, data }: {
      uuid: string;
      data: {
        value: string;
        label: string;
        description?: string;
        orderIndex?: number;
        metadata?: any;
      };
    }) => {
      const response = await apiClient.addOptionValue(uuid, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to add option value');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['option-set', variables.uuid] });
      queryClient.invalidateQueries({ queryKey: ['option-values', variables.uuid] });
      toast.success('Option value added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add option value');
    },
  });
}

// Export option sets
export function useExportOptionSets() {
  return useMutation({
    mutationFn: async (params?: {
      format?: string;
      category?: string;
      includeGlobal?: boolean;
    }) => {
      const response = await apiClient.exportOptionSets(params);
      return response;
    },
    onSuccess: () => {
      toast.success('Option sets exported successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export option sets');
    },
  });
}