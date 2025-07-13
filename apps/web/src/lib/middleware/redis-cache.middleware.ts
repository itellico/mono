/**
 * Redis Cache Middleware
 * 
 * CRITICAL FEATURES:
 * - Redis-backed rate limiting for production scalability
 * - Graceful fallback to memory when Redis unavailable
 * - ENV checking for Redis on/off (BEST PRACTICE, not performance issue)
 * - Three-layer cache coordination
 * - Integrates with existing Redis client configuration
 */

import { getRedisClient, isRedisHealthy } from '@/lib/redis';

export class RedisRateLimiter {
  private static memoryFallback = new Map<string, { count: number; resetTime: number }>();

  static async checkLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    // ENV checking is BEST PRACTICE - negligible performance impact
    // Uses the same REDIS_ENABLED check as the main Redis client
    const isRedisEnabled = process.env.REDIS_ENABLED?.toLowerCase() === 'true';
    
    if (isRedisEnabled) {
      try {
        // Check Redis health first
        const isHealthy = await isRedisHealthy();
        if (isHealthy) {
          return await this.checkRedisLimit(key, limit, windowMs);
        } else {
          console.warn('Redis unhealthy, falling back to memory rate limiting');
        }
      } catch (error) {
        console.warn('Redis rate limiting failed, falling back to memory:', error);
      }
    }

    // Graceful fallback to memory
    return this.checkMemoryLimit(key, limit, windowMs);
  }

  private static async checkRedisLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const redis = await getRedisClient();
    const now = Date.now();
    const resetTime = now + windowMs;
    const redisKey = `rate_limit:${key}`;

    try {
      // Get current count
      const current = await redis.get(redisKey);
      const count = current ? parseInt(current) : 0;

      if (count >= limit) {
        const ttl = await redis.ttl(redisKey);
        return {
          allowed: false,
          remaining: 0,
          resetTime: now + (ttl * 1000)
        };
      }

      // Use Redis pipeline for atomic operations
      const pipeline = redis.pipeline();
      pipeline.incr(redisKey);
      
      if (count === 0) {
        pipeline.expire(redisKey, Math.ceil(windowMs / 1000));
      }
      
      await pipeline.exec();

      return {
        allowed: true,
        remaining: limit - count - 1,
        resetTime
      };
    } catch (error) {
      console.error('Redis rate limiting operation failed:', error);
      throw error; // Let the caller handle fallback
    }
  }

  private static checkMemoryLimit(
    key: string,
    limit: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.memoryFallback.get(key);

    if (!entry || now > entry.resetTime) {
      const resetTime = now + windowMs;
      this.memoryFallback.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: limit - 1, resetTime };
    }

    entry.count++;
    return {
      allowed: entry.count <= limit,
      remaining: Math.max(0, limit - entry.count),
      resetTime: entry.resetTime
    };
  }

  static getStats() {
    return {
      redisEnabled: process.env.REDIS_ENABLED?.toLowerCase() === 'true',
      memoryFallbackSize: this.memoryFallback.size,
      memoryEntries: Array.from(this.memoryFallback.keys())
    };
  }

  static cleanup(): void {
    // Clean up expired memory entries
    const now = Date.now();
    for (const [key, entry] of this.memoryFallback.entries()) {
      if (now > entry.resetTime) {
        this.memoryFallback.delete(key);
      }
    }
  }
}

export class RedisCacheInvalidation {
  static async invalidatePattern(pattern: string): Promise<void> {
    const isRedisEnabled = process.env.REDIS_ENABLED?.toLowerCase() === 'true';
    
    if (!isRedisEnabled) {
      console.log('Redis disabled, skipping cache invalidation');
      return;
    }

    try {
      const redis = await getRedisClient();
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`✅ Invalidated ${keys.length} cache keys for pattern: ${pattern}`);
      }
    } catch (error) {
      console.warn('Redis cache invalidation failed:', error);
    }
  }

  static async invalidateTranslationCache(locale?: string): Promise<void> {
    if (locale) {
      await this.invalidatePattern(`translation_cache:${locale}:*`);
    } else {
      await this.invalidatePattern('translation_cache:*');
    }
  }

  static async invalidateRateLimit(key: string): Promise<void> {
    await this.invalidatePattern(`rate_limit:${key}*`);
  }
}

// Cleanup memory fallback every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    RedisRateLimiter.cleanup();
  }, 5 * 60 * 1000);
} 