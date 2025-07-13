import { db as prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';

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
      parentId
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
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      skip: offset,
      include: {
        parent: true,
        subcategories: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
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
      where: { uuid: categoryId },
      include: {
        parent: true,
        subcategories: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
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
    parentId?: number;
  }) {
    const { name, slug, description, parentId } = categoryData;

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        parentId: parentId || null,
        isActive: true
      }
    });

    await this.invalidateCache();

    logger.info('New category created', {
      categoryId: newCategory.id,
      categoryName: name,
    });

    return newCategory;
  }

  async update(uuid: string, updates: any) {
    const updatedCategory = await prisma.category.update({
      where: { uuid },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    await this.invalidateCache();

    logger.info('Category updated', { categoryUuid: uuid, updates });

    return updatedCategory;
  }

  async delete(uuid: string) {
    // Delete associated CategoryTag entries first
    const category = await prisma.category.findUnique({
      where: { uuid },
      include: { tags: true }
    });

    if (category) {
      await prisma.categoryTag.deleteMany({
        where: { categoryId: category.id }
      });
    }

    const deletedCategory = await prisma.category.delete({
      where: { uuid }
    });

    await this.invalidateCache();

    logger.info('Category deleted', { categoryUuid: uuid });

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

export const categoriesService = new CategoriesService();