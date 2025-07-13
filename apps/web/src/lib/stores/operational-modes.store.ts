/**
 * Operational Modes Zustand Store
 * 
 * Provides instant state updates for God Mode and Developer Mode
 * Coordinates with ReactQuery cache invalidation for real-time UI updates
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { browserLogger } from '@/lib/browser-logger';

interface OperationalModeState {
  isEnabled: boolean;
  enabledAt?: string;
  enabledBy?: number;
  reason?: string;
  expiresAt?: string;
}

interface OperationalMode {
  hasPermission: boolean;
  isActive: boolean;
  state?: OperationalModeState;
}

interface OperationalModesState {
  // State
  godMode: OperationalMode;
  developerMode: OperationalMode;
  debugMode: OperationalMode;
  
  // Meta
  isLoading: boolean;
  lastUpdated?: Date;
  error?: string;
  
  // Actions
  setOperationalModes: (modes: Partial<Pick<OperationalModesState, 'godMode' | 'developerMode' | 'debugMode'>>) => void;
  updateGodMode: (isActive: boolean, reason?: string) => void;
  updateDeveloperMode: (isActive: boolean, reason?: string) => void;
  updateDebugMode: (isActive: boolean, reason?: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
  reset: () => void;
}

const initialState = {
  godMode: {
    hasPermission: false,
    isActive: false,
    state: undefined
  },
  developerMode: {
    hasPermission: false,
    isActive: false,
    state: undefined
  },
  debugMode: {
    hasPermission: false,
    isActive: false,
    state: undefined
  },
  isLoading: false,
  lastUpdated: undefined,
  error: undefined,
};

export const useOperationalModesStore = create<OperationalModesState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          setOperationalModes: (modes) => {
            set((state) => {
              if (modes.godMode) {
                state.godMode = modes.godMode;
              }
              if (modes.developerMode) {
                state.developerMode = modes.developerMode;
              }
              if (modes.debugMode) {
                state.debugMode = modes.debugMode;
              }
              state.lastUpdated = new Date();
              state.error = undefined;
            });
          },

          updateGodMode: (isActive, reason = 'Updated via admin settings', userId?: string) => {
            set((state) => {
              // Use provided userId or fallback to unknown for audit trail
              const currentUser = userId || 'unknown';
              
              state.godMode.isActive = isActive;
              state.godMode.state = isActive ? {
                isEnabled: true,
                enabledAt: new Date().toISOString(),
                enabledBy: currentUser,
                reason
              } : undefined;
              
              state.lastUpdated = new Date();
              
              // Log the change
              browserLogger.userAction(
                isActive ? 'god_mode_enabled' : 'god_mode_disabled',
                `God mode ${isActive ? 'enabled' : 'disabled'} via settings`,
                { reason, timestamp: new Date().toISOString() }
              );
            });
          },

          updateDeveloperMode: (isActive, reason = 'Updated via admin settings', userId?: string) => {
            set((state) => {
              // Use provided userId or fallback to unknown for audit trail
              const currentUser = userId || 'unknown';
              
              state.developerMode.isActive = isActive;
              state.developerMode.state = isActive ? {
                isEnabled: true,
                enabledAt: new Date().toISOString(),
                enabledBy: currentUser,
                reason
              } : undefined;
              
              state.lastUpdated = new Date();
              
              // Log the change
              browserLogger.userAction(
                isActive ? 'developer_mode_enabled' : 'developer_mode_disabled',
                `Developer mode ${isActive ? 'enabled' : 'disabled'} via settings`,
                { reason, timestamp: new Date().toISOString() }
              );
            });
          },

          updateDebugMode: (isActive, reason = 'Updated via admin settings', userId?: string) => {
            set((state) => {
              // Use provided userId or fallback to unknown for audit trail
              const currentUser = userId || 'unknown';
              
              state.debugMode.isActive = isActive;
              state.debugMode.state = isActive ? {
                isEnabled: true,
                enabledAt: new Date().toISOString(),
                enabledBy: currentUser,
                reason
              } : undefined;
              
              state.lastUpdated = new Date();
            });
          },

          setLoading: (loading) => {
            set((state) => {
              state.isLoading = loading;
            });
          },

          setError: (error) => {
            set((state) => {
              state.error = error;
              state.isLoading = false;
            });
          },

          reset: () => {
            set(() => ({ ...initialState }));
          }
        }))
      ),
      {
        name: 'operational-modes-storage',
        partialize: (state) => ({
          // Only persist the actual mode states, not loading/error states
          godMode: state.godMode,
          developerMode: state.developerMode,
          debugMode: state.debugMode,
          lastUpdated: state.lastUpdated
        }),
        // Force rehydration from server on fresh data
        version: 2, // Increment this to clear old cached data
      }
    ),
    {
      name: 'operational-modes-store',
    }
  )
);

// Selectors for better performance
export const useGodModeSelector = () => 
  useOperationalModesStore((state) => state.godMode);

export const useDeveloperModeSelector = () => 
  useOperationalModesStore((state) => state.developerMode);

export const useDebugModeSelector = () => 
  useOperationalModesStore((state) => state.debugMode);

// Individual action hooks to prevent infinite loops
export const useSetOperationalModes = () => 
  useOperationalModesStore((state) => state.setOperationalModes);

export const useUpdateGodMode = () => 
  useOperationalModesStore((state) => state.updateGodMode);

export const useUpdateDeveloperMode = () => 
  useOperationalModesStore((state) => state.updateDeveloperMode);

export const useUpdateDebugMode = () => 
  useOperationalModesStore((state) => state.updateDebugMode);

export const useSetOperationalModesLoading = () => 
  useOperationalModesStore((state) => state.setLoading);

export const useSetOperationalModesError = () => 
  useOperationalModesStore((state) => state.setError);

export const useResetOperationalModes = () => 
  useOperationalModesStore((state) => state.reset);

// Combined actions hook (alternative approach)
export const useOperationalModesActions = () => {
  const setOperationalModes = useSetOperationalModes();
  const updateGodMode = useUpdateGodMode();
  const updateDeveloperMode = useUpdateDeveloperMode();
  const updateDebugMode = useUpdateDebugMode();
  const setLoading = useSetOperationalModesLoading();
  const setError = useSetOperationalModesError();
  const reset = useResetOperationalModes();
  
  return {
    setOperationalModes,
    updateGodMode,
    updateDeveloperMode,
    updateDebugMode,
    setLoading,
    setError,
    reset
  };
}; 