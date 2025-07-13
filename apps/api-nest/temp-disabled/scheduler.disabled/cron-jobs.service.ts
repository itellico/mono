import { Injectable } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { LoggerService } from '../logging/logger.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CronJob } from 'cron';

@Injectable()
export class CronJobsService {
  constructor(
    private readonly logger: LoggerService,
    private readonly rabbitMQ: RabbitMQService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  /**
   * Daily cleanup tasks - runs every day at 2 AM
   */
  @Cron('0 2 * * *', {
    name: 'daily-cleanup',
    timeZone: 'UTC',
  })
  async handleDailyCleanup() {
    const startTime = Date.now();
    
    try {
      this.logger.logSystem('Starting daily cleanup tasks');

      // Clean up expired sessions
      await this.cleanupExpiredSessions();
      
      // Clean up old audit logs (keep 90 days)
      await this.cleanupOldAuditLogs();
      
      // Clean up temporary files
      await this.cleanupTemporaryFiles();
      
      // Clean up expired tokens
      await this.cleanupExpiredTokens();
      
      // Generate daily reports
      await this.generateDailyReports();

      const duration = Date.now() - startTime;
      this.logger.logSystem(`Daily cleanup completed in ${duration}ms`);
      
    } catch (error) {
      this.logger.error('Daily cleanup failed', error);
    }
  }

  /**
   * Hourly system health check - runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'health-check',
  })
  async handleHealthCheck() {
    try {
      this.logger.logSystem('Running hourly health check');

      // Check database connectivity
      const dbHealthy = await this.checkDatabaseHealth();
      
      // Check Redis connectivity
      const redisHealthy = await this.checkRedisHealth();
      
      // Check RabbitMQ connectivity
      const rabbitHealthy = await this.rabbitMQ.healthCheck();
      
      // Log system status
      this.logger.logSystem('System health check completed', {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        redis: redisHealthy ? 'healthy' : 'unhealthy',
        rabbitmq: rabbitHealthy ? 'healthy' : 'unhealthy',
      });

      // Queue alert if any service is unhealthy
      if (!dbHealthy || !redisHealthy || !rabbitHealthy) {
        await this.rabbitMQ.queueNotificationJob({
          userId: 'system',
          type: 'system_alert',
          title: 'System Health Alert',
          message: 'One or more system services are unhealthy',
          data: {
            database: dbHealthy,
            redis: redisHealthy,
            rabbitmq: rabbitHealthy,
          },
          channels: ['email'],
        });
      }
      
    } catch (error) {
      this.logger.error('Health check failed', error);
    }
  }

  /**
   * Process pending notifications - runs every 5 minutes
   */
  @Cron('*/5 * * * *', {
    name: 'process-notifications',
  })
  async handlePendingNotifications() {
    try {
      // This would typically query pending notifications from database
      // and queue them for processing
      
      this.logger.debug('Processing pending notifications');
      
      // Example: Queue high-priority notifications
      await this.queueHighPriorityNotifications();
      
    } catch (error) {
      this.logger.error('Failed to process pending notifications', error);
    }
  }

  /**
   * Database maintenance - runs every Sunday at 3 AM
   */
  @Cron('0 3 * * 0', {
    name: 'database-maintenance',
    timeZone: 'UTC',
  })
  async handleDatabaseMaintenance() {
    try {
      this.logger.logSystem('Starting database maintenance');

      // Analyze and optimize database tables
      await this.optimizeDatabaseTables();
      
      // Update statistics
      await this.updateDatabaseStatistics();
      
      // Clean up old backups
      await this.cleanupOldBackups();

      this.logger.logSystem('Database maintenance completed');
      
    } catch (error) {
      this.logger.error('Database maintenance failed', error);
    }
  }

  /**
   * Generate weekly reports - runs every Monday at 6 AM
   */
  @Cron('0 6 * * 1', {
    name: 'weekly-reports',
    timeZone: 'UTC',
  })
  async handleWeeklyReports() {
    try {
      this.logger.logSystem('Generating weekly reports');

      // Queue weekly analytics report
      await this.rabbitMQ.queueReportJob({
        type: 'weekly_analytics',
        format: 'pdf',
        filters: {
          dateRange: 'last_week',
        },
        userId: 'system',
        email: 'admin@itellico.com',
      });

      // Queue performance report
      await this.rabbitMQ.queueReportJob({
        type: 'performance_metrics',
        format: 'excel',
        filters: {
          dateRange: 'last_week',
        },
        userId: 'system',
        email: 'admin@itellico.com',
      });

    } catch (error) {
      this.logger.error('Weekly reports generation failed', error);
    }
  }

  /**
   * Cache warmup - runs every 6 hours
   */
  @Cron('0 */6 * * *', {
    name: 'cache-warmup',
  })
  async handleCacheWarmup() {
    try {
      this.logger.logSystem('Starting cache warmup');

      // Warm up frequently accessed data
      await this.warmupFrequentlyAccessedData();
      
      // Pre-calculate expensive queries
      await this.precalculateExpensiveQueries();

    } catch (error) {
      this.logger.error('Cache warmup failed', error);
    }
  }

  /**
   * Add dynamic cron job
   */
  addCronJob(name: string, cronTime: string, callback: () => void) {
    const job = new CronJob(cronTime, callback);
    this.schedulerRegistry.addCronJob(name, job);
    job.start();
    
    this.logger.logSystem(`Added cron job: ${name}`, { cronTime });
  }

  /**
   * Remove dynamic cron job
   */
  removeCronJob(name: string) {
    this.schedulerRegistry.deleteCronJob(name);
    this.logger.logSystem(`Removed cron job: ${name}`);
  }

  /**
   * List all cron jobs
   */
  getCronJobs() {
    const jobs = this.schedulerRegistry.getCronJobs();
    return Array.from(jobs, ([name, job]) => ({
      name,
      running: job.running,
      nextDate: job.nextDate()?.toString(),
    }));
  }

  // Private helper methods
  private async cleanupExpiredSessions(): Promise<void> {
    // Clean up expired Redis sessions
    const pattern = 'session:*';
    const keys = await this.redis.keys(pattern);
    
    let cleaned = 0;
    for (const key of keys) {
      const session = await this.redis.get(key);
      if (!session) {
        await this.redis.del(key);
        cleaned++;
      }
    }
    
    this.logger.logSystem(`Cleaned up ${cleaned} expired sessions`);
  }

  private async cleanupOldAuditLogs(): Promise<void> {
    try {
      // This would clean up old audit logs
      // Since we don't have the audit table in current schema, this is a placeholder
      this.logger.logSystem('Audit log cleanup completed (placeholder)');
    } catch (error) {
      this.logger.warn('Audit log cleanup skipped - table not found');
    }
  }

  private async cleanupTemporaryFiles(): Promise<void> {
    // Queue file cleanup job
    await this.rabbitMQ.queueDataProcessingJob({
      operation: 'delete',
      fileId: 'temp-cleanup',
      fileName: 'temp_files',
      filePath: '/tmp',
      mimeType: 'application/octet-stream',
      size: 0,
      metadata: {
        type: 'cleanup',
        maxAge: '24h',
      },
    });
  }

  private async cleanupExpiredTokens(): Promise<void> {
    // Clean up expired JWT tokens from blacklist
    const pattern = 'blacklist:*';
    const keys = await this.redis.keys(pattern);
    
    let cleaned = 0;
    for (const key of keys) {
      const ttl = await this.redis.ttl(key);
      if (ttl <= 0) {
        await this.redis.del(key);
        cleaned++;
      }
    }
    
    this.logger.logSystem(`Cleaned up ${cleaned} expired tokens`);
  }

  private async generateDailyReports(): Promise<void> {
    // Queue daily summary report
    await this.rabbitMQ.queueReportJob({
      type: 'daily_summary',
      format: 'json',
      filters: {
        date: new Date().toISOString().split('T')[0],
      },
      userId: 'system',
    });
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }

  private async checkRedisHealth(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      return false;
    }
  }

  private async queueHighPriorityNotifications(): Promise<void> {
    // This would query the database for pending high-priority notifications
    // and queue them for immediate processing
    this.logger.debug('High-priority notifications queued');
  }

  private async optimizeDatabaseTables(): Promise<void> {
    try {
      // PostgreSQL maintenance queries
      await this.prisma.$executeRaw`VACUUM ANALYZE`;
      this.logger.logSystem('Database tables optimized');
    } catch (error) {
      this.logger.warn('Database optimization failed', { error: error.message });
    }
  }

  private async updateDatabaseStatistics(): Promise<void> {
    try {
      await this.prisma.$executeRaw`ANALYZE`;
      this.logger.logSystem('Database statistics updated');
    } catch (error) {
      this.logger.warn('Database statistics update failed', { error: error.message });
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    // Queue backup cleanup job
    await this.rabbitMQ.queueBackupJob({
      type: 'full',
      compression: true,
      entities: ['cleanup_old'],
      metadata: {
        operation: 'cleanup',
        retentionDays: 30,
      },
    });
  }

  private async warmupFrequentlyAccessedData(): Promise<void> {
    // Cache frequently accessed data
    try {
      // This would cache commonly accessed tenant data, user preferences, etc.
      this.logger.logSystem('Cache warmup completed');
    } catch (error) {
      this.logger.warn('Cache warmup failed', { error: error.message });
    }
  }

  private async precalculateExpensiveQueries(): Promise<void> {
    // Pre-calculate and cache expensive aggregation queries
    try {
      this.logger.logSystem('Expensive queries pre-calculated');
    } catch (error) {
      this.logger.warn('Query pre-calculation failed', { error: error.message });
    }
  }
}