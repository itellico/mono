'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// Fetch workflows with pagination and filtering
export function useWorkflows(params?: {
  page?: number;
  limit?: number;
  status?: string;
  trigger?: string;
  search?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ['workflows', params],
    queryFn: async () => {
      const response = await apiClient.getWorkflows(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch workflows');
      }
      return response.data;
    },
  });
}

// Fetch single workflow
export function useWorkflow(uuid: string) {
  return useQuery({
    queryKey: ['workflow', uuid],
    queryFn: async () => {
      const response = await apiClient.getWorkflow(uuid);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch workflow');
      }
      return response.data;
    },
    enabled: !!uuid,
  });
}

// Create workflow
export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      trigger: string;
      category?: string;
      definition: any;
      settings?: any;
      isActive?: boolean;
    }) => {
      const response = await apiClient.createWorkflow(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create workflow');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create workflow');
    },
  });
}

// Update workflow
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, data }: {
      uuid: string;
      data: {
        name?: string;
        description?: string;
        status?: string;
        definition?: any;
        settings?: any;
        isActive?: boolean;
      };
    }) => {
      const response = await apiClient.updateWorkflow(uuid, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update workflow');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow', variables.uuid] });
      toast.success('Workflow updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update workflow');
    },
  });
}

// Delete workflow
export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uuid: string) => {
      const response = await apiClient.deleteWorkflow(uuid);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete workflow');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete workflow');
    },
  });
}

// Execute workflow
export function useExecuteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uuid, data }: {
      uuid: string;
      data?: {
        input?: any;
        context?: any;
      };
    }) => {
      const response = await apiClient.executeWorkflow(uuid, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to execute workflow');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow', variables.uuid] });
      queryClient.invalidateQueries({ queryKey: ['workflow-executions', variables.uuid] });
      toast.success('Workflow execution started');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to execute workflow');
    },
  });
}

// Get workflow executions
export function useWorkflowExecutions(uuid: string, params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: ['workflow-executions', uuid, params],
    queryFn: async () => {
      const response = await apiClient.getWorkflowExecutions(uuid, params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch workflow executions');
      }
      return response.data;
    },
    enabled: !!uuid,
  });
}

// Real-time execution status hook
export function useWorkflowExecutionStatus(executionId: string) {
  return useQuery({
    queryKey: ['workflow-execution-status', executionId],
    queryFn: async () => {
      // This would typically call a specific endpoint for execution status
      // For now, we'll return a placeholder
      return { status: 'running', progress: 50 };
    },
    enabled: !!executionId,
    refetchInterval: 2000, // Poll every 2 seconds
    refetchIntervalInBackground: false,
  });
}