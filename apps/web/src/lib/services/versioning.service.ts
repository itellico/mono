import { db } from '@/lib/db';
import { versionHistory } from '@/lib/schemas';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { eq, and, desc, count } from 'drizzle-orm';
import { createHash } from 'crypto';

export interface VersionEntry {
  tenantId: number;
  entityType: string;
  entityId: string;
  data: Record<string, any>;
  note?: string;
  createdBy: number;
}

export interface VersionFilters {
  tenantId: number;
  entityType?: string;
  entityId?: string;
  createdBy?: number;
  page?: number;
  limit?: number;
}

export interface VersionResponse {
  versions: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export class VersioningService {
  private readonly CACHE_TTL = 1800; // 30 minutes for version history

  /**
   * Generate cache key for version queries
   */
  private generateCacheKey(filters: VersionFilters): string {
    const filterString = JSON.stringify(filters);
    const hash = createHash('md5').update(filterString).digest('hex');
    return `cache:${filters.tenantId}:versions:list:${hash}`;
  }

  /**
   * Create a new version snapshot
   */
  async createVersion(entry: VersionEntry): Promise<number | null> {
    try {
      // Get next version number for this entity
      const latestVersion = await db
        .select({ version: versionHistory.version })
        .from(versionHistory)
        .where(
          and(
            eq(versionHistory.tenantId, entry.tenantId),
            eq(versionHistory.entityType, entry.entityType),
            eq(versionHistory.entityId, entry.entityId)
          )
        )
        .orderBy(desc(versionHistory.version))
        .limit(1);

      const nextVersion = latestVersion.length > 0 ? latestVersion[0].version + 1 : 1;

      const [result] = await db.insert(versionHistory).values({
        tenantId: entry.tenantId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        version: nextVersion,
        data: entry.data,
        note: entry.note,
        createdBy: entry.createdBy,
        createdAt: new Date()
      }).returning({ id: versionHistory.id });

      logger.info('Version snapshot created', {
        tenantId: entry.tenantId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        version: nextVersion,
        createdBy: entry.createdBy
      });

      // Invalidate cache
      await this.invalidateCache(entry.tenantId, entry.entityType, entry.entityId);

      return result.id;

    } catch (error) {
      logger.error('Failed to create version snapshot', {
        error: (error as Error).message,
        entry
      });
      return null;
    }
  }

  /**
   * Get version history for an entity
   */
  async getEntityVersions(tenantId: number, entityType: string, entityId: string): Promise<any[]> {
    const cacheKey = `cache:${tenantId}:versions:entity:${entityType}:${entityId}`;

    try {
      const redis = await getRedisClient();
      const cachedVersions = await redis.get(cacheKey);
      if (cachedVersions) {
        logger.debug('Entity versions retrieved from cache', { cacheKey });
        return JSON.parse(cachedVersions);
      }
    } catch (error) {
      logger.warn('Redis cache read failed for entity versions', { 
        error: (error as Error).message, 
        cacheKey 
      });
    }

    try {
      const versions = await db
        .select()
        .from(versionHistory)
        .where(
          and(
            eq(versionHistory.tenantId, tenantId),
            eq(versionHistory.entityType, entityType),
            eq(versionHistory.entityId, entityId)
          )
        )
        .orderBy(desc(versionHistory.version));

      try {
        const redis = await getRedisClient();
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(versions));
        logger.debug('Entity versions cached successfully', { cacheKey, count: versions.length });
      } catch (error) {
        logger.warn('Redis cache write failed for entity versions', { 
          error: (error as Error).message, 
          cacheKey 
        });
      }

      return versions;

    } catch (error) {
      logger.error('Failed to get entity versions', {
        error: (error as Error).message,
        tenantId,
        entityType,
        entityId
      });
      return [];
    }
  }

  /**
   * Get specific version by ID
   */
  async getVersionById(id: number, tenantId: number): Promise<any | null> {
    try {
      const version = await db
        .select()
        .from(versionHistory)
        .where(
          and(
            eq(versionHistory.id, id),
            eq(versionHistory.tenantId, tenantId)
          )
        )
        .limit(1);

      return version.length > 0 ? version[0] : null;

    } catch (error) {
      logger.error('Failed to get version by ID', {
        error: (error as Error).message,
        id,
        tenantId
      });
      return null;
    }
  }

  /**
   * Get latest version for an entity
   */
  async getLatestVersion(tenantId: number, entityType: string, entityId: string): Promise<any | null> {
    try {
      const version = await db
        .select()
        .from(versionHistory)
        .where(
          and(
            eq(versionHistory.tenantId, tenantId),
            eq(versionHistory.entityType, entityType),
            eq(versionHistory.entityId, entityId)
          )
        )
        .orderBy(desc(versionHistory.version))
        .limit(1);

      return version.length > 0 ? version[0] : null;

    } catch (error) {
      logger.error('Failed to get latest version', {
        error: (error as Error).message,
        tenantId,
        entityType,
        entityId
      });
      return null;
    }
  }

  /**
   * Invalidate version cache
   */
  async invalidateCache(tenantId: number, entityType?: string, entityId?: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      const patterns = [
        `cache:${tenantId}:versions:*`
      ];

      if (entityType && entityId) {
        patterns.push(`cache:${tenantId}:versions:entity:${entityType}:${entityId}`);
      }

      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          logger.debug('Version cache invalidated', { pattern, keysDeleted: keys.length });
        }
      }

    } catch (error) {
      logger.warn('Failed to invalidate version cache', { 
        error: (error as Error).message, 
        tenantId,
        entityType,
        entityId 
      });
    }
  }
}

// Export singleton instance
export const versioningService = new VersioningService(); 