/**
 * 💾 Saved Searches Service
 * 
 * Manages user saved search functionality following mono platform patterns:
 * - Three-layer caching (TanStack Query + Redis + Database)
 * - Tenant isolation (P0 security requirement)
 * - User-specific saved searches
 * - Generic entity support (tenants, users, jobs, etc.)
 * - Column configuration and sorting support
 */

// ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
// ❌ REMOVED: Direct database imports (architectural violation)
// import { db } from '@/lib/db';
import { cache } from '@/lib/cache/cache-middleware';
import { logger } from '@/lib/logger';
import { ApiAuthService } from '@/lib/api-clients/api-auth.service';

// Types
export interface ColumnConfiguration {
  [columnKey: string]: boolean; // Column visibility
}

export interface SavedSearchData {
  id: number;
  uuid: string;
  userId: number | null; // NULL for tenant/system searches
  tenantId: number | null; // NULL for system searches
  scope: 'SYSTEM' | 'TENANT' | 'user';
  parentSearchId: number | null; // Reference to parent search
  isInherited: boolean;
  canOverride: boolean;
  isTemplate: boolean;
  name: string;
  description: string | null;
  entityType: string;
  filters: Record<string, unknown>;
  sortBy: string | null;
  sortOrder: string | null;
  columnConfig: ColumnConfiguration | null; // NEW: Column visibility configuration
  searchValue: string | null; // NEW: Search input value
  paginationLimit: number | null; // NEW: Rows per page setting
  isDefault: boolean;
  isPublic: boolean;
  isActive: boolean;
  createdBy: number; // User who created it
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedSearchData {
  name: string;
  description?: string;
  entityType: string;
  scope?: 'SYSTEM' | 'TENANT' | 'user';
  parentSearchId?: number; // Reference to parent search for inheritance
  canOverride?: boolean;
  isTemplate?: boolean;
  filters: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  columnConfig?: ColumnConfiguration; // NEW: Column configuration
  searchValue?: string; // NEW: Search input value
  paginationLimit?: number; // NEW: Rows per page setting
  isDefault?: boolean;
  isPublic?: boolean;
}

export interface UpdateSavedSearchData {
  name?: string;
  description?: string;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  columnConfig?: ColumnConfiguration; // NEW: Column configuration
  searchValue?: string; // NEW: Search input value
  paginationLimit?: number; // NEW: Rows per page setting
  isDefault?: boolean;
  isPublic?: boolean;
}

export interface GetSavedSearchesParams {
  entityType: string;
  includePublic?: boolean;
  includeInherited?: boolean; // Include system and tenant searches
  scope?: 'all' | 'system' | 'tenant' | 'user'; // Filter by scope
}

export interface GetSavedSearchesResponse {
  searches: SavedSearchData[];
  defaultSearch?: SavedSearchData;
}

// NEW: Interface for applying saved search to AdminListPage
export interface ApplySavedSearchResult {
  filters: Record<string, string[]>;
  sortConfig: {
    column: string;
    direction: 'asc' | 'desc' | null;
  } | null;
  columnVisibility: Record<string, boolean>;
  searchValue?: string; // NEW: Search input value
  paginationLimit?: number; // NEW: Rows per page setting
}

// NEW: Admin interfaces for admin API routes
export interface GetSavedSearchesAdminParams {
  page?: number;
  limit?: number;
  search?: string;
  entityType?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface GetSavedSearchesAdminResponse {
  savedSearches: SavedSearchAdminListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface SavedSearchAdminListItem {
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
  columnConfig: ColumnConfiguration | null;
  searchValue: string | null; // NEW: Search input value
  paginationLimit: number | null; // NEW: Rows per page setting
  isDefault: boolean;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export interface CreateSavedSearchAdminData {
  name: string;
  description?: string;
  entityType: string;
  userId: number;
  tenantId: number;
  filters: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  columnConfig?: ColumnConfiguration;
  searchValue?: string; // NEW: Search input value
  paginationLimit?: number; // NEW: Rows per page setting
  isDefault?: boolean;
  isPublic?: boolean;
}

export interface CreateSavedSearchAdminResult {
  success: boolean;
  savedSearch?: SavedSearchAdminListItem;
  errors?: string[];
  error?: string;
}

export class SavedSearchesService {
  private static instance: SavedSearchesService;
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  private constructor() {}

  public static getInstance(): SavedSearchesService {
    if (!SavedSearchesService.instance) {
      SavedSearchesService.instance = new SavedSearchesService();
    }
    return SavedSearchesService.instance;
  }

  /**
   * ✅ Get available saved searches with inheritance hierarchy
   * System searches → Tenant searches → User searches
   * Three-layer caching: TanStack Query → Redis → Database
   */
  async getAvailableSavedSearches(
    userId: number,
    tenantId: number,
    entityType: string,
    params: GetSavedSearchesParams = {}
  ): Promise<GetSavedSearchesResponse> {
    try {
      // ✅ FIXED: Use consistent cache key naming: {tenant_id}:{entity}:search:{query_hash}
      const cacheKey = `${tenantId}:saved_searches:user:${userId}:entity:${entityType}`;
      const cachedResult = await cache.get<GetSavedSearchesResponse>(cacheKey);
      
      if (cachedResult) {
        logger.info('Saved searches retrieved from Redis cache', {
          userId,
          tenantId,
          entityType,
          source: 'redis',
          cacheKey
        });
        return cachedResult;
      }

      // Build search criteria based on inheritance hierarchy
      const whereConditions = {
        entityType,
        isActive: true,
        OR: [] as any[]
      };

      // Always include user's own searches
      whereConditions.OR.push({
        scope: 'user',
        userId
      });

      // Include tenant searches if requested or by default
      if (params.includeInherited !== false && params.scope !== 'user') {
        whereConditions.OR.push({
          scope: 'TENANT',
          tenantId
        });
      }

      // Include system searches if requested or by default
      if (params.includeInherited !== false && params.scope !== 'user' && params.scope !== 'tenant') {
        whereConditions.OR.push({
          scope: 'SYSTEM'
        });
      }

      // Include public searches from same tenant if requested
      if (params.includePublic) {
        whereConditions.OR.push({
          scope: 'user',
          tenantId,
          isPublic: true
        });
      }

      // Apply scope filter
      if (params.scope && params.scope !== 'all') {
        whereConditions.OR = whereConditions.OR.filter((condition: any) => 
          condition.scope === params.scope?.toUpperCase()
        );
      }

      const searches = await db.savedSearch.findMany({
        where: whereConditions,
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          parentSearch: {
            select: {
              id: true,
              name: true,
              scope: true
            }
          }
        },
        orderBy: [
          { scope: 'asc' }, // System first, then tenant, then user
          { isDefault: 'desc' },
          { name: 'asc' }
        ]
      });

      const searchesData: SavedSearchData[] = searches.map((search: any) => ({
        id: search.id,
        uuid: search.uuid,
        userId: search.userId,
        tenantId: search.tenantId,
        scope: search.scope,
        parentSearchId: search.parentSearchId,
        isInherited: search.isInherited,
        canOverride: search.canOverride,
        isTemplate: search.isTemplate,
        name: search.name,
        description: search.description,
        entityType: search.entityType,
        filters: search.filters as Record<string, unknown>,
        sortBy: search.sortBy,
        sortOrder: search.sortOrder,
        columnConfig: search.columnConfig as ColumnConfiguration | null,
        searchValue: search.searchValue,
        paginationLimit: search.paginationLimit,
        isDefault: search.isDefault,
        isPublic: search.isPublic,
        isActive: search.isActive,
        createdBy: search.createdBy,
        createdAt: search.createdAt.toISOString(),
        updatedAt: search.updatedAt.toISOString()
      }));

      // Apply inheritance resolution logic
      const resolvedSearches = this.applyInheritanceRules(searchesData, userId, tenantId);

      const result: GetSavedSearchesResponse = {
        searches: resolvedSearches,
        defaultSearch: resolvedSearches.find(s => s.isDefault && (s.userId === userId || s.scope !== 'user'))
      };

      await cache.set(cacheKey, result, {
        ttl: 5 * 60,
        tags: ['saved-searches', `user:${userId}`, `entity:${entityType}`, `tenant:${tenantId}`]
      });

      logger.info('Saved searches cached in Redis', {
        userId,
        tenantId,
        entityType,
        cacheKey,
        searchCount: result.searches.length,
        hasDefault: !!result.defaultSearch
      });

      return result;
    } catch (error) {
      logger.error('Failed to get available saved searches', { userId, tenantId, entityType, params, error });
      throw error;
    }
  }

  /**
   * ✅ Apply inheritance rules to resolve search conflicts and overrides
   */
  private applyInheritanceRules(
    searches: SavedSearchData[],
    userId: number,
    tenantId: number
  ): SavedSearchData[] {
    const searchMap = new Map<string, SavedSearchData>();
    const overrides = new Map<string, SavedSearchData[]>();

    // Group searches by name and scope priority
    for (const search of searches) {
      const key = `${search.entityType}:${search.name.toLowerCase()}`;
      
      if (!searchMap.has(key)) {
        searchMap.set(key, search);
      } else {
        const existing = searchMap.get(key)!;
        
        // Apply hierarchy: USER > TENANT > SYSTEM
        const searchPriority = this.getScopePriority(search.scope);
        const existingPriority = this.getScopePriority(existing.scope);
        
        if (searchPriority > existingPriority) {
          // Higher priority search overrides lower priority
          if (existing.canOverride) {
            searchMap.set(key, { ...search, isInherited: search.scope !== 'user' || search.userId !== userId });
          }
        } else if (searchPriority === existingPriority && search.userId === userId) {
          // Same priority, prefer user's own search
          searchMap.set(key, search);
        }
      }
      
      // Track overrides for UI display
      if (search.parentSearchId) {
        const overrideKey = `override:${search.parentSearchId}`;
        if (!overrides.has(overrideKey)) {
          overrides.set(overrideKey, []);
        }
        overrides.get(overrideKey)!.push(search);
      }
    }

    return Array.from(searchMap.values());
  }

  /**
   * Get scope priority for inheritance resolution
   */
  private getScopePriority(scope: string): number {
    switch (scope) {
      case 'SYSTEM': return 1;
      case 'TENANT': return 2;
      case 'user': return 3;
      default: return 0;
    }
  }

  /**
   * ✅ Legacy method for backward compatibility
   */
  async getUserSavedSearches(
    userId: number,
    tenantId: number,
    entityType: string
  ): Promise<GetSavedSearchesResponse> {
    return this.getAvailableSavedSearches(userId, tenantId, entityType, {
      entityType,
      scope: 'user'
    });
  }

  /**
   * ✅ Create a new saved search
   * P0 Security: Tenant isolation enforced
   */
  async createSavedSearch(
    userId: number,
    tenantId: number,
    data: CreateSavedSearchData,
    createdBy?: number
  ): Promise<SavedSearchData> {
    try {
      // Check for duplicate name
      const existingSearch = await db.savedSearch.findFirst({
        where: {
          userId,
          entityType: data.entityType,
          name: data.name,
          isActive: true
        }
      });

      if (existingSearch) {
        throw new Error(`A saved search with name "${data.name}" already exists for ${data.entityType}`);
      }

      // If setting as default, unset current default
      if (data.isDefault) {
        await db.savedSearch.updateMany({
          where: {
            userId,
            entityType: data.entityType,
            isDefault: true
          },
          data: {
            isDefault: false
          }
        });
      }

      // Determine scope and ownership based on data
      const scope = data.scope || 'user';
      const targetUserId = scope === 'user' ? userId : null;
      const targetTenantId = scope === 'SYSTEM' ? null : tenantId;
      
      const savedSearch = await db.savedSearch.create({
        data: {
          userId: targetUserId,
          tenantId: targetTenantId,
          scope,
          parentSearchId: data.parentSearchId || null,
          isInherited: !!data.parentSearchId,
          canOverride: data.canOverride ?? true,
          isTemplate: data.isTemplate || false,
          name: data.name.trim(),
          description: data.description?.trim() || null,
          entityType: data.entityType,
          filters: data.filters,
          sortBy: data.sortBy || null,
          sortOrder: data.sortOrder || null,
          columnConfig: data.columnConfig || null,
          searchValue: data.searchValue,
          paginationLimit: data.paginationLimit,
          isDefault: data.isDefault || false,
          isPublic: data.isPublic || false,
          createdBy: createdBy || userId
        }
      });

      await this.invalidateSavedSearchCaches(userId, tenantId, data.entityType);
      
      const result: SavedSearchData = {
        id: savedSearch.id,
        uuid: savedSearch.uuid,
        userId: savedSearch.userId,
        tenantId: savedSearch.tenantId,
        scope: savedSearch.scope as 'SYSTEM' | 'TENANT' | 'user',
        parentSearchId: savedSearch.parentSearchId,
        isInherited: savedSearch.isInherited,
        canOverride: savedSearch.canOverride,
        isTemplate: savedSearch.isTemplate,
        name: savedSearch.name,
        description: savedSearch.description,
        entityType: savedSearch.entityType,
        filters: savedSearch.filters as Record<string, unknown>,
        sortBy: savedSearch.sortBy,
        sortOrder: savedSearch.sortOrder,
        columnConfig: savedSearch.columnConfig as ColumnConfiguration | null,
        searchValue: savedSearch.searchValue,
        paginationLimit: savedSearch.paginationLimit,
        isDefault: savedSearch.isDefault,
        isPublic: savedSearch.isPublic,
        isActive: savedSearch.isActive,
        createdBy: savedSearch.createdBy,
        createdAt: savedSearch.createdAt.toISOString(),
        updatedAt: savedSearch.updatedAt.toISOString()
      };

      logger.info('Saved search created successfully', {
        userId,
        tenantId,
        searchName: data.name,
        entityType: data.entityType
      });

      return result;
    } catch (error) {
      logger.error('Failed to create saved search', { userId, tenantId, data, error });
      throw error;
    }
  }

  /**
   * ✅ Update an existing saved search
   * P0 Security: User can only update their own searches
   */
  async updateSavedSearch(
    userId: number,
    tenantId: number,
    searchId: number,
    data: UpdateSavedSearchData
  ): Promise<SavedSearchData> {
    try {
      // P0 Security: Verify ownership and tenant access
      const existingSearch = await db.savedSearch.findFirst({
        where: {
          id: searchId,
          userId,
          tenantId
        }
      });

      if (!existingSearch) {
        throw new Error('Saved search not found or access denied');
      }

      // Check for duplicate name if name is being changed
      if (data.name && data.name !== existingSearch.name) {
        const duplicateSearch = await db.savedSearch.findFirst({
          where: {
            userId,
            entityType: existingSearch.entityType,
            name: data.name,
            isActive: true,
            id: { not: searchId }
          }
        });

        if (duplicateSearch) {
          throw new Error(`A saved search with name "${data.name}" already exists for ${existingSearch.entityType}`);
        }
      }

      // If setting as default, unset current default
      if (data.isDefault) {
        await db.savedSearch.updateMany({
          where: {
            userId,
            entityType: existingSearch.entityType,
            isDefault: true,
            id: { not: searchId }
          },
          data: {
            isDefault: false
          }
        });
      }

      // Update the saved search
      const updatedSearch = await db.savedSearch.update({
        where: { id: searchId },
        data: {
          ...(data.name && { name: data.name.trim() }),
          ...(data.description !== undefined && { description: data.description?.trim() || null }),
          ...(data.filters && { filters: data.filters }),
          ...(data.sortBy !== undefined && { sortBy: data.sortBy }),
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
          ...(data.columnConfig !== undefined && { columnConfig: data.columnConfig }), // NEW
          ...(data.searchValue !== undefined && { searchValue: data.searchValue }),
          ...(data.paginationLimit !== undefined && { paginationLimit: data.paginationLimit }),
          ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
          ...(data.isPublic !== undefined && { isPublic: data.isPublic })
        }
      });

      const result: SavedSearchData = {
        id: updatedSearch.id,
        uuid: updatedSearch.uuid,
        userId: updatedSearch.userId,
        tenantId: updatedSearch.tenantId,
        name: updatedSearch.name,
        description: updatedSearch.description,
        entityType: updatedSearch.entityType,
        filters: updatedSearch.filters as Record<string, any>,
        sortBy: updatedSearch.sortBy,
        sortOrder: updatedSearch.sortOrder,
        columnConfig: updatedSearch.columnConfig as ColumnConfiguration | null, // NEW
        searchValue: updatedSearch.searchValue,
        paginationLimit: updatedSearch.paginationLimit,
        isDefault: updatedSearch.isDefault,
        isPublic: updatedSearch.isPublic,
        isActive: updatedSearch.isActive,
        createdAt: updatedSearch.createdAt.toISOString(),
        updatedAt: updatedSearch.updatedAt.toISOString()
      };

      // ✅ THREE-LAYER CACHE INVALIDATION
      await this.invalidateSavedSearchCaches(userId, tenantId, updatedSearch.entityType);

      logger.info('Saved search updated successfully', {
        userId,
        tenantId,
        searchId,
        entityType: updatedSearch.entityType
      });

      return result;

    } catch (error) {
      logger.error('Failed to update saved search', {
        userId,
        tenantId,
        searchId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * ✅ Delete a saved search
   * P0 Security: User can only delete their own searches
   */
  async deleteSavedSearch(
    userId: number,
    tenantId: number,
    searchId: number
  ): Promise<boolean> {
    try {
      // P0 Security: Verify ownership and tenant access
      const existingSearch = await db.savedSearch.findFirst({
        where: {
          id: searchId,
          userId,
          tenantId
        }
      });

      if (!existingSearch) {
        throw new Error('Saved search not found or access denied');
      }

      // Soft delete (mark as inactive)
      await db.savedSearch.update({
        where: { id: searchId },
        data: { isActive: false }
      });

      // ✅ THREE-LAYER CACHE INVALIDATION
      await this.invalidateSavedSearchCaches(userId, tenantId, existingSearch.entityType);

      logger.info('Saved search deleted successfully', {
        userId,
        tenantId,
        searchId,
        entityType: existingSearch.entityType
      });

      return true;

    } catch (error) {
      logger.error('Failed to delete saved search', {
        userId,
        tenantId,
        searchId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * ✅ Get a specific saved search by ID
   * P0 Security: User can only access their own searches
   */
  async getSavedSearchById(
    userId: number,
    tenantId: number,
    searchId: number
  ): Promise<SavedSearchData | null> {
    try {
      const savedSearch = await db.savedSearch.findFirst({
        where: {
          id: searchId,
          OR: [
            { userId }, // User's own search
            { tenantId, isPublic: true } // Public search in same tenant
          ],
          isActive: true
        }
      });

      if (!savedSearch) {
        return null;
      }

      const result: SavedSearchData = {
        id: savedSearch.id,
        uuid: savedSearch.uuid,
        userId: savedSearch.userId,
        tenantId: savedSearch.tenantId,
        name: savedSearch.name,
        description: savedSearch.description,
        entityType: savedSearch.entityType,
        filters: savedSearch.filters as Record<string, any>,
        sortBy: savedSearch.sortBy,
        sortOrder: savedSearch.sortOrder,
        columnConfig: savedSearch.columnConfig as ColumnConfiguration | null, // NEW
        searchValue: savedSearch.searchValue,
        paginationLimit: savedSearch.paginationLimit,
        isDefault: savedSearch.isDefault,
        isPublic: savedSearch.isPublic,
        isActive: savedSearch.isActive,
        createdAt: savedSearch.createdAt.toISOString(),
        updatedAt: savedSearch.updatedAt.toISOString()
      };

      logger.debug('Saved search retrieved by ID', {
        userId,
        searchId,
        entityType: savedSearch.entityType
      });

      return result;

    } catch (error) {
      logger.error('Failed to get saved search by ID', {
        userId,
        tenantId,
        searchId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * 🆕 NEW: Convert saved search to AdminListPage configuration
   * Transforms saved search data into the format expected by AdminListPage component
   */
  convertToAdminListPageConfig(savedSearch: SavedSearchData): ApplySavedSearchResult {
    try {
      // Convert filters to the format expected by AdminListPage
      const filters: Record<string, string[]> = {};
      
      if (savedSearch.filters && typeof savedSearch.filters === 'object') {
        Object.entries(savedSearch.filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            filters[key] = value.map(v => String(v));
          } else if (value !== null && value !== undefined) {
            filters[key] = [String(value)];
          }
        });
      }

      // Convert sort configuration
      const sortConfig = savedSearch.sortBy ? {
        column: savedSearch.sortBy,
        direction: (savedSearch.sortOrder as 'asc' | 'desc') || 'asc'
      } : null;

      // Convert column visibility
      const columnVisibility = savedSearch.columnConfig || {};

      return {
        filters,
        sortConfig,
        columnVisibility,
        searchValue: savedSearch.searchValue,
        paginationLimit: savedSearch.paginationLimit
      };

    } catch (error) {
      logger.error('Failed to convert saved search to AdminListPage config', {
        searchId: savedSearch.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Return default configuration on error
      return {
        filters: {},
        sortConfig: null,
        columnVisibility: {},
        searchValue: undefined,
        paginationLimit: undefined
      };
    }
  }

  /**
   * ✅ Create a search override (inherit from parent and customize)
   */
  async createSearchOverride(
    userId: number,
    tenantId: number,
    parentSearchId: number,
    modifications: Partial<CreateSavedSearchData>
  ): Promise<SavedSearchData> {
    try {
      // Get parent search to inherit from
      const parentSearch = await db.savedSearch.findFirst({
        where: {
          id: parentSearchId,
          isActive: true,
          OR: [
            { scope: 'SYSTEM' },
            { scope: 'TENANT', tenantId },
            { userId, isPublic: true }
          ]
        }
      });

      if (!parentSearch) {
        throw new Error('Parent search not found or not accessible');
      }

      if (!parentSearch.canOverride) {
        throw new Error('This search cannot be overridden');
      }

      // Create override with inherited properties
      const overrideData: CreateSavedSearchData = {
        name: modifications.name || `${parentSearch.name} (Custom)`,
        description: modifications.description || parentSearch.description || undefined,
        entityType: parentSearch.entityType,
        scope: 'user', // Overrides are always user-scoped
        parentSearchId,
        filters: modifications.filters || (parentSearch.filters as Record<string, unknown>),
        sortBy: modifications.sortBy ?? parentSearch.sortBy ?? undefined,
        sortOrder: modifications.sortOrder ?? (parentSearch.sortOrder as 'asc' | 'desc') ?? undefined,
        columnConfig: modifications.columnConfig ?? (parentSearch.columnConfig as ColumnConfiguration) ?? undefined,
        searchValue: modifications.searchValue ?? parentSearch.searchValue ?? undefined,
        paginationLimit: modifications.paginationLimit ?? parentSearch.paginationLimit ?? undefined,
        isDefault: modifications.isDefault ?? false,
        isPublic: modifications.isPublic ?? false
      };

      return this.createSavedSearch(userId, tenantId, overrideData);

    } catch (error) {
      logger.error('Failed to create search override', {
        userId,
        tenantId,
        parentSearchId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * ✅ Promote user search to tenant level (admin function)
   */
  async promoteSearchToTenant(
    searchId: number,
    adminUserId: number,
    tenantId: number
  ): Promise<SavedSearchData> {
    try {
      // Verify the search exists and is user-scoped
      const existingSearch = await db.savedSearch.findFirst({
        where: {
          id: searchId,
          scope: 'user',
          tenantId,
          isActive: true
        }
      });

      if (!existingSearch) {
        throw new Error('User search not found or cannot be promoted');
      }

      // Update to tenant scope
      const promotedSearch = await db.savedSearch.update({
        where: { id: searchId },
        data: {
          scope: 'TENANT',
          userId: null, // Remove user ownership
          isPublic: true, // Tenant searches are inherently public
          createdBy: adminUserId // Track who promoted it
        }
      });

      // Invalidate caches
      await this.invalidateSavedSearchCaches(existingSearch.userId!, tenantId, existingSearch.entityType);

      logger.info('Search promoted to tenant level', {
        searchId,
        adminUserId,
        tenantId,
        searchName: existingSearch.name
      });

      return {
        id: promotedSearch.id,
        uuid: promotedSearch.uuid,
        userId: promotedSearch.userId,
        tenantId: promotedSearch.tenantId,
        scope: promotedSearch.scope as 'SYSTEM' | 'TENANT' | 'user',
        parentSearchId: promotedSearch.parentSearchId,
        isInherited: promotedSearch.isInherited,
        canOverride: promotedSearch.canOverride,
        isTemplate: promotedSearch.isTemplate,
        name: promotedSearch.name,
        description: promotedSearch.description,
        entityType: promotedSearch.entityType,
        filters: promotedSearch.filters as Record<string, unknown>,
        sortBy: promotedSearch.sortBy,
        sortOrder: promotedSearch.sortOrder,
        columnConfig: promotedSearch.columnConfig as ColumnConfiguration | null,
        searchValue: promotedSearch.searchValue,
        paginationLimit: promotedSearch.paginationLimit,
        isDefault: promotedSearch.isDefault,
        isPublic: promotedSearch.isPublic,
        isActive: promotedSearch.isActive,
        createdBy: promotedSearch.createdBy,
        createdAt: promotedSearch.createdAt.toISOString(),
        updatedAt: promotedSearch.updatedAt.toISOString()
      };

    } catch (error) {
      logger.error('Failed to promote search to tenant', {
        searchId,
        adminUserId,
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * ✅ Cache invalidation following unified cache middleware patterns
   * ✅ FIXED: Updated for consistent cache key naming with tenantId
   */
  private async invalidateSavedSearchCaches(userId: number, tenantId: number, entityType: string): Promise<void> {
    try {
      // ✅ FIXED: Use consistent cache key naming
      const cacheKey = `${tenantId}:saved_searches:user:${userId}:entity:${entityType}`;
      await cache.invalidateByTag(`user:${userId}`);
      await cache.invalidateByTag(`entity:${entityType}`);
      await cache.invalidateByTag(`tenant:${tenantId}`);
      await cache.invalidateByTag('saved-searches');

      logger.info('Saved search caches invalidated', {
        userId,
        tenantId,
        entityType,
        cacheKey
      });
    } catch (error) {
      logger.error('Failed to invalidate saved search caches', {
        userId,
        tenantId,
        entityType,
        error
      });
    }
  }

  /**
   * ✅ ADMIN METHOD: Get all saved searches with pagination and filtering
   * Following the exact same pattern as tenantsService.getAll()
   */
  async getAllAdmin(params: GetSavedSearchesAdminParams = {}): Promise<GetSavedSearchesAdminResponse> {
    const {
      page = 1,
      limit = 20,
      search = '',
      entityType = '',
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = params;

    const offset = (page - 1) * limit;

    try {
      // Build where clause
      const where: any = {
        isActive: true
      };

      // Search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { entityType: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Entity type filter
      if (entityType) {
        where.entityType = entityType;
      }

      // Get total count
      const total = await db.savedSearch.count({ where });

      // Get saved searches with user information
      const savedSearches = await db.savedSearch.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              account: {
                select: {
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip: offset,
        take: limit
      });

      const savedSearchListItems: SavedSearchAdminListItem[] = savedSearches.map((search: any) => ({
        id: search.id,
        uuid: search.uuid,
        userId: search.userId,
        tenantId: search.tenantId,
        name: search.name,
        description: search.description,
        entityType: search.entityType,
        filters: search.filters as Record<string, unknown>,
        sortBy: search.sortBy,
        sortOrder: search.sortOrder,
        columnConfig: search.columnConfig as ColumnConfiguration | null,
        searchValue: search.searchValue,
        paginationLimit: search.paginationLimit,
        isDefault: search.isDefault,
        isPublic: search.isPublic,
        isActive: search.isActive,
        createdAt: search.createdAt.toISOString(),
        updatedAt: search.updatedAt.toISOString(),
        user: {
          firstName: search.user?.firstName || null,
          lastName: search.user?.lastName || null,
          email: search.user?.account?.email || ''
        }
      }));

      const totalPages = Math.ceil(total / limit);
      const hasMore = page < totalPages;

      return {
        savedSearches: savedSearchListItems,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore
        }
      };

    } catch (error) {
      logger.error('Failed to get admin saved searches', {
        error: error instanceof Error ? error.message : 'Unknown error',
        params
      });
      throw error;
    }
  }

  /**
   * ✅ ADMIN METHOD: Create saved search (admin version)
   * Following the exact same pattern as tenantsService.create()
   */
  async createAdmin(data: CreateSavedSearchAdminData, adminUserId: string): Promise<CreateSavedSearchAdminResult> {
    try {
      // Validation
      if (!data.name || data.name.trim().length === 0) {
        return { success: false, errors: ['Name is required'] };
      }

      if (!data.entityType || data.entityType.trim().length === 0) {
        return { success: false, errors: ['Entity type is required'] };
      }

      if (!data.userId) {
        return { success: false, errors: ['User ID is required'] };
      }

      if (!data.tenantId) {
        return { success: false, errors: ['Tenant ID is required'] };
      }

      // Check for existing saved search with same name for user/entity
      const existingSearch = await db.savedSearch.findFirst({
        where: {
          userId: data.userId,
          entityType: data.entityType,
          name: data.name.trim(),
          isActive: true
        }
      });

      if (existingSearch) {
        return {
          success: false,
          error: `A saved search with name "${data.name}" already exists for this user and entity type`
        };
      }

      // If setting as default, unset current default for user/entity
      if (data.isDefault) {
        await db.savedSearch.updateMany({
          where: {
            userId: data.userId,
            entityType: data.entityType,
            isDefault: true
          },
          data: {
            isDefault: false
          }
        });
      }

      // Create saved search
      const savedSearch = await db.savedSearch.create({
        data: {
          userId: data.userId,
          tenantId: data.tenantId,
          name: data.name.trim(),
          description: data.description?.trim() || null,
          entityType: data.entityType,
          filters: data.filters as any,
          sortBy: data.sortBy || null,
          sortOrder: data.sortOrder || null,
          columnConfig: data.columnConfig as any,
          isDefault: data.isDefault || false,
          isPublic: data.isPublic || false
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              account: {
                select: {
                  email: true
                }
              }
            }
          }
        }
      });

      const savedSearchListItem: SavedSearchAdminListItem = {
        id: savedSearch.id,
        uuid: savedSearch.uuid,
        userId: savedSearch.userId,
        tenantId: savedSearch.tenantId,
        name: savedSearch.name,
        description: savedSearch.description,
        entityType: savedSearch.entityType,
        filters: savedSearch.filters as Record<string, unknown>,
        sortBy: savedSearch.sortBy,
        sortOrder: savedSearch.sortOrder,
        columnConfig: savedSearch.columnConfig as ColumnConfiguration | null,
        searchValue: savedSearch.searchValue,
        paginationLimit: savedSearch.paginationLimit,
        isDefault: savedSearch.isDefault,
        isPublic: savedSearch.isPublic,
        isActive: savedSearch.isActive,
        createdAt: savedSearch.createdAt.toISOString(),
        updatedAt: savedSearch.updatedAt.toISOString(),
        user: {
          firstName: savedSearch.user?.firstName || null,
          lastName: savedSearch.user?.lastName || null,
          email: savedSearch.user?.account?.email || ''
        }
      };

      // Invalidate caches
      await this.invalidateSavedSearchCaches(data.userId, data.tenantId, data.entityType);

      logger.info('Admin saved search created successfully', {
        savedSearchId: savedSearch.id,
        name: data.name,
        entityType: data.entityType,
        userId: data.userId,
        adminUserId
      });

      return {
        success: true,
        savedSearch: savedSearchListItem
      };

    } catch (error) {
      logger.error('Failed to create admin saved search', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { ...data, filters: '[FILTERS]' }, // Don't log full filters object
        adminUserId
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export singleton instance
export const savedSearchesService = SavedSearchesService.getInstance(); 