/**
 * ReactQuery hooks for Operational Modes
 * 
 * Client-side state management for God Mode and Developer Mode
 * Works with the hybrid permission + state approach
 */

'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { browserLogger } from '@/lib/browser-logger';

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

interface GodModeToggleRequest {
  durationHours?: number;
  reason: string;
}

interface DeveloperModeToggleRequest {
  reason?: string;
}

// Query keys factory
export const operationalModesKeys = {
  all: ['operational-modes'] as const,
  current: () => [...operationalModesKeys.all, 'current'] as const,
  permissions: () => [...operationalModesKeys.all, 'permissions'] as const,
};

/**
 * Hook to get current operational modes status
 */
export function useOperationalModes() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: operationalModesKeys.current(),
    queryFn: async (): Promise<OperationalModesResponse> => {
      const response = await fetch('/api/v1/admin/operational-modes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch operational modes');
      }

      return response.json();
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000, // Refetch every minute for security
  });
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

/**
 * Hook to enable God Mode
 */
export function useEnableGodMode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: GodModeToggleRequest) => {
      browserLogger.userAction('god_mode_enable_attempt', 'God mode enable attempt', {
        durationHours: request.durationHours,
        reason: request.reason
      });

      const response = await fetch('/api/v1/admin/operational-modes/god-mode/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to enable God Mode');
      }

      const result = await response.json();
      
      browserLogger.userAction('god_mode_enabled', 'God mode enabled successfully', {
        success: result.success,
        durationHours: request.durationHours,
        expiresAt: result.expiresAt
      });

      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch modes
      queryClient.invalidateQueries({ queryKey: operationalModesKeys.current() });
    },
    onError: (error) => {
      browserLogger.apiResponse('god_mode_enable_failed', {
        error: error.message
      });
    },
  });
}

/**
 * Hook to disable God Mode
 */
export function useDisableGodMode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reason: string = 'Manual disable') => {
      browserLogger.userAction('god_mode_disable_attempt', { reason });

      const response = await fetch('/api/v1/admin/operational-modes/god-mode/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to disable God Mode');
      }

      const result = await response.json();
      
      browserLogger.userAction('god_mode_disabled', {
        success: result.success,
        reason
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationalModesKeys.current() });
    },
    onError: (error) => {
      browserLogger.apiResponse('god_mode_disable_failed', {
        error: error.message
      });
    },
  });
}

/**
 * Hook to toggle Developer Mode
 */
export function useToggleDeveloperMode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: DeveloperModeToggleRequest = {}) => {
      const reason = request.reason || 'Manual toggle';
      
      browserLogger.userAction('developer_mode_toggle_attempt', { reason });

      const response = await fetch('/api/v1/admin/operational-modes/developer-mode/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to toggle Developer Mode');
      }

      const result = await response.json();
      
      browserLogger.userAction('developer_mode_toggled', {
        success: result.success,
        isEnabled: result.isEnabled,
        reason
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: operationalModesKeys.current() });
    },
    onError: (error) => {
      browserLogger.apiResponse('developer_mode_toggle_failed', {
        error: error.message
      });
    },
  });
}

/**
 * Hook to get God Mode status with automatic expiration handling
 */
export function useGodModeWithExpiration() {
  const { data: modes, refetch } = useOperationalModes();
  const disableGodMode = useDisableGodMode();
  
  const godMode = modes?.godMode;
  const expiresAt = godMode?.state?.expiresAt ? new Date(godMode.state.expiresAt) : null;
  const isExpired = expiresAt ? expiresAt < new Date() : false;
  
  // Auto-disable if expired
  React.useEffect(() => {
    if (godMode?.isActive && isExpired) {
      browserLogger.userAction('god_mode_auto_expired', 'God mode session expired', {
        expiresAt: expiresAt?.toISOString()
      });
      
      disableGodMode.mutate('Auto-disabled: session expired');
    }
  }, [godMode?.isActive, isExpired, disableGodMode]);
  
  return {
    isActive: godMode?.isActive && !isExpired,
    hasPermission: godMode?.hasPermission ?? false,
    expiresAt,
    isExpired,
    timeRemaining: expiresAt && !isExpired ? 
      Math.max(0, expiresAt.getTime() - Date.now()) : 0,
    reason: godMode?.state?.reason,
  };
}

/**
 * Hook for admin components that need both modes
 */
export function useAdminModes() {
  const { data: modes, isLoading, error } = useOperationalModes();
  const enableGodMode = useEnableGodMode();
  const disableGodMode = useDisableGodMode();
  const toggleDeveloperMode = useToggleDeveloperMode();
  
  return {
    // State
    modes,
    isLoading,
    error,
    
    // God Mode
    godMode: {
      isActive: modes?.godMode?.isActive ?? false,
      hasPermission: modes?.godMode?.hasPermission ?? false,
      state: modes?.godMode?.state,
      enable: enableGodMode.mutate,
      disable: disableGodMode.mutate,
      isEnabling: enableGodMode.isPending,
      isDisabling: disableGodMode.isPending,
    },
    
    // Developer Mode
    developerMode: {
      isActive: modes?.developerMode?.isActive ?? false,
      hasPermission: modes?.developerMode?.hasPermission ?? false,
      state: modes?.developerMode?.state,
      toggle: toggleDeveloperMode.mutate,
      isToggling: toggleDeveloperMode.isPending,
    },
  };
} 