import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { sendSuccess, sendError, ErrorResponses } from '@/utils/response-helpers';
import { jobPostingService } from '@/services/job-posting.service';
import { jobApplicationService } from '@/services/job-application.service';

/**
 * Tenant Job Routes
 * Marketplace administrator job management
 * Full access to all jobs within the tenant
 */
export const tenantJobRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Get all job postings in the tenant
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant:jobs:read')],
    schema: {
      tags: ['tenant.jobs'],
      summary: 'List all tenant jobs',
      description: 'Get all job postings in the tenant (admin view)',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 50 })),
        status: Type.Optional(Type.String()),
        featured: Type.Optional(Type.Boolean()),
        accountId: Type.Optional(Type.Number()),
        postedById: Type.Optional(Type.Number()),
        category: Type.Optional(Type.String()),
        search: Type.Optional(Type.String()),
        dateFrom: Type.Optional(Type.String({ format: 'date' })),
        dateTo: Type.Optional(Type.String({ format: 'date' })),
        sortBy: Type.Optional(Type.String()),
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
              status: Type.String(),
              featured: Type.Boolean(),
              verified: Type.Boolean(),
              postedBy: Type.Object({
                firstName: Type.Optional(Type.String()),
                lastName: Type.Optional(Type.String()),
                email: Type.String(),
                companyName: Type.Optional(Type.String()),
                accountId: Type.Optional(Type.Number()),
              }),
              stats: Type.Object({
                views: Type.Number(),
                applications: Type.Number(),
                saved: Type.Number(),
                shares: Type.Number(),
              }),
              applicationDeadline: Type.Optional(Type.String()),
              publishedAt: Type.Optional(Type.String()),
              createdAt: Type.String(),
              updatedAt: Type.String(),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              pages: Type.Number(),
            }),
            summary: Type.Object({
              total: Type.Number(),
              byStatus: Type.Object({}, { additionalProperties: true }),
              featured: Type.Number(),
              verified: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const { page = 1, limit = 50, sortBy = 'newest', dateFrom, dateTo, ...filters } = request.query;

        // Build date filters
        const dateFilters: any = {};
        if (dateFrom) dateFilters.createdAt = { gte: new Date(dateFrom) };
        if (dateTo) {
          if (!dateFilters.createdAt) dateFilters.createdAt = {};
          dateFilters.createdAt.lte = new Date(dateTo);
        }

        // Get all jobs in tenant
        const result = await jobPostingService.searchJobPostings(
          {
            tenantId: request.user!.tenantId,
            ...filters,
            ...dateFilters,
          },
          page,
          limit,
          sortBy
        );

        // Get detailed stats for each job
        const jobsWithDetails = await Promise.all(
          result.jobs.map(async (job) => {
            const appStats = await jobApplicationService.getJobApplicationStats(
              job.uuid as UUID,
              request.user!.tenantId
            );

            return {
              uuid: job.uuid,
              title: job.title,
              category: job.category,
              type: job.type,
              status: job.status,
              featured: job.featured,
              verified: job.verified,
              postedBy: {
                id: job.postedById,
                firstName: job.postedByUser?.firstName,
                lastName: job.postedByUser?.lastName,
                email: job.postedByUser?.email || '',
                companyName: job.companyName,
                accountId: job.accountId,
              },
              stats: {
                views: (job.stats as any)?.views || 0,
                applications: appStats.total,
                saved: (job.stats as any)?.saved || 0,
                shares: (job.stats as any)?.shares || 0,
              },
              applicationDeadline: job.applicationDeadline?.toISOString(),
              publishedAt: job.publishedAt?.toISOString(),
              createdAt: job.createdAt.toISOString(),
              updatedAt: job.updatedAt.toISOString(),
            };
          })
        );

        // Calculate summary statistics
        const summary = {
          total: result.pagination.total,
          byStatus: jobsWithDetails.reduce((acc, job) => {
            acc[job.status] = (acc[job.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          featured: jobsWithDetails.filter(j => j.featured).length,
          verified: jobsWithDetails.filter(j => j.verified).length,
        };

        return sendSuccess(reply, {
          jobs: jobsWithDetails,
          pagination: result.pagination,
          summary,
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to get tenant jobs');
        return ErrorResponses.internalError(reply, 'Failed to get jobs');
      }
    },
  });

  // Get job details with full admin info
  fastify.get('/:id', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant:jobs:read')],
    schema: {
      tags: ['tenant.jobs'],
      summary: 'Get job details (admin)',
      description: 'Get complete job details including admin-only fields',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            job: Type.Object({}, { additionalProperties: true }), // Full job object
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const job = await jobPostingService.getJobPosting(
          request.params.uuid as UUID,
          request.user!.tenantId
        );

        if (!job) {
          return ErrorResponses.notFound(reply, 'Job not found');
        }

        // Get application statistics
        const appStats = await jobApplicationService.getJobApplicationStats(
          job.uuid as UUID,
          request.user!.tenantId
        );

        // Include all fields for admin view
        const adminJob = {
          ...job,
          applicationStats: appStats,
          metadata: job.metadata,
          searchVector: undefined, // Remove internal fields
        };

        return sendSuccess(reply, { job: adminJob });
      } catch (error) {
        request.log.error({ error }, 'Failed to get job details');
        return ErrorResponses.internalError(reply, 'Failed to get job');
      }
    },
  });

  // Update job status or settings
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant:jobs:manage')],
    schema: {
      tags: ['tenant.jobs'],
      summary: 'Update job (admin)',
      description: 'Update job settings or status as admin',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      body: Type.Object({
        status: Type.Optional(Type.String()),
        featured: Type.Optional(Type.Boolean()),
        verified: Type.Optional(Type.Boolean()),
        visibility: Type.Optional(Type.String()),
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            job: Type.Object({
              status: Type.String(),
              featured: Type.Boolean(),
              verified: Type.Boolean(),
              updatedAt: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const job = await jobPostingService.updateJobPosting(
          request.params.uuid as UUID,
          request.body,
          request.user!.tenantId
        );

        return sendSuccess(reply, {
          job: {
            status: job.status,
            featured: job.featured,
            verified: job.verified,
            updatedAt: job.updatedAt.toISOString(),
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to update job');
        return ErrorResponses.internalError(reply, 'Failed to update job');
      }
    },
  });

  // Delete job posting
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant:jobs:delete')],
    schema: {
      tags: ['tenant.jobs'],
      summary: 'Delete job (admin)',
      description: 'Permanently delete a job posting',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
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
      try {
        await jobPostingService.deleteJobPosting(
          request.params.uuid as UUID,
          request.user!.tenantId
        );

        return sendSuccess(reply, {
          message: 'Job posting deleted successfully',
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to delete job');
        return ErrorResponses.internalError(reply, 'Failed to delete job');
      }
    },
  });

  // Bulk operations on jobs
  fastify.post('/bulk', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant:jobs:manage')],
    schema: {
      tags: ['tenant.jobs'],
      summary: 'Bulk job operations',
      description: 'Perform bulk operations on multiple jobs',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        jobIds: Type.Array(Type.Number()),
        operation: Type.Union([
          Type.Literal('feature'),
          Type.Literal('unfeature'),
          Type.Literal('verify'),
          Type.Literal('unverify'),
          Type.Literal('publish'),
          Type.Literal('unpublish'),
          Type.Literal('delete'),
        ]),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            processed: Type.Number(),
            failed: Type.Number(),
            results: Type.Array(Type.Object({
              success: Type.Boolean(),
              error: Type.Optional(Type.String()),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const { jobIds, operation } = request.body;
        const results = [];
        let processed = 0;
        let failed = 0;

        for (const jobId of jobIds) {
          try {
            switch (operation) {
              case 'feature':
                await jobPostingService.updateJobPosting(
                  jobId,
                  { featured: true },
                  request.user!.tenantId
                );
                break;
              case 'unfeature':
                await jobPostingService.updateJobPosting(
                  jobId,
                  { featured: false },
                  request.user!.tenantId
                );
                break;
              case 'verify':
                await jobPostingService.updateJobPosting(
                  jobId,
                  { verified: true },
                  request.user!.tenantId
                );
                break;
              case 'unverify':
                await jobPostingService.updateJobPosting(
                  jobId,
                  { verified: false },
                  request.user!.tenantId
                );
                break;
              case 'publish':
                await jobPostingService.publishJobPosting(
                  jobId,
                  request.user!.tenantId,
                  request.user!.id
                );
                break;
              case 'unpublish':
                await jobPostingService.updateJobPosting(
                  jobId,
                  { status: 'draft' },
                  request.user!.tenantId
                );
                break;
              case 'delete':
                await jobPostingService.deleteJobPosting(
                  jobId,
                  request.user!.tenantId
                );
                break;
            }
            results.push({ id: jobId, success: true });
            processed++;
          } catch (error) {
            results.push({ 
              id: jobId, 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            failed++;
          }
        }

        return sendSuccess(reply, { processed, failed, results });
      } catch (error) {
        request.log.error({ error }, 'Failed to perform bulk operation');
        return ErrorResponses.internalError(reply, 'Failed to perform bulk operation');
      }
    },
  });

  // Get tenant-wide job analytics
  fastify.get('/analytics/overview', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant:jobs:analytics')],
    schema: {
      tags: ['tenant.jobs'],
      summary: 'Get tenant job analytics',
      description: 'Get aggregate analytics for all jobs in the tenant',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        dateFrom: Type.Optional(Type.String({ format: 'date' })),
        dateTo: Type.Optional(Type.String({ format: 'date' })),
        groupBy: Type.Optional(Type.Union([
          Type.Literal('day'),
          Type.Literal('week'),
          Type.Literal('month'),
        ])),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            totals: Type.Object({
              jobs: Type.Number(),
              applications: Type.Number(),
              views: Type.Number(),
              hires: Type.Number(),
            }),
            byCategory: Type.Array(Type.Object({
              category: Type.String(),
              jobs: Type.Number(),
              applications: Type.Number(),
              avgApplicationsPerJob: Type.Number(),
            })),
            byStatus: Type.Object({}, { additionalProperties: true }),
            topPerformers: Type.Array(Type.Object({
              title: Type.String(),
              views: Type.Number(),
              applications: Type.Number(),
              conversionRate: Type.Number(),
            })),
            timeline: Type.Array(Type.Object({
              period: Type.String(),
              jobs: Type.Number(),
              applications: Type.Number(),
              views: Type.Number(),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        // TODO: Implement comprehensive analytics
        // This would aggregate data across all jobs in the tenant
        
        const analytics = {
          totals: {
            jobs: 0,
            applications: 0,
            views: 0,
            hires: 0,
          },
          byCategory: [],
          byStatus: {},
          topPerformers: [],
          timeline: [],
        };

        return sendSuccess(reply, analytics);
      } catch (error) {
        request.log.error({ error }, 'Failed to get tenant analytics');
        return ErrorResponses.internalError(reply, 'Failed to get analytics');
      }
    },
  });

  // Export job data
  fastify.get('/export', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant:jobs:export')],
    schema: {
      tags: ['tenant.jobs'],
      summary: 'Export job data',
      description: 'Export job postings data in various formats',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        format: Type.Union([Type.Literal('csv'), Type.Literal('json'), Type.Literal('xlsx')]),
        status: Type.Optional(Type.String()),
        dateFrom: Type.Optional(Type.String({ format: 'date' })),
        dateTo: Type.Optional(Type.String({ format: 'date' })),
        includeApplications: Type.Optional(Type.Boolean()),
      }),
    },
    async handler(request, reply) {
      try {
        // TODO: Implement data export functionality
        return ErrorResponses.notImplemented(reply, 'Export functionality coming soon');
      } catch (error) {
        request.log.error({ error }, 'Failed to export jobs');
        return ErrorResponses.internalError(reply, 'Failed to export data');
      }
    },
  });
};