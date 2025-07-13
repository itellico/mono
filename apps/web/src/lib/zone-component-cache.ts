/**
 * Zone Component Three-Layer Cache Coordination
 * 
 * Implements itellico Mono's mandatory three-layer caching:
 * Layer 1: Next.js unstable_cache (React Server Components)
 * Layer 2: Redis with getRedisClient() 
 * Layer 3: TanStack Query (client-side state management)
 * 
 * All layers must invalidate together on mutations
 */

import { unstable_cache } from 'next/cache';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { ZoneComponentRegistry, type ZoneComponent, type ZoneComponentFilters } from './zone-component-registry';

/**
 * Cache key patterns following itellico Mono standards
 */
export class ZoneComponentCacheKeys {
  // Tenant-specific cache keys
  static tenant(tenantId: number) {
    return `cache:${tenantId}:zone-components`;
  }

  static tenantList(tenantId: number, filters: ZoneComponentFilters) {
    const filterHash = this.hashFilters(filters);
    return `${this.tenant(tenantId)}:list:${filterHash}`;
  }

  static tenantComponent(tenantId: number, componentId: string) {
    return `${this.tenant(tenantId)}:component:${componentId}`;
  }

  // Global/shared cache keys
  static global() {
    return 'cache:global:zone-components';
  }

  static globalComponent(componentId: string) {
    return `${this.global()}:component:${componentId}`;
  }

  // Cache tag patterns for invalidation
  static tags = {
    all: 'zone-components',
    tenant: (tenantId: number) => `zone-components:tenant:${tenantId}`,
    component: (componentId: string) => `zone-components:component:${componentId}`,
    list: 'zone-components:lists',
  };

  private static hashFilters(filters: ZoneComponentFilters): string {
    // Create consistent hash from filters for cache keys
    const normalized = {
      category: filters.category || '',
      componentType: filters.componentType || '',
      status: filters.status || 'active',
      search: filters.search || '',
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
    
    return Buffer.from(JSON.stringify(normalized)).toString('base64url').substring(0, 16);
  }
}

/**
 * Layer 1: Next.js unstable_cache wrapper
 */
export class ZoneComponentNextCache {
  private static readonly TTL = 300; // 5 minutes

  /**
   * Cache zone component list with Next.js unstable_cache
   */
  static getCachedComponents = unstable_cache(
    async (tenantId: number, filters: ZoneComponentFilters): Promise<ZoneComponent[]> => {
      logger.debug('Next.js cache miss - fetching zone components from registry', {
        tenantId,
        filters
      });
      
      return await ZoneComponentRegistry.getComponents(tenantId, filters);
    },
    ['zone-components-list'],
    {
      revalidate: ZoneComponentNextCache.TTL,
      tags: [ZoneComponentCacheKeys.tags.all, ZoneComponentCacheKeys.tags.list],
    }
  );

  /**
   * Cache single zone component with Next.js unstable_cache
   */
  static getCachedComponent = unstable_cache(
    async (tenantId: number, componentId: string): Promise<ZoneComponent | null> => {
      logger.debug('Next.js cache miss - fetching zone component from registry', {
        tenantId,
        componentId
      });
      
      const components = await ZoneComponentRegistry.getComponents(tenantId, {});
      return components.find(c => c.id === componentId) || null;
    },
    ['zone-component-detail'],
    {
      revalidate: ZoneComponentNextCache.TTL,
      tags: [ZoneComponentCacheKeys.tags.all],
    }
  );
}

/**
 * Layer 2: Redis cache management
 */
export class ZoneComponentRedisCache {
  private static readonly TTL = 300; // 5 minutes

  /**
   * Get zone components from Redis cache
   */
  static async getComponents(
    tenantId: number, 
    filters: ZoneComponentFilters
  ): Promise<ZoneComponent[] | null> {
    try {
      const redis = await getRedisClient();
      const cacheKey = ZoneComponentCacheKeys.tenantList(tenantId, filters);
      
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Redis cache hit for zone components', { tenantId, cacheKey });
        return JSON.parse(cached);
      }
      
      logger.debug('Redis cache miss for zone components', { tenantId, cacheKey });
      return null;
    } catch (error) {
      logger.warn('Redis unavailable for zone components cache', {
        error: error instanceof Error ? error.message : String(error),
        tenantId
      });
      return null;
    }
  }

  /**
   * Set zone components in Redis cache
   */
  static async setComponents(
    tenantId: number,
    filters: ZoneComponentFilters,
    components: ZoneComponent[]
  ): Promise<void> {
    try {
      const redis = await getRedisClient();
      const cacheKey = ZoneComponentCacheKeys.tenantList(tenantId, filters);
      
      await redis.setex(cacheKey, this.TTL, JSON.stringify(components));
      logger.debug('Zone components cached in Redis', { tenantId, cacheKey, count: components.length });
    } catch (error) {
      logger.warn('Failed to cache zone components in Redis', {
        error: error instanceof Error ? error.message : String(error),
        tenantId
      });
    }
  }

  /**
   * Get single zone component from Redis cache
   */
  static async getComponent(tenantId: number, componentId: string): Promise<ZoneComponent | null> {
    try {
      const redis = await getRedisClient();
      const cacheKey = ZoneComponentCacheKeys.tenantComponent(tenantId, componentId);
      
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Redis cache hit for zone component', { tenantId, componentId });
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      logger.warn('Redis unavailable for zone component cache', {
        error: error instanceof Error ? error.message : String(error),
        tenantId,
        componentId
      });
      return null;
    }
  }

  /**
   * Set single zone component in Redis cache
   */
  static async setComponent(tenantId: number, component: ZoneComponent): Promise<void> {
    try {
      const redis = await getRedisClient();
      const cacheKey = ZoneComponentCacheKeys.tenantComponent(tenantId, component.id);
      
      await redis.setex(cacheKey, this.TTL, JSON.stringify(component));
      logger.debug('Zone component cached in Redis', { tenantId, componentId: component.id });
    } catch (error) {
      logger.warn('Failed to cache zone component in Redis', {
        error: error instanceof Error ? error.message : String(error),
        tenantId,
        componentId: component.id
      });
    }
  }

  /**
   * Invalidate zone component caches
   */
  static async invalidate(tenantId: number, componentId?: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      
      if (componentId) {
        // Invalidate specific component
        const componentKey = ZoneComponentCacheKeys.tenantComponent(tenantId, componentId);
        await redis.del(componentKey);
        logger.debug('Invalidated zone component cache', { tenantId, componentId });
      } else {
        // Invalidate all zone component caches for tenant
        const pattern = `${ZoneComponentCacheKeys.tenant(tenantId)}:*`;
        const keys = await redis.keys(pattern);
        
        if (keys.length > 0) {
          await redis.del(...keys);
          logger.debug('Invalidated all zone component caches', { tenantId, keysCount: keys.length });
        }
      }
    } catch (error) {
      logger.warn('Failed to invalidate zone component caches', {
        error: error instanceof Error ? error.message : String(error),
        tenantId,
        componentId
      });
    }
  }
}

/**
 * Coordinated three-layer caching service
 */
export class ZoneComponentCacheCoordinator {
  private static readonly TTL = 300; // 5 minutes

  /**
   * Get zone components with three-layer cache coordination
   */
  static async getComponents(
    tenantId: number,
    filters: ZoneComponentFilters
  ): Promise<ZoneComponent[]> {
    // Layer 2: Try Redis first
    try {
      const redis = await getRedisClient();
      const cacheKey = ZoneComponentCacheKeys.tenantList(tenantId, filters);
      
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Redis cache hit for zone components', { tenantId, cacheKey });
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis unavailable for zone components cache', {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Layer 1: Fallback to registry
    const components = await ZoneComponentRegistry.getComponents(tenantId, filters);
    
    // Store in Redis for next time
    try {
      const redis = await getRedisClient();
      const cacheKey = ZoneComponentCacheKeys.tenantList(tenantId, filters);
      await redis.setex(cacheKey, this.TTL, JSON.stringify(components));
      logger.debug('Zone components cached in Redis', { tenantId, count: components.length });
    } catch (error) {
      logger.warn('Failed to cache zone components in Redis', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    return components;
  }

  /**
   * Get single zone component with three-layer cache coordination
   */
  static async getComponent(tenantId: number, componentId: string): Promise<ZoneComponent | null> {
    // Layer 2: Try Redis first
    const redisResult = await ZoneComponentRedisCache.getComponent(tenantId, componentId);
    if (redisResult) {
      return redisResult;
    }

    // Layer 1: Fallback to Next.js cache
    const component = await ZoneComponentNextCache.getCachedComponent(tenantId, componentId);
    
    // Store in Redis for next time
    if (component) {
      await ZoneComponentRedisCache.setComponent(tenantId, component);
    }
    
    return component;
  }

  /**
   * Invalidate all cache layers together (mandatory on mutations)
   */
  static async invalidateAll(tenantId: number): Promise<void> {
    logger.info('Coordinated cache invalidation started', { tenantId });
    
    try {
      // Layer 2: Invalidate Redis
      await ZoneComponentRedisCache.invalidate(tenantId);
      
      // Layer 1: Invalidate Next.js cache using revalidateTag
      const { revalidateTag } = await import('next/cache');
      revalidateTag(ZoneComponentCacheKeys.tags.tenant(tenantId));
      revalidateTag(ZoneComponentCacheKeys.tags.all);
      revalidateTag(ZoneComponentCacheKeys.tags.list);
      
      logger.info('Coordinated cache invalidation completed', { tenantId });
    } catch (error) {
      logger.error('Failed to invalidate all cache layers', {
        error: error instanceof Error ? error.message : String(error),
        tenantId
      });
      throw error;
    }
  }

  /**
   * Register a new component and invalidate caches
   */
  static async registerComponent(
    tenantId: number,
    registration: Parameters<typeof ZoneComponentRegistry.registerComponent>[1]
  ): Promise<ZoneComponent> {
    // Register the component
    const component = await ZoneComponentRegistry.registerComponent(tenantId, registration);
    
    // Invalidate all caches (component lists and specific component)
    await this.invalidateAll(tenantId);
    
    logger.info('Zone component registered and caches invalidated', {
      tenantId,
      componentId: component.id,
      name: component.name
    });
    
    return component;
  }
}

/**
 * Integration point for API routes to use coordinated caching
 */
export const zoneComponentCache = {
  get: ZoneComponentCacheCoordinator.getComponents,
  getOne: ZoneComponentCacheCoordinator.getComponent,
  invalidate: ZoneComponentCacheCoordinator.invalidateAll,
  register: ZoneComponentCacheCoordinator.registerComponent,
}; 