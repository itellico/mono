import { PrismaClient } from '@prisma/client';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

interface TagFilters {
  search?: string;
  page?: number;
  limit?: number;
  categoryId?: number; // New filter for category
}

interface TagResponse {
  tags: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export class TagsService {
  private readonly CACHE_TTL = 300; // 5 minutes

  private generateCacheKey(filters: TagFilters): string {
    const filterString = JSON.stringify(filters);
    const hash = createHash('md5').update(filterString).digest('hex');
    return `cache:platform:tags:list:${hash}`;
  }

  private getSingleTagCacheKey(tagId: string): string {
    return `cache:platform:tags:${tagId}`;
  }

  private getTagsByCategoryCacheKey(categoryId: string): string {
    return `cache:platform:categories:${categoryId}:tags`;
  }

  async getAll(filters: TagFilters = {}): Promise<TagResponse> {
    const cacheKey = this.generateCacheKey(filters);

    try {
      const redis = await getRedisClient();
      const cachedResult = await redis.get(cacheKey);
      if (cachedResult) {
        logger.debug('Tags retrieved from cache', { cacheKey, filters });
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
      logger.debug('Tags cached successfully', { cacheKey, count: result.tags.length });
    } catch (error) {
      logger.warn('Redis cache write failed', { error: error.message, cacheKey });
    }

    return result;
  }

  private async queryDatabase(filters: TagFilters): Promise<TagResponse> {
    const {
      search = '',
      page = 1,
      limit = 20,
      categoryId = undefined
    } = filters;

    const offset = (page - 1) * Math.min(limit, 100);

    const whereConditions: any = {};

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId !== undefined) {
      whereConditions.categories = {
        some: {
          categoryId: categoryId
        }
      };
    }

    const tagsResult = await prisma.tag.findMany({
      where: whereConditions,
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(limit, 100),
      skip: offset,
      include: { // Include categories for display
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    const totalCount = await prisma.tag.count({
      where: whereConditions,
    });

    logger.info('Tags retrieved from database', {
      count: tagsResult.length,
      total: totalCount,
      filters
    });

    return {
      tags: tagsResult,
      pagination: {
        page,
        limit: Math.min(limit, 100),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Math.min(limit, 100)),
        hasMore: offset + Math.min(limit, 100) < totalCount
      }
    };
  }

  async getById(tagId: string): Promise<any> {
    const cacheKey = this.getSingleTagCacheKey(tagId);

    try {
      const redis = await getRedisClient();
      const cachedTag = await redis.get(cacheKey);
      if (cachedTag) {
        logger.debug('Single tag retrieved from cache', { cacheKey, tagId });
        return JSON.parse(cachedTag);
      }
    } catch (error) {
      logger.warn('Redis cache read failed for single tag', { 
        error: error.message, 
        cacheKey,
        tagId 
      });
    }

    const tag = await prisma.tag.findUnique({
      where: { id: parseInt(tagId) },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    if (tag) {
      try {
        const redis = await getRedisClient();
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(tag));
        logger.debug('Single tag cached successfully', { cacheKey, tagId });
      } catch (error) {
        logger.warn('Redis cache write failed for single tag', { 
          error: error.message, 
          cacheKey,
          tagId 
        });
      }
    }

    return tag;
  }

  async create(tagData: {
    name: string;
    slug: string;
    description?: string;
    categoryIds?: number[];
  }) {
    const { name, slug, description, categoryIds } = tagData;

    const newTag = await prisma.tag.create({
      data: {
        name,
        slug,
        description: description || null,
        isActive: true,
        categories: {
          create: categoryIds?.map(categoryId => ({ category: { connect: { id: categoryId } } })) || []
        }
      },
    });

    await this.invalidateCache();

    logger.info('New tag created', {
      tagId: newTag.id,
      tagName: name,
    });

    return newTag;
  }

  async update(id: string, updates: any) {
    const { categoryIds, ...rest } = updates;

    const updatedTag = await prisma.tag.update({
      where: { id: parseInt(id) },
      data: {
        ...rest,
        categories: {
          deleteMany: {},
          create: categoryIds?.map((categoryId: number) => ({ category: { connect: { id: categoryId } } })) || []
        }
      },
    });

    await this.invalidateCache();

    logger.info('Tag updated', { tagId: id, updates });

    return updatedTag;
  }

  async delete(id: string) {
    // Delete associated CategoryTag entries first
    await prisma.categoryTag.deleteMany({
      where: { tagId: parseInt(id) }
    });

    const deletedTag = await prisma.tag.delete({
      where: { id: parseInt(id) },
    });

    await this.invalidateCache();

    logger.info('Tag deleted', { tagId: id });

    return deletedTag;
  }

  async assignTagToCategory(tagId: string, categoryId: string) {
    const assignment = await prisma.categoryTag.create({
      data: {
        tagId: parseInt(tagId),
        categoryId: parseInt(categoryId)
      }
    });
    await this.invalidateCache();
    logger.info('Tag assigned to category', { tagId, categoryId });
    return assignment;
  }

  async removeTagFromCategory(tagId: string, categoryId: string) {
    const removal = await prisma.categoryTag.delete({
      where: {
        categoryId_tagId: {
          tagId: parseInt(tagId),
          categoryId: parseInt(categoryId)
        }
      }
    });
    await this.invalidateCache();
    logger.info('Tag removed from category', { tagId, categoryId });
    return removal;
  }

  async getTagsByCategoryId(categoryId: string): Promise<any[]> {
    const cacheKey = this.getTagsByCategoryCacheKey(categoryId);
    try {
      const redis = await getRedisClient();
      const cachedResult = await redis.get(cacheKey);
      if (cachedResult) {
        logger.debug('Tags by category retrieved from cache', { cacheKey, categoryId });
        return JSON.parse(cachedResult);
      }
    } catch (error) {
      logger.warn('Redis cache read failed for tags by category, continuing with database', { 
        error: error.message, 
        cacheKey 
      });
    }

    const tags = await prisma.tag.findMany({
      where: {
        categories: {
          some: {
            categoryId: parseInt(categoryId)
          }
        }
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    try {
      const redis = await getRedisClient();
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(tags));
      logger.debug('Tags by category cached successfully', { cacheKey, count: tags.length });
    } catch (error) {
      logger.warn('Redis cache write failed for tags by category', { error: error.message, cacheKey });
    }
    return tags;
  }

  async getCategoriesByTagId(tagId: string): Promise<any[]> {
    const tagWithCategories = await prisma.tag.findUnique({
      where: { id: parseInt(tagId) },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    return tagWithCategories?.categories.map((ct: any) => ct.category) || [];
  }

  async invalidateCache(): Promise<void> {
    try {
      const redis = await getRedisClient();
      const keys = await redis.keys('cache:platform:tags:*');
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info('Tag cache invalidated', { keysCleared: keys.length });
      }
      // Also invalidate category-specific tag caches
      const categoryTagKeys = await redis.keys('cache:platform:categories:*:tags');
      if (categoryTagKeys.length > 0) {
        await redis.del(...categoryTagKeys);
        logger.info('Category-tag cache invalidated', { keysCleared: categoryTagKeys.length });
      }
    } catch (error) {
      logger.warn('Cache invalidation failed', { error: error.message });
    }
  }

  async getStats() {
    const cacheKey = 'cache:platform:tags:stats';

    try {
      const redis = await getRedisClient();
      const cachedStats = await redis.get(cacheKey);
      if (cachedStats) {
        return JSON.parse(cachedStats);
      }
    } catch (error) {
      logger.warn('Stats cache read failed', { error: error.message });
    }

    const totalCount = await prisma.tag.count();
    const activeCount = await prisma.tag.count({
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

export const tagsService = new TagsService();