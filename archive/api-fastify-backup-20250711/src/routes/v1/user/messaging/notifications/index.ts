import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * User Notifications Routes
 * Manage in-app notifications
 */
export const userNotificationsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get notifications
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.messaging.notifications.read')
    ],
    schema: {
      tags: ['user.messaging.notifications'],
      summary: 'Get notifications',
      description: 'Get user notifications',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        filter: Type.Optional(Type.Union([
          Type.Literal('all'),
          Type.Literal('unread'),
          Type.Literal('read'),
        ])),
        type: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            notifications: Type.Array(Type.Object({
              uuid: uuidSchema,
              type: Type.String(),
              title: Type.String(),
              content: Type.String(),
              data: Type.Optional(Type.Object({}, { additionalProperties: true })),
              isRead: Type.Boolean(),
              readAt: Type.Optional(Type.String()),
              createdAt: Type.String(),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              totalPages: Type.Number(),
            }),
            unreadCount: Type.Number(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { page = 1, limit = 20, filter = 'all', type } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          userId: request.user!.id,
        };

        if (filter === 'unread') {
          where.isRead = false;
        } else if (filter === 'read') {
          where.isRead = true;
        }

        if (type) {
          where.type = type;
        }

        const [notifications, total, unreadCount] = await Promise.all([
          fastify.prisma.notification.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          fastify.prisma.notification.count({ where }),
          fastify.prisma.notification.count({
            where: { tenantId: request.user.tenantId, userId: request.user!.id,
              isRead: false, },
          }),
        ]);

        return {
          success: true,
          data: {
            notifications: notifications.map(notif => ({
              uuid: notif.uuid,
              type: notif.type,
              title: notif.title,
              content: notif.content,
              data: notif.data,
              isRead: notif.isRead,
              readAt: notif.readAt?.toISOString(),
              createdAt: notif.createdAt.toISOString(),
            })),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
            unreadCount,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get notifications');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_NOTIFICATIONS',
        });
      }
    },
  });

  // Mark notification as read
  fastify.put('/:uuid/read', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.messaging.notifications.read')
    ],
    schema: {
      tags: ['user.messaging.notifications'],
      summary: 'Mark notification as read',
      description: 'Mark a notification as read',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
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
      const { uuid } = request.params as { uuid: string };

      try {
        const notification = await fastify.prisma.notification.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            userId: request.user!.id, },
        });

        if (!notification) {
          return reply.status(404).send({
            success: false,
            error: 'NOTIFICATION_NOT_FOUND',
          });
        }

        if (!notification.isRead) {
          await fastify.prisma.notification.update({
            where: { tenantId: request.user.tenantId },
            data: {
              isRead: true,
              readAt: new Date(),
            },
          });
        }

        return {
          success: true,
          data: {
            message: 'Notification marked as read',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to mark notification as read');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_MARK_NOTIFICATION_AS_READ',
        });
      }
    },
  });

  // Mark all notifications as read
  fastify.put('/mark-all-read', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.messaging.notifications.read')
    ],
    schema: {
      tags: ['user.messaging.notifications'],
      summary: 'Mark all as read',
      description: 'Mark all notifications as read',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            updatedCount: Type.Number(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const result = await fastify.prisma.notification.updateMany({
          where: { tenantId: request.user.tenantId, userId: request.user!.id,
            isRead: false, },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'All notifications marked as read',
            updatedCount: result.count,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to mark all notifications as read');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_MARK_ALL_NOTIFICATIONS_AS_READ',
        });
      }
    },
  });

  // Delete notification
  fastify.delete('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.messaging.notifications.read')
    ],
    schema: {
      tags: ['user.messaging.notifications'],
      summary: 'Delete notification',
      description: 'Delete a notification',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
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
      const { uuid } = request.params as { uuid: string };

      try {
        const notification = await fastify.prisma.notification.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            userId: request.user!.id, },
        });

        if (!notification) {
          return reply.status(404).send({
            success: false,
            error: 'NOTIFICATION_NOT_FOUND',
          });
        }

        await fastify.prisma.notification.delete({
          where: { tenantId: request.user.tenantId },
        });

        return {
          success: true,
          data: {
            message: 'Notification deleted',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to delete notification');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_NOTIFICATION',
        });
      }
    },
  });

  // Delete all notifications
  fastify.delete('/clear', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.messaging.notifications.read')
    ],
    schema: {
      tags: ['user.messaging.notifications'],
      summary: 'Clear all notifications',
      description: 'Delete all notifications',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        onlyRead: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            deletedCount: Type.Number(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { onlyRead = false } = request.query;

      try {
        const where: any = {
          userId: request.user!.id,
        };

        if (onlyRead) {
          where.isRead = true;
        }

        const result = await fastify.prisma.notification.deleteMany({
          where,
        });

        return {
          success: true,
          data: {
            message: onlyRead ? 'Read notifications cleared' : 'All notifications cleared',
            deletedCount: result.count,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to clear notifications');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CLEAR_NOTIFICATIONS',
        });
      }
    },
  });
};