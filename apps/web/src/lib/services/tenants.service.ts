// ✅ ARCHITECTURE COMPLIANCE: Removed direct database imports
// import { db } from '@/lib/db'; // ❌ FORBIDDEN: Direct database access
import { unstable_cache } from 'next/cache';
import { logger } from '@/lib/logger';
import { TenantsApiService } from '@/lib/api-clients/tenants-api.service';
import { cache } from '@/lib/cache';
import { CacheInvalidationService } from '@/lib/cache/cache-invalidation.service';
// Note: Audit and Cache services still need to be migrated separately



// ✅ ARCHITECTURE COMPLIANCE: Removed TenantWhereClause since we use API instead of direct DB queries

export interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  newTenantsToday: number;
}

export interface TenantFilters {
  statuses: { value: string; label: string; count: number }[];
  currencies: { value: string; label: string; count: number }[];
}

export interface TenantListItem {
  id: string; // Internal database ID as string
  uuid: string; // UUID for external use
  name: string;
  domain: string;
  slug: string | null;
  description: unknown;
  defaultCurrency: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  accountCount: number;
  status: string;
  // ✅ FIXED: Add contact and configuration fields
  contactEmail: string;
  contactPhone: string;
  plan: string;
  currency: string;
  timezone: string;
}

export interface TenantsPageData {
  stats: TenantStats;
  tenants: TenantListItem[];
  filters: TenantFilters;
}

export interface GetTenantsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  currency?: string;
  userCountRange?: string;
}

export interface GetTenantsResponse {
  tenants: TenantListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ✅ TDD: Interface for simple tenant creation
export interface CreateTenantData {
  name: string;
  email: string;
  primaryCurrency: string;
  domain?: string;
  slug?: string;
  description?: string;
}

export interface CreateTenantResult {
  success: boolean;
  tenant?: TenantListItem;
  errors?: string[];
  error?: string;
}

/**
 * TenantsService - itellico Mono Service Layer Implementation
 * 
 * ✅ mono PLATFORM COMPLIANCE:
 * - Uses unified cache middleware with CONSISTENT cache key naming
 * - Implements three-layer caching coordination
 * - Proper tenant isolation
 * - Audit logging integration
 * - Redis graceful degradation
 * - Service layer with cache coordination
 */
export class TenantsService {
  private readonly VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'AUD', 'CHF', 'CNY'];
  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
   * Get all tenants with three-layer caching
   * ✅ FIXED: Consistent cache key naming per cursor rules
   */
  async getAll(params: GetTenantsParams = {}): Promise<GetTenantsResponse> {
    try {
      // ✅ FIXED: Use consistent cache key naming: global:{entity}:list:{filters_hash}
      const redisCacheKey = `global:tenants:list:${this.createCacheKey(params)}`;
      const cachedResult = await cache.get<GetTenantsResponse>(redisCacheKey);
      if (cachedResult) {
        logger.info('Tenants retrieved from Redis cache', {
          source: 'redis',
          tenantCount: cachedResult.tenants.length,
          pagination: cachedResult.pagination,
          cacheKey: redisCacheKey
        });
        return cachedResult;
      }

      // LAYER 1: Use Next.js unstable_cache with Redis fallback
      const nextCacheKey = `tenants-list-${JSON.stringify(params)}`;
      
      const fetchData = async (): Promise<GetTenantsResponse> => {
        logger.info('Fetching tenants from NestJS API', { params });
        
        // ✅ ARCHITECTURE COMPLIANCE: Use API instead of direct database access
        const apiResult = await TenantsApiService.getTenants({
          page: params.page,
          limit: params.limit,
          search: params.search,
          status: params.status as any,
        });

        if (!apiResult) {
          throw new Error('Failed to fetch tenants from API');
        }

        const result: GetTenantsResponse = {
          tenants: apiResult.items.map(tenant => this.apiTenantToListItem(tenant)),
          pagination: apiResult.pagination
        };
        
        // LAYER 2: Cache in Redis via unified cache middleware with consistent naming
        try {
          await cache.set(redisCacheKey, result, { 
            ttl: 5 * 60, 
            tags: ['tenants', 'tenants-list', 'global'] 
          });
          logger.info('Tenants cached in Redis', { cacheKey: redisCacheKey });
        } catch (cacheError) {
          logger.warn('Redis cache write failed for tenants list', { error: cacheError });
        }
        
        return result;
      };

      try {
        return await unstable_cache(
          fetchData,
          [nextCacheKey],
          {
            revalidate: 5 * 60, // 5 minutes
            tags: ['tenants', 'tenants-list']
          }
        )();
      } catch (_cacheError) {
        // If unstable_cache fails, execute directly
        logger.info('Next.js cache not available, executing directly');
        return await fetchData();
      }

    } catch (error) {
      logger.error('Failed to get tenants', {
        error: error instanceof Error ? error.message : 'Unknown error',
        params
      });
      throw error;
    }
  }

  /**
   * ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
   * Get tenant by UUID with three-layer caching
   * ✅ FIXED: Consistent cache key naming per cursor rules
   */
  async getTenantByUuid(uuid: string): Promise<TenantListItem | null> {
    try {
      // ✅ FIXED: Use consistent cache key naming: global:{entity}:{id}
      const redisCacheKey = `global:tenants:${uuid}`;
      const cachedTenant = await cache.get<TenantListItem>(redisCacheKey);
      if (cachedTenant) {
        logger.info('Tenant retrieved from Redis cache', { 
          uuid, 
          source: 'redis',
          cacheKey: redisCacheKey 
        });
        return cachedTenant;
      }

      // LAYER 1: Use Next.js unstable_cache
      const cacheKey = `tenant-${uuid}`;
      
      const fetchData = async (): Promise<TenantListItem | null> => {
        logger.info('Fetching tenant from NestJS API', { uuid });
        
        // ✅ ARCHITECTURE COMPLIANCE: Use API instead of direct database access
        const apiTenant = await TenantsApiService.getTenant(uuid);

        if (!apiTenant) {
          return null;
        }

        const tenantListItem = this.apiTenantToListItem(apiTenant);
        
        // LAYER 2: Cache in Redis with consistent naming
        try {
          await cache.set(redisCacheKey, tenantListItem, { 
            ttl: 5 * 60, 
            tags: ['tenants', `tenant:${uuid}`, 'global'] 
          });
          logger.info('Tenant cached in Redis', { uuid, cacheKey: redisCacheKey });
        } catch (cacheError) {
          logger.warn('Redis cache write failed for tenant', { uuid, error: cacheError });
        }
        
        return tenantListItem;
      };

      try {
        return await unstable_cache(
          fetchData,
          [cacheKey],
          {
            revalidate: 5 * 60,
            tags: ['tenants', `tenant:${uuid}`]
          }
        )();
      } catch (_cacheError) {
        logger.info('Next.js cache not available, executing directly');
        return await fetchData();
      }

    } catch (error) {
      logger.error('Failed to get tenant by UUID', { uuid, error });
      throw error;
    }
  }

  /**
   * ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
   * Create tenant with full three-layer cache coordination
   */
  async create(data: CreateTenantData, userId: string): Promise<CreateTenantResult> {
    try {
      // Validation
      if (!data.name || data.name.trim().length === 0) {
        return { success: false, errors: ['Name is required'] };
      }

      if (!data.email || !this.EMAIL_REGEX.test(data.email)) {
        return { success: false, errors: ['Valid email is required'] };
      }

      if (!data.primaryCurrency || !this.VALID_CURRENCIES.includes(data.primaryCurrency)) {
        return { success: false, errors: ['Valid primary currency is required'] };
      }

      // Generate domain if not provided
      const domain = data.domain || `${data.name.toLowerCase().replace(/\s+/g, '-')}.example.com`;
      const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-');

      // ✅ ARCHITECTURE COMPLIANCE: Use API instead of direct database access
      const apiTenant = await TenantsApiService.createTenant({
        name: data.name,
        domain,
        slug,
        description: data.description || '',
        defaultCurrency: data.primaryCurrency,
        isActive: true,
        contactEmail: data.email
      });

      if (!apiTenant) {
        return {
          success: false,
          error: 'Failed to create tenant via API'
        };
      }

      const tenantListItem = this.apiTenantToListItem(apiTenant);

      // ✅ THREE-LAYER CACHE INVALIDATION
      await this.invalidateAllCaches();

      logger.info('Tenant created successfully', {
        tenantUuid: apiTenant.uuid,
        name: data.name,
        domain,
        userId
      });

      return {
        success: true,
        tenant: tenantListItem
      };

    } catch (error) {
      logger.error('Failed to create tenant', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { ...data, email: '[EMAIL]' },
        userId
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
   * Update tenant with full cache coordination
   */
  async updateTenantByUuid(
    tenantUuid: string, 
    updateData: Partial<{
      name: string;
      domain: string;
      slug: string;
      description: unknown;
      defaultCurrency: string;
      isActive: boolean;
      settings: unknown;
      features: unknown;
      contactEmail: string;
      contactPhone: string;
      status: string;
      plan: string;
      currency: string;
      timezone: string;
    }>,
    userId?: string
  ): Promise<TenantListItem | null> {
    try {
      // Get current tenant for audit logging
      const currentTenant = await this.getTenantByUuid(tenantUuid);
      if (!currentTenant) {
        logger.warn('Tenant not found for update', { tenantUuid });
        return null;
      }

      // ✅ ARCHITECTURE COMPLIANCE: Use API instead of direct database access
      const updatedApiTenant = await TenantsApiService.updateTenant(tenantUuid, {
        name: updateData.name,
        domain: updateData.domain,
        slug: updateData.slug,
        description: updateData.description as string,
        defaultCurrency: updateData.defaultCurrency,
        isActive: updateData.isActive,
        contactEmail: updateData.contactEmail,
        contactPhone: updateData.contactPhone
      });

      if (!updatedApiTenant) {
        logger.warn('Failed to update tenant via API', { tenantUuid });
        return null;
      }

      const tenantListItem = this.apiTenantToListItem(updatedApiTenant);

      // ✅ TARGETED CACHE INVALIDATION
      await this.invalidateTenantCaches(tenantUuid);

      logger.info('Tenant updated successfully', {
        tenantUuid,
        updatedFields: Object.keys(updateData),
        userId
      });

      return tenantListItem;

    } catch (error) {
      logger.error('Failed to update tenant', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantUuid,
        userId
      });
      throw error;
    }
  }

  /**
   * ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
   * Delete tenant with full cache coordination
   */
  async deleteTenantByUuid(tenantUuid: string, userId?: string): Promise<boolean> {
    try {
      // Get current tenant for audit logging
      const currentTenant = await this.getTenantByUuid(tenantUuid);
      if (!currentTenant) {
        logger.warn('Tenant not found for deletion', { tenantUuid });
        return false;
      }

      // ✅ ARCHITECTURE COMPLIANCE: Use API instead of direct database access
      const deleteResult = await TenantsApiService.deleteTenant(tenantUuid);

      if (!deleteResult) {
        logger.error('Failed to delete tenant via API', { tenantUuid });
        return false;
      }

      // ✅ FULL CACHE INVALIDATION
      await this.invalidateAllCaches();

      logger.info('Tenant deleted successfully', {
        tenantUuid,
        name: currentTenant.name,
        userId
      });

      return true;

    } catch (error) {
      logger.error('Failed to delete tenant', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantUuid,
        userId
      });
      return false;
    }
  }

  /**
   * ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
   * Get tenant stats with caching
   */
  async getTenantStats(): Promise<TenantStats> {
    try {
      // LAYER 2: Check Redis cache first
      const cachedStats = await cache.get<TenantStats>('tenants:stats');
      if (cachedStats) {
        logger.info('Tenant stats retrieved from Redis cache');
        return cachedStats;
      }

      // LAYER 1: Use Next.js unstable_cache
      const fetchStats = async (): Promise<TenantStats> => {
        logger.info('Fetching tenant stats from NestJS API');
        
        // ✅ ARCHITECTURE COMPLIANCE: For now, calculate basic stats from tenant list
        // This should be replaced with a dedicated stats API endpoint
        const tenantsResult = await TenantsApiService.getTenants({ limit: 1000 });
        
        if (!tenantsResult) {
          throw new Error('Failed to fetch tenants for stats calculation');
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalTenants = tenantsResult.items.length;
        const activeTenants = tenantsResult.items.filter(t => t.isActive).length;
        const inactiveTenants = tenantsResult.items.filter(t => !t.isActive).length;
        const newTenantsToday = tenantsResult.items.filter(t => 
          new Date(t.createdAt) >= today
        ).length;

        const stats: TenantStats = {
          totalTenants,
          activeTenants,
          inactiveTenants,
          newTenantsToday,
        };

        // LAYER 2: Cache in Redis
        await cache.set('tenants:stats', stats, { ttl: 10 * 60, tags: ['tenants', 'tenant-stats'] });

        return stats;
      };

      try {
        return await unstable_cache(
          fetchStats,
          ['tenant-stats'],
          {
            revalidate: 10 * 60, // 10 minutes
            tags: ['tenants', 'tenant-stats']
          }
        )();
      } catch (_cacheError) {
        logger.info('Next.js cache not available, executing directly');
        return await fetchStats();
      }

    } catch (error) {
      logger.error('Failed to get tenant stats', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Private helper methods

  private tenantToListItem(tenant: any): TenantListItem {
    return {
      id: tenant.id.toString(),
      uuid: tenant.uuid,
      name: tenant.name,
      domain: tenant.domain,
      slug: tenant.slug,
      description: tenant.description,
      defaultCurrency: tenant.defaultCurrency,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
      userCount: tenant._count?.accounts || 0,
      accountCount: tenant._count?.accounts || 0,
      status: tenant.isActive ? 'active' : 'inactive',
      contactEmail: tenant.contactEmail || '',
      contactPhone: tenant.contactPhone || '',
      plan: tenant.plan || 'basic',
      currency: tenant.defaultCurrency || 'USD',
      timezone: tenant.timezone || 'UTC'
    };
  }

  /**
   * Convert API tenant format to TenantListItem format
   */
  private apiTenantToListItem(tenant: any): TenantListItem {
    return {
      id: tenant.id || '',
      uuid: tenant.uuid || '',
      name: tenant.name || '',
      domain: tenant.domain || '',
      slug: tenant.slug || null,
      description: tenant.description,
      defaultCurrency: tenant.defaultCurrency,
      isActive: tenant.isActive || false,
      createdAt: tenant.createdAt || new Date().toISOString(),
      updatedAt: tenant.updatedAt || new Date().toISOString(),
      userCount: tenant.userCount || 0,
      accountCount: tenant.accountCount || 0,
      status: tenant.status || (tenant.isActive ? 'active' : 'inactive'),
      contactEmail: tenant.contactEmail || '',
      contactPhone: tenant.contactPhone || '',
      plan: tenant.plan || 'basic',
      currency: tenant.currency || tenant.defaultCurrency || 'USD',
      timezone: tenant.timezone || 'UTC'
    };
  }

  /**
   * ✅ THREE-LAYER CACHE INVALIDATION COORDINATION
   */
  private async invalidateAllCaches(): Promise<void> {
    try {
      // LAYER 1: Next.js cache invalidation
      // This is handled automatically by revalidateTag in CacheInvalidationService

      // LAYER 2: Redis cache invalidation via TenantsCache
      await cache.invalidateByTag('tenants');

      // LAYER 3: TanStack Query invalidation coordination
      // This will be triggered by the API response and client-side hooks

      // Use the centralized cache invalidation service
      await CacheInvalidationService.clearAllCaches();

      logger.info('All tenant caches invalidated across three layers');

    } catch (error) {
      logger.error('Failed to invalidate tenant caches', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Targeted cache invalidation for specific tenant
   */
  private async invalidateTenantCaches(tenantUuid: string): Promise<void> {
    try {
      // LAYER 2: Redis cache invalidation
      await cache.invalidateByTag(`tenant:${tenantUuid}`);

      // LAYER 1 & 3: Coordinated invalidation
      await CacheInvalidationService.clearAllCaches();

      logger.info('Tenant caches invalidated', { tenantUuid });

    } catch (error) {
      logger.error('Failed to invalidate tenant caches', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantUuid
      });
    }
  }

  /**
   * Create cache key from parameters
   */
  private createCacheKey(params: GetTenantsParams): string {
    const keyParts: string[] = [];
    
    if (params.page) keyParts.push(`page:${params.page}`);
    if (params.limit) keyParts.push(`limit:${params.limit}`);
    if (params.search) keyParts.push(`search:${params.search}`);
    if (params.status) keyParts.push(`status:${params.status}`);
    if (params.currency) keyParts.push(`currency:${params.currency}`);
    if (params.userCountRange) keyParts.push(`userCountRange:${params.userCountRange}`);
    
    return keyParts.join(':') || 'default';
  }
}

// Export singleton instance
export const tenantsService = new TenantsService(); 