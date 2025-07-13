import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { PermissionService } from '@modules/permissions/permission.service';
import { RedisService } from '../redis/redis.service';
import { MetricsService } from '../metrics/metrics.service';
import { PrismaService } from '../database/prisma.service';

/**
 * Permission Cache Middleware with 3-Layer Architecture
 * Implements L1 (Memory) + L2 (Redis) + L3 (Database) caching strategy
 * 
 * Based on CLAUDE.md specifications:
 * - L1: TanStack Query (handled by frontend)
 * - L2: Redis (implemented here)
 * - L3: PostgreSQL (PermissionCache table)
 * 
 * Follows NestJS best practices with Fastify integration
 */
@Injectable()
export class PermissionCacheMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PermissionCacheMiddleware.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly redisService: RedisService,
    private readonly metricsService: MetricsService,
    private readonly prisma: PrismaService,
  ) {}

  async use(req: FastifyRequest, res: FastifyReply, next: () => void): Promise<void> {
    try {
      // Only process authenticated requests
      const user = (req as any).user;
      if (!user?.id) {
        return next();
      }

      // Extract context information
      const context = this.extractRequestContext(req);
      
      // Pre-warm permissions for user if needed
      await this.ensurePermissionsCached(user.id, context);

      // Add cache metadata to request for debugging
      this.addCacheMetadata(req, user.id, context);

      next();
    } catch (error) {
      this.logger.error('Permission cache middleware error:', error);
      // Don't block request on cache errors
      next();
    }
  }

  /**
   * Extract request context (tenant, account, etc.)
   */
  private extractRequestContext(req: FastifyRequest): RequestContext {
    const url = req.url;
    const tenantId = this.extractTenantFromRequest(req);
    const accountId = this.extractAccountFromRequest(req);
    const tier = this.extractTierFromRoute(url);

    return {
      tenantId,
      accountId,
      tier,
      path: url,
      method: req.method,
    };
  }

  /**
   * Ensure user permissions are cached across all layers
   */
  private async ensurePermissionsCached(userId: string, context: RequestContext): Promise<void> {
    const cacheKey = this.buildCacheKey(userId, context.tenantId, context.accountId);
    
    try {
      // Check L2 (Redis) cache first
      const l2Permissions = await this.getFromL2Cache(cacheKey);
      if (l2Permissions) {
        await this.recordCacheHit('L2', userId, context);
        return;
      }

      // Check L3 (Database) cache
      const l3Permissions = await this.getFromL3Cache(userId, context.tenantId, context.accountId);
      if (l3Permissions) {
        await this.recordCacheHit('L3', userId, context);
        // Warm L2 cache from L3
        await this.setToL2Cache(cacheKey, l3Permissions);
        return;
      }

      // Cache miss - load from source and warm all layers
      await this.recordCacheMiss('ALL', userId, context);
      await this.warmAllCacheLayers(userId, context);

    } catch (error) {
      this.logger.error('Error ensuring permissions cached:', error);
      await this.recordCacheError(userId, context, error);
    }
  }

  /**
   * L2 (Redis) Cache Operations
   */
  private async getFromL2Cache(cacheKey: string): Promise<CachedPermissions | null> {
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached && typeof cached === 'object') {
        return cached as CachedPermissions;
      }
    } catch (error) {
      this.logger.warn('L2 cache read error:', error);
    }
    return null;
  }

  private async setToL2Cache(cacheKey: string, permissions: CachedPermissions): Promise<void> {
    try {
      // 5-minute TTL for L2 cache
      await this.redisService.set(cacheKey, permissions, 300);
    } catch (error) {
      this.logger.warn('L2 cache write error:', error);
    }
  }

  /**
   * L3 (Database) Cache Operations
   */
  private async getFromL3Cache(
    userId: string, 
    tenantId?: number, 
    accountId?: number
  ): Promise<CachedPermissions | null> {
    try {
      const cacheKey = this.buildCacheKey(userId, tenantId, accountId);
      
      const cached = await this.prisma.permissionCache.findUnique({
        where: { cache_key: cacheKey },
      });

      if (cached && cached.expires_at > new Date()) {
        return {
          permissions: cached.permissions,
          roles: cached.roles,
          computed_at: cached.computed_at,
          expires_at: cached.expires_at,
          context: cached.context,
        };
      }

      // Clean up expired entries
      if (cached && cached.expires_at <= new Date()) {
        await this.prisma.permissionCache.delete({
          where: { cache_key: cacheKey },
        });
      }

    } catch (error) {
      this.logger.warn('L3 cache read error:', error);
    }
    return null;
  }

  private async setToL3Cache(
    userId: string,
    context: RequestContext,
    permissions: CachedPermissions
  ): Promise<void> {
    try {
      const cacheKey = this.buildCacheKey(userId, context.tenantId, context.accountId);
      const redisKey = `mono:perms:${userId}:${context.tenantId || 'global'}`;
      
      await this.prisma.permissionCache.upsert({
        where: { cache_key: cacheKey },
        create: {
          cache_key: cacheKey,
          namespace: 'permissions',
          user_id: parseInt(userId),
          tenant_id: context.tenantId || null,
          context: context.tier,
          permissions: permissions.permissions,
          roles: permissions.roles,
          computed_at: new Date(),
          expires_at: new Date(Date.now() + 300000), // 5 minutes
          in_redis: true,
          redis_key: redisKey,
          redis_ttl: 300,
        },
        update: {
          permissions: permissions.permissions,
          roles: permissions.roles,
          computed_at: new Date(),
          expires_at: new Date(Date.now() + 300000),
          in_redis: true,
          redis_key: redisKey,
          redis_ttl: 300,
        },
      });

    } catch (error) {
      this.logger.warn('L3 cache write error:', error);
    }
  }

  /**
   * Warm all cache layers from source data
   */
  private async warmAllCacheLayers(userId: string, context: RequestContext): Promise<void> {
    try {
      // Load fresh permissions from source
      const permissions = await this.loadPermissionsFromSource(userId, context.tenantId);
      
      if (permissions) {
        // Store in L3 (Database)
        await this.setToL3Cache(userId, context, permissions);
        
        // Store in L2 (Redis)
        const cacheKey = this.buildCacheKey(userId, context.tenantId, context.accountId);
        await this.setToL2Cache(cacheKey, permissions);
        
        this.logger.debug(`Warmed all cache layers for user ${userId}`);
      }

    } catch (error) {
      this.logger.error('Error warming cache layers:', error);
    }
  }

  /**
   * Load permissions from source (Permission Service)
   */
  private async loadPermissionsFromSource(
    userId: string, 
    tenantId?: number
  ): Promise<CachedPermissions | null> {
    try {
      const [userPermissions, userRoles] = await Promise.all([
        this.permissionService.getUserPermissions(userId),
        this.permissionService.getUserRoles(userId),
      ]);

      return {
        permissions: userPermissions.map(p => p.name),
        roles: userRoles.map(r => r.id),
        computed_at: new Date(),
        expires_at: new Date(Date.now() + 300000), // 5 minutes
        context: tenantId ? 'tenant' : 'platform',
      };

    } catch (error) {
      this.logger.error('Error loading permissions from source:', error);
      return null;
    }
  }

  /**
   * Build consistent cache keys
   */
  private buildCacheKey(userId: string, tenantId?: number, accountId?: number): string {
    const parts = ['mono', 'perms', userId];
    
    if (tenantId) {
      parts.push(`tenant:${tenantId}`);
    }
    
    if (accountId) {
      parts.push(`account:${accountId}`);
    }
    
    return parts.join(':');
  }

  /**
   * Extract tenant ID from request
   */
  private extractTenantFromRequest(req: FastifyRequest): number | undefined {
    // Check URL params first
    const params = (req as any).params;
    if (params?.tenantId) {
      return parseInt(params.tenantId);
    }

    // Check query params
    const query = req.query as any;
    if (query?.tenantId) {
      return parseInt(query.tenantId);
    }

    // Check request body
    const body = req.body as any;
    if (body?.tenantId) {
      return parseInt(body.tenantId);
    }

    // Extract from user context
    const user = (req as any).user;
    return user?.tenantId;
  }

  /**
   * Extract account ID from request
   */
  private extractAccountFromRequest(req: FastifyRequest): number | undefined {
    const params = (req as any).params;
    if (params?.accountId) {
      return parseInt(params.accountId);
    }

    const query = req.query as any;
    if (query?.accountId) {
      return parseInt(query.accountId);
    }

    const body = req.body as any;
    if (body?.accountId) {
      return parseInt(body.accountId);
    }

    const user = (req as any).user;
    return user?.accountId;
  }

  /**
   * Extract tier from route URL
   */
  private extractTierFromRoute(url: string): string {
    const tierMatch = url.match(/\/api\/v\d+\/(\w+)\//);
    if (tierMatch) {
      const tier = tierMatch[1];
      // Map URL segments to 5-tier architecture
      switch (tier) {
        case 'platform': return 'platform';
        case 'tenant': return 'tenant';
        case 'account': return 'account';
        case 'user': return 'user';
        case 'public': return 'public';
        default: return tier;
      }
    }
    return 'unknown';
  }

  /**
   * Add cache metadata to request for debugging
   */
  private addCacheMetadata(req: FastifyRequest, userId: string, context: RequestContext): void {
    (req as any).cacheMetadata = {
      userId,
      context,
      cacheKey: this.buildCacheKey(userId, context.tenantId, context.accountId),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Metrics Recording
   */
  private async recordCacheHit(layer: string, userId: string, context: RequestContext): Promise<void> {
    try {
      this.metricsService.incrementCacheHits(layer, context.tier);
      
      // Record in CacheMetrics table
      await this.prisma.cacheMetrics.create({
        data: {
          cache_level: layer,
          operation: 'read',
          hit_count: 1,
          miss_count: 0,
          user_id: parseInt(userId),
          tenant_id: context.tenantId || null,
          endpoint: context.path,
          response_time_ms: 0, // Will be updated by response middleware
          created_at: new Date(),
        },
      });

    } catch (error) {
      this.logger.warn('Error recording cache hit metrics:', error);
    }
  }

  private async recordCacheMiss(layer: string, userId: string, context: RequestContext): Promise<void> {
    try {
      this.metricsService.incrementCacheMisses(layer, context.tier);
      
      await this.prisma.cacheMetrics.create({
        data: {
          cache_level: layer,
          operation: 'read',
          hit_count: 0,
          miss_count: 1,
          user_id: parseInt(userId),
          tenant_id: context.tenantId || null,
          endpoint: context.path,
          response_time_ms: 0,
          created_at: new Date(),
        },
      });

    } catch (error) {
      this.logger.warn('Error recording cache miss metrics:', error);
    }
  }

  private async recordCacheError(userId: string, context: RequestContext, error: any): Promise<void> {
    try {
      this.metricsService.incrementCacheErrors('permission_middleware', context.tier);
      
      await this.prisma.cacheInvalidationLog.create({
        data: {
          action: 'cache_error',
          cache_key: this.buildCacheKey(userId, context.tenantId, context.accountId),
          affected_keys: [],
          reason: error.message || 'Unknown error',
          user_id: parseInt(userId),
          tenant_id: context.tenantId || null,
          created_at: new Date(),
        },
      });

    } catch (logError) {
      this.logger.error('Error recording cache error:', logError);
    }
  }
}

/**
 * Type definitions for cached permissions
 */
interface CachedPermissions {
  permissions: string[];
  roles: number[];
  computed_at: Date;
  expires_at: Date;
  context: string;
}

interface RequestContext {
  tenantId?: number;
  accountId?: number;
  tier: string;
  path: string;
  method: string;
}

/**
 * Cache invalidation helper for permission changes
 */
@Injectable()
export class PermissionCacheInvalidator {
  private readonly logger = new Logger(PermissionCacheInvalidator.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService,
  ) {}

  /**
   * Invalidate all permission caches for a user
   */
  async invalidateUserPermissions(userId: string, reason = 'permission_change'): Promise<void> {
    try {
      // Invalidate L2 (Redis) - all tenant/account combinations
      const pattern = `mono:perms:${userId}:*`;
      await this.redisService.del(pattern);

      // Invalidate L3 (Database)
      await this.prisma.permissionCache.deleteMany({
        where: { user_id: parseInt(userId) },
      });

      // Log invalidation
      await this.prisma.cacheInvalidationLog.create({
        data: {
          action: 'invalidate_user',
          cache_key: `user:${userId}`,
          affected_keys: [pattern],
          reason,
          user_id: parseInt(userId),
          tenant_id: null,
          created_at: new Date(),
        },
      });

      this.metricsService.incrementCacheInvalidations('user_permissions');
      this.logger.debug(`Invalidated permission cache for user ${userId}`);

    } catch (error) {
      this.logger.error(`Error invalidating user permissions for ${userId}:`, error);
    }
  }

  /**
   * Invalidate all caches for a tenant
   */
  async invalidateTenantPermissions(tenantId: number, reason = 'tenant_change'): Promise<void> {
    try {
      // Invalidate L2 (Redis)
      const pattern = `mono:perms:*:tenant:${tenantId}*`;
      await this.redisService.del(pattern);

      // Invalidate L3 (Database)
      await this.prisma.permissionCache.deleteMany({
        where: { tenant_id: tenantId },
      });

      // Log invalidation
      await this.prisma.cacheInvalidationLog.create({
        data: {
          action: 'invalidate_tenant',
          cache_key: `tenant:${tenantId}`,
          affected_keys: [pattern],
          reason,
          user_id: null,
          tenant_id: tenantId,
          created_at: new Date(),
        },
      });

      this.metricsService.incrementCacheInvalidations('tenant_permissions');
      this.logger.debug(`Invalidated permission cache for tenant ${tenantId}`);

    } catch (error) {
      this.logger.error(`Error invalidating tenant permissions for ${tenantId}:`, error);
    }
  }
}