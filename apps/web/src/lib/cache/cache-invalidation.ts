import { QueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { browserLogger } from '@/lib/browser-logger';


/**
 * Three-Layer Cache Invalidation System
 * 
 * ✅ mono BEST PRACTICES:
 * - Layer 1: Next.js unstable_cache (React Server Components)
 * - Layer 2: Redis cache invalidation 
 * - Layer 3: TanStack Query (client-side state management)
 * - Coordination: ALL layers must invalidate together on mutations
 */

export interface CacheInvalidationOptions {
  tenantId?: string | null;
  entityType: 'users' | 'tenants' | 'profiles' | 'settings' | 'translations' | 'option_sets';
  entityId?: string;
  operation: 'create' | 'update' | 'delete' | 'bulk_update' | 'bulk_delete';
  affectedRoutes?: string[];
  queryClient?: QueryClient;
  context?: 'server' | 'client';
}

/**
 * Invalidate all three cache layers for entity mutations
 * This ensures immediate UI updates and proper cache coordination
 */
export async function invalidateEntityCache(options: CacheInvalidationOptions): Promise<void> {
  const { tenantId, entityType, entityId, operation, affectedRoutes = [], queryClient, context = 'server' } = options;
  
  const isServerContext = context === 'server' || typeof window === 'undefined';
  const logFn = isServerContext ? logger : browserLogger;
  
  try {
    logFn.info('🗑️ Starting cache invalidation', {
      tenantId,
      entityType,
      entityId,
      operation,
      context: isServerContext ? 'server' : 'client',
      affectedRoutes: affectedRoutes.length
    });

    // === LAYER 1: Next.js unstable_cache (Server-side only) ===
    if (isServerContext) {
      await invalidateNextCache(entityType, affectedRoutes, logFn);
    }

    // === LAYER 2: Redis Cache Invalidation (Server-side only) ===
    if (isServerContext) {
      await invalidateRedisCache(tenantId, entityType, entityId, operation, logFn);
    }

    // === LAYER 3: TanStack Query Cache Invalidation (Client-side only) ===
    if (!isServerContext && queryClient) {
      await invalidateTanStackCache(queryClient, tenantId, entityType, entityId, operation, logFn);
    } else if (!isServerContext && !queryClient) {
      logFn.warn('QueryClient not provided for client-side cache invalidation');
    }

    logFn.info('✅ Cache invalidation completed successfully', {
      tenantId,
      entityType,
      entityId,
      operation,
      context: isServerContext ? 'server' : 'client'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logFn.error('❌ Cache invalidation failed', {
      error: errorMessage,
      tenantId,
      entityType,
      entityId,
      operation,
      context: isServerContext ? 'server' : 'client'
    });
    
    // Don't throw - cache invalidation failures shouldn't break the main operation
    // but we do want to log them for monitoring
  }
}

/**
 * Layer 1: Next.js unstable_cache invalidation
 * Revalidates server-side cached data and routes
 */
async function invalidateNextCache(
  entityType: string,
  affectedRoutes: string[],
  logFn: typeof logger | typeof browserLogger
): Promise<void> {
  try {
    const { revalidateTag, revalidatePath } = await import('next/cache');
    // Revalidate entity-specific tags
    const tags = [
      `${entityType}`,
      `admin-${entityType}`,
      `${entityType}-list`,
      `${entityType}-search`
    ];

    for (const tag of tags) {
      revalidateTag(tag);
    }

    // Revalidate specific routes
    const defaultRoutes = [
      `/admin/${entityType}`,
      `/api/v1/admin/${entityType}`
    ];
    
    const allRoutes = [...defaultRoutes, ...affectedRoutes];
    
    for (const route of allRoutes) {
      revalidatePath(route);
    }

    logFn.info('✅ Layer 1 (Next.js cache) invalidated', {
      tags: tags.length,
      routes: allRoutes.length
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logFn.error('❌ Layer 1 (Next.js cache) invalidation failed', {
      error: errorMessage,
      entityType
    });
  }
}

/**
 * Layer 2: Redis cache invalidation
 * Follows mono platform Redis key patterns
 * ⚠️ SERVER-SIDE ONLY - Never runs on client
 */
async function invalidateRedisCache(
  tenantId: string | null | undefined,
  entityType: string,
  entityId: string | undefined,
  operation: string,
  logFn: typeof logger | typeof browserLogger
): Promise<void> {
  // ✅ CRITICAL: Only run on server-side to prevent client-side Redis imports
  if (typeof window !== 'undefined') {
    logFn.debug('Skipping Redis cache invalidation on client-side');
    return;
  }

  try {
    const { getRedisClient } = await import('@/lib/redis');
    const redis = await getRedisClient();
    
    // Ensure redis client is available
    if (!redis) {
      logFn.warn('Redis client unavailable, skipping Layer 2 cache invalidation');
      return;
    }
    
    const keysToDelete: string[] = [];

    // Tenant-specific cache keys
    if (tenantId) {
      keysToDelete.push(
        `cache:${tenantId}:${entityType}:list:*`,
        `cache:${tenantId}:${entityType}:search:*`,
        `cache:${tenantId}:admin-${entityType}:*`
      );
      
      // Specific entity cache
      if (entityId) {
        keysToDelete.push(`cache:${tenantId}:${entityType}:${entityId}`);
      }
    }

    // Global cache keys (for platform-wide entities)
    keysToDelete.push(
      `cache:global:${entityType}:*`,
      `cache:global:admin-${entityType}:*`
    );

    // Get all matching keys and delete them
    const pipeline = redis.pipeline();
    let totalKeysDeleted = 0;

    for (const pattern of keysToDelete) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        for (const key of keys) {
          pipeline.del(key);
        }
        totalKeysDeleted += keys.length;
      }
    }

    // Execute all deletions
    if (totalKeysDeleted > 0) {
      await pipeline.exec();
    }

    logFn.info('✅ Layer 2 (Redis cache) invalidated', {
      keysDeleted: totalKeysDeleted,
      patterns: keysToDelete.length,
      tenantId,
      entityType,
      operation
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logFn.error('❌ Layer 2 (Redis cache) invalidation failed', {
      error: errorMessage,
      tenantId,
      entityType,
      entityId,
      operation
    });
  }
}

/**
 * Layer 3: TanStack Query cache invalidation
 * Invalidates client-side query cache and triggers refetch
 */
async function invalidateTanStackCache(
  queryClient: QueryClient,
  tenantId: string | null | undefined,
  entityType: string,
  entityId: string | undefined,
  operation: string,
  logFn: typeof logger | typeof browserLogger
): Promise<void> {
  try {
    const queryKeys: (string | number)[][] = [
      // Admin query keys
      ['admin', entityType],
      ['admin-users'],
      ['admin-tenants'],
      
      // Entity-specific query keys
      [entityType],
      [entityType, 'list'],
      [entityType, 'search'],
      
      // Tenant-specific query keys
      ...(tenantId ? [
        ['tenant', tenantId, entityType],
        ['tenant', tenantId, entityType, 'list']
      ] : []),
      
      // Specific entity query keys
      ...(entityId ? [
        [entityType, entityId],
        ['admin', entityType, entityId]
      ] : [])
    ];

    // Invalidate all relevant query keys
    const invalidationPromises = queryKeys.map(queryKey => 
      queryClient.invalidateQueries({ queryKey })
    );

    await Promise.all(invalidationPromises);

    // For bulk operations, also refetch active queries
    if (operation.includes('bulk_') || operation === 'delete') {
      await queryClient.refetchQueries({
        queryKey: ['admin', entityType],
        type: 'active'
      });
    }

    logFn.info('✅ Layer 3 (TanStack Query cache) invalidated', {
      queryKeys: queryKeys.length,
      tenantId,
      entityType,
      operation,
      bulkRefetch: operation.includes('bulk_') || operation === 'delete'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logFn.error('❌ Layer 3 (TanStack Query cache) invalidation failed', {
      error: errorMessage,
      tenantId,
      entityType,
      entityId,
      operation
    });
  }
}

/**
 * Optimistic update helper for immediate UI feedback
 * Updates client state before server response
 */
export function applyOptimisticUpdate<T>(
  queryClient: QueryClient,
  queryKey: (string | number)[],
  updater: (oldData: T | undefined) => T | undefined
): () => void {
  // Store previous data for rollback
  const previousData = queryClient.getQueryData<T>(queryKey);
  
  // Apply optimistic update
  queryClient.setQueryData<T>(queryKey, updater);
  
  // Return rollback function
  return () => {
    queryClient.setQueryData<T>(queryKey, previousData);
  };
}

/**
 * Entity-specific cache invalidation shortcuts
 */
export const cacheInvalidators = {
  users: (options: Omit<CacheInvalidationOptions, 'entityType'>) =>
    invalidateEntityCache({ ...options, entityType: 'users' }),
    
  tenants: (options: Omit<CacheInvalidationOptions, 'entityType'>) =>
    invalidateEntityCache({ ...options, entityType: 'tenants' }),
    
  profiles: (options: Omit<CacheInvalidationOptions, 'entityType'>) =>
    invalidateEntityCache({ ...options, entityType: 'profiles' }),
    
  settings: (options: Omit<CacheInvalidationOptions, 'entityType'>) =>
    invalidateEntityCache({ ...options, entityType: 'settings' }),
    
  translations: (options: Omit<CacheInvalidationOptions, 'entityType'>) =>
    invalidateEntityCache({ ...options, entityType: 'translations' }),
    
  optionSets: (options: Omit<CacheInvalidationOptions, 'entityType'>) =>
    invalidateEntityCache({ ...options, entityType: 'option_sets' })
}; 