import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

export const queueRoutes: FastifyPluginAsync = async (fastify) => {
  // Get queue statistics and health
  fastify.get('/stats', {
    preHandler: [fastify.authenticate, fastify.requirePermission('queue:read')],
    schema: {
      tags: ['platform.queue'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            queues: Type.Array(Type.Object({
              name: Type.String(),
              waiting: Type.Number(),
              active: Type.Number(),
              completed: Type.Number(),
              failed: Type.Number(),
              delayed: Type.Number(),
              paused: Type.Boolean(),
            })),
            workers: Type.Object({
              active: Type.Number(),
              total: Type.Number(),
              healthy: Type.Number(),
              status: Type.String(),
            }),
            system: Type.Object({
              memoryUsage: Type.Number(),
              cpuUsage: Type.Number(),
              uptime: Type.Number(),
            }),
            processing: Type.Object({
              totalJobs: Type.Number(),
              completedToday: Type.Number(),
              failedToday: Type.Number(),
              averageProcessingTime: Type.Number(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      // Get queue statistics from database
      const queueStats = await fastify.prisma.queueJob.groupBy({
        by: ['queueName', 'status'],
        where: {
          tenantId: request.user!.tenantId,
        },
        _count: { id: true },
      });

      // Process stats into structured format
      const queueMap = new Map<string, any>();
      queueStats.forEach(stat => {
        if (!queueMap.has(stat.queueName)) {
          queueMap.set(stat.queueName, {
            name: stat.queueName,
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            paused: false,
          });
        }
        const queue = queueMap.get(stat.queueName);
        queue[stat.status] = stat._count.id;
      });

      // Get processing statistics for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayStats = await fastify.prisma.queueJob.aggregate({
        where: {
          tenantId: request.user!.tenantId,
          createdAt: { gte: today },
        },
        _count: { id: true },
        _avg: { processingTimeMs: true },
      });

      const completedToday = await fastify.prisma.queueJob.count({
        where: {
          tenantId: request.user!.tenantId,
          status: 'completed',
          createdAt: { gte: today },
        },
      });

      const failedToday = await fastify.prisma.queueJob.count({
        where: {
          tenantId: request.user!.tenantId,
          status: 'failed',
          createdAt: { gte: today },
        },
      });

      return {
        success: true,
        data: {
          queues: Array.from(queueMap.values()),
          workers: {
            active: 3, // Mock data - would come from worker manager
            total: 5,
            healthy: 3,
            status: 'healthy',
          },
          system: {
            memoryUsage: process.memoryUsage().heapUsed,
            cpuUsage: 0.25, // Mock data
            uptime: process.uptime(),
          },
          processing: {
            totalJobs: todayStats._count.uuid as UUID,
            completedToday,
            failedToday,
            averageProcessingTime: todayStats._avg.processingTimeMs || 0,
          },
        },
      };

    } catch (error: any) {
      request.log.error('Failed to get queue stats', { error: error.message });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_GET_QUEUE_STATISTICS',
      });
    }
  });

  // Get jobs with filtering and pagination
  fastify.get('/jobs', {
    preHandler: [fastify.authenticate, fastify.requirePermission('queue:read')],
    schema: {
      tags: ['platform.queue'],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        queue: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
        jobType: Type.Optional(Type.String()),
        search: Type.Optional(Type.String()),
        sortBy: Type.Optional(Type.String({ default: 'createdAt' })),
        sortOrder: Type.Optional(Type.String({ default: 'desc' })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            jobs: Type.Array(Type.Object({
              id: Type.String(),
              queueName: Type.String(),
              jobType: Type.String(),
              status: Type.String(),
              priority: Type.Number(),
              attempts: Type.Number(),
              maxAttempts: Type.Number(),
              progress: Type.Number(),
              data: Type.Object({}, { additionalProperties: true }),
              result: Type.Optional(Type.Object({}, { additionalProperties: true })),
              error: Type.Optional(Type.String()),
              processingTimeMs: Type.Optional(Type.Number()),
              createdAt: Type.String(),
              updatedAt: Type.String(),
              startedAt: Type.Optional(Type.String()),
              completedAt: Type.Optional(Type.String()),
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
  }, async (request, reply) => {
    const {
      page = 1,
      limit = 20,
      queue,
      status,
      jobType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = request.query as any;

    const skip = (page - 1) * limit;

    try {
      // Build where clause
      const where: any = {
        tenantId: request.user!.tenantId,
      };

      if (queue) where.queueName = queue;
      if (status) where.status = status;
      if (jobType) where.jobType = jobType;
      if (search) {
        where.OR = [
          { jobType: { contains: search, mode: 'insensitive' } },
          { queueName: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Build orderBy
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      const [jobs, total] = await Promise.all([
        fastify.prisma.queueJob.findMany({
          where,
          skip,
          take: limit,
          orderBy,
        }),
        fastify.prisma.queueJob.count({ where }),
      ]);

      return {
        success: true,
        data: {
          jobs: jobs.map(job => ({
            queueName: job.queueName,
            jobType: job.jobType,
            status: job.status,
            priority: job.priority,
            attempts: job.attempts,
            maxAttempts: job.maxAttempts,
            progress: job.progress,
            data: job.data,
            result: job.result,
            error: job.error,
            processingTimeMs: job.processingTimeMs,
            createdAt: job.createdAt.toISOString(),
            updatedAt: job.updatedAt.toISOString(),
            startedAt: job.startedAt?.toISOString(),
            completedAt: job.completedAt?.toISOString(),
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };

    } catch (error: any) {
      request.log.error('Failed to get queue jobs', { error: error.message });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_GET_QUEUE_JOBS',
      });
    }
  });

  // Retry failed job
  fastify.post('/jobs/:id/retry', {
    preHandler: [fastify.authenticate, fastify.requirePermission('queue:manage')],
    schema: {
      tags: ['platform.queue'],
      params: Type.Object({
        id: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      // Find the job
      const job = await fastify.prisma.queueJob.findFirst({
        where: {
          id,
          tenantId: request.user!.tenantId,
        },
      });

      if (!job) {
        return reply.code(404).send({
          success: false,
          error: 'JOB_NOT_FOUND',
        });
      }

      if (job.status !== 'failed') {
        return reply.code(400).send({
          success: false,
          error: 'ONLY_FAILED_JOBS_CAN_BE_RETRIED',
        });
      }

      // Reset job for retry
      await fastify.prisma.queueJob.update({
        where: { id },
        data: {
          status: 'waiting',
          attempts: 0,
          error: null,
          progress: 0,
          startedAt: null,
          completedAt: null,
          updatedAt: new Date(),
        },
      });

      request.log.info('Job queued for retry', { jobId: id, jobType: job.jobType });

      return {
        success: true,
        message: 'Job queued for retry',
      };

    } catch (error: any) {
      request.log.error('Failed to retry job', { error: error.message, jobId: id });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_RETRY_JOB',
      });
    }
  });

  // Cancel job
  fastify.post('/jobs/:id/cancel', {
    preHandler: [fastify.authenticate, fastify.requirePermission('queue:manage')],
    schema: {
      tags: ['platform.queue'],
      params: Type.Object({
        id: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const job = await fastify.prisma.queueJob.findFirst({
        where: {
          id,
          tenantId: request.user!.tenantId,
        },
      });

      if (!job) {
        return reply.code(404).send({
          success: false,
          error: 'JOB_NOT_FOUND',
        });
      }

      if (job.status === 'completed' || job.status === 'failed') {
        return reply.code(400).send({
          success: false,
          error: 'CANNOT_CANCEL_COMPLETED_OR_FAILED_JOBS',
        });
      }

      // Cancel the job
      await fastify.prisma.queueJob.update({
        where: { id },
        data: {
          status: 'failed',
          error: 'JOB_CANCELLED_BY_USER',
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      request.log.info('Job cancelled', { jobId: id, jobType: job.jobType });

      return {
        success: true,
        message: 'Job cancelled successfully',
      };

    } catch (error: any) {
      request.log.error('Failed to cancel job', { error: error.message, jobId: id });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_CANCEL_JOB',
      });
    }
  });

  // Worker control endpoints
  fastify.post('/workers/pause', {
    preHandler: [fastify.authenticate, fastify.requirePermission('queue:admin')],
    schema: {
      tags: ['platform.queue'],
      body: Type.Object({
        queueName: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    const { queueName } = request.body;

    try {
      // In a real implementation, this would pause the workers
      request.log.info('Queue workers paused', { queueName: queueName || 'all' });

      return {
        success: true,
        message: queueName ? `Queue ${queueName} paused` : 'All queues paused',
      };

    } catch (error: any) {
      request.log.error('Failed to pause workers', { error: error.message });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_PAUSE_WORKERS',
      });
    }
  });

  fastify.post('/workers/resume', {
    preHandler: [fastify.authenticate, fastify.requirePermission('queue:admin')],
    schema: {
      tags: ['platform.queue'],
      body: Type.Object({
        queueName: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    const { queueName } = request.body;

    try {
      // In a real implementation, this would resume the workers
      request.log.info('Queue workers resumed', { queueName: queueName || 'all' });

      return {
        success: true,
        message: queueName ? `Queue ${queueName} resumed` : 'All queues resumed',
      };

    } catch (error: any) {
      request.log.error('Failed to resume workers', { error: error.message });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_RESUME_WORKERS',
      });
    }
  });

  // Clean up old jobs
  fastify.post('/cleanup', {
    preHandler: [fastify.authenticate, fastify.requirePermission('queue:admin')],
    schema: {
      tags: ['platform.queue'],
      body: Type.Object({
        olderThanDays: Type.Optional(Type.Number({ minimum: 1, default: 30 })),
        status: Type.Optional(Type.Array(Type.String())),
        dryRun: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            deletedCount: Type.Number(),
            dryRun: Type.Boolean(),
            affectedQueues: Type.Array(Type.String()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { olderThanDays = 30, status = ['completed', 'failed'], dryRun = false } = request.body;

    try {
      const cutoffDate = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));

      const where = {
        tenantId: request.user!.tenantId,
        status: { in: status },
        completedAt: { lte: cutoffDate },
      };

      if (dryRun) {
        // Just count what would be deleted
        const count = await fastify.prisma.queueJob.count({ where });
        
        const affectedQueues = await fastify.prisma.queueJob.groupBy({
          by: ['queueName'],
          where,
        });

        return {
          success: true,
          data: {
            deletedCount: count,
            dryRun: true,
            affectedQueues: affectedQueues.map(q => q.queueName),
          },
        };
      } else {
        // Get affected queues before deletion
        const affectedQueues = await fastify.prisma.queueJob.groupBy({
          by: ['queueName'],
          where,
        });

        // Perform deletion
        const result = await fastify.prisma.queueJob.deleteMany({ where });

        request.log.info('Queue cleanup completed', {
          deletedCount: result.count,
          olderThanDays,
          status,
        });

        return {
          success: true,
          data: {
            deletedCount: result.count,
            dryRun: false,
            affectedQueues: affectedQueues.map(q => q.queueName),
          },
        };
      }

    } catch (error: any) {
      request.log.error('Failed to cleanup queue', { error: error.message });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_CLEANUP_QUEUE',
      });
    }
  });
};