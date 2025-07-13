import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { L3CacheService } from './l3-cache.service';
import { RedisService } from '../redis/redis.service';
import { PermissionService } from '@modules/permissions/permission.service';
import { MetricsService } from '../metrics/metrics.service';

/**
 * Cache Warming Service
 * Implements background cache warming using the CacheWarmupQueue table
 * Proactively loads permissions into all cache layers before they're needed
 * 
 * Features:
 * - Priority-based queue processing
 * - Scheduled warming for active users
 * - Smart prediction of cache needs
 * - Automatic queue cleanup
 * - Performance monitoring
 */
@Injectable()
export class CacheWarmingService {
  private readonly logger = new Logger(CacheWarmingService.name);
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly l3Cache: L3CacheService,
    private readonly redisService: RedisService,
    private readonly permissionService: PermissionService,
    private readonly metricsService: MetricsService,
  ) {}

  /**
   * Process warmup queue every 30 seconds
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processWarmupQueue(): Promise<void> {
    if (this.isProcessing) {
      this.logger.debug('Warmup queue processing already in progress, skipping');
      return;
    }

    this.isProcessing = true;
    try {
      await this.processQueueBatch();
    } catch (error) {
      this.logger.error('Error processing warmup queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Schedule active user cache warming every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduleActiveUserWarmup(): Promise<void> {
    try {
      const activeUsers = await this.getActiveUsers();
      
      for (const user of activeUsers) {
        await this.scheduleUserWarmup(user.id, 2, user.tenant_id); // Medium priority
      }

      this.logger.debug(`Scheduled warmup for ${activeUsers.length} active users`);

    } catch (error) {
      this.logger.error('Error scheduling active user warmup:', error);
    }
  }

  /**
   * Clean up old queue entries every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldQueueEntries(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      const result = await this.prisma.cacheWarmupQueue.deleteMany({
        where: {
          OR: [
            { status: 'completed', updated_at: { lt: cutoff } },
            { status: 'failed', updated_at: { lt: cutoff } },
            { scheduled_at: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // 7 days old
          ],
        },
      });

      if (result.count > 0) {
        this.logger.debug(`Cleaned up ${result.count} old warmup queue entries`);
      }

    } catch (error) {
      this.logger.error('Error cleaning up queue entries:', error);
    }
  }

  /**
   * Schedule cache warming for a specific user
   */
  async scheduleUserWarmup(
    userId: number,
    priority = 1,
    tenantId?: number,
    context = 'default'
  ): Promise<void> {
    try {
      const cacheKey = this.buildCacheKey(userId, tenantId, context);
      
      // Check if already scheduled
      const existing = await this.prisma.cacheWarmupQueue.findFirst({
        where: {
          cache_key: cacheKey,
          status: 'pending',
        },
      });

      if (existing) {
        // Update priority if higher
        if (priority > existing.priority) {
          await this.prisma.cacheWarmupQueue.update({
            where: { uuid: existing.uuid },
            data: { priority, updated_at: new Date() },
          });
        }
        return;
      }

      // Create new warmup task
      await this.prisma.cacheWarmupQueue.create({
        data: {
          cache_key: cacheKey,
          cache_type: 'permission',
          priority,
          user_id: userId,
          tenant_id: tenantId || null,
          metadata: JSON.stringify({ context, auto_scheduled: true }),
          scheduled_at: new Date(),
          status: 'pending',
        },
      });

      this.logger.debug(`Scheduled cache warmup for user ${userId} (priority: ${priority})`);

    } catch (error) {
      this.logger.error(`Error scheduling warmup for user ${userId}:`, error);
    }
  }

  /**
   * Schedule cache warming for all users in a tenant
   */
  async scheduleTenantWarmup(tenantId: number, priority = 1): Promise<void> {
    try {
      // Get all active users in the tenant
      const users = await this.prisma.user.findMany({
        where: { 
          tenant_id: tenantId,
          is_active: true,
        },
        select: { id: true },
      });

      const tasks = users.map(user => 
        this.scheduleUserWarmup(user.id, priority, tenantId)
      );

      await Promise.all(tasks);
      
      this.logger.debug(`Scheduled warmup for ${users.length} users in tenant ${tenantId}`);

    } catch (error) {
      this.logger.error(`Error scheduling tenant warmup for ${tenantId}:`, error);
    }
  }

  /**
   * Process a batch of warmup tasks from the queue
   */
  private async processQueueBatch(batchSize = 10): Promise<void> {
    try {
      // Get pending tasks ordered by priority (higher first) and scheduled time
      const tasks = await this.prisma.cacheWarmupQueue.findMany({
        where: { status: 'pending' },
        orderBy: [
          { priority: 'desc' },
          { scheduled_at: 'asc' },
        ],
        take: batchSize,
      });

      if (tasks.length === 0) {
        return;
      }

      this.logger.debug(`Processing ${tasks.length} warmup tasks`);

      // Process tasks in parallel (limited concurrency)
      const processPromises = tasks.map(task => this.processWarmupTask(task));
      await Promise.allSettled(processPromises);

    } catch (error) {
      this.logger.error('Error in processQueueBatch:', error);
    }
  }

  /**
   * Process a single warmup task
   */
  private async processWarmupTask(task: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Mark as processing
      await this.prisma.cacheWarmupQueue.update({
        where: { uuid: task.uuid },
        data: { 
          status: 'processing',
          updated_at: new Date(),
        },
      });

      // Parse metadata
      const metadata = JSON.parse(task.metadata || '{}');
      const context = metadata.context || 'default';

      // Warm the cache
      const success = await this.warmUserPermissions(
        task.user_id,
        task.tenant_id,
        context
      );

      const processingTime = Date.now() - startTime;

      // Update task status
      await this.prisma.cacheWarmupQueue.update({
        where: { uuid: task.uuid },
        data: {
          status: success ? 'completed' : 'failed',
          updated_at: new Date(),
          metadata: JSON.stringify({
            ...metadata,
            processing_time_ms: processingTime,
            completed_at: new Date().toISOString(),
          }),
        },
      });

      // Record metrics
      this.metricsService.recordCacheWarmupDuration(processingTime);
      
      if (success) {
        this.metricsService.incrementCacheWarmupSuccess();
        this.logger.debug(`Warmed cache for user ${task.user_id} in ${processingTime}ms`);
      } else {
        this.metricsService.incrementCacheWarmupFailure();
        this.logger.warn(`Failed to warm cache for user ${task.user_id}`);
      }

    } catch (error) {
      this.logger.error(`Error processing warmup task ${task.uuid}:`, error);
      
      // Mark as failed
      try {
        await this.prisma.cacheWarmupQueue.update({
          where: { uuid: task.uuid },
          data: {
            status: 'failed',
            updated_at: new Date(),
            metadata: JSON.stringify({
              error: error.message,
              failed_at: new Date().toISOString(),
            }),
          },
        });
      } catch (updateError) {
        this.logger.error('Error updating failed task status:', updateError);
      }
    }
  }

  /**
   * Warm permissions for a specific user across all cache layers
   */
  private async warmUserPermissions(
    userId: number,
    tenantId?: number,
    context = 'default'
  ): Promise<boolean> {
    try {
      // Load fresh permissions from source
      const [userPermissions, userRoles] = await Promise.all([
        this.permissionService.getUserPermissions(userId.toString()),
        this.permissionService.getUserRoles(userId.toString()),
      ]);

      if (!userPermissions || !userRoles) {
        this.logger.warn(`No permissions/roles found for user ${userId}`);
        return false;
      }

      const permissions = userPermissions.map(p => p.name);
      const roles = userRoles.map(r => r.id);

      // Store in L3 (Database cache)
      const l3Success = await this.l3Cache.setPermissions(
        userId,
        permissions,
        roles,
        tenantId,
        undefined, // accountId
        context,
        300 // 5-minute TTL
      );

      // Store in L2 (Redis cache)
      const redisKey = this.buildRedisKey(userId, tenantId);
      const cacheData = {
        permissions,
        roles,
        computed_at: new Date(),
        expires_at: new Date(Date.now() + 300000), // 5 minutes
        context,
      };

      const l2Success = await this.redisService.set(redisKey, cacheData, 300);

      // Update L3 Redis sync status
      if (l2Success && l3Success) {
        await this.l3Cache.markRedisSync(userId, tenantId, undefined, context, true);
      }

      return l3Success && l2Success;

    } catch (error) {
      this.logger.error(`Error warming permissions for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get list of active users for proactive warming
   */
  private async getActiveUsers(): Promise<Array<{ id: number; tenant_id: number | null }>> {
    try {
      // Get users who have been active in the last 30 minutes
      const cutoff = new Date(Date.now() - 30 * 60 * 1000);
      
      const activeUsers = await this.prisma.user.findMany({
        where: {
          is_active: true,
          // You might have a last_active_at field
          // last_active_at: { gte: cutoff },
        },
        select: {
          id: true,
          tenant_id: true,
        },
        take: 100, // Limit to prevent overwhelming the system
      });

      return activeUsers;

    } catch (error) {
      this.logger.error('Error getting active users:', error);
      return [];
    }
  }

  /**
   * Get warmup queue statistics
   */
  async getQueueStats(): Promise<WarmupQueueStats> {
    try {
      const [
        totalTasks,
        pendingTasks,
        processingTasks,
        completedTasks,
        failedTasks,
        recentTasks
      ] = await Promise.all([
        this.prisma.cacheWarmupQueue.count(),
        this.prisma.cacheWarmupQueue.count({ where: { status: 'pending' } }),
        this.prisma.cacheWarmupQueue.count({ where: { status: 'processing' } }),
        this.prisma.cacheWarmupQueue.count({ where: { status: 'completed' } }),
        this.prisma.cacheWarmupQueue.count({ where: { status: 'failed' } }),
        this.prisma.cacheWarmupQueue.count({
          where: { 
            scheduled_at: { gte: new Date(Date.now() - 3600000) } // Last hour
          }
        }),
      ]);

      const avgProcessingTime = await this.getAverageProcessingTime();

      return {
        total_tasks: totalTasks,
        pending_tasks: pendingTasks,
        processing_tasks: processingTasks,
        completed_tasks: completedTasks,
        failed_tasks: failedTasks,
        recent_tasks: recentTasks,
        average_processing_time_ms: avgProcessingTime,
        success_rate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      };

    } catch (error) {
      this.logger.error('Error getting queue stats:', error);
      return {
        total_tasks: 0,
        pending_tasks: 0,
        processing_tasks: 0,
        completed_tasks: 0,
        failed_tasks: 0,
        recent_tasks: 0,
        average_processing_time_ms: 0,
        success_rate: 0,
      };
    }
  }

  /**
   * Build cache key for warmup tasks
   */
  private buildCacheKey(userId: number, tenantId?: number, context = 'default'): string {
    const parts = ['mono', 'perms', userId.toString()];
    
    if (tenantId) {
      parts.push(`tenant:${tenantId}`);
    }
    
    if (context !== 'default') {
      parts.push(`ctx:${context}`);
    }
    
    return parts.join(':');
  }

  /**
   * Build Redis key
   */
  private buildRedisKey(userId: number, tenantId?: number): string {
    const parts = ['mono', 'perms', userId.toString()];
    
    if (tenantId) {
      parts.push(tenantId.toString());
    } else {
      parts.push('global');
    }
    
    return parts.join(':');
  }

  /**
   * Get average processing time from recent completed tasks
   */
  private async getAverageProcessingTime(): Promise<number> {
    try {
      const recentTasks = await this.prisma.cacheWarmupQueue.findMany({
        where: {
          status: 'completed',
          updated_at: { gte: new Date(Date.now() - 3600000) }, // Last hour
        },
        select: { metadata: true },
      });

      if (recentTasks.length === 0) return 0;

      const times = recentTasks
        .map(task => {
          try {
            const metadata = JSON.parse(task.metadata || '{}');
            return metadata.processing_time_ms || 0;
          } catch {
            return 0;
          }
        })
        .filter(time => time > 0);

      return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;

    } catch (error) {
      this.logger.warn('Error calculating average processing time:', error);
      return 0;
    }
  }
}

/**
 * Type definitions
 */
interface WarmupQueueStats {
  total_tasks: number;
  pending_tasks: number;
  processing_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  recent_tasks: number;
  average_processing_time_ms: number;
  success_rate: number;
}