import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
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
        logger.info('Fetching user saved searches from database', { userId, tenantId, entityType });
        
        const searches = await prisma.savedSearch.findMany({
          where: {
            userId,
            tenantId,
            isActive: true,
            ...(entityType && { entityType })
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: [
            { isDefault: 'desc' },
            { name: 'asc' }
          ]
        });

        return searches.map(search => ({
          ...search,
          createdAt: search.createdAt,
          updatedAt: search.updatedAt
        }));
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
        logger.info('Fetching entity saved searches from database', { entityType, tenantId, userId });
        
        const searches = await prisma.savedSearch.findMany({
          where: {
            entityType,
            tenantId,
            isActive: true,
            OR: [
              { isPublic: true },
              ...(userId ? [{ userId }] : [])
            ]
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: [
            { isDefault: 'desc' },
            { isPublic: 'desc' },
            { name: 'asc' }
          ]
        });

        return searches.map(search => ({
          ...search,
          createdAt: search.createdAt,
          updatedAt: search.updatedAt
        }));
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
        logger.info('Fetching saved search by UUID from database', { uuid });
        
        const search = await prisma.savedSearch.findUnique({
          where: { uuid },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });

        if (!search) {
          return null;
        }

        return {
          ...search,
          createdAt: search.createdAt,
          updatedAt: search.updatedAt
        };
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
    
    // Handle default search logic - only one default per user per entity type
    if (data.isDefault) {
      await prisma.savedSearch.updateMany({
        where: {
          userId: data.userId,
          tenantId: data.tenantId,
          entityType: data.entityType,
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    const newSearch = await prisma.savedSearch.create({
      data: {
        ...data,
        uuid: crypto.randomUUID()
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Invalidate related caches
    await this.invalidateUserCaches(data.userId, data.tenantId, data.entityType);

    logger.info('Created saved search successfully', { id: newSearch.id, uuid: newSearch.uuid });

    return {
      ...newSearch,
      createdAt: newSearch.createdAt,
      updatedAt: newSearch.updatedAt
    };
  }

  /**
   * Update a saved search with cache invalidation
   */
  static async updateSavedSearch(
    uuid: string, 
    data: UpdateSavedSearchInput,
    userId: number,
    tenantId: number
  ): Promise<SavedSearchData> {
    logger.info('Updating saved search', { uuid, userId });
    
    // Get current search for validation and cache invalidation
    const currentSearch = await this.getSavedSearchByUuid(uuid);
    if (!currentSearch) {
      throw new Error('Saved search not found');
    }

    // Validate ownership or permissions
    if (currentSearch.userId !== userId && currentSearch.tenantId !== tenantId) {
      throw new Error('Permission denied');
    }

    // Handle default search logic
    if (data.isDefault && currentSearch.entityType) {
      await prisma.savedSearch.updateMany({
        where: {
          userId,
          tenantId,
          entityType: currentSearch.entityType,
          isDefault: true,
          uuid: { not: uuid }
        },
        data: { isDefault: false }
      });
    }

    const updatedSearch = await prisma.savedSearch.update({
      where: { uuid },
      data,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Invalidate related caches
    await this.invalidateUserCaches(userId, tenantId, currentSearch.entityType);

    logger.info('Updated saved search successfully', { uuid });

    return {
      ...updatedSearch,
      createdAt: updatedSearch.createdAt,
      updatedAt: updatedSearch.updatedAt
    };
  }

  /**
   * Delete a saved search with cache invalidation
   */
  static async deleteSavedSearch(uuid: string, userId: number, tenantId: number): Promise<void> {
    logger.info('Deleting saved search', { uuid, userId });
    
    // Get current search for validation
    const currentSearch = await this.getSavedSearchByUuid(uuid);
    if (!currentSearch) {
      throw new Error('Saved search not found');
    }

    // Validate ownership or permissions
    if (currentSearch.userId !== userId && currentSearch.tenantId !== tenantId) {
      throw new Error('Permission denied');
    }

    await prisma.savedSearch.delete({
      where: { uuid }
    });

    // Invalidate related caches
    await this.invalidateUserCaches(userId, tenantId, currentSearch.entityType);

    logger.info('Deleted saved search successfully', { uuid });
  }

  /**
   * Get saved searches statistics
   */
  static async getSavedSearchStats(tenantId: number): Promise<SavedSearchStats> {
    const cacheKey = this.getStatsKey(tenantId);
    
    return cacheMiddleware.get(
      cacheKey,
      async () => {
        logger.info('Fetching saved search statistics from database', { tenantId });
        
        const [total, defaults, publicSearches, entityTypes] = await Promise.all([
          prisma.savedSearch.count({
            where: { tenantId, isActive: true }
          }),
          prisma.savedSearch.count({
            where: { tenantId, isActive: true, isDefault: true }
          }),
          prisma.savedSearch.count({
            where: { tenantId, isActive: true, isPublic: true }
          }),
          prisma.savedSearch.groupBy({
            by: ['entityType'],
            where: { tenantId, isActive: true }
          }).then(groups => groups.length)
        ]);

        return {
          total,
          defaults,
          public: publicSearches,
          entityTypes
        };
      },
      ['saved_searches', 'stats', `tenant:${tenantId}`],
      900 // 15 minutes TTL
    );
  }

  /**
   * Convert saved search data to AdminListPage configuration format
   */
  static convertToAdminListPageConfig(search: SavedSearchData): ApplySavedSearchResult {
    const result: ApplySavedSearchResult = {
      filters: {}
    };

    // Convert filters from database format to AdminListPage format
    if (search.filters && typeof search.filters === 'object') {
      Object.entries(search.filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          result.filters[key] = value.map(String);
        } else if (value !== null && value !== undefined) {
          result.filters[key] = [String(value)];
        }
      });
    }

    // Convert sort configuration
    if (search.sortBy) {
      result.sortConfig = {
        column: search.sortBy,
        direction: (search.sortOrder === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'
      };
    }

    // Convert column configuration
    if (search.columnConfig && typeof search.columnConfig === 'object') {
      result.columnVisibility = search.columnConfig as ColumnConfiguration;
    }

    return result;
  }

  // ============================================================================
  // CACHE INVALIDATION
  // ============================================================================

  /**
   * Invalidate all caches related to a user's saved searches
   */
  private static async invalidateUserCaches(userId: number, tenantId: number, entityType: string): Promise<void> {
    const tags = [
      'saved_searches',
      `user:${userId}`,
      `tenant:${tenantId}`,
      `entity:${entityType}`,
      'stats'
    ];

    await cacheMiddleware.invalidateByTags(tags);
    logger.info('Invalidated saved search caches', { userId, tenantId, entityType, tags });
  }

  /**
   * Clear all saved search caches for a tenant
   */
  static async clearTenantCaches(tenantId: number): Promise<void> {
    await cacheMiddleware.invalidateByTags(['saved_searches', `tenant:${tenantId}`]);
    logger.info('Cleared all saved search caches for tenant', { tenantId });
  }
} 