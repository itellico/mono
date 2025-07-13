'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// Fetch forms with pagination and filtering
export function useForms(params?: {
  page?: number;
  limit?: number;
  status?: string;
  formType?: string;
  search?: string;
  tenantId?: string;
}) {
  return useQuery({
    queryKey: ['forms', params],
    queryFn: async () => {
      const response = await apiClient.getForms(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch forms');
      }
      return response.data;
    },
  });
}

// Fetch single form
export function useForm(uuid: string) {
  return useQuery({
    queryKey: ['form', uuid],
    queryFn: async () => {
      const response = await apiClient.getForm(uuid);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch form');
      }
      return response.data;
    },
    enabled: !!uuid,
  });
}

// Create form
export function useCreateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      status?: string;
      formType: string;
      schema: any;
      isPublic?: boolean;
      allowAnonymous?: boolean;
      maxSubmissions?: number;
      expiresAt?: string;
    }) => {
      const response = await apiClient.createForm(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create form');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Form created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create form');
    },
  });
}

// Update form
export function useUpdateForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, data }: {
      uuid: string;
      data: {
        name?: string;
        description?: string;
        status?: string;
        schema?: any;
        isPublic?: boolean;
        allowAnonymous?: boolean;
        maxSubmissions?: number;
        expiresAt?: string;
      };
    }) => {
      const response = await apiClient.updateForm(uuid, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update form');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['form', variables.uuid] });
      toast.success('Form updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update form');
    },
  });
}

// Delete form
export function useDeleteForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uuid: string) => {
      const response = await apiClient.deleteForm(uuid);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete form');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Form deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete form');
    },
  });
}

// Get available schemas for form building
export function useAvailableSchemas() {
  return useQuery({
    queryKey: ['forms', 'available-schemas'],
    queryFn: async () => {
      const response = await apiClient.getAvailableSchemas();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch available schemas');
      }
      return response.data;
    },
  });
}

// Generate form from schema
export function useGenerateFormFromSchema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      schemaId: number;
      formName: string;
      formType: string;
      includeValidation?: boolean;
      includeLabels?: boolean;
    }) => {
      const response = await apiClient.generateFormFromSchema(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to generate form from schema');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Form generated successfully from schema');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate form from schema');
    },
  });
}