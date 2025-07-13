import { logger } from '@/lib/logger';

// ============================
// 🔥 REDIS CLIENT - SERVER-SIDE ONLY (Official Redis Client)
// ============================

// Strong runtime check to prevent client-side execution
if (typeof window !== 'undefined') {
  // Completely block execution on client-side
  throw new Error('❌ Redis module cannot be imported on client-side. Use API routes instead.');
}

// Additional environment check
const isServerEnvironment = () => {
  return typeof window === 'undefined' && 
         typeof process !== 'undefined' && 
         process.env.NODE_ENV !== undefined;
};

// Early exit if not server environment
if (!isServerEnvironment()) {
  throw new Error('❌ Redis module requires server environment');
}

// Redis client types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RedisClientType = any; // Using any to avoid client-side bundling issues

// Check if Redis is enabled
const isRedisEnabled = (): boolean => {
  if (!isServerEnvironment()) return false;
  return process.env.REDIS_HOST !== undefined && process.env.REDIS_HOST !== '';
};

// Redis configuration interface
interface RedisConfig {
  socket: {
    host: string;
    port: number;
    connectTimeout: number;
    lazyConnect?: boolean;
  };
  username?: string;
  password?: string;
  database?: number;
}

// Get Redis configuration
const getRedisConfig = (): RedisConfig => {
  if (!isServerEnvironment()) {
    throw new Error('❌ Redis config cannot be accessed on client-side');
  }

  const config: RedisConfig = {
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      connectTimeout: 10000, // 10 seconds
      lazyConnect: true,
    },
    database: parseInt(process.env.REDIS_DB || '0'),
  };

  const username = process.env.REDIS_USERNAME;
  const password = process.env.REDIS_PASSWORD;

  if (username && username.length > 0) {
    config.username = username;
  }
  
  if (password && password.length > 0) {
    config.password = password;
  }

  return config;
};

// Dynamic Redis import - server-side only with additional checks
async function createRedisClient(): Promise<RedisClientType> {
  if (!isServerEnvironment()) {
    throw new Error('❌ Redis client cannot be created on client-side');
  }

  try {
    // Dynamic import with error handling
    const redisModule = await import('redis');
    
    if (!redisModule.createClient) {
      throw new Error('❌ Redis createClient not available');
    }

    const config = getRedisConfig();
    const client = redisModule.createClient(config);

    // Event handlers
    client.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    client.on('ready', () => {
      logger.info('✅ Redis ready for commands');
    });

    client.on('error', (error: Error) => {
      logger.error('Redis connection error', {
        message: error.message,
        type: 'redis_error'
      });
    });

    client.on('end', () => {
      logger.warn('Redis connection closed');
    });

    client.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    // Connect to Redis
    await client.connect();
    
    // Test the connection
    await client.ping();
    logger.info('✅ Redis client initialized and tested successfully');

    return client;
  } catch (error) {
    logger.error('Failed to create Redis client', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

// Redis Manager class with enhanced protection
class RedisManager {
  private static instance: RedisManager;
  private client: RedisClientType | null = null;
  private isHealthy: boolean = false;
  private connectionPromise: Promise<RedisClientType> | null = null;

  private constructor() {
    if (!isServerEnvironment()) {
      throw new Error('❌ RedisManager cannot be instantiated on client-side');
    }
  }

  static getInstance(): RedisManager {
    if (!isServerEnvironment()) {
      throw new Error('❌ RedisManager.getInstance() called on client-side');
    }
    
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  async getRedisClient(): Promise<RedisClientType | null> {
    // Multiple layers of protection
    if (!isServerEnvironment()) {
      throw new Error('❌ getRedisClient() called on client-side');
    }

    if (!isRedisEnabled()) {
      logger.warn('Redis not enabled, returning null');
      return null;
    }

    if (this.client && this.isHealthy) {
      return this.client;
    }

    if (this.connectionPromise) {
      try {
        return await this.connectionPromise;
      } catch {
        this.connectionPromise = null;
        return null;
      }
    }

    this.connectionPromise = this.createConnection();

    try {
      this.client = await this.connectionPromise;
      this.isHealthy = true;
      return this.client;
    } catch (error) {
      this.connectionPromise = null;
      this.isHealthy = false;
      logger.error('Failed to connect to Redis', {
        error: error instanceof Error ? error.message : String(error),
        type: 'redis_connection'
      });
      return null;
    }
  }

  private async createConnection(): Promise<RedisClientType> {
    if (!isServerEnvironment()) {
      throw new Error('❌ createConnection() called on client-side');
    }
    
    const client = await createRedisClient();
    this.isHealthy = true;
    return client;
  }

  async isRedisHealthy(): Promise<boolean> {
    if (!isServerEnvironment() || !isRedisEnabled()) {
      return false;
    }
    
    try {
      const client = await this.getRedisClient();
      if (!client) return false;
      
      await client.ping();
      this.isHealthy = true;
      return true;
    } catch {
      this.isHealthy = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (!isServerEnvironment()) {
      return; // Silently return on client-side
    }
    
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      this.isHealthy = false;
      logger.info('Redis disconnected gracefully');
    }
  }
}

// Safe singleton creation with additional checks
let redisManager: RedisManager | null = null;

if (isServerEnvironment()) {
  redisManager = RedisManager.getInstance();
}

// Export functions with enhanced protection
export const getRedisClient = async (): Promise<RedisClientType | null> => {
  if (!isServerEnvironment()) {
    throw new Error('❌ getRedisClient() cannot be called on client-side');
  }
  
  if (!redisManager) {
    logger.warn('Redis manager not initialized');
    return null;
  }
  
  return await redisManager.getRedisClient();
};

export const isRedisHealthy = async (): Promise<boolean> => {
  if (!isServerEnvironment()) {
    return false;
  }
  
  if (!redisManager) {
    return false;
  }
  
  return await redisManager.isRedisHealthy();
};

export const disconnectRedis = async (): Promise<void> => {
  if (!isServerEnvironment() || !redisManager) {
    return;
  }
  
  await redisManager.disconnect();
};

export const withRedis = async <T>(
  operation: (client: RedisClientType) => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> => {
  if (!isServerEnvironment()) {
    logger.warn('withRedis called on client-side, using fallback');
    return fallback();
  }

  try {
    const client = await getRedisClient();
    if (!client) {
      logger.warn('Redis client not available, using fallback');
      return fallback();
    }
    return await operation(client);
  } catch (error) {
    logger.error('Redis operation failed, using fallback', {
      error: error instanceof Error ? error.message : String(error)
    });
    return fallback();
  }
};

// Enhanced ResilientRedisClient with stronger protection
class ResilientRedisClient {
  private isAvailableCache: boolean = false;
  private lastHealthCheck: number = 0;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  constructor() {
    if (!isServerEnvironment()) {
      throw new Error('❌ ResilientRedisClient cannot be instantiated on client-side');
    }
  }

  private async updateHealthStatus(): Promise<void> {
    if (!isServerEnvironment()) return;
    
    const now = Date.now();
    if (now - this.lastHealthCheck < this.HEALTH_CHECK_INTERVAL) return;
    
    this.isAvailableCache = await isRedisHealthy();
    this.lastHealthCheck = now;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!isServerEnvironment()) {
      logger.warn('ResilientRedisClient.get called on client-side');
      return null;
    }
    
    try {
      await this.updateHealthStatus();
      if (!this.isAvailableCache) return null;

      const client = await getRedisClient();
      if (!client) return null;

      const value = await client.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Redis get operation failed', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!isServerEnvironment()) {
      logger.warn('ResilientRedisClient.set called on client-side');
      return false;
    }
    
    try {
      await this.updateHealthStatus();
      if (!this.isAvailableCache) return false;

      const client = await getRedisClient();
      if (!client) return false;

      const serialized = JSON.stringify(value);
      if (ttl) {
        await client.setEx(key, ttl, serialized);
      } else {
        await client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Redis set operation failed', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!isServerEnvironment()) {
      logger.warn('ResilientRedisClient.del called on client-side');
      return false;
    }
    
    try {
      await this.updateHealthStatus();
      if (!this.isAvailableCache) return false;

      const client = await getRedisClient();
      if (!client) return false;

      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis del operation failed', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!isServerEnvironment()) {
      logger.warn('ResilientRedisClient.keys called on client-side');
      return [];
    }
    
    try {
      await this.updateHealthStatus();
      if (!this.isAvailableCache) return [];

      const client = await getRedisClient();
      if (!client) return [];

      return await client.keys(pattern);
    } catch (error) {
      logger.error('Redis keys operation failed', {
        pattern,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  async invalidate(pattern: string): Promise<void> {
    if (!isServerEnvironment()) {
      logger.warn('ResilientRedisClient.invalidate called on client-side');
      return;
    }
    
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return;

      const client = await getRedisClient();
      if (!client) return;

      await client.del(keys);
      logger.info(`🔄 Invalidated ${keys.length} Redis keys matching pattern: ${pattern}`);
    } catch (error) {
      logger.error('Redis invalidate operation failed', {
        pattern,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

// Cache classes with enhanced protection
export class TemplateCache {
  private static ttl = 10 * 60; // 10 minutes
  private static redis = isServerEnvironment() ? new ResilientRedisClient() : null;

  static async get<T>(cacheKey: string): Promise<T | null> {
    if (!isServerEnvironment() || !this.redis) return null;
    return await this.redis.get<T>(cacheKey);
  }

  static async set(cacheKey: string, data: any, ttl: number = this.ttl): Promise<void> {
    if (!isServerEnvironment() || !this.redis) return;
    await this.redis.set(cacheKey, data, ttl);
  }

  static async invalidate(pattern: string): Promise<void> {
    if (!isServerEnvironment() || !this.redis) return;
    await this.redis.invalidate(pattern);
  }
}

export class OptionSetCache {
  private static ttl = 60 * 60; // 1 hour
  private static redis = isServerEnvironment() ? new ResilientRedisClient() : null;

  static async get<T>(cacheKey: string): Promise<T | null> {
    if (!isServerEnvironment() || !this.redis) return null;
    return await this.redis.get<T>(cacheKey);
  }

  static async set(cacheKey: string, data: any, ttl: number = this.ttl): Promise<void> {
    if (!isServerEnvironment() || !this.redis) return;
    await this.redis.set(cacheKey, data, ttl);
  }

  static async invalidate(pattern: string): Promise<void> {
    if (!isServerEnvironment() || !this.redis) return;
    await this.redis.invalidate(pattern);
  }
}

// Safe cleanup function
export async function closeRedis(): Promise<void> {
  if (!isServerEnvironment()) return;
  
  try {
    await disconnectRedis();
    logger.info('Redis connections closed');
  } catch (error) {
    logger.error('Error closing Redis connections', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 