import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { sendSuccess, ErrorResponses } from '@/utils/response-helpers';
import { jobPostingServiceV2 } from '@/services/job-posting-v2.service';

/**
 * Public Job Routes
 * Public job board - no authentication required
 */
export const publicJobRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Search and list public job postings
  fastify.get('/', {
    schema: {
      tags: ['public.jobs'],
      summary: 'Search public job postings',
      description: 'Browse and search job postings without authentication',
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 20 })),
        category: Type.Optional(Type.String()),
        type: Type.Optional(Type.String()),
        location: Type.Optional(Type.String()),
        search: Type.Optional(Type.String()),
        compensationType: Type.Optional(Type.String()),
        experienceLevel: Type.Optional(Type.String()),
        sortBy: Type.Optional(Type.Union([
          Type.Literal('newest'),
          Type.Literal('deadline_soon'),
          Type.Literal('most_viewed')
        ])),
        featured: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            jobs: Type.Array(Type.Object({
              uuid: Type.String({ format: 'uuid' }), // Validates PostgreSQL UUID format
              title: Type.String(),
              category: Type.String(),
              type: Type.String(),
              description: Type.String(),
              location: Type.Optional(Type.Object({
                city: Type.String(),
                radius: Type.Number(),
                remote: Type.Boolean(),
              })),
              compensation: Type.Object({
                type: Type.String(),
                amount: Type.Optional(Type.Object({
                  value: Type.Number(),
                  currency: Type.String(),
                  per: Type.String(),
                })),
              }),
              applicationDeadline: Type.Optional(Type.String()),
              postedBy: Type.Object({
                companyName: Type.Optional(Type.String()),
                verified: Type.Boolean(),
              }),
              stats: Type.Object({
                views: Type.Number(),
                applications: Type.Number(),
              }),
              featured: Type.Boolean(),
              publishedAt: Type.String(),
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

        // Get tenant ID from subdomain or default
        // TODO: Implement proper tenant resolution from request
        const tenantId = 1; // Default tenant for now

        const result = await jobPostingServiceV2.searchJobPostings(
          {
            tenantId,
            status: 'published', // Only show published jobs publicly
            category: filters.category,
            type: filters.type,
            location: filters.location,
            search: filters.search,
            compensationType: filters.compensationType,
            experienceLevel: filters.experienceLevel,
            featured: filters.featured,
          },
          page,
          Math.min(limit, 50), // Enforce max limit
          sortBy
        );

        // Response is already UUID-first from V2 service
        const publicJobs = result.jobs.map(job => ({
          uuid: job.uuid,
          title: job.title,
          category: job.category,
          type: job.type,
          description: job.description.substring(0, 500) + '...', // Truncate for list view
          location: job.targetProfiles?.location,
          compensation: job.compensation,
          applicationDeadline: job.applicationDeadline,
          postedBy: {
            uuid: job.postedBy?.uuid,
            firstName: job.postedBy?.firstName,
            lastName: job.postedBy?.lastName,
            companyName: job.companyName,
            verified: job.verified,
          },
          stats: job.stats,
          featured: job.featured,
          publishedAt: job.publishedAt,
        }));

        return sendSuccess(reply, {
          jobs: publicJobs,
          pagination: result.pagination,
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to search public job postings');
        return ErrorResponses.internalError(reply, 'Failed to search job postings');
      }
    },
  });

  // Get public job details by UUID
  fastify.get('/:uuid', {
    schema: {
      tags: ['public.jobs'],
      summary: 'Get public job details',
      description: 'Get detailed information about a specific job posting',
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            job: Type.Object({
              uuid: Type.String({ format: 'uuid' }), // Validates PostgreSQL UUID format
              title: Type.String(),
              category: Type.String(),
              type: Type.String(),
              description: Type.String(),
              requirements: Type.Array(Type.String()),
              targetProfiles: Type.Object({}, { additionalProperties: true }),
              applicationDeadline: Type.Optional(Type.String()),
              maxApplications: Type.Optional(Type.Number()),
              applicationQuestions: Type.Optional(Type.Array(Type.Object({
                id: Type.String(),
                question: Type.String(),
                type: Type.String(),
                required: Type.Boolean(),
                options: Type.Optional(Type.Array(Type.String())),
              }))),
              jobDates: Type.Object({}, { additionalProperties: true }),
              compensation: Type.Object({}, { additionalProperties: true }),
              postedBy: Type.Object({
                uuid: Type.String({ format: 'uuid' }), // Validates PostgreSQL UUID format
                firstName: Type.Optional(Type.String()),
                lastName: Type.Optional(Type.String()),
                companyName: Type.Optional(Type.String()),
                verified: Type.Boolean(),
                profilePhotoUrl: Type.Optional(Type.String()),
              }),
              stats: Type.Object({
                views: Type.Number(),
                applications: Type.Number(),
                saved: Type.Number(),
              }),
              featured: Type.Boolean(),
              publishedAt: Type.String(),
              createdAt: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        // Get tenant ID from subdomain or default
        const tenantId = 1; // Default tenant for now

        const job = await jobPostingServiceV2.getJobPostingByUuid(request.params.uuid, tenantId);

        if (!job) {
          return ErrorResponses.notFound(reply, 'Job posting not found');
        }

        // Only show published jobs publicly
        if (job.status !== 'published') {
          return ErrorResponses.notFound(reply, 'Job posting not found');
        }

        // Increment view count (fire and forget - V2 service requires integer ID)
        // Note: V2 service returns UUID-first response, so we don't have the ID
        // This is handled internally by the service when getting job details

        // Response is already UUID-first from V2 service
        const publicJob = {
          ...job, // V2 service already returns UUID-first format
        };

        return sendSuccess(reply, { job: publicJob });
      } catch (error) {
        request.log.error({ error }, 'Failed to get public job details');
        return ErrorResponses.internalError(reply, 'Failed to get job details');
      }
    },
  });

  // Get featured job postings
  fastify.get('/featured/list', {
    schema: {
      tags: ['public.jobs'],
      summary: 'Get featured job postings',
      description: 'Get list of featured job postings for homepage display',
      querystring: Type.Object({
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 20, default: 10 })),
        category: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            featuredJobs: Type.Array(Type.Object({
              uuid: Type.String({ format: 'uuid' }), // Validates PostgreSQL UUID format
              title: Type.String(),
              category: Type.String(),
              companyName: Type.Optional(Type.String()),
              compensation: Type.Object({
                type: Type.String(),
                amount: Type.Optional(Type.Object({
                  value: Type.Number(),
                  currency: Type.String(),
                })),
              }),
              applicationDeadline: Type.Optional(Type.String()),
              location: Type.Optional(Type.String()),
              publishedAt: Type.String(),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const { limit = 10, category } = request.query;
        const tenantId = 1; // Default tenant

        const jobs = await jobPostingServiceV2.getFeaturedJobs(tenantId, limit);

        const featuredJobs = jobs.map(job => ({
          ...job, // V2 service already returns optimized featured job format
        }));

        return sendSuccess(reply, { featuredJobs });
      } catch (error) {
        request.log.error({ error }, 'Failed to get featured jobs');
        return ErrorResponses.internalError(reply, 'Failed to get featured jobs');
      }
    },
  });
};