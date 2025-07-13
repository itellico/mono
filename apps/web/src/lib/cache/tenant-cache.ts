import { logger } from '@/lib/logger';
import { QueryClient } from '@tanstack/react-query';

interface InvalidateTenantCacheOptions {
  tenantId?: string;
  entityId?: string; // Specific tenant ID if applicable
  queryClient?: QueryClient;
  context: 'server' | 'client';
}

export const invalidateTenantCache = async ({
  tenantId,
  entityId,
  queryClient,
  context,
}: InvalidateTenantCacheOptions) => {
  logger.info('Invalidating tenant cache', { tenantId, entityId, context });

  // 1. Invalidate Next.js Data Cache (Server-side only)
  if (context === 'server' && typeof window === 'undefined') {
    try {
      const { revalidateTag } = await import('next/cache');
      if (entityId) {
        revalidateTag(`tenant:${entityId}`);
      }
      revalidateTag('tenants');
      logger.info('Next.js data cache revalidated for tenants', { entityId });
    } catch (error) {
      logger.error('Failed to revalidate Next.js cache', { error });
    }
  }

  // 2. Invalidate Redis Cache (Server-side only) 
  if (context === 'server' && typeof window === 'undefined') {
    try {
      // Only import Redis if we're definitely on the server
      const redisModule = await import('@/lib/redis');
      const redisInstance = redisModule.redis; // Use the exported redis instance
      
      const keysToDelete: string[] = [];

      if (entityId) {
        keysToDelete.push(`tenant:${entityId}`);
      }
      keysToDelete.push('tenants:*'); // Invalidate all tenant list caches

      if (keysToDelete.length > 0) {
        for (const pattern of keysToDelete) {
          const foundKeys = await redisInstance.keys(pattern);
          if (foundKeys.length > 0) {
            await redisInstance.del(...foundKeys);
            logger.info(`Deleted Redis keys matching pattern: ${pattern}`, { count: foundKeys.length });
          }
        }
      }
      logger.info('Redis cache invalidated for tenants', { keysToDelete });
    } catch (error) {
      logger.error('Failed to invalidate Redis cache for tenants', { error });
    }
  }

  // 3. Invalidate TanStack Query Cache (Client-side)
  if (context === 'client' && queryClient) {
    if (entityId) {
      queryClient.invalidateQueries({ queryKey: ['tenant', entityId] });
    }
    queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    queryClient.invalidateQueries({ queryKey: ['tenants'] });
    logger.info('TanStack Query cache invalidated for tenants', { entityId });
  }
};
