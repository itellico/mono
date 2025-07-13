import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * User Activity Audit Routes
 * Access user's own audit logs
 */
export const userAuditRoutes: FastifyPluginAsync = async (fastify) => {
  // Get user's audit logs
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.activity.audit.read')
    ],
    schema: {
      tags: ['user.activity'],
      summary: 'Get audit logs',
      description: 'Get user\'s audit logs',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        action: Type.Optional(Type.String()),
        resource: Type.Optional(Type.String()),
        startDate: Type.Optional(Type.String()),
        endDate: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            logs: Type.Array(Type.Object({
              uuid: uuidSchema,
              action: Type.String(),
              resource: Type.String(),
              resourceId: Type.Optional(Type.String()),
              details: Type.Optional(Type.String()),
              result: Type.String(),
              ipAddress: Type.String(),
              userAgent: Type.String(),
              location: Type.Optional(Type.Object({
                city: Type.String(),
                country: Type.String(),
              })),
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
      const { page = 1, limit = 20, action, resource, startDate, endDate } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          userId: request.user!.id,
        };

        if (action) {
          where.action = action;
        }

        if (resource) {
          where.resource = resource;
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

        const [logs, total] = await Promise.all([
          fastify.prisma.audit_logs.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          fastify.prisma.audit_logs.count({ where }),
        ]);

        return {
          success: true,
          data: {
            logs: logs.map(log => ({
              uuid: log.uuid,
              action: log.action,
              resource: log.resource,
              resourceId: log.resourceId,
              details: log.details,
              result: log.result,
              ipAddress: log.ipAddress,
              userAgent: log.userAgent,
              location: log.metadata?.location as any,
              createdAt: log.createdAt.toISOString(),
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
        request.log.error({ error }, 'Failed to get audit logs');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_AUDIT_LOGS',
        });
      }
    },
  });

  // Get security events
  fastify.get('/security', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.activity.audit.read')
    ],
    schema: {
      tags: ['user.activity'],
      summary: 'Get security events',
      description: 'Get security-related audit events',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            events: Type.Array(Type.Object({
              type: Type.String(),
              description: Type.String(),
              severity: Type.String(),
              ipAddress: Type.String(),
              location: Type.Optional(Type.Object({
                city: Type.String(),
                country: Type.String(),
              })),
              resolved: Type.Boolean(),
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
      const { page = 1, limit = 20 } = request.query;
      const offset = (page - 1) * limit;

      try {
        const securityActions = [
          'login',
          'logout',
          'password_change',
          'password_reset',
          'two_factor_enabled',
          'two_factor_disabled',
          'api_key_created',
          'api_key_deleted',
          'permission_granted',
          'permission_revoked',
        ];

        const where = {
          userId: request.user!.id,
          action: { in: securityActions },
        };

        const [events, total] = await Promise.all([
          fastify.prisma.audit_logs.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          fastify.prisma.audit_logs.count({ where }),
        ]);

        return {
          success: true,
          data: {
            events: events.map(event => {
              let severity = 'info';
              if (event.action.includes('password') || event.action.includes('two_factor')) {
                severity = 'high';
              } else if (event.action.includes('permission')) {
                severity = 'medium';
              }

              return {
                type: event.action,
                description: event.details || `${event.action.replace(/_/g, ' ')} action performed`,
                severity,
                ipAddress: event.ipAddress,
                location: event.metadata?.location as any,
                resolved: true,
                createdAt: event.createdAt.toISOString(),
              };
            }),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get security events');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_SECURITY_EVENTS',
        });
      }
    },
  });

  // Get login history
  fastify.get('/logins', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.activity.audit.read')
    ],
    schema: {
      tags: ['user.activity'],
      summary: 'Get login history',
      description: 'Get user\'s login history',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            logins: Type.Array(Type.Object({
              ipAddress: Type.String(),
              userAgent: Type.String(),
              device: Type.Optional(Type.String()),
              browser: Type.Optional(Type.String()),
              location: Type.Optional(Type.Object({
                city: Type.String(),
                country: Type.String(),
              })),
              success: Type.Boolean(),
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
      const { page = 1, limit = 20 } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where = {
          userId: request.user!.id,
          action: 'login',
        };

        const [logins, total] = await Promise.all([
          fastify.prisma.audit_logs.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          fastify.prisma.audit_logs.count({ where }),
        ]);

        return {
          success: true,
          data: {
            logins: logins.map(login => {
              // Parse user agent for device/browser info
              const ua = login.userAgent;
              let device = 'Unknown';
              let browser = 'Unknown';

              if (ua.includes('Mobile')) device = 'Mobile';
              else if (ua.includes('Tablet')) device = 'Tablet';
              else device = 'Desktop';

              if (ua.includes('Chrome')) browser = 'Chrome';
              else if (ua.includes('Firefox')) browser = 'Firefox';
              else if (ua.includes('Safari')) browser = 'Safari';
              else if (ua.includes('Edge')) browser = 'Edge';

              return {
                ipAddress: login.ipAddress,
                userAgent: login.userAgent,
                device,
                browser,
                location: login.metadata?.location as any,
                success: login.result === 'success',
                createdAt: login.createdAt.toISOString(),
              };
            }),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get login history');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_LOGIN_HISTORY',
        });
      }
    },
  });
};