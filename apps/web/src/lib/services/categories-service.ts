// ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
// ❌ REMOVED: Direct database imports (architectural violation)
// import { db as prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';
import { ApiAuthService } from '@/lib/api-clients/api-auth.service';

interface CategoryFilters {
  search?: string;
  page?: number;
  limit?: number;
  parentId?: number;
}

interface CategoryResponse {
  categories: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export class CategoriesService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  private generateCacheKey(filters: CategoryFilters): string {
    const filterString = JSON.stringify(filters);
    const hash = createHash('md5').update(filterString).digest('hex');
    return `cache:platform:categories:list:${hash}`;
  }

  private getSingleCategoryCacheKey(categoryId: string): string {
    return `cache:platform:categories:${categoryId}`;
  }

  async getAll(filters: CategoryFilters = {}): Promise<CategoryResponse> {
    const cacheKey = this.generateCacheKey(filters);

    try {
      const redis = await getRedisClient();
      const cachedResult = await redis.get(cacheKey);
      if (cachedResult) {
        logger.debug('Categories retrieved from cache', { cacheKey, filters });
        return JSON.parse(cachedResult);
      }
    } catch (error) {
      logger.warn('Redis cache read failed, continuing with database', { 
        error: error.message, 
        cacheKey 
      });
    }

    const result = await this.queryAPI(filters);

    try {
      const redis = await getRedisClient();
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      logger.debug('Categories cached successfully', { cacheKey, count: result.categories.length });
    } catch (error) {
      logger.warn('Redis cache write failed', { error: error.message, cacheKey });
    }

    return result;
  }

  private async queryAPI(filters: CategoryFilters): Promise<CategoryResponse> {
    try {
      const {
        search = '',
        page = 1,
        limit = 20,
        parentId
      } = filters;

      logger.info('Querying categories from API', { filters });

      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: Math.min(limit, 100).toString(),
      });

      if (search) {
        queryParams.set('search', search);
      }

      if (parentId !== undefined) {
        queryParams.set('parentId', parentId.toString());
      }

      const response = await fetch(
        `${CategoriesService.API_BASE_URL}/api/v1/admin/categories?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.data || data;

      logger.info('Categories retrieved from API', {
        count: result.categories?.length || 0,
        total: result.pagination?.total || 0,
        filters
      });

      return {
        categories: result.categories || result.items || [],
        pagination: result.pagination || {
          page,
          limit: Math.min(limit, 100),
          total: 0,
          totalPages: 0,
          hasMore: false
        }
      };
    } catch (error) {
      logger.error('Failed to query categories via API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters
      });
      throw error;
    }
  }

  async getById(categoryId: string): Promise<any> {
    const cacheKey = this.getSingleCategoryCacheKey(categoryId);

    try {
      const redis = await getRedisClient();
      const cachedCategory = await redis.get(cacheKey);
      if (cachedCategory) {
        logger.debug('Single category retrieved from cache', { cacheKey, categoryId });
        return JSON.parse(cachedCategory);
      }
    } catch (error) {
      logger.warn('Redis cache read failed for single category', { 
        error: error.message, 
        cacheKey,
        categoryId 
      });
    }

    try {
      logger.info('Fetching category from API', { categoryId });

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${CategoriesService.API_BASE_URL}/api/v1/admin/categories/${categoryId}`,
        { headers }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch category: ${response.statusText}`);
      }

      const data = await response.json();
      const category = data.data || data;

      if (category) {
        try {
          const redis = await getRedisClient();
          await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(category));
          logger.debug('Single category cached successfully', { cacheKey, categoryId });
        } catch (error) {
          logger.warn('Redis cache write failed for single category', { 
            error: error.message, 
            cacheKey,
            categoryId 
          });
        }
      }

      return category;
    } catch (error) {
      logger.error('Failed to fetch category via API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        categoryId
      });
      throw error;
    }
  }

  async create(categoryData: {
    name: string;
    slug: string;
    description?: string;
    parentId?: number;
  }) {
    try {
      const { name, slug, description, parentId } = categoryData;

      logger.info('Creating category via API', { name, slug });

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${CategoriesService.API_BASE_URL}/api/v1/admin/categories`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            slug,
            description: description || null,
            parentId: parentId || null,
            isActive: true
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create category: ${response.statusText}`);
      }

      const data = await response.json();
      const newCategory = data.data || data;

      await this.invalidateCache();

      logger.info('New category created via API', {
        categoryId: newCategory.id,
        categoryName: name,
      });

      return newCategory;
    } catch (error) {
      logger.error('Failed to create category via API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        categoryData
      });
      throw error;
    }
  }

  async update(uuid: string, updates: any) {
    try {
      logger.info('Updating category via API', { uuid, updates });

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${CategoriesService.API_BASE_URL}/api/v1/admin/categories/${uuid}`,
        {
          method: 'PUT',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update category: ${response.statusText}`);
      }

      const data = await response.json();
      const updatedCategory = data.data || data;

      await this.invalidateCache();

      logger.info('Category updated via API', { categoryUuid: uuid, updates });

      return updatedCategory;
    } catch (error) {
      logger.error('Failed to update category via API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        uuid,
        updates
      });
      throw error;
    }
  }

  async delete(uuid: string) {
    try {
      logger.info('Deleting category via API', { uuid });

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${CategoriesService.API_BASE_URL}/api/v1/admin/categories/${uuid}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete category: ${response.statusText}`);
      }

      await this.invalidateCache();

      logger.info('Category deleted via API', { categoryUuid: uuid });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete category via API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        uuid
      });
      throw error;
    }
  }

  async invalidateCache(): Promise<void> {
    try {
      const redis = await getRedisClient();
      const keys = await redis.keys('cache:platform:categories:*');
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info('Category cache invalidated', { keysCleared: keys.length });
      }
    } catch (error) {
      logger.warn('Cache invalidation failed', { error: error.message });
    }
  }

  async getStats() {
    const cacheKey = 'cache:platform:categories:stats';

    try {
      const redis = await getRedisClient();
      const cachedStats = await redis.get(cacheKey);
      if (cachedStats) {
        return JSON.parse(cachedStats);
      }
    } catch (error) {
      logger.warn('Stats cache read failed', { error: error.message });
    }

    try {
      logger.info('Fetching category stats from API');

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${CategoriesService.API_BASE_URL}/api/v1/admin/categories/stats`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch category stats: ${response.statusText}`);
      }

      const data = await response.json();
      const stats = data.data || data;

      try {
        const redis = await getRedisClient();
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(stats));
      } catch (error) {
        logger.warn('Stats cache write failed', { error: error.message });
      }

      logger.info('Category stats retrieved from API', { stats });
      return stats;
    } catch (error) {
      logger.error('Failed to fetch category stats via API', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Fallback stats
      return {
        total: 0,
        active: 0,
        inactive: 0
      };
    }
  }
}

export const categoriesService = new CategoriesService();