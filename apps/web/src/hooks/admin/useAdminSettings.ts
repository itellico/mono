/**
 * Admin Settings TanStack Query Hooks
 * 
 * Provides comprehensive data fetching, caching, and mutation capabilities
 * for the admin settings management system. Integrates with Zustand store
 * for optimal state management and real-time updates.
 */

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { browserLogger } from '@/lib/browser-logger';
import { useAdminSettingsStore, type AdminSetting, type SettingsFilters } from '@/stores/admin-settings.store';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AdminSettingsResponse {
  success: boolean;
  data: {
    settings: AdminSetting[];
    categories: string[];
  };
}

interface SingleSettingResponse {
  success: boolean;
  data: {
    setting: AdminSetting;
  };
}

interface SystemInfoResponse {
  success: boolean;
  data: {
    system: {
      overview: {
        tenants: number;
        users: number;
        activeUsers: number;
        globalSettings: number;
      };
      rbac: any;
      version: string;
      environment: string;
      database: {
        type: string;
        connected: boolean;
      };
      server: {
        uptime: number;
        memory: any;
        nodeVersion: string;
      };
    };
  };
}

interface CreateUpdateSettingRequest {
  value: any;
  category?: string;
  description?: string;
  type?: 'string' | 'number' | 'boolean' | 'json' | 'array';
  isPublic?: boolean;
  isGlobal?: boolean;
  validation?: any;
}

interface ImportSettingsRequest {
  settings: Array<{
    key: string;
    value: any;
    category?: string;
    description?: string;
    type?: string;
    isPublic?: boolean;
  }>;
  overwriteExisting?: boolean;
}

interface ImportSettingsResponse {
  success: boolean;
  data: {
    imported: number;
    skipped: number;
    errors: string[];
  };
}

interface ExportSettingsParams {
  category?: string;
  includeGlobal?: boolean;
  format?: 'json' | 'csv';
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

const API_BASE = '/api/v1/admin/settings';

async function fetchAdminSettings(filters: SettingsFilters = {}): Promise<AdminSettingsResponse> {
  const params = new URLSearchParams();
  
  if (filters.category) params.append('category', filters.category);
  if (filters.search) params.append('search', filters.search);
  if (filters.isGlobal !== undefined) params.append('isGlobal', filters.isGlobal.toString());

  const url = `${API_BASE}?${params.toString()}`;
  
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function fetchSingleSetting(key: string): Promise<SingleSettingResponse> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(key)}`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function createOrUpdateSetting(key: string, data: CreateUpdateSettingRequest): Promise<SingleSettingResponse> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(key)}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function deleteSetting(key: string): Promise<{ success: boolean; data: { message: string } }> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function fetchSystemInfo(): Promise<SystemInfoResponse> {
  const response = await fetch(`${API_BASE}/system/info`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function importSettings(data: ImportSettingsRequest): Promise<ImportSettingsResponse> {
  const response = await fetch(`${API_BASE}/import`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function exportSettings(params: ExportSettingsParams = {}): Promise<Blob> {
  const searchParams = new URLSearchParams();
  
  if (params.category) searchParams.append('category', params.category);
  if (params.includeGlobal !== undefined) searchParams.append('includeGlobal', params.includeGlobal.toString());
  if (params.format) searchParams.append('format', params.format);

  const url = `${API_BASE}/export?${searchParams.toString()}`;
  
  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.blob();
}

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

export const ADMIN_SETTINGS_QUERY_KEYS = {
  all: ['admin-settings'] as const,
  lists: () => [...ADMIN_SETTINGS_QUERY_KEYS.all, 'list'] as const,
  list: (filters: SettingsFilters) => [...ADMIN_SETTINGS_QUERY_KEYS.lists(), filters] as const,
  details: () => [...ADMIN_SETTINGS_QUERY_KEYS.all, 'detail'] as const,
  detail: (key: string) => [...ADMIN_SETTINGS_QUERY_KEYS.details(), key] as const,
  system: () => [...ADMIN_SETTINGS_QUERY_KEYS.all, 'system'] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch admin settings list with filtering and automatic store sync
 */
export function useAdminSettingsList(filters: SettingsFilters = {}, options: {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
} = {}) {
  const { 
    setSettings, 
    setCategories, 
    setLoading, 
    setError,
    refresh 
  } = useAdminSettingsStore();

  const query = useQuery({
    queryKey: ADMIN_SETTINGS_QUERY_KEYS.list(filters),
    queryFn: () => fetchAdminSettings(filters),
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? 1000 * 60 * 5, // 5 minutes
    refetchInterval: options.refetchInterval,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      browserLogger.error('Failed to fetch admin settings', { error: error.message, attempt: failureCount });
      return failureCount < 3;
    },
    onSuccess: (data) => {
      setSettings(data.data.settings);
      setCategories(data.data.categories);
      setLoading(false);
      setError(null);
      browserLogger.info('Admin settings fetched successfully', { count: data.data.settings.length });
    },
    onError: (error: Error) => {
      setError(error.message);
      setLoading(false);
      browserLogger.error('Failed to fetch admin settings', { error: error.message });
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  // Sync loading state with store
  React.useEffect(() => {
    setLoading(query.isLoading);
  }, [query.isLoading, setLoading]);

  return {
    ...query,
    refresh: () => {
      refresh();
      query.refetch();
    },
  };
}

/**
 * Hook to fetch a single admin setting
 */
export function useAdminSetting(key: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ADMIN_SETTINGS_QUERY_KEYS.detail(key),
    queryFn: () => fetchSingleSetting(key),
    enabled: options.enabled !== false && !!key,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      browserLogger.error('Failed to fetch setting', { key, error: error.message, attempt: failureCount });
      return failureCount < 2;
    },
  });
}

/**
 * Hook to fetch system information
 */
export function useSystemInfo(options: { enabled?: boolean; refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: ADMIN_SETTINGS_QUERY_KEYS.system(),
    queryFn: fetchSystemInfo,
    enabled: options.enabled !== false,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: options.refetchInterval ?? 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create or update an admin setting
 */
export function useCreateOrUpdateSetting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { updateSetting, addSetting } = useAdminSettingsStore();

  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: CreateUpdateSettingRequest }) =>
      createOrUpdateSetting(key, data),
    
    onMutate: async ({ key, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ADMIN_SETTINGS_QUERY_KEYS.all });

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData(ADMIN_SETTINGS_QUERY_KEYS.lists());

      // Optimistically update the store
      const existingSetting = useAdminSettingsStore.getState().getSettingByKey(key);
      if (existingSetting) {
        updateSetting(key, { ...data, key, updatedAt: new Date().toISOString() });
      } else {
        const newSetting: AdminSetting = {
          id: Date.now(),
          key,
          ...data,
          tenantId: data.isGlobal ? null : 1, // Would get actual tenant ID from context
          createdBy: 1, // Would get actual user ID from context
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as AdminSetting;
        addSetting(newSetting);
      }

      return { previousSettings };
    },

    onError: (error: Error, { key }, context) => {
      // Rollback optimistic update
      if (context?.previousSettings) {
        queryClient.setQueryData(ADMIN_SETTINGS_QUERY_KEYS.lists(), context.previousSettings);
      }

      toast({
        title: 'Setting Update Failed',
        description: error.message,
        variant: 'destructive',
      });

      browserLogger.error('Failed to update setting', { key, error: error.message });
    },

    onSuccess: (response, { key }) => {
      // Update the setting in the store with server response
      updateSetting(key, response.data.setting);

      toast({
        title: 'Setting Updated',
        description: `Setting "${key}" has been updated successfully.`,
      });

      browserLogger.info('Setting updated successfully', { key });
    },

    onSettled: () => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey: ADMIN_SETTINGS_QUERY_KEYS.all });
    },
  });
}

/**
 * Hook to delete an admin setting
 */
export function useDeleteSetting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { removeSetting } = useAdminSettingsStore();

  return useMutation({
    mutationFn: deleteSetting,
    
    onMutate: async (key) => {
      await queryClient.cancelQueries({ queryKey: ADMIN_SETTINGS_QUERY_KEYS.all });

      const previousSettings = queryClient.getQueryData(ADMIN_SETTINGS_QUERY_KEYS.lists());

      // Optimistically remove from store
      removeSetting(key);

      return { previousSettings };
    },

    onError: (error: Error, key, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(ADMIN_SETTINGS_QUERY_KEYS.lists(), context.previousSettings);
      }

      toast({
        title: 'Setting Deletion Failed',
        description: error.message,
        variant: 'destructive',
      });

      browserLogger.error('Failed to delete setting', { key, error: error.message });
    },

    onSuccess: (_, key) => {
      toast({
        title: 'Setting Deleted',
        description: `Setting "${key}" has been deleted successfully.`,
      });

      browserLogger.info('Setting deleted successfully', { key });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_SETTINGS_QUERY_KEYS.all });
    },
  });
}

/**
 * Hook to import admin settings
 */
export function useImportSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { 
    startImport, 
    updateImportProgress, 
    setImportResults, 
    completeImport, 
    setImportExportError 
  } = useAdminSettingsStore();

  return useMutation({
    mutationFn: importSettings,
    
    onMutate: () => {
      startImport();
    },

    onError: (error: Error) => {
      setImportExportError(error.message);
      
      toast({
        title: 'Settings Import Failed',
        description: error.message,
        variant: 'destructive',
      });

      browserLogger.error('Failed to import settings', { error: error.message });
    },

    onSuccess: (response) => {
      setImportResults(response.data);
      completeImport();

      const { imported, skipped, errors } = response.data;
      
      toast({
        title: 'Settings Import Complete',
        description: `Imported ${imported} settings, skipped ${skipped}${errors.length > 0 ? `, ${errors.length} errors` : ''}.`,
        variant: errors.length > 0 ? 'destructive' : 'default',
      });

      browserLogger.info('Settings import completed', { imported, skipped, errors: errors.length });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_SETTINGS_QUERY_KEYS.all });
    },
  });
}

/**
 * Hook to export admin settings
 */
export function useExportSettings() {
  const { toast } = useToast();
  const { 
    startExport, 
    updateExportProgress, 
    completeExport, 
    setImportExportError 
  } = useAdminSettingsStore();

  return useMutation({
    mutationFn: exportSettings,
    
    onMutate: () => {
      startExport();
    },

    onError: (error: Error) => {
      setImportExportError(error.message);
      
      toast({
        title: 'Settings Export Failed',
        description: error.message,
        variant: 'destructive',
      });

      browserLogger.error('Failed to export settings', { error: error.message });
    },

    onSuccess: (blob, params) => {
      completeExport();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `settings-export-${new Date().toISOString().split('T')[0]}.${params.format || 'json'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Settings Export Complete',
        description: 'Settings have been exported and downloaded successfully.',
      });

      browserLogger.info('Settings export completed', { format: params.format });
    },
  });
}

// ============================================================================
// BULK OPERATIONS HOOKS
// ============================================================================

/**
 * Hook to perform bulk delete operations
 */
export function useBulkDeleteSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { 
    startBulkOperation, 
    updateBulkProgress, 
    completeBulkOperation, 
    setBulkError,
    getSelectedSettings 
  } = useAdminSettingsStore();

  return useMutation({
    mutationFn: async (keys: string[]) => {
      startBulkOperation('delete', new Set(keys));
      
      const results = [];
      for (let i = 0; i < keys.length; i++) {
        try {
          await deleteSetting(keys[i]);
          results.push({ key: keys[i], success: true });
          updateBulkProgress((i + 1) / keys.length * 100);
        } catch (error) {
          results.push({ key: keys[i], success: false, error: error.message });
        }
      }
      
      return results;
    },

    onError: (error: Error) => {
      setBulkError(error.message);
      
      toast({
        title: 'Bulk Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    },

    onSuccess: (results) => {
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      completeBulkOperation();

      toast({
        title: 'Bulk Delete Complete',
        description: `Deleted ${successful.length} settings${failed.length > 0 ? `, ${failed.length} failed` : ''}.`,
        variant: failed.length > 0 ? 'destructive' : 'default',
      });

      browserLogger.info('Bulk delete completed', { successful: successful.length, failed: failed.length });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_SETTINGS_QUERY_KEYS.all });
    },
  });
}