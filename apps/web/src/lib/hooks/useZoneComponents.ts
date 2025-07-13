/**
 * Zone Components TanStack Query Hooks
 * 
 * Client-side data fetching for zone components with proper cache management
 * following itellico Mono patterns and requirements.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { browserLogger } from '@/lib/browser-logger';
import type { 
  ZoneComponent, 
  ZoneComponentFilters,
  ComponentRegistrationRequest 
} from '@/lib/zone-component-registry';

/**
 * Query key factory for zone components
 * Following itellico Mono pattern: ['entity', 'operation', ...filters]
 */
export const zoneComponentKeys = {
  all: ['zone-components'] as const,
  lists: () => [...zoneComponentKeys.all, 'list'] as const,
  list: (filters: ZoneComponentFilters) => [...zoneComponentKeys.lists(), filters] as const,
  details: () => [...zoneComponentKeys.all, 'detail'] as const,
  detail: (id: string) => [...zoneComponentKeys.details(), id] as const,
};

/**
 * Fetch zone components with filtering
 */
export function useZoneComponents(filters: ZoneComponentFilters = {}) {
  return useQuery({
    queryKey: zoneComponentKeys.list(filters),
    queryFn: async (): Promise<ZoneComponent[]> => {
      browserLogger.apiRequest('/api/v1/zone-components', 'GET', filters);
      
      const searchParams = new URLSearchParams();
      
      // Build query parameters
      if (filters.category) searchParams.set('category', filters.category);
      if (filters.componentType) searchParams.set('componentType', filters.componentType);
      if (filters.status) searchParams.set('status', filters.status);
      if (filters.search) searchParams.set('search', filters.search);
      if (filters.limit) searchParams.set('limit', filters.limit.toString());
      if (filters.offset) searchParams.set('offset', filters.offset.toString());

      const url = `/api/v1/zone-components${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        browserLogger.error('Failed to fetch zone components', {
          status: response.status,
          error: errorData,
          filters
        });
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch zone components`);
      }

      const data = await response.json();
      
      browserLogger.apiResponse('/api/v1/zone-components', 'GET', response.status, {
        componentCount: data.success ? data.data.length : 0,
        filters
      });

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch zone components');
      }

      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - itellico Mono standard
    gcTime: 10 * 60 * 1000, // 10 minutes - itellico Mono standard
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Fetch a single zone component by ID
 */
export function useZoneComponent(componentId: string) {
  return useQuery({
    queryKey: zoneComponentKeys.detail(componentId),
    queryFn: async (): Promise<ZoneComponent> => {
      browserLogger.apiRequest(`/api/v1/zone-components/${componentId}`, 'GET');
      
      const response = await fetch(`/api/v1/zone-components/${componentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        browserLogger.error('Failed to fetch zone component', {
          componentId,
          status: response.status,
          error: errorData
        });
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch component`);
      }

      const data = await response.json();
      
      browserLogger.apiResponse(`/api/v1/zone-components/${componentId}`, 'GET', response.status, {
        componentId: data.success ? data.data.id : null
      });

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch zone component');
      }

      return data.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!componentId, // Only fetch if componentId is provided
  });
}

/**
 * Register a new zone component
 */
export function useRegisterZoneComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registration: ComponentRegistrationRequest): Promise<ZoneComponent> => {
      browserLogger.apiRequest('/api/v1/zone-components', 'POST', registration);
      
      const response = await fetch('/api/v1/zone-components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(registration),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        browserLogger.error('Failed to register zone component', {
          status: response.status,
          error: errorData,
          registration
        });
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to register component`);
      }

      const data = await response.json();
      
      browserLogger.apiResponse('/api/v1/zone-components', 'POST', response.status, {
        componentId: data.success ? data.data.id : null,
        name: registration.name
      });

      if (!data.success) {
        throw new Error(data.error || 'Failed to register zone component');
      }

      return data.data;
    },
    onSuccess: (newComponent) => {
      // Invalidate all list queries to refetch with new component
      queryClient.invalidateQueries({
        queryKey: zoneComponentKeys.lists(),
      });

      browserLogger.userAction('component_registered', {
        componentId: newComponent.id,
        name: newComponent.name,
        componentType: newComponent.componentType
      });
    },
    onError: (error, variables) => {
      browserLogger.error('Component registration failed', {
        error: error.message,
        registration: variables
      });
    },
  });
}

/**
 * Prefetch zone components for instant navigation
 */
export function usePrefetchZoneComponents() {
  const queryClient = useQueryClient();

  return {
    prefetchComponents: (filters: ZoneComponentFilters = {}) => {
      queryClient.prefetchQuery({
        queryKey: zoneComponentKeys.list(filters),
        queryFn: async () => {
          const searchParams = new URLSearchParams();
          
          if (filters.category) searchParams.set('category', filters.category);
          if (filters.componentType) searchParams.set('componentType', filters.componentType);
          if (filters.status) searchParams.set('status', filters.status);
          if (filters.search) searchParams.set('search', filters.search);
          if (filters.limit) searchParams.set('limit', filters.limit.toString());
          if (filters.offset) searchParams.set('offset', filters.offset.toString());

          const url = `/api/v1/zone-components${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
          
          const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          if (!response.ok) throw new Error('Failed to prefetch components');
          
          const data = await response.json();
          return data.success ? data.data : [];
        },
        staleTime: 5 * 60 * 1000,
      });
    },
    
    prefetchComponent: (componentId: string) => {
      queryClient.prefetchQuery({
        queryKey: zoneComponentKeys.detail(componentId),
        queryFn: async () => {
          const response = await fetch(`/api/v1/zone-components/${componentId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          if (!response.ok) throw new Error('Failed to prefetch component');
          
          const data = await response.json();
          return data.success ? data.data : null;
        },
        staleTime: 5 * 60 * 1000,
      });
    },
  };
}

/**
 * Invalidate zone component caches
 * Used for coordinating three-layer cache invalidation
 */
export function useZoneComponentCache() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({
        queryKey: zoneComponentKeys.all,
      });
    },
    
    invalidateLists: () => {
      queryClient.invalidateQueries({
        queryKey: zoneComponentKeys.lists(),
      });
    },
    
    invalidateComponent: (componentId: string) => {
      queryClient.invalidateQueries({
        queryKey: zoneComponentKeys.detail(componentId),
      });
    },
    
    updateComponent: (componentId: string, updateFn: (old: ZoneComponent) => ZoneComponent) => {
      queryClient.setQueryData(
        zoneComponentKeys.detail(componentId),
        updateFn
      );
    },
  };
} 