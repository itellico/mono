/**
 * 🚀 Cache Middleware - Unified Cache Management
 * 
 * Implements mono platform three-layer caching:
 * - Layer 1: Next.js unstable_cache (React Server Components)
 * - Layer 2: Redis with getRedisClient() from @/lib/redis
 * - Layer 3: TanStack Query (client-side state management)
 * 
 * ✅ mono BEST PRACTICES:
 * - Consistent cache key naming (cache:{tenant_id}:{entity}:{id})
 * - Global data keys (cache:global:{entity}:{id})
 * - Search/Lists keys (cache:{tenant_id}:{entity}:search:{query_hash})
 * - Proper cache invalidation with tags
 * - TTL management per entity type
 * - Graceful degradation if Redis fails
 */

import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import crypto from 'crypto';
import type { Redis } from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  fallback?: () => Promise<any>; // Function to call if cache miss
}

export interface SavedSearchCacheKey {
  tenantId: number;
  userId: number;
  entityType: string;
  searchId?: number;
}

/**
 * ✅ CACHE KEY BUILDER - Following Redis best practices 2024
 * Hierarchy: platform > tenant > account > user
 * Pattern: {scope}:{entity}:{identifier}:{field}
 */
export class CacheKeyBuilder {
  // Platform/Global level keys
  static platform(entity: string, identifier?: string): string {
    return identifier 
      ? `platform:${entity}:${identifier}`
      : `platform:${entity}`;
  }

  // Tenant level keys - UPDATED to use UUIDs for security and consistency  
  static tenant(tenantId: number | string, entity: string, identifier?: string): string {
    return identifier
      ? `tenant:${tenantId}:${entity}:${identifier}`
      : `tenant:${tenantId}:${entity}`;
  }

  // UUID-based tenant keys (recommended for new code)
  static tenantUuid(tenantUuid: string, entity: string, identifier?: string): string {
    return identifier
      ? `tenant:${tenantUuid}:${entity}:${identifier}`
      : `tenant:${tenantUuid}:${entity}`;
  }

  // User level keys - UPDATED to support tenant UUIDs
  static user(tenantId: number | string, userId: string, field: string): string {
    return `tenant:${tenantId}:user:${userId}:${field}`;
  }

  // UUID-based user keys (recommended for new code) 
  static userWithUuid(tenantUuid: string, userId: string, field: string): string {
    return `tenant:${tenantUuid}:user:${userId}:${field}`;
  }

  // Account level keys - UPDATED to support tenant UUIDs
  static account(tenantId: number | string, accountId: string, field: string): string {
    return `tenant:${tenantId}:account:${accountId}:${field}`;
  }

  // Search/List keys with query hash - UPDATED to support tenant UUIDs
  static search(tenantId: number | string, entity: string, queryHash: string): string {
    return `tenant:${tenantId}:search:${entity}:${queryHash}`;
  }

  // List/Pagination keys - UPDATED to support tenant UUIDs
  static list(tenantId: number | string, entity: string, page: number, limit: number): string {
    return `tenant:${tenantId}:list:${entity}:page:${page}:limit:${limit}`;
  }

  // Temporary keys with purpose
  static temp(purpose: string, identifier: string): string {
    return `temp:${purpose}:${identifier}`;
  }

  // Tag keys for invalidation
  static tag(tagName: string): string {
    return `tag:${tagName}`;
  }
}

export class CacheMiddleware {
  private static instance: CacheMiddleware;
  private redis: Redis | null = null;

  private constructor() {}

  public static getInstance(): CacheMiddleware {
    if (!CacheMiddleware.instance) {
      CacheMiddleware.instance = new CacheMiddleware();
    }
    return CacheMiddleware.instance;
  }

  /**
   * Initialize Redis connection
   */
  private async getRedis(): Promise<Redis | null> {
    if (!this.redis) {
      try {
        this.redis = await getRedisClient();
      } catch (error) {
        logger.error('Failed to connect to Redis in cache middleware', { error });
        this.redis = null;
      }
    }
    return this.redis;
  }

  /**
   * ✅ GENERAL CACHE GET with consistent key naming
   */
  async get<T>(key: string): Promise<T | null>;
  async get<T>(key: string, options: CacheOptions): Promise<T | null>;
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const redis = await this.getRedis();
      if (!redis) {
        logger.warn('Redis not available, attempting fallback', { key });
        if (options?.fallback) {
          const result = await options.fallback();
          return result as T;
        }
        return null;
      }

      const cached = await redis.get(key);
      if (!cached) {
        logger.info('Cache miss, attempting fallback', { key });
        if (options?.fallback) {
          const result = await options.fallback();
          // Store result in cache for next time
          if (result && options.ttl) {
            await this.set(key, result, { ttl: options.ttl, tags: options.tags });
          }
          return result as T;
        }
        return null;
      }

      const parsed = JSON.parse(cached);
      logger.info('Cache hit', { key, type: typeof parsed });
      return parsed as T;

    } catch (error) {
      logger.error('Cache get failed, attempting fallback', { key, error });
      if (options?.fallback) {
        const result = await options.fallback();
        return result as T;
      }
      return null;
    }
  }

  /**
   * ✅ GENERAL CACHE SET with consistent key naming and tags
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const redis = await this.getRedis();
      if (!redis) {
        logger.warn('Redis not available, skipping cache set', { key });
        return;
      }

      const serialized = JSON.stringify(value);
      const ttl = options.ttl || 300; // Default 5 minutes

      try {
        await redis.setEx(key, ttl, serialized);
      } catch (setExError) {
        throw setExError;
      }

      // Store tags for invalidation
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          const tagKey = `tag:${tag}`;
          try {
            await redis.sAdd(tagKey, key);
            await redis.expire(tagKey, ttl + 60); // Tags expire slightly later
          } catch (tagError) {
            throw tagError;
          }
        }
      }

      logger.info('Cache set', { key, ttl, tags: options.tags });

    } catch (error) {
      logger.error('Cache set failed', { 
        key, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ttl: options.ttl,
        tags: options.tags
      });
    }
  }

  /**
   * ✅ SAVED SEARCHES CACHE KEY GENERATOR
   * Following mono platform patterns: tenant:{tenant_id}:search:{entity}:{identifier}
   */
  generateSavedSearchKey(params: SavedSearchCacheKey): string {
    const { tenantId, userId, entityType, searchId } = params;
    
    if (searchId) {
      return `tenant:${tenantId}:search:saved:${searchId}`;
    }
    
    return `tenant:${tenantId}:user:${userId}:saved_searches:${entityType}`;
  }

  /**
   * ✅ QUERY HASH GENERATOR for search/list caching
   */
  generateQueryHash(params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((obj: Record<string, unknown>, key: string) => {
        obj[key] = params[key];
        return obj;
      }, {});

    return crypto
      .createHash('md5')
      .update(JSON.stringify(sortedParams))
      .digest('hex')
      .substring(0, 12);
  }

  /**
   * ✅ INVALIDATE BY TAG with proper Redis operations
   */
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const redis = await this.getRedis();
      if (!redis) {
        logger.warn('Redis not available, skipping cache invalidation', { tag });
        return;
      }

      const tagKey = `tag:${tag}`;
      const keys = await redis.sMembers(tagKey);

      if (keys && keys.length > 0) {
        // Delete all cached keys with this tag
        await redis.del(...keys);
        logger.info('Cache invalidated by tag', { tag, keysCount: keys.length });
      }

      // Clean up the tag set
      await redis.del(tagKey);

    } catch (error) {
      logger.error('Cache invalidation by tag failed', { tag, error });
    }
  }

  /**
   * ✅ SAVED SEARCH SPECIFIC INVALIDATION
   * Invalidates all related saved search caches
   */
  async invalidateSavedSearches(params: {
    tenantId: number;
    userId: number;
    entityType: string;
  }): Promise<void> {
    const { tenantId, userId, entityType } = params;

    try {
      // Invalidate by multiple tags to ensure comprehensive cleanup
      await Promise.all([
        this.invalidateByTag(`tenant:${tenantId}`),
        this.invalidateByTag(`user:${userId}`),
        this.invalidateByTag(`entity:${entityType}`),
        this.invalidateByTag('saved_searches'),
        this.invalidateByTag(`saved_searches:${entityType}`),
      ]);

      logger.info('Saved search caches invalidated', {
        tenantId,
        userId,
        entityType
      });

    } catch (error) {
      logger.error('Failed to invalidate saved search caches', {
        tenantId,
        userId,
        entityType,
        error
      });
    }
  }

  /**
   * ✅ DELETE SPECIFIC CACHE KEY
   */
  async delete(key: string): Promise<void> {
    try {
      const redis = await this.getRedis();
      if (!redis) {
        logger.warn('Redis not available, skipping cache delete', { key });
        return;
      }

      await redis.del(key);
      logger.info('Cache key deleted', { key });

    } catch (error) {
      logger.error('Cache delete failed', { key, error });
    }
  }

  /**
   * ✅ GET CACHE STATISTICS
   */
  async getStats(): Promise<{
    connected: boolean;
    totalKeys: number;
    savedSearchKeys: number;
    tenantKeys: number;
    globalKeys: number;
  }> {
    try {
      const redis = await this.getRedis();
      if (!redis) {
        return {
          connected: false,
          totalKeys: 0,
          savedSearchKeys: 0,
          tenantKeys: 0,
          globalKeys: 0
        };
      }

      const allKeys = await redis.keys('cache:*');
      const savedSearchKeys = allKeys.filter((key: string) => key.includes('saved_searches'));
      const tenantKeys = allKeys.filter((key: string) => key.startsWith('cache:') && !key.startsWith('cache:global:'));
      const globalKeys = allKeys.filter((key: string) => key.startsWith('cache:global:'));

      return {
        connected: true,
        totalKeys: allKeys.length,
        savedSearchKeys: savedSearchKeys.length,
        tenantKeys: tenantKeys.length,
        globalKeys: globalKeys.length
      };

    } catch (error) {
      logger.error('Failed to get cache stats', { error });
      return {
        connected: false,
        totalKeys: 0,
        savedSearchKeys: 0,
        tenantKeys: 0,
        globalKeys: 0
      };
    }
  }

  /**
   * ✅ INITIALIZE CACHE MIDDLEWARE
   * Called once during application startup
   */
  async initialize(): Promise<void> {
    try {
      // Test Redis connection
      const redis = await this.getRedis();
      if (redis) {
        // Perform a simple ping to verify connection
        await redis.ping();
        logger.info('✅ Cache middleware initialized with Redis connection');
      } else {
        logger.warn('⚠️ Cache middleware initialized without Redis - graceful fallback mode');
      }
    } catch (error) {
      logger.error('Cache middleware initialization error', { error });
      // Don't throw - graceful degradation
    }
  }

  /**
   * ✅ HEALTH CHECK for cache middleware
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    try {
      const redis = await this.getRedis();
      if (!redis) {
        return { healthy: false };
      }

      const start = Date.now();
      await redis.ping();
      const latency = Date.now() - start;

      return { healthy: true, latency };
    } catch (error) {
      logger.error('Cache health check failed', { error });
      return { healthy: false };
    }
  }

  /**
   * ✅ DISCONNECT from Redis
   */
  async disconnect(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit();
        this.redis = null;
        logger.info('Redis connection closed');
      }
    } catch (error) {
      logger.error('Error closing Redis connection', { error });
    }
  }
}

// Export singleton instance
export const cacheMiddleware = CacheMiddleware.getInstance();

// Export for backward compatibility
export const cache = cacheMiddleware;

// Export the key builder for use across the application
 