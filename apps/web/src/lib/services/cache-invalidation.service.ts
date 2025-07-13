/**
 * Unified Cache Invalidation Service
 * 
 * Coordinates cache invalidation across all three layers:
 * - Layer 1: Next.js unstable_cache
 * - Layer 2: Redis cache
 * - Layer 3: TanStack Query (client-side coordination)
 */

import { revalidateTag } from 'next/cache';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';

export class CacheInvalidationService {
  /**
   * Invalidate settings cache across all layers
   */
  static async invalidateSettings(settingKey?: string, userId?: number): Promise<void> {
    try {
      // Layer 1: Next.js cache invalidation
      if (settingKey) {
        revalidateTag(`settings-${settingKey}`);
        logger.info('Next.js cache invalidated for setting', { settingKey });
      }
      revalidateTag('settings');
      
      // Layer 2: Redis cache invalidation
      const isRedisEnabled = process.env.REDIS_ENABLED?.toLowerCase() === 'true';
      if (isRedisEnabled) {
        try {
          const redis = await getRedisClient();
          const patterns = [];

          if (settingKey) {
            patterns.push(`settings:${settingKey}:*`);
            patterns.push(`admin:settings:value:${settingKey}:*`);
          }
          
          if (userId) {
            patterns.push(`settings:*:${userId}`);
            patterns.push(`admin:settings:user:${userId}`);
            patterns.push(`admin:settings:modes:${userId}`);
          }

          // Global invalidation
          patterns.push('settings:*');
          patterns.push('admin:settings:*');

          await this.deleteRedisPatterns(redis, patterns);
          logger.info('Settings cache invalidated across all layers', { settingKey, userId });
        } catch (redisError) {
          logger.warn('Redis settings cache invalidation failed', { error: redisError });
        }
      }

      // Layer 3: Client-side invalidation happens automatically via TanStack Query
      // when the API returns updated data
    } catch (error) {
      logger.error('Failed to invalidate settings cache:', error);
    }
  }

  /**
   * Invalidate permissions cache across all layers
   * 
   * UPDATED: Now includes bulk permission cache invalidation
   */
  static async invalidatePermissions(userId?: number, tenantId?: number): Promise<void> {
    try {
      // Layer 1: Next.js cache invalidation
      revalidateTag('permissions');
      if (userId) {
        revalidateTag(`permissions-user-${userId}`);
      }
      if (tenantId) {
        revalidateTag(`permissions-tenant-${tenantId}`);
      }

      // Layer 2: Redis cache invalidation
      const isRedisEnabled = process.env.REDIS_ENABLED?.toLowerCase() === 'true';
      if (isRedisEnabled) {
        try {
          const redis = await getRedisClient();
          const patterns = [];

          // Individual permission cache patterns
          if (userId && tenantId) {
            patterns.push(`permissions:${userId}:${tenantId}`);
          }
          
          if (userId) {
            patterns.push(`permissions:${userId}:*`);
          }
          
          if (tenantId) {
            patterns.push(`permissions:*:${tenantId}`);
          }

          // Global permission cache
          patterns.push('permissions:*');

          // NEW: Bulk permission cache patterns
          if (userId) {
            patterns.push(`bulk_permissions:${userId}:*`);
            if (tenantId) {
              patterns.push(`bulk_permissions:${userId}:${tenantId}`);
            } else {
              patterns.push(`bulk_permissions:${userId}:global`);
            }
          } else {
            // Invalidate all bulk permission caches
            patterns.push('bulk_permissions:*');
          }

          await this.deleteRedisPatterns(redis, patterns);
          logger.info('Permissions cache invalidated across all layers', { 
            userId, 
            tenantId,
            includingBulkCache: true 
          });
        } catch (redisError) {
          logger.warn('Redis permissions cache invalidation failed', { error: redisError });
        }
      }
    } catch (error) {
      logger.error('Failed to invalidate permissions cache:', error);
    }
  }

  /**
   * NEW: Invalidate bulk permission cache specifically
   * 
   * This is called when user roles or permissions change
   */
  static async invalidateBulkPermissions(userId: number, tenantId?: number): Promise<void> {
    try {
      // Layer 1: Next.js cache invalidation
      revalidateTag('bulk-permissions');
      revalidateTag(`bulk-permissions-user-${userId}`);
      if (tenantId) {
        revalidateTag(`bulk-permissions-tenant-${tenantId}`);
      }

      // Layer 2: Redis cache invalidation
      const isRedisEnabled = process.env.REDIS_ENABLED?.toLowerCase() === 'true';
      if (isRedisEnabled) {
        try {
          const redis = await getRedisClient();
          const patterns = [];

          // Specific user bulk permissions
          if (tenantId) {
            patterns.push(`bulk_permissions:${userId}:${tenantId}`);
          } else {
            patterns.push(`bulk_permissions:${userId}:global`);
          }
          
          // All tenant contexts for user
          patterns.push(`bulk_permissions:${userId}:*`);

          await this.deleteRedisPatterns(redis, patterns);
          logger.info('Bulk permissions cache invalidated', { userId, tenantId });
        } catch (redisError) {
          logger.warn('Redis bulk permissions cache invalidation failed', { error: redisError });
        }
      }

      // Layer 3: TanStack Query invalidation handled by client-side hooks
    } catch (error) {
      logger.error('Failed to invalidate bulk permissions cache:', error);
    }
  }

  /**
   * Invalidate operational modes cache across all layers
   */
  static async invalidateOperationalModes(userId?: number): Promise<void> {
    try {
      // Layer 1: Next.js cache invalidation
      revalidateTag('operational-modes');
      if (userId) {
        revalidateTag(`operational-modes-user-${userId}`);
      }

      // Layer 2: Redis cache invalidation
      const isRedisEnabled = process.env.REDIS_ENABLED?.toLowerCase() === 'true';
      if (isRedisEnabled) {
        try {
          const redis = await getRedisClient();
          const patterns = [];

          if (userId) {
            patterns.push(`admin:settings:modes:${userId}`);
            patterns.push(`operational-modes:${userId}`);
          }

          // Global operational modes
          patterns.push('operational-modes:*');
          patterns.push('admin:settings:modes:*');

          await this.deleteRedisPatterns(redis, patterns);
          logger.info('Operational modes cache invalidated across all layers', { userId });
        } catch (redisError) {
          logger.warn('Redis operational modes cache invalidation failed', { error: redisError });
        }
      }
    } catch (error) {
      logger.error('Failed to invalidate operational modes cache:', error);
    }
  }

  /**
   * Invalidate user session cache (for role/permission changes)
   * 
   * UPDATED: Now includes bulk permission invalidation
   */
  static async invalidateUserSession(userId: number, tenantId?: number): Promise<void> {
    try {
      // Layer 1: Next.js cache invalidation
      revalidateTag(`user-session-${userId}`);
      revalidateTag('user-sessions');

      // Layer 2: Redis cache invalidation
      const isRedisEnabled = process.env.REDIS_ENABLED?.toLowerCase() === 'true';
      if (isRedisEnabled) {
        try {
          const redis = await getRedisClient();
          const patterns = [
            `session:${userId}:*`,
            `user:${userId}:*`,
            `permissions:${userId}:*`,
            `settings:*:${userId}`,
            `operational-modes:${userId}`,
            // NEW: Include bulk permission patterns
            `bulk_permissions:${userId}:*`
          ];

          await this.deleteRedisPatterns(redis, patterns);
          logger.info('User session cache invalidated across all layers', { 
            userId,
            tenantId,
            includingBulkPermissions: true 
          });
        } catch (redisError) {
          logger.warn('Redis user session cache invalidation failed', { error: redisError });
        }
      }

      // Also invalidate bulk permissions specifically
      await this.invalidateBulkPermissions(userId, tenantId);
    } catch (error) {
      logger.error('Failed to invalidate user session cache:', error);
    }
  }

  /**
   * NEW: Invalidate when user roles change
   * 
   * This is the most important method for permission system changes
   */
  static async invalidateUserRoleChange(userId: number, tenantId?: number, roleId?: number): Promise<void> {
    try {
      logger.info('Invalidating caches for user role change', { userId, tenantId, roleId });

      // Invalidate all permission-related caches
      await Promise.all([
        this.invalidatePermissions(userId, tenantId),
        this.invalidateBulkPermissions(userId, tenantId),
        this.invalidateUserSession(userId, tenantId)
      ]);

      // Also invalidate operational modes since role changes affect admin access
      await this.invalidateOperationalModes(userId);

      logger.info('All caches invalidated for user role change', { 
        userId, 
        tenantId, 
        roleId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to invalidate caches for user role change:', error);
    }
  }

  /**
   * Helper method to delete Redis cache patterns
   */
  private static async deleteRedisPatterns(redis: any, patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
      try {
        if (pattern.includes('*')) {
          const keys = await redis.keys(pattern);
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        } else {
          await redis.del(pattern);
        }
      } catch (error) {
        logger.warn('Failed to delete Redis pattern', { pattern, error });
      }
    }
  }

  /**
   * Nuclear option: Clear all caches
   * 
   * UPDATED: Now includes bulk permission cache clearing
   */
  static async clearAllCaches(): Promise<void> {
    try {
      // Layer 1: Next.js cache invalidation (major tags)
      const majorTags = [
        'settings', 
        'permissions', 
        'bulk-permissions', // NEW
        'operational-modes', 
        'user-sessions'
      ];
      for (const tag of majorTags) {
        revalidateTag(tag);
      }

      // Layer 2: Redis cache clearing
      const isRedisEnabled = process.env.REDIS_ENABLED?.toLowerCase() === 'true';
      if (isRedisEnabled) {
        try {
          const redis = await getRedisClient();
          const patterns = [
            'settings:*',
            'permissions:*',
            'bulk_permissions:*', // NEW
            'operational-modes:*',
            'admin:settings:*',
            'session:*',
            'user:*'
          ];

          await this.deleteRedisPatterns(redis, patterns);
          logger.info('All caches cleared across all layers', {
            includingBulkPermissions: true
          });
        } catch (redisError) {
          logger.warn('Redis cache clearing failed', { error: redisError });
        }
      }
    } catch (error) {
      logger.error('Failed to clear all caches:', error);
    }
  }
} 