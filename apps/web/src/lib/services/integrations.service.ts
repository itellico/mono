import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { AuditService } from '@/lib/services/audit.service';
import type {
  Integration,
  TenantIntegration,
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
  CreateTenantIntegrationRequest,
  UpdateTenantIntegrationRequest,
  IntegrationsListQuery,
  TenantIntegrationsListQuery,
  IntegrationStatistics,
  TenantIntegrationStatistics,
  IntegrationCategory,
  IntegrationStatus
} from '@prisma/client';

interface PaginatedIntegrations {
  data: Integration[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PaginatedTenantIntegrations {
  data: (TenantIntegration & { integration: Integration })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Redis cache configuration
const CACHE_CONFIG = {
  TTL: {
    INTEGRATIONS_LIST: 30 * 60, // 30 minutes - integrations are relatively static
    INTEGRATION_DETAIL: 30 * 60, // 30 minutes
    TENANT_INTEGRATIONS: 15 * 60, // 15 minutes - more dynamic
    STATISTICS: 10 * 60, // 10 minutes - can change frequently
  },
  KEYS: {
    // Global integrations (platform-wide)
    INTEGRATIONS_LIST: (paramsHash: string) => `cache:global:integrations:list:${paramsHash}`,
    INTEGRATION_DETAIL: (slug: string) => `cache:global:integrations:${slug}`,
    INTEGRATION_EXISTS: (slug: string) => `cache:global:integrations:exists:${slug}`,
    STATISTICS: () => `cache:global:integrations:stats`,

    // Tenant-specific integrations
    TENANT_INTEGRATIONS: (tenantId: number, paramsHash: string) => `cache:${tenantId}:integrations:list:${paramsHash}`,
    TENANT_INTEGRATION: (tenantId: number, slug: string) => `cache:${tenantId}:integrations:${slug}`,
    TENANT_STATISTICS: (tenantId: number) => `cache:${tenantId}:integrations:stats`,
    AVAILABLE_INTEGRATIONS: (tenantId: number) => `cache:${tenantId}:integrations:available`,
  },
  TAGS: ['integrations'], // For Next.js cache invalidation
};

// Helper functions
const toDate = (date: string | null | undefined): Date | null => {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
};

const toIntegration = (dbIntegration: any): Integration => {
  if (!dbIntegration) return dbIntegration;
  return {
    ...dbIntegration,
    createdAt: new Date(dbIntegration.createdAt),
    updatedAt: toDate(dbIntegration.updatedAt),
  };
};

const toTenantIntegration = (dbTenantInt: any): TenantIntegration => {
  if (!dbTenantInt) return dbTenantInt;
  return {
    ...dbTenantInt,
    createdAt: new Date(dbTenantInt.createdAt),
    updatedAt: toDate(dbTenantInt.updatedAt),
    lastSyncedAt: toDate(dbTenantInt.lastSyncedAt),
    lastErrorAt: toDate(dbTenantInt.lastErrorAt),
  };
};

// Cache key generator with deterministic hashing
const generateCacheKey = (params: Record<string, any>): string => {
  const normalizedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      if (params[key] !== undefined && params[key] !== null) {
        acc[key] = params[key];
      }
      return acc;
    }, {} as Record<string, any>);

  return createHash('md5').update(JSON.stringify(normalizedParams)).digest('hex');
};

// Redis cache utilities
class IntegrationsCache {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const redis = await getRedisClient();
      const cached = await redis.get(key);
      if (cached) {
        logger.info('Cache hit', { key });
        return JSON.parse(cached);
      }
      logger.info('Cache miss', { key });
      return null;
    } catch (error) {
      logger.error('Redis cache get error', { key, error: error instanceof Error ? error.message : 'Unknown error' });
      return null; // Graceful degradation
    }
  }

  static async set<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      const redis = await getRedisClient();
      await redis.setex(key, ttl, JSON.stringify(data));
      logger.info('Cache set', { key, ttl });
    } catch (error) {
      logger.error('Redis cache set error', { key, error: error instanceof Error ? error.message : 'Unknown error' });
      // Don't throw - graceful degradation
    }
  }

  static async del(pattern: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info('Cache invalidated', { pattern, keysDeleted: keys.length });
      }
    } catch (error) {
      logger.error('Redis cache invalidation error', { pattern, error: error instanceof Error ? error.message : 'Unknown error' });
      // Don't throw - graceful degradation
    }
  }

  // Batch invalidation for mutations
  static async invalidateIntegrationsCache(): Promise<void> {
    await Promise.all([
      this.del('cache:global:integrations:*'),
      this.del('cache:*:integrations:*'), // All tenant integrations
    ]);

    // Invalidate Next.js cache
    try {
      const { revalidateTag } = await import('next/cache');
      revalidateTag('integrations');
    } catch (error) {
      logger.error('Next.js cache invalidation error', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

export class IntegrationsService {
  /**
   * Get all system integrations with Redis caching (Admin only)
   */
  static async getIntegrations(params: IntegrationsListQuery = {}): Promise<PaginatedIntegrations> {
    const { 
      category, 
      enabled, 
      search, 
      page = 1, 
      limit = 50, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = params;

    const offset = (page - 1) * limit;
    const paramsHash = generateCacheKey(params);
    const cacheKey = CACHE_CONFIG.KEYS.INTEGRATIONS_LIST(paramsHash);

    try {
      logger.info('Getting system integrations', { params });

      // Try cache first
      const cached = await IntegrationsCache.get<PaginatedIntegrations>(cacheKey);
      if (cached) {
        logger.info('Returning cached integrations', { paramsHash });
        return cached;
      }

      // Cache miss - fetch from database
      logger.info('Cache miss - fetching integrations from database', { paramsHash });

      // Build where conditions
      const whereConditions: any = {};
      if (category) {
        whereConditions.category = category;
      }
      if (enabled !== undefined) {
        whereConditions.enabled = enabled;
      }
      if (search) {
        whereConditions.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const orderBy: any = {};
      if (sortBy === 'name') {
        orderBy.name = sortOrder;
      } else if (sortBy === 'category') {
        orderBy.category = sortOrder;
      } else if (sortBy === 'createdAt') {
        orderBy.createdAt = sortOrder;
      } else if (sortBy === 'updatedAt') {
        orderBy.updatedAt = sortOrder;
      }

      const [items, total] = await prisma.$transaction([
        prisma.integration.findMany({
          where: whereConditions,
          orderBy: orderBy,
          take: limit,
          skip: offset,
        }),
        prisma.integration.count({
          where: whereConditions,
        }),
      ]);

      const result: PaginatedIntegrations = {
        data: items.map(toIntegration),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };

      // Cache the result
      await IntegrationsCache.set(cacheKey, result, CACHE_CONFIG.TTL.INTEGRATIONS_LIST);

      logger.info('System integrations retrieved and cached', {
        count: items.length,
        total,
        page,
        limit,
        paramsHash
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching system integrations', { error: errorMessage, params });
      throw error;
    }
  }

  /**
   * Get integration by slug with Redis caching
   */
  static async getIntegrationBySlug(slug: string): Promise<Integration | null> {
    const cacheKey = CACHE_CONFIG.KEYS.INTEGRATION_DETAIL(slug);

    try {
      logger.info('Getting integration by slug', { slug });

      // Try cache first
      const cached = await IntegrationsCache.get<Integration | null>(cacheKey);
      if (cached !== null) {
        logger.info('Returning cached integration', { slug });
        return cached;
      }

      // Cache miss - fetch from database
      logger.info('Cache miss - fetching integration from database', { slug });

      const integration = await prisma.integration.findUnique({
        where: { slug: slug },
      });

      const result = integration ? toIntegration(integration) : null;

      // Cache the result (including null results to prevent repeated DB queries)
      await IntegrationsCache.set(cacheKey, result, CACHE_CONFIG.TTL.INTEGRATION_DETAIL);

      if (!result) {
        logger.warn('Integration not found', { slug });
      } else {
        logger.info('Integration retrieved and cached', { slug });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching integration by slug', { error: errorMessage, slug });
      throw error;
    }
  }

  /**
   * Create new integration with cache invalidation (Admin only)
   */
  static async createIntegration(data: CreateIntegrationRequest): Promise<Integration> {
    try {
      logger.info('Creating new integration', { slug: data.slug, name: data.name });

      const integration = await prisma.integration.create({
        data: {
          ...data,
          enabled: data.enabled ?? true,
          isTemporalEnabled: data.isTemporalEnabled ?? true,
          version: data.version ?? '1.0.0',
          requiresAuth: data.requiresAuth ?? true,
          defaultSettings: data.defaultSettings ?? {}
        },
      });

      // Audit logging
      await AuditService.logEntityChange(
        0, // tenantId (global integration)
        'integration',
        integration.id.toString(),
        'create',
        0, // TODO: Replace with actual userId
        null,
        integration,
        { slug: integration.slug, name: integration.name }
      );

      // Invalidate all related caches
      await IntegrationsCache.invalidateIntegrationsCache();

      logger.info('Integration created and cache invalidated', { slug: integration.slug });
      return toIntegration(integration);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error creating integration', { error: errorMessage, slug: data.slug });
      throw error;
    }
  }

  /**
   * Update integration with cache invalidation (Admin only)
   */
  static async updateIntegration(slug: string, data: UpdateIntegrationRequest): Promise<Integration | null> {
    try {
      logger.info('Updating integration', { slug });

      const existingIntegration = await prisma.integration.findUnique({
        where: { slug: slug },
      });

      if (!existingIntegration) {
        logger.warn('Integration not found for update', { slug });
        return null;
      }

      const integration = await prisma.integration.update({
        where: { slug: slug },
        data: {
          ...data,
          updatedAt: new Date()
        },
      });

      // Audit logging
      await AuditService.logEntityChange(
        0, // tenantId (global integration)
        'integration',
        integration.id.toString(),
        'update',
        0, // TODO: Replace with actual userId
        existingIntegration,
        integration,
        { slug: integration.slug, name: integration.name }
      );

      // Invalidate all related caches
      await IntegrationsCache.invalidateIntegrationsCache();

      logger.info('Integration updated and cache invalidated', { slug });
      return toIntegration(integration);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error updating integration', { error: errorMessage, slug });
      throw error;
    }
  }

  /**
   * Delete integration with cache invalidation (Admin only)
   */
  static async deleteIntegration(slug: string): Promise<Integration | null> {
    try {
      logger.info('Deleting integration', { slug });

      const existingIntegration = await prisma.integration.findUnique({
        where: { slug: slug },
      });

      if (!existingIntegration) {
        logger.warn('Integration not found for deletion', { slug });
        return null;
      }

      const integration = await prisma.integration.delete({
        where: { slug: slug },
      });

      // Audit logging
      await AuditService.logEntityChange(
        0, // tenantId (global integration)
        'integration',
        integration.id.toString(),
        'delete',
        0, // TODO: Replace with actual userId
        existingIntegration,
        null,
        { slug: integration.slug, name: integration.name }
      );

      // Invalidate all related caches
      await IntegrationsCache.invalidateIntegrationsCache();

      logger.info('Integration deleted and cache invalidated', { slug });
      return toIntegration(integration);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error deleting integration', { error: errorMessage, slug });
      throw error;
    }
  }

  /**
   * Get tenant integrations
   */
  static async getTenantIntegrations(tenantId: number, params: TenantIntegrationsListQuery = {}): Promise<PaginatedTenantIntegrations> {
    const { 
      status, 
      category, 
      search, 
      page = 1, 
      limit = 50, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = params;

    const offset = (page - 1) * limit;

    try {
      logger.info('Getting tenant integrations', { tenantId, params });

      const whereConditions: any = { tenantId: tenantId };
      if (status) {
        whereConditions.status = status;
      }
      if (category) {
        whereConditions.integration = { category: category };
      }
      if (search) {
        whereConditions.OR = [
          { integration: { name: { contains: search, mode: 'insensitive' } } },
          { integration: { slug: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const orderBy: any = {};
      if (sortBy === 'name') {
        orderBy.integration = { name: sortOrder };
      } else if (sortBy === 'status') {
        orderBy.status = sortOrder;
      } else if (sortBy === 'lastSyncedAt') {
        orderBy.lastSyncedAt = sortOrder;
      } else if (sortBy === 'createdAt') {
        orderBy.createdAt = sortOrder;
      }

      const [items, total] = await prisma.$transaction([
        prisma.tenantIntegration.findMany({
          where: whereConditions,
          include: { integration: true },
          orderBy: orderBy,
          take: limit,
          skip: offset,
        }),
        prisma.tenantIntegration.count({
          where: whereConditions,
        }),
      ]);

      logger.info('Tenant integrations retrieved successfully', {
        tenantId,
        count: items.length,
        total,
        page,
        limit
      });

      return {
        data: items.map(item => ({
          ...toTenantIntegration(item),
          integration: item.integration ? toIntegration(item.integration) : undefined,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching tenant integrations', { error: errorMessage, tenantId, params });
      throw error;
    }
  }

  /**
   * Get available integrations for tenant (not yet enabled)
   */
  static async getAvailableIntegrations(tenantId: number): Promise<Integration[]> {
    try {
      logger.info('Getting available integrations for tenant', { tenantId });

      const enabledIntegrations = await prisma.integration.findMany({
        where: { enabled: true },
      });

      const tenantConfiguredSlugs = await prisma.tenantIntegration.findMany({
        where: { tenantId: tenantId },
        select: { integrationSlug: true },
      });

      const configuredSlugs = tenantConfiguredSlugs.map(t => t.integrationSlug);
      const availableIntegrations = enabledIntegrations.filter(
        integration => !configuredSlugs.includes(integration.slug)
      );

      logger.info('Available integrations retrieved successfully', {
        tenantId,
        total: availableIntegrations.length,
        configured: configuredSlugs.length
      });

      return availableIntegrations.map(toIntegration);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching available integrations', { error: errorMessage, tenantId });
      throw error;
    }
  }

  /**
   * Enable integration for tenant
   */
  static async enableTenantIntegration(tenantId: number, data: CreateTenantIntegrationRequest, userId?: number): Promise<TenantIntegration> {
    try {
      logger.info('Enabling tenant integration', { tenantId, integrationSlug: data.integrationSlug });

      const integration = await this.getIntegrationBySlug(data.integrationSlug);
      if (!integration || !integration.enabled) {
        logger.warn('Integration not found or disabled', { slug: data.integrationSlug });
        throw new Error('Integration not available');
      }

      const existing = await prisma.tenantIntegration.findMany({
        where: {
          tenantId: tenantId,
          integrationSlug: data.integrationSlug,
        },
      });

      if (existing.length > 0) {
        logger.warn('Integration already enabled for tenant', { tenantId, integrationSlug: data.integrationSlug });
        throw new Error('Integration already enabled');
      }

      const tenantIntegration = await prisma.tenantIntegration.create({
        data: {
          tenantId,
          integrationSlug: data.integrationSlug,
          status: 'active',
          settings: data.settings ?? integration.defaultSettings ?? {},
          fieldMappings: data.fieldMappings ?? {},
          isTestMode: data.isTestMode ?? false,
          createdBy: userId,
        },
      });

      logger.info('Tenant integration enabled successfully', { 
        tenantId, 
        integrationSlug: data.integrationSlug,
        tenantIntegrationId: tenantIntegration.id 
      });

      return toTenantIntegration(tenantIntegration);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error enabling tenant integration', { 
        error: errorMessage, 
        tenantId, 
        integrationSlug: data.integrationSlug 
      });
      throw error;
    }
  }

  /**
   * Update tenant integration
   */
  static async updateTenantIntegration(tenantId: number, integrationSlug: string, data: UpdateTenantIntegrationRequest): Promise<TenantIntegration | null> {
    try {
      logger.info('Updating tenant integration', { tenantId, integrationSlug, data });

      const tenantIntegration = await prisma.tenantIntegration.update({
        where: {
          tenantId_integrationSlug: {
            tenantId: tenantId,
            integrationSlug: integrationSlug,
          },
        },
        data: {
          ...data,
          updatedAt: new Date()
        },
      });

      if (!tenantIntegration) {
        logger.warn('Tenant integration not found for update', { tenantId, integrationSlug });
        return null;
      }

      logger.info('Tenant integration updated successfully', { tenantId, integrationSlug });
      return toTenantIntegration(tenantIntegration);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error updating tenant integration', { 
        error: errorMessage, 
        tenantId, 
        integrationSlug 
      });
      throw error;
    }
  }

  /**
   * Disable tenant integration
   */
  static async disableTenantIntegration(tenantId: number, integrationSlug: string): Promise<TenantIntegration | null> {
    try {
      logger.info('Disabling tenant integration', { tenantId, integrationSlug });

      const tenantIntegration = await prisma.tenantIntegration.update({
        where: {
          tenantId_integrationSlug: {
            tenantId: tenantId,
            integrationSlug: integrationSlug,
          },
        },
        data: { status: 'disabled', updatedAt: new Date() },
      });

      if (!tenantIntegration) {
        logger.warn('Tenant integration not found for deletion', { tenantId, integrationSlug });
        return null;
      }

      logger.info('Tenant integration disabled successfully', { tenantId, integrationSlug });
      return toTenantIntegration(tenantIntegration);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error disabling tenant integration', { 
        error: errorMessage, 
        tenantId, 
        integrationSlug 
      });
      throw error;
    }
  }

  /**
   * Get integration statistics (Admin)
   */
  static async getIntegrationStatistics(): Promise<IntegrationStatistics> {
    try {
      logger.info('Getting integration statistics');

      const [totalResult, enabledResult, categoryResult] = await prisma.$transaction([
        prisma.integration.count(),
        prisma.integration.count({ where: { enabled: true } }),
        prisma.integration.groupBy({
          by: ['category'],
          _count: { id: true },
        }),
      ]);

      const categoryCounts = categoryResult.reduce((acc, row) => {
        acc[row.category] = row._count.id;
        return acc;
      }, {} as Record<IntegrationCategory, number>);

      const stats = {
        totalIntegrations: totalResult || 0,
        enabledIntegrations: enabledResult || 0,
        categoryCounts
      };

      logger.info('Integration statistics retrieved successfully', stats);
      return stats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching integration statistics', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Get tenant integration statistics
   */
  static async getTenantIntegrationStatistics(tenantId: number): Promise<TenantIntegrationStatistics> {
    try {
      logger.info('Getting tenant integration statistics', { tenantId });

      const [
        totalResult,
        activeResult,
        syncErrorResult,
        lastSyncResult,
        statusResult,
        categoryResult
      ] = await prisma.$transaction([
        prisma.tenantIntegration.count({ where: { tenantId: tenantId } }),
        prisma.tenantIntegration.count({ where: { tenantId: tenantId, status: 'active' } }),
        prisma.tenantIntegration.aggregate({
          _sum: { syncCount: true, errorCount: true },
          where: { tenantId: tenantId },
        }),
        prisma.tenantIntegration.aggregate({
          _max: { lastSyncedAt: true },
          where: { tenantId: tenantId },
        }),
        prisma.tenantIntegration.groupBy({
          by: ['status'],
          _count: { id: true },
          where: { tenantId: tenantId },
        }),
        prisma.tenantIntegration.groupBy({
          by: ['integrationSlug'],
          _count: { id: true },
          where: { tenantId: tenantId },
        }).then(async (res) => {
          const categories = await prisma.integration.findMany({
            where: { slug: { in: res.map(r => r.integrationSlug) } },
            select: { slug: true, category: true },
          });
          const categoryMap = new Map(categories.map(c => [c.slug, c.category]));
          return res.reduce((acc, row) => {
            const category = categoryMap.get(row.integrationSlug);
            if (category) {
              acc[category] = (acc[category] || 0) + row._count.id;
            }
            return acc;
          }, {} as Record<IntegrationCategory, number>);
        }),
      ]);

      const statusCounts = statusResult.reduce((acc, row) => {
        acc[row.status] = row._count.id;
        return acc;
      }, {} as Record<IntegrationStatus, number>);

      const stats = {
        totalIntegrations: totalResult || 0,
        activeIntegrations: activeResult || 0,
        totalSyncs: syncErrorResult._sum.syncCount || 0,
        totalErrors: syncErrorResult._sum.errorCount || 0,
        lastSyncDate: lastSyncResult._max.lastSyncedAt || null,
        statusCounts,
        categoryCounts: categoryResult,
      };

      logger.info('Tenant integration statistics retrieved successfully', { tenantId });
      return stats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching tenant integration statistics', { error: errorMessage, tenantId });
      throw error;
    }
  }

  /**
   * Update sync statistics after integration execution
   */
  static async updateSyncStatistics(
    tenantId: number, 
    integrationSlug: string, 
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      logger.info('Updating sync statistics', { tenantId, integrationSlug, success });

      const updateData = success
        ? { 
            lastSyncedAt: new Date(),
            syncCount: { increment: 1 }
          }
        : { 
            lastErrorAt: new Date(),
            lastErrorMessage: errorMessage,
            errorCount: { increment: 1 }
          };

      await prisma.tenantIntegration.update({
        where: {
          tenantId_integrationSlug: {
            tenantId: tenantId,
            integrationSlug: integrationSlug,
          },
        },
        data: updateData,
      });

      logger.info('Sync statistics updated successfully', { tenantId, integrationSlug, success });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error updating sync statistics', { 
        error: errorMessage, 
        tenantId, 
        integrationSlug 
      });
      throw error;
    }
  }
}
