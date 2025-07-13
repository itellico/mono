'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Fetch categories with pagination and filtering
export function useCategories(params?: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  parentId?: number;
  isActive?: boolean;
  status?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: async () => {
      const response = await apiClient.getCategories(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch categories');
      }
      return response.data;
    },
    staleTime: 300000, // 5 minutes
  });
}

// Fetch single category
export function useCategory(uuid: string) {
  return useQuery({
    queryKey: ['category', uuid],
    queryFn: async () => {
      const response = await apiClient.getCategory(uuid);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch category');
      }
      return response.data;
    },
    enabled: !!uuid,
  });
}

// Create category
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      type: string;
      description?: string;
      parentId?: number;
      orderIndex?: number;
      isActive?: boolean;
      metadata?: any;
    }) => {
      const response = await apiClient.createCategory(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create category');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category');
    },
  });
}

// Update category
export function useUpdateCategory() {
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
      const response = await apiClient.updateCategory(uuid, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update category');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', variables.uuid] });
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category');
    },
  });
}

// Delete category
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uuid: string) => {
      const response = await apiClient.deleteCategory(uuid);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete category');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });
}

// Admin-specific category hooks with additional features
export function useAdminCategoriesList(
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string[];
    status?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  },
  initialData?: any
) {
  return useQuery({
    queryKey: ['admin-categories', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.parentId !== undefined) searchParams.set('parentId', params.parentId.toString());
      if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

      const response = await fetch(`/api/v1/admin/categories?${searchParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch categories');
      }
      
      const data = await response.json();
      return data;
    },
    initialData,
    staleTime: 300000, // 5 minutes - matches Redis TTL
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// Category statistics
export function useCategoryStatistics() {
  return useQuery({
    queryKey: ['category-statistics'],
    queryFn: async () => {
      const response = await apiClient.getCategoryStatistics();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch category statistics');
      }
      return response.data;
    },
    staleTime: 300000, // 5 minutes
  });
}

// Bulk operations
export function useBulkCreateCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      categories: Array<{
        name: string;
        type: string;
        description?: string;
        parentId?: number;
        orderIndex?: number;
        isActive?: boolean;
        metadata?: any;
      }>;
    }) => {
      const response = await apiClient.bulkCreateCategories(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create categories');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-statistics'] });
      toast.success(`${data.categories.length} categories created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create categories');
    },
  });
}

export function useBulkUpdateCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      categoryIds: string[];
      updates: {
        name?: string;
        description?: string;
        isActive?: boolean;
        metadata?: any;
      };
    }) => {
      const response = await apiClient.bulkUpdateCategories(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update categories');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-statistics'] });
      toast.success(`${data.updatedCount} categories updated successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update categories');
    },
  });
}

export function useBulkDeleteCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { categoryIds: string[] }) => {
      const response = await apiClient.bulkDeleteCategories(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete categories');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-statistics'] });
      toast.success(`${data.deletedCount} categories deleted successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete categories');
    },
  });
}

// Import/Export operations
export function useExportCategories() {
  return useMutation({
    mutationFn: async (params?: {
      format?: 'json' | 'csv';
      type?: string;
      isActive?: boolean;
    }) => {
      const response = await apiClient.exportCategories(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to export categories');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Trigger download
      window.open(data.url, '_blank');
      toast.success('Categories export started');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export categories');
    },
  });
}

export function useImportCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      file: File;
      mode: 'append' | 'replace';
      validateOnly?: boolean;
    }) => {
      const response = await apiClient.importCategories(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to import categories');
      }
      return response.data;
    },
    onSuccess: (data) => {
      if (!data.errors?.length) {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
        queryClient.invalidateQueries({ queryKey: ['category-statistics'] });
        toast.success(`${data.imported} categories imported successfully`);
      } else {
        toast.warning(`Import completed with ${data.errors.length} errors`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to import categories');
    },
  });
}

export { useCreateCategory as useAdminCreateCategory };
export { useUpdateCategory as useAdminUpdateCategory };
export { useDeleteCategory as useAdminDeleteCategory };