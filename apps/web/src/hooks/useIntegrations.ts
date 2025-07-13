'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

// Types
interface Integration {
  id: number;
  slug: string;
  name: string;
  description?: string;
  iconUrl?: string;
  settingsSchema: any;
  defaultSettings: any;
  category: string;
  isTemporalEnabled: boolean;
  handler?: string;
  enabled: boolean;
  version: string;
  author?: string;
  supportUrl?: string;
  documentationUrl?: string;
  webhookUrl?: string;
  requiresAuth: boolean;
  authType?: string;
  createdAt: string;
  updatedAt: string;
}

interface TenantIntegration {
  id: number;
  tenantId: number;
  integrationSlug: string;
  status: string;
  settings: any;
  fieldMappings: any;
  lastSyncedAt?: string;
  lastErrorAt?: string;
  lastErrorMessage?: string;
  syncCount: number;
  errorCount: number;
  isTestMode: boolean;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  integration?: Integration;
}

interface IntegrationFilters {
  page?: number;
  limit?: number;
  category?: string;
  enabled?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface TenantIntegrationFilters {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface IntegrationStatistics {
  totalIntegrations: number;
  enabledIntegrations: number;
  categoryCounts: Record<string, number>;
}

interface TenantIntegrationStatistics {
  totalIntegrations: number;
  activeIntegrations: number;
  totalSyncs: number;
  totalErrors: number;
  lastSyncDate?: string;
  statusCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
}

// System integrations (Admin)
export function useSystemIntegrations(filters: IntegrationFilters = {}) {
  return useQuery({
    queryKey: ['system-integrations', filters],
    queryFn: async () => {
      const response = await apiClient.getSystemIntegrations(filters);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch system integrations');
      }
      return response.data;
    },
    staleTime: 300000, // 5 minutes
  });
}

export function useSystemIntegration(slug: string, enabled = true) {
  return useQuery({
    queryKey: ['system-integration', slug],
    queryFn: async () => {
      const response = await apiClient.getSystemIntegration(slug);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch system integration');
      }
      return response.data;
    },
    enabled: enabled && !!slug,
    staleTime: 300000, // 5 minutes
  });
}

export function useCreateSystemIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      slug: string;
      name: string;
      description?: string;
      iconUrl?: string;
      settingsSchema: any;
      defaultSettings?: any;
      category: string;
      isTemporalEnabled?: boolean;
      handler?: string;
      enabled?: boolean;
      version?: string;
      author?: string;
      supportUrl?: string;
      documentationUrl?: string;
      webhookUrl?: string;
      requiresAuth?: boolean;
      authType?: string;
    }) => {
      const response = await apiClient.createSystemIntegration(data);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create integration');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Integration "${data.name}" created successfully`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['system-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['integration-statistics'] });
    },
    onError: (error) => {
      toast.error(`Failed to create integration: ${error.message}`);
    },
  });
}

export function useUpdateSystemIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      ...updateData
    }: {
      slug: string;
      name?: string;
      description?: string;
      iconUrl?: string;
      settingsSchema?: any;
      defaultSettings?: any;
      category?: string;
      isTemporalEnabled?: boolean;
      handler?: string;
      enabled?: boolean;
      version?: string;
      author?: string;
      supportUrl?: string;
      documentationUrl?: string;
      webhookUrl?: string;
      requiresAuth?: boolean;
      authType?: string;
    }) => {
      const response = await apiClient.updateSystemIntegration(slug, updateData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update integration');
      }
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Integration "${data.name}" updated successfully`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['system-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['system-integration', variables.slug] });
      queryClient.invalidateQueries({ queryKey: ['integration-statistics'] });
    },
    onError: (error) => {
      toast.error(`Failed to update integration: ${error.message}`);
    },
  });
}

export function useDeleteSystemIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const response = await apiClient.deleteSystemIntegration(slug);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete integration');
      }
      return response.data;
    },
    onSuccess: (data, slug) => {
      toast.success('Integration deleted successfully');
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['system-integrations'] });
      queryClient.removeQueries({ queryKey: ['system-integration', slug] });
      queryClient.invalidateQueries({ queryKey: ['integration-statistics'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete integration: ${error.message}`);
    },
  });
}

// Tenant integrations
export function useTenantIntegrations(filters: TenantIntegrationFilters = {}) {
  return useQuery({
    queryKey: ['tenant-integrations', filters],
    queryFn: async () => {
      const response = await apiClient.getTenantIntegrations(filters);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch tenant integrations');
      }
      return response.data;
    },
    staleTime: 60000, // 1 minute
  });
}

export function useAvailableIntegrations() {
  return useQuery({
    queryKey: ['available-integrations'],
    queryFn: async () => {
      const response = await apiClient.getAvailableIntegrations();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch available integrations');
      }
      return response.data;
    },
    staleTime: 300000, // 5 minutes
  });
}

export function useEnableIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      integrationSlug: string;
      settings?: any;
      fieldMappings?: any;
      isTestMode?: boolean;
    }) => {
      const response = await apiClient.enableIntegration(data);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to enable integration');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Integration enabled successfully`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['tenant-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['available-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-integration-statistics'] });
    },
    onError: (error) => {
      toast.error(`Failed to enable integration: ${error.message}`);
    },
  });
}

export function useUpdateTenantIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      ...updateData
    }: {
      slug: string;
      status?: string;
      settings?: any;
      fieldMappings?: any;
      isTestMode?: boolean;
    }) => {
      const response = await apiClient.updateTenantIntegration(slug, updateData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update integration settings');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Integration settings updated successfully');
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['tenant-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-integration-statistics'] });
    },
    onError: (error) => {
      toast.error(`Failed to update integration settings: ${error.message}`);
    },
  });
}

export function useDisableIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      const response = await apiClient.disableIntegration(slug);
      if (!response.success) {
        throw new Error(response.error || 'Failed to disable integration');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Integration disabled successfully');
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['tenant-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['available-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-integration-statistics'] });
    },
    onError: (error) => {
      toast.error(`Failed to disable integration: ${error.message}`);
    },
  });
}

// Integration testing
export function useTestIntegration() {
  return useMutation({
    mutationFn: async (data: {
      slug: string;
      testPayload?: any;
      settings?: any;
    }) => {
      const response = await apiClient.testIntegration(data.slug, {
        testPayload: data.testPayload,
        settings: data.settings,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Integration test failed');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      if (data.testResult === 'success') {
        toast.success('Integration test completed successfully');
      } else {
        toast.warning('Integration test completed with warnings');
      }
    },
    onError: (error) => {
      toast.error(`Integration test failed: ${error.message}`);
    },
  });
}

export function useTriggerSync() {
  return useMutation({
    mutationFn: async (data: {
      slug: string;
      syncType?: 'full' | 'incremental' | 'test';
      options?: any;
    }) => {
      const response = await apiClient.triggerSync(data.slug, {
        syncType: data.syncType,
        options: data.options,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to trigger sync');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Sync started: ${data.syncId}`);
    },
    onError: (error) => {
      toast.error(`Failed to trigger sync: ${error.message}`);
    },
  });
}

// Statistics
export function useIntegrationStatistics() {
  return useQuery({
    queryKey: ['integration-statistics'],
    queryFn: async () => {
      const response = await apiClient.getIntegrationStatistics();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch integration statistics');
      }
      return response.data;
    },
    staleTime: 300000, // 5 minutes
  });
}

export function useTenantIntegrationStatistics() {
  return useQuery({
    queryKey: ['tenant-integration-statistics'],
    queryFn: async () => {
      const response = await apiClient.getTenantIntegrationStatistics();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch tenant integration statistics');
      }
      return response.data;
    },
    staleTime: 60000, // 1 minute
  });
}

// Utility functions
export const IntegrationUtils = {
  // Get status color
  getStatusColor: (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'inactive':
        return 'text-yellow-600 bg-yellow-100';
      case 'disabled':
        return 'text-red-600 bg-red-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  },

  // Get status icon
  getStatusIcon: (status: string) => {
    switch (status) {
      case 'active':
        return '✅';
      case 'inactive':
        return '⚠️';
      case 'disabled':
        return '🚫';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  },

  // Get category color
  getCategoryColor: (category: string) => {
    const colors = {
      communication: 'bg-blue-100 text-blue-800',
      payment: 'bg-green-100 text-green-800',
      automation: 'bg-purple-100 text-purple-800',
      analytics: 'bg-orange-100 text-orange-800',
      storage: 'bg-indigo-100 text-indigo-800',
      security: 'bg-red-100 text-red-800',
      productivity: 'bg-yellow-100 text-yellow-800',
      marketing: 'bg-pink-100 text-pink-800',
      development: 'bg-gray-100 text-gray-800',
    };
    
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  },

  // Format sync count
  formatSyncCount: (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  },

  // Calculate success rate
  calculateSuccessRate: (syncCount: number, errorCount: number) => {
    if (syncCount === 0) return 0;
    return ((syncCount - errorCount) / syncCount) * 100;
  },

  // Get integration health status
  getHealthStatus: (integration: TenantIntegration) => {
    const { syncCount, errorCount, lastErrorAt, status } = integration;
    
    if (status !== 'active') {
      return { status: 'inactive', message: 'Integration is not active' };
    }
    
    if (syncCount === 0) {
      return { status: 'unknown', message: 'No sync history available' };
    }
    
    const errorRate = (errorCount / syncCount) * 100;
    const recentError = lastErrorAt && new Date(lastErrorAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    if (errorRate > 50) {
      return { status: 'unhealthy', message: 'High error rate detected' };
    }
    
    if (recentError && errorRate > 10) {
      return { status: 'warning', message: 'Recent errors detected' };
    }
    
    return { status: 'healthy', message: 'Integration is working normally' };
  },

  // Validate integration settings
  validateSettings: (integration: Integration, settings: any) => {
    const errors: string[] = [];
    
    if (!integration.settingsSchema) {
      return errors;
    }
    
    // Basic validation based on schema (extend based on actual schema format)
    const schema = integration.settingsSchema;
    
    if (schema.required) {
      schema.required.forEach((field: string) => {
        if (!settings[field]) {
          errors.push(`${field} is required`);
        }
      });
    }
    
    return errors;
  },

  // Generate webhook URL
  generateWebhookUrl: (slug: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${baseUrl}/api/v1/webhooks/integration/${slug}`;
  },

  // Format last sync time
  formatLastSync: (lastSyncedAt?: string) => {
    if (!lastSyncedAt) return 'Never';
    
    const syncDate = new Date(lastSyncedAt);
    const now = new Date();
    const diffMs = now.getTime() - syncDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return syncDate.toLocaleDateString();
  },
};

// Pre-defined categories
export const IntegrationCategories = {
  communication: 'Communication',
  payment: 'Payment',
  automation: 'Automation',
  analytics: 'Analytics',
  storage: 'Storage',
  security: 'Security',
  productivity: 'Productivity',
  marketing: 'Marketing',
  development: 'Development',
};

// Common integration statuses
export const IntegrationStatuses = {
  active: 'Active',
  inactive: 'Inactive',
  disabled: 'Disabled',
  error: 'Error',
  pending: 'Pending',
};