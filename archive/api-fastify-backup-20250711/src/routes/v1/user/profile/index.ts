import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import bcrypt from 'bcryptjs';

export const usersRoutes: FastifyPluginAsync = async (fastify) => {
  // Get current user profile
  fastify.get('/me', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.profile.read')
    ],
    schema: {
      tags: ['user.profile'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            user: Type.Object({
              uuid: uuidSchema,
              email: Type.String(),
              firstName: Type.String(),
              lastName: Type.String(),
              username: Type.String(),
              bio: Type.Optional(Type.String()),
              website: Type.Optional(Type.String()),
              profilePhotoUrl: Type.Optional(Type.String()),
              dateOfBirth: Type.Optional(Type.String()),
              gender: Type.Optional(Type.String()),
              userType: Type.String(),
              accountRole: Type.String(),
              createdAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const user = await fastify.prisma.user.findUnique({
        where: { 
          id: request.user!.id,
          tenantId: request.user!.tenantId // CRITICAL: Tenant isolation
        },
        include: {
          account: true,
        },
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      }

      return {
        success: true,
        data: {
          user: {
            // ONLY expose UUID, NEVER internal ID
            uuid: user.uuid as UUID,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            bio: user.bio,
            website: user.website,
            profilePhotoUrl: user.profilePhotoUrl,
            dateOfBirth: user.dateOfBirth?.toISOString(),
            gender: user.gender,
            userType: user.userType,
            accountRole: user.accountRole,
            createdAt: user.createdAt.toISOString(),
          },
        },
      };
    } catch (error) {
      fastify.log.error('Error fetching user profile:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user profile',
      });
    }
  });

  // Update current user profile
  fastify.patch('/me', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.profile.update')
    ],
    schema: {
      tags: ['user.profile'],
      body: Type.Object({
        firstName: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
        lastName: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
        bio: Type.Optional(Type.String({ maxLength: 500 })),
        website: Type.Optional(Type.String({ maxLength: 255 })),
        dateOfBirth: Type.Optional(Type.String({ format: 'date' })),
        gender: Type.Optional(Type.String({ maxLength: 20 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            user: Type.Object({
              uuid: uuidSchema,
              firstName: Type.String(),
              lastName: Type.String(),
              updatedAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const updates = request.body;
      
      const user = await fastify.prisma.user.update({
        where: { 
          id: request.user!.id,
          tenantId: request.user!.tenantId // CRITICAL: Tenant isolation
        },
        data: {
          ...updates,
          dateOfBirth: updates.dateOfBirth ? new Date(updates.dateOfBirth) : undefined,
        },
      });

      return {
        success: true,
        data: {
          user: {
            uuid: user.uuid as UUID,
            firstName: user.firstName,
            lastName: user.lastName,
            updatedAt: user.updatedAt.toISOString(),
          },
        },
      };
    } catch (error) {
      fastify.log.error('Error updating user profile:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update user profile',
      });
    }
  });

  // Change password
  fastify.post('/change-password', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.profile.update')
    ],
    schema: {
      tags: ['user.profile'],
      body: Type.Object({
        currentPassword: Type.String({ minLength: 1 }),
        newPassword: Type.String({ minLength: 8, maxLength: 128 }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { currentPassword, newPassword } = request.body;
      
      // Get user with password
      const user = await fastify.prisma.user.findUnique({
        where: { 
          id: request.user!.id,
          tenantId: request.user!.tenantId // CRITICAL: Tenant isolation
        },
        select: { id: true, password: true },
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return reply.code(400).send({
          success: false,
          error: 'INVALID_CURRENT_PASSWORD',
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await fastify.prisma.user.update({
        where: { tenantId: request.user.tenantId },
        data: { password: hashedNewPassword },
      });

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      fastify.log.error('Error changing password:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to change password',
      });
    }
  });

  // Get user by UUID (public profile view)
  fastify.get('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.profile.read')
    ],
    schema: {
      tags: ['user.profile'],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            user: Type.Object({
              uuid: uuidSchema,
              firstName: Type.String(),
              lastName: Type.String(),
              username: Type.String(),
              bio: Type.Optional(Type.String()),
              website: Type.Optional(Type.String()),
              profilePhotoUrl: Type.Optional(Type.String()),
              userType: Type.String(),
              createdAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const uuid = toUUID(request.params.uuid);
      
      const user = await fastify.prisma.user.findFirst({
        where: { 
          uuid,
          tenantId: request.user!.tenantId // CRITICAL: Tenant isolation
        },
        select: {
          uuid: true,
          firstName: true,
          lastName: true,
          username: true,
          bio: true,
          website: true,
          profilePhotoUrl: true,
          userType: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      }

      return {
        success: true,
        data: {
          user: {
            uuid: user.uuid as UUID,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            bio: user.bio,
            website: user.website,
            profilePhotoUrl: user.profilePhotoUrl,
            userType: user.userType,
            createdAt: user.createdAt.toISOString(),
          },
        },
      };
    } catch (error) {
      fastify.log.error('Error fetching user profile:', error);
      return reply.code(500).send({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user profile',
      });
    }
  });
};

export default usersRoutes;