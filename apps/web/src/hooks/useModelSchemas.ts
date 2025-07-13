'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// Fetch model schemas with pagination and filtering
export function useModelSchemas(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  tenantId?: number;
}) {
  return useQuery({
    queryKey: ['model-schemas', params],
    queryFn: async () => {
      const response = await apiClient.getModelSchemas(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch model schemas');
      }
      return response.data;
    },
  });
}

// Fetch single model schema
export function useModelSchema(uuid: string) {
  return useQuery({
    queryKey: ['model-schema', uuid],
    queryFn: async () => {
      const response = await apiClient.getModelSchema(uuid);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch model schema');
      }
      return response.data;
    },
    enabled: !!uuid,
  });
}

// Create model schema
export function useCreateModelSchema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      category: string;
      status?: string;
      fields: any;
      validation?: any;
      metadata?: any;
    }) => {
      const response = await apiClient.createModelSchema(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create model schema');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-schemas'] });
      toast.success('Model schema created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create model schema');
    },
  });
}

// Update model schema
export function useUpdateModelSchema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, data }: {
      uuid: string;
      data: {
        name?: string;
        description?: string;
        category?: string;
        status?: string;
        fields?: any;
        validation?: any;
        metadata?: any;
      };
    }) => {
      const response = await apiClient.updateModelSchema(uuid, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update model schema');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['model-schemas'] });
      queryClient.invalidateQueries({ queryKey: ['model-schema', variables.uuid] });
      toast.success('Model schema updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update model schema');
    },
  });
}

// Delete model schema
export function useDeleteModelSchema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uuid: string) => {
      const response = await apiClient.deleteModelSchema(uuid);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete model schema');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-schemas'] });
      toast.success('Model schema deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete model schema');
    },
  });
}

// Duplicate model schema
export function useDuplicateModelSchema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, data }: {
      uuid: string;
      data: {
        name: string;
        description?: string;
      };
    }) => {
      const response = await apiClient.duplicateModelSchema(uuid, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to duplicate model schema');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-schemas'] });
      toast.success('Model schema duplicated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to duplicate model schema');
    },
  });
}

// Export model schemas
export function useExportModelSchemas() {
  return useMutation({
    mutationFn: async (params?: {
      format?: string;
      category?: string;
      status?: string;
    }) => {
      const response = await apiClient.exportModelSchemas(params);
      return response;
    },
    onSuccess: () => {
      toast.success('Model schemas exported successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export model schemas');
    },
  });
}

// Import model schemas
export function useImportModelSchemas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      schemas: any[];
      conflictResolution?: string;
    }) => {
      const response = await apiClient.importModelSchemas(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to import model schemas');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['model-schemas'] });
      toast.success(`Import completed: ${data.imported} imported, ${data.skipped} skipped, ${data.updated} updated`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to import model schemas');
    },
  });
}