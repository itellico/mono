import { useMutation, useQueryClient, useQuery, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useWebSocket } from './useWebSocket';
import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface ChangeSetResponse {
  id: string;
  entityType: string;
  entityId: string;
  level: 'OPTIMISTIC' | 'PROCESSING' | 'COMMITTED';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED' | 'ROLLED_BACK' | 'CONFLICTED';
  changes: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  appliedAt?: string;
  conflicts?: any[];
}

export interface ChangeOptions<T> {
  entityType: string;
  entityId: string;
  optimisticUpdate?: (oldData: T, newData: Partial<T>) => T;
  conflictResolver?: (current: T, incoming: T) => T;
  requireApproval?: boolean;
  onConflict?: (conflicts: any[]) => void;
  mutationOptions?: Omit<UseMutationOptions<T, Error, Partial<T>>, 'mutationFn'>;
}

export interface ChangeHistoryResponse {
  changes: (ChangeSetResponse & { diff?: any; version?: any })[];
  total: number;
}

export function useThreeLevelChange<T extends Record<string, any>>(options: ChangeOptions<T>) {
  const queryClient = useQueryClient();
  const { subscribe, unsubscribe } = useWebSocket();
  const queryKey = [`${options.entityType}`, options.entityId];

  // Subscribe to real-time changes for this entity
  useEffect(() => {
    const handleChange = (message: any) => {
      switch (message.type) {
        case 'ENTITY_UPDATED':
          if (message.data.entityType === options.entityType && 
              message.data.entityId === options.entityId) {
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey });
          }
          break;
          
        case 'CHANGE_COMMITTED':
        case 'CHANGE_REJECTED':
          if (message.data.entityType === options.entityType && 
              message.data.entityId === options.entityId) {
            // Update UI based on change status
            if (message.type === 'CHANGE_COMMITTED') {
              toast.success('Changes saved successfully');
            } else {
              toast.error('Changes were rejected');
            }
            queryClient.invalidateQueries({ queryKey });
          }
          break;
          
        case 'CONFLICT_DETECTED':
          if (message.data.entityType === options.entityType && 
              message.data.entityId === options.entityId) {
            options.onConflict?.(message.data.conflicts);
          }
          break;
      }
    };

    // Subscribe to entity-specific channel
    const channel = `entity:${options.entityType}:${options.entityId}`;
    subscribe(channel, handleChange);

    // Subscribe to general changes channel
    subscribe('changes', handleChange);

    return () => {
      unsubscribe(channel, handleChange);
      unsubscribe('changes', handleChange);
    };
  }, [options.entityType, options.entityId, queryClient, subscribe, unsubscribe, options.onConflict]);

  const mutation = useMutation<T, Error, Partial<T>>({
    mutationFn: async (data: Partial<T>) => {
      // Level 1: Create optimistic change set
      const changeSet = await apiClient.post<ChangeSetResponse>('/v1/changes', {
        entityType: options.entityType,
        entityId: options.entityId,
        changes: data,
        level: 'OPTIMISTIC',
        metadata: {
          requireApproval: options.requireApproval,
          _version: (queryClient.getQueryData(queryKey) as any)?.updatedAt,
        },
      });

      // Level 2: Process through API with change tracking
      try {
        const result = await apiClient.patch<T>(
          `/v1/changes/${options.entityType}/${options.entityId}`,
          data,
          { 
            headers: { 
              'X-Change-Set-Id': changeSet.id,
            },
          }
        );
        
        return result;
      } catch (error: any) {
        // Handle conflicts
        if (error.response?.status === 409) {
          const conflictData = error.response.data;
          
          // Show conflict UI
          options.onConflict?.(conflictData.conflicts);
          
          // Try automatic resolution if resolver provided
          if (options.conflictResolver && conflictData.current && conflictData.incoming) {
            const resolved = options.conflictResolver(
              conflictData.current, 
              conflictData.incoming
            );
            
            // Retry with resolved data
            return apiClient.patch<T>(
              `/v1/changes/${options.entityType}/${options.entityId}`,
              resolved,
              { headers: { 'X-Change-Set-Id': changeSet.id } }
            );
          }
        }
        
        throw error;
      }
    },
    
    // Optimistic update
    onMutate: async (newData) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData<T>(queryKey);
      
      // Optimistically update
      if (previousData && options.optimisticUpdate) {
        const optimisticData = options.optimisticUpdate(previousData, newData);
        queryClient.setQueryData(queryKey, optimisticData);
      }
      
      // Return context with snapshot
      return { previousData };
    },
    
    // Rollback on error
    onError: (err, newData, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      
      // Show error message
      if (err instanceof Error) {
        toast.error(err.message);
      }
    },
    
    // Update cache on success
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['changes', options.entityType] 
      });
      
      if (!options.requireApproval) {
        toast.success('Changes saved successfully');
      }
    },
    
    ...options.mutationOptions,
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    data: mutation.data,
    reset: mutation.reset,
  };
}

// Hook to get change history
export function useChangeHistory(entityType: string, entityId: string, options?: {
  includeRollbacks?: boolean;
  limit?: number;
  offset?: number;
}) {
  return useQuery<ChangeHistoryResponse>({
    queryKey: ['changes', entityType, entityId, 'history', options],
    queryFn: () => apiClient.get(`/v1/changes/${entityType}/${entityId}/history`, {
      params: {
        includeRollbacks: options?.includeRollbacks,
        limit: options?.limit || 50,
        offset: options?.offset || 0,
      },
    }),
    staleTime: 30000, // 30 seconds
  });
}

// Hook to get pending changes for approval
export function usePendingChanges(options?: {
  entityType?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['changes', 'pending', options],
    queryFn: () => apiClient.get('/v1/changes/pending', {
      params: options,
    }),
    staleTime: 10000, // 10 seconds
  });
}

// Hook to approve/reject changes
export function useChangeApproval() {
  const queryClient = useQueryClient();
  
  const approveMutation = useMutation({
    mutationFn: ({ changeSetId, applyImmediately }: { 
      changeSetId: string; 
      applyImmediately?: boolean;
    }) => apiClient.post(`/v1/changes/${changeSetId}/approve`, { applyImmediately }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changes'] });
      toast.success('Change approved');
    },
  });
  
  const rejectMutation = useMutation({
    mutationFn: ({ changeSetId, reason }: { 
      changeSetId: string; 
      reason?: string;
    }) => apiClient.post(`/v1/changes/${changeSetId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changes'] });
      toast.success('Change rejected');
    },
  });
  
  return {
    approve: approveMutation.mutate,
    reject: rejectMutation.mutate,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}

// Hook to rollback changes
export function useChangeRollback() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (changeSetId: string) => 
      apiClient.post(`/v1/changes/${changeSetId}/rollback`),
    onSuccess: (data, changeSetId) => {
      queryClient.invalidateQueries({ queryKey: ['changes'] });
      toast.success('Change rolled back successfully');
    },
    onError: (error: Error) => {
      toast.error(`Rollback failed: ${error.message}`);
    },
  });
}

// Hook to resolve conflicts
export function useConflictResolution() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ conflictId, resolution }: {
      conflictId: string;
      resolution: {
        type: 'ACCEPT_CURRENT' | 'ACCEPT_INCOMING' | 'MERGE' | 'MANUAL' | 'RETRY';
        mergedChanges?: any;
      };
    }) => apiClient.post(`/v1/changes/conflicts/${conflictId}/resolve`, { resolution }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changes'] });
      toast.success('Conflict resolved');
    },
  });
}