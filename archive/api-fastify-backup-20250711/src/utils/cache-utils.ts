import { FastifyRedis } from '@fastify/redis';

/**
 * Invalidate Redis keys matching a pattern
 * @param redis Redis client
 * @param pattern Redis key pattern with wildcards
 */
export async function invalidateRedisPattern(redis: FastifyRedis, pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

/**
 * Get or set cache with fallback
 */
export async function getOrSetCache<T>(
  redis: FastifyRedis,
  key: string,
  ttl: number,
  fallback: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const value = await fallback();
  await redis.setex(key, ttl, JSON.stringify(value));
  return value;
}

/**
 * Multi-get with cache
 */
export async function multiGetCache(redis: FastifyRedis, keys: string[]): Promise<Record<string, any>> {
  if (keys.length === 0) return {};
  
  const values = await redis.mget(...keys);
  const result: Record<string, any> = {};
  
  keys.forEach((key, index) => {
    if (values[index]) {
      result[key] = JSON.parse(values[index]);
    }
  });
  
  return result;
}

/**
 * Multi-set with TTL
 */
export async function multiSetCache(
  redis: FastifyRedis,
  items: Array<{ key: string; value: any; ttl: number }>
): Promise<void> {
  const pipeline = redis.pipeline();
  
  items.forEach(({ key, value, ttl }) => {
    pipeline.setex(key, ttl, JSON.stringify(value));
  });
  
  await pipeline.exec();
}