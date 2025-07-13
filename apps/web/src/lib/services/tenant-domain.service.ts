/**
 * Tenant Domain Service - API Client
 * 
 * ✅ ARCHITECTURE COMPLIANCE: Uses API calls instead of direct database access
 * All tenant domain operations go through NestJS API with proper authentication
 * 
 * Handles tenant detection by domain with Redis caching for performance.
 * Integrates with the 4-tier permission system and maintains tenant isolation.
 */

import { ApiAuthService } from '@/lib/api-clients/api-auth.service';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { parseDomain } from '@/lib/config/domains';

export interface Tenant {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  customDomain?: string | null;
  isActive: boolean;
  settings?: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface TenantDomainInfo extends Tenant {
  domainType: 'subdomain' | 'custom';
}

export class TenantDomainService {
  private static instance: TenantDomainService;
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  // Cache TTL: 5 minutes for domain mapping
  private readonly CACHE_TTL = 300;
  
  // Redis key patterns following platform standards
  private readonly REDIS_KEYS = {
    byDomain: (domain: string) => `platform:tenant:domain:${domain}`,
    bySubdomain: (subdomain: string) => `platform:tenant:subdomain:${subdomain}`,
    customDomains: 'platform:tenant:customdomains:all'
  };

  private constructor() {}

  static getInstance(): TenantDomainService {
    if (!TenantDomainService.instance) {
      TenantDomainService.instance = new TenantDomainService();
    }
    return TenantDomainService.instance;
  }

  private static async getRedis() {
    try {
      return await getRedisClient();
    } catch (error) {
      logger.warn('Redis client unavailable, proceeding without cache', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error; // Re-throw to be caught by the calling methods
    }
  }

  /**
   * Get tenant by hostname with Redis caching
   * This is the main entry point for domain-based tenant detection
   */
  async getTenantByDomain(hostname: string): Promise<TenantDomainInfo | null> {
    if (!hostname) {
      return null;
    }

    try {
      // Parse domain to determine type
      const domainInfo = parseDomain(hostname);
      
      // Not a tenant domain
      if (domainInfo.type !== 'tenant') {
        return null;
      }

      // Remove port for lookup
      const domainWithoutPort = hostname.toLowerCase().replace(/:\d+$/, '');

      // Check Redis cache first
      const cacheKey = this.REDIS_KEYS.byDomain(domainWithoutPort);
      const redis = await TenantDomainService.getRedis();
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        logger.debug('Tenant found in cache', { domain: domainWithoutPort });
        return JSON.parse(cached);
      }

      // Determine lookup strategy based on domain type
      let tenant: TenantDomainInfo | null = null;

      if (domainInfo.isCustomDomain) {
        // Look up by custom domain
        tenant = await this.getTenantByCustomDomain(domainWithoutPort);
      } else if (domainInfo.tenantSlug) {
        // Look up by subdomain
        tenant = await this.getTenantBySubdomain(domainInfo.tenantSlug);
      }

      // Cache the result (including null to prevent repeated DB queries)
      if (tenant) {
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(tenant));
        logger.info('Tenant resolved and cached', { 
          domain: domainWithoutPort, 
          tenantId: tenant.id,
          tenantSlug: tenant.slug 
        });
      } else {
        // Cache null result for 1 minute to prevent hammering DB
        await redis.setex(cacheKey, 60, JSON.stringify(null));
      }

      return tenant;
    } catch (error) {
      logger.error('Error fetching tenant by domain', { hostname, error });
      return null;
    }
  }

  /**
   * Get tenant by custom domain
   */
  private async getTenantByCustomDomain(domain: string): Promise<TenantDomainInfo | null> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${TenantDomainService.API_BASE_URL}/api/v2/admin/tenants/by-domain/${encodeURIComponent(domain)}`,
        { headers }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch tenant by custom domain: ${response.statusText}`);
      }

      const data = await response.json();
      const tenant = data.data || data;

      if (tenant) {
        return {
          ...tenant,
          domainType: 'custom'
        };
      }

      return null;
    } catch (error) {
      logger.error('Failed to fetch tenant by custom domain', {
        error: error instanceof Error ? error.message : 'Unknown error',
        domain
      });
      return null;
    }
  }

  /**
   * Get tenant by subdomain
   */
  private async getTenantBySubdomain(subdomain: string): Promise<TenantDomainInfo | null> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${TenantDomainService.API_BASE_URL}/api/v2/admin/tenants/by-slug/${encodeURIComponent(subdomain)}`,
        { headers }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch tenant by subdomain: ${response.statusText}`);
      }

      const data = await response.json();
      const tenant = data.data || data;

      if (tenant) {
        return {
          ...tenant,
          domainType: 'subdomain'
        };
      }

      return null;
    } catch (error) {
      logger.error('Failed to fetch tenant by subdomain', {
        error: error instanceof Error ? error.message : 'Unknown error',
        subdomain
      });
      return null;
    }
  }

  /**
   * Invalidate tenant domain cache
   * Called when tenant domain settings are updated
   */
  async invalidateTenantDomainCache(tenantId: number): Promise<void> {
    try {
      // Get tenant to find all associated domains via API
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${TenantDomainService.API_BASE_URL}/api/v2/admin/tenants/${tenantId}`,
        { headers }
      );

      if (!response.ok) {
        logger.warn('Failed to fetch tenant for cache invalidation', { tenantId });
        return;
      }

      const data = await response.json();
      const tenant = data.data || data;

      if (!tenant) return;

      const keysToDelete: string[] = [];

      // Add subdomain cache key
      if (tenant.slug) {
        keysToDelete.push(this.REDIS_KEYS.byDomain(`${tenant.slug}.monoplatform.com`));
        keysToDelete.push(this.REDIS_KEYS.byDomain(`${tenant.slug}.monolocal.com`));
        keysToDelete.push(this.REDIS_KEYS.bySubdomain(tenant.slug));
      }

      // Add custom domain cache key
      if (tenant.customDomain) {
        keysToDelete.push(this.REDIS_KEYS.byDomain(tenant.customDomain));
      }

      // Delete all related cache keys
      if (keysToDelete.length > 0) {
        const redis = await TenantDomainService.getRedis();
        await redis.del(...keysToDelete);
        logger.info('Tenant domain cache invalidated', { tenantId, keysDeleted: keysToDelete.length });
      }
    } catch (error) {
      logger.error('Error invalidating tenant domain cache', { tenantId, error });
    }
  }

  /**
   * Preload custom domains into cache (for performance)
   * This can be called during startup or periodically
   */
  async preloadCustomDomains(): Promise<void> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${TenantDomainService.API_BASE_URL}/api/v2/admin/tenants?customDomainOnly=true&isActive=true`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tenants with custom domains: ${response.statusText}`);
      }

      const data = await response.json();
      const tenants = data.data || data;

      const redis = await TenantDomainService.getRedis();

      for (const tenant of tenants) {
        if (tenant.customDomain) {
          const cacheKey = this.REDIS_KEYS.byDomain(tenant.customDomain);
          const tenantData: TenantDomainInfo = {
            ...tenant,
            domainType: 'custom'
          };
          await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(tenantData));
        }
      }

      logger.info('Custom domains preloaded into cache', { count: tenants.length });
    } catch (error) {
      logger.error('Error preloading custom domains', { error });
    }
  }

  /**
   * Validate if a custom domain is available
   */
  async isCustomDomainAvailable(domain: string, excludeTenantId?: number): Promise<boolean> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        domain,
        ...(excludeTenantId && { excludeTenantId: excludeTenantId.toString() })
      });

      const response = await fetch(
        `${TenantDomainService.API_BASE_URL}/api/v2/admin/tenants/domain-availability?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to check domain availability: ${response.statusText}`);
      }

      const data = await response.json();
      return data.available || false;
    } catch (error) {
      logger.error('Error checking domain availability', { domain, excludeTenantId, error });
      return false;
    }
  }

  /**
   * Update tenant custom domain
   */
  async updateTenantCustomDomain(tenantId: number, customDomain: string | null): Promise<boolean> {
    try {
      // Validate domain availability if setting a new domain
      if (customDomain && !(await this.isCustomDomainAvailable(customDomain, tenantId))) {
        throw new Error('Custom domain is already in use');
      }

      // Update tenant via API
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${TenantDomainService.API_BASE_URL}/api/v2/admin/tenants/${tenantId}/custom-domain`,
        {
          method: 'PUT',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ customDomain }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update tenant custom domain: ${response.statusText}`);
      }

      // Invalidate cache
      await this.invalidateTenantDomainCache(tenantId);

      logger.info('Tenant custom domain updated', { tenantId, customDomain });
      return true;
    } catch (error) {
      logger.error('Error updating tenant custom domain', { tenantId, customDomain, error });
      return false;
    }
  }
}

// Export singleton instance
export const tenantDomainService = TenantDomainService.getInstance();