import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

export const emergencyRoutes: FastifyPluginAsync = async (fastify) => {
  // Get emergency access status
  fastify.get('/status', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.emergency.read')
    ],
    schema: {
      tags: ['platform.emergency'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            isActive: Type.Boolean(),
            expiresAt: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
            timeRemaining: Type.Number(),
            user: Type.Object({
              name: Type.String()
            }),
            recentActivity: Type.Array(Type.Object({
              type: Type.String(),
              justification: Type.Optional(Type.String()),
              createdAt: Type.String({ format: 'date-time' }),
              ipAddress: Type.Optional(Type.String())
            }))
          })
        }),
        401: Type.Object({
          success: Type.Boolean(),
          error: Type.String()
        }),
        403: Type.Object({
          success: Type.Boolean(),
          error: Type.String()
        }),
        404: Type.Object({
          success: Type.Boolean(),
          error: Type.String()
        }),
        500: Type.Object({
          success: Type.Boolean(),
          error: Type.String(),
          details: Type.Optional(Type.Any())
        })
      }
    }
  }, async (request, reply) => {
    try {
      const userId = request.user.id;

      // Check if user currently has emergency access
      const user = await fastify.prisma.user.findFirst({
        where: { uuid: userId },
        select: { 
          id: true,
          emergencyUntil: true,
          firstName: true,
          lastName: true
        }
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'USER_NOT_FOUND'
        });
      }

      const isEmergencyActive = user.emergencyUntil && user.emergencyUntil > new Date();
      const timeRemaining = isEmergencyActive 
        ? Math.max(0, user.emergencyUntil!.getTime() - Date.now())
        : 0;

      // Get recent emergency audit logs
      const recentAudits = await fastify.prisma.emergencyAudit.findMany({
        where: { userId: user.uuid as UUID },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          type: true,
          justification: true,
          createdAt: true,
          ipAddress: true
        }
      });

      fastify.log.info({
        msg: 'Emergency status checked',
        userId: user.uuid as UUID,
        isEmergencyActive,
        timeRemaining
      });

      return {
        success: true,
        data: {
          isActive: isEmergencyActive,
          expiresAt: user.emergencyUntil?.toISOString() || null,
          timeRemaining,
          user: {
            name: `${user.firstName} ${user.lastName}`
          },
          recentActivity: recentAudits.map(audit => ({
            type: audit.type,
            justification: audit.justification,
            createdAt: audit.createdAt.toISOString(),
            ipAddress: audit.ipAddress
          }))
        }
      };

    } catch (error) {
      fastify.log.error({
        msg: 'Emergency status check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_CHECK_EMERGENCY_STATUS',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  // Activate emergency access
  fastify.post('/activate', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.emergency.read')
    ],
    schema: {
      tags: ['platform.emergency'],
      body: Type.Object({
        justification: Type.String({ minLength: 10 }),
        duration: Type.Number({ minimum: 5, maximum: 120 }) // minutes
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            expiresAt: Type.String({ format: 'date-time' })
          })
        }),
        400: Type.Object({
          success: Type.Boolean(),
          error: Type.String()
        }),
        401: Type.Object({
          success: Type.Boolean(),
          error: Type.String()
        }),
        403: Type.Object({
          success: Type.Boolean(),
          error: Type.String()
        }),
        500: Type.Object({
          success: Type.Boolean(),
          error: Type.String()
        })
      }
    }
  }, async (request, reply) => {
    try {
      const { justification, duration } = request.body;
      const userId = request.user.id;

      // Get user from UUID
      const user = await fastify.prisma.user.findFirst({
        where: { uuid: userId },
        select: { id: true, emergencyUntil: true }
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'USER_NOT_FOUND'
        });
      }

      // Check if already active
      if (user.emergencyUntil && user.emergencyUntil > new Date()) {
        return reply.status(400).send({
          success: false,
          error: 'EMERGENCY_ACCESS_IS_ALREADY_ACTIVE'
        });
      }

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + duration * 60 * 1000);

      // Update user's emergency access
      await fastify.prisma.user.update({
        where: { },
        data: { emergencyUntil: expiresAt }
      });

      // Log the activation
      await fastify.prisma.emergencyAudit.create({
        data: {
          userId: user.uuid as UUID,
          type: 'activated',
          justification,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'] || 'unknown'
        }
      });

      fastify.log.info({
        msg: 'Emergency access activated',
        userId: user.uuid as UUID,
        duration,
        expiresAt
      });

      return {
        success: true,
        data: {
          message: `Emergency access activated for ${duration} minutes`,
          expiresAt: expiresAt.toISOString()
        }
      };

    } catch (error) {
      fastify.log.error({
        msg: 'Emergency activation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_ACTIVATE_EMERGENCY_ACCESS'
      });
    }
  });

  // Deactivate emergency access
  fastify.post('/deactivate', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('platform.emergency.read')
    ],
    schema: {
      tags: ['platform.emergency'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String()
          })
        }),
        400: Type.Object({
          success: Type.Boolean(),
          error: Type.String()
        }),
        401: Type.Object({
          success: Type.Boolean(),
          error: Type.String()
        }),
        403: Type.Object({
          success: Type.Boolean(),
          error: Type.String()
        }),
        500: Type.Object({
          success: Type.Boolean(),
          error: Type.String()
        })
      }
    }
  }, async (request, reply) => {
    try {
      const userId = request.user.id;

      // Get user from UUID
      const user = await fastify.prisma.user.findFirst({
        where: { uuid: userId },
        select: { id: true, emergencyUntil: true }
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'USER_NOT_FOUND'
        });
      }

      // Check if not active
      if (!user.emergencyUntil || user.emergencyUntil <= new Date()) {
        return reply.status(400).send({
          success: false,
          error: 'EMERGENCY_ACCESS_IS_NOT_ACTIVE'
        });
      }

      // Deactivate emergency access
      await fastify.prisma.user.update({
        where: { },
        data: { emergencyUntil: null }
      });

      // Log the deactivation
      await fastify.prisma.emergencyAudit.create({
        data: {
          userId: user.uuid as UUID,
          type: 'deactivated',
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'] || 'unknown'
        }
      });

      fastify.log.info({
        msg: 'Emergency access deactivated',
        userId: user.uuid as UUID
      });

      return {
        success: true,
        data: {
          message: 'Emergency access deactivated successfully'
        }
      };

    } catch (error) {
      fastify.log.error({
        msg: 'Emergency deactivation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return reply.status(500).send({
        success: false,
        error: 'FAILED_TO_DEACTIVATE_EMERGENCY_ACCESS'
      });
    }
  });
};