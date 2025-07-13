import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';

// Modern caching patterns for Option Sets
export class ModernOptionSetsCache {
  private static readonly CACHE_PREFIX = 'option-sets';
  private static readonly DEFAULT_TTL = 3600; // 1 hour

  // Server Component Cache (React 19 + Next.js 15)
  static getServerCached = cache(async (key: string) => {
    return unstable_cache(
      async () => {
        try {
          const redis = await getRedisClient();
          const cached = await redis.get(key);
          return cached ? JSON.parse(cached) : null;
        } catch (error) {
          logger.error('Redis cache read failed', { key, error });
          return null;
        }
      },
      [key],
      {
        revalidate: this.DEFAULT_TTL,
        tags: [this.CACHE_PREFIX, key]
      }
    )();
  });

  // Write-through cache pattern
  static async setWithWriteThrough<T>(
    key: string,
    data: T,
    ttl = this.DEFAULT_TTL
  ): Promise<void> {
    try {
      const redis = await getRedisClient();
      await redis.setex(key, ttl, JSON.stringify(data));

      // Revalidate Next.js cache
      const { revalidateTag } = await import('next/cache');
      revalidateTag(key);
      revalidateTag(this.CACHE_PREFIX);

      logger.info('Cache updated successfully', { key, ttl });
    } catch (error) {
      logger.error('Cache write failed', { key, error });
      // Don't throw - graceful degradation
    }
  }

  // Read-through cache pattern
  static async getWithReadThrough<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = this.DEFAULT_TTL
  ): Promise<T> {
    // Try server cache first (includes Redis)
    let data = await this.getServerCached(key);
    if (data) {
      logger.info('Cache hit (server)', { key });
      return data as T;
    }

    // Cache miss - fetch from source
    logger.info('Cache miss - fetching from source', { key });
    data = await fetcher();

    // Update cache asynchronously
    this.setWithWriteThrough(key, data, ttl).catch(error => {
      logger.error('Background cache update failed', { key, error });
    });

    return data;
  }

  // Invalidation patterns
  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);

        // Revalidate Next.js cache
        const { revalidateTag } = await import('next/cache');
        revalidateTag(this.CACHE_PREFIX);

        logger.info('Cache invalidated', { pattern, keyCount: keys.length });
      }
    } catch (error) {
      logger.error('Cache invalidation failed', { pattern, error });
    }
  }

  // Specific cache key generators
  static getOptionSetKey(tenantId: string | null, optionSetId?: string): string {
    const tenant = tenantId || 'global';
    return optionSetId 
      ? `${this.CACHE_PREFIX}:${tenant}:set:${optionSetId}`
      : `${this.CACHE_PREFIX}:${tenant}:list`;
  }

  static getOptionValueKey(optionSetId: string, valueId?: string): string {
    return valueId
      ? `${this.CACHE_PREFIX}:values:${optionSetId}:${valueId}`
      : `${this.CACHE_PREFIX}:values:${optionSetId}:list`;
  }

  // Business logic helpers
  static async invalidateOptionSet(tenantId: string | null, optionSetId?: string): Promise<void> {
    const tenant = tenantId || 'global';

    if (optionSetId) {
      // Invalidate specific option set and its values
      await this.invalidatePattern(`${this.CACHE_PREFIX}:${tenant}:set:${optionSetId}`);
      await this.invalidatePattern(`${this.CACHE_PREFIX}:values:${optionSetId}:*`);
    }

    // Always invalidate list cache
    await this.invalidatePattern(`${this.CACHE_PREFIX}:${tenant}:list*`);
  }

  // Preload/warm cache
  static async warmCache<T>(key: string, fetcher: () => Promise<T>): Promise<void> {
    try {
      const data = await fetcher();
      await this.setWithWriteThrough(key, data);
      logger.info('Cache warmed successfully', { key });
    } catch (error) {
      logger.error('Cache warming failed', { key, error });
    }
  }

  // Batch operations for efficiency
  static async batchSet(items: Array<{ key: string; data: any; ttl?: number }>): Promise<void> {
    try {
      const redis = await getRedisClient();
      const pipeline = redis.pipeline();

      items.forEach(({ key, data, ttl = this.DEFAULT_TTL }) => {
        pipeline.setex(key, ttl, JSON.stringify(data));
      });

      await pipeline.exec();

      // Revalidate all affected tags
      const { revalidateTag } = await import('next/cache');
      revalidateTag(this.CACHE_PREFIX);

      logger.info('Batch cache update completed', { count: items.length });
    } catch (error) {
      logger.error('Batch cache update failed', { error, count: items.length });
    }
  }
} 