import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * User Notification Settings Routes
 * Manage notification preferences and settings
 */
export const userNotificationSettingsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get notification settings
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.settings.notifications.read')
    ],
    schema: {
      tags: ['user.settings.notifications'],
      summary: 'Get notification settings',
      description: 'Get user notification preferences',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            email: Type.Object({
              enabled: Type.Boolean(),
              newMessages: Type.Boolean(),
              jobApplications: Type.Boolean(),
              gigBookings: Type.Boolean(),
              accountUpdates: Type.Boolean(),
              securityAlerts: Type.Boolean(),
              weeklyDigest: Type.Boolean(),
              promotions: Type.Boolean(),
            }),
            push: Type.Object({
              enabled: Type.Boolean(),
              newMessages: Type.Boolean(),
              jobApplications: Type.Boolean(),
              gigBookings: Type.Boolean(),
              mentions: Type.Boolean(),
              reminders: Type.Boolean(),
            }),
            inApp: Type.Object({
              enabled: Type.Boolean(),
              showBadges: Type.Boolean(),
              playSound: Type.Boolean(),
              desktop: Type.Boolean(),
            }),
            quietHours: Type.Object({
              enabled: Type.Boolean(),
              startTime: Type.String(),
              endTime: Type.String(),
              timezone: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const settings = await fastify.prisma.notificationSetting.findUnique({
          where: { tenantId: request.user.tenantId, userId: request.user!.id },
        });

        // Return with defaults if not found
        const defaultSettings = {
          email: {
            enabled: true,
            newMessages: true,
            jobApplications: true,
            gigBookings: true,
            accountUpdates: true,
            securityAlerts: true,
            weeklyDigest: false,
            promotions: false,
          },
          push: {
            enabled: false,
            newMessages: true,
            jobApplications: true,
            gigBookings: true,
            mentions: true,
            reminders: true,
          },
          inApp: {
            enabled: true,
            showBadges: true,
            playSound: false,
            desktop: false,
          },
          quietHours: {
            enabled: false,
            startTime: '22:00',
            endTime: '08:00',
            timezone: 'UTC',
          },
        };

        return {
          success: true,
          data: settings || defaultSettings,
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get notification settings');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_NOTIFICATION_SETTINGS',
        });
      }
    },
  });

  // Update notification settings
  fastify.put('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.settings.notifications.read')
    ],
    schema: {
      tags: ['user.settings.notifications'],
      summary: 'Update notification settings',
      description: 'Update user notification preferences',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        email: Type.Optional(Type.Object({
          enabled: Type.Optional(Type.Boolean()),
          newMessages: Type.Optional(Type.Boolean()),
          jobApplications: Type.Optional(Type.Boolean()),
          gigBookings: Type.Optional(Type.Boolean()),
          accountUpdates: Type.Optional(Type.Boolean()),
          securityAlerts: Type.Optional(Type.Boolean()),
          weeklyDigest: Type.Optional(Type.Boolean()),
          promotions: Type.Optional(Type.Boolean()),
        })),
        push: Type.Optional(Type.Object({
          enabled: Type.Optional(Type.Boolean()),
          newMessages: Type.Optional(Type.Boolean()),
          jobApplications: Type.Optional(Type.Boolean()),
          gigBookings: Type.Optional(Type.Boolean()),
          mentions: Type.Optional(Type.Boolean()),
          reminders: Type.Optional(Type.Boolean()),
        })),
        inApp: Type.Optional(Type.Object({
          enabled: Type.Optional(Type.Boolean()),
          showBadges: Type.Optional(Type.Boolean()),
          playSound: Type.Optional(Type.Boolean()),
          desktop: Type.Optional(Type.Boolean()),
        })),
        quietHours: Type.Optional(Type.Object({
          enabled: Type.Optional(Type.Boolean()),
          startTime: Type.Optional(Type.String()),
          endTime: Type.Optional(Type.String()),
          timezone: Type.Optional(Type.String()),
        })),
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
      const updates = request.body;

      try {
        await fastify.prisma.notificationSetting.upsert({
          where: { tenantId: request.user.tenantId, userId: request.user!.id },
          update: {
            ...updates,
            updatedAt: new Date(),
          },
          create: {
            userId: request.user!.id,
            ...updates,
          },
        });

        return {
          success: true,
          data: {
            message: 'Notification settings updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update notification settings');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_NOTIFICATION_SETTINGS',
        });
      }
    },
  });

  // Test notification
  fastify.post('/test', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.settings.notifications.read')
    ],
    schema: {
      tags: ['user.settings.notifications'],
      summary: 'Test notification',
      description: 'Send a test notification to verify settings',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        type: Type.Union([Type.Literal('email'), Type.Literal('push'), Type.Literal('inApp')]),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            sent: Type.Boolean(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { type } = request.body;

      try {
        // TODO: Implement actual notification sending
        request.log.info({ userId: request.user!.id, type }, 'Sending test notification');

        // Simulate notification sending
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
          success: true,
          data: {
            message: `Test ${type} notification sent successfully`,
            sent: true,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to send test notification');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_SEND_TEST_NOTIFICATION',
        });
      }
    },
  });

  // Get notification channels
  fastify.get('/channels', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.settings.notifications.read')
    ],
    schema: {
      tags: ['user.settings.notifications'],
      summary: 'Get notification channels',
      description: 'Get available notification channels and their status',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            email: Type.Object({
              verified: Type.Boolean(),
              address: Type.String(),
            }),
            push: Type.Object({
              enabled: Type.Boolean(),
              devices: Type.Array(Type.Object({
                id: Type.String(),
                name: Type.String(),
                type: Type.String(),
                lastSeen: Type.String(),
              })),
            }),
            sms: Type.Object({
              enabled: Type.Boolean(),
              verified: Type.Boolean(),
              number: Type.Optional(Type.String()),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const user = await fastify.prisma.user.findUnique({
          where: { tenantId: request.user.tenantId, id: request.user!.id },
          select: {
            email: true,
            emailVerified: true,
            phoneNumber: true,
            phoneVerified: true,
          },
        });

        // Get push notification devices
        const devices = await fastify.prisma.notificationDevice.findMany({
          where: { tenantId: request.user.tenantId, userId: request.user!.id,
            active: true, },
          select: {
            id: true,
            deviceName: true,
            deviceType: true,
            lastSeenAt: true,
          },
        });

        return {
          success: true,
          data: {
            email: {
              verified: user?.emailVerified || false,
              address: user?.email || '',
            },
            push: {
              enabled: devices.length > 0,
              devices: devices.map(d => ({
                id: d.uuid.toString(),
                name: d.deviceName,
                type: d.deviceType,
                lastSeen: d.lastSeenAt.toISOString(),
              })),
            },
            sms: {
              enabled: !!user?.phoneNumber,
              verified: user?.phoneVerified || false,
              number: user?.phoneNumber || undefined,
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get notification channels');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_NOTIFICATION_CHANNELS',
        });
      }
    },
  });

  // Register push device
  fastify.post('/devices', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.settings.notifications.read')
    ],
    schema: {
      tags: ['user.settings.notifications'],
      summary: 'Register push device',
      description: 'Register a device for push notifications',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        token: Type.String(),
        deviceName: Type.String(),
        deviceType: Type.Union([Type.Literal('ios'), Type.Literal('android'), Type.Literal('web')]),
        deviceId: Type.Optional(Type.String()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            deviceId: Type.Number(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { token, deviceName, deviceType, deviceId } = request.body;

      try {
        // Deactivate existing device with same token
        await fastify.prisma.notificationDevice.updateMany({
          where: { tenantId: request.user.tenantId, pushToken: token },
          data: { active: false },
        });

        // Create or update device
        const device = await fastify.prisma.notificationDevice.upsert({
          where: { tenantId: request.user.tenantId, userId_deviceId: {
              userId: request.user!.id,
              deviceId: deviceId || token, },
          },
          update: {
            pushToken: token,
            deviceName,
            deviceType,
            active: true,
            lastSeenAt: new Date(),
          },
          create: {
            userId: request.user!.id,
            deviceId: deviceId || token,
            pushToken: token,
            deviceName,
            deviceType,
            active: true,
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            message: 'Device registered successfully',
            deviceId: device.uuid as UUID,
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to register device');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_REGISTER_DEVICE',
        });
      }
    },
  });

  // Remove push device
  fastify.delete('/devices/:deviceId', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.settings.notifications.read')
    ],
    schema: {
      tags: ['user.settings.notifications'],
      summary: 'Remove push device',
      description: 'Remove a device from push notifications',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        deviceId: Type.String(),
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
      const { deviceId } = request.params as { deviceId: string };

      try {
        await fastify.prisma.notificationDevice.updateMany({
          where: { tenantId: request.user.tenantId, id: parseInt(deviceId),
            userId: request.user!.id, },
          data: { active: false },
        });

        return {
          success: true,
          data: {
            message: 'Device removed successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to remove device');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_REMOVE_DEVICE',
        });
      }
    },
  });
};