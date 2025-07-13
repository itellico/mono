import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQueryClient } from '@tanstack/react-query';
import { ConflictResolver } from './ConflictResolver';
import { toast } from 'sonner';

interface PendingChange {
  id: string;
  entityType: string;
  entityId: string;
  level: 'OPTIMISTIC' | 'PROCESSING' | 'COMMITTED';
  status: string;
  changes: any;
  createdAt: string;
}

interface Conflict {
  id: string;
  type: string;
  data?: any;
  changeSet?: any;
}

interface ChangeContextValue {
  pendingChanges: Map<string, PendingChange>;
  conflicts: Map<string, Conflict[]>;
  subscribeToEntity: (entityType: string, entityId: string) => () => void;
  resolveConflict: (conflictId: string, resolution: any) => void;
  clearConflicts: (entityKey: string) => void;
  getEntityChanges: (entityType: string, entityId: string) => PendingChange[];
  getEntityConflicts: (entityType: string, entityId: string) => Conflict[];
}

const ChangeContext = createContext<ChangeContextValue | null>(null);

export function useChangeContext() {
  const context = useContext(ChangeContext);
  if (!context) {
    throw new Error('useChangeContext must be used within a ThreeLevelChangeProvider');
  }
  return context;
}

interface ThreeLevelChangeProviderProps {
  children: ReactNode;
  showNotifications?: boolean;
}

export function ThreeLevelChangeProvider({ 
  children,
  showNotifications = true 
}: ThreeLevelChangeProviderProps) {
  const queryClient = useQueryClient();
  const { subscribe, unsubscribe } = useWebSocket();
  const [pendingChanges] = useState(new Map<string, PendingChange>());
  const [conflicts, setConflicts] = useState(new Map<string, Conflict[]>());
  const [activeConflictDialog, setActiveConflictDialog] = useState<{
    conflicts: Conflict[];
    entityKey: string;
    currentValues?: any;
    incomingValues?: any;
  } | null>(null);

  useEffect(() => {
    const handleChange = (message: any) => {
      switch (message.type) {
        case 'CHANGE_CREATED':
          // Add to pending changes
          pendingChanges.set(message.data.id, message.data);
          
          if (showNotifications && message.data.level === 'OPTIMISTIC') {
            toast.info('Saving changes...', { duration: 2000 });
          }
          break;
          
        case 'CHANGE_UPDATED':
          // Update existing change
          const existing = pendingChanges.get(message.data.id);
          if (existing) {
            pendingChanges.set(message.data.id, { ...existing, ...message.data });
          }
          
          // Invalidate affected queries
          queryClient.invalidateQueries({
            queryKey: [message.data.entityType, message.data.entityId],
          });
          break;
          
        case 'CHANGE_COMMITTED':
          // Remove from pending and show success
          pendingChanges.delete(message.data.id);
          
          if (showNotifications) {
            toast.success('Changes saved successfully');
          }
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({
            queryKey: [message.data.entityType, message.data.entityId],
          });
          queryClient.invalidateQueries({
            queryKey: ['changes', message.data.entityType, message.data.entityId],
          });
          break;
          
        case 'CHANGE_REJECTED':
          // Remove from pending and show error
          pendingChanges.delete(message.data.id);
          
          if (showNotifications) {
            toast.error(
              message.data.rejectionReason || 'Changes were rejected',
              { duration: 5000 }
            );
          }
          
          // Invalidate to revert optimistic updates
          queryClient.invalidateQueries({
            queryKey: [message.data.entityType, message.data.entityId],
          });
          break;
          
        case 'CONFLICT_DETECTED':
          // Add conflict to the map
          const entityKey = `${message.data.entityType}:${message.data.entityId}`;
          const entityConflicts = conflicts.get(entityKey) || [];
          
          setConflicts(prev => {
            const next = new Map(prev);
            next.set(entityKey, [...entityConflicts, message.data]);
            return next;
          });
          
          // Show conflict dialog
          if (showNotifications) {
            setActiveConflictDialog({
              conflicts: [...entityConflicts, message.data],
              entityKey,
              currentValues: message.data.current,
              incomingValues: message.data.incoming,
            });
          }
          break;
          
        case 'ENTITY_UPDATED':
          // Another user updated the entity
          if (showNotifications) {
            const key = `${message.data.entityType}:${message.data.entityId}`;
            const hasLocalChanges = Array.from(pendingChanges.values()).some(
              change => change.entityType === message.data.entityType && 
                       change.entityId === message.data.entityId
            );
            
            if (hasLocalChanges) {
              toast.warning('This item was updated by another user', {
                description: 'Your changes may conflict',
                duration: 5000,
              });
            }
          }
          
          // Invalidate queries
          queryClient.invalidateQueries({
            queryKey: [message.data.entityType, message.data.entityId],
          });
          break;
      }
    };

    // Subscribe to changes channel
    const unsubscribeChanges = subscribe('changes', handleChange);

    return () => {
      unsubscribeChanges();
    };
  }, [queryClient, subscribe, pendingChanges, conflicts, showNotifications]);

  const subscribeToEntity = (entityType: string, entityId: string) => {
    const channel = `entity:${entityType}:${entityId}`;
    const unsubscribeFn = subscribe(channel, (message) => {
      // Handle entity-specific messages
      queryClient.invalidateQueries({
        queryKey: [entityType, entityId],
      });
    });
    
    return unsubscribeFn;
  };

  const resolveConflict = async (conflictId: string, resolution: any) => {
    // This will be handled by the ConflictResolver component
    // which uses the useConflictResolution hook
  };

  const clearConflicts = (entityKey: string) => {
    setConflicts(prev => {
      const next = new Map(prev);
      next.delete(entityKey);
      return next;
    });
  };

  const getEntityChanges = (entityType: string, entityId: string) => {
    return Array.from(pendingChanges.values()).filter(
      change => change.entityType === entityType && change.entityId === entityId
    );
  };

  const getEntityConflicts = (entityType: string, entityId: string) => {
    const key = `${entityType}:${entityId}`;
    return conflicts.get(key) || [];
  };

  const contextValue: ChangeContextValue = {
    pendingChanges,
    conflicts,
    subscribeToEntity,
    resolveConflict,
    clearConflicts,
    getEntityChanges,
    getEntityConflicts,
  };

  return (
    <ChangeContext.Provider value={contextValue}>
      {children}
      
      {/* Global conflict resolver dialog */}
      {activeConflictDialog && (
        <ConflictResolver
          isOpen={true}
          onClose={() => setActiveConflictDialog(null)}
          conflicts={activeConflictDialog.conflicts}
          currentValues={activeConflictDialog.currentValues}
          incomingValues={activeConflictDialog.incomingValues}
          onResolve={() => {
            clearConflicts(activeConflictDialog.entityKey);
            setActiveConflictDialog(null);
          }}
        />
      )}
    </ChangeContext.Provider>
  );
}