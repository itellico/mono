import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * User Activity Changes Routes
 * Track changes and modifications
 */
export const userChangesRoutes: FastifyPluginAsync = async (fastify) => {
  // Get user's changes
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.activity.changes.read')
    ],
    schema: {
      tags: ['user.activity'],
      summary: 'Get changes',
      description: 'Get user\'s tracked changes',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        entityType: Type.Optional(Type.String()),
        action: Type.Optional(Type.String()),
        startDate: Type.Optional(Type.String()),
        endDate: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            changes: Type.Array(Type.Object({
              uuid: uuidSchema,
              entityType: Type.String(),
              entityId: Type.String(),
              action: Type.String(),
              description: Type.String(),
              changes: Type.Optional(Type.Object({}, { additionalProperties: true })),
              metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
              ipAddress: Type.Optional(Type.String()),
              userAgent: Type.Optional(Type.String()),
              createdAt: Type.String(),
            })),
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
      const { page = 1, limit = 20, entityType, action, startDate, endDate } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          userId: request.user!.id,
        };

        if (entityType) {
          where.entityType = entityType;
        }

        if (action) {
          where.action = action;
        }

        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) {
            where.createdAt.gte = new Date(startDate);
          }
          if (endDate) {
            where.createdAt.lte = new Date(endDate);
          }
        }

        const [changes, total] = await Promise.all([
          fastify.prisma.changeLog.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          fastify.prisma.changeLog.count({ where }),
        ]);

        return {
          success: true,
          data: {
            changes: changes.map(change => ({
              uuid: change.uuid,
              entityType: change.entityType,
              entityId: change.entityId,
              action: change.action,
              description: change.description || `${change.action} ${change.entityType}`,
              changes: change.changes,
              metadata: change.metadata,
              ipAddress: change.ipAddress,
              userAgent: change.userAgent,
              createdAt: change.createdAt.toISOString(),
            })),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get changes');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_CHANGES',
        });
      }
    },
  });

  // Get change summary
  fastify.get('/summary', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.activity.changes.read')
    ],
    schema: {
      tags: ['user.activity'],
      summary: 'Get change summary',
      description: 'Get summary of user\'s changes',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        period: Type.Optional(Type.Union([
          Type.Literal('today'),
          Type.Literal('week'),
          Type.Literal('month'),
          Type.Literal('year'),
        ])),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            totalChanges: Type.Number(),
            byAction: Type.Array(Type.Object({
              action: Type.String(),
              count: Type.Number(),
            })),
            byEntity: Type.Array(Type.Object({
              entityType: Type.String(),
              count: Type.Number(),
            })),
            recentActivity: Type.Array(Type.Object({
              date: Type.String(),
              count: Type.Number(),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { period = 'month' } = request.query;

      try {
        // Calculate date range
        const now = new Date();
        let startDate = new Date();
        
        switch (period) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        const where = {
          userId: request.user!.id,
          createdAt: {
            gte: startDate,
          },
        };

        const [total, byAction, byEntity] = await Promise.all([
          fastify.prisma.changeLog.count({ where }),
          fastify.prisma.changeLog.groupBy({
            by: ['action'],
            where,
            _count: { action: true },
            orderBy: { _count: { action: 'desc' } },
          }),
          fastify.prisma.changeLog.groupBy({
            by: ['entityType'],
            where,
            _count: { entityType: true },
            orderBy: { _count: { entityType: 'desc' } },
          }),
        ]);

        // Get daily activity for the period
        const changes = await fastify.prisma.changeLog.findMany({
          where,
          select: {
            createdAt: true,
          },
        });

        // Group by date
        const activityByDate = changes.reduce((acc, change) => {
          const date = change.createdAt.toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const recentActivity = Object.entries(activityByDate)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 30);

        return {
          success: true,
          data: {
            totalChanges: total,
            byAction: byAction.map(item => ({
              action: item.action,
              count: item._count.action,
            })),
            byEntity: byEntity.map(item => ({
              entityType: item.entityType,
              count: item._count.entityType,
            })),
            recentActivity,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get change summary');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_CHANGE_SUMMARY',
        });
      }
    },
  });
};