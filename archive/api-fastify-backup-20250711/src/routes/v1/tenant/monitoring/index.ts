import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * Tenant Monitoring Routes
 * System monitoring and health checks for the tenant
 */
export const tenantMonitoringRoutes: FastifyPluginAsync = async (fastify) => {
  // Get tenant health overview
  fastify.get('/health', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.monitoring.read')],
    schema: {
      tags: ['tenant.monitoring'],
      summary: 'Get tenant health',
      description: 'Get overall health status of the tenant',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            health: Type.Object({
              status: Type.Union([
                Type.Literal('healthy'),
                Type.Literal('warning'),
                Type.Literal('critical'),
              ]),
              uptime: Type.Number(),
              accounts: Type.Object({
                total: Type.Number(),
                active: Type.Number(),
                issues: Type.Number(),
              }),
              users: Type.Object({
                total: Type.Number(),
                active: Type.Number(),
                issues: Type.Number(),
              }),
              storage: Type.Object({
                used: Type.Number(),
                quota: Type.Optional(Type.Number()),
                percentage: Type.Number(),
                status: Type.String(),
              }),
              performance: Type.Object({
                avgResponseTime: Type.Number(),
                errorRate: Type.Number(),
                throughput: Type.Number(),
                status: Type.String(),
              }),
              services: Type.Array(Type.Object({
                name: Type.String(),
                status: Type.String(),
                lastCheck: Type.String(),
                responseTime: Type.Optional(Type.Number()),
              })),
              alerts: Type.Array(Type.Object({
                level: Type.String(),
                message: Type.String(),
                component: Type.String(),
                timestamp: Type.String(),
              })),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const tenantId = request.user!.tenantId;
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // Get basic counts
        const [accountStats, userStats, storageStats] = await Promise.all([
          fastify.prisma.account.groupBy({
            by: ['isActive'],
            where: { tenantId },
            _count: { isActive: true },
          }),
          fastify.prisma.user.groupBy({
            by: ['isActive'],
            where: { Account: { tenantId } },
            _count: { isActive: true },
          }),
          // Mock storage stats for now since media model might not exist
          Promise.resolve({
            _sum: { size: 1024 * 1024 * 100 }, // 100MB mock data
            _count: { id: 50 },
          }),
        ]);

        // Calculate account health
        const totalAccounts = accountStats.reduce((sum, stat) => sum + stat._count.isActive, 0);
        const activeAccounts = accountStats.find(stat => stat.isActive === true)?._count.isActive || 0;
        const issueAccounts = accountStats.find(stat => stat.isActive === false)?._count.isActive || 0;

        // Calculate user health
        const totalUsers = userStats.reduce((sum, stat) => sum + stat._count.isActive, 0);
        const activeUsers = userStats.find(stat => stat.isActive === true)?._count.isActive || 0;
        const issueUsers = userStats.find(stat => stat.isActive === false)?._count.isActive || 0;

        // Calculate storage health
        const usedStorage = storageStats._sum.size || 0;
        const storageQuota = 10 * 1024 * 1024 * 1024; // 10GB default quota
        const storagePercentage = (usedStorage / storageQuota) * 100;
        const storageStatus = storagePercentage > 90 ? 'critical' 
          : storagePercentage > 75 ? 'warning' : 'healthy';

        // Mock performance metrics (in a real system, get from monitoring service)
        const performance = {
          avgResponseTime: 150 + Math.random() * 100, // 150-250ms
          errorRate: Math.random() * 2, // 0-2%
          throughput: 100 + Math.random() * 50, // 100-150 req/min
          status: 'healthy',
        };

        // Mock service health checks
        const services = [
          {
            name: 'Database',
            status: 'healthy',
            lastCheck: now.toISOString(),
            responseTime: 5 + Math.random() * 10,
          },
          {
            name: 'Redis Cache',
            status: 'healthy',
            lastCheck: now.toISOString(),
            responseTime: 1 + Math.random() * 3,
          },
          {
            name: 'File Storage',
            status: storageStatus === 'critical' ? 'warning' : 'healthy',
            lastCheck: now.toISOString(),
            responseTime: 10 + Math.random() * 20,
          },
          {
            name: 'API Gateway',
            status: performance.errorRate > 1 ? 'warning' : 'healthy',
            lastCheck: now.toISOString(),
            responseTime: performance.avgResponseTime,
          },
        ];

        // Generate alerts based on health status
        const alerts = [];
        
        if (storagePercentage > 90) {
          alerts.push({
            level: 'critical',
            message: `Storage usage is at ${storagePercentage.toFixed(1)}%`,
            component: 'Storage',
            timestamp: now.toISOString(),
          });
        } else if (storagePercentage > 75) {
          alerts.push({
            level: 'warning',
            message: `Storage usage is at ${storagePercentage.toFixed(1)}%`,
            component: 'Storage',
            timestamp: now.toISOString(),
          });
        }

        if (performance.errorRate > 1) {
          alerts.push({
            level: 'warning',
            message: `Error rate is ${performance.errorRate.toFixed(2)}%`,
            component: 'API',
            timestamp: now.toISOString(),
          });
        }

        if (issueAccounts > 0) {
          alerts.push({
            level: 'info',
            message: `${issueAccounts} account(s) require attention`,
            component: 'Accounts',
            timestamp: now.toISOString(),
          });
        }

        // Determine overall health status
        const criticalAlerts = alerts.filter(alert => alert.level === 'critical');
        const warningAlerts = alerts.filter(alert => alert.level === 'warning');
        
        const overallStatus = criticalAlerts.length > 0 ? 'critical'
          : warningAlerts.length > 0 ? 'warning' : 'healthy';

        return {
          success: true,
          data: {
            health: {
              status: overallStatus,
              uptime: Date.now() - (24 * 60 * 60 * 1000), // Mock 24h uptime
              accounts: {
                total: totalAccounts,
                active: activeAccounts,
                issues: issueAccounts,
              },
              users: {
                total: totalUsers,
                active: activeUsers,
                issues: issueUsers,
              },
              storage: {
                used: usedStorage,
                quota: storageQuota,
                percentage: storagePercentage,
                status: storageStatus,
              },
              performance,
              services,
              alerts,
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get tenant health');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_TENANT_HEALTH',
        });
      }
    },
  });

  // Get tenant metrics
  fastify.get('/metrics', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.monitoring.read')],
    schema: {
      tags: ['tenant.monitoring'],
      summary: 'Get tenant metrics',
      description: 'Get detailed metrics for the tenant',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        period: Type.Optional(Type.Union([
          Type.Literal('1h'),
          Type.Literal('24h'),
          Type.Literal('7d'),
          Type.Literal('30d'),
        ], { default: '24h' })),
        metric: Type.Optional(Type.Union([
          Type.Literal('users'),
          Type.Literal('accounts'),
          Type.Literal('storage'),
          Type.Literal('api_calls'),
          Type.Literal('errors'),
        ])),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            metrics: Type.Object({
              period: Type.String(),
              timestamp: Type.String(),
              usage: Type.Object({
                activeUsers: Type.Array(Type.Object({
                  timestamp: Type.String(),
                  value: Type.Number(),
                })),
                apiCalls: Type.Array(Type.Object({
                  timestamp: Type.String(),
                  value: Type.Number(),
                })),
                storageUsage: Type.Array(Type.Object({
                  timestamp: Type.String(),
                  value: Type.Number(),
                })),
                errorRate: Type.Array(Type.Object({
                  timestamp: Type.String(),
                  value: Type.Number(),
                })),
              }),
              performance: Type.Object({
                avgResponseTime: Type.Array(Type.Object({
                  timestamp: Type.String(),
                  value: Type.Number(),
                })),
                throughput: Type.Array(Type.Object({
                  timestamp: Type.String(),
                  value: Type.Number(),
                })),
                uptime: Type.Number(),
              }),
              resources: Type.Object({
                accounts: Type.Object({
                  total: Type.Number(),
                  active: Type.Number(),
                  growth: Type.Number(),
                }),
                users: Type.Object({
                  total: Type.Number(),
                  active: Type.Number(),
                  growth: Type.Number(),
                }),
                storage: Type.Object({
                  used: Type.Number(),
                  available: Type.Number(),
                  growth: Type.Number(),
                }),
              }),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { period = '24h', metric } = request.query;

      try {
        const tenantId = request.user!.tenantId;
        const now = new Date();
        
        // Calculate time range based on period
        let startTime: Date;
        let interval: number;
        
        switch (period) {
          case '1h':
            startTime = new Date(now.getTime() - 60 * 60 * 1000);
            interval = 5 * 60 * 1000; // 5-minute intervals
            break;
          case '24h':
            startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            interval = 60 * 60 * 1000; // 1-hour intervals
            break;
          case '7d':
            startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            interval = 6 * 60 * 60 * 1000; // 6-hour intervals
            break;
          case '30d':
            startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            interval = 24 * 60 * 60 * 1000; // 1-day intervals
            break;
          default:
            startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            interval = 60 * 60 * 1000;
        }

        // Generate time series data points
        const timePoints = [];
        for (let time = startTime.getTime(); time <= now.getTime(); time += interval) {
          timePoints.push(new Date(time));
        }

        // Get current statistics for growth calculation
        const [currentAccounts, currentUsers, currentStorage] = await Promise.all([
          fastify.prisma.account.count({ where: { tenantId } }),
          fastify.prisma.user.count({ where: { Account: { tenantId } } }),
          // Mock storage stats for now since media model might not exist
          Promise.resolve({
            _sum: { size: 1024 * 1024 * 100 }, // 100MB mock data
          }),
        ]);

        // Mock historical data generation (in a real system, get from time-series DB)
        const generateTimeSeries = (baseValue: number, variance: number = 0.1) => {
          return timePoints.map(timestamp => ({
            timestamp: timestamp.toISOString(),
            value: Math.max(0, baseValue * (1 + (Math.random() - 0.5) * variance)),
          }));
        };

        const metrics = {
          period,
          timestamp: now.toISOString(),
          usage: {
            activeUsers: generateTimeSeries(currentUsers * 0.7, 0.2),
            apiCalls: generateTimeSeries(1000, 0.3),
            storageUsage: generateTimeSeries(currentStorage._sum.size || 1000000, 0.05),
            errorRate: generateTimeSeries(0.5, 0.5),
          },
          performance: {
            avgResponseTime: generateTimeSeries(200, 0.3),
            throughput: generateTimeSeries(120, 0.2),
            uptime: 99.9,
          },
          resources: {
            accounts: {
              total: currentAccounts,
              active: Math.floor(currentAccounts * 0.9),
              growth: 5.2, // Mock growth percentage
            },
            users: {
              total: currentUsers,
              active: Math.floor(currentUsers * 0.7),
              growth: 12.5,
            },
            storage: {
              used: currentStorage._sum.size || 0,
              available: 10 * 1024 * 1024 * 1024, // 10GB
              growth: 8.3,
            },
          },
        };

        return {
          success: true,
          data: { metrics },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get tenant metrics');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_TENANT_METRICS',
        });
      }
    },
  });

  // Get audit logs
  fastify.get('/audit', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.audit.read')],
    schema: {
      tags: ['tenant.monitoring'],
      summary: 'Get tenant audit logs',
      description: 'Get audit logs for the entire tenant',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 50 })),
        action: Type.Optional(Type.String()),
        resource: Type.Optional(Type.String()),
        userId: Type.Optional(Type.Number()),
        accountId: Type.Optional(Type.Number()),
        startDate: Type.Optional(Type.String({ format: 'date-time' })),
        endDate: Type.Optional(Type.String({ format: 'date-time' })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            logs: Type.Array(Type.Object({
              action: Type.String(),
              resource: Type.String(),
              resourceId: Type.Optional(Type.String()),
              oldValues: Type.Optional(Type.Object({}, { additionalProperties: true })),
              newValues: Type.Optional(Type.Object({}, { additionalProperties: true })),
              metadata: Type.Object({}, { additionalProperties: true }),
              ipAddress: Type.Optional(Type.String()),
              userAgent: Type.Optional(Type.String()),
              user: Type.Object({
                name: Type.String(),
                email: Type.String(),
              }),
              account: Type.Object({
                name: Type.String(),
              }),
              createdAt: Type.String(),
            })),
            summary: Type.Object({
              totalActions: Type.Number(),
              uniqueUsers: Type.Number(),
              topActions: Type.Array(Type.Object({
                action: Type.String(),
                count: Type.Number(),
              })),
              activityByHour: Type.Array(Type.Object({
                hour: Type.Number(),
                count: Type.Number(),
              })),
            }),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              totalPages: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { 
        page = 1, 
        limit = 50, 
        action, 
        resource, 
        userId, 
        accountId, 
        startDate, 
        endDate 
      } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          tenantId: request.user!.tenantId,
        };

        if (action) {
          where.action = action;
        }

        if (resource) {
          where.resource = resource;
        }

        if (userId) {
          where.userId = userId;
        }

        if (accountId) {
          where.accountId = accountId;
        }

        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) where.createdAt.gte = new Date(startDate);
          if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [logs, total, actionStats, userStats] = await Promise.all([
          fastify.prisma.audit_logs.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  Account: {
                    select: {
                      email: true,
                    },
                  },
                },
              },
            },
          }),
          fastify.prisma.audit_logs.count({ where }),
          fastify.prisma.audit_logs.groupBy({
            by: ['action'],
            where: {
              tenantId: request.user!.tenantId,
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
              },
            },
            _count: { action: true },
            orderBy: { _count: { action: 'desc' } },
            take: 10,
          }),
          fastify.prisma.audit_logs.findMany({
            where: {
              tenantId: request.user!.tenantId,
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            },
            distinct: ['userId'],
            select: { userId: true },
          }),
        ]);

        // Calculate activity by hour
        const activityByHour = Array.from({ length: 24 }, (_, hour) => ({
          hour,
          count: logs.filter(log => new Date(log.createdAt).getHours() === hour).length,
        }));

        return {
          success: true,
          data: {
            logs: logs.map(log => ({
              action: log.action,
              resource: log.resource,
              resourceId: log.resourceId,
              oldValues: log.oldValues as any,
              newValues: log.newValues as any,
              metadata: log.metadata as any,
              ipAddress: log.ipAddress,
              userAgent: log.userAgent,
              user: log.user ? {
                name: `${log.user.firstName} ${log.user.lastName}`,
                email: log.user.Account?.email || '',
              } : null,
              account: {
                name: request.user!.tenantId.toString(), // Use tenant ID as placeholder since audit logs don't have account relation
              },
              createdAt: log.createdAt.toISOString(),
            })),
            summary: {
              totalActions: total,
              uniqueUsers: userStats.length,
              topActions: actionStats.map(stat => ({
                action: stat.action,
                count: stat._count.action,
              })),
              activityByHour,
            },
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get tenant audit logs');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_TENANT_AUDIT_LOGS',
        });
      }
    },
  });

  // Get system alerts - COMMENTED OUT: systemAlert model doesn't exist
  /*
  fastify.get('/alerts', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.monitoring.read')],
    schema: {
      tags: ['tenant.monitoring'],
      summary: 'Get system alerts',
      description: 'Get system alerts and notifications for the tenant',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        level: Type.Optional(Type.Union([
          Type.Literal('info'),
          Type.Literal('warning'),
          Type.Literal('error'),
          Type.Literal('critical'),
        ])),
        status: Type.Optional(Type.Union([
          Type.Literal('active'),
          Type.Literal('acknowledged'),
          Type.Literal('resolved'),
        ])),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            alerts: Type.Array(Type.Object({
              level: Type.String(),
              title: Type.String(),
              message: Type.String(),
              component: Type.String(),
              status: Type.String(),
              metadata: Type.Object({}, { additionalProperties: true }),
              acknowledgedBy: Type.Optional(Type.Object({
                name: Type.String(),
              })),
              acknowledgedAt: Type.Optional(Type.String()),
              resolvedAt: Type.Optional(Type.String()),
              createdAt: Type.String(),
              updatedAt: Type.String(),
            })),
            summary: Type.Object({
              total: Type.Number(),
              active: Type.Number(),
              acknowledged: Type.Number(),
              resolved: Type.Number(),
              byLevel: Type.Object({
                critical: Type.Number(),
                error: Type.Number(),
                warning: Type.Number(),
                info: Type.Number(),
              }),
            }),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              totalPages: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { page = 1, limit = 20, level, status } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          tenantId: request.user!.tenantId,
        };

        if (level) {
          where.level = level;
        }

        if (status) {
          where.status = status;
        }

        const [alerts, total, levelStats, statusStats] = await Promise.all([
          fastify.prisma.systemAlert.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              acknowledgedBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          }),
          fastify.prisma.systemAlert.count({ where }),
          fastify.prisma.systemAlert.groupBy({
            by: ['level'],
            where: { tenantId: request.user!.tenantId },
            _count: { level: true },
          }),
          fastify.prisma.systemAlert.groupBy({
            by: ['status'],
            where: { tenantId: request.user!.tenantId },
            _count: { status: true },
          }),
        ]);

        const byLevel = {
          critical: levelStats.find(s => s.level === 'critical')?._count.level || 0,
          error: levelStats.find(s => s.level === 'error')?._count.level || 0,
          warning: levelStats.find(s => s.level === 'warning')?._count.level || 0,
          info: levelStats.find(s => s.level === 'info')?._count.level || 0,
        };

        const summary = {
          total,
          active: statusStats.find(s => s.status === 'active')?._count.status || 0,
          acknowledged: statusStats.find(s => s.status === 'acknowledged')?._count.status || 0,
          resolved: statusStats.find(s => s.status === 'resolved')?._count.status || 0,
          byLevel,
        };

        return {
          success: true,
          data: {
            alerts: alerts.map(alert => ({
              level: alert.level,
              title: alert.title,
              message: alert.message,
              component: alert.component,
              status: alert.status,
              metadata: alert.metadata as any,
              acknowledgedBy: alert.acknowledgedBy,
              acknowledgedAt: alert.acknowledgedAt?.toISOString(),
              resolvedAt: alert.resolvedAt?.toISOString(),
              createdAt: alert.createdAt.toISOString(),
              updatedAt: alert.updatedAt.toISOString(),
            })),
            summary,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get system alerts');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_SYSTEM_ALERTS',
        });
      }
    },
  });

  // Acknowledge alert
  fastify.post('/alerts/:id/acknowledge', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.monitoring.update')],
    schema: {
      tags: ['tenant.monitoring'],
      summary: 'Acknowledge alert',
      description: 'Acknowledge a system alert',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      body: Type.Object({
        note: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { id } = request.params as { id: number };
      const { note } = request.body;

      try {
        const alert = await fastify.prisma.systemAlert.findFirst({
          where: {
            id,
            tenantId: request.user!.tenantId,
            status: 'active',
          },
        });

        if (!alert) {
          return reply.status(404).send({
            success: false,
            error: 'ACTIVE_ALERT_NOT_FOUND',
          });
        }

        await fastify.prisma.systemAlert.update({
          where: { tenantId: request.user.tenantId, id },
          data: {
            status: 'acknowledged',
            acknowledgedById: request.user!.id,
            acknowledgedAt: new Date(),
            metadata: {
              ...alert.metadata,
              acknowledgment: {
                note: note || '',
                timestamp: new Date().toISOString(),
              },
            },
          },
        });

        return {
          success: true,
          data: {
            message: 'Alert acknowledged successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to acknowledge alert');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_ACKNOWLEDGE_ALERT',
        });
      }
    },
  });

  // Resolve alert
  fastify.post('/alerts/:id/resolve', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.monitoring.update')],
    schema: {
      tags: ['tenant.monitoring'],
      summary: 'Resolve alert',
      description: 'Mark a system alert as resolved',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      body: Type.Object({
        resolution: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { id } = request.params as { id: number };
      const { resolution } = request.body;

      try {
        const alert = await fastify.prisma.systemAlert.findFirst({
          where: {
            id,
            tenantId: request.user!.tenantId,
            status: { in: ['active', 'acknowledged'] },
          },
        });

        if (!alert) {
          return reply.status(404).send({
            success: false,
            error: 'ALERT_NOT_FOUND_OR_ALREADY_RESOLVED',
          });
        }

        await fastify.prisma.systemAlert.update({
          where: { tenantId: request.user.tenantId, id },
          data: {
            status: 'resolved',
            resolvedAt: new Date(),
            metadata: {
              ...alert.metadata,
              resolution: {
                description: resolution,
                resolvedBy: request.user!.id,
                timestamp: new Date().toISOString(),
              },
            },
          },
        });

        return {
          success: true,
          data: {
            message: 'Alert resolved successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to resolve alert');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_RESOLVE_ALERT',
        });
      }
    },
  });
  */
};