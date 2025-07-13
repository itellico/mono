import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * User Marketplace Jobs Routes
 * Browse and apply for jobs
 */
export const userJobsRoutes: FastifyPluginAsync = async (fastify) => {
  // Browse jobs
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.marketplace.jobs.read')
    ],
    schema: {
      tags: ['user.marketplace'],
      summary: 'Browse jobs',
      description: 'Browse available jobs in the marketplace',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        categoryId: Type.Optional(Type.Number()),
        minBudget: Type.Optional(Type.Number()),
        maxBudget: Type.Optional(Type.Number()),
        location: Type.Optional(Type.String()),
        remote: Type.Optional(Type.Boolean()),
        status: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            jobs: Type.Array(Type.Object({
              uuid: uuidSchema,
              title: Type.String(),
              description: Type.String(),
              category: Type.Object({
                name: Type.String(),
              }),
              budget: Type.Optional(Type.Object({
                min: Type.Number(),
                max: Type.Number(),
                currency: Type.String(),
              })),
              location: Type.Optional(Type.String()),
              remote: Type.Boolean(),
              applicationDeadline: Type.Optional(Type.String()),
              requiredSkills: Type.Array(Type.String()),
              postedBy: Type.Object({
                name: Type.String(),
                company: Type.Optional(Type.String()),
              }),
              applicationCount: Type.Number(),
              isApplied: Type.Boolean(),
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
      const { 
        page = 1, 
        limit = 20, 
        search, 
        categoryId, 
        minBudget, 
        maxBudget, 
        location, 
        remote,
        status = 'active'
      } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          tenantId: request.user!.tenantId,
          status,
          applicationDeadline: {
            gte: new Date(),
          },
        };

        if (search) {
          where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ];
        }

        if (categoryId) {
          where.categoryId = categoryId;
        }

        if (minBudget !== undefined) {
          where.budgetMin = { gte: minBudget };
        }

        if (maxBudget !== undefined) {
          where.budgetMax = { lte: maxBudget };
        }

        if (location) {
          where.location = { contains: location, mode: 'insensitive' };
        }

        if (remote !== undefined) {
          where.remote = remote;
        }

        const [jobs, total] = await Promise.all([
          fastify.prisma.job.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              postedBy: {
                include: {
                  account: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  applications: true,
                },
              },
              applications: {
                where: { tenantId: request.user.tenantId, applicantId: request.user!.id, },
                select: {
                  id: true,
                },
              },
              jobSkills: {
                select: {
                  skill: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          }),
          fastify.prisma.job.count({ where }),
        ]);

        return {
          success: true,
          data: {
            jobs: jobs.map(job => ({
              uuid: job.uuid,
              title: job.title,
              description: job.description,
              category: job.category,
              budget: job.budgetMin || job.budgetMax ? {
                min: job.budgetMin || 0,
                max: job.budgetMax || 0,
                currency: job.budgetCurrency || 'USD',
              } : undefined,
              location: job.location,
              remote: job.remote,
              applicationDeadline: job.applicationDeadline?.toISOString(),
              requiredSkills: job.jobSkills.map(js => js.skill.name),
              postedBy: {
                id: job.postedBy.uuid as UUID,
                name: job.postedBy.name,
                company: job.postedBy.account?.name,
              },
              applicationCount: job._count.applications,
              isApplied: job.applications.length > 0,
              createdAt: job.createdAt.toISOString(),
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
        request.log.error({ error }, 'Failed to browse jobs');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_BROWSE_JOBS',
        });
      }
    },
  });

  // Get job details
  fastify.get('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.marketplace.jobs.read')
    ],
    schema: {
      tags: ['user.marketplace'],
      summary: 'Get job details',
      description: 'Get detailed information about a job',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            job: Type.Object({
              uuid: uuidSchema,
              title: Type.String(),
              description: Type.String(),
              requirements: Type.Optional(Type.String()),
              responsibilities: Type.Optional(Type.String()),
              benefits: Type.Optional(Type.String()),
              category: Type.Object({
                name: Type.String(),
              }),
              budget: Type.Optional(Type.Object({
                min: Type.Number(),
                max: Type.Number(),
                currency: Type.String(),
                type: Type.String(),
              })),
              location: Type.Optional(Type.String()),
              remote: Type.Boolean(),
              applicationDeadline: Type.Optional(Type.String()),
              startDate: Type.Optional(Type.String()),
              duration: Type.Optional(Type.String()),
              requiredSkills: Type.Array(Type.String()),
              preferredSkills: Type.Array(Type.String()),
              postedBy: Type.Object({
                name: Type.String(),
                company: Type.Optional(Type.String()),
                verified: Type.Boolean(),
              }),
              applicationCount: Type.Number(),
              viewCount: Type.Number(),
              isApplied: Type.Boolean(),
              isSaved: Type.Boolean(),
              createdAt: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const job = await fastify.prisma.job.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
            status: 'active',
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            postedBy: {
              include: {
                account: {
                  select: {
                    name: true,
                    verified: true,
                  },
                },
              },
            },
            _count: {
              select: {
                applications: true,
                views: true,
              },
            },
            applications: {
              where: { tenantId: request.user.tenantId, applicantId: request.user!.id, },
              select: {
                id: true,
              },
            },
            savedJobs: {
              where: { tenantId: request.user.tenantId, userId: request.user!.id, },
              select: {
                id: true,
              },
            },
            jobSkills: {
              select: {
                skill: {
                  select: {
                    name: true,
                  },
                },
                required: true,
              },
            },
          },
        });

        if (!job) {
          return reply.status(404).send({
            success: false,
            error: 'JOB_NOT_FOUND',
          });
        }

        // Track job view
        await fastify.prisma.jobView.create({
          data: {
            jobId: job.uuid as UUID,
            viewerId: request.user!.id,
          },
        });

        const requiredSkills = job.jobSkills.filter(js => js.required).map(js => js.skill.name);
        const preferredSkills = job.jobSkills.filter(js => !js.required).map(js => js.skill.name);

        return {
          success: true,
          data: {
            job: {
              uuid: job.uuid,
              title: job.title,
              description: job.description,
              requirements: job.requirements,
              responsibilities: job.responsibilities,
              benefits: job.benefits,
              category: job.category,
              budget: job.budgetMin || job.budgetMax ? {
                min: job.budgetMin || 0,
                max: job.budgetMax || 0,
                currency: job.budgetCurrency || 'USD',
                type: job.budgetType || 'fixed',
              } : undefined,
              location: job.location,
              remote: job.remote,
              applicationDeadline: job.applicationDeadline?.toISOString(),
              startDate: job.startDate?.toISOString(),
              duration: job.duration,
              requiredSkills,
              preferredSkills,
              postedBy: {
                id: job.postedBy.uuid as UUID,
                name: job.postedBy.name,
                company: job.postedBy.account?.name,
                verified: job.postedBy.account?.verified || false,
              },
              applicationCount: job._count.applications,
              viewCount: job._count.views,
              isApplied: job.applications.length > 0,
              isSaved: job.savedJobs.length > 0,
              createdAt: job.createdAt.toISOString(),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get job details');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_JOB_DETAILS',
        });
      }
    },
  });

  // Apply for job
  fastify.post('/:uuid/apply', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.marketplace.jobs.read')
    ],
    schema: {
      tags: ['user.marketplace'],
      summary: 'Apply for job',
      description: 'Submit an application for a job',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        coverLetter: Type.String({ minLength: 50 }),
        proposedRate: Type.Optional(Type.Number()),
        availableFrom: Type.Optional(Type.String()),
        portfolioItems: Type.Optional(Type.Array(Type.Number())),
        attachments: Type.Optional(Type.Array(Type.Number())),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            applicationId: Type.Number(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { coverLetter, proposedRate, availableFrom, portfolioItems, attachments } = request.body;

      try {
        const job = await fastify.prisma.job.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
            status: 'active',
          },
        });

        if (!job) {
          return reply.status(404).send({
            success: false,
            error: 'JOB_NOT_FOUND',
          });
        }

        // Check if already applied
        const existingApplication = await fastify.prisma.jobApplication.findFirst({
          where: { tenantId: request.user.tenantId, jobId: job.uuid as UUID,
            applicantId: request.user!.id, },
        });

        if (existingApplication) {
          return reply.status(400).send({
            success: false,
            error: 'YOU_HAVE_ALREADY_APPLIED_FOR_THIS_JOB',
          });
        }

        // Check deadline
        if (job.applicationDeadline && job.applicationDeadline < new Date()) {
          return reply.status(400).send({
            success: false,
            error: 'APPLICATION_DEADLINE_HAS_PASSED',
          });
        }

        // Create application
        const application = await fastify.prisma.jobApplication.create({
          data: {
            jobId: job.uuid as UUID,
            applicantId: request.user!.id,
            coverLetter,
            proposedRate,
            availableFrom: availableFrom ? new Date(availableFrom) : undefined,
            status: 'pending',
          },
        });

        // TODO: Handle portfolio items and attachments

        // Send notification to job poster
        await fastify.prisma.notification.create({
          data: {
            userId: job.postedById,
            type: 'job_application',
            title: 'New Job Application',
            content: `You have received a new application for "${job.title}"`,
            data: {
              jobId: job.uuid as UUID,
              applicationId: application.uuid as UUID,
            },
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            message: 'Application submitted successfully',
            applicationId: application.uuid as UUID,
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to apply for job');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_APPLY_FOR_JOB',
        });
      }
    },
  });

  // Save/unsave job
  fastify.post('/:uuid/save', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.marketplace.jobs.read')
    ],
    schema: {
      tags: ['user.marketplace'],
      summary: 'Save/unsave job',
      description: 'Toggle job save status',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            saved: Type.Boolean(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const job = await fastify.prisma.job.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
          },
        });

        if (!job) {
          return reply.status(404).send({
            success: false,
            error: 'JOB_NOT_FOUND',
          });
        }

        const savedJob = await fastify.prisma.savedJob.findFirst({
          where: { tenantId: request.user.tenantId, jobId: job.uuid as UUID,
            userId: request.user!.id, },
        });

        if (savedJob) {
          // Unsave
          await fastify.prisma.savedJob.delete({
            where: { tenantId: request.user.tenantId },
          });

          return {
            success: true,
            data: {
              message: 'Job removed from saved list',
              saved: false,
            },
          };
        } else {
          // Save
          await fastify.prisma.savedJob.create({
            data: {
              jobId: job.uuid as UUID,
              userId: request.user!.id,
            },
          });

          return {
            success: true,
            data: {
              message: 'Job saved successfully',
              saved: true,
            },
          };
        }
      } catch (error) {
        request.log.error({ error }, 'Failed to save/unsave job');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_SAVE/UNSAVE_JOB',
        });
      }
    },
  });
};