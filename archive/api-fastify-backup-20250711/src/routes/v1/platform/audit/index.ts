import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

export const auditRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  // Get audit logs with advanced filtering
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.audit.read')],
    schema: {
      tags: ['platform.audit'],
      description: 'Get audit logs with advanced filtering',
      querystring: Type.Object({
        page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
        userId: Type.Optional(Type.Integer()),
        tenantId: Type.Optional(Type.Integer()),
        action: Type.Optional(Type.String()),
        entityType: Type.Optional(Type.String()),
        entityId: Type.Optional(Type.String()),
        dateFrom: Type.Optional(Type.String({ format: 'date-time' })),
        dateTo: Type.Optional(Type.String({ format: 'date-time' })),
        search: Type.Optional(Type.String()),
        includeMetadata: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            logs: Type.Array(Type.Object({
              id: Type.Integer(),
              userId: Type.Union([Type.String(), Type.Null()]),
              tenantId: Type.Union([Type.Integer(), Type.Null()]),
              action: Type.String(),
              entityType: Type.String(),
              entityId: Type.Union([Type.String(), Type.Null()]),
              changes: Type.Union([Type.Object({}, { additionalProperties: true }), Type.Null()]),
              context: Type.Union([Type.Object({}, { additionalProperties: true }), Type.Null()]),
              timestamp: Type.String(),
            })),
            pagination: Type.Object({
              page: Type.Integer(),
              limit: Type.Integer(),
              total: Type.Integer(),
              pages: Type.Integer(),
            }),
            summary: Type.Object({
              totalLogs: Type.Integer(),
              uniqueUsers: Type.Integer(),
              actionBreakdown: Type.Record(Type.String(), Type.Integer()),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const {
      page = 1,
      limit = 20,
      userId,
      tenantId,
      action,
      entityType,
      entityId,
      dateFrom,
      dateTo,
      search,
      includeMetadata = false,
    } = request.query;

    const offset = (page - 1) * limit;

    // Build filters
    const where: any = {};

    // Tenant isolation
    if (request.user.role !== 'super_admin') {
      where.tenantId = request.user.tenantId;
    } else if (tenantId) {
      where.tenantId = tenantId;
    }

    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (entityType) where.entityType = { contains: entityType, mode: 'insensitive' };
    if (entityId) where.entityId = entityId;

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom);
      if (dateTo) where.timestamp.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get logs with pagination
    const [logs, total] = await Promise.all([
      prisma.audit_logs.findMany({
        where,
        select: {
          id: true,
          userId: true,
          tenantId: true,
          action: true,
          entityType: true,
          entityId: true,
          changes: true,
          context: true,
          timestamp: true,
        },
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.audit_logs.count({ where }),
    ]);

    // Get summary statistics
    const [actionStats, uniqueUsers] = await Promise.all([
      prisma.audit_logs.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
      }),
      prisma.audit_logs.findMany({
        where,
        select: { userId: true },
        distinct: ['userId'],
      }),
    ]);

    const actionBreakdown = actionStats.reduce((acc, stat) => {
      acc[stat.action] = stat._count.action;
      return acc;
    }, {} as Record<string, number>);

    const formattedLogs = logs.map(log => ({
      id: log.id,
      userId: log.userId,
      tenantId: log.tenantId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      changes: includeMetadata ? log.changes : undefined,
      context: includeMetadata ? log.context : undefined,
      timestamp: log.timestamp.toISOString(),
    }));

    return reply.send({
      success: true,
      data: {
        logs: formattedLogs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        summary: {
          totalLogs: total,
          uniqueUsers: uniqueUsers.length,
          actionBreakdown,
        },
      },
    });
  });

  // Get single audit log entry
  fastify.get('/:id', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.audit.read')],
    schema: {
      tags: ['platform.audit'],
      description: 'Get single audit log entry with full details',
      params: Type.Object({
        id: Type.Integer(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            log: Type.Object({
              id: Type.Integer(),
              userId: Type.Union([Type.String(), Type.Null()]),
              tenantId: Type.Union([Type.Integer(), Type.Null()]),
              action: Type.String(),
              entityType: Type.String(),
              entityId: Type.Union([Type.String(), Type.Null()]),
              changes: Type.Union([Type.Object({}, { additionalProperties: true }), Type.Null()]),
              context: Type.Union([Type.Object({}, { additionalProperties: true }), Type.Null()]),
              timestamp: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    const log = await prisma.audit_logs.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        action: true,
        entityType: true,
        entityId: true,
        changes: true,
        context: true,
        timestamp: true,
      },
    });

    if (!log) {
      throw fastify.httpErrors.notFound('Audit log entry not found');
    }

    // Tenant isolation check
    if (request.user.role !== 'super_admin' && log.tenantId !== request.user.tenantId) {
      throw fastify.httpErrors.forbidden('Access denied to this audit log');
    }

    return reply.send({
      success: true,
      data: {
        log: {
          ...log,
          timestamp: log.timestamp.toISOString(),
        },
      },
    });
  });

  // Create audit log entry (for system/admin use)
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.audit.create')],
    schema: {
      tags: ['platform.audit'],
      description: 'Create audit log entry (admin/system use)',
      body: Type.Object({
        action: Type.String({ minLength: 1, maxLength: 100 }),
        entityType: Type.String({ minLength: 1, maxLength: 100 }),
        entityId: Type.Optional(Type.String({ maxLength: 100 })),
        changes: Type.Optional(Type.Object({}, { additionalProperties: true })),
        context: Type.Optional(Type.Object({}, { additionalProperties: true })),
        targetUserId: Type.Optional(Type.String()),
        targetTenantId: Type.Optional(Type.Integer()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            log: Type.Object({
              id: Type.Integer(),
              action: Type.String(),
              entityType: Type.String(),
              entityId: Type.Union([Type.String(), Type.Null()]),
              timestamp: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const {
      action,
      entityType,
      entityId,
      changes,
      context,
      targetUserId,
      targetTenantId,
    } = request.body;

    // Determine tenant for the log entry
    let logTenantId = request.user.tenantId;
    if (request.user.role === 'super_admin' && targetTenantId) {
      logTenantId = targetTenantId;
    }

    const log = await prisma.audit_logs.create({
      data: {
        userId: targetUserId || request.user.uuid as UUID,
        tenantId: logTenantId,
        action,
        entityType,
        entityId,
        changes,
        context: {
          ...context,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        },
      },
    });

    return reply.status(201).send({
      success: true,
      data: {
        log: {
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          timestamp: log.timestamp.toISOString(),
        },
      },
    });
  });

  // Get audit statistics for dashboard
  fastify.get('/stats/dashboard', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.audit.read')],
    schema: {
      tags: ['platform.audit'],
      description: 'Get audit statistics for dashboard',
      querystring: Type.Object({
        days: Type.Optional(Type.Integer({ minimum: 1, maximum: 365, default: 30 })),
        tenantId: Type.Optional(Type.Integer()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            stats: Type.Object({
              totalLogs: Type.Integer(),
              logsToday: Type.Integer(),
              logsThisWeek: Type.Integer(),
              criticalIssues: Type.Integer(),
              topActions: Type.Array(Type.Object({
                action: Type.String(),
                count: Type.Integer(),
              })),
              topUsers: Type.Array(Type.Object({
                userId: Type.Integer(),
                userEmail: Type.String(),
                count: Type.Integer(),
              })),
              activityTrend: Type.Array(Type.Object({
                date: Type.String(),
                count: Type.Integer(),
              })),
              levelDistribution: Type.Record(Type.String(), Type.Integer()),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { days = 30, tenantId } = request.query;

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    // Build base where clause with tenant isolation
    const baseWhere: any = {
      timestamp: { gte: dateFrom },
    };

    if (request.user.role !== 'super_admin') {
      baseWhere.tenantId = request.user.tenantId;
    } else if (tenantId) {
      baseWhere.tenantId = tenantId;
    }

    const [
      totalLogs,
      logsToday,
      logsThisWeek,
      criticalIssues,
      topActions,
      topUsers,
      activityTrend,
      levelDistribution,
    ] = await Promise.all([
      // Total logs in period
      prisma.audit_logs.count({ where: baseWhere }),

      // Logs today
      prisma.audit_logs.count({
        where: {
          ...baseWhere,
          timestamp: { gte: today },
        },
      }),

      // Logs this week
      prisma.audit_logs.count({
        where: {
          ...baseWhere,
          timestamp: { gte: thisWeekStart },
        },
      }),

      // Critical issues
      prisma.audit_logs.count({
        where: {
          ...baseWhere,
          level: 'critical',
        },
      }),

      // Top actions
      prisma.audit_logs.groupBy({
        by: ['action'],
        where: baseWhere,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),

      // Top users
      prisma.audit_logs.groupBy({
        by: ['userId'],
        where: {
          ...baseWhere,
          userId: { not: null },
        },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),

      // Activity trend (daily)
      prisma.$queryRaw`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as count
        FROM "AuditLog"
        WHERE timestamp >= ${dateFrom}
          ${request.user.role !== 'super_admin' ? 
            `AND "tenantId" = ${request.user.tenantId}` : 
            tenantId ? `AND "tenantId" = ${tenantId}` : ''
          }
        GROUP BY DATE(timestamp)
        ORDER BY date
      `,

      // Level distribution
      prisma.audit_logs.groupBy({
        by: ['level'],
        where: baseWhere,
        _count: { level: true },
      }),
    ]);

    // Get user details for top users
    const userIds = topUsers.map(u => u.userId).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });

    const userMap = users.reduce((acc, user) => {
      acc[user.uuid as UUID] = user.email;
      return acc;
    }, {} as Record<number, string>);

    return reply.send({
      success: true,
      data: {
        stats: {
          totalLogs,
          logsToday,
          logsThisWeek,
          criticalIssues,
          topActions: topActions.map(a => ({
            action: a.action,
            count: a._count.action,
          })),
          topUsers: topUsers.map(u => ({
            userId: u.userId,
            userEmail: userMap[u.userId] || 'Unknown',
            count: u._count.userId,
          })),
          activityTrend: (activityTrend as any[]).map(t => ({
            date: t.date,
            count: Number(t.count),
          })),
          levelDistribution: levelDistribution.reduce((acc, l) => {
            acc[l.level] = l._count.level;
            return acc;
          }, {} as Record<string, number>),
        },
      },
    });
  });

  // Export audit logs
  fastify.get('/export', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.audit.export')],
    schema: {
      tags: ['platform.audit'],
      description: 'Export audit logs to CSV/JSON',
      querystring: Type.Object({
        format: Type.Union([Type.Literal('csv'), Type.Literal('json')], { default: 'csv' }),
        dateFrom: Type.Optional(Type.String({ format: 'date-time' })),
        dateTo: Type.Optional(Type.String({ format: 'date-time' })),
        userId: Type.Optional(Type.Integer()),
        tenantId: Type.Optional(Type.Integer()),
        action: Type.Optional(Type.String()),
        level: Type.Optional(Type.String()),
        limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 10000, default: 1000 })),
      }),
    },
  }, async (request, reply) => {
    const {
      format = 'csv',
      dateFrom,
      dateTo,
      userId,
      tenantId,
      action,
      level,
      limit = 1000,
    } = request.query;

    // Build filters with tenant isolation
    const where: any = {};

    if (request.user.role !== 'super_admin') {
      where.tenantId = request.user.tenantId;
    } else if (tenantId) {
      where.tenantId = tenantId;
    }

    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (level) where.level = level;

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom);
      if (dateTo) where.timestamp.lte = new Date(dateTo);
    }

    const logs = await prisma.audit_logs.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        tenant: {
          select: {
            name: true,
            domain: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    if (format === 'json') {
      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`);
      return reply.send(logs);
    } else {
      // CSV format
      const csvHeader = 'ID,Timestamp,User Email,User Name,Tenant,Action,Resource,Resource ID,Level,Message,IP Address\n';
      const csvRows = logs.map(log => {
        const userEmail = log.user?.email || '';
        const userName = log.user ? `${log.user.firstName} ${log.user.lastName}`.trim() : '';
        const tenantName = log.tenant?.name || '';
        
        return [
          log.uuid as UUID,
          log.timestamp.toISOString(),
          `"${userEmail.replace(/"/g, '""')}"`,
          `"${userName.replace(/"/g, '""')}"`,
          `"${tenantName.replace(/"/g, '""')}"`,
          `"${log.action.replace(/"/g, '""')}"`,
          `"${log.resource.replace(/"/g, '""')}"`,
          `"${(log.resourceId || '').replace(/"/g, '""')}"`,
          log.level,
          `"${log.message.replace(/"/g, '""')}"`,
          `"${(log.ipAddress || '').replace(/"/g, '""')}"`,
        ].join(',');
      }).join('\n');

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      return reply.send(csvHeader + csvRows);
    }
  });

  // Bulk delete old audit logs (admin only)
  fastify.delete('/cleanup', {
    preHandler: [fastify.authenticate, fastify.requirePermission('platform.audit.delete')],
    schema: {
      tags: ['platform.audit'],
      description: 'Bulk delete old audit logs based on retention policy',
      body: Type.Object({
        retentionDays: Type.Integer({ minimum: 1, maximum: 3650 }),
        dryRun: Type.Optional(Type.Boolean({ default: false })),
        tenantId: Type.Optional(Type.Integer()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            deletedCount: Type.Integer(),
            oldestRemaining: Type.Union([Type.String(), Type.Null()]),
            dryRun: Type.Boolean(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { retentionDays, dryRun = false, tenantId } = request.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const where: any = {
      timestamp: { lt: cutoffDate },
    };

    // Tenant isolation
    if (request.user.role !== 'super_admin') {
      where.tenantId = request.user.tenantId;
    } else if (tenantId) {
      where.tenantId = tenantId;
    }

    if (dryRun) {
      const count = await prisma.audit_logs.count({ where });
      return reply.send({
        success: true,
        data: {
          deletedCount: count,
          oldestRemaining: null,
          dryRun: true,
        },
      });
    }

    const deletedLogs = await prisma.audit_logs.deleteMany({ where });

    // Get oldest remaining log
    const oldestRemaining = await prisma.audit_logs.findFirst({
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true },
    });

    // Log the cleanup action
    await prisma.audit_logs.create({
      data: {
        userId: request.user.uuid as UUID,
        tenantId: request.user.tenantId,
        action: 'audit_cleanup',
        resource: 'audit_log',
        level: 'info',
        message: `Deleted ${deletedLogs.count} audit logs older than ${retentionDays} days`,
        metadata: {
          deletedCount: deletedLogs.count,
          retentionDays,
          cutoffDate: cutoffDate.toISOString(),
        },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      },
    });

    return reply.send({
      success: true,
      data: {
        deletedCount: deletedLogs.count,
        oldestRemaining: oldestRemaining?.timestamp.toISOString() || null,
        dryRun: false,
      },
    });
  });
};