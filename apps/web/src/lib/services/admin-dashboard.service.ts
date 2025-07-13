/**
 * Admin Dashboard Service - API Client
 * 
 * ✅ ARCHITECTURE COMPLIANCE: Uses API calls instead of direct database access
 * All dashboard operations go through NestJS API with proper authentication
 */

import { ApiAuthService } from '@/lib/api-clients/api-auth.service';
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
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

          const dashboardData = await this.fetchDashboardDataFromAPI(tenantId);

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

  private async fetchDashboardDataFromAPI(tenantId?: string): Promise<DashboardData> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const url = tenantId 
        ? `${this.API_BASE_URL}/api/v1/admin/dashboard?tenantId=${tenantId}`
        : `${this.API_BASE_URL}/api/v1/admin/dashboard`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;

    } catch (error) {
      logger.error('Failed to fetch dashboard data from API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId
      });
      
      // Return default empty data on error
      return {
        stats: {
          totalUsers: 0,
          newUsersToday: 0,
          pendingApplications: 0,
          approvedToday: 0,
          activeJobs: 0,
          monthlyRevenue: 0
        },
        quickActions: {
          pendingApplications: 0,
          flaggedContent: 0,
          pendingReviews: 0
        },
        recentActivity: []
      };
    }
  }

  async getDashboardStats(tenantId?: string): Promise<DashboardStats> {
    const cacheKey = this.getCacheKey('stats', tenantId);

    try {
      const redis = await getRedisClient();
      if (redis) {
        const cachedStats = await redis.get(cacheKey);
        if (cachedStats) {
          logger.info('Dashboard stats cache hit', { tenantId });
          return JSON.parse(cachedStats);
        }
      }

      const headers = await ApiAuthService.getAuthHeaders();
      const url = tenantId 
        ? `${this.API_BASE_URL}/api/v1/admin/dashboard/stats?tenantId=${tenantId}`
        : `${this.API_BASE_URL}/api/v1/admin/dashboard/stats`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
      }

      const data = await response.json();
      const stats = data.data || data;

      if (redis) {
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(stats));
      }

      return stats;

    } catch (error) {
      logger.error('Failed to fetch dashboard stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId
      });
      
      return {
        totalUsers: 0,
        newUsersToday: 0,
        pendingApplications: 0,
        approvedToday: 0,
        activeJobs: 0,
        monthlyRevenue: 0
      };
    }
  }

  async getQuickActions(tenantId?: string): Promise<QuickActionsData> {
    const cacheKey = this.getCacheKey('quick_actions', tenantId);

    try {
      const redis = await getRedisClient();
      if (redis) {
        const cachedActions = await redis.get(cacheKey);
        if (cachedActions) {
          logger.info('Quick actions cache hit', { tenantId });
          return JSON.parse(cachedActions);
        }
      }

      const headers = await ApiAuthService.getAuthHeaders();
      const url = tenantId 
        ? `${this.API_BASE_URL}/api/v1/admin/dashboard/quick-actions?tenantId=${tenantId}`
        : `${this.API_BASE_URL}/api/v1/admin/dashboard/quick-actions`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch quick actions: ${response.statusText}`);
      }

      const data = await response.json();
      const actions = data.data || data;

      if (redis) {
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(actions));
      }

      return actions;

    } catch (error) {
      logger.error('Failed to fetch quick actions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId
      });
      
      return {
        pendingApplications: 0,
        flaggedContent: 0,
        pendingReviews: 0
      };
    }
  }

  async getRecentActivity(tenantId?: string, limit: number = 10): Promise<RecentActivityItem[]> {
    const cacheKey = this.getCacheKey(`recent_activity_${limit}`, tenantId);

    try {
      const redis = await getRedisClient();
      if (redis) {
        const cachedActivity = await redis.get(cacheKey);
        if (cachedActivity) {
          logger.info('Recent activity cache hit', { tenantId });
          return JSON.parse(cachedActivity);
        }
      }

      const headers = await ApiAuthService.getAuthHeaders();
      const url = tenantId 
        ? `${this.API_BASE_URL}/api/v1/admin/dashboard/activity?tenantId=${tenantId}&limit=${limit}`
        : `${this.API_BASE_URL}/api/v1/admin/dashboard/activity?limit=${limit}`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch recent activity: ${response.statusText}`);
      }

      const data = await response.json();
      const activity = data.data || data;

      if (redis) {
        await redis.setex(cacheKey, 60, JSON.stringify(activity)); // 1 minute cache for activity
      }

      return activity;

    } catch (error) {
      logger.error('Failed to fetch recent activity', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId
      });
      
      return [];
    }
  }

  async invalidateCache(tenantId?: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      if (redis) {
        const pattern = tenantId 
          ? `cache:${tenantId}:admin_dashboard:*`
          : 'cache:global:admin_dashboard:*';
        
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          logger.info('Dashboard cache invalidated', { tenantId, keysDeleted: keys.length });
        }
      }
    } catch (error) {
      logger.warn('Failed to invalidate dashboard cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId
      });
    }
  }

  async refreshDashboardData(tenantId?: string): Promise<DashboardData> {
    await this.invalidateCache(tenantId);
    return this.getDashboardData(tenantId);
  }
}

// Export singleton instance
export const adminDashboardService = new AdminDashboardService();