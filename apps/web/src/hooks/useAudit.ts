'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// Fetch audit logs with advanced filtering
export function useAuditLogs(params?: {
  page?: number;
  limit?: number;
  userId?: number;
  tenantId?: number;
  action?: string;
  resource?: string;
  resourceId?: string;
  level?: 'info' | 'warning' | 'error' | 'critical';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  includeMetadata?: boolean;
}) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const response = await apiClient.getAuditLogs(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch audit logs');
      }
      return response.data;
    },
  });
}

// Fetch single audit log entry
export function useAuditLog(id: number) {
  return useQuery({
    queryKey: ['audit-log', id],
    queryFn: async () => {
      const response = await apiClient.getAuditLog(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch audit log');
      }
      return response.data;
    },
    enabled: !!id,
  });
}

// Create audit log entry
export function useCreateAuditLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      action: string;
      resource: string;
      resourceId?: string;
      level?: 'info' | 'warning' | 'error' | 'critical';
      message: string;
      metadata?: any;
      targetUserId?: number;
      targetTenantId?: number;
    }) => {
      const response = await apiClient.createAuditLog(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create audit log');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      toast.success('Audit log created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create audit log');
    },
  });
}

// Get audit statistics for dashboard
export function useAuditStats(params?: {
  days?: number;
  tenantId?: number;
}) {
  return useQuery({
    queryKey: ['audit-stats', params],
    queryFn: async () => {
      const response = await apiClient.getAuditStats(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch audit statistics');
      }
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Export audit logs
export function useExportAuditLogs() {
  return useMutation({
    mutationFn: async (params?: {
      format?: 'csv' | 'json';
      dateFrom?: string;
      dateTo?: string;
      userId?: number;
      tenantId?: number;
      action?: string;
      level?: string;
      limit?: number;
    }) => {
      const response = await apiClient.exportAuditLogs(params);
      return response;
    },
    onSuccess: () => {
      toast.success('Audit logs exported successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export audit logs');
    },
  });
}

// Cleanup old audit logs
export function useCleanupAuditLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      retentionDays: number;
      dryRun?: boolean;
      tenantId?: number;
    }) => {
      const response = await apiClient.cleanupAuditLogs(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to cleanup audit logs');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['audit-stats'] });
      
      if (variables.dryRun) {
        toast.info(`Dry run: Would delete ${data.deletedCount} audit logs`);
      } else {
        toast.success(`Deleted ${data.deletedCount} old audit logs`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cleanup audit logs');
    },
  });
}

// Hook for real-time audit log filters
export function useAuditLogFilters() {
  return {
    levels: [
      { value: 'info', label: 'Info', color: 'blue' },
      { value: 'warning', label: 'Warning', color: 'yellow' },
      { value: 'error', label: 'Error', color: 'red' },
      { value: 'critical', label: 'Critical', color: 'purple' },
    ],
    actions: [
      'user_login',
      'user_logout',
      'permission_check',
      'data_access',
      'data_modification',
      'admin_action',
      'system_event',
    ],
    resources: [
      'user',
      'tenant',
      'permission',
      'category',
      'tag',
      'form',
      'workflow',
      'subscription',
      'audit_log',
    ],
  };
}

// Hook for audit log statistics aggregation
export function useAuditLogSummary(logs: any[]) {
  const summary = {
    totalLogs: logs.length,
    levelBreakdown: logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    actionBreakdown: logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    uniqueUsers: new Set(logs.map(log => log.userId).filter(Boolean)).size,
    recentActivity: logs.slice(0, 10),
  };

  return summary;
}