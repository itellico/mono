/**
 * Redis Service Mock
 * Provides mock implementation for Redis operations in unit tests
 */

export const mockRedisService = {
  // Cache operations
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  reset: jest.fn(),

  // Batch operations
  mget: jest.fn(),
  mset: jest.fn(),

  // Pattern operations
  delPattern: jest.fn(),

  // Key helpers
  getTenantKey: jest.fn((tenantId: string, key: string) => `tenant:${tenantId}:${key}`),
  getAccountKey: jest.fn((accountId: string, key: string) => `account:${accountId}:${key}`),
  getUserKey: jest.fn((userId: string, key: string) => `user:${userId}:${key}`),

  // Redis client operations
  getClient: jest.fn(() => mockRedisClient),
  ping: jest.fn(),
  info: jest.fn(),
  dbSize: jest.fn(),

  // Lifecycle
  onModuleDestroy: jest.fn(),
};

export const mockRedisClient = {
  // Basic operations
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),

  // Hash operations
  hget: jest.fn(),
  hset: jest.fn(),
  hdel: jest.fn(),
  hgetall: jest.fn(),

  // List operations
  lpush: jest.fn(),
  rpush: jest.fn(),
  lpop: jest.fn(),
  rpop: jest.fn(),
  lrange: jest.fn(),

  // Set operations
  sadd: jest.fn(),
  srem: jest.fn(),
  smembers: jest.fn(),
  sismember: jest.fn(),

  // Connection
  connect: jest.fn(),
  quit: jest.fn(),
  ping: jest.fn(),
  info: jest.fn(),
  dbSize: jest.fn(),

  // Events
  on: jest.fn(),
  off: jest.fn(),
};

/**
 * Cache mock that simulates in-memory cache behavior
 */
export class MockCache {
  private cache = new Map<string, { value: any; expiry?: number }>();

  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  set(key: string, value: any, ttlSeconds?: number): void {
    const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
    this.cache.set(key, { value, expiry });
  }

  del(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Reset all Redis mocks
 */
export function resetRedisMocks() {
  Object.keys(mockRedisService).forEach(key => {
    if (jest.isMockFunction(mockRedisService[key])) {
      mockRedisService[key].mockReset();
    }
  });

  Object.keys(mockRedisClient).forEach(key => {
    if (jest.isMockFunction(mockRedisClient[key])) {
      mockRedisClient[key].mockReset();
    }
  });
}