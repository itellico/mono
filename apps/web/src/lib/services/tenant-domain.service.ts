/**
 * Tenant Domain Service
 * 
 * Handles tenant detection by domain with Redis caching for performance.
 * Integrates with the 4-tier permission system and maintains tenant isolation.
 */

import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { parseDomain } from '@/lib/config/domains';
import type { Tenant } from '@prisma/client';

export interface TenantDomainInfo extends Tenant {
  domainType: 'subdomain' | 'custom';
}

export class TenantDomainService {
  private static instance: TenantDomainService;
  
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
    const tenant = await prisma.tenant.findFirst({
      where: {
        customDomain: domain,
        isActive: true,
        deletedAt: null
      }
    });

    if (tenant) {
      return {
        ...tenant,
        domainType: 'custom'
      };
    }

    return null;
  }

  /**
   * Get tenant by subdomain
   */
  private async getTenantBySubdomain(subdomain: string): Promise<TenantDomainInfo | null> {
    const tenant = await prisma.tenant.findFirst({
      where: {
        slug: subdomain,
        isActive: true,
        deletedAt: null
      }
    });

    if (tenant) {
      return {
        ...tenant,
        domainType: 'subdomain'
      };
    }

    return null;
  }

  /**
   * Invalidate tenant domain cache
   * Called when tenant domain settings are updated
   */
  async invalidateTenantDomainCache(tenantId: number): Promise<void> {
    try {
      // Get tenant to find all associated domains
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { slug: true, customDomain: true }
      });

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
      const tenants = await prisma.tenant.findMany({
        where: {
          customDomain: { not: null },
          isActive: true,
          deletedAt: null
        },
        select: {
          id: true,
          uuid: true,
          name: true,
          slug: true,
          customDomain: true,
          isActive: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true
        }
      });

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
    const existing = await prisma.tenant.findFirst({
      where: {
        customDomain: domain,
        ...(excludeTenantId && { id: { not: excludeTenantId } }),
        deletedAt: null
      }
    });

    return !existing;
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

      // Update tenant
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { customDomain }
      });

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