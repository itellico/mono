import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { JobPostingService } from '@/services/job-posting.service';

export const jobsRoutes: FastifyPluginAsync = async (fastify) => {
  // Create job posting service instance
  const jobPostingService = new JobPostingService(fastify.prisma, fastify.redis, fastify.log);

  // Search/list job postings
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.jobs.read')
    ],
    schema: {
      tags: ['user.jobs'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        category: Type.Optional(Type.String()),
        type: Type.Optional(Type.String()),
        status: Type.Optional(Type.Union([
          Type.Literal('draft'),
          Type.Literal('published'),
          Type.Literal('closed'),
          Type.Literal('filled'),
        ])),
        featured: Type.Optional(Type.Boolean()),
        search: Type.Optional(Type.String()),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
        sortBy: Type.Optional(Type.Union([
          Type.Literal('publishedAt'),
          Type.Literal('applicationDeadline'),
          Type.Literal('compensation'),
          Type.Literal('views'),
        ])),
        sortOrder: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')])),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            jobs: Type.Array(Type.Object({
              uuid: uuidSchema,
              title: Type.String(),
              category: Type.String(),
              type: Type.String(),
              companyName: Type.Optional(Type.String()),
              verified: Type.Boolean(),
              description: Type.String(),
              targetProfiles: Type.Any(),
              applicationDeadline: Type.String(),
              jobDates: Type.Any(),
              compensation: Type.Any(),
              status: Type.String(),
              featured: Type.Boolean(),
              publishedAt: Type.Optional(Type.String()),
              stats: Type.Any(),
              _count: Type.Object({
                applications: Type.Number(),
              }),
            })),
            total: Type.Number(),
            hasMore: Type.Boolean(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const tenantId = request.user!.tenantId;
    const isAdmin = fastify.hasPermission(request.user!, 'jobs:admin');
    
    // Non-admins can only see published jobs unless filtering their own
    const searchParams: any = {
      ...request.query,
      tenantId,
    };
    
    if (!isAdmin && !request.query.status) {
      searchParams.status = 'published';
    }
    
    const result = await jobPostingService.searchJobs(searchParams);
    
    return {
      success: true,
      data: result,
    };
  });

  // Get featured jobs
  fastify.get('/featured', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.jobs.read')
    ],
    schema: {
      tags: ['user.jobs'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 20, default: 6 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            jobs: Type.Array(Type.Any()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const tenantId = request.user!.tenantId;
    const { limit = 6 } = request.query;
    
    const jobs = await jobPostingService.getFeaturedJobs(tenantId, limit);
    
    return {
      success: true,
      data: { jobs },
    };
  });

  // Create job posting
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('jobs:create')],
    schema: {
      tags: ['user.jobs'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        profileId: Type.String({ format: 'uuid' }),
        profileType: Type.Union([Type.Literal('client'), Type.Literal('agency')]),
        companyName: Type.Optional(Type.String()),
        verified: Type.Optional(Type.Boolean()),
        title: Type.String({ minLength: 1, maxLength: 200 }),
        category: Type.String({ minLength: 1, maxLength: 50 }),
        type: Type.String({ minLength: 1, maxLength: 50 }),
        description: Type.String({ minLength: 1 }),
        requirements: Type.Object({
          skills: Type.Optional(Type.Array(Type.String())),
          experience: Type.Optional(Type.String()),
          languages: Type.Optional(Type.Array(Type.String())),
          certifications: Type.Optional(Type.Array(Type.String())),
        }),
        targetProfiles: Type.Object({
          categories: Type.Array(Type.String()),
          gender: Type.Optional(Type.Array(Type.String())),
          ageRange: Type.Optional(Type.Object({
            min: Type.Optional(Type.Number()),
            max: Type.Optional(Type.Number()),
          })),
          location: Type.Optional(Type.Object({
            city: Type.Optional(Type.String()),
            radius: Type.Optional(Type.Number()),
            remote: Type.Optional(Type.Boolean()),
          })),
          experience: Type.Optional(Type.String()),
          specificRequirements: Type.Optional(Type.Record(Type.String(), Type.Any())),
        }),
        applicationDeadline: Type.String({ format: 'date-time' }),
        maxApplications: Type.Optional(Type.Number({ minimum: 1 })),
        autoCloseOnMax: Type.Optional(Type.Boolean()),
        applicationQuestions: Type.Optional(Type.Array(Type.Object({
          question: Type.String(),
          type: Type.Union([
            Type.Literal('text'),
            Type.Literal('textarea'),
            Type.Literal('select'),
            Type.Literal('multiselect'),
          ]),
          required: Type.Boolean(),
          options: Type.Optional(Type.Array(Type.String())),
        }))),
        jobDates: Type.Object({
          startDate: Type.String({ format: 'date-time' }),
          endDate: Type.Optional(Type.String({ format: 'date-time' })),
          duration: Type.Optional(Type.String()),
          flexible: Type.Optional(Type.Boolean()),
        }),
        compensation: Type.Object({
          type: Type.Union([
            Type.Literal('fixed'),
            Type.Literal('hourly'),
            Type.Literal('daily'),
            Type.Literal('negotiable'),
          ]),
          amount: Type.Optional(Type.Number()),
          currency: Type.Optional(Type.String()),
          description: Type.Optional(Type.String()),
        }),
        visibility: Type.Optional(Type.Union([
          Type.Literal('public'),
          Type.Literal('private'),
          Type.Literal('unlisted'),
        ])),
        featured: Type.Optional(Type.Boolean()),
        boost: Type.Optional(Type.Object({
          boosted: Type.Boolean(),
          boostUntil: Type.Optional(Type.String({ format: 'date-time' })),
          boostBudget: Type.Optional(Type.Number()),
        })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            job: Type.Object({
              uuid: uuidSchema,
              title: Type.String(),
              status: Type.String(),
              createdAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const userId = request.user!.id;
    const tenantId = request.user!.tenantId;
    
    const job = await jobPostingService.createJobPosting({
      ...request.body,
      tenantId,
      postedById: userId,
    });
    
    return reply.code(201).send({
      success: true,
      data: {
        job: {
          uuid: job.uuid,
          title: job.title,
          status: job.status,
          createdAt: job.createdAt.toISOString(),
        },
      },
    });
  });

  // Get job by UUID
  fastify.get('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.jobs.read')
    ],
    schema: {
      tags: ['user.jobs'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      querystring: Type.Object({
        incrementViews: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            job: Type.Any(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const { incrementViews = false } = request.query;
    
    const job = await jobPostingService.getJobByUuid(uuid, incrementViews);
    
    if (!job) {
      return reply.code(404).send({
        success: false,
        error: 'JOB_POSTING_NOT_FOUND',
      });
    }
    
    // Check if user can view draft/closed jobs
    if (job.status !== 'published' && job.postedById !== request.user!.id) {
      const canViewAll = fastify.hasPermission(request.user!, 'jobs:admin');
      if (!canViewAll) {
        return reply.code(403).send({
          success: false,
          error: 'ACCESS_DENIED',
        });
      }
    }
    
    return {
      success: true,
      data: { job },
    };
  });

  // Update job posting
  fastify.patch('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('jobs:update')],
    schema: {
      tags: ['user.jobs'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      body: Type.Any(), // Use partial of create schema
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            job: Type.Object({
              uuid: uuidSchema,
              title: Type.String(),
              updatedAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    
    // Get job ID from UUID
    const existingJob = await jobPostingService.getJobByUuid(uuid);
    if (!existingJob) {
      return reply.code(404).send({
        success: false,
        error: 'JOB_POSTING_NOT_FOUND',
      });
    }
    
    // Check ownership
    if (existingJob.postedById !== request.user!.id) {
      const isAdmin = fastify.hasPermission(request.user!, 'jobs:admin');
      if (!isAdmin) {
        return reply.code(403).send({
          success: false,
          error: 'ACCESS_DENIED',
        });
      }
    }
    
    const job = await jobPostingService.updateJobPosting({
      ...request.body,
    });
    
    return {
      success: true,
      data: {
        job: {
          uuid: job.uuid,
          title: job.title,
          updatedAt: job.updatedAt.toISOString(),
        },
      },
    };
  });

  // Publish job posting
  fastify.post('/:uuid/publish', {
    preHandler: [fastify.authenticate, fastify.requirePermission('jobs:update')],
    schema: {
      tags: ['user.jobs'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            job: Type.Object({
              uuid: uuidSchema,
              status: Type.String(),
              publishedAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    
    // Get job ID from UUID
    const existingJob = await jobPostingService.getJobByUuid(uuid);
    if (!existingJob) {
      return reply.code(404).send({
        success: false,
        error: 'JOB_POSTING_NOT_FOUND',
      });
    }
    
    try {
      const job = await jobPostingService.publishJob(existingJob.uuid as UUID, request.user!.id);
      
      return {
        success: true,
        data: {
          job: {
            uuid: job.uuid,
            status: job.status,
            publishedAt: job.publishedAt!.toISOString(),
          },
        },
      };
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Close job posting
  fastify.post('/:uuid/close', {
    preHandler: [fastify.authenticate, fastify.requirePermission('jobs:update')],
    schema: {
      tags: ['user.jobs'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        filled: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            job: Type.Object({
              uuid: uuidSchema,
              status: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const { filled = false } = request.body;
    
    // Get job ID from UUID
    const existingJob = await jobPostingService.getJobByUuid(uuid);
    if (!existingJob) {
      return reply.code(404).send({
        success: false,
        error: 'JOB_POSTING_NOT_FOUND',
      });
    }
    
    try {
      const job = await jobPostingService.closeJob(existingJob.uuid as UUID, request.user!.id, filled);
      
      return {
        success: true,
        data: {
          job: {
            uuid: job.uuid,
            status: job.status,
          },
        },
      };
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Get job statistics
  fastify.get('/:uuid/stats', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.jobs.read')
    ],
    schema: {
      tags: ['user.jobs'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            stats: Type.Any(),
            totalApplications: Type.Number(),
            applicationsByStatus: Type.Record(Type.String(), Type.Number()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    
    // Get job ID from UUID
    const job = await jobPostingService.getJobByUuid(uuid);
    if (!job) {
      return reply.code(404).send({
        success: false,
        error: 'JOB_POSTING_NOT_FOUND',
      });
    }
    
    // Check ownership
    if (job.postedById !== request.user!.id) {
      const isAdmin = fastify.hasPermission(request.user!, 'jobs:admin');
      if (!isAdmin) {
        return reply.code(403).send({
          success: false,
          error: 'ACCESS_DENIED',
        });
      }
    }
    
    const stats = await jobPostingService.getJobStats(job.id);
    
    return {
      success: true,
      data: stats,
    };
  });

  // Apply to job
  fastify.post('/:uuid/apply', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.jobs.read')
    ],
    schema: {
      tags: ['user.jobs'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        profileId: Type.String({ format: 'uuid' }),
        coverLetter: Type.Optional(Type.String()),
        answers: Type.Optional(Type.Record(Type.String(), Type.Any())),
        portfolio: Type.Optional(Type.Array(Type.Object({
          url: Type.String({ format: 'uri' }),
          title: Type.String(),
          type: Type.String(),
        }))),
        availability: Type.Optional(Type.Object({
          startDate: Type.String({ format: 'date-time' }),
          flexible: Type.Boolean(),
          notes: Type.Optional(Type.String()),
        })),
        proposedRate: Type.Optional(Type.Object({
          amount: Type.Number(),
          currency: Type.String(),
          type: Type.Union([
            Type.Literal('fixed'),
            Type.Literal('hourly'),
            Type.Literal('daily'),
          ]),
        })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            application: Type.Object({
              uuid: uuidSchema,
              status: Type.String(),
              createdAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const userId = request.user!.id;
    
    // Get job ID from UUID
    const job = await jobPostingService.getJobByUuid(uuid);
    if (!job) {
      return reply.code(404).send({
        success: false,
        error: 'JOB_POSTING_NOT_FOUND',
      });
    }
    
    try {
      const application = await jobPostingService.createApplication({
        ...request.body,
        jobId: job.uuid as UUID,
        applicantId: userId,
      });
      
      return reply.code(201).send({
        success: true,
        data: {
          application: {
            uuid: application.uuid,
            status: application.status,
            createdAt: application.createdAt.toISOString(),
          },
        },
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Get job applications (for job poster)
  fastify.get('/:uuid/applications', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.jobs.read')
    ],
    schema: {
      tags: ['user.jobs'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      querystring: Type.Object({
        status: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            applications: Type.Array(Type.Any()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const { status } = request.query;
    
    // Get job ID from UUID
    const job = await jobPostingService.getJobByUuid(uuid);
    if (!job) {
      return reply.code(404).send({
        success: false,
        error: 'JOB_POSTING_NOT_FOUND',
      });
    }
    
    try {
      const applications = await jobPostingService.getJobApplications(
        job.uuid as UUID,
        request.user!.id,
        status
      );
      
      return {
        success: true,
        data: { applications },
      };
    } catch (error: any) {
      return reply.code(403).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Update application status
  fastify.patch('/applications/:applicationUuid/status', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.jobs.read')
    ],
    schema: {
      tags: ['user.jobs'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        applicationUuid: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        status: Type.Union([
          Type.Literal('pending'),
          Type.Literal('reviewing'),
          Type.Literal('shortlisted'),
          Type.Literal('rejected'),
          Type.Literal('accepted'),
        ]),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            application: Type.Any(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { applicationUuid } = request.params;
    const { status } = request.body;
    
    // Get application by UUID
    const application = await fastify.prisma.jobApplication.findUnique({
      where: { tenantId: request.user.tenantId, uuid: applicationUuid },
    });
    
    if (!application) {
      return reply.code(404).send({
        success: false,
        error: 'APPLICATION_NOT_FOUND',
      });
    }
    
    try {
      const updatedApplication = await jobPostingService.updateApplicationStatus(
        application.uuid as UUID,
        request.user!.id,
        status
      );
      
      return {
        success: true,
        data: { application: updatedApplication },
      };
    } catch (error: any) {
      return reply.code(403).send({
        success: false,
        error: error.message,
      });
    }
  });
};