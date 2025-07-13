'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import type { TagData, TagSearchParams, EntityTagParams } from './types';

// Hook to fetch tags for an entity
export function useEntityTags(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['entity-tags', entityType, entityId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/tags/entity/${entityType}/${entityId}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch entity tags');
      }
      return response.data.data.tags as TagData[];
    },
    enabled: !!entityId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to search tags
export function useSearchTags(params: TagSearchParams) {
  return useQuery({
    queryKey: ['tags-search', params],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/tags', { params });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to search tags');
      }
      return response.data.data.tags as TagData[];
    },
    enabled: !!params.search || params.popular === true,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to get popular tags
export function usePopularTags(category?: string, limit: number = 20) {
  return useQuery({
    queryKey: ['tags-popular', category, limit],
    queryFn: async () => {
      const params: any = {
        popular: true,
        limit,
      };
      if (category) {
        params.category = category;
      }
      
      const response = await apiClient.get('/api/v1/tags', { params });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch popular tags');
      }
      return response.data.data.tags as TagData[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to add a tag to an entity
export function useAddEntityTag() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tagId, entityType, entityId }: {
      tagId: number;
      entityType: string;
      entityId: string;
    }) => {
      const response = await apiClient.post('/api/v1/tags/entity', {
        tagId,
        entityType,
        entityId,
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to add tag');
      }
      
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['entity-tags', variables.entityType, variables.entityId] 
      });
      toast({
        title: 'Tag added',
        description: 'The tag has been added successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add tag',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to remove a tag from an entity
export function useRemoveEntityTag() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tagId, entityType, entityId }: {
      tagId: number;
      entityType: string;
      entityId: string;
    }) => {
      const response = await apiClient.delete('/api/v1/tags/entity', {
        data: {
          tagId,
          entityType,
          entityId,
        },
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to remove tag');
      }
      
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['entity-tags', variables.entityType, variables.entityId] 
      });
      toast({
        title: 'Tag removed',
        description: 'The tag has been removed successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to remove tag',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to create a new tag
export function useCreateTag() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ name, category }: {
      name: string;
      category?: string;
    }) => {
      const response = await apiClient.post('/api/v1/tags', {
        name,
        category,
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create tag');
      }
      
      return response.data.data.tag as TagData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags-search'] });
      queryClient.invalidateQueries({ queryKey: ['tags-popular'] });
      toast({
        title: 'Tag created',
        description: 'The new tag has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create tag',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Hook to find entities by tags
export function useFindEntitiesByTags() {
  return useMutation({
    mutationFn: async ({ entityType, tagIds, matchAll = false, limit = 50, offset = 0 }: {
      entityType: string;
      tagIds: number[];
      matchAll?: boolean;
      limit?: number;
      offset?: number;
    }) => {
      const response = await apiClient.post('/api/v1/tags/search/entities', {
        entityType,
        tagIds,
        matchAll,
        limit,
        offset,
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to find entities');
      }
      
      return response.data.data.entityIds as string[];
    },
  });
}

// Hook for bulk tag operations
export function useBulkAddTags() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ entityType, entityIds, tagIds }: {
      entityType: string;
      entityIds: string[];
      tagIds: number[];
    }) => {
      const response = await apiClient.post('/api/v1/tags/bulk/add', {
        entityType,
        entityIds,
        tagIds,
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to add tags');
      }
      
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate cache for all affected entities
      variables.entityIds.forEach(entityId => {
        queryClient.invalidateQueries({ 
          queryKey: ['entity-tags', variables.entityType, entityId] 
        });
      });
      
      toast({
        title: 'Tags added',
        description: response.data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add tags',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}