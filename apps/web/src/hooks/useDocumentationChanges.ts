import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface DocumentationChange {
  id: string;
  type: 'implementation' | 'update' | 'new';
  title: string;
  description: string;
  proposedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  changes: FileChange[];
  metadata: any;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  feedback?: string;
}

interface FileChange {
  file: string;
  action: 'update' | 'create' | 'delete';
  before?: string;
  after: string;
  diff?: string;
}

interface ApproveChangeData {
  feedback?: string;
}

interface RejectChangeData {
  feedback: string;
}

/**
 * Hook to fetch a single documentation change request
 * Uses TanStack Query for client-side caching (5 min stale time for review data)
 */
export function useDocumentationChange(changeId: string) {
  return useQuery({
    queryKey: ['documentation-change', changeId],
    queryFn: async (): Promise<DocumentationChange> => {
      const response = await fetch(`/api/v1/platform/documentation/review/${changeId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch documentation change');
      }
      
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - review data doesn't change often
    enabled: !!changeId,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 errors
      if (error?.message?.includes('not found')) {
        return false;
      }
      return failureCount < 2;
    }
  });
}

/**
 * Hook to fetch all pending documentation changes  
 * Uses shorter stale time for list data that changes more frequently
 */
export function usePendingDocumentationChanges() {
  return useQuery({
    queryKey: ['documentation-changes', 'pending'],
    queryFn: async (): Promise<DocumentationChange[]> => {
      const response = await fetch('/api/v1/platform/documentation/pending');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch pending changes');
      }
      
      return data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - list data changes more frequently
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes to stay current
  });
}

/**
 * Mutation hook to approve documentation changes
 * Implements optimistic updates and proper cache invalidation
 */
export function useApproveDocumentationChange() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ changeId, data }: { changeId: string; data: ApproveChangeData }) => {
      const response = await fetch(`/api/v1/platform/documentation/approve/${changeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to approve documentation changes');
      }
      
      return result.data;
    },
    onMutate: async ({ changeId, data }) => {
      // Cancel outgoing refetches for this change
      await queryClient.cancelQueries({ queryKey: ['documentation-change', changeId] });
      
      // Get current data
      const previousChange = queryClient.getQueryData<DocumentationChange>(['documentation-change', changeId]);
      
      // Optimistically update the change status
      if (previousChange) {
        queryClient.setQueryData<DocumentationChange>(['documentation-change', changeId], {
          ...previousChange,
          status: 'approved',
          reviewedAt: new Date().toISOString(),
          feedback: data.feedback || 'Approved'
        });
      }
      
      // Return context for rollback
      return { previousChange };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousChange) {
        queryClient.setQueryData(['documentation-change', variables.changeId], context.previousChange);
      }
      toast.error(`Failed to approve changes: ${err.message}`);
    },
    onSuccess: (data, variables) => {
      toast.success('Documentation changes approved successfully!');
      
      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['documentation-changes'] });
      queryClient.invalidateQueries({ queryKey: ['documentation-change', variables.changeId] });
    },
  });
}

/**
 * Mutation hook to reject documentation changes  
 * Requires feedback and updates cache accordingly
 */
export function useRejectDocumentationChange() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ changeId, data }: { changeId: string; data: RejectChangeData }) => {
      const response = await fetch(`/api/v1/platform/documentation/reject/${changeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to reject documentation changes');
      }
      
      return result.data;
    },
    onMutate: async ({ changeId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['documentation-change', changeId] });
      
      // Get current data for rollback
      const previousChange = queryClient.getQueryData<DocumentationChange>(['documentation-change', changeId]);
      
      // Optimistically update the change status
      if (previousChange) {
        queryClient.setQueryData<DocumentationChange>(['documentation-change', changeId], {
          ...previousChange,
          status: 'rejected',
          reviewedAt: new Date().toISOString(),
          feedback: data.feedback
        });
      }
      
      return { previousChange };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousChange) {
        queryClient.setQueryData(['documentation-change', variables.changeId], context.previousChange);
      }
      toast.error(`Failed to reject changes: ${err.message}`);
    },
    onSuccess: (data, variables) => {
      toast.success('Documentation changes rejected with feedback');
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['documentation-changes'] });
      queryClient.invalidateQueries({ queryKey: ['documentation-change', variables.changeId] });
    },
  });
}

/**
 * Hook to propose new documentation changes (for Claude integration)
 * Includes proper error handling and cache updates
 */
export function useProposeDocumentationChange() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      type: 'implementation' | 'update' | 'new';
      title: string;
      description: string;
      changes: FileChange[];
      metadata?: any;
    }) => {
      const response = await fetch('/api/v1/platform/documentation/propose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          proposedBy: 'claude' // Default for Claude integration
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to propose documentation changes');
      }
      
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate pending changes list to show new proposal
      queryClient.invalidateQueries({ queryKey: ['documentation-changes', 'pending'] });
      
      toast.success('Documentation change proposed successfully!');
    },
    onError: (err) => {
      toast.error(`Failed to propose documentation changes: ${err.message}`);
    }
  });
}