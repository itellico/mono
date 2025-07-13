/**
 * Categories Service - API Client
 * 
 * ✅ ARCHITECTURE COMPLIANCE: Uses API calls instead of direct database access
 * All category operations go through NestJS API with proper authentication
 */

import { ApiAuthService } from '@/lib/api-clients/api-auth.service';
import { logger } from '@/lib/logger';
import { getRedisClient } from '@/lib/redis';
import { EntityType } from '@/lib/schemas/entities';

export interface Category {
  id: string;
  uuid: string;
  tenantId: number;
  name: string;
  description?: string;
  slug: string;
  color?: string;
  icon?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
  metadata?: any;
  entityCounts?: Record<string, number>;
  children?: Category[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  uuid: string;
  tenantId: number;
  name: string;
  description?: string;
  slug: string;
  color?: string;
  categoryId?: string;
  isActive: boolean;
  isSystem: boolean;
  usageCount: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  totalTags: number;
  activeTags: number;
  systemCategories: number;
  userCategories: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  sortOrder?: number;
  metadata?: any;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
  metadata?: any;
}

export interface CreateTagRequest {
  name: string;
  description?: string;
  color?: string;
  categoryId?: string;
  metadata?: any;
}

export interface UpdateTagRequest {
  name?: string;
  description?: string;
  color?: string;
  categoryId?: string;
  isActive?: boolean;
  metadata?: any;
}

export class CategoriesService {
  private static readonly CACHE_TTL = 300; // 5 minutes
  private static readonly CACHE_PREFIX = 'categories:';
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  /**
   * Get all categories and tags with statistics
   */
  static async getCategoriesAndTags(
    tenantId: number,
    userId: number,
    options: {
      includeInactive?: boolean;
      includeSystem?: boolean;
    } = {}
  ): Promise<{
    categories: Category[];
    tags: Tag[];
    stats: CategoryStats;
  }> {
    const { includeInactive = false, includeSystem = true } = options;

    // Basic authentication check
    if (!userId) {
      throw new Error('Authentication required');
    }

    const cacheKey = `${this.CACHE_PREFIX}${tenantId}:${includeInactive}:${includeSystem}`;

    // Try cache first
    try {
      const redis = await getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Categories cache hit', { tenantId, cacheKey });
        return JSON.parse(cached);
      }
    } catch (redisError) {
      logger.warn('Redis unavailable for categories cache', {
        error: redisError instanceof Error ? redisError.message : String(redisError)
      });
    }

    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        tenantId: tenantId.toString(),
        includeInactive: includeInactive.toString(),
        includeSystem: includeSystem.toString(),
      });

      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/categories?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch categories and tags: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.data || data;

      // Cache the result
      try {
        const redis = await getRedisClient();
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
        logger.debug('Categories cached successfully', { tenantId });
      } catch (redisError) {
        logger.warn('Failed to cache categories', {
          error: redisError instanceof Error ? redisError.message : String(redisError)
        });
      }

      return result;

    } catch (error) {
      logger.error('Failed to fetch categories and tags', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId,
        options
      });
      throw error;
    }
  }

  /**
   * Get categories only
   */
  static async getCategories(
    tenantId: number,
    userId: number,
    options: {
      includeInactive?: boolean;
      includeSystem?: boolean;
      includeChildren?: boolean;
    } = {}
  ): Promise<Category[]> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        tenantId: tenantId.toString(),
        ...Object.fromEntries(
          Object.entries(options).map(([key, value]) => [key, String(value)])
        ),
      });

      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/categories/list?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;

    } catch (error) {
      logger.error('Failed to fetch categories', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId,
        options
      });
      throw error;
    }
  }

  /**
   * Get tags only
   */
  static async getTags(
    tenantId: number,
    userId: number,
    categoryId?: string,
    includeInactive: boolean = false
  ): Promise<Tag[]> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        tenantId: tenantId.toString(),
        includeInactive: includeInactive.toString(),
        ...(categoryId && { categoryId }),
      });

      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/categories/tags?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;

    } catch (error) {
      logger.error('Failed to fetch tags', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId,
        categoryId
      });
      throw error;
    }
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(id: string, userId: number): Promise<Category | null> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/categories/${id}`,
        { headers }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch category: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;

    } catch (error) {
      logger.error('Failed to fetch category by ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw error;
    }
  }

  /**
   * Get tag by ID
   */
  static async getTagById(id: string, userId: number): Promise<Tag | null> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/categories/tags/${id}`,
        { headers }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch tag: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;

    } catch (error) {
      logger.error('Failed to fetch tag by ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw error;
    }
  }

  /**
   * Create a new category
   */
  static async createCategory(
    tenantId: number,
    userId: number,
    categoryData: CreateCategoryRequest
  ): Promise<Category> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/categories`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...categoryData,
            tenantId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create category: ${response.statusText}`);
      }

      const result = await response.json();
      const newCategory = result.data || result;

      // Invalidate cache
      await this.invalidateCache(tenantId);

      logger.info('Category created', {
        id: newCategory.id,
        name: newCategory.name,
        tenantId
      });

      return newCategory;

    } catch (error) {
      logger.error('Failed to create category', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId,
        categoryData
      });
      throw error;
    }
  }

  /**
   * Update a category
   */
  static async updateCategory(
    id: string,
    userId: number,
    updateData: UpdateCategoryRequest
  ): Promise<Category> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/categories/${id}`,
        {
          method: 'PUT',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update category: ${response.statusText}`);
      }

      const result = await response.json();
      const updatedCategory = result.data || result;

      // Invalidate cache
      await this.invalidateCache(updatedCategory.tenantId);

      logger.info('Category updated', {
        id: updatedCategory.id,
        name: updatedCategory.name
      });

      return updatedCategory;

    } catch (error) {
      logger.error('Failed to update category', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        updateData
      });
      throw error;
    }
  }

  /**
   * Delete a category
   */
  static async deleteCategory(id: string, userId: number): Promise<boolean> {
    try {
      // Get category for cache invalidation
      const category = await this.getCategoryById(id, userId);
      if (!category) {
        return false;
      }

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/categories/${id}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete category: ${response.statusText}`);
      }

      // Invalidate cache
      await this.invalidateCache(category.tenantId);

      logger.info('Category deleted', { id });

      return true;

    } catch (error) {
      logger.error('Failed to delete category', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw error;
    }
  }

  /**
   * Create a new tag
   */
  static async createTag(
    tenantId: number,
    userId: number,
    tagData: CreateTagRequest
  ): Promise<Tag> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/categories/tags`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...tagData,
            tenantId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create tag: ${response.statusText}`);
      }

      const result = await response.json();
      const newTag = result.data || result;

      // Invalidate cache
      await this.invalidateCache(tenantId);

      logger.info('Tag created', {
        id: newTag.id,
        name: newTag.name,
        tenantId
      });

      return newTag;

    } catch (error) {
      logger.error('Failed to create tag', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId,
        tagData
      });
      throw error;
    }
  }

  /**
   * Update a tag
   */
  static async updateTag(
    id: string,
    userId: number,
    updateData: UpdateTagRequest
  ): Promise<Tag> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/categories/tags/${id}`,
        {
          method: 'PUT',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update tag: ${response.statusText}`);
      }

      const result = await response.json();
      const updatedTag = result.data || result;

      // Invalidate cache
      await this.invalidateCache(updatedTag.tenantId);

      logger.info('Tag updated', {
        id: updatedTag.id,
        name: updatedTag.name
      });

      return updatedTag;

    } catch (error) {
      logger.error('Failed to update tag', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        updateData
      });
      throw error;
    }
  }

  /**
   * Delete a tag
   */
  static async deleteTag(id: string, userId: number): Promise<boolean> {
    try {
      // Get tag for cache invalidation
      const tag = await this.getTagById(id, userId);
      if (!tag) {
        return false;
      }

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/categories/tags/${id}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete tag: ${response.statusText}`);
      }

      // Invalidate cache
      await this.invalidateCache(tag.tenantId);

      logger.info('Tag deleted', { id });

      return true;

    } catch (error) {
      logger.error('Failed to delete tag', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw error;
    }
  }

  /**
   * Get categories by entity type
   */
  static async getCategoriesByEntityType(
    tenantId: number,
    entityType: EntityType,
    userId: number,
    includeInactive: boolean = false
  ): Promise<Category[]> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        tenantId: tenantId.toString(),
        entityType,
        includeInactive: includeInactive.toString(),
      });

      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/categories/by-entity?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch categories by entity type: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;

    } catch (error) {
      logger.error('Failed to fetch categories by entity type', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId,
        entityType
      });
      throw error;
    }
  }

  /**
   * Bulk import categories
   */
  static async importCategories(
    tenantId: number,
    userId: number,
    categories: CreateCategoryRequest[]
  ): Promise<{ created: number; errors: any[] }> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/categories/import`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenantId,
            categories,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to import categories: ${response.statusText}`);
      }

      const result = await response.json();
      const importResult = result.data || result;

      // Invalidate cache
      await this.invalidateCache(tenantId);

      logger.info('Categories imported', {
        tenantId,
        created: importResult.created,
        errors: importResult.errors?.length || 0
      });

      return importResult;

    } catch (error) {
      logger.error('Failed to import categories', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId,
        count: categories.length
      });
      throw error;
    }
  }

  /**
   * Get category statistics
   */
  static async getCategoryStats(tenantId: number, userId: number): Promise<CategoryStats> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/categories/stats?tenantId=${tenantId}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch category stats: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;

    } catch (error) {
      logger.error('Failed to fetch category stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId
      });
      throw error;
    }
  }

  /**
   * Search categories and tags
   */
  static async searchCategoriesAndTags(
    tenantId: number,
    query: string,
    userId: number,
    options: {
      includeInactive?: boolean;
      limit?: number;
    } = {}
  ): Promise<{ categories: Category[]; tags: Tag[] }> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        tenantId: tenantId.toString(),
        q: query,
        includeInactive: (options.includeInactive || false).toString(),
        limit: (options.limit || 50).toString(),
      });

      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/categories/search?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to search categories and tags: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;

    } catch (error) {
      logger.error('Failed to search categories and tags', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId,
        query
      });
      throw error;
    }
  }

  /**
   * Invalidate cache for a tenant
   */
  private static async invalidateCache(tenantId: number): Promise<void> {
    try {
      const redis = await getRedisClient();
      const pattern = `${this.CACHE_PREFIX}${tenantId}:*`;
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug('Categories cache invalidated', { tenantId, keysDeleted: keys.length });
      }
    } catch (error) {
      logger.warn('Failed to invalidate categories cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId
      });
    }
  }
}

// Export singleton instance
export const categoriesService = new CategoriesService();