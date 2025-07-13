import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class RedisService {
  private redisClient: RedisClientType;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
    private metricsService: MetricsService,
  ) {
    this.initializeRedisClient();
  }

  private async initializeRedisClient() {
    this.redisClient = createClient({
      socket: {
        host: this.configService.get('redis.host'),
        port: this.configService.get('redis.port'),
      },
      password: this.configService.get('redis.password'),
    });

    this.redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await this.redisClient.connect();
    console.log('✅ Redis client connected');
  }

  // Cache Manager methods (high-level caching)
  async get<T>(key: string): Promise<T | undefined> {
    const result = await this.cacheManager.get<T>(key);
    const hit = result !== undefined && result !== null;
    this.metricsService.incrementCacheOperations('get', hit);
    return result;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.metricsService.incrementCacheOperations('set', true);
    } catch (error) {
      this.metricsService.incrementCacheOperations('set', false);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.metricsService.incrementCacheOperations('del', true);
    } catch (error) {
      this.metricsService.incrementCacheOperations('del', false);
      throw error;
    }
  }

  async reset(): Promise<void> {
    // Clear cache by using store's reset method if available
    const store = (this.cacheManager as any).store;
    if (store && typeof store.reset === 'function') {
      await store.reset();
    }
  }

  // Direct Redis client methods (low-level operations)
  getClient(): RedisClientType {
    return this.redisClient;
  }

  // Key pattern helpers for multi-tenant caching
  getTenantKey(tenant_id: string, key: string): string {
    return `tenant:${tenant_id}:${key}`;
  }

  getAccountKey(account_id: string, key: string): string {
    return `account:${account_id}:${key}`;
  }

  getUserKey(user_id: string, key: string): string {
    return `user:${user_id}:${key}`;
  }

  // Batch operations
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const values = await Promise.all(keys.map((key) => this.get<T>(key)));
    return values.map((v) => v || null);
  }

  async mset(items: { key: string; value: any; ttl?: number }[]): Promise<void> {
    await Promise.all(items.map((item) => this.set(item.key, item.value, item.ttl)));
  }

  // Pattern-based deletion
  async delPattern(pattern: string): Promise<void> {
    const keys = await this.redisClient.keys(pattern);
    if (keys.length > 0) {
      await this.redisClient.del(keys);
    }
  }

  // Direct Redis operations
  async ping(): Promise<string> {
    return await this.redisClient.ping();
  }

  async info(): Promise<string> {
    return await this.redisClient.info();
  }

  async dbSize(): Promise<number> {
    return await this.redisClient.dbSize();
  }

  // Cleanup on module destroy
  async onModuleDestroy() {
    await this.redisClient.quit();
    console.log('❌ Redis client disconnected');
  }
}