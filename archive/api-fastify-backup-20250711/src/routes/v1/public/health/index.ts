import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import os from 'os';

/**
 * Public Health Check Routes
 * No authentication required - used for monitoring and load balancers
 */
export const publicHealthRoutes: FastifyPluginAsync = async (fastify) => {
  // Basic health check
  // Support all methods but only handle GET properly
  fastify.route({
    method: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    url: '/',
    handler: async (request, reply) => {
      // Handle non-GET methods
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return reply.status(405).send({
          success: false,
          error: 'METHOD_NOT_ALLOWED',
          message: 'Method not allowed for this endpoint',
        });
      }
      
      // Set no-cache headers
      reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      reply.header('Pragma', 'no-cache');
      reply.header('Expires', '0');
      
      // For HEAD request, just send headers without body
      if (request.method === 'HEAD') {
        return reply.send();
      }
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'itellico-api',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      };
    },
    schema: {
      tags: ['public.health'],
      summary: 'Basic health check',
      description: 'Simple endpoint to check if the API is responding',
      response: {
        200: Type.Object({
          status: Type.Literal('ok'),
          timestamp: Type.String(),
          uptime: Type.Number(),
          service: Type.String(),
          version: Type.String(),
          environment: Type.String(),
        }),
        405: Type.Object({
          success: Type.Boolean(),
          error: Type.String(),
          message: Type.String(),
        }),
      },
    },
  });

  // Readiness check - checks if all services are ready
  fastify.get('/ready', {
    schema: {
      tags: ['public.health'],
      summary: 'Readiness check',
      description: 'Check if the API and all dependencies are ready to serve requests',
      response: {
        200: Type.Object({
          status: Type.Literal('ready'),
          checks: Type.Object({
            database: Type.Object({
              status: Type.String(),
              responseTime: Type.Optional(Type.Number()),
            }),
            redis: Type.Object({
              status: Type.String(),
              responseTime: Type.Optional(Type.Number()),
            }),
            temporal: Type.Optional(Type.Object({
              status: Type.String(),
              responseTime: Type.Optional(Type.Number()),
            })),
            mailpit: Type.Optional(Type.Object({
              status: Type.String(),
              responseTime: Type.Optional(Type.Number()),
            })),
            n8n: Type.Optional(Type.Object({
              status: Type.String(),
              responseTime: Type.Optional(Type.Number()),
            })),
          }),
          timestamp: Type.String(),
        }),
        503: Type.Object({
          status: Type.Literal('not_ready'),
          checks: Type.Object({
            database: Type.Object({
              status: Type.String(),
              responseTime: Type.Optional(Type.Number()),
            }),
            redis: Type.Object({
              status: Type.String(),
              responseTime: Type.Optional(Type.Number()),
            }),
            temporal: Type.Optional(Type.Object({
              status: Type.String(),
              responseTime: Type.Optional(Type.Number()),
            })),
            mailpit: Type.Optional(Type.Object({
              status: Type.String(),
              responseTime: Type.Optional(Type.Number()),
            })),
            n8n: Type.Optional(Type.Object({
              status: Type.String(),
              responseTime: Type.Optional(Type.Number()),
            })),
          }),
          timestamp: Type.String(),
        }),
      },
    },
    async handler(request, reply) {
      const checks: any = {
        database: { status: 'error' },
        redis: { status: 'error' },
      };

      let allReady = true;

      // Check database connection
      try {
        const startTime = Date.now();
        await fastify.prisma.$queryRaw`SELECT 1`;
        checks.database = {
          status: 'ok',
          responseTime: Date.now() - startTime,
        };
      } catch (error) {
        checks.database = { status: 'error' };
        allReady = false;
        request.log.error({ error }, 'Database health check failed');
      }

      // Check Redis connection
      try {
        if (fastify.redis) {
          const startTime = Date.now();
          await fastify.redis.ping();
          checks.redis = {
            status: 'ok',
            responseTime: Date.now() - startTime,
          };
        } else {
          checks.redis = { status: 'error' };
          // Redis is optional in development
          if (process.env.NODE_ENV === 'production') {
            allReady = false;
          }
        }
      } catch (error) {
        checks.redis = { status: 'error' };
        allReady = false;
        request.log.error({ error }, 'Redis health check failed');
      }

      // Check Temporal connection (optional service)
      if (process.env.TEMPORAL_ADDRESS) {
        try {
          const startTime = Date.now();
          const temporalWebUrl = 'http://localhost:8080';
          const response = await fetch(temporalWebUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(3000) // 3 second timeout
          });
          
          if (response.ok) {
            checks.temporal = {
              status: 'ok',
              responseTime: Date.now() - startTime,
            };
          } else {
            checks.temporal = { status: 'error' };
            request.log.warn({ status: response.status }, 'Temporal Web UI health check failed');
          }
        } catch (error) {
          checks.temporal = { status: 'error' };
          request.log.warn({ error }, 'Temporal health check failed');
        }
      }

      // Check Mailpit connection (optional service)
      if (process.env.MAILPIT_URL || process.env.NODE_ENV === 'development') {
        try {
          const startTime = Date.now();
          const mailpitUrl = process.env.MAILPIT_URL || 'http://localhost:8025';
          const response = await fetch(`${mailpitUrl}/api/v1/info`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000) // 3 second timeout
          });
          
          if (response.ok) {
            checks.mailpit = {
              status: 'ok',
              responseTime: Date.now() - startTime,
            };
          } else {
            checks.mailpit = { status: 'error' };
            request.log.warn({ status: response.status }, 'Mailpit health check failed');
          }
        } catch (error) {
          checks.mailpit = { status: 'error' };
          request.log.warn({ error }, 'Mailpit health check failed');
        }
      }

      // Check N8N connection (optional service)
      if (process.env.N8N_URL || process.env.NODE_ENV === 'development') {
        try {
          const startTime = Date.now();
          const n8nUrl = process.env.N8N_URL || 'http://localhost:5678';
          const response = await fetch(`${n8nUrl}/healthz`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000) // 3 second timeout
          });
          
          if (response.ok) {
            checks.n8n = {
              status: 'ok',
              responseTime: Date.now() - startTime,
            };
          } else {
            checks.n8n = { status: 'error' };
            request.log.warn({ status: response.status }, 'N8N health check failed');
          }
        } catch (error) {
          checks.n8n = { status: 'error' };
          request.log.warn({ error }, 'N8N health check failed');
        }
      }

      const response = {
        status: allReady ? 'ready' as const : 'not_ready' as const,
        checks,
        timestamp: new Date().toISOString(),
      };

      if (!allReady) {
        return reply.status(503).send(response);
      }

      return response;
    },
  });

  // Liveness check - checks if the process is alive
  fastify.get('/live', {
    schema: {
      tags: ['public.health'],
      summary: 'Liveness check',
      description: 'Check if the API process is alive and responding',
      response: {
        200: Type.Object({
          status: Type.Literal('alive'),
          uptime: Type.Number(),
          pid: Type.Number(),
          memory: Type.Object({
            used: Type.Number(),
            total: Type.Number(),
            rss: Type.Number(),
            heapTotal: Type.Number(),
            heapUsed: Type.Number(),
            external: Type.Number(),
          }),
          cpu: Type.Object({
            user: Type.Number(),
            system: Type.Number(),
          }),
          system: Type.Object({
            platform: Type.String(),
            nodeVersion: Type.String(),
            arch: Type.String(),
            hostname: Type.String(),
          }),
          timestamp: Type.String(),
        }),
      },
    },
    async handler(request, reply) {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      return {
        status: 'alive',
        uptime: process.uptime(),
        pid: process.pid,
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        system: {
          platform: os.platform(),
          nodeVersion: process.version,
          arch: os.arch(),
          hostname: os.hostname(),
        },
        timestamp: new Date().toISOString(),
      };
    },
  });

  // Detailed system info (might want to restrict this in production)
  fastify.get('/info', {
    schema: {
      tags: ['public.health'],
      summary: 'System information',
      description: 'Get detailed system information (may be restricted in production)',
      response: {
        200: Type.Object({
          app: Type.Object({
            name: Type.String(),
            version: Type.String(),
            environment: Type.String(),
            nodeVersion: Type.String(),
          }),
          system: Type.Object({
            platform: Type.String(),
            arch: Type.String(),
            hostname: Type.String(),
            totalMemory: Type.Number(),
            freeMemory: Type.Number(),
            cpus: Type.Number(),
            loadAverage: Type.Array(Type.Number()),
          }),
          timestamp: Type.String(),
        }),
      },
    },
    async handler(request, reply) {
      return {
        app: {
          name: 'itellico Mono API',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          nodeVersion: process.version,
        },
        system: {
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname(),
          totalMemory: os.totalmem(),
          freeMemory: os.freemem(),
          cpus: os.cpus().length,
          loadAverage: os.loadavg(),
        },
        timestamp: new Date().toISOString(),
      };
    },
  });
};