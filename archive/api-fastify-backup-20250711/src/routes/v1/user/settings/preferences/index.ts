import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * User Preferences Routes
 * Manage user preferences and settings
 */
export const userPreferencesRoutes: FastifyPluginAsync = async (fastify) => {
  // Get user preferences
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.settings.preferences.read')
    ],
    schema: {
      tags: ['user.settings.preferences'],
      summary: 'Get user preferences',
      description: 'Get all user preferences and settings',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            theme: Type.String({ default: 'light' }),
            language: Type.String({ default: 'en' }),
            timezone: Type.String({ default: 'UTC' }),
            dateFormat: Type.String({ default: 'MM/DD/YYYY' }),
            timeFormat: Type.String({ default: '12h' }),
            currency: Type.String({ default: 'USD' }),
            emailNotifications: Type.Boolean({ default: true }),
            pushNotifications: Type.Boolean({ default: false }),
            marketingEmails: Type.Boolean({ default: false }),
            twoFactorEnabled: Type.Boolean({ default: false }),
            profileVisibility: Type.String({ default: 'private' }),
            showOnlineStatus: Type.Boolean({ default: true }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        // Get user preferences from database
        const userPrefs = await fastify.prisma.userPreference.findUnique({
          where: { tenantId: request.user.tenantId, userId: request.user!.id },
        });

        // Return preferences with defaults if not found
        const preferences = userPrefs || {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          currency: 'USD',
          emailNotifications: true,
          pushNotifications: false,
          marketingEmails: false,
          twoFactorEnabled: false,
          profileVisibility: 'private',
          showOnlineStatus: true,
        };

        return {
          success: true,
          data: preferences,
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get user preferences');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_USER_PREFERENCES',
        });
      }
    },
  });

  // Update user preferences
  fastify.put('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.settings.preferences.read')
    ],
    schema: {
      tags: ['user.settings.preferences'],
      summary: 'Update user preferences',
      description: 'Update user preferences and settings',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        theme: Type.Optional(Type.Union([Type.Literal('light'), Type.Literal('dark'), Type.Literal('system')])),
        language: Type.Optional(Type.String({ maxLength: 10 })),
        timezone: Type.Optional(Type.String({ maxLength: 50 })),
        dateFormat: Type.Optional(Type.String({ maxLength: 20 })),
        timeFormat: Type.Optional(Type.Union([Type.Literal('12h'), Type.Literal('24h')])),
        currency: Type.Optional(Type.String({ length: 3 })),
        emailNotifications: Type.Optional(Type.Boolean()),
        pushNotifications: Type.Optional(Type.Boolean()),
        marketingEmails: Type.Optional(Type.Boolean()),
        profileVisibility: Type.Optional(Type.Union([
          Type.Literal('public'),
          Type.Literal('private'),
          Type.Literal('contacts'),
        ])),
        showOnlineStatus: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            preferences: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const updates = request.body;

      try {
        // Upsert user preferences
        const preferences = await fastify.prisma.userPreference.upsert({
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

        // Update user language if changed
        if (updates.language) {
          await fastify.prisma.user.update({
            where: { tenantId: request.user.tenantId, id: request.user!.id },
            data: { language: updates.language },
          });
        }

        // Update user timezone if changed
        if (updates.timezone) {
          await fastify.prisma.user.update({
            where: { tenantId: request.user.tenantId, id: request.user!.id },
            data: { timezone: updates.timezone },
          });
        }

        return {
          success: true,
          data: {
            message: 'Preferences updated successfully',
            preferences,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update user preferences');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_USER_PREFERENCES',
        });
      }
    },
  });

  // Reset preferences to defaults
  fastify.post('/reset', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.settings.preferences.read')
    ],
    schema: {
      tags: ['user.settings.preferences'],
      summary: 'Reset preferences to defaults',
      description: 'Reset all user preferences to default values',
      security: [{ bearerAuth: [] }],
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
      try {
        // Delete user preferences to reset to defaults
        await fastify.prisma.userPreference.deleteMany({
          where: { tenantId: request.user.tenantId, userId: request.user!.id },
        });

        return {
          success: true,
          data: {
            message: 'Preferences reset to defaults successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to reset user preferences');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_RESET_USER_PREFERENCES',
        });
      }
    },
  });

  // Get available options
  fastify.get('/options', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.settings.preferences.read')
    ],
    schema: {
      tags: ['user.settings.preferences'],
      summary: 'Get preference options',
      description: 'Get available options for preferences',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            themes: Type.Array(Type.Object({
              value: Type.String(),
              label: Type.String(),
            })),
            languages: Type.Array(Type.Object({
              value: Type.String(),
              label: Type.String(),
            })),
            timezones: Type.Array(Type.Object({
              value: Type.String(),
              label: Type.String(),
              offset: Type.String(),
            })),
            dateFormats: Type.Array(Type.Object({
              value: Type.String(),
              label: Type.String(),
              example: Type.String(),
            })),
            currencies: Type.Array(Type.Object({
              value: Type.String(),
              label: Type.String(),
              symbol: Type.String(),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        return {
          success: true,
          data: {
            themes: [
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ],
            languages: [
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' },
              { value: 'de', label: 'German' },
              { value: 'it', label: 'Italian' },
              { value: 'pt', label: 'Portuguese' },
              { value: 'zh', label: 'Chinese' },
              { value: 'ja', label: 'Japanese' },
            ],
            timezones: [
              { value: 'UTC', label: 'UTC', offset: '+00:00' },
              { value: 'America/New_York', label: 'Eastern Time', offset: '-05:00' },
              { value: 'America/Chicago', label: 'Central Time', offset: '-06:00' },
              { value: 'America/Denver', label: 'Mountain Time', offset: '-07:00' },
              { value: 'America/Los_Angeles', label: 'Pacific Time', offset: '-08:00' },
              { value: 'Europe/London', label: 'London', offset: '+00:00' },
              { value: 'Europe/Paris', label: 'Paris', offset: '+01:00' },
              { value: 'Asia/Tokyo', label: 'Tokyo', offset: '+09:00' },
              { value: 'Australia/Sydney', label: 'Sydney', offset: '+10:00' },
            ],
            dateFormats: [
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '12/31/2023' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '31/12/2023' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2023-12-31' },
              { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY', example: '31.12.2023' },
            ],
            currencies: [
              { value: 'USD', label: 'US Dollar', symbol: '$' },
              { value: 'EUR', label: 'Euro', symbol: '€' },
              { value: 'GBP', label: 'British Pound', symbol: '£' },
              { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
              { value: 'CNY', label: 'Chinese Yuan', symbol: '¥' },
              { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
              { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
              { value: 'CHF', label: 'Swiss Franc', symbol: 'Fr' },
            ],
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get preference options');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_PREFERENCE_OPTIONS',
        });
      }
    },
  });
};