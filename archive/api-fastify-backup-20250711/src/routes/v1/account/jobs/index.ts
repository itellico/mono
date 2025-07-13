import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { sendSuccess, sendError, ErrorResponses } from '@/utils/response-helpers';
import { jobPostingService } from '@/services/job-posting.service';
import { jobApplicationService } from '@/services/job-application.service';

/**
 * Account Job Routes
 * Agency-level job posting management
 * Agencies can manage job postings on behalf of their clients
 */
export const accountJobRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Get all job postings for the account
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account:jobs:read')],
    schema: {
      tags: ['account.jobs'],
      summary: 'List account job postings',
      description: 'Get all job postings created by this account',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 20 })),
        status: Type.Optional(Type.String()),
        clientId: Type.Optional(Type.Number()),
        category: Type.Optional(Type.String()),
        search: Type.Optional(Type.String()),
        sortBy: Type.Optional(Type.Union([
          Type.Literal('newest'),
          Type.Literal('oldest'),
          Type.Literal('deadline_soon'),
          Type.Literal('most_applications')
        ])),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            jobs: Type.Array(Type.Object({
              uuid: uuidSchema,
              title: Type.String(),
              category: Type.String(),
              status: Type.String(),
              postedBy: Type.Object({
                firstName: Type.Optional(Type.String()),
                lastName: Type.Optional(Type.String()),
                companyName: Type.Optional(Type.String()),
              }),
              applicationDeadline: Type.Optional(Type.String()),
              stats: Type.Object({
                views: Type.Number(),
                applications: Type.Number(),
                shortlisted: Type.Number(),
                hired: Type.Number(),
              }),
              featured: Type.Boolean(),
              publishedAt: Type.Optional(Type.String()),
              createdAt: Type.String(),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              pages: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const { page = 1, limit = 20, sortBy = 'newest', ...filters } = request.query;

        // Get account context (agency managing multiple clients)
        const accountId = request.user!.accountId;
        if (!accountId) {
          return ErrorResponses.forbidden(reply, 'Account context required');
        }

        // Search jobs posted by this account
        const result = await jobPostingService.searchJobPostings(
          {
            tenantId: request.user!.tenantId,
            accountId,
            ...filters,
          },
          page,
          limit,
          sortBy
        );

        // Get application stats for each job
        const jobsWithStats = await Promise.all(
          result.jobs.map(async (job) => {
            const stats = await jobApplicationService.getJobApplicationStats(
              job.uuid as UUID,
              request.user!.tenantId
            );

            return {
              uuid: job.uuid,
              title: job.title,
              category: job.category,
              status: job.status,
              postedBy: {
                id: job.postedById,
                firstName: job.postedByUser?.firstName,
                lastName: job.postedByUser?.lastName,
                companyName: job.companyName,
              },
              applicationDeadline: job.applicationDeadline?.toISOString(),
              stats: {
                views: (job.stats as any)?.views || 0,
                applications: stats.total,
                shortlisted: stats.byStatus.shortlisted || 0,
                hired: stats.byStatus.accepted || 0,
              },
              featured: job.featured,
              publishedAt: job.publishedAt?.toISOString(),
              createdAt: job.createdAt.toISOString(),
            };
          })
        );

        return sendSuccess(reply, {
          jobs: jobsWithStats,
          pagination: result.pagination,
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to get account job postings');
        return ErrorResponses.internalError(reply, 'Failed to get job postings');
      }
    },
  });

  // Create job posting on behalf of a client
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account:jobs:create')],
    schema: {
      tags: ['account.jobs'],
      summary: 'Create job posting for client',
      description: 'Create a new job posting on behalf of a client',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        clientId: Type.Number({ description: 'ID of the client this job is for' }),
        profileId: Type.String({ format: 'uuid' }),
        profileType: Type.String(),
        companyName: Type.String(),
        title: Type.String({ minLength: 5, maxLength: 200 }),
        category: Type.String(),
        type: Type.String(),
        description: Type.String({ minLength: 50 }),
        requirements: Type.Array(Type.String()),
        targetProfiles: Type.Object({}, { additionalProperties: true }),
        applicationDeadline: Type.Optional(Type.String({ format: 'date-time' })),
        maxApplications: Type.Optional(Type.Number({ minimum: 1 })),
        autoCloseOnMax: Type.Optional(Type.Boolean()),
        applicationQuestions: Type.Optional(Type.Array(Type.Object({}, { additionalProperties: true }))),
        jobDates: Type.Object({}, { additionalProperties: true }),
        compensation: Type.Object({}, { additionalProperties: true }),
        visibility: Type.Optional(Type.String()),
        featured: Type.Optional(Type.Boolean()),
        autoPublish: Type.Optional(Type.Boolean({ default: false })),
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
    async handler(request, reply) {
      try {
        // Verify agency has permission to post for this client
        const accountId = request.user!.accountId;
        if (!accountId) {
          return ErrorResponses.forbidden(reply, 'Account context required');
        }

        // TODO: Verify client relationship
        // This would check if the agency has permission to post on behalf of clientId

        const jobData = {
          ...request.body,
          tenantId: request.user!.tenantId,
          postedById: request.body.clientId, // Posted by the client, not the agency user
          accountId, // Track which account created it
          applicationDeadline: request.body.applicationDeadline 
            ? new Date(request.body.applicationDeadline) 
            : undefined,
          jobDates: {
            ...request.body.jobDates,
            dates: request.body.jobDates.dates?.map((d: string) => new Date(d)),
          },
          metadata: {
            createdByAgency: true,
            agencyUserId: request.user!.id,
            agencyAccountId: accountId,
          },
        };

        const job = await jobPostingService.createJobPosting(jobData);

        // Auto-publish if requested
        if (request.body.autoPublish) {
          await jobPostingService.publishJobPosting(
            job.uuid as UUID,
            request.user!.tenantId,
            request.user!.id
          );
        }

        return sendSuccess(reply, {
          job: {
            uuid: job.uuid,
            title: job.title,
            status: job.status,
            createdAt: job.createdAt.toISOString(),
          },
        }, 201);
      } catch (error) {
        request.log.error({ error }, 'Failed to create job posting for client');
        return ErrorResponses.internalError(reply, 'Failed to create job posting');
      }
    },
  });

  // Get applications for a specific job
  fastify.get('/:id/applications', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account:jobs:read')],
    schema: {
      tags: ['account.jobs'],
      summary: 'Get job applications',
      description: 'Get all applications for a specific job posting',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 20 })),
        status: Type.Optional(Type.String()),
        sortBy: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            applications: Type.Array(Type.Object({
              applicant: Type.Object({
                firstName: Type.String(),
                lastName: Type.String(),
                email: Type.String(),
                profilePhotoUrl: Type.Optional(Type.String()),
              }),
              profileId: Type.String(),
              status: Type.String(),
              coverLetter: Type.Optional(Type.String()),
              portfolio: Type.Optional(Type.Object({}, { additionalProperties: true })),
              availability: Type.Optional(Type.Object({}, { additionalProperties: true })),
              proposedRate: Type.Optional(Type.Object({}, { additionalProperties: true })),
              appliedAt: Type.String(),
              viewedAt: Type.Optional(Type.String()),
              shortlistedAt: Type.Optional(Type.String()),
              statusHistory: Type.Array(Type.Object({}, { additionalProperties: true })),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              pages: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        // Verify job belongs to account
        const job = await jobPostingService.getJobPosting(
          request.params.uuid as UUID,
          request.user!.tenantId
        );

        if (!job) {
          return ErrorResponses.notFound(reply, 'Job posting not found');
        }

        // Check if job was posted by this account
        const accountId = request.user!.accountId;
        if (!accountId || (job.metadata as any)?.agencyAccountId !== accountId) {
          return ErrorResponses.forbidden(reply, 'Access denied');
        }

        const { page = 1, limit = 20, status, sortBy } = request.query;

        const result = await jobApplicationService.getJobApplications(
          request.params.uuid as UUID,
          request.user!.tenantId,
          { status, sortBy },
          page,
          limit
        );

        return sendSuccess(reply, result);
      } catch (error) {
        request.log.error({ error }, 'Failed to get job applications');
        return ErrorResponses.internalError(reply, 'Failed to get applications');
      }
    },
  });

  // Update application status (shortlist, reject, etc.)
  fastify.patch('/applications/:id/status', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account:jobs:manage')],
    schema: {
      tags: ['account.jobs'],
      summary: 'Update application status',
      description: 'Update the status of a job application',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      body: Type.Object({
        status: Type.Union([
          Type.Literal('viewed'),
          Type.Literal('shortlisted'),
          Type.Literal('interview_scheduled'),
          Type.Literal('accepted'),
          Type.Literal('rejected')
        ]),
        reason: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            application: Type.Object({
              status: Type.String(),
              updatedAt: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        // Verify application belongs to account's job
        const application = await jobApplicationService.getApplication(
          request.params.uuid as UUID,
          request.user!.tenantId
        );

        if (!application) {
          return ErrorResponses.notFound(reply, 'Application not found');
        }

        // Verify job was posted by this account
        const accountId = request.user!.accountId;
        if (!accountId || (application.job.metadata as any)?.agencyAccountId !== accountId) {
          return ErrorResponses.forbidden(reply, 'Access denied');
        }

        const updated = await jobApplicationService.updateApplicationStatus(
          request.params.uuid as UUID,
          request.body.status,
          request.user!.id,
          request.body.reason
        );

        return sendSuccess(reply, {
          application: {
            status: updated.status,
            updatedAt: updated.updatedAt.toISOString(),
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to update application status');
        return ErrorResponses.internalError(reply, 'Failed to update application');
      }
    },
  });

  // Bulk update application statuses
  fastify.post('/applications/bulk-update', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account:jobs:manage')],
    schema: {
      tags: ['account.jobs'],
      summary: 'Bulk update applications',
      description: 'Update multiple application statuses at once',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        applicationIds: Type.Array(Type.Number()),
        status: Type.String(),
        reason: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            results: Type.Array(Type.Object({
              success: Type.Boolean(),
              status: Type.Optional(Type.String()),
              error: Type.Optional(Type.String()),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        // TODO: Verify all applications belong to account's jobs
        const results = await jobApplicationService.bulkUpdateStatus(
          request.body.applicationIds,
          request.body.status as any,
          request.user!.id,
          request.body.reason
        );

        return sendSuccess(reply, { results });
      } catch (error) {
        request.log.error({ error }, 'Failed to bulk update applications');
        return ErrorResponses.internalError(reply, 'Failed to bulk update');
      }
    },
  });

  // Get job performance analytics
  fastify.get('/:id/analytics', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account:jobs:analytics')],
    schema: {
      tags: ['account.jobs'],
      summary: 'Get job analytics',
      description: 'Get detailed analytics for a job posting',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            overview: Type.Object({
              views: Type.Number(),
              applications: Type.Number(),
              conversionRate: Type.Number(),
              averageTimeToApply: Type.Number(),
            }),
            applicationFunnel: Type.Object({
              submitted: Type.Number(),
              viewed: Type.Number(),
              shortlisted: Type.Number(),
              interviewed: Type.Number(),
              accepted: Type.Number(),
            }),
            demographics: Type.Object({
              byCategory: Type.Object({}, { additionalProperties: true }),
              byLocation: Type.Object({}, { additionalProperties: true }),
              byExperience: Type.Object({}, { additionalProperties: true }),
            }),
            timeline: Type.Array(Type.Object({
              date: Type.String(),
              views: Type.Number(),
              applications: Type.Number(),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        // Verify job belongs to account
        const job = await jobPostingService.getJobPosting(
          request.params.uuid as UUID,
          request.user!.tenantId
        );

        if (!job) {
          return ErrorResponses.notFound(reply, 'Job posting not found');
        }

        const accountId = request.user!.accountId;
        if (!accountId || (job.metadata as any)?.agencyAccountId !== accountId) {
          return ErrorResponses.forbidden(reply, 'Access denied');
        }

        // Get comprehensive analytics
        const [stats, applications] = await Promise.all([
          jobApplicationService.getJobApplicationStats(request.params.uuid as UUID, request.user!.tenantId),
          jobApplicationService.getJobApplications(
            request.params.uuid as UUID,
            request.user!.tenantId,
            {},
            1,
            1000 // Get all for analytics
          ),
        ]);

        // Calculate analytics
        const views = (job.stats as any)?.views || 0;
        const conversionRate = views > 0 ? (stats.total / views) * 100 : 0;

        // TODO: Calculate more detailed analytics
        const analytics = {
          overview: {
            views,
            applications: stats.total,
            conversionRate,
            averageTimeToApply: 0, // TODO: Calculate from application data
          },
          applicationFunnel: {
            submitted: stats.total,
            viewed: stats.byStatus.viewed || 0,
            shortlisted: stats.byStatus.shortlisted || 0,
            interviewed: stats.byStatus.interview_scheduled || 0,
            accepted: stats.byStatus.accepted || 0,
          },
          demographics: {
            byCategory: {}, // TODO: Aggregate from applicant profiles
            byLocation: {},
            byExperience: {},
          },
          timeline: [], // TODO: Generate timeline data
        };

        return sendSuccess(reply, analytics);
      } catch (error) {
        request.log.error({ error }, 'Failed to get job analytics');
        return ErrorResponses.internalError(reply, 'Failed to get analytics');
      }
    },
  });
};