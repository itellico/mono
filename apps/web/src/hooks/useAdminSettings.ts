'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// Fetch admin settings
export function useAdminSettings(params?: {
  category?: string;
  search?: string;
  isGlobal?: boolean;
}) {
  return useQuery({
    queryKey: ['admin-settings', params],
    queryFn: async () => {
      const response = await apiClient.getAdminSettings(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch admin settings');
      }
      return response.data;
    },
  });
}

// Fetch single admin setting
export function useAdminSetting(key: string) {
  return useQuery({
    queryKey: ['admin-setting', key],
    queryFn: async () => {
      const response = await apiClient.getAdminSetting(key);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch admin setting');
      }
      return response.data;
    },
    enabled: !!key,
  });
}

// Set admin setting
export function useSetAdminSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, data }: {
      key: string;
      data: {
        value: any;
        category?: string;
        description?: string;
        type?: string;
        isPublic?: boolean;
        isGlobal?: boolean;
        validation?: any;
      };
    }) => {
      const response = await apiClient.setAdminSetting(key, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to save admin setting');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-setting', variables.key] });
      toast.success('Setting saved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save setting');
    },
  });
}

// Delete admin setting
export function useDeleteAdminSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (key: string) => {
      const response = await apiClient.deleteAdminSetting(key);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete admin setting');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Setting deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete setting');
    },
  });
}

// Get system information
export function useSystemInfo() {
  return useQuery({
    queryKey: ['system-info'],
    queryFn: async () => {
      const response = await apiClient.getSystemInfo();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch system information');
      }
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Update RBAC configuration
export function useUpdateRBACConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      enableWildcards?: boolean;
      enableInheritance?: boolean;
      enableCaching?: boolean;
      cacheExpirationMinutes?: number;
      maxPermissionsPerUser?: number;
      enableAuditLog?: boolean;
      auditRetentionDays?: number;
    }) => {
      const response = await apiClient.updateRBACConfig(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update RBAC configuration');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-info'] });
      toast.success('RBAC configuration updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update RBAC configuration');
    },
  });
}

// Import admin settings
export function useImportAdminSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      settings: Array<{
        key: string;
        value: any;
        category?: string;
        description?: string;
        type?: string;
        isPublic?: boolean;
      }>;
      overwriteExisting?: boolean;
    }) => {
      const response = await apiClient.importAdminSettings(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to import admin settings');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success(
        `Import completed: ${data.imported} imported, ${data.skipped} skipped${
          data.errors.length > 0 ? `, ${data.errors.length} errors` : ''
        }`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to import admin settings');
    },
  });
}

// Export admin settings
export function useExportAdminSettings() {
  return useMutation({
    mutationFn: async (params?: {
      category?: string;
      includeGlobal?: boolean;
      format?: string;
    }) => {
      const response = await apiClient.exportAdminSettings(params);
      return response;
    },
    onSuccess: () => {
      toast.success('Settings exported successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export settings');
    },
  });
}

// Hook to get a specific setting value with default fallback
export function useAdminSettingValue(key: string, defaultValue?: any) {
  const { data: settingData, ...queryResult } = useAdminSetting(key);
  
  const value = settingData?.setting?.value ?? defaultValue;
  
  return {
    value,
    setting: settingData?.setting,
    ...queryResult,
  };
}

// Hook to get multiple settings as a map
export function useAdminSettingsMap(keys: string[]) {
  return useQuery({
    queryKey: ['admin-settings-map', keys],
    queryFn: async () => {
      const settingsMap: Record<string, any> = {};
      
      await Promise.all(
        keys.map(async (key) => {
          try {
            const response = await apiClient.getAdminSetting(key);
            if (response.success) {
              settingsMap[key] = response.data.setting.value;
            }
          } catch {
            // Ignore individual failures
          }
        })
      );
      
      return settingsMap;
    },
    enabled: keys.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}