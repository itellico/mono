'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { browserLogger } from '@/lib/browser-logger';

interface TagFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  status?: string;
}

interface TagData {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categories?: { category: { id: number; name: string; slug: string } }[];
}

interface TagsResponse {
  tags: TagData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Fetch tags list with filters and pagination
 * Implements three-layer caching: TanStack Query -> Redis -> Database
 */
export function useAdminTagsList(filters: TagFilters, initialData?: TagsResponse) {
  return useQuery({
    queryKey: ['adminTags', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`/api/v1/admin/tags?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to fetch tags');
      }

      const data = await response.json();
      browserLogger.info('Tags fetched via API', {
        count: data.tags?.length || 0,
        filters
      });
      return data as TagsResponse;
    },
    initialData,
    staleTime: 300000, // 5 minutes - matches Redis TTL
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Create a new tag
 */
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: {
      name: string;
      slug: string;
      description?: string;
      categoryIds?: number[];
    }) => {
      const response = await fetch('/api/v1/admin/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tagData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to create tag');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminTags'] });
      queryClient.invalidateQueries({ queryKey: ['tag-statistics'] });
      toast.success('Tag created successfully');
      browserLogger.userAction('admin_tag_created', { tagId: data.id, tagName: data.name });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create tag');
      browserLogger.error('admin_tag_create_failed', { error: error.message });
    },
  });
}

/**
 * Update an existing tag
 */
export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...tagData }: {
      id: string;
      name?: string;
      slug?: string;
      description?: string;
      isActive?: boolean;
      categoryIds?: number[];
    }) => {
      const response = await fetch(`/api/v1/admin/tags/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tagData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to update tag');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminTags'] });
      queryClient.invalidateQueries({ queryKey: ['tag', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tag-statistics'] });
      toast.success('Tag updated successfully');
      browserLogger.userAction('admin_tag_updated', { tagId: variables.id });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update tag');
      browserLogger.error('admin_tag_update_failed', { error: error.message });
    },
  });
}

/**
 * Delete a tag
 */
export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: string) => {
      const response = await fetch(`/api/v1/admin/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to delete tag');
      }

      return response.json();
    },
    onSuccess: (_, tagId) => {
      queryClient.invalidateQueries({ queryKey: ['adminTags'] });
      queryClient.invalidateQueries({ queryKey: ['tag', tagId] });
      queryClient.invalidateQueries({ queryKey: ['tag-statistics'] });
      toast.success('Tag deleted successfully');
      browserLogger.userAction('admin_tag_deleted', { tagId });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete tag');
      browserLogger.error('admin_tag_delete_failed', { error: error.message });
    },
  });
}

/**
 * Fetch tag statistics
 */
export function useTagStatistics() {
  return useQuery({
    queryKey: ['tag-statistics'],
    queryFn: async () => {
      const response = await fetch('/api/v1/admin/tags/stats', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to fetch tag statistics');
      }

      return response.json();
    },
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
