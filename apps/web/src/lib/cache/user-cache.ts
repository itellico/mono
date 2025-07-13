
import { logger } from '@/lib/logger';
import { QueryClient } from '@tanstack/react-query';

interface InvalidateUserCacheOptions {
  userId?: string;
  tenantId?: string;
  queryClient?: QueryClient;
  context: 'server' | 'client';
}

export const invalidateUserCache = async ({
  userId,
  tenantId,
  queryClient,
  context,
}: InvalidateUserCacheOptions) => {
  logger.info('Invalidating user cache', { userId, tenantId, context });

  // 1. Invalidate Next.js Data Cache (Server-side)
  if (context === 'server') {
    const { revalidateTag } = await import('next/cache');
    if (userId) {
      revalidateTag(`user:${userId}`);
    }
    revalidateTag('users');
    logger.info('Next.js data cache revalidated for users', { userId });
  }

  // 2. Invalidate Redis Cache
  if (context === 'server') {
    try {
      const { Redis } = await import('@/lib/redis');
      const redis = Redis.getInstance();
    const keysToDelete: string[] = [];

    if (userId) {
      keysToDelete.push(`user:${userId}`);
      keysToDelete.push(`user_profile:${userId}`);
    }
    if (tenantId) {
      keysToDelete.push(`tenant_users:${tenantId}:*`);
    }
    keysToDelete.push('users:*'); // Invalidate all user list caches

    if (keysToDelete.length > 0) {
      for (const pattern of keysToDelete) {
        const foundKeys = await redis.keys(pattern);
        if (foundKeys.length > 0) {
          await redis.del(...foundKeys);
          logger.info(`Deleted Redis keys matching pattern: ${pattern}`, { count: foundKeys.length });
        }
      }
    }
    logger.info('Redis cache invalidated for users', { keysToDelete });
  } catch (error) {
    logger.error('Failed to invalidate Redis cache for users', { error });
  }
  } // Closing brace for if (context === 'server')

  // 3. Invalidate TanStack Query Cache (Client-side)
  if (context === 'client' && queryClient) {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    }
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    queryClient.invalidateQueries({ queryKey: ['users'] });
    logger.info('TanStack Query cache invalidated for users', { userId });
  }
};
