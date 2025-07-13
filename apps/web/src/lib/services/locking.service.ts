import { db } from '@/lib/db';
import { recordLocks } from '@/lib/schemas';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { eq, and, lt, gt } from 'drizzle-orm';

export interface LockEntry {
  tenantId: number;
  entityType: string;
  entityId: string;
  lockedBy: number;
  reason?: string;
  ttlMinutes?: number; // TTL in minutes, defaults to 30
}

export interface LockInfo {
  id: number;
  tenantId: number;
  entityType: string;
  entityId: string;
  lockedBy: number;
  lockedAt: Date;
  expiresAt: Date;
  reason?: string;
  isActive: boolean;
}

export class LockingService {
  private readonly DEFAULT_TTL_MINUTES = 30;
  private readonly REDIS_LOCK_PREFIX = 'lock';

  /**
   * Generate Redis key for entity lock
   */
  private getLockKey(tenantId: number, entityType: string, entityId: string): string {
    return `${this.REDIS_LOCK_PREFIX}:${tenantId}:${entityType}:${entityId}`;
  }

  /**
   * Acquire a lock on an entity
   */
  async acquireLock(entry: LockEntry): Promise<boolean> {
    const ttlMinutes = entry.ttlMinutes || this.DEFAULT_TTL_MINUTES;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    const lockKey = this.getLockKey(entry.tenantId, entry.entityType, entry.entityId);

    try {
      // Check if already locked
      const existingLock = await this.isLocked(entry.tenantId, entry.entityType, entry.entityId);
      if (existingLock && existingLock.lockedBy !== entry.lockedBy) {
        logger.info('Entity already locked by different user', {
          tenantId: entry.tenantId,
          entityType: entry.entityType,
          entityId: entry.entityId,
          currentUser: entry.lockedBy,
          lockedBy: existingLock.lockedBy
        });
        return false;
      }

      // Set Redis lock with TTL
      const redis = await getRedisClient();
      const lockData = {
        tenantId: entry.tenantId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        lockedBy: entry.lockedBy,
        lockedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        reason: entry.reason
      };

      await redis.setex(lockKey, ttlMinutes * 60, JSON.stringify(lockData));

      // Sync to database
      await db.insert(recordLocks).values({
        tenantId: entry.tenantId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        lockedBy: entry.lockedBy,
        lockedAt: new Date(),
        expiresAt,
        reason: entry.reason
      }).onConflictDoUpdate({
        target: [recordLocks.tenantId, recordLocks.entityType, recordLocks.entityId],
        set: {
          lockedBy: entry.lockedBy,
          lockedAt: new Date(),
          expiresAt,
          reason: entry.reason
        }
      });

      logger.info('Lock acquired successfully', {
        tenantId: entry.tenantId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        lockedBy: entry.lockedBy,
        ttlMinutes
      });

      return true;

    } catch (error) {
      logger.error('Failed to acquire lock', {
        error: (error as Error).message,
        entry
      });
      return false;
    }
  }

  /**
   * Release a lock on an entity
   */
  async releaseLock(tenantId: number, entityType: string, entityId: string, userId: number): Promise<boolean> {
    const lockKey = this.getLockKey(tenantId, entityType, entityId);

    try {
      // Check if user owns the lock
      const lockInfo = await this.isLocked(tenantId, entityType, entityId);
      if (lockInfo && lockInfo.lockedBy !== userId) {
        logger.warn('User attempted to release lock owned by different user', {
          tenantId,
          entityType,
          entityId,
          requestingUser: userId,
          lockOwner: lockInfo.lockedBy
        });
        return false;
      }

      // Remove from Redis
      const redis = await getRedisClient();
      await redis.del(lockKey);

      // Remove from database
      await db.delete(recordLocks).where(
        and(
          eq(recordLocks.tenantId, tenantId),
          eq(recordLocks.entityType, entityType),
          eq(recordLocks.entityId, entityId),
          eq(recordLocks.lockedBy, userId)
        )
      );

      logger.info('Lock released successfully', {
        tenantId,
        entityType,
        entityId,
        userId
      });

      return true;

    } catch (error) {
      logger.error('Failed to release lock', {
        error: (error as Error).message,
        tenantId,
        entityType,
        entityId,
        userId
      });
      return false;
    }
  }

  /**
   * Check if an entity is locked
   */
  async isLocked(tenantId: number, entityType: string, entityId: string): Promise<LockInfo | null> {
    const lockKey = this.getLockKey(tenantId, entityType, entityId);

    try {
      // Try Redis first
      const redis = await getRedisClient();
      const lockData = await redis.get(lockKey);

      if (lockData) {
        const parsed = JSON.parse(lockData);
        const expiresAt = new Date(parsed.expiresAt);
        const isActive = expiresAt > new Date();

        if (!isActive) {
          // Lock expired, clean up
          await redis.del(lockKey);
          await this.cleanupExpiredLock(tenantId, entityType, entityId);
          return null;
        }

        return {
          id: 0, // Redis locks don't have DB IDs
          tenantId: parsed.tenantId,
          entityType: parsed.entityType,
          entityId: parsed.entityId,
          lockedBy: parsed.lockedBy,
          lockedAt: new Date(parsed.lockedAt),
          expiresAt,
          reason: parsed.reason,
          isActive
        };
      }

    } catch (error) {
      logger.warn('Redis lock check failed, falling back to database', {
        error: (error as Error).message,
        lockKey
      });
    }

    // Fallback to database
    try {
      const now = new Date();
      const dbLock = await db
        .select()
        .from(recordLocks)
        .where(
          and(
            eq(recordLocks.tenantId, tenantId),
            eq(recordLocks.entityType, entityType),
            eq(recordLocks.entityId, entityId),
            gt(recordLocks.expiresAt, now) // Only active locks
          )
        )
        .limit(1);

      if (dbLock.length > 0) {
        const lock = dbLock[0];
        const isActive = lock.expiresAt > new Date();

        if (!isActive) {
          // Lock expired, clean up
          await this.cleanupExpiredLock(tenantId, entityType, entityId);
          return null;
        }

        return {
          id: lock.id,
          tenantId: lock.tenantId,
          entityType: lock.entityType,
          entityId: lock.entityId,
          lockedBy: lock.lockedBy ?? 0,
          lockedAt: lock.lockedAt,
          expiresAt: lock.expiresAt,
          reason: lock.reason ?? undefined,
          isActive
        };
      }

      return null;

    } catch (error) {
      logger.error('Failed to check lock status', {
        error: (error as Error).message,
        tenantId,
        entityType,
        entityId
      });
      return null;
    }
  }

  /**
   * Force release a lock (admin function)
   */
  async forceReleaseLock(tenantId: number, entityType: string, entityId: string): Promise<boolean> {
    const lockKey = this.getLockKey(tenantId, entityType, entityId);

    try {
      // Remove from Redis
      const redis = await getRedisClient();
      await redis.del(lockKey);

      // Remove from database
      await db.delete(recordLocks).where(
        and(
          eq(recordLocks.tenantId, tenantId),
          eq(recordLocks.entityType, entityType),
          eq(recordLocks.entityId, entityId)
        )
      );

      logger.info('Lock force released', {
        tenantId,
        entityType,
        entityId
      });

      return true;

    } catch (error) {
      logger.error('Failed to force release lock', {
        error: (error as Error).message,
        tenantId,
        entityType,
        entityId
      });
      return false;
    }
  }

  /**
   * Clean up expired locks
   */
  async cleanupExpiredLocks(): Promise<number> {
    try {
      const now = new Date();

      // Get expired locks from database
      const expiredLocks = await db
        .select()
        .from(recordLocks)
        .where(lt(recordLocks.expiresAt, now));

      // Clean up Redis keys for expired locks
      const redis = await getRedisClient();
      for (const lock of expiredLocks) {
        const lockKey = this.getLockKey(lock.tenantId, lock.entityType, lock.entityId);
        await redis.del(lockKey);
      }

      // Remove from database
      const result = await db
        .delete(recordLocks)
        .where(lt(recordLocks.expiresAt, now));

      logger.info('Expired locks cleaned up', {
        count: expiredLocks.length
      });

      return expiredLocks.length;

    } catch (error) {
      logger.error('Failed to cleanup expired locks', {
        error: (error as Error).message
      });
      return 0;
    }
  }

  /**
   * Clean up a specific expired lock
   */
  private async cleanupExpiredLock(tenantId: number, entityType: string, entityId: string): Promise<void> {
    try {
      await db.delete(recordLocks).where(
        and(
          eq(recordLocks.tenantId, tenantId),
          eq(recordLocks.entityType, entityType),
          eq(recordLocks.entityId, entityId),
          lt(recordLocks.expiresAt, new Date())
        )
      );

      logger.debug('Expired lock cleaned up', {
        tenantId,
        entityType,
        entityId
      });

    } catch (error) {
      logger.error('Failed to cleanup specific expired lock', {
        error: (error as Error).message,
        tenantId,
        entityType,
        entityId
      });
    }
  }

  /**
   * Get all active locks for a tenant
   */
  async getActiveLocks(tenantId: number): Promise<LockInfo[]> {
    try {
      const now = new Date();
      const locks = await db
        .select()
        .from(recordLocks)
        .where(
          and(
            eq(recordLocks.tenantId, tenantId),
            gt(recordLocks.expiresAt, now) // Only active locks
          )
        );

      return locks.map(lock => ({
        id: lock.id,
        tenantId: lock.tenantId,
        entityType: lock.entityType,
        entityId: lock.entityId,
        lockedBy: lock.lockedBy ?? 0,
        lockedAt: lock.lockedAt,
        expiresAt: lock.expiresAt,
        reason: lock.reason ?? undefined,
        isActive: true
      }));

    } catch (error) {
      logger.error('Failed to get active locks', {
        error: (error as Error).message,
        tenantId
      });
      return [];
    }
  }
}

// Export singleton instance
export const lockingService = new LockingService(); 