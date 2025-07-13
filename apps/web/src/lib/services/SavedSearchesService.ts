/**
 * Saved Searches Service - API Client
 * 
 * ✅ ARCHITECTURE COMPLIANCE: Uses API calls instead of direct database access
 * All saved search operations go through NestJS API with proper authentication
 */

import { ApiAuthService } from '@/lib/api-clients/api-auth.service';
import { cacheMiddleware } from '@/lib/cache/cache-middleware';
import { logger } from '@/lib/logger';

// ============================================================================
// INTERFACES
// ============================================================================

export interface SavedSearchData {
  id: number;
  uuid: string;
  userId: number;
  tenantId: number;
  name: string;
  description: string | null;
  entityType: string;
  filters: Record<string, unknown>;
  sortBy: string | null;
  sortOrder: string | null;
  columnConfig: Record<string, boolean> | null;
  isDefault: boolean;
  isPublic: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export interface CreateSavedSearchInput {
  userId: number;
  tenantId: number;
  name: string;
  description?: string;
  entityType: string;
  filters: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: string;
  columnConfig?: Record<string, boolean>;
  isDefault?: boolean;
  isPublic?: boolean;
}

export interface UpdateSavedSearchInput {
  name?: string;
  description?: string;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: string;
  columnConfig?: Record<string, boolean>;
  isDefault?: boolean;
  isPublic?: boolean;
  isActive?: boolean;
}

export interface SavedSearchFilters {
  userId?: number;
  tenantId?: number;
  entityType?: string;
  isDefault?: boolean;
  isPublic?: boolean;
  isActive?: boolean;
  search?: string;
}

export interface SavedSearchStats {
  total: number;
  defaults: number;
  public: number;
  entityTypes: number;
}

export interface ColumnConfiguration {
  [columnKey: string]: boolean;
}

export interface ApplySavedSearchResult {
  filters: Record<string, string[]>;
  sortConfig?: { column: string; direction: 'asc' | 'desc' | null };
  columnVisibility?: ColumnConfiguration;
  searchValue?: string;
}

// ============================================================================
// SAVED SEARCHES SERVICE
// ============================================================================

/**
 * Enterprise-grade Saved Searches Service
 * 
 * ✅ mono PLATFORM ARCHITECTURE:
 * - Three-layer caching (TanStack Query → Redis → Database)
 * - Tenant isolation (P0 security requirement)
 * - Permission validation 
 * - Audit logging for all mutations
 * - Error handling with graceful degradation
 * - Cache invalidation coordination
 */
export class SavedSearchesService {
  
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  // ============================================================================
  // CACHE KEYS
  // ============================================================================
  
  private static getCacheKey(type: string, identifier: string, tenantId?: number): string {
    if (tenantId) {
      return `saved_searches:${tenantId}:${type}:${identifier}`;
    }
    return `saved_searches:global:${type}:${identifier}`;
  }

  private static getUserSearchesKey(userId: number, tenantId: number): string {
    return this.getCacheKey('user', userId.toString(), tenantId);
  }

  private static getEntitySearchesKey(entityType: string, tenantId: number): string {
    return this.getCacheKey('entity', entityType, tenantId);
  }

  private static getStatsKey(tenantId: number): string {
    return this.getCacheKey('stats', 'all', tenantId);
  }

  private static getSearchKey(uuid: string): string {
    return this.getCacheKey('item', uuid);
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Get saved searches for a user with caching
   */
  static async getUserSavedSearches(
    userId: number, 
    tenantId: number, 
    entityType?: string
  ): Promise<SavedSearchData[]> {
    const cacheKey = this.getUserSearchesKey(userId, tenantId);
    
    return cacheMiddleware.get(
      cacheKey,
      async () => {
        logger.info('Fetching user saved searches from API', { userId, tenantId, entityType });
        
        const headers = await ApiAuthService.getAuthHeaders();
        const queryParams = new URLSearchParams({
          userId: userId.toString(),
          tenantId: tenantId.toString(),
          ...(entityType && { entityType })
        });
        
        const response = await fetch(
          `${this.API_BASE_URL}/api/v2/saved-searches?${queryParams}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch saved searches: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || data;
      },
      ['saved_searches', `user:${userId}`, `tenant:${tenantId}`],
      300 // 5 minutes TTL
    );
  }

  /**
   * Get saved searches for an entity type with caching
   */
  static async getEntitySavedSearches(
    entityType: string,
    tenantId: number,
    userId?: number
  ): Promise<SavedSearchData[]> {
    const cacheKey = this.getEntitySearchesKey(entityType, tenantId);
    
    return cacheMiddleware.get(
      cacheKey,
      async () => {
        logger.info('Fetching entity saved searches from API', { entityType, tenantId, userId });
        
        const headers = await ApiAuthService.getAuthHeaders();
        const queryParams = new URLSearchParams({
          entityType,
          tenantId: tenantId.toString(),
          ...(userId && { userId: userId.toString() })
        });
        
        const response = await fetch(
          `${this.API_BASE_URL}/api/v2/saved-searches/entity?${queryParams}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch entity saved searches: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || data;
      },
      ['saved_searches', `entity:${entityType}`, `tenant:${tenantId}`],
      300 // 5 minutes TTL
    );
  }

  /**
   * Get a single saved search by UUID with caching
   */
  static async getSavedSearchByUuid(uuid: string): Promise<SavedSearchData | null> {
    const cacheKey = this.getSearchKey(uuid);
    
    return cacheMiddleware.get(
      cacheKey,
      async () => {
        logger.info('Fetching saved search by UUID from API', { uuid });
        
        const headers = await ApiAuthService.getAuthHeaders();
        const response = await fetch(
          `${this.API_BASE_URL}/api/v2/saved-searches/${uuid}`,
          { headers }
        );

        if (response.status === 404) {
          return null;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch saved search: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || data;
      },
      ['saved_searches', `search:${uuid}`],
      600 // 10 minutes TTL
    );
  }

  /**
   * Create a new saved search with cache invalidation
   */
  static async createSavedSearch(data: CreateSavedSearchInput): Promise<SavedSearchData> {
    logger.info('Creating new saved search', { userId: data.userId, entityType: data.entityType, name: data.name });
    
    const headers = await ApiAuthService.getAuthHeaders();
    const response = await fetch(
      `${this.API_BASE_URL}/api/v2/saved-searches`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create saved search: ${response.statusText}`);
    }

    const result = await response.json();
    const newSearch = result.data || result;

    // Invalidate related caches
    await cacheMiddleware.invalidate([
      `user:${data.userId}`,
      `tenant:${data.tenantId}`,
      `entity:${data.entityType}`
    ]);

    logger.info('Saved search created successfully', { uuid: newSearch.uuid, name: newSearch.name });
    return newSearch;
  }

  /**
   * Update a saved search with cache invalidation
   */
  static async updateSavedSearch(uuid: string, data: UpdateSavedSearchInput): Promise<SavedSearchData> {
    logger.info('Updating saved search', { uuid, updates: Object.keys(data) });
    
    const headers = await ApiAuthService.getAuthHeaders();
    const response = await fetch(
      `${this.API_BASE_URL}/api/v2/saved-searches/${uuid}`,
      {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update saved search: ${response.statusText}`);
    }

    const result = await response.json();
    const updatedSearch = result.data || result;

    // Invalidate related caches
    await cacheMiddleware.invalidate([
      `search:${uuid}`,
      `user:${updatedSearch.userId}`,
      `tenant:${updatedSearch.tenantId}`,
      `entity:${updatedSearch.entityType}`
    ]);

    logger.info('Saved search updated successfully', { uuid });
    return updatedSearch;
  }

  /**
   * Delete a saved search with cache invalidation
   */
  static async deleteSavedSearch(uuid: string): Promise<boolean> {
    logger.info('Deleting saved search', { uuid });
    
    // Get search details for cache invalidation
    const search = await this.getSavedSearchByUuid(uuid);
    if (!search) {
      return false;
    }

    const headers = await ApiAuthService.getAuthHeaders();
    const response = await fetch(
      `${this.API_BASE_URL}/api/v2/saved-searches/${uuid}`,
      {
        method: 'DELETE',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete saved search: ${response.statusText}`);
    }

    // Invalidate related caches
    await cacheMiddleware.invalidate([
      `search:${uuid}`,
      `user:${search.userId}`,
      `tenant:${search.tenantId}`,
      `entity:${search.entityType}`
    ]);

    logger.info('Saved search deleted successfully', { uuid });
    return true;
  }

  /**
   * Check if a search name already exists for a user
   */
  static async checkNameExists(
    userId: number,
    tenantId: number,
    entityType: string,
    name: string,
    excludeUuid?: string
  ): Promise<boolean> {
    const headers = await ApiAuthService.getAuthHeaders();
    const queryParams = new URLSearchParams({
      userId: userId.toString(),
      tenantId: tenantId.toString(),
      entityType,
      name,
      ...(excludeUuid && { excludeUuid })
    });
    
    const response = await fetch(
      `${this.API_BASE_URL}/api/v2/saved-searches/check-name?${queryParams}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to check name: ${response.statusText}`);
    }

    const data = await response.json();
    return data.exists || false;
  }

  /**
   * Get the default saved search for an entity type
   */
  static async getDefaultSearch(
    userId: number,
    tenantId: number,
    entityType: string
  ): Promise<SavedSearchData | null> {
    const headers = await ApiAuthService.getAuthHeaders();
    const queryParams = new URLSearchParams({
      userId: userId.toString(),
      tenantId: tenantId.toString(),
      entityType,
    });
    
    const response = await fetch(
      `${this.API_BASE_URL}/api/v2/saved-searches/default?${queryParams}`,
      { headers }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch default search: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  /**
   * Set a saved search as default
   */
  static async setDefaultSearch(uuid: string): Promise<SavedSearchData> {
    logger.info('Setting saved search as default', { uuid });
    
    const headers = await ApiAuthService.getAuthHeaders();
    const response = await fetch(
      `${this.API_BASE_URL}/api/v2/saved-searches/${uuid}/default`,
      {
        method: 'PUT',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to set default search: ${response.statusText}`);
    }

    const result = await response.json();
    const updatedSearch = result.data || result;

    // Invalidate related caches
    await cacheMiddleware.invalidate([
      `search:${uuid}`,
      `user:${updatedSearch.userId}`,
      `tenant:${updatedSearch.tenantId}`,
      `entity:${updatedSearch.entityType}`
    ]);

    logger.info('Default search set successfully', { uuid });
    return updatedSearch;
  }

  /**
   * Get statistics for saved searches
   */
  static async getStats(tenantId: number): Promise<SavedSearchStats> {
    const cacheKey = this.getStatsKey(tenantId);
    
    return cacheMiddleware.get(
      cacheKey,
      async () => {
        logger.info('Fetching saved search stats from API', { tenantId });
        
        const headers = await ApiAuthService.getAuthHeaders();
        const response = await fetch(
          `${this.API_BASE_URL}/api/v2/saved-searches/stats?tenantId=${tenantId}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || data;
      },
      ['saved_searches', `stats:${tenantId}`],
      300 // 5 minutes TTL
    );
  }

  /**
   * Apply a saved search to get filters and configuration
   */
  static async applySavedSearch(uuid: string): Promise<ApplySavedSearchResult> {
    const search = await this.getSavedSearchByUuid(uuid);
    
    if (!search) {
      throw new Error('Saved search not found');
    }

    const result: ApplySavedSearchResult = {
      filters: {}
    };

    // Parse filters
    if (search.filters && typeof search.filters === 'object') {
      Object.entries(search.filters).forEach(([key, value]) => {
        if (key === 'search' && typeof value === 'string') {
          result.searchValue = value;
        } else if (Array.isArray(value)) {
          result.filters[key] = value.map(v => String(v));
        } else if (value !== null && value !== undefined) {
          result.filters[key] = [String(value)];
        }
      });
    }

    // Parse sort configuration
    if (search.sortBy) {
      result.sortConfig = {
        column: search.sortBy,
        direction: (search.sortOrder as 'asc' | 'desc') || 'asc'
      };
    }

    // Parse column visibility
    if (search.columnConfig) {
      result.columnVisibility = search.columnConfig;
    }

    return result;
  }

  /**
   * Clone a saved search
   */
  static async cloneSavedSearch(uuid: string, newName: string): Promise<SavedSearchData> {
    const original = await this.getSavedSearchByUuid(uuid);
    
    if (!original) {
      throw new Error('Saved search not found');
    }

    const cloneData: CreateSavedSearchInput = {
      userId: original.userId,
      tenantId: original.tenantId,
      name: newName,
      description: original.description || undefined,
      entityType: original.entityType,
      filters: original.filters,
      sortBy: original.sortBy || undefined,
      sortOrder: original.sortOrder || undefined,
      columnConfig: original.columnConfig || undefined,
      isDefault: false,
      isPublic: original.isPublic
    };

    return this.createSavedSearch(cloneData);
  }

  /**
   * Override a saved search (update filters from current state)
   */
  static async overrideSavedSearch(
    uuid: string,
    filters: Record<string, unknown>,
    sortBy?: string,
    sortOrder?: string,
    columnConfig?: Record<string, boolean>
  ): Promise<SavedSearchData> {
    logger.info('Overriding saved search', { uuid });
    
    const headers = await ApiAuthService.getAuthHeaders();
    const response = await fetch(
      `${this.API_BASE_URL}/api/v2/saved-searches/${uuid}/override`,
      {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters,
          sortBy,
          sortOrder,
          columnConfig
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to override saved search: ${response.statusText}`);
    }

    const result = await response.json();
    const updatedSearch = result.data || result;

    // Invalidate cache
    await cacheMiddleware.invalidate([`search:${uuid}`]);

    logger.info('Saved search overridden successfully', { uuid });
    return updatedSearch;
  }

  /**
   * Promote a saved search to public (admin only)
   */
  static async promoteSavedSearch(uuid: string): Promise<SavedSearchData> {
    logger.info('Promoting saved search to public', { uuid });
    
    const headers = await ApiAuthService.getAuthHeaders();
    const response = await fetch(
      `${this.API_BASE_URL}/api/v2/saved-searches/${uuid}/promote`,
      {
        method: 'PUT',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to promote saved search: ${response.statusText}`);
    }

    const result = await response.json();
    const updatedSearch = result.data || result;

    // Invalidate related caches
    await cacheMiddleware.invalidate([
      `search:${uuid}`,
      `tenant:${updatedSearch.tenantId}`,
      `entity:${updatedSearch.entityType}`
    ]);

    logger.info('Saved search promoted successfully', { uuid });
    return updatedSearch;
  }
}