'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// Fetch tags with pagination and filtering
export function useTags(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  categoryType?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: ['tags', params],
    queryFn: async () => {
      const response = await apiClient.getTags(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch tags');
      }
      return response.data;
    },
  });
}

// Fetch single tag
export function useTag(uuid: string) {
  return useQuery({
    queryKey: ['tag', uuid],
    queryFn: async () => {
      const response = await apiClient.getTag(uuid);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch tag');
      }
      return response.data;
    },
    enabled: !!uuid,
  });
}

// Create tag
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      categoryId: number;
      description?: string;
      orderIndex?: number;
      isActive?: boolean;
      metadata?: any;
    }) => {
      const response = await apiClient.createTag(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create tag');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create tag');
    },
  });
}

// Create bulk tags
export function useCreateBulkTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      tags: Array<{
        name: string;
        categoryId: number;
        description?: string;
      }>;
    }) => {
      const response = await apiClient.createBulkTags(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create tags');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success(`${data.created} tags created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create tags');
    },
  });
}

// Update tag
export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, data }: {
      uuid: string;
      data: {
        name?: string;
        description?: string;
        orderIndex?: number;
        isActive?: boolean;
        metadata?: any;
      };
    }) => {
      const response = await apiClient.updateTag(uuid, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update tag');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tag', variables.uuid] });
      toast.success('Tag updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update tag');
    },
  });
}

// Delete tag
export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uuid: string) => {
      const response = await apiClient.deleteTag(uuid);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete tag');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete tag');
    },
  });
}

// Admin-specific tag hooks
export function useAdminTagsList(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  categoryType?: string;
  isActive?: boolean;
}) {
  return useTags(params);
}

export { useCreateTag as useAdminCreateTag };
export { useUpdateTag as useAdminUpdateTag };
export { useDeleteTag as useAdminDeleteTag };