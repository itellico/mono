/**
 * Audit Service - API Client
 * 
 * ✅ ARCHITECTURE COMPLIANCE: Uses API calls instead of direct database access
 * All audit operations go through NestJS API with proper authentication
 */

import { ApiAuthService } from '@/lib/api-clients/api-auth.service';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';

export interface AuditLogEntry {
  tenantId: number;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'login_success' | 'login_fail' | 'logout' | 'email_sent' | 'export_data' | 'import_data';
  userId: number;
  changes?: Record<string, any>;
  context?: Record<string, any>;
}

export interface UserActivityEntry {
  tenantId: number;
  userId: number;
  action: 'click' | 'view' | 'search' | 'form_submission' | 'page_view' | 'filter' | 'sort';
  component?: string;
  metadata?: Record<string, any>;
}

export interface AuditFilters {
  tenantId: number;
  entityType?: string;
  entityId?: string;
  action?: string;
  changedBy?: number;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ActivityFilters {
  tenantId: number;
  userId?: number;
  action?: string;
  component?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface AuditResponse {
  logs: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export class AuditService {
  private readonly CACHE_TTL = 300; // 5 minutes for audit logs
  private readonly ACTIVITY_CACHE_TTL = 180; // 3 minutes for activity logs
  private readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  /**
   * Generate cache key for audit log queries
   */
  private generateAuditCacheKey(filters: AuditFilters): string {
    const filterString = JSON.stringify(filters);
    const hash = createHash('md5').update(filterString).digest('hex');
    return `cache:${filters.tenantId}:audit:list:${hash}`;
  }

  /**
   * Generate cache key for activity log queries
   */
  private generateActivityCacheKey(filters: ActivityFilters): string {
    const filterString = JSON.stringify(filters);
    const hash = createHash('md5').update(filterString).digest('hex');
    return `cache:${filters.tenantId}:activity:list:${hash}`;
  }

  /**
   * Generate cache key for entity audit trail
   */
  private generateEntityAuditCacheKey(tenantId: number, entityType: string, entityId: string): string {
    return `cache:${tenantId}:audit:entity:${entityType}:${entityId}`;
  }

  /**
   * Calculate JSON diff between old and new values
   */
  private calculateDiff(oldData: any, newData: any): Record<string, any> {
    const changes: Record<string, any> = {};

    // Handle null/undefined cases
    if (!oldData && !newData) return changes;
    if (!oldData) return { '*': { from: null, to: newData } };
    if (!newData) return { '*': { from: oldData, to: null } };

    // Compare properties
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const key of allKeys) {
      const oldValue = oldData[key];
      const newValue = newData[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = {
          from: oldValue,
          to: newValue
        };
      }
    }

    return changes;
  }

  /**
   * Log an audit entry
   */
  async logAction(entry: AuditLogEntry): Promise<void> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/audit`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error(`Failed to log audit entry: ${response.statusText}`);
      }

      logger.info('Audit log entry created', {
        tenantId: entry.tenantId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        userId: entry.userId
      });

      // Invalidate related cache
      await this.invalidateAuditCache(entry.tenantId, entry.entityType, entry.entityId);

    } catch (error) {
      logger.error('Failed to create audit log entry', {
        error: (error as Error).message,
        entry
      });
    }
  }

  /**
   * Log entity changes with automatic diff calculation
   */
  async logEntityChange(
    tenantId: number,
    entityType: string,
    entityId: string,
    action: 'create' | 'update' | 'delete',
    changedBy: number,
    oldData?: any,
    newData?: any,
    context?: Record<string, any>
  ): Promise<void> {
    const changes = action === 'create' 
      ? { '*': { from: null, to: newData } }
      : action === 'delete'
      ? { '*': { from: oldData, to: null } }
      : this.calculateDiff(oldData, newData);

    await this.logAction({
      tenantId,
      entityType,
      entityId,
      action,
      userId: changedBy,
      changes,
      context
    });
  }

  /**
   * Log user activity
   */
  async logUserActivity(entry: UserActivityEntry): Promise<void> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/audit/activity`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error(`Failed to log user activity: ${response.statusText}`);
      }

      logger.debug('User activity logged', {
        tenantId: entry.tenantId,
        userId: entry.userId,
        action: entry.action
      });

    } catch (error) {
      logger.error('Failed to log user activity', {
        error: (error as Error).message,
        entry
      });
    }
  }

  /**
   * Get audit logs with filtering and caching
   */
  async getAuditLogs(filters: AuditFilters): Promise<AuditResponse> {
    const cacheKey = this.generateAuditCacheKey(filters);

    try {
      const redis = await getRedisClient();
      const cachedResult = await redis.get(cacheKey);
      if (cachedResult) {
        logger.debug('Audit logs retrieved from cache', { cacheKey, filters });
        return JSON.parse(cachedResult);
      }
    } catch (error) {
      logger.warn('Redis cache read failed for audit logs', { 
        error: error.message, 
        cacheKey 
      });
    }

    const result = await this.queryAuditAPI(filters);

    try {
      const redis = await getRedisClient();
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      logger.debug('Audit logs cached successfully', { cacheKey, count: result.logs.length });
    } catch (error) {
      logger.warn('Redis cache write failed for audit logs', { error: error.message, cacheKey });
    }

    return result;
  }

  /**
   * Query API for audit logs with filters
   */
  private async queryAuditAPI(filters: AuditFilters): Promise<AuditResponse> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`${this.API_BASE_URL}/api/v2/audit?${queryParams}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info('Audit logs retrieved from API', {
        tenantId: filters.tenantId,
        count: data.logs?.length || 0,
        filters
      });

      return data;

    } catch (error) {
      logger.error('Failed to query audit logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters
      });
      throw error;
    }
  }

  /**
   * Get entity audit trail
   */
  async getEntityAuditTrail(tenantId: number, entityType: string, entityId: string): Promise<any[]> {
    const cacheKey = this.generateEntityAuditCacheKey(tenantId, entityType, entityId);

    try {
      const redis = await getRedisClient();
      const cachedTrail = await redis.get(cacheKey);
      if (cachedTrail) {
        logger.debug('Entity audit trail retrieved from cache', { cacheKey });
        return JSON.parse(cachedTrail);
      }
    } catch (error) {
      logger.warn('Redis cache read failed for entity audit trail', { 
        error: error.message, 
        cacheKey 
      });
    }

    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${this.API_BASE_URL}/api/v2/audit/entity/${entityType}/${entityId}?tenantId=${tenantId}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch entity audit trail: ${response.statusText}`);
      }

      const trail = await response.json();

      try {
        const redis = await getRedisClient();
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(trail));
        logger.debug('Entity audit trail cached successfully', { cacheKey, count: trail.length });
      } catch (error) {
        logger.warn('Redis cache write failed for entity audit trail', { error: error.message, cacheKey });
      }

      return trail;

    } catch (error) {
      logger.error('Failed to get entity audit trail', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId,
        entityType,
        entityId
      });
      return [];
    }
  }

  /**
   * Get user activity logs
   */
  async getUserActivity(filters: ActivityFilters): Promise<AuditResponse> {
    const cacheKey = this.generateActivityCacheKey(filters);

    try {
      const redis = await getRedisClient();
      const cachedResult = await redis.get(cacheKey);
      if (cachedResult) {
        logger.debug('User activity retrieved from cache', { cacheKey, filters });
        return JSON.parse(cachedResult);
      }
    } catch (error) {
      logger.warn('Redis cache read failed for user activity', { 
        error: error.message, 
        cacheKey 
      });
    }

    const result = await this.queryActivityAPI(filters);

    try {
      const redis = await getRedisClient();
      await redis.setex(cacheKey, this.ACTIVITY_CACHE_TTL, JSON.stringify(result));
      logger.debug('User activity cached successfully', { cacheKey, count: result.logs.length });
    } catch (error) {
      logger.warn('Redis cache write failed for user activity', { error: error.message, cacheKey });
    }

    return result;
  }

  /**
   * Query API for user activity logs
   */
  private async queryActivityAPI(filters: ActivityFilters): Promise<AuditResponse> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`${this.API_BASE_URL}/api/v2/audit/activity?${queryParams}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user activity: ${response.statusText}`);
      }

      const data = await response.json();

      logger.info('User activity retrieved from API', {
        tenantId: filters.tenantId,
        count: data.logs?.length || 0,
        filters
      });

      return data;

    } catch (error) {
      logger.error('Failed to query user activity', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters
      });
      throw error;
    }
  }

  /**
   * Invalidate audit cache for a specific entity
   */
  async invalidateAuditCache(tenantId: number, entityType?: string, entityId?: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      const patterns = [
        `cache:${tenantId}:audit:*`
      ];

      if (entityType && entityId) {
        patterns.push(`cache:${tenantId}:audit:entity:${entityType}:${entityId}`);
      }

      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          logger.debug('Audit cache invalidated', { pattern, keysDeleted: keys.length });
        }
      }

    } catch (error) {
      logger.warn('Failed to invalidate audit cache', { 
        error: error.message, 
        tenantId,
        entityType,
        entityId 
      });
    }
  }

  /**
   * Invalidate all audit and activity cache for a tenant
   */
  async invalidateAllCache(tenantId: number): Promise<void> {
    try {
      const redis = await getRedisClient();
      const patterns = [
        `cache:${tenantId}:audit:*`,
        `cache:${tenantId}:activity:*`
      ];

      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          logger.debug('All audit cache invalidated', { pattern, keysDeleted: keys.length });
        }
      }

    } catch (error) {
      logger.warn('Failed to invalidate all audit cache', { 
        error: error.message, 
        tenantId 
      });
    }
  }

  /**
   * Export audit logs to various formats
   */
  async exportAuditLogs(filters: AuditFilters, format: 'csv' | 'json' | 'pdf' = 'csv'): Promise<Blob> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      queryParams.append('format', format);

      const response = await fetch(`${this.API_BASE_URL}/api/v2/audit/export?${queryParams}`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to export audit logs: ${response.statusText}`);
      }

      const blob = await response.blob();

      logger.info('Audit logs exported', {
        tenantId: filters.tenantId,
        format,
        size: blob.size
      });

      return blob;

    } catch (error) {
      logger.error('Failed to export audit logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
        format
      });
      throw error;
    }
  }
}

// Export singleton instance
export const auditService = new AuditService();