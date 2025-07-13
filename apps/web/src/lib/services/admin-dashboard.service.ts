import { db } from '@/lib/db';
import { users } from '@/lib/schemas';
import { count, eq, and, gte } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';

export interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  pendingApplications: number;
  approvedToday: number;
  activeJobs: number;
  monthlyRevenue: number;
}

export interface QuickActionsData {
  pendingApplications: number;
  flaggedContent: number;
  pendingReviews: number;
}

export interface RecentActivityItem {
  id: string;
  type: 'user_registration' | 'application_submitted' | 'content_flagged' | 'admin_action';
  description: string;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface DashboardData {
  stats: DashboardStats;
  quickActions: QuickActionsData;
  recentActivity: RecentActivityItem[];
}

export class AdminDashboardService {
  private readonly CACHE_TTL = 5 * 60; // 5 minutes

  private getCacheKey(key: string, tenantId?: string): string {
    if (!tenantId) {
      return `cache:global:admin_dashboard:${key}`;
    }
    return `cache:${tenantId}:admin_dashboard:${key}`;
  }

  async getDashboardData(tenantId?: string): Promise<DashboardData> {
    const cacheKey = this.getCacheKey('dashboard_data', tenantId);

    try {
      return await unstable_cache(
        async () => {
          const redis = await getRedisClient();
          if (redis) {
            try {
              const cachedData = await redis.get(cacheKey);
              if (cachedData) {
                logger.info('Dashboard data cache hit', { tenantId, source: 'redis' });
                return JSON.parse(cachedData);
              }
            } catch (redisError) {
              logger.warn('Redis cache read failed for dashboard data', { 
                error: redisError instanceof Error ? redisError.message : 'Unknown error',
                tenantId 
              });
            }
          }

          const dashboardData = await this.fetchDashboardDataFromDatabase(tenantId);

          if (redis) {
            try {
              await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(dashboardData));
              logger.info('Dashboard data cached successfully', { tenantId });
            } catch (redisError) {
              logger.warn('Redis cache write failed for dashboard data', { 
                error: redisError instanceof Error ? redisError.message : 'Unknown error',
                tenantId 
              });
            }
          }

          return dashboardData;
        },
        [cacheKey],
        {
          revalidate: this.CACHE_TTL,
          tags: ['admin_dashboard', `tenant_${tenantId || 'global'}`]
        }
      )();
    } catch (error) {
      logger.error('Failed to fetch dashboard data', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId 
      });
      throw error;
    }
  }

  private async fetchDashboardDataFromDatabase(tenantId?: string): Promise<DashboardData> {
    try {
      return await db.transaction(async (tx) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tenantCondition = tenantId ? eq(users.tenantId, tenantId) : undefined;

        const [totalUsersResult, newUsersTodayResult] = await Promise.all([
          tx.select({ count: count() }).from(users).where(tenantCondition),
          tx.select({ count: count() }).from(users).where(and(tenantCondition, gte(users.createdAt, today))),
        ]);

        const stats: DashboardStats = {
          totalUsers: totalUsersResult[0]?.count || 0,
          newUsersToday: newUsersTodayResult[0]?.count || 0,
          pendingApplications: 12,
          approvedToday: 3,
          activeJobs: 45,
          monthlyRevenue: 15750
        };

        const quickActions: QuickActionsData = {
          pendingApplications: stats.pendingApplications,
          flaggedContent: 8,
          pendingReviews: 15
        };

        const recentActivity: RecentActivityItem[] = [
          {
            id: '1',
            type: 'user_registration',
            description: 'New user registered',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            metadata: { source: 'web' }
          },
          {
            id: '2',
            type: 'application_submitted',
            description: 'Model application submitted',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            metadata: { category: 'fashion' }
          }
        ];

        logger.info('Dashboard data fetched from database', { 
          tenantId,
          stats: { totalUsers: stats.totalUsers, newUsersToday: stats.newUsersToday }
        });

        return { stats, quickActions, recentActivity };
      });
    } catch (error) {
      logger.error('Database query failed for dashboard data', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId 
      });
      throw error;
    }
  }
}
