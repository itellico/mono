import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MetricsService } from '../metrics/metrics.service';

/**
 * L3 Database Cache Service
 * Implements the third layer of the 3-tier caching architecture
 * Uses PostgreSQL PermissionCache table for persistent permission caching
 * 
 * Architecture:
 * - L1: TanStack Query (Frontend)
 * - L2: Redis (Hot cache)
 * - L3: PostgreSQL (This service - Persistent cache)
 */
@Injectable()
export class L3CacheService {
  private readonly logger = new Logger(L3CacheService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService,
  ) {}

  /**
   * Get cached permissions from L3 database cache
   */
  async getPermissions(
    userId: number,
    tenantId?: number,
    accountId?: number,
    context = 'default'
  ): Promise<CachedPermissionData | null> {
    try {
      const cacheKey = this.buildCacheKey(userId, tenantId, accountId, context);
      
      const startTime = Date.now();
      const cached = await this.prisma.permissionCache.findUnique({
        where: { cache_key: cacheKey },
      });

      const responseTime = Date.now() - startTime;
      
      if (cached && cached.expires_at > new Date()) {
        // Cache hit
        await this.recordMetrics('read', true, responseTime, userId, tenantId);
        
        return {
          permissions: cached.permissions,
          roles: cached.roles,
          computed_at: cached.computed_at,
          expires_at: cached.expires_at,
          metadata: {
            cache_key: cacheKey,
            in_redis: cached.in_redis,
            redis_key: cached.redis_key,
            context: cached.context,
          },
        };
      }

      // Cache miss (expired or not found)
      await this.recordMetrics('read', false, responseTime, userId, tenantId);
      
      // Clean up expired entry if it exists
      if (cached && cached.expires_at <= new Date()) {
        await this.deleteExpiredEntry(cacheKey);
      }

      return null;

    } catch (error) {
      this.logger.error('Error reading from L3 cache:', error);
      await this.recordError('read', userId, tenantId, error);
      return null;
    }
  }

  /**
   * Store permissions in L3 database cache
   */
  async setPermissions(
    userId: number,
    permissions: string[],
    roles: number[],
    tenantId?: number,
    accountId?: number,
    context = 'default',
    ttlSeconds = 300 // 5 minutes default
  ): Promise<boolean> {
    try {
      const cacheKey = this.buildCacheKey(userId, tenantId, accountId, context);
      const redisKey = this.buildRedisKey(userId, tenantId, accountId);
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      const startTime = Date.now();
      
      await this.prisma.permissionCache.upsert({
        where: { cache_key: cacheKey },
        create: {
          cache_key: cacheKey,
          namespace: 'permissions',
          user_id: userId,
          tenant_id: tenantId || null,
          context,
          permissions,
          roles,
          computed_at: new Date(),
          expires_at: expiresAt,
          in_redis: false, // Will be updated when synced to Redis
          redis_key: redisKey,
          redis_ttl: ttlSeconds,
        },
        update: {
          permissions,
          roles,
          computed_at: new Date(),
          expires_at: expiresAt,
          redis_key: redisKey,
          redis_ttl: ttlSeconds,
        },
      });

      const responseTime = Date.now() - startTime;
      await this.recordMetrics('write', true, responseTime, userId, tenantId);
      
      this.logger.debug(`Stored permissions in L3 cache for user ${userId}`);
      return true;

    } catch (error) {
      this.logger.error('Error writing to L3 cache:', error);
      await this.recordError('write', userId, tenantId, error);
      return false;
    }
  }

  /**
   * Update Redis synchronization status
   */
  async markRedisSync(
    userId: number,
    tenantId?: number,
    accountId?: number,
    context = 'default',
    inRedis = true
  ): Promise<void> {
    try {
      const cacheKey = this.buildCacheKey(userId, tenantId, accountId, context);
      
      await this.prisma.permissionCache.update({
        where: { cache_key: cacheKey },
        data: { in_redis: inRedis },
      });

    } catch (error) {
      this.logger.warn('Error updating Redis sync status:', error);
    }
  }

  /**
   * Get all cached permissions for a user across all contexts
   */
  async getUserPermissionCache(userId: number): Promise<CachedPermissionData[]> {
    try {
      const cached = await this.prisma.permissionCache.findMany({
        where: { 
          user_id: userId,
          expires_at: { gt: new Date() }, // Only non-expired
        },
        orderBy: { computed_at: 'desc' },
      });

      return cached.map(cache => ({
        permissions: cache.permissions,
        roles: cache.roles,
        computed_at: cache.computed_at,
        expires_at: cache.expires_at,
        metadata: {
          cache_key: cache.cache_key,
          in_redis: cache.in_redis,
          redis_key: cache.redis_key,
          context: cache.context,
        },
      }));

    } catch (error) {
      this.logger.error('Error getting user permission cache:', error);
      return [];
    }
  }

  /**
   * Delete all cached permissions for a user
   */
  async invalidateUserCache(userId: number, reason = 'manual_invalidation'): Promise<number> {
    try {
      const result = await this.prisma.permissionCache.deleteMany({
        where: { user_id: userId },
      });

      // Log the invalidation
      await this.logInvalidation(
        'invalidate_user',
        `user:${userId}`,
        [`user:${userId}:*`],
        reason,
        userId,
        null
      );

      this.logger.debug(`Invalidated ${result.count} cache entries for user ${userId}`);
      return result.count;

    } catch (error) {
      this.logger.error('Error invalidating user cache:', error);
      return 0;
    }
  }

  /**
   * Delete all cached permissions for a tenant
   */
  async invalidateTenantCache(tenantId: number, reason = 'tenant_change'): Promise<number> {
    try {
      const result = await this.prisma.permissionCache.deleteMany({
        where: { tenant_id: tenantId },
      });

      // Log the invalidation
      await this.logInvalidation(
        'invalidate_tenant',
        `tenant:${tenantId}`,
        [`tenant:${tenantId}:*`],
        reason,
        null,
        tenantId
      );

      this.logger.debug(`Invalidated ${result.count} cache entries for tenant ${tenantId}`);
      return result.count;

    } catch (error) {
      this.logger.error('Error invalidating tenant cache:', error);
      return 0;
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredEntries(): Promise<number> {
    try {
      const result = await this.prisma.permissionCache.deleteMany({
        where: { expires_at: { lt: new Date() } },
      });

      if (result.count > 0) {
        this.logger.debug(`Cleaned up ${result.count} expired cache entries`);
        await this.logInvalidation(
          'cleanup_expired',
          'expired_entries',
          [`expired:${result.count}`],
          'automatic_cleanup',
          null,
          null
        );
      }

      return result.count;

    } catch (error) {
      this.logger.error('Error cleaning up expired entries:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const [
        totalEntries,
        expiredEntries,
        redisEntries,
        recentEntries,
        oldestEntry,
        newestEntry
      ] = await Promise.all([
        this.prisma.permissionCache.count(),
        this.prisma.permissionCache.count({
          where: { expires_at: { lt: new Date() } },
        }),
        this.prisma.permissionCache.count({
          where: { in_redis: true },
        }),
        this.prisma.permissionCache.count({
          where: { computed_at: { gte: new Date(Date.now() - 3600000) } }, // Last hour
        }),
        this.prisma.permissionCache.findFirst({
          orderBy: { computed_at: 'asc' },
          select: { computed_at: true },
        }),
        this.prisma.permissionCache.findFirst({
          orderBy: { computed_at: 'desc' },
          select: { computed_at: true },
        }),
      ]);

      return {
        total_entries: totalEntries,
        expired_entries: expiredEntries,
        active_entries: totalEntries - expiredEntries,
        redis_synced_entries: redisEntries,
        recent_entries: recentEntries,
        oldest_entry: oldestEntry?.computed_at || null,
        newest_entry: newestEntry?.computed_at || null,
        hit_rate: await this.calculateHitRate(),
      };

    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return {
        total_entries: 0,
        expired_entries: 0,
        active_entries: 0,
        redis_synced_entries: 0,
        recent_entries: 0,
        oldest_entry: null,
        newest_entry: null,
        hit_rate: 0,
      };
    }
  }

  /**
   * Schedule cache warming for a user
   */
  async scheduleWarmup(
    userId: number,
    priority = 1,
    tenantId?: number,
    context = 'default'
  ): Promise<void> {
    try {
      await this.prisma.cacheWarmupQueue.create({
        data: {
          cache_key: this.buildCacheKey(userId, tenantId, undefined, context),
          cache_type: 'permission',
          priority,
          user_id: userId,
          tenant_id: tenantId || null,
          metadata: JSON.stringify({ context }),
          scheduled_at: new Date(),
          status: 'pending',
        },
      });

      this.logger.debug(`Scheduled cache warmup for user ${userId}`);

    } catch (error) {
      this.logger.error('Error scheduling cache warmup:', error);
    }
  }

  /**
   * Build consistent cache key
   */
  private buildCacheKey(
    userId: number,
    tenantId?: number,
    accountId?: number,
    context = 'default'
  ): string {
    const parts = ['mono', 'perms', userId.toString()];
    
    if (tenantId) {
      parts.push(`tenant:${tenantId}`);
    }
    
    if (accountId) {
      parts.push(`account:${accountId}`);
    }
    
    if (context !== 'default') {
      parts.push(`ctx:${context}`);
    }
    
    return parts.join(':');
  }

  /**
   * Build Redis key format
   */
  private buildRedisKey(userId: number, tenantId?: number, accountId?: number): string {
    const parts = ['mono', 'perms', userId.toString()];
    
    if (tenantId) {
      parts.push(tenantId.toString());
    } else {
      parts.push('global');
    }
    
    if (accountId) {
      parts.push(accountId.toString());
    }
    
    return parts.join(':');
  }

  /**
   * Delete expired cache entry
   */
  private async deleteExpiredEntry(cacheKey: string): Promise<void> {
    try {
      await this.prisma.permissionCache.delete({
        where: { cache_key: cacheKey },
      });
      this.logger.debug(`Deleted expired cache entry: ${cacheKey}`);
    } catch (error) {
      this.logger.warn('Error deleting expired entry:', error);
    }
  }

  /**
   * Record metrics for cache operations
   */
  private async recordMetrics(
    operation: string,
    success: boolean,
    responseTimeMs: number,
    userId: number,
    tenantId?: number
  ): Promise<void> {
    try {
      await this.prisma.cacheMetrics.create({
        data: {
          cache_level: 'L3',
          operation,
          hit_count: success ? 1 : 0,
          miss_count: success ? 0 : 1,
          user_id: userId,
          tenant_id: tenantId || null,
          endpoint: 'l3_cache_service',
          response_time_ms: responseTimeMs,
          created_at: new Date(),
        },
      });

      // Update service metrics
      if (success) {
        this.metricsService.incrementCacheHits('L3', 'permission');
      } else {
        this.metricsService.incrementCacheMisses('L3', 'permission');
      }

    } catch (error) {
      this.logger.warn('Error recording metrics:', error);
    }
  }

  /**
   * Record error metrics
   */
  private async recordError(
    operation: string,
    userId: number,
    tenantId: number | undefined,
    error: any
  ): Promise<void> {
    try {
      this.metricsService.incrementCacheErrors('L3', 'permission');
      
      // Log error for debugging
      this.logger.error(`L3 cache ${operation} error for user ${userId}:`, error);

    } catch (logError) {
      this.logger.error('Error recording error metrics:', logError);
    }
  }

  /**
   * Log cache invalidation
   */
  private async logInvalidation(
    action: string,
    cacheKey: string,
    affectedKeys: string[],
    reason: string,
    userId?: number,
    tenantId?: number
  ): Promise<void> {
    try {
      await this.prisma.cacheInvalidationLog.create({
        data: {
          action,
          cache_key: cacheKey,
          affected_keys: affectedKeys,
          reason,
          user_id: userId || null,
          tenant_id: tenantId || null,
          created_at: new Date(),
        },
      });

    } catch (error) {
      this.logger.warn('Error logging invalidation:', error);
    }
  }

  /**
   * Calculate hit rate from recent metrics
   */
  private async calculateHitRate(): Promise<number> {
    try {
      const metrics = await this.prisma.cacheMetrics.findMany({
        where: {
          cache_level: 'L3',
          created_at: { gte: new Date(Date.now() - 3600000) }, // Last hour
        },
      });

      if (metrics.length === 0) return 0;

      const totalHits = metrics.reduce((sum, m) => sum + (m.hit_count || 0), 0);
      const totalMisses = metrics.reduce((sum, m) => sum + (m.miss_count || 0), 0);
      const total = totalHits + totalMisses;

      return total > 0 ? (totalHits / total) * 100 : 0;

    } catch (error) {
      this.logger.warn('Error calculating hit rate:', error);
      return 0;
    }
  }
}

/**
 * Type definitions
 */
interface CachedPermissionData {
  permissions: string[];
  roles: number[];
  computed_at: Date;
  expires_at: Date;
  metadata: {
    cache_key: string;
    in_redis: boolean;
    redis_key: string | null;
    context: string;
  };
}

interface CacheStats {
  total_entries: number;
  expired_entries: number;
  active_entries: number;
  redis_synced_entries: number;
  recent_entries: number;
  oldest_entry: Date | null;
  newest_entry: Date | null;
  hit_rate: number;
}