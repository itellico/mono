'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/lib/browser-logger';

// ============================================================================
// TYPES
// ============================================================================

export interface PlatformUser {
  id: string;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  userType: 'model' | 'client' | 'agency' | 'photographer' | 'individual';
  tenantId: number;
  tenant: {
    id: number;
    name: string;
    domain: string;
  } | null;
  lastLoginAt: string | null;
  createdAt: string;
  stats: {
    sessionCount: number;
    lastActivityAt: string | null;
  };
}

export interface PlatformUserFilters {
  page: number;
  limit: number;
  search: string;
  userTypes: string[];
  statuses: string[];
  tenantIds: string[];
}

export interface PlatformUsersResponse {
  users: PlatformUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasMore: boolean;
  };
  stats: {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    totalTenants: number;
    newUsersThisMonth: number;
  };
  tenantSummaries: Record<string, {
    id: number;
    name: string;
    domain: string;
    userCount: number;
    lastActivity: string | null;
  }>;
}

export interface BulkUserAction {
  userIds: string[];
  action: 'activate' | 'deactivate';
  data?: Record<string, any>;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchPlatformUsers(filters: PlatformUserFilters): Promise<PlatformUsersResponse> {
  const params = new URLSearchParams({
    page: filters.page.toString(),
    limit: filters.limit.toString(),
    search: filters.search,
    userTypes: filters.userTypes.join(','),
    statuses: filters.statuses.join(','),
    tenantIds: filters.tenantIds.join(',')
  });

  const response = await fetch(`/api/v1/admin/platform-users?${params}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch platform users');
  }

  return response.json();
}

async function bulkUpdatePlatformUsers(action: BulkUserAction): Promise<{
  success: boolean;
  message: string;
  affectedCount: number;
}> {
  const response = await fetch('/api/v1/admin/platform-users', {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(action),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update platform users');
  }

  return response.json();
}

async function deletePlatformUser(userId: string): Promise<void> {
  const response = await fetch(`/api/v1/admin/users/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete user');
  }
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const platformUsersKeys = {
  all: ['platform-users'] as const,
  lists: () => [...platformUsersKeys.all, 'list'] as const,
  list: (filters: PlatformUserFilters) => [...platformUsersKeys.lists(), filters] as const,
  details: () => [...platformUsersKeys.all, 'detail'] as const,
  detail: (id: string) => [...platformUsersKeys.details(), id] as const,
} as const;

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Fetch platform users with filters
 * ✅ mono BEST PRACTICES: TanStack Query with Redis caching coordination
 */
export function usePlatformUsersList(filters: PlatformUserFilters) {
  return useQuery({
    queryKey: platformUsersKeys.list(filters),
    queryFn: () => fetchPlatformUsers(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes for platform-wide data
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: true,
  });
}

/**
 * Bulk update platform users (activate/deactivate)
 * ✅ mono BEST PRACTICES: Optimistic updates with cache coordination
 */
export function useBulkUpdatePlatformUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkUpdatePlatformUsers,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: platformUsersKeys.lists() });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: platformUsersKeys.lists() });

      // Optimistically update users
      queryClient.setQueriesData(
        { queryKey: platformUsersKeys.lists() },
        (old: PlatformUsersResponse | undefined) => {
          if (!old) return old;

          const updatedUsers = old.users.map(user => {
            if (variables.userIds.includes(user.id)) {
              switch (variables.action) {
                case 'activate':
                  return { ...user, isActive: true };
                case 'deactivate':
                  return { ...user, isActive: false };
                default:
                  return user;
              }
            }
            return user;
          });

          return {
            ...old,
            users: updatedUsers,
            stats: {
              ...old.stats,
              activeUsers: updatedUsers.filter(u => u.isActive).length
            }
          };
        }
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      const message = err instanceof Error ? err.message : 'Failed to update users';
      toast.error(message);
      logger.error('Failed to bulk update platform users', { 
        error: message,
        userIds: variables.userIds,
        action: variables.action
      });
    },
    onSuccess: (data, variables) => {
      toast.success(`Successfully ${variables.action}d ${data.affectedCount} users`);
      logger.info('Platform users bulk updated successfully', {
        affectedCount: data.affectedCount,
        action: variables.action
      });
    },
    onSettled: () => {
      // Always refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: platformUsersKeys.lists() });
    },
  });
}

/**
 * Delete platform user
 * ✅ mono BEST PRACTICES: Optimistic deletion with rollback
 */
export function useDeletePlatformUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePlatformUser,
    onMutate: async (userId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: platformUsersKeys.lists() });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: platformUsersKeys.lists() });

      // Optimistically remove user
      queryClient.setQueriesData(
        { queryKey: platformUsersKeys.lists() },
        (old: PlatformUsersResponse | undefined) => {
          if (!old) return old;

          const filteredUsers = old.users.filter(user => user.id !== userId);
          
          return {
            ...old,
            users: filteredUsers,
            pagination: {
              ...old.pagination,
              total: Math.max(0, old.pagination.total - 1)
            },
            stats: {
              ...old.stats,
              totalUsers: Math.max(0, old.stats.totalUsers - 1)
            }
          };
        }
      );

      return { previousData };
    },
    onError: (err, userId, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      const message = err instanceof Error ? err.message : 'Failed to delete user';
      toast.error(message);
      logger.error('Failed to delete platform user', { error: message, userId });
    },
    onSuccess: (_, userId) => {
      toast.success('User deleted successfully');
      logger.info('Platform user deleted successfully', { userId });
    },
    onSettled: () => {
      // Always refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: platformUsersKeys.lists() });
    },
  });
}

/**
 * Invalidate platform users cache
 * Useful for external cache coordination
 */
export function useInvalidatePlatformUsers() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: platformUsersKeys.all });
  };
}