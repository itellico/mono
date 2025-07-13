import { db } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';
import { Tenant } from '@prisma/client';

interface TenantFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  page?: number;
  limit?: number;
}

interface TenantResponse {
  tenants: Tenant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export class TenantsService {
  private readonly CACHE_TTL = 300; // 5 minutes as per cursor rules

  /**
   * Generate cache key for tenant queries following cursor rules pattern
   */
  private generateCacheKey(filters: TenantFilters): string {
    const filterString = JSON.stringify(filters);
    const hash = createHash('md5').update(filterString).digest('hex');
    // Admin tenants view is platform-wide, so use 'platform' as scope
    return `cache:platform:tenants:list:${hash}`;
  }

  /**
   * Generate cache key for tenant statistics
   */
  private getStatsCacheKey(): string {
    // Platform-wide tenant statistics
    return 'cache:platform:tenants:stats';
  }

  /**
   * Generate cache key for single tenant
   */
  private getSingleTenantCacheKey(tenantId: number): string {
    return `cache:platform:tenants:${tenantId}`;
  }

  /**
   * Get all tenants with caching and filtering
   */
  async getAll(filters: TenantFilters = {}): Promise<TenantResponse> {
    const cacheKey = this.generateCacheKey(filters);

    try {
      // Try to get from Redis cache first
      const redis = await getRedisClient();
      const cachedResult = await redis.get(cacheKey);
      if (cachedResult) {
        logger.debug('Tenants retrieved from cache', { cacheKey, filters });
        return JSON.parse(cachedResult);
      }
    } catch (error: any) {
      logger.warn('Redis cache read failed, continuing with database', {
        error: error.message,
        cacheKey
      });
    }

    // Get from database
    const result = await this.queryDatabase(filters);

    try {
      // Cache the result
      const redis = await getRedisClient();
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      logger.debug('Tenants cached successfully', { cacheKey, count: result.tenants.length });
    } catch (error: any) {
      logger.warn('Redis cache write failed', { error: error.message, cacheKey });
    }

    return result;
  }

  /**
   * Query database for tenants with filters
   */
  private async queryDatabase(filters: TenantFilters): Promise<TenantResponse> {
    const {
      search = '',
      status = 'all',
      page = 1,
      limit = 20
    } = filters;

    const offset = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    const whereConditions: any = {};

    // Search filter
    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Status filter
    if (status === 'active') {
      whereConditions.isActive = true;
    } else if (status === 'inactive') {
      whereConditions.isActive = false;
    }

    const tenantsResult = await db.tenant.findMany({
      where: whereConditions,
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: take,
    });

    const totalCount = await db.tenant.count({
      where: whereConditions,
    });

    logger.info('Tenants retrieved from database', {
      count: tenantsResult.length,
      total: totalCount,
      filters
    });

    return {
      tenants: tenantsResult,
      pagination: {
        page,
        limit: take,
        total: totalCount,
        totalPages: Math.ceil(totalCount / take),
        hasMore: offset + take < totalCount
      }
    };
  }

  /**
   * Get single tenant by ID with caching
   */
  async getById(tenantId: number): Promise<Tenant | null> {
    const cacheKey = this.getSingleTenantCacheKey(tenantId);

    try {
      const redis = await getRedisClient();
      const cachedTenant = await redis.get(cacheKey);
      if (cachedTenant) {
        logger.debug('Single tenant retrieved from cache', { cacheKey, tenantId });
        return JSON.parse(cachedTenant);
      }
    } catch (error: any) {
      logger.warn('Redis cache read failed for single tenant', {
        error: error.message,
        cacheKey,
        tenantId
      });
    }

    // Get from database
    const tenant = await db.tenant.findUnique({
      where: {
        id: tenantId,
      },
    });

    if (tenant) {
      try {
        // Cache the single tenant
        const redis = await getRedisClient();
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(tenant));
        logger.debug('Single tenant cached successfully', { cacheKey, tenantId });
      } catch (error: any) {
        logger.warn('Redis cache write failed for single tenant', {
          error: error.message,
          cacheKey,
          tenantId
        });
      }
    }

    return tenant;
  }

  /**
   * Create a new tenant and invalidate cache
   */
  async create(tenantData: {
    name: string;
    slug: string;
    domain?: string;
    description?: any;
    features?: any;
    settings?: any;
    categories?: any;
    allowedCountries?: any;
    defaultCurrency?: string;
  }): Promise<Tenant> {
    const newTenant = await db.tenant.create({
      data: {
        name: tenantData.name,
        slug: tenantData.slug,
        domain: tenantData.domain || '', // Prisma requires non-nullable string
        description: tenantData.description || null,
        features: tenantData.features || null,
        settings: tenantData.settings || null,
        categories: tenantData.categories || null,
        allowedCountries: tenantData.allowedCountries || null,
        defaultCurrency: tenantData.defaultCurrency || null,
        isActive: true,
      },
    });

    // Invalidate all tenant caches (cursor rules compliant)
    await this.invalidateCache();

    logger.info('New tenant created', {
      tenantId: newTenant.id,
      tenantName: newTenant.name,
      tenantDomain: newTenant.domain
    });

    return newTenant;
  }

  /**
   * Update tenant and invalidate cache
   */
  async update(id: number, updates: Partial<Tenant>): Promise<Tenant> {
    const updatedTenant = await db.tenant.update({
      where: {
        id: id,
      },
      data: updates,
    });

    // Invalidate all tenant caches (cursor rules compliant)
    await this.invalidateCache();

    logger.info('Tenant updated', { tenantId: id, updates });

    return updatedTenant;
  }

  /**
   * Delete tenant and invalidate cache
   */
  async delete(id: number): Promise<Tenant> {
    const deletedTenant = await db.tenant.delete({
      where: {
        id: id,
      },
    });

    // Invalidate all tenant caches (cursor rules compliant)
    await this.invalidateCache();

    logger.info('Tenant deleted', { tenantId: id });

    return deletedTenant;
  }

  /**
   * Invalidate all tenant-related cache keys
   */
  async invalidateCache(): Promise<void> {
    try {
      // Get all keys matching platform tenant cache pattern (cursor rules compliant)
      const redis = await getRedisClient();
      const keys = await redis.keys('cache:platform:tenants:*');
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info('Tenant cache invalidated', { keysCleared: keys.length });
      }
    } catch (error: any) {
      logger.warn('Cache invalidation failed', { error: error.message });
    }
  }

  /**
   * Get tenant statistics (cached)
   */
  async getStats() {
    const cacheKey = this.getStatsCacheKey();

    try {
      const redis = await getRedisClient();
      const cachedStats = await redis.get(cacheKey);
      if (cachedStats) {
        return JSON.parse(cachedStats);
      }
    } catch (error: any) {
      logger.warn('Stats cache read failed', { error: error.message });
    }

    // Calculate stats from database
    const totalCount = await db.tenant.count();
    const activeCount = await db.tenant.count({
      where: { isActive: true },
    });

    const stats = {
      total: totalCount,
      active: activeCount,
      inactive: totalCount - activeCount
    };

    try {
      const redis = await getRedisClient();
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(stats));
    } catch (error: any) {
      logger.warn('Stats cache write failed', { error: error.message });
    }

    return stats;
  }
}

// Export singleton instance
export const tenantsService = new TenantsService();