import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { browserLogger } from '@/lib/browser-logger';
import { apiClient } from '@/lib/api-client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface UpdateUserParams {
  uuid: string;
  data: Record<string, unknown>;
}

interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
}

interface UserData {
  id: string;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  userType: string;
  createdAt: string;
  lastLoginAt: string | null;
}

interface UsersResponse {
  users: UserData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchUsers(params: UserListParams): Promise<UsersResponse> {
  const response = await apiClient.getUsers(params);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch users');
  }
  return response.data;
}

async function fetchUser(uuid: string): Promise<UserData> {
  const response = await apiClient.getUser(uuid);
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch user');
  }
  return response.data;
}

async function updateUser({ uuid, data }: UpdateUserParams): Promise<UserData> {
  const response = await apiClient.updateUser(uuid, data);
  if (!response.success) {
    throw new Error(response.error || 'Failed to update user');
  }
  return response.data;
}

async function deleteUser(uuid: string): Promise<void> {
  const response = await apiClient.deleteUser(uuid);
  if (!response.success) {
    throw new Error(response.error || 'Failed to delete user');
  }
}

// ============================================================================
// TANSTACK QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch paginated list of users with filtering
 */
export function useAdminUsersList(params: UserListParams) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => fetchUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch individual user by UUID
 */
export function useUser(uuid: string) {
  return useQuery({
    queryKey: ['admin-users', 'detail', uuid],
    queryFn: () => fetchUser(uuid),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!uuid,
    retry: 2,
  });
}

/**
 * Hook to update user with comprehensive cache invalidation
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onMutate: async ({ uuid, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-users'] });

      // Snapshot previous value
      const previousUsersData = queryClient.getQueryData(['admin-users']);
      const previousUserData = queryClient.getQueryData(['admin-users', 'detail', uuid]);

      // Optimistically update user lists
      queryClient.setQueriesData(
        { queryKey: ['admin-users'], exact: false },
        (oldData: UsersResponse | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            users: oldData.users.map(user => 
              user.uuid === uuid ? { ...user, ...data } : user
            )
          };
        }
      );

      // Optimistically update individual user
      if (previousUserData) {
        queryClient.setQueryData(['admin-users', 'detail', uuid], {
          ...previousUserData,
          ...data
        });
      }

      return { previousUsersData, previousUserData };
    },
    onSuccess: async (updatedUser, { uuid }) => {
      browserLogger.info('User updated successfully', { uuid });
      
      // ✅ Use only TanStack Query cache management - no server-side cache
      queryClient.invalidateQueries({ queryKey: ['admin-users'], exact: false });
      queryClient.refetchQueries({ queryKey: ['admin-users'], exact: false });
      
      toast.success('User updated successfully!');
    },
    onError: (error, { uuid }, context) => {
      browserLogger.error('Failed to update user', { uuid, error: error.message });
      
      // Rollback optimistic updates
      if (context?.previousUsersData) {
        queryClient.setQueryData(['admin-users'], context.previousUsersData);
      }
      if (context?.previousUserData) {
        queryClient.setQueryData(['admin-users', 'detail', uuid], context.previousUserData);
      }
      
      toast.error(`Failed to update user: ${error.message}`);
    },
  });
}

/**
 * Hook to delete user with comprehensive cache invalidation
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onMutate: async (uuid) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin-users'] });

      // Snapshot previous value
      const previousUsersData = queryClient.getQueryData(['admin-users']) as UsersResponse | undefined;

      // Optimistically remove user from lists
      queryClient.setQueriesData(
        { queryKey: ['admin-users'], exact: false },
        (oldData: UsersResponse | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            users: oldData.users.filter(user => user.uuid !== uuid),
            pagination: {
              ...oldData.pagination,
              total: oldData.pagination.total - 1
            }
          };
        }
      );

      // Remove individual user data
      queryClient.removeQueries({ queryKey: ['admin-users', 'detail', uuid] });

      return { previousUsersData };
    },
    onSuccess: async (_, uuid) => {
      browserLogger.info('User deleted successfully', { uuid });
      
      // ✅ Use only TanStack Query cache management - no server-side cache
      queryClient.invalidateQueries({ queryKey: ['admin-users'], exact: false });
      queryClient.refetchQueries({ queryKey: ['admin-users'], exact: false });
      
      toast.success('User deleted successfully!');
    },
    onError: (error, uuid, context) => {
      browserLogger.error('Failed to delete user', { uuid, error: error.message });
      
      // Rollback optimistic updates
      if (context?.previousUsersData) {
        queryClient.setQueryData(['admin-users'], context.previousUsersData);
      }
      
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });
} 