import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { L3CacheService } from './l3-cache.service';
import { CacheWarmingService } from './cache-warming.service';
import { PermissionCacheMiddleware, PermissionCacheInvalidator } from '../middleware/permission-cache.middleware';
import { PrismaModule } from '../database/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { MetricsModule } from '../metrics/metrics.module';
import { PermissionModule } from '@modules/permissions/permission.module';

/**
 * Cache Module
 * Provides comprehensive 3-layer caching infrastructure
 * 
 * Components:
 * - L3CacheService: Database-level persistent cache
 * - CacheWarmingService: Background cache warming with queue
 * - PermissionCacheMiddleware: Request-level cache integration
 * - PermissionCacheInvalidator: Cache invalidation utilities
 */
@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable cron jobs for cache warming
    PrismaModule,
    RedisModule,
    MetricsModule,
    PermissionModule,
  ],
  providers: [
    L3CacheService,
    CacheWarmingService,
    PermissionCacheMiddleware,
    PermissionCacheInvalidator,
  ],
  exports: [
    L3CacheService,
    CacheWarmingService,
    PermissionCacheMiddleware,
    PermissionCacheInvalidator,
  ],
})
export class CacheModule {}