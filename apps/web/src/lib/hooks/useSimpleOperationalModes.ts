/**
 * Simplified ReactQuery hooks for Operational Modes
 * 
 * Client-side state management for God Mode and Developer Mode
 * Works with the hybrid permission + state approach (simplified version)
 * Syncs with Zustand store for instant updates
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useOperationalModesStore, useOperationalModesActions } from '@/lib/stores/operational-modes.store';
import { useShallow } from 'zustand/react/shallow';

interface OperationalModeState {
  isEnabled: boolean;
  enabledAt?: string;
  enabledBy?: number;
  reason?: string;
  expiresAt?: string;
}

interface OperationalModesResponse {
  godMode: {
    hasPermission: boolean;
    isActive: boolean;
    state?: OperationalModeState;
  };
  developerMode: {
    hasPermission: boolean;
    isActive: boolean;
    state?: OperationalModeState;
  };
}

// Query keys factory
export const operationalModesKeys = {
  all: ['operational-modes'] as const,
  current: () => [...operationalModesKeys.all, 'current'] as const,
};

/**
 * Hook to get current operational modes status
 * Combines ReactQuery for server state with Zustand for instant updates
 */
export function useOperationalModes() {
  const { user } = useAuth();
  const { setOperationalModes, setLoading, setError } = useOperationalModesActions();
  
  // Get Zustand state for instant updates
  const zustandState = useOperationalModesStore(
    useShallow((state) => ({
      godMode: state.godMode,
      developerMode: state.developerMode,
      debugMode: state.debugMode,
      lastUpdated: state.lastUpdated
    }))
  );
  
  const query = useQuery({
    queryKey: operationalModesKeys.current(),
    queryFn: async (): Promise<OperationalModesResponse> => {
      setLoading(true);
      
      try {
        const response = await fetch('/api/v1/admin/operational-modes', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch operational modes');
        }

        const result = await response.json();
        const data = result.data || result;
        
        // Sync with Zustand store
        setOperationalModes({
          godMode: data.godMode,
          developerMode: data.developerMode,
          debugMode: data.debugMode
        });
        
        setLoading(false);
        return data;
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 30 * 60 * 1000, // 30 minutes (operational modes don't change frequently)
    gcTime: 60 * 60 * 1000,    // 1 hour (keep in cache longer)
    refetchOnWindowFocus: false, // Don't refetch on focus - operational modes are stable
    refetchInterval: false,      // Remove auto-refetch - use manual invalidation instead
    retry: 2,                    // Limit retries for faster failure detection
  });

  // Return ReactQuery data as primary source, Zustand for instant updates only when explicitly updated
  return {
    ...query,
    data: query.data ? {
      godMode: query.data.godMode,
      developerMode: query.data.developerMode,
    } : undefined
  };
}

/**
 * Hook to check if God Mode is currently active
 */
export function useIsGodModeActive() {
  const { data: modes } = useOperationalModes();
  
  return {
    isActive: modes?.godMode?.isActive ?? false,
    hasPermission: modes?.godMode?.hasPermission ?? false,
    expiresAt: modes?.godMode?.state?.expiresAt ? new Date(modes.godMode.state.expiresAt) : undefined,
    reason: modes?.godMode?.state?.reason,
  };
}

/**
 * Hook to check if Developer Mode is currently active
 */
export function useIsDeveloperModeActive() {
  const { data: modes } = useOperationalModes();
  
  return {
    isActive: modes?.developerMode?.isActive ?? false,
    hasPermission: modes?.developerMode?.hasPermission ?? false,
    enabledAt: modes?.developerMode?.state?.enabledAt ? new Date(modes.developerMode.state.enabledAt) : undefined,
    reason: modes?.developerMode?.state?.reason,
  };
} 