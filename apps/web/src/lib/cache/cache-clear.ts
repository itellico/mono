import { logger } from '@/lib/logger';
import { browserLogger } from '@/lib/browser-logger';

/**
 * SAFE CACHE CLEARING UTILITY
 * 
 * ✅ mono BEST PRACTICES:
 * - Layer 1: Next.js cache clearing (server-side only)
 * - Layer 2: Redis cache clearing (server-side only, targeted keys)
 * - Layer 3: TanStack Query cache clearing (client-side only)
 * 
 * This utility safely handles both server and client environments
 */

export interface CacheClearOptions {
  tenantId?: string | null;
  entityType?: 'users' | 'tenants' | 'profiles' | 'settings' | 'translations' | 'option_sets' | 'all';
  entityId?: string;
  clearAll?: boolean;
}

/**
 * Main cache clearing function - handles both server and client environments
 * ✅ Safe for both server and client usage
 */
export async function clearAllCaches(options: CacheClearOptions = {}): Promise<void> {
  const { tenantId, entityType = 'all', entityId, clearAll = false } = options;
  const isServer = typeof window === 'undefined';
  const logFn = isServer ? logger : browserLogger;

  try {
    logFn.info('🧹 Starting targeted cache clearing', { 
      tenantId, 
      entityType, 
      entityId, 
      clearAll,
      environment: isServer ? 'server' : 'client'
    });

    if (isServer) {
      // Server-side cache clearing
      await Promise.all([
        clearNextJsCache(entityType, tenantId, entityId, clearAll),
        clearRedisCache(entityType, tenantId, entityId, clearAll)
      ]);
    } else {
      // Client-side cache clearing
      clearTanStackQueryCache(entityType, tenantId, entityId, clearAll);
    }

    logFn.info('✅ Successfully cleared targeted cache layers');
    
  } catch (error) {
    logFn.error('❌ Failed to clear caches', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Layer 1: Clear Next.js cache (server-side only)
 */
async function clearNextJsCache(
  entityType: string,
  tenantId: string | null | undefined,
  entityId: string | undefined,
  clearAll: boolean
): Promise<void> {
  if (typeof window !== 'undefined') return; // Client-side guard
  
  const logFn = logger;
  
  try {
    // Dynamic imports to avoid client-side issues
    const { revalidateTag, revalidatePath } = await import('next/cache');
    
    logFn.info('🔄 Clearing Next.js cache', { entityType, tenantId, entityId, clearAll });

    if (clearAll) {
      // Clear all admin routes
      revalidatePath('/admin', 'layout');
      revalidatePath('/api/v1/admin', 'layout');
    } else {
      // Clear specific entity caches
      const tags = [
        `admin-${entityType}`,
        tenantId ? `tenant-${tenantId}` : null,
        entityId ? `entity-${entityId}` : null
      ].filter(Boolean) as string[];

      tags.forEach(tag => revalidateTag(tag));

      // Clear specific paths
      revalidatePath(`/admin/${entityType}`);
      revalidatePath(`/api/v1/admin/${entityType}`);
      if (entityId) {
        revalidatePath(`/admin/${entityType}/${entityId}`);
        revalidatePath(`/api/v1/admin/${entityType}/${entityId}`);
      }
    }

    logFn.info('✅ Next.js cache cleared successfully');
    
  } catch (error) {
    logFn.error('❌ Failed to clear Next.js cache', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Layer 2: Clear Redis cache (server-side only, targeted keys)
 */
async function clearRedisCache(
  entityType: string,
  tenantId: string | null | undefined,
  entityId: string | undefined,
  clearAll: boolean
): Promise<void> {
  if (typeof window !== 'undefined') return; // Client-side guard
  
  const logFn = logger;
  
  try {
    // Dynamic import to avoid client-side issues
    const { getRedisClient } = await import('@/lib/redis');
    const redis = await getRedisClient();
    
    if (!redis) {
      logFn.warn('⚠️ Redis client unavailable, skipping Redis cache clearing');
      return;
    }
    
    logFn.info('🔄 Clearing targeted Redis cache keys', { entityType, tenantId, entityId, clearAll });

    if (clearAll) {
      // Clear all admin-related cache keys (NEVER use flushdb!)
      const patterns = [
        'cache:*:admin-*',
        'cache:global:admin-*'
      ];
      
      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          logFn.info(`🗑️ Cleared ${keys.length} Redis keys matching pattern: ${pattern}`);
        }
      }
    } else {
      // Clear specific entity cache keys
      const keyPatterns = [
        tenantId ? `cache:${tenantId}:${entityType}:*` : `cache:global:${entityType}:*`,
        tenantId ? `cache:${tenantId}:admin-${entityType}:*` : `cache:global:admin-${entityType}:*`,
        entityId ? `cache:*:${entityType}:${entityId}` : null
      ].filter(Boolean) as string[];

      for (const pattern of keyPatterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          logFn.info(`🗑️ Cleared ${keys.length} Redis keys matching pattern: ${pattern}`);
        }
      }
    }

    logFn.info('✅ Redis cache cleared successfully');
    
  } catch (error) {
    logFn.error('❌ Failed to clear Redis cache', { error: error instanceof Error ? error.message : String(error) });
    // Don't throw - graceful degradation
    logFn.warn('⚠️ Continuing without Redis cache clearing');
  }
}

/**
 * Layer 3: Clear TanStack Query cache (client-side only)
 */
function clearTanStackQueryCache(
  entityType: string,
  tenantId: string | null | undefined,
  entityId: string | undefined,
  clearAll: boolean
): void {
  const logFn = browserLogger;
  
  try {
    // This runs on client-side only
    if (typeof window === 'undefined') return;
    
    // Get QueryClient from React context
    const queryClient = (window as unknown as Record<string, unknown>).__REACT_QUERY_CLIENT__ as {
      clear(): void;
      invalidateQueries(options: { queryKey: string[]; exact?: boolean }): void;
      refetchQueries(options: { queryKey: string[]; exact?: boolean }): void;
    } | undefined;
    
    if (!queryClient) {
      logFn.warn('⚠️ QueryClient not found, skipping TanStack Query cache clearing');
      return;
    }

    logFn.info('🔄 Clearing TanStack Query cache', { entityType, tenantId, entityId, clearAll });

    if (clearAll) {
      queryClient.clear();
    } else {
      // Clear specific query keys
      const queryKeys = [
        [`admin-${entityType}`],
        tenantId ? [`admin-${entityType}`, tenantId] : null,
        entityId ? [`admin-${entityType}`, entityId] : null
      ].filter(Boolean) as string[][];

      queryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey, exact: false });
        queryClient.refetchQueries({ queryKey, exact: false });
      });
    }

    logFn.info('✅ TanStack Query cache cleared successfully');
    
  } catch (error) {
    logFn.error('❌ Failed to clear TanStack Query cache', { error: error instanceof Error ? error.message : String(error) });
    // Don't throw - graceful degradation
    logFn.warn('⚠️ Continuing without TanStack Query cache clearing');
  }
}

// Convenience functions for specific entities
export const clearUsersCaches = (tenantId?: string | null) => 
  clearAllCaches({ entityType: 'users', tenantId });



export const clearProfilesCaches = (tenantId?: string | null) => 
  clearAllCaches({ entityType: 'profiles', tenantId });

export const clearSettingsCaches = (tenantId?: string | null) => 
  clearAllCaches({ entityType: 'settings', tenantId });

export const clearTranslationsCaches = (tenantId?: string | null) => 
  clearAllCaches({ entityType: 'translations', tenantId });

export const clearOptionSetsCaches = (tenantId?: string | null) => 
  clearAllCaches({ entityType: 'option_sets', tenantId }); 