import { PrismaClient } from '@prisma/client';
import { CacheService } from './cache.service';

export interface CreateAuditLogParams {
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  userId?: number;
  tenantId: number;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateUserActivityParams {
  action: string;
  userId?: number;
  tenantId: number;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  params?: any;
  sessionId?: string;
}

export class AuditService {
  constructor(
    private prisma: PrismaClient,
    private cache: CacheService
  ) {}

  async createAuditLog(params: CreateAuditLogParams) {
    const {
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      userId,
      tenantId,
      metadata,
      ipAddress,
      userAgent,
    } = params;

    try {
      const auditLog = await this.prisma.audit_logs.create({
        data: {
          action,
          entityType,
          entityId,
          userId,
          tenantId,
          changes: oldValues || newValues ? {
            oldValues,
            newValues,
          } : null,
          context: {
            metadata,
            ipAddress,
            userAgent,
          },
        },
      });

      // Cache recent audit logs for quick access
      const cacheKey = `audit:${tenantId}:${entityType}:${entityId}`;
      const recentLogs = await this.cache.get<any[]>(cacheKey) || [];
      recentLogs.unshift({
        id: auditLog.id,
        action,
        userId,
        createdAt: auditLog.timestamp, // Map timestamp to createdAt for API consistency
      });
      
      // Keep only last 10 logs in cache
      if (recentLogs.length > 10) {
        recentLogs.pop();
      }
      
      await this.cache.set(cacheKey, recentLogs, 3600); // 1 hour TTL

      return {
        id: auditLog.id,
        action: auditLog.action,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        userId: auditLog.userId,
        tenantId: auditLog.tenantId,
        changes: auditLog.changes,
        context: auditLog.context,
        createdAt: auditLog.timestamp, // Map timestamp to createdAt for API consistency
      };
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not break the main flow
      return null;
    }
  }

  async createUserActivity(params: CreateUserActivityParams) {
    const {
      action,
      userId,
      tenantId,
      metadata,
      ipAddress,
      userAgent,
      method,
      path,
      params: requestParams,
      sessionId,
    } = params;

    try {
      const activity = await this.prisma.userActivityLog.create({
        data: {
          action,
          userId,
          tenantId,
          metadata,
          ipAddress,
          userAgent,
          method,
          path,
          params: requestParams,
          sessionId,
        },
      });

      // Track user activity stats in cache
      if (userId) {
        const statsKey = `user:activity:${userId}:${new Date().toISOString().split('T')[0]}`;
        await this.cache.incr(statsKey);
        await this.cache.expire(statsKey, 86400 * 7); // Keep for 7 days
      }

      return activity;
    } catch (error) {
      console.error('Failed to create user activity log:', error);
      // Don't throw - activity logging should not break the main flow
      return null;
    }
  }

  async getAuditLogs(params: {
    entityType?: string;
    entityId?: string;
    userId?: number;
    tenantId: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const {
      entityType,
      entityId,
      userId,
      tenantId,
      action,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = params;

    const where: any = { tenantId };

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (action) where.action = action;
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.audit_logs.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              uuid: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.audit_logs.count({ where }),
    ]);

    return {
      logs,
      total,
      limit,
      offset,
    };
  }

  async getUserActivity(params: {
    userId?: number;
    tenantId: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const {
      userId,
      tenantId,
      action,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = params;

    const where: any = { tenantId };

    if (userId) where.userId = userId;
    if (action) where.action = action;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [activities, total] = await Promise.all([
      this.prisma.userActivityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.userActivityLog.count({ where }),
    ]);

    return {
      activities,
      total,
      limit,
      offset,
    };
  }

  async getActivityStats(tenantId: number, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get activity counts by day
    const activityByDay = await this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM user_activity_logs
      WHERE tenant_id = ${tenantId}
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // Get top users by activity
    const topUsers = await this.prisma.$queryRaw`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.username,
        COUNT(ual.id) as activity_count
      FROM users u
      INNER JOIN user_activity_logs ual ON u.id = ual.user_id
      WHERE ual.tenant_id = ${tenantId}
        AND ual.created_at >= ${startDate}
      GROUP BY u.id, u.first_name, u.last_name, u.username
      ORDER BY activity_count DESC
      LIMIT 10
    `;

    // Get top actions
    const topActions = await this.prisma.$queryRaw`
      SELECT 
        action,
        COUNT(*) as count
      FROM user_activity_logs
      WHERE tenant_id = ${tenantId}
        AND created_at >= ${startDate}
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `;

    return {
      activityByDay,
      topUsers,
      topActions,
      period: {
        start: startDate,
        end: new Date(),
        days,
      },
    };
  }

  async cleanupOldLogs(retentionDays: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Delete old audit logs
    const deletedAuditLogs = await this.prisma.audit_logs.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    // Delete old activity logs
    const deletedActivityLogs = await this.prisma.userActivityLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return {
      deletedAuditLogs: deletedAuditLogs.count,
      deletedActivityLogs: deletedActivityLogs.count,
      cutoffDate,
    };
  }
}