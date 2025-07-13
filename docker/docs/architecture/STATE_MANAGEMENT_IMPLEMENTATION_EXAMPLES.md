# State Management Implementation Examples

## Practical Examples for itellico Mono State Management Strategy

This document provides **real-world implementation examples** for the comprehensive state management strategy, showing exactly how to implement each layer correctly.

## 🎯 **Zustand Implementation Examples**

### **Example 1: Admin UI Store (Correct Pattern)**
```typescript
// src/stores/admin-ui.store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AdminUIState {
  // Modal management
  modals: {
    deleteUser: {
      isOpen: boolean;
      userId?: string;
      userName?: string;
    };
    tenantForm: {
      isOpen: boolean;
      mode: 'create' | 'edit';
      tenantId?: string;
    };
  };
  
  // Filter states
  filters: {
    users: {
      search: string;
      role: string[];
      status: 'active' | 'inactive' | 'all';
      dateRange: { from?: Date; to?: Date };
    };
    tenants: {
      search: string;
      plan: string[];
      status: string[];
    };
  };
  
  // User preferences (persisted)
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    tablePageSize: number;
    sidebarCollapsed: boolean;
  };
  
  // Table states
  tableStates: {
    users: {
      sortBy: string;
      sortOrder: 'asc' | 'desc';
      selectedRows: string[];
    };
  };
}

interface AdminUIActions {
  // Modal actions
  openDeleteUserModal: (userId: string, userName: string) => void;
  closeDeleteUserModal: () => void;
  openTenantForm: (mode: 'create' | 'edit', tenantId?: string) => void;
  closeTenantForm: () => void;
  
  // Filter actions
  setUserFilters: (filters: Partial<AdminUIState['filters']['users']>) => void;
  resetUserFilters: () => void;
  setTenantFilters: (filters: Partial<AdminUIState['filters']['tenants']>) => void;
  
  // Preference actions
  setTheme: (theme: AdminUIState['preferences']['theme']) => void;
  setLanguage: (language: string) => void;
  toggleSidebar: () => void;
  
  // Table actions
  setTableSort: (table: keyof AdminUIState['tableStates'], sortBy: string, sortOrder: 'asc' | 'desc') => void;
  toggleRowSelection: (table: keyof AdminUIState['tableStates'], rowId: string) => void;
  clearRowSelection: (table: keyof AdminUIState['tableStates']) => void;
}

const defaultFilters = {
  users: {
    search: '',
    role: [],
    status: 'all' as const,
    dateRange: {}
  },
  tenants: {
    search: '',
    plan: [],
    status: []
  }
};

export const useAdminUIStore = create<AdminUIState & AdminUIActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        modals: {
          deleteUser: { isOpen: false },
          tenantForm: { isOpen: false, mode: 'create' }
        },
        filters: defaultFilters,
        preferences: {
          theme: 'system',
          language: 'en',
          tablePageSize: 50,
          sidebarCollapsed: false
        },
        tableStates: {
          users: {
            sortBy: 'createdAt',
            sortOrder: 'desc',
            selectedRows: []
          }
        },
        
        // Modal actions
        openDeleteUserModal: (userId, userName) => set((state) => {
          state.modals.deleteUser = { isOpen: true, userId, userName };
        }),
        
        closeDeleteUserModal: () => set((state) => {
          state.modals.deleteUser = { isOpen: false };
        }),
        
        openTenantForm: (mode, tenantId) => set((state) => {
          state.modals.tenantForm = { isOpen: true, mode, tenantId };
        }),
        
        closeTenantForm: () => set((state) => {
          state.modals.tenantForm = { isOpen: false, mode: 'create' };
        }),
        
        // Filter actions
        setUserFilters: (filters) => set((state) => {
          Object.assign(state.filters.users, filters);
        }),
        
        resetUserFilters: () => set((state) => {
          state.filters.users = { ...defaultFilters.users };
        }),
        
        setTenantFilters: (filters) => set((state) => {
          Object.assign(state.filters.tenants, filters);
        }),
        
        // Preference actions
        setTheme: (theme) => set((state) => {
          state.preferences.theme = theme;
        }),
        
        setLanguage: (language) => set((state) => {
          state.preferences.language = language;
        }),
        
        toggleSidebar: () => set((state) => {
          state.preferences.sidebarCollapsed = !state.preferences.sidebarCollapsed;
        }),
        
        // Table actions
        setTableSort: (table, sortBy, sortOrder) => set((state) => {
          state.tableStates[table].sortBy = sortBy;
          state.tableStates[table].sortOrder = sortOrder;
        }),
        
        toggleRowSelection: (table, rowId) => set((state) => {
          const selected = state.tableStates[table].selectedRows;
          const index = selected.indexOf(rowId);
          if (index === -1) {
            selected.push(rowId);
          } else {
            selected.splice(index, 1);
          }
        }),
        
        clearRowSelection: (table) => set((state) => {
          state.tableStates[table].selectedRows = [];
        })
      })),
      {
        name: 'admin-ui-store',
        // Only persist preferences and some UI state
        partialize: (state) => ({
          preferences: state.preferences,
          filters: state.filters, // Persist filter preferences
          tableStates: {
            users: {
              sortBy: state.tableStates.users.sortBy,
              sortOrder: state.tableStates.users.sortOrder
              // Don't persist selectedRows
            }
          }
        })
      }
    ),
    { name: 'AdminUI' }
  )
);

// Usage in components
export function UserManagement() {
  // Extract only what you need
  const { 
    filters, 
    modals, 
    setUserFilters, 
    openDeleteUserModal,
    closeDeleteUserModal 
  } = useAdminUIStore();
  
  // Server data comes from TanStack Query, never Zustand
  const { data: users, isLoading } = useUsers(filters.users);
  
  return (
    <div>
      {/* UI components use Zustand state */}
      <UserFilters 
        filters={filters.users}
        onFiltersChange={setUserFilters}
      />
      
      <UserTable 
        users={users} // From TanStack Query
        isLoading={isLoading}
        onDeleteUser={openDeleteUserModal}
      />
      
      <DeleteUserModal
        isOpen={modals.deleteUser.isOpen}
        userId={modals.deleteUser.userId}
        userName={modals.deleteUser.userName}
        onClose={closeDeleteUserModal}
      />
    </div>
  );
}
```

## 🔄 **TanStack Query Implementation Examples**

### **Example 2: User Management with Server State**
```typescript
// src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';

// Query key factories for consistency
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  permissions: (id: string) => [...userKeys.detail(id), 'permissions'] as const,
};

interface UserFilters {
  search: string;
  role: string[];
  status: 'active' | 'inactive' | 'all';
  dateRange: { from?: Date; to?: Date };
}

// Users list query
export function useUsers(filters: UserFilters) {
  const { currentTenant } = useAuth();
  
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.role.length) params.set('roles', filters.role.join(','));
      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.dateRange.from) params.set('from', filters.dateRange.from.toISOString());
      if (filters.dateRange.to) params.set('to', filters.dateRange.to.toISOString());
      
      const response = await fetch(`/api/v1/tenants/${currentTenant.id}/users?${params}`, {
        credentials: 'include' // Include httpOnly cookies
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: !!currentTenant?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    // Data automatically cached in memory, never localStorage
  });
}

// User permissions query (security-sensitive data)
export function useUserPermissions(userId: string) {
  const { currentTenant } = useAuth();
  
  return useQuery({
    queryKey: userKeys.permissions(userId),
    queryFn: async () => {
      const response = await fetch(`/api/v1/users/${userId}/permissions`, {
        credentials: 'include',
        headers: {
          'X-Tenant-ID': currentTenant.id
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch user permissions');
      return response.json();
    },
    enabled: !!userId && !!currentTenant?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes for security data
    gcTime: 10 * 60 * 1000,
    // NEVER persisted - memory only for security
  });
}

// User creation mutation with optimistic updates
export function useCreateUser() {
  const queryClient = useQueryClient();
  const { currentTenant } = useAuth();
  
  return useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const response = await fetch(`/api/v1/tenants/${currentTenant.id}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': currentTenant.id
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    
    // Optimistic updates
    onMutate: async (newUser) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });
      
      // Snapshot previous value
      const previousUsers = queryClient.getQueryData(userKeys.lists());
      
      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: userKeys.lists() },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: [...old.data, { ...newUser, id: 'temp-' + Date.now() }]
          };
        }
      );
      
      return { previousUsers };
    },
    
    // Rollback on error
    onError: (err, newUser, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(userKeys.lists(), context.previousUsers);
      }
    },
    
    // Refetch on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    }
  });
}
```

## 🔴 **Redis Implementation Examples**

### **Example 3: Session and Permission Caching**
```typescript
// src/services/cache.service.ts
import Redis from 'ioredis';

class CacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
  }
  
  // Session management
  async storeSession(sessionId: string, sessionData: SessionData): Promise<void> {
    const key = `session:${sessionId}`;
    const ttl = 24 * 60 * 60; // 24 hours
    
    await this.redis.setex(
      key, 
      ttl, 
      JSON.stringify({
        ...sessionData,
        lastAccess: new Date().toISOString()
      })
    );
  }
  
  async getSession(sessionId: string): Promise<SessionData | null> {
    const key = `session:${sessionId}`;
    const data = await this.redis.get(key);
    
    if (!data) return null;
    
    // Update last access time
    const sessionData = JSON.parse(data);
    await this.updateSessionAccess(sessionId);
    
    return sessionData;
  }
  
  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.redis.del(key);
  }
  
  private async updateSessionAccess(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    const ttl = await this.redis.ttl(key);
    
    if (ttl > 0) {
      await this.redis.expire(key, ttl); // Reset TTL
    }
  }
  
  // Permission caching with tenant isolation
  async cacheUserPermissions(
    userId: string, 
    tenantId: string, 
    permissions: string[]
  ): Promise<void> {
    const key = `tenant:${tenantId}:user:${userId}:permissions`;
    const ttl = 30 * 60; // 30 minutes
    
    await this.redis.setex(key, ttl, JSON.stringify(permissions));
  }
  
  async getUserPermissions(userId: string, tenantId: string): Promise<string[] | null> {
    const key = `tenant:${tenantId}:user:${userId}:permissions`;
    const data = await this.redis.get(key);
    
    return data ? JSON.parse(data) : null;
  }
  
  async invalidateUserPermissions(userId: string, tenantId?: string): Promise<void> {
    if (tenantId) {
      // Invalidate for specific tenant
      const key = `tenant:${tenantId}:user:${userId}:permissions`;
      await this.redis.del(key);
    } else {
      // Invalidate across all tenants
      const pattern = `tenant:*:user:${userId}:permissions`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }
  
  // Frequently accessed data caching
  async cacheData<T>(
    tenantId: string,
    entity: string,
    id: string,
    data: T,
    ttl: number = 600
  ): Promise<void> {
    const key = `cache:${tenantId}:${entity}:${id}`;
    await this.redis.setex(key, ttl, JSON.stringify(data));
  }
  
  async getCachedData<T>(
    tenantId: string,
    entity: string,
    id: string
  ): Promise<T | null> {
    const key = `cache:${tenantId}:${entity}:${id}`;
    const data = await this.redis.get(key);
    
    return data ? JSON.parse(data) : null;
  }
  
  async invalidateEntityCache(tenantId: string, entity: string, id?: string): Promise<void> {
    if (id) {
      const key = `cache:${tenantId}:${entity}:${id}`;
      await this.redis.del(key);
    } else {
      const pattern = `cache:${tenantId}:${entity}:*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }
  
  // Rate limiting
  async checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowSize: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const window = Math.floor(now / windowSize);
    
    const multi = this.redis.multi();
    multi.zremrangebyscore(key, '-inf', now - windowSize);
    multi.zcard(key);
    multi.zadd(key, now, `${now}-${Math.random()}`);
    multi.expire(key, Math.ceil(windowSize / 1000));
    
    const results = await multi.exec();
    const current = results?.[1]?.[1] as number || 0;
    
    return {
      allowed: current < maxRequests,
      remaining: Math.max(0, maxRequests - current - 1),
      resetTime: (window + 1) * windowSize
    };
  }
}

export const cacheService = new CacheService();
```

## 🔐 **Authentication Implementation Example**

### **Example 4: Secure Authentication Flow**
```typescript
// src/contexts/auth-context.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface AuthState {
  // Access token in memory only (most secure)
  accessToken: string | null;
  // User data from server (cached via TanStack Query)
  user: User | null;
  // Loading states
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthState & AuthActions | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Access token in memory only - lost on refresh (secure)
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Session data via TanStack Query (uses httpOnly cookie automatically)
  const {
    data: sessionData,
    isLoading,
    error,
    refetch: refetchSession
  } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      // This request uses httpOnly cookies automatically
      const response = await fetch('/api/v1/auth/session', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Clear any stale access token
          setAccessToken(null);
          return null;
        }
        throw new Error('Session check failed');
      }
      
      const data = await response.json();
      
      // Store access token in memory
      if (data.accessToken) {
        setAccessToken(data.accessToken);
      }
      
      return data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    // NEVER persisted to localStorage
  });
  
  // Set up axios interceptor for automatic token refresh
  useEffect(() => {
    if (!accessToken) return;
    
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && accessToken) {
          // Try to refresh token
          try {
            await refreshToken();
            // Retry original request
            return axios.request(error.config);
          } catch (refreshError) {
            // Refresh failed, logout user
            await logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
    
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken]);
  
  const login = async (credentials: LoginCredentials) => {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // This sets httpOnly refresh token cookie
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    
    // Store access token in memory
    setAccessToken(data.accessToken);
    
    // Refetch session to get user data
    await refetchSession();
  };
  
  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include' // This clears httpOnly refresh token cookie
      });
    } finally {
      // Clear client state regardless of server response
      setAccessToken(null);
      queryClient.clear(); // Clear all cached data
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    }
  };
  
  const refreshToken = async () => {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include' // Uses httpOnly refresh token cookie
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const data = await response.json();
    setAccessToken(data.accessToken);
    
    return data.accessToken;
  };
  
  const value = {
    accessToken,
    user: sessionData?.user || null,
    isLoading,
    isAuthenticated: !!sessionData?.user && !!accessToken,
    login,
    logout,
    refreshToken
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  return { isAuthenticated, isLoading };
}
```

## 📊 **Complete Integration Example**

### **Example 5: User Management Page (All Layers)**
```typescript
// src/app/admin/users/page.tsx
'use client';

import React from 'react';
import { useUsers, useCreateUser, useDeleteUser } from '@/hooks/useUsers';
import { useAdminUIStore } from '@/stores/admin-ui.store';
import { useAuth } from '@/contexts/auth-context';

export default function UsersPage() {
  // Layer 1: UI State (Zustand)
  const {
    filters,
    modals,
    tableStates,
    preferences,
    setUserFilters,
    openDeleteUserModal,
    closeDeleteUserModal,
    openTenantForm,
    setTableSort,
    toggleRowSelection,
    clearRowSelection
  } = useAdminUIStore();
  
  // Layer 2: Server State (TanStack Query)
  const { data: users, isLoading, error } = useUsers(filters.users);
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();
  
  // Authentication context
  const { user: currentUser, isAuthenticated } = useAuth();
  
  // Event handlers
  const handleFilterChange = (newFilters: Partial<typeof filters.users>) => {
    setUserFilters(newFilters);
    clearRowSelection('users'); // Clear selection when filters change
  };
  
  const handleSort = (sortBy: string) => {
    const currentSort = tableStates.users;
    const newOrder = currentSort.sortBy === sortBy && currentSort.sortOrder === 'asc' 
      ? 'desc' : 'asc';
    setTableSort('users', sortBy, newOrder);
  };
  
  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      closeDeleteUserModal();
      // TanStack Query automatically invalidates and refetches
    } catch (error) {
      console.error('Failed to delete user:', error);
      // Error handling in UI
    }
  };
  
  const handleCreateUser = async (userData: CreateUserData) => {
    try {
      await createUserMutation.mutateAsync(userData);
      // Optimistic updates handled by TanStack Query
      // Modal state managed by Zustand
      openTenantForm('create');
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };
  
  if (!isAuthenticated) {
    return <div>Please log in to access this page.</div>;
  }
  
  return (
    <div className="space-y-6">
      {/* Filter Controls - State in Zustand */}
      <UserFilters
        filters={filters.users}
        onFiltersChange={handleFilterChange}
        onReset={() => setUserFilters(defaultUserFilters)}
      />
      
      {/* User Table - Data from TanStack Query, UI state from Zustand */}
      <UserTable
        users={users?.data || []}
        isLoading={isLoading}
        error={error}
        sortBy={tableStates.users.sortBy}
        sortOrder={tableStates.users.sortOrder}
        selectedRows={tableStates.users.selectedRows}
        pageSize={preferences.tablePageSize}
        onSort={handleSort}
        onRowSelect={toggleRowSelection}
        onDeleteUser={openDeleteUserModal}
        onEditUser={(userId) => openTenantForm('edit', userId)}
      />
      
      {/* Modals - State in Zustand */}
      <DeleteUserModal
        isOpen={modals.deleteUser.isOpen}
        userId={modals.deleteUser.userId}
        userName={modals.deleteUser.userName}
        isDeleting={deleteUserMutation.isPending}
        onConfirm={() => handleDeleteUser(modals.deleteUser.userId!)}
        onCancel={closeDeleteUserModal}
      />
      
      <UserFormModal
        isOpen={modals.tenantForm.isOpen}
        mode={modals.tenantForm.mode}
        userId={modals.tenantForm.tenantId}
        isCreating={createUserMutation.isPending}
        onSubmit={handleCreateUser}
        onCancel={() => closeTenantForm()}
      />
    </div>
  );
}
```

## ⚡ **Performance Monitoring Example**

### **Example 6: Cache Performance Monitoring**
```typescript
// src/utils/performance-monitor.ts
class PerformanceMonitor {
  private metrics: Map<string, any[]> = new Map();
  
  // Monitor Zustand store performance
  monitorZustandStore(storeName: string) {
    return (config: any) => (set: any, get: any, api: any) => {
      const originalSet = set;
      
      api.setState = (...args: any[]) => {
        const start = performance.now();
        const result = originalSet(...args);
        const duration = performance.now() - start;
        
        this.recordMetric(`zustand.${storeName}.setState`, {
          duration,
          timestamp: Date.now()
        });
        
        return result;
      };
      
      return config(api.setState, get, api);
    };
  }
  
  // Monitor TanStack Query performance
  monitorTanStackQuery() {
    return {
      onSuccess: (data: any, variables: any, context: any, query: any) => {
        this.recordMetric('tanstack.query.success', {
          queryKey: query.queryKey,
          duration: query.state.dataUpdateCount,
          cacheHit: query.state.dataUpdateCount === 0,
          timestamp: Date.now()
        });
      },
      
      onError: (error: any, variables: any, context: any, query: any) => {
        this.recordMetric('tanstack.query.error', {
          queryKey: query.queryKey,
          error: error.message,
          timestamp: Date.now()
        });
      }
    };
  }
  
  // Monitor Redis cache performance
  async monitorRedisOperation<T>(
    operation: string,
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.recordMetric('redis.operation.success', {
        operation,
        key,
        duration,
        hit: result !== null,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.recordMetric('redis.operation.error', {
        operation,
        key,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
      
      throw error;
    }
  }
  
  private recordMetric(type: string, data: any) {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }
    
    const metrics = this.metrics.get(type)!;
    metrics.push(data);
    
    // Keep only last 100 metrics per type
    if (metrics.length > 100) {
      metrics.shift();
    }
  }
  
  getMetrics(type?: string) {
    if (type) {
      return this.metrics.get(type) || [];
    }
    
    return Object.fromEntries(this.metrics.entries());
  }
  
  getCacheHitRates() {
    const tanstackMetrics = this.metrics.get('tanstack.query.success') || [];
    const redisMetrics = this.metrics.get('redis.operation.success') || [];
    
    const tanstackHitRate = tanstackMetrics.length > 0
      ? tanstackMetrics.filter((m: any) => m.cacheHit).length / tanstackMetrics.length
      : 0;
      
    const redisHitRate = redisMetrics.length > 0
      ? redisMetrics.filter((m: any) => m.hit).length / redisMetrics.length
      : 0;
    
    return {
      tanstack: tanstackHitRate,
      redis: redisHitRate,
      overall: (tanstackHitRate + redisHitRate) / 2
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

These examples demonstrate the complete implementation of the itellico Mono state management strategy, showing exactly how to use each layer correctly while maintaining security, performance, and developer experience.