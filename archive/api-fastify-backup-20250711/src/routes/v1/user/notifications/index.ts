import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const notificationsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get user notifications
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.notifications.read')
    ],
    schema: {
      tags: ['user.notifications'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        isRead: Type.Optional(Type.Boolean()),
        type: Type.Optional(Type.String()),
        priority: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            notifications: Type.Array(Type.Object({}, { additionalProperties: true })),
            pagination: Type.Object({
              total: Type.Number(),
              page: Type.Number(),
              limit: Type.Number(),
              totalPages: Type.Number(),
            }),
            unreadCount: Type.Number(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { page = 1, limit = 20, isRead, type, priority } = request.query;
      const user = request.user;

      const skip = (page - 1) * limit;

      const where = {
        userId: user.uuid as UUID,
        ...(isRead !== undefined && { isRead }),
        ...(type && { type }),
        ...(priority && { priority }),
      };

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
          where: { tenantId: request.user.tenantId, userId: user.uuid as UUID,
            isRead: false, },
        }),
      ]);

      return reply.send({
        success: true,
        data: {
          notifications,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
          unreadCount,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_NOTIFICATIONS',
      });
    }
  });

  // Mark notification as read
  fastify.patch('/:id/read', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.notifications.read')
    ],
    schema: {
      tags: ['user.notifications'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            notification: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const user = request.user;

      const notification = await prisma.notification.findFirst({
        where: { tenantId: request.user.tenantId, id,
          userId: user.uuid as UUID, },
      });

      if (!notification) {
        return reply.status(404).send({
          success: false,
          error: 'NOTIFICATION_NOT_FOUND',
        });
      }

      const updatedNotification = await prisma.notification.update({
        where: { tenantId: request.user.tenantId, id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return reply.send({
        success: true,
        data: { notification: updatedNotification },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_MARK_NOTIFICATION_AS_READ',
      });
    }
  });

  // Mark all notifications as read
  fastify.patch('/read-all', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.notifications.read')
    ],
    schema: {
      tags: ['user.notifications'],
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            updated: Type.Number(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const user = request.user;

      const result = await prisma.notification.updateMany({
        where: { tenantId: request.user.tenantId, userId: user.uuid as UUID,
          isRead: false, },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return reply.send({
        success: true,
        data: { updated: result.count },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_MARK_ALL_NOTIFICATIONS_AS_READ',
      });
    }
  });

  // Delete notification
  fastify.delete('/:id', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.notifications.read')
    ],
    schema: {
      tags: ['user.notifications'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
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
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const user = request.user;

      const notification = await prisma.notification.findFirst({
        where: { tenantId: request.user.tenantId, id,
          userId: user.uuid as UUID, },
      });

      if (!notification) {
        return reply.status(404).send({
          success: false,
          error: 'NOTIFICATION_NOT_FOUND',
        });
      }

      await prisma.notification.delete({
        where: { tenantId: request.user.tenantId, id },
      });

      return reply.send({
        success: true,
        data: { message: 'Notification deleted successfully' },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_DELETE_NOTIFICATION',
      });
    }
  });

  // Get notification preferences
  fastify.get('/preferences', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.notifications.read')
    ],
    schema: {
      tags: ['user.notifications'],
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            preferences: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const user = request.user;

      let preferences = await prisma.notificationPreference.findFirst({
        where: { tenantId: request.user.tenantId, userId: user.uuid as UUID },
      });

      // Create default preferences if none exist
      if (!preferences) {
        preferences = await prisma.notificationPreference.create({
          data: {
            userId: user.uuid as UUID,
            emailEnabled: true,
            pushEnabled: true,
            smsEnabled: false,
            categories: {
              security: { email: true, push: true, sms: false },
              system: { email: true, push: true, sms: false },
              billing: { email: true, push: false, sms: false },
              marketing: { email: false, push: false, sms: false },
            },
          },
        });
      }

      return reply.send({
        success: true,
        data: { preferences },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_NOTIFICATION_PREFERENCES',
      });
    }
  });

  // Update notification preferences
  fastify.put('/preferences', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.notifications.read')
    ],
    schema: {
      tags: ['user.notifications'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        emailEnabled: Type.Optional(Type.Boolean()),
        pushEnabled: Type.Optional(Type.Boolean()),
        smsEnabled: Type.Optional(Type.Boolean()),
        categories: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            preferences: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const user = request.user;
      const updateData = request.body;

      const preferences = await prisma.notificationPreference.upsert({
        where: { tenantId: request.user.tenantId, userId: user.uuid as UUID },
        update: updateData,
        create: {
          userId: user.uuid as UUID,
          emailEnabled: updateData.emailEnabled ?? true,
          pushEnabled: updateData.pushEnabled ?? true,
          smsEnabled: updateData.smsEnabled ?? false,
          categories: updateData.categories ?? {
            security: { email: true, push: true, sms: false },
            system: { email: true, push: true, sms: false },
            billing: { email: true, push: false, sms: false },
            marketing: { email: false, push: false, sms: false },
          },
        },
      });

      return reply.send({
        success: true,
        data: { preferences },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_UPDATE_NOTIFICATION_PREFERENCES',
      });
    }
  });

  // Send notification (admin only)
  fastify.post('/send', {
    preHandler: [fastify.authenticate, fastify.requirePermission('notifications.send')],
    schema: {
      tags: ['user.notifications'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        userId: Type.Optional(Type.Number()),
        tenantId: Type.Optional(Type.Number()),
        type: Type.Union([
          Type.Literal('info'),
          Type.Literal('warning'),
          Type.Literal('error'),
          Type.Literal('success')
        ]),
        priority: Type.Optional(Type.Union([
          Type.Literal('low'),
          Type.Literal('medium'),
          Type.Literal('high'),
          Type.Literal('urgent')
        ], { default: 'medium' })),
        title: Type.String({ minLength: 1, maxLength: 255 }),
        message: Type.String({ minLength: 1 }),
        data: Type.Optional(Type.Object({}, { additionalProperties: true })),
        channels: Type.Optional(Type.Object({
          email: Type.Optional(Type.Boolean({ default: false })),
          push: Type.Optional(Type.Boolean({ default: true })),
          sms: Type.Optional(Type.Boolean({ default: false })),
        })),
        scheduledFor: Type.Optional(Type.String({ format: 'date-time' })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            notification: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const {
        userId,
        tenantId,
        type,
        priority = 'medium',
        title,
        message,
        data,
        channels = { email: false, push: true, sms: false },
        scheduledFor,
      } = request.body;
      const user = request.user;

      // Determine target users
      let targetUsers = [];
      if (userId) {
        const targetUser = await prisma.user.findUnique({
          where: { tenantId: request.user.tenantId, id: userId },
        });
        if (targetUser) {
          targetUsers = [targetUser];
        }
      } else if (tenantId) {
        targetUsers = await prisma.user.findMany({
          where: { tenantId },
        });
      } else {
        return reply.status(400).send({
          success: false,
          error: 'EITHER_USERID_OR_TENANTID_MUST_BE_SPECIFIED',
        });
      }

      if (targetUsers.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'NO_TARGET_USERS_FOUND',
        });
      }

      // Create notifications for all target users
      const notifications = await Promise.all(
        targetUsers.map(targetUser =>
          prisma.notification.create({
            data: {
              userId: targetUser.uuid as UUID,
              type,
              priority,
              title,
              message,
              data,
              channels,
              scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
              sentBy: user.uuid as UUID,
            },
          })
        )
      );

      // TODO: Queue actual delivery (email, push, SMS) based on channels and user preferences

      return reply.status(201).send({
        success: true,
        data: {
          notification: notifications.length === 1 ? notifications[0] : notifications,
          sent: notifications.length,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_SEND_NOTIFICATION',
      });
    }
  });

  // Get notification templates (admin only)
  fastify.get('/templates', {
    preHandler: [fastify.authenticate, fastify.requirePermission('notifications.manage')],
    schema: {
      tags: ['user.notifications'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        category: Type.Optional(Type.String()),
        type: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            templates: Type.Array(Type.Object({}, { additionalProperties: true })),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { category, type } = request.query;
      const user = request.user;

      const where = {
        tenantId: user.tenantId,
        ...(category && { category }),
        ...(type && { type }),
      };

      const templates = await prisma.notificationTemplate.findMany({
        where,
        orderBy: { name: 'asc' },
      });

      return reply.send({
        success: true,
        data: { templates },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_FETCH_NOTIFICATION_TEMPLATES',
      });
    }
  });

  // Create notification template (admin only)
  fastify.post('/templates', {
    preHandler: [fastify.authenticate, fastify.requirePermission('notifications.manage')],
    schema: {
      tags: ['user.notifications'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1, maxLength: 255 }),
        description: Type.Optional(Type.String()),
        category: Type.String(),
        type: Type.Union([
          Type.Literal('info'),
          Type.Literal('warning'),
          Type.Literal('error'),
          Type.Literal('success')
        ]),
        titleTemplate: Type.String(),
        messageTemplate: Type.String(),
        variables: Type.Optional(Type.Array(Type.String())),
        defaultChannels: Type.Optional(Type.Object({
          email: Type.Boolean(),
          push: Type.Boolean(),
          sms: Type.Boolean(),
        })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            template: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const {
        name,
        description,
        category,
        type,
        titleTemplate,
        messageTemplate,
        variables = [],
        defaultChannels = { email: false, push: true, sms: false },
      } = request.body;
      const user = request.user;

      const template = await prisma.notificationTemplate.create({
        data: {
          name,
          description,
          category,
          type,
          titleTemplate,
          messageTemplate,
          variables,
          defaultChannels,
          tenantId: user.tenantId,
          createdBy: user.uuid as UUID,
        },
      });

      return reply.status(201).send({
        success: true,
        data: { template },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_CREATE_NOTIFICATION_TEMPLATE',
      });
    }
  });
};