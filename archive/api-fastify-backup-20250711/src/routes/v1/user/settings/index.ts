import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * User Settings Routes
 * Routes for users to manage their personal settings and preferences
 */
export const userSettingsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get user preferences
  fastify.get('/preferences', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.settings.read')
    ],
    schema: {
      tags: ['user.settings'],
      summary: 'Get user preferences',
      description: 'Get current user\'s preferences and settings',
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            theme: Type.String({ default: 'light' }),
            language: Type.String({ default: 'en' }),
            timezone: Type.String({ default: 'UTC' }),
            emailNotifications: Type.Boolean({ default: true }),
            pushNotifications: Type.Boolean({ default: false }),
            marketingEmails: Type.Boolean({ default: false }),
            twoFactorEnabled: Type.Boolean({ default: false }),
            displayName: Type.Optional(Type.String()),
            bio: Type.Optional(Type.String()),
            profileVisibility: Type.String({ default: 'public' }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const userId = request.user!.id;

      try {
        // Get user preferences from database
        const user = await fastify.prisma.user.findUnique({
          where: { tenantId: request.user.tenantId, id: userId },
          select: {
            preferences: true,
            twoFactorEnabled: true,
            name: true,
            bio: true,
          },
        });

        if (!user) {
          return reply.status(404).send({
            success: false,
            error: 'USER_NOT_FOUND',
            message: 'User not found',
          });
        }

        // Merge with defaults
        const preferences = {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          pushNotifications: false,
          marketingEmails: false,
          twoFactorEnabled: user.twoFactorEnabled || false,
          displayName: user.name,
          bio: user.bio,
          profileVisibility: 'public',
          ...(user.preferences as any || {}),
        };

        return {
          success: true,
          data: preferences,
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get user preferences');
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve preferences',
        });
      }
    },
  });

  // Update user preferences
  fastify.put('/preferences', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.settings.read')
    ],
    schema: {
      tags: ['user.settings'],
      summary: 'Update user preferences',
      description: 'Update current user\'s preferences and settings',
      body: Type.Object({
        theme: Type.Optional(Type.String({ enum: ['light', 'dark', 'auto'] })),
        language: Type.Optional(Type.String({ minLength: 2, maxLength: 5 })),
        timezone: Type.Optional(Type.String()),
        emailNotifications: Type.Optional(Type.Boolean()),
        pushNotifications: Type.Optional(Type.Boolean()),
        marketingEmails: Type.Optional(Type.Boolean()),
        displayName: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
        bio: Type.Optional(Type.String({ maxLength: 500 })),
        profileVisibility: Type.Optional(Type.String({ enum: ['public', 'private', 'friends'] })),
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
      const userId = request.user!.id;
      const updates = request.body;

      try {
        // Extract user-specific fields
        const { displayName, bio, ...preferences } = updates;

        // Update user record if name or bio changed
        if (displayName !== undefined || bio !== undefined) {
          await fastify.prisma.user.update({
            where: { tenantId: request.user.tenantId, id: userId },
            data: {
              ...(displayName !== undefined && { name: displayName }),
              ...(bio !== undefined && { bio }),
            },
          });
        }

        // Update preferences if any preference fields were provided
        if (Object.keys(preferences).length > 0) {
          // Get existing preferences
          const user = await fastify.prisma.user.findUnique({
            where: { tenantId: request.user.tenantId, id: userId },
            select: { preferences: true },
          });

          const currentPreferences = (user?.preferences as any) || {};
          const updatedPreferences = {
            ...currentPreferences,
            ...preferences,
          };

          await fastify.prisma.user.update({
            where: { tenantId: request.user.tenantId, id: userId },
            data: {
              preferences: updatedPreferences,
            },
          });
        }

        return {
          success: true,
          data: {
            message: 'Preferences updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update user preferences');
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update preferences',
        });
      }
    },
  });

  // Change password
  fastify.post('/change-password', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.settings.read')
    ],
    schema: {
      tags: ['user.settings'],
      summary: 'Change password',
      description: 'Change current user\'s password',
      body: Type.Object({
        currentPassword: Type.String({ minLength: 8 }),
        newPassword: Type.String({ minLength: 8 }),
        confirmPassword: Type.String({ minLength: 8 }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
        400: Type.Object({
          success: Type.Boolean(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
    async handler(request, reply) {
      const userId = request.user!.id;
      const { currentPassword, newPassword, confirmPassword } = request.body;

      if (newPassword !== confirmPassword) {
        return reply.status(400).send({
          success: false,
          error: 'PASSWORD_MISMATCH',
          message: 'New password and confirmation do not match',
        });
      }

      try {
        const bcrypt = await import('bcryptjs');
        
        // Get user with password
        const user = await fastify.prisma.user.findUnique({
          where: { tenantId: request.user.tenantId, id: userId },
          select: { password: true },
        });

        if (!user || !user.password) {
          return reply.status(400).send({
            success: false,
            error: 'INVALID_PASSWORD',
            message: 'Current password is incorrect',
          });
        }

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
          return reply.status(400).send({
            success: false,
            error: 'INVALID_PASSWORD',
            message: 'Current password is incorrect',
          });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await fastify.prisma.user.update({
          where: { tenantId: request.user.tenantId, id: userId },
          data: {
            password: hashedPassword,
            passwordChangedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'Password changed successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to change password');
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to change password',
        });
      }
    },
  });

  // Enable/disable two-factor authentication
  fastify.post('/2fa/:action', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.settings.read')
    ],
    schema: {
      tags: ['user.settings'],
      summary: 'Manage two-factor authentication',
      description: 'Enable or disable two-factor authentication',
      params: Type.Object({
        action: Type.String({ enum: ['enable', 'disable'] }),
      }),
      body: Type.Object({
        password: Type.String({ minLength: 8 }),
        token: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            qrCode: Type.Optional(Type.String()),
            secret: Type.Optional(Type.String()),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const userId = request.user!.id;
      const { action } = request.params;
      const { password, token } = request.body;

      try {
        const bcrypt = await import('bcryptjs');
        
        // Verify password
        const user = await fastify.prisma.user.findUnique({
          where: { tenantId: request.user.tenantId, id: userId },
          select: { password: true, twoFactorEnabled: true, twoFactorSecret: true },
        });

        if (!user || !user.password) {
          return reply.status(400).send({
            success: false,
            error: 'INVALID_PASSWORD',
            message: 'Password is incorrect',
          });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return reply.status(400).send({
            success: false,
            error: 'INVALID_PASSWORD',
            message: 'Password is incorrect',
          });
        }

        if (action === 'enable') {
          // TODO: Implement 2FA enable logic
          // Generate secret, create QR code, etc.
          
          return {
            success: true,
            data: {
              message: 'Two-factor authentication setup initiated',
              qrCode: 'data:image/png;base64,...', // Placeholder
              secret: 'XXXX-XXXX-XXXX-XXXX', // Placeholder
            },
          };
        } else {
          // TODO: Implement 2FA disable logic
          // Verify token if 2FA is currently enabled
          
          await fastify.prisma.user.update({
            where: { tenantId: request.user.tenantId, id: userId },
            data: {
              twoFactorEnabled: false,
              twoFactorSecret: null,
            },
          });

          return {
            success: true,
            data: {
              message: 'Two-factor authentication disabled',
            },
          };
        }
      } catch (error) {
        request.log.error({ error }, 'Failed to manage 2FA');
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to manage two-factor authentication',
        });
      }
    },
  });

  // Delete account
  fastify.delete('/account', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.settings.read')
    ],
    schema: {
      tags: ['user.settings'],
      summary: 'Delete user account',
      description: 'Permanently delete user account and all associated data',
      body: Type.Object({
        password: Type.String({ minLength: 8 }),
        confirmation: Type.String({ pattern: '^DELETE$' }),
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
      const userId = request.user!.id;
      const { password, confirmation } = request.body;

      if (confirmation !== 'DELETE') {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_CONFIRMATION',
          message: 'Please type DELETE to confirm account deletion',
        });
      }

      try {
        const bcrypt = await import('bcryptjs');
        
        // Verify password
        const user = await fastify.prisma.user.findUnique({
          where: { tenantId: request.user.tenantId, id: userId },
          select: { password: true },
        });

        if (!user || !user.password) {
          return reply.status(400).send({
            success: false,
            error: 'INVALID_PASSWORD',
            message: 'Password is incorrect',
          });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return reply.status(400).send({
            success: false,
            error: 'INVALID_PASSWORD',
            message: 'Password is incorrect',
          });
        }

        // Soft delete the user
        await fastify.prisma.user.update({
          where: { tenantId: request.user.tenantId, id: userId },
          data: {
            isActive: false,
            deletedAt: new Date(),
            email: `deleted_${userId}_${user.email}`, // Prevent email reuse
          },
        });

        // Clear auth cookies
        reply.clearCookie('accessToken');
        reply.clearCookie('refreshToken');

        return {
          success: true,
          data: {
            message: 'Account deleted successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to delete account');
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete account',
        });
      }
    },
  });
};