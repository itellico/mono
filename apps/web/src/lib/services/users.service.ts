// ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
// ❌ REMOVED: Direct database imports (architectural violation)
// import { db as prisma } from '@/lib/db';
// import { AuditService } from '@/lib/services/audit.service';
import { unstable_cache } from 'next/cache';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { UsersApiService } from '@/lib/api-clients/users.api';
// ❌ REMOVED: Direct Prisma types (use API types instead)
// import { type User, type Account } from '@prisma/client';

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  newUsersToday: number;
  modelsCount: number;
  clientsCount: number;
}

export interface UserFilters {
  userTypes: { value: string; label: string; count: number }[];
  statuses: { value: string; label: string; count: number }[];
  countries: { value: string; label: string; count: number }[];
}

export interface UserListItem {
  id: string;
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  status: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  profilesCount: number;
  applicationsCount: number;
  country: string | null;
  profilePicture: string | null;
}

export interface UsersPageData {
  stats: UserStats;
  users: UserListItem[];
  filters: UserFilters;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  tenantId?: string | null;
}

export class UsersService {
  private readonly CACHE_TTL = 5 * 60; // 5 minutes
  private readonly STATS_CACHE_TTL = 10 * 60; // 10 minutes

  private getCacheKey(key: string, tenantId?: string | null): string {
    if (!tenantId) {
      return `cache:global:users:${key}`;
    }
    return `cache:${tenantId}:users:${key}`;
  }

  async getUsersPageData(tenantId?: string | null): Promise<UsersPageData> {
    // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
    return UsersApiService.generateUsersPageData(tenantId);
  }

  // ❌ REMOVED: Direct database access method (architectural violation)
  // This method has been replaced with API calls in getUsersPageData()

  async getUsers(params: GetUsersParams): Promise<{ users: UserListItem[]; pagination: any }> {
    try {
      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      
      // Map status parameter to API format
      let active: boolean | undefined;
      if (params.status === 'active') {
        active = true;
      } else if (params.status === 'inactive') {
        active = false;
      }

      const apiParams = {
        page: params.page,
        limit: params.limit,
        search: params.search,
        active,
        userType: params.role && params.role !== 'all' ? params.role : undefined,
      };

      const result = await UsersApiService.getUsers(apiParams);
      
      logger.info('Users fetched via API', {
        params,
        resultCount: result.users.length
      });

      return result;
    } catch (error) {
      logger.error('Failed to fetch users via API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        params
      });
      throw error;
    }
  }

  async createUser(userData: any): Promise<UserListItem> {
    try {
      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      return await UsersApiService.createUser(userData);
    } catch (error) {
      logger.error('Failed to create user via API', { error, userData });
      throw error;
    }
  }

  async getUserById(userId: string, tenantId?: string | null): Promise<UserListItem | null> {
    try {
      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      // Note: userId is treated as UUID since that's what the API expects
      return await UsersApiService.getUserByUuid(userId);
    } catch (error) {
      logger.error('Failed to get user by ID via API', { error, userId, tenantId });
      return null;
    }
  }

  /**
   * Get user by UUID (for external-facing APIs)
   */
  async getUserByUuid(userUuid: string, tenantId?: string | null): Promise<UserListItem | null> {
    const cacheKey = this.getCacheKey(`user_uuid:${userUuid}`, tenantId);
    const tags = ['users', `user:${userUuid}`];

    const fetchUser = async () => {
      logger.info('Fetching user by UUID via API', { userUuid, tenantId });
      
      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      return await UsersApiService.getUserByUuid(userUuid);
    };

    try {
      return await unstable_cache(fetchUser, [cacheKey], {
        revalidate: this.CACHE_TTL,
        tags: tags,
      })();
    } catch (error) {
      logger.error('Failed to fetch user by UUID via API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userUuid,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Update user by UUID (for external-facing APIs)
   */
  public async updateUserByUuid(
    uuid: string, 
    data: any,
    tenantId?: string | null
  ): Promise<any | null> {
    
    try {
      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      const { adminRole, ...restData } = data;

      // Map the data to API format
      const updateData = {
        firstName: restData.firstName,
        lastName: restData.lastName,
        userType: restData.userType,
        isActive: restData.isActive,
        tenantId: restData.tenantId,
      };

      const updatedUser = await UsersApiService.updateUserByUuid(uuid, updateData);

      if (updatedUser) {
        await this.invalidateUsersCache(tenantId);
        logger.info('User updated via API', { userUuid: uuid });
      }

      return updatedUser;
    } catch (error) {
      logger.error('Failed to update user via API', { error, uuid, data });
      throw error;
    }
  }

  async deleteUserByUuid(userUuid: string, tenantId?: string | null): Promise<boolean> {
    try {
      // ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
      const success = await UsersApiService.deleteUserByUuid(userUuid);

      if (success) {
        await this.invalidateUsersCache(tenantId);
        logger.info('User deleted successfully via API', { userUuid });
      }

      return success;
    } catch (error) {
      logger.error('Failed to delete user via API', { userUuid, error });
      return false;
    }
  }

  public async invalidateUsersCache(tenantId?: string | null) {
    const cacheKey = this.getCacheKey('page_data', tenantId);
    try {
      const redis = getRedisClient();
      if (redis) {
        const result = await redis.del(cacheKey);
        logger.info(`Cache invalidated for key: ${cacheKey}`, { result });
      }
    } catch (error) {
      logger.error('Failed to invalidate users cache', { cacheKey, error });
    }
  }
}
