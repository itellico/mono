'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// Get user permissions
export function useUserPermissions(userId?: string) {
  return useQuery({
    queryKey: ['permissions', userId || 'current'],
    queryFn: async () => {
      const response = await apiClient.getUserPermissions(userId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user permissions');
      }
      return response.data;
    },
  });
}

// Check specific permission
export function useCheckPermission() {
  return useMutation({
    mutationFn: async ({ permission, userId }: { permission: string; userId?: string }) => {
      const response = await apiClient.checkPermission(permission, userId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to check permission');
      }
      return response.data;
    },
  });
}

// Check multiple permissions at once
export function useCheckBulkPermissions() {
  return useMutation({
    mutationFn: async ({ permissions, userId }: { permissions: string[]; userId?: string }) => {
      const response = await apiClient.checkBulkPermissions(permissions, userId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to check permissions');
      }
      return response.data;
    },
  });
}

// Get all available permissions (admin only)
export function useAllPermissions() {
  return useQuery({
    queryKey: ['permissions', 'all'],
    queryFn: async () => {
      const response = await apiClient.getAllPermissions();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch all permissions');
      }
      return response.data;
    },
  });
}

// Get all available roles (admin only)
export function useAllRoles() {
  return useQuery({
    queryKey: ['roles', 'all'],
    queryFn: async () => {
      const response = await apiClient.getAllRoles();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch all roles');
      }
      return response.data;
    },
  });
}

// Simple permission check hook that returns a boolean
export function useHasPermission(permission: string, userId?: string) {
  return useQuery({
    queryKey: ['permission-check', permission, userId || 'current'],
    queryFn: async () => {
      const response = await apiClient.checkPermission(permission, userId);
      return response.success ? response.data.hasPermission : false;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for checking multiple permissions and returning a map
export function useHasPermissions(permissions: string[], userId?: string) {
  return useQuery({
    queryKey: ['permissions-check', permissions, userId || 'current'],
    queryFn: async () => {
      if (permissions.length === 0) return {};
      
      const response = await apiClient.checkBulkPermissions(permissions, userId);
      if (!response.success) return {};
      
      const permissionMap: Record<string, boolean> = {};
      response.data.results.forEach(result => {
        permissionMap[result.permission] = result.hasPermission;
      });
      return permissionMap;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: permissions.length > 0,
  });
}