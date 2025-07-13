/**
 * Zone Component Registry System
 * 
 * Core registry for managing dynamic zone components within the itellico Mono.
 * Integrates with permission system, caching, audit tracking, and tenant isolation.
 * 
 * @component ZoneComponentRegistry
 * @example
 * ```typescript
 * const registry = new ZoneComponentRegistry();
 * const components = await registry.getComponentsForTenant(tenantId, userContext);
 * ```
 */

import { unstable_cache } from 'next/cache';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { canAccessAPI } from '@/lib/permissions/enhanced-unified-permission-system';
import { UnifiedPermissionService } from '@/lib/services/unified-permission.service';
import { AuditService } from '@/lib/services/audit.service';
import { db } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';

// Zone Component Types
export interface ZoneComponent {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: 'marketing' | 'content' | 'interactive' | 'layout' | 'media';
  componentType: 'standard' | 'premium' | 'custom';
  tenantId: string | null; // null for platform-wide components
  version: string;
  status: 'active' | 'inactive' | 'deprecated';
  configSchema?: object; // JSON schema for component configuration
  defaultConfig?: object; // Default configuration values
  previewUrl?: string; // Preview image or demo URL
  permissions: {
    view: string[];
    edit: string[];
    delete: string[];
  };
  metadata: {
    author?: string;
    tags?: string[];
    industry?: string[];
    createdAt: Date;
    updatedAt: Date;
    lastUsed?: Date;
    usageCount?: number;
  };
}

export interface ComponentFilter {
  category?: ZoneComponent['category'];
  componentType?: ZoneComponent['componentType'];
  status?: ZoneComponent['status'];
  industry?: string[];
  tags?: string[];
  search?: string;
}

export interface UserContext {
  userId: string;
  tenantId: string;
  accountId: string;
  role: string;
  permissions: string[];
}

/**
 * Zone Component Registry Class
 * 
 * Manages registration, filtering, and access control for zone components
 * with full itellico Mono integration.
 */
export class ZoneComponentRegistry {
  private static instance: ZoneComponentRegistry;
  private redis = getRedisClient();

  constructor() {
    logger.info('🎯 Zone Component Registry initialized');
  }

  /**
   * Singleton pattern for registry instance
   */
  public static getInstance(): ZoneComponentRegistry {
    if (!ZoneComponentRegistry.instance) {
      ZoneComponentRegistry.instance = new ZoneComponentRegistry();
    }
    return ZoneComponentRegistry.instance;
  }

  /**
   * Get cache key for zone components
   */
  private getCacheKey(tenantId: string, filter?: ComponentFilter): string {
    const filterHash = filter ? JSON.stringify(filter) : 'all';
    return `cache:${tenantId}:zone_components:${filterHash}`;
  }

  /**
   * Get components for a specific tenant with permission filtering
   * 
   * @param tenantId - Tenant identifier
   * @param userContext - User context for permission checking
   * @param filter - Optional component filtering
   * @returns Promise<ZoneComponent[]>
   */
  public async getComponentsForTenant(
    tenantId: string,
    userContext: UserContext,
    filter?: ComponentFilter
  ): Promise<ZoneComponent[]> {
    logger.info('🔍 Fetching zone components for tenant', { 
      tenantId, 
      userId: userContext.userId,
      filter 
    });

    // Permission check using itellico Mono permission system
    const permissionResult = await canAccessAPI(
      userContext,
      '/api/v1/zone-components',
      'GET'
    );

    if (!permissionResult.allowed) {
      logger.warn('❌ Access denied to zone components', {
        tenantId,
        userId: userContext.userId,
        reason: permissionResult.reason
      });
      throw new Error(`Access denied: ${permissionResult.reason}`);
    }

    // Check cache first (Layer 2: Redis)
    const cacheKey = this.getCacheKey(tenantId, filter);
    
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        logger.info('💾 Zone components retrieved from Redis cache', { tenantId });
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('⚠️ Redis cache miss for zone components', { tenantId, error });
    }

    // Fetch from database with tenant isolation
    const components = await this.fetchComponentsFromDatabase(tenantId, filter);

    // Filter by user permissions
    const filteredComponents = await this.filterComponentsByPermissions(
      components,
      userContext
    );

    // Cache results (5 minute TTL)
    try {
      await this.redis.setex(cacheKey, 300, JSON.stringify(filteredComponents));
      logger.info('💾 Zone components cached in Redis', { tenantId, count: filteredComponents.length });
    } catch (error) {
      logger.warn('⚠️ Failed to cache zone components', { tenantId, error });
    }

    // Log audit activity
    await this.logComponentAccess(userContext, tenantId, filteredComponents.length);

    return filteredComponents;
  }

  /**
   * Register a new zone component
   * 
   * @param component - Zone component to register
   * @param userContext - User context for permission checking
   * @returns Promise<ZoneComponent>
   */
  public async registerComponent(
    component: Omit<ZoneComponent, 'id' | 'metadata'>,
    userContext: UserContext
  ): Promise<ZoneComponent> {
    logger.info('📝 Registering new zone component', { 
      name: component.name,
      tenantId: component.tenantId,
      userId: userContext.userId
    });

    // Permission check for component creation
    const hasPermission = await UnifiedPermissionService.hasPermission(
      userContext.userId,
      'zone_components.create.tenant',
      { tenantId: component.tenantId || userContext.tenantId }
    );

    if (!hasPermission) {
      logger.warn('❌ Permission denied for component registration', {
        userId: userContext.userId,
        componentName: component.name
      });
      throw new Error('Permission denied: Cannot create zone components');
    }

    // Generate component ID and metadata
    const newComponent: ZoneComponent = {
      ...component,
      id: `zc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        author: userContext.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0
      }
    };

    // Save to database (implementation depends on existing schema)
    await this.saveComponentToDatabase(newComponent);

    // Invalidate cache
    await this.invalidateComponentCache(component.tenantId || userContext.tenantId);

    // Log audit trail
    await AuditService.logEntityChange({
      entityType: 'zone_component',
      entityId: newComponent.id,
      action: 'create',
      userId: userContext.userId,
      tenantId: component.tenantId || userContext.tenantId,
      changes: { component: newComponent },
      metadata: { componentName: component.name }
    });

    logger.info('✅ Zone component registered successfully', { 
      componentId: newComponent.id,
      name: component.name
    });

    return newComponent;
  }

  /**
   * Update an existing zone component
   * 
   * @param componentId - Component ID to update
   * @param updates - Partial component updates
   * @param userContext - User context for permission checking
   * @returns Promise<ZoneComponent>
   */
  public async updateComponent(
    componentId: string,
    updates: Partial<ZoneComponent>,
    userContext: UserContext
  ): Promise<ZoneComponent> {
    logger.info('📝 Updating zone component', { 
      componentId,
      userId: userContext.userId
    });

    // Get existing component
    const existingComponent = await this.getComponentById(componentId, userContext);
    
    if (!existingComponent) {
      throw new Error(`Component not found: ${componentId}`);
    }

    // Permission check for component editing
    const hasPermission = await UnifiedPermissionService.hasPermission(
      userContext.userId,
      'zone_components.edit.tenant',
      { 
        tenantId: existingComponent.tenantId || userContext.tenantId,
        resourceId: componentId
      }
    );

    if (!hasPermission) {
      logger.warn('❌ Permission denied for component update', {
        userId: userContext.userId,
        componentId
      });
      throw new Error('Permission denied: Cannot edit this zone component');
    }

    // Merge updates
    const updatedComponent: ZoneComponent = {
      ...existingComponent,
      ...updates,
      metadata: {
        ...existingComponent.metadata,
        ...updates.metadata,
        updatedAt: new Date()
      }
    };

    // Save to database
    await this.saveComponentToDatabase(updatedComponent);

    // Invalidate cache
    await this.invalidateComponentCache(existingComponent.tenantId || userContext.tenantId);

    // Log audit trail
    await AuditService.logEntityChange({
      entityType: 'zone_component',
      entityId: componentId,
      action: 'update',
      userId: userContext.userId,
      tenantId: existingComponent.tenantId || userContext.tenantId,
      changes: { before: existingComponent, after: updatedComponent },
      metadata: { componentName: updatedComponent.name }
    });

    logger.info('✅ Zone component updated successfully', { componentId });

    return updatedComponent;
  }

  /**
   * Delete a zone component
   * 
   * @param componentId - Component ID to delete
   * @param userContext - User context for permission checking
   * @returns Promise<boolean>
   */
  public async deleteComponent(
    componentId: string,
    userContext: UserContext
  ): Promise<boolean> {
    logger.info('🗑️ Deleting zone component', { 
      componentId,
      userId: userContext.userId
    });

    // Get existing component
    const existingComponent = await this.getComponentById(componentId, userContext);
    
    if (!existingComponent) {
      throw new Error(`Component not found: ${componentId}`);
    }

    // Permission check for component deletion
    const hasPermission = await UnifiedPermissionService.hasPermission(
      userContext.userId,
      'zone_components.delete.tenant',
      { 
        tenantId: existingComponent.tenantId || userContext.tenantId,
        resourceId: componentId
      }
    );

    if (!hasPermission) {
      logger.warn('❌ Permission denied for component deletion', {
        userId: userContext.userId,
        componentId
      });
      throw new Error('Permission denied: Cannot delete this zone component');
    }

    // Delete from database
    await this.deleteComponentFromDatabase(componentId);

    // Invalidate cache
    await this.invalidateComponentCache(existingComponent.tenantId || userContext.tenantId);

    // Log audit trail
    await AuditService.logEntityChange({
      entityType: 'zone_component',
      entityId: componentId,
      action: 'delete',
      userId: userContext.userId,
      tenantId: existingComponent.tenantId || userContext.tenantId,
      changes: { deletedComponent: existingComponent },
      metadata: { componentName: existingComponent.name }
    });

    logger.info('✅ Zone component deleted successfully', { componentId });

    return true;
  }

  /**
   * Get a single component by ID with permission checking
   */
  private async getComponentById(
    componentId: string,
    userContext: UserContext
  ): Promise<ZoneComponent | null> {
    // Implementation would fetch from database
    // This is a placeholder for database integration
    logger.info('🔍 Fetching component by ID', { componentId });
    
    // TODO: Implement database query
    return null;
  }

  /**
   * Fetch components from database with tenant isolation
   */
  private async fetchComponentsFromDatabase(
    tenantId: string,
    filter?: ComponentFilter
  ): Promise<ZoneComponent[]> {
    logger.info('🗄️ Fetching components from database', { tenantId, filter });

    // TODO: Implement actual database query using existing itellico Mono schema
    // This would use the existing tables or extend them for zone components
    
    // Placeholder implementation - returns empty array for now
    return [];
  }

  /**
   * Filter components by user permissions
   */
  private async filterComponentsByPermissions(
    components: ZoneComponent[],
    userContext: UserContext
  ): Promise<ZoneComponent[]> {
    const filtered = [];
    
    for (const component of components) {
      const canView = await UnifiedPermissionService.hasPermission(
        userContext.userId,
        'zone_components.view.tenant',
        { 
          tenantId: component.tenantId || userContext.tenantId,
          resourceId: component.id
        }
      );
      
      if (canView) {
        filtered.push(component);
      }
    }

    logger.info('🔒 Components filtered by permissions', { 
      total: components.length,
      filtered: filtered.length,
      userId: userContext.userId
    });

    return filtered;
  }

  /**
   * Save component to database
   */
  private async saveComponentToDatabase(component: ZoneComponent): Promise<void> {
    // TODO: Implement database save operation
    // This would use the existing itellico Mono database schema
    logger.info('💾 Saving component to database', { componentId: component.id });
  }

  /**
   * Delete component from database
   */
  private async deleteComponentFromDatabase(componentId: string): Promise<void> {
    // TODO: Implement database delete operation
    logger.info('🗑️ Deleting component from database', { componentId });
  }

  /**
   * Invalidate component cache for tenant
   */
  private async invalidateComponentCache(tenantId: string): Promise<void> {
    try {
      const pattern = `cache:${tenantId}:zone_components:*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info('🗑️ Cache invalidated for zone components', { 
          tenantId, 
          keysDeleted: keys.length 
        });
      }
    } catch (error) {
      logger.warn('⚠️ Failed to invalidate component cache', { tenantId, error });
    }
  }

  /**
   * Log component access for audit trail
   */
  private async logComponentAccess(
    userContext: UserContext,
    tenantId: string,
    componentCount: number
  ): Promise<void> {
    try {
      await AuditService.logEntityChange({
        entityType: 'zone_component',
        entityId: 'list',
        action: 'view',
        userId: userContext.userId,
        tenantId,
        changes: {},
        metadata: { 
          componentCount,
          accessType: 'list'
        }
      });
    } catch (error) {
      logger.warn('⚠️ Failed to log component access', { 
        userId: userContext.userId,
        error 
      });
    }
  }
}

// Export singleton instance
export const zoneComponentRegistry = ZoneComponentRegistry.getInstance();

/**
 * Zone Component Categories
 */
export const ZONE_COMPONENT_CATEGORIES = {
  MARKETING: 'marketing',
  CONTENT: 'content', 
  INTERACTIVE: 'interactive',
  LAYOUT: 'layout',
  MEDIA: 'media'
} as const;

/**
 * Zone Component Types
 */
export const ZONE_COMPONENT_TYPES = {
  STANDARD: 'standard',
  PREMIUM: 'premium',
  CUSTOM: 'custom'
} as const;

/**
 * Zone Component Status
 */
export const ZONE_COMPONENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DEPRECATED: 'deprecated'
} as const; 