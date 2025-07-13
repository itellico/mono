/**
 * Session Cache Service
 * 
 * Manages server-side session data storage to keep cookies lean
 */

import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { ServerSessionData } from '@/lib/auth/session-types';
import { db } from '@/lib/db';
import { userRoles, roles, permissions, rolePermissions } from '@/lib/schemas';
import { eq, and } from 'drizzle-orm';

export class SessionCacheService {
  private static readonly CACHE_PREFIX = 'session-data';
  private static readonly DEFAULT_TTL = 30 * 60; // 30 minutes

  /**
   * Store server-side session data
   */
  static async setServerSessionData(
    sessionId: string,
    userId: string,
    tenantId: string,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    try {
      // Fetch enhanced role and permissions from database
      const serverData = await this.fetchServerSessionData(userId, tenantId);
      
      const cacheKey = `${this.CACHE_PREFIX}:${sessionId}`;
      
      // Try Redis first
      const isRedisEnabled = process.env.REDIS_ENABLED?.toLowerCase() === 'true';
      if (isRedisEnabled) {
        try {
          const redis = await getRedisClient();
          await redis.setex(cacheKey, ttl, JSON.stringify(serverData));
          logger.info('Server session data cached in Redis', { sessionId, userId });
          return;
        } catch (redisError) {
          logger.warn('Redis session cache failed, continuing without cache', { error: redisError });
        }
      }

      // Fallback: store in memory cache (for development)
      this.memoryCache.set(cacheKey, {
        data: serverData,
        expiresAt: Date.now() + (ttl * 1000)
      });
      
      logger.info('Server session data cached in memory', { sessionId, userId });
    } catch (error) {
      logger.error('Failed to cache server session data', { error, sessionId, userId });
    }
  }

  /**
   * Retrieve server-side session data
   */
  static async getServerSessionData(sessionId: string): Promise<ServerSessionData | null> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}:${sessionId}`;
      
      // Try Redis first
      const isRedisEnabled = process.env.REDIS_ENABLED?.toLowerCase() === 'true';
      if (isRedisEnabled) {
        try {
          const redis = await getRedisClient();
          const cached = await redis.get(cacheKey);
          if (cached) {
            logger.info('Server session data retrieved from Redis', { sessionId });
            return JSON.parse(cached);
          }
        } catch (redisError) {
          logger.warn('Redis session retrieval failed', { error: redisError });
        }
      }

      // Fallback: check memory cache
      const memoryCached = this.memoryCache.get(cacheKey);
      if (memoryCached && memoryCached.expiresAt > Date.now()) {
        logger.info('Server session data retrieved from memory', { sessionId });
        return memoryCached.data;
      }

      logger.info('Server session data not found in cache', { sessionId });
      return null;
    } catch (error) {
      logger.error('Failed to retrieve server session data', { error, sessionId });
      return null;
    }
  }

  /**
   * Invalidate server-side session data
   */
  static async invalidateServerSessionData(sessionId: string): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}:${sessionId}`;
      
      // Clear from Redis
      const isRedisEnabled = process.env.REDIS_ENABLED?.toLowerCase() === 'true';
      if (isRedisEnabled) {
        try {
          const redis = await getRedisClient();
          await redis.del(cacheKey);
        } catch (redisError) {
          logger.warn('Redis session invalidation failed', { error: redisError });
        }
      }

      // Clear from memory cache
      this.memoryCache.delete(cacheKey);
      
      logger.info('Server session data invalidated', { sessionId });
    } catch (error) {
      logger.error('Failed to invalidate server session data', { error, sessionId });
    }
  }

  /**
   * Fetch fresh server session data from database
   */
  private static async fetchServerSessionData(
    userId: string,
    tenantId: string
  ): Promise<ServerSessionData> {
    try {
      // Get user role using the new unified system
      const userRole = await db
        .select({
          id: userRoles.id,
          roleId: userRoles.roleId,
          isActive: userRoles.isActive,
          tenantId: userRoles.tenantId,
          roleName: roles.name,
          roleDisplayName: roles.displayName,
          roleLevel: roles.level
        })
        .from(userRoles)
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
          and(
            eq(userRoles.userId, parseInt(userId)),
            eq(userRoles.tenantId, parseInt(tenantId)),
            eq(userRoles.isActive, true)
          )
        )
        .limit(1);

      // Get enhanced permissions for the role via role_permissions join
      const enhancedPermissions = userRole[0] ? await db
        .select({
          id: permissions.id,
          action: permissions.action,
          resource: permissions.resource,
          scope: permissions.scope,
          conditions: permissions.conditions
        })
        .from(permissions)
        .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
        .where(eq(rolePermissions.roleId, userRole[0].roleId))
        .execute() : [];

      return {
        userId,
        tenantId,
        permissions: enhancedPermissions.map(p => `${p.action}:${p.resource}`),
        enhancedRole: userRole[0] ? {
          id: userRole[0].roleId,
          roleType: userRole[0].roleName || 'user',
          displayName: userRole[0].roleDisplayName || 'User',
          isActive: userRole[0].isActive || false,
          tenantId: userRole[0].tenantId
        } : {
          id: '',
          roleType: 'user',
          displayName: 'User',
          isActive: false,
          tenantId: null
        },
        enhancedPermissions: enhancedPermissions.map(p => ({
          id: p.id,
          action: p.action,
          resource: p.resource,
          scope: p.scope || 'tenant',
          conditions: p.conditions || {}
        })),
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + (this.DEFAULT_TTL * 1000))
      };
    } catch (error) {
      logger.error('Failed to fetch server session data from database', { error, userId, tenantId });
      
      // Return minimal data on error
      return {
        userId,
        tenantId,
        permissions: [],
        enhancedRole: {
          id: '',
          roleType: 'user',
          displayName: 'User',
          isActive: false,
          tenantId: null
        },
        enhancedPermissions: [],
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + (this.DEFAULT_TTL * 1000))
      };
    }
  }

  /**
   * Memory cache fallback for development
   */
  private static memoryCache = new Map<string, { data: ServerSessionData; expiresAt: number }>();

  /**
   * Clean up expired memory cache entries
   */
  static cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }
  }
}

// Cleanup memory cache every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    SessionCacheService.cleanupMemoryCache();
  }, 5 * 60 * 1000);
} 