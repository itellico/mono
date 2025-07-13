import { PrismaClient } from '@prisma/client';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

interface CategoryFilters {
  search?: string;
  page?: number;
  limit?: number;
  parentId?: number | null;
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

export class CategoryService {
  private readonly CACHE_TTL = 300; // 5 minutes

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

    const result = await this.queryDatabase(filters);

    try {
      const redis = await getRedisClient();
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      logger.debug('Categories cached successfully', { cacheKey, count: result.categories.length });
    } catch (error) {
      logger.warn('Redis cache write failed', { error: error.message, cacheKey });
    }

    return result;
  }

  private async queryDatabase(filters: CategoryFilters): Promise<CategoryResponse> {
    const {
      search = '',
      page = 1,
      limit = 20,
      parentId = undefined // Use undefined for top-level categories or all if not specified
    } = filters;

    const offset = (page - 1) * Math.min(limit, 100);

    const whereConditions: any = {};

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (parentId !== undefined) {
      whereConditions.parentId = parentId;
    }

    const categoriesResult = await prisma.category.findMany({
      where: whereConditions,
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(limit, 100),
      skip: offset,
      include: { // Include subcategories for hierarchical display
        subcategories: true,
      },
    });

    const totalCount = await prisma.category.count({
      where: whereConditions,
    });

    logger.info('Categories retrieved from database', {
      count: categoriesResult.length,
      total: totalCount,
      filters
    });

    return {
      categories: categoriesResult,
      pagination: {
        page,
        limit: Math.min(limit, 100),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Math.min(limit, 100)),
        hasMore: offset + Math.min(limit, 100) < totalCount
      }
    };
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

    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) },
      include: { // Include subcategories and parent for full context
        subcategories: true,
        parent: true,
      },
    });

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
  }

  async create(categoryData: {
    name: string;
    slug: string;
    description?: string;
    parentId?: number | null;
  }) {
    const { name, slug, description, parentId } = categoryData;

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        parentId: parentId || null,
        isActive: true
      },
    });

    await this.invalidateCache();

    logger.info('New category created', {
      categoryId: newCategory.id,
      categoryName: name,
    });

    return newCategory;
  }

  async update(id: string, updates: any) {
    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: updates,
    });

    await this.invalidateCache();

    logger.info('Category updated', { categoryId: id, updates });

    return updatedCategory;
  }

  async delete(id: string) {
    // Before deleting, consider handling child categories: cascade delete, nullify parentId, or prevent deletion
    // For now, let's prevent deletion if children exist to avoid orphaned records.
    const childCategories = await prisma.category.count({
      where: { parentId: parseInt(id) },
    });

    if (childCategories > 0) {
      throw new Error('Cannot delete category with existing subcategories. Please reassign or delete subcategories first.');
    }

    const deletedCategory = await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    await this.invalidateCache();

    logger.info('Category deleted', { categoryId: id });

    return deletedCategory;
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

    const totalCount = await prisma.category.count();
    const activeCount = await prisma.category.count({
      where: { isActive: true },
    });

    const stats = {
      total: totalCount,
      active: activeCount,
      inactive: totalCount - activeCount
    };

    try {
      const redis = await getRedisClient();
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(stats));
    } catch (error) {
      logger.warn('Stats cache write failed', { error: error.message });
    }

    return stats;
  }
}

export const categoryService = new CategoryService();
