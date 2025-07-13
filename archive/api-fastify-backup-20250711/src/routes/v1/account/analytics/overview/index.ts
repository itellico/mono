import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * Account Analytics Overview Routes
 * Account-wide analytics and metrics
 */
export const accountOverviewRoutes: FastifyPluginAsync = async (fastify) => {
  // Get analytics overview
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.analytics.read')],
    schema: {
      tags: ['account.analytics'],
      summary: 'Get analytics overview',
      description: 'Get comprehensive analytics overview for the account',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        startDate: Type.Optional(Type.String()),
        endDate: Type.Optional(Type.String()),
        timeZone: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            overview: Type.Object({
              users: Type.Object({
                total: Type.Number(),
                active: Type.Number(),
                new: Type.Number(),
                growth: Type.Number(),
              }),
              content: Type.Object({
                total: Type.Number(),
                published: Type.Number(),
                draft: Type.Number(),
                views: Type.Number(),
              }),
              revenue: Type.Object({
                total: Type.Number(),
                recurring: Type.Number(),
                oneTime: Type.Number(),
                growth: Type.Number(),
                currency: Type.String(),
              }),
              engagement: Type.Object({
                sessions: Type.Number(),
                pageViews: Type.Number(),
                avgSessionDuration: Type.Number(),
                bounceRate: Type.Number(),
              }),
            }),
            trends: Type.Object({
              daily: Type.Array(Type.Object({
                date: Type.String(),
                users: Type.Number(),
                sessions: Type.Number(),
                pageViews: Type.Number(),
                revenue: Type.Number(),
              })),
            }),
            topContent: Type.Array(Type.Object({
              title: Type.String(),
              type: Type.String(),
              views: Type.Number(),
              engagement: Type.Number(),
            })),
            userActivity: Type.Object({
              mostActive: Type.Array(Type.Object({
                name: Type.String(),
                email: Type.String(),
                activityCount: Type.Number(),
                lastActive: Type.String(),
              })),
              recentSignups: Type.Array(Type.Object({
                name: Type.String(),
                email: Type.String(),
                signedUpAt: Type.String(),
              })),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { startDate, endDate, timeZone = 'UTC' } = request.query;

      try {
        const now = new Date();
        const start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : now;

        // Calculate comparison period for growth metrics
        const periodDuration = end.getTime() - start.getTime();
        const comparisonStart = new Date(start.getTime() - periodDuration);
        const comparisonEnd = start;

        // Get user metrics
        const [totalUsers, activeUsers, newUsers, previousNewUsers] = await Promise.all([
          fastify.prisma.user.count({
            where: { tenantId: request.user.tenantId, accountId: request.user!.accountId },
          }),
          fastify.prisma.user.count({
            where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
              lastLoginAt: { gte: start },
            },
          }),
          fastify.prisma.user.count({
            where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
              createdAt: { gte: start, lte: end },
            },
          }),
          fastify.prisma.user.count({
            where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
              createdAt: { gte: comparisonStart, lte: comparisonEnd },
            },
          }),
        ]);

        const userGrowth = previousNewUsers > 0 
          ? ((newUsers - previousNewUsers) / previousNewUsers) * 100 
          : 0;

        // Get content metrics
        const [totalContent, publishedContent, draftContent, contentViews] = await Promise.all([
          fastify.prisma.content.count({
            where: { tenantId: request.user.tenantId, accountId: request.user!.accountId },
          }),
          fastify.prisma.content.count({
            where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
              status: 'published', },
          }),
          fastify.prisma.content.count({
            where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
              status: 'draft', },
          }),
          fastify.prisma.contentView.count({
            where: { tenantId: request.user.tenantId, content: { accountId: request.user!.accountId },
              createdAt: { gte: start, lte: end },
            },
          }),
        ]);

        // Get revenue metrics (if billing is enabled)
        const [currentRevenue, previousRevenue] = await Promise.all([
          fastify.prisma.payment.aggregate({
            where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
              status: 'completed',
              createdAt: { gte: start, lte: end },
            },
            _sum: { amount: true },
          }),
          fastify.prisma.payment.aggregate({
            where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
              status: 'completed',
              createdAt: { gte: comparisonStart, lte: comparisonEnd },
            },
            _sum: { amount: true },
          }),
        ]);

        const totalRevenue = currentRevenue._sum.amount || 0;
        const previousTotal = previousRevenue._sum.amount || 0;
        const revenueGrowth = previousTotal > 0 
          ? ((totalRevenue - previousTotal) / previousTotal) * 100 
          : 0;

        // Get engagement metrics
        const [sessions, pageViews] = await Promise.all([
          fastify.prisma.userSession.count({
            where: { tenantId: request.user.tenantId, user: { accountId: request.user!.accountId },
              createdAt: { gte: start, lte: end },
            },
          }),
          fastify.prisma.pageView.count({
            where: { tenantId: request.user.tenantId, session: {
                user: { accountId: request.user!.accountId },
              },
              createdAt: { gte: start, lte: end },
            },
          }),
        ]);

        // Calculate average session duration (mock data for now)
        const avgSessionDuration = 285; // seconds
        const bounceRate = 35.2; // percentage

        // Get daily trends
        const dailyTrends = await fastify.prisma.$queryRaw`
          SELECT 
            DATE(created_at) as date,
            COUNT(DISTINCT CASE WHEN type = 'user' THEN entity_id END) as users,
            COUNT(DISTINCT CASE WHEN type = 'session' THEN entity_id END) as sessions,
            COUNT(CASE WHEN type = 'page_view' THEN 1 END) as page_views
          FROM analytics_events
          WHERE account_id = ${request.user!.accountId}
            AND created_at >= ${start}
            AND created_at <= ${end}
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `;

        // Get top content
        const topContent = await fastify.prisma.content.findMany({
          where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
            status: 'published', },
          include: {
            _count: {
              select: {
                views: {
                  where: { tenantId: request.user.tenantId, createdAt: { gte: start, lte: end },
                  },
                },
              },
            },
          },
          orderBy: {
            views: {
              _count: 'desc',
            },
          },
          take: 5,
        });

        // Get most active users
        const mostActiveUsers = await fastify.prisma.user.findMany({
          where: { tenantId: request.user.tenantId, accountId: request.user!.accountId, },
          include: {
            _count: {
              select: {
                sessions: {
                  where: { tenantId: request.user.tenantId, createdAt: { gte: start, lte: end },
                  },
                },
              },
            },
          },
          orderBy: {
            sessions: {
              _count: 'desc',
            },
          },
          take: 5,
        });

        // Get recent signups
        const recentSignups = await fastify.prisma.user.findMany({
          where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
            createdAt: { gte: start },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        });

        return {
          success: true,
          data: {
            overview: {
              users: {
                total: totalUsers,
                active: activeUsers,
                new: newUsers,
                growth: userGrowth,
              },
              content: {
                total: totalContent,
                published: publishedContent,
                draft: draftContent,
                views: contentViews,
              },
              revenue: {
                total: totalRevenue,
                recurring: totalRevenue * 0.8, // Mock split
                oneTime: totalRevenue * 0.2,
                growth: revenueGrowth,
                currency: 'USD',
              },
              engagement: {
                sessions,
                pageViews,
                avgSessionDuration,
                bounceRate,
              },
            },
            trends: {
              daily: (dailyTrends as any[]).map(day => ({
                date: day.date.toISOString().split('T')[0],
                users: Number(day.users),
                sessions: Number(day.sessions),
                pageViews: Number(day.page_views),
                revenue: Math.random() * 1000, // Mock revenue data
              })),
            },
            topContent: topContent.map(content => ({
              title: content.title,
              type: content.type,
              views: content._count.views,
              engagement: Math.random() * 100, // Mock engagement score
            })),
            userActivity: {
              mostActive: mostActiveUsers.map(user => ({
                name: user.name,
                email: user.email,
                activityCount: user._count.sessions,
                lastActive: user.lastLoginAt?.toISOString() || user.createdAt.toISOString(),
              })),
              recentSignups: recentSignups.map(user => ({
                name: user.name,
                email: user.email,
                signedUpAt: user.createdAt.toISOString(),
              })),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get analytics overview');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_ANALYTICS_OVERVIEW',
        });
      }
    },
  });

  // Export analytics data
  fastify.get('/export', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.analytics.export')],
    schema: {
      tags: ['account.analytics'],
      summary: 'Export analytics data',
      description: 'Export analytics data as CSV or JSON',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        format: Type.Union([Type.Literal('csv'), Type.Literal('json')]),
        type: Type.Union([
          Type.Literal('overview'),
          Type.Literal('users'),
          Type.Literal('content'),
          Type.Literal('revenue'),
        ]),
        startDate: Type.Optional(Type.String()),
        endDate: Type.Optional(Type.String()),
      }),
    },
    async handler(request, reply) {
      const { format, type, startDate, endDate } = request.query;

      try {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        let data: any;
        let filename: string;

        switch (type) {
          case 'users':
            data = await fastify.prisma.user.findMany({
              where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
                createdAt: { gte: start, lte: end },
              },
              select: {
                id: true,
                name: true,
                email: true,
                status: true,
                createdAt: true,
                lastLoginAt: true,
              },
            });
            filename = 'users-analytics';
            break;

          case 'content':
            data = await fastify.prisma.content.findMany({
              where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
                createdAt: { gte: start, lte: end },
              },
              include: {
                _count: {
                  select: {
                    views: true,
                    likes: true,
                    comments: true,
                  },
                },
              },
            });
            filename = 'content-analytics';
            break;

          case 'revenue':
            data = await fastify.prisma.payment.findMany({
              where: { tenantId: request.user.tenantId, accountId: request.user!.accountId,
                createdAt: { gte: start, lte: end },
              },
              include: {
                invoice: {
                  select: {
                    invoiceNumber: true,
                  },
                },
              },
            });
            filename = 'revenue-analytics';
            break;

          default:
            // Overview data
            data = {
              period: { start: start.toISOString(), end: end.toISOString() },
              metrics: await getOverviewMetrics(fastify, request.user!.accountId, start, end),
            };
            filename = 'analytics-overview';
        }

        if (format === 'json') {
          reply.header('Content-Type', 'application/json');
          reply.header('Content-Disposition', `attachment; filename="${filename}.json"`);
          return data;
        } else {
          // Convert to CSV
          const csv = convertToCSV(data, type);
          reply.header('Content-Type', 'text/csv');
          reply.header('Content-Disposition', `attachment; filename="${filename}.csv"`);
          return csv;
        }
      } catch (error) {
        request.log.error({ error }, 'Failed to export analytics data');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_EXPORT_ANALYTICS_DATA',
        });
      }
    },
  });
};

// Helper function to get overview metrics
async function getOverviewMetrics(fastify: any, accountId: number, start: Date, end: Date) {
  const [users, content, revenue] = await Promise.all([
    fastify.prisma.user.count({
      where: { tenantId: request.user.tenantId, accountId,
        createdAt: { gte: start, lte: end },
      },
    }),
    fastify.prisma.content.count({
      where: { tenantId: request.user.tenantId, accountId,
        createdAt: { gte: start, lte: end },
      },
    }),
    fastify.prisma.payment.aggregate({
      where: { tenantId: request.user.tenantId, accountId,
        status: 'completed',
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    newUsers: users,
    newContent: content,
    revenue: revenue._sum.amount || 0,
  };
}

// Helper function to convert data to CSV
function convertToCSV(data: any, type: string): string {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(item => {
    return headers.map(header => {
      const value = item[header];
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return value;
    });
  });

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
}