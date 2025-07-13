import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { userSavedSearchesRoutes } from './saved';

/**
 * User Search Routes
 * General search and saved searches
 */
export const userSearchRoutes: FastifyPluginAsync = async (fastify) => {
  // Register saved searches routes
  await fastify.register(userSavedSearchesRoutes, { prefix: '/saved' });

  // Global search endpoint
  fastify.post('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.search.read')
    ],
    schema: {
      tags: ['user.search'],
      summary: 'Global search',
      description: 'Search across multiple entity types',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        query: Type.String({ minLength: 1 }),
        types: Type.Optional(Type.Array(Type.String())),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 10 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            results: Type.Array(Type.Object({
              type: Type.String(),
              items: Type.Array(Type.Object({
                id: Type.String(),
                title: Type.String(),
                description: Type.Optional(Type.String()),
                url: Type.String(),
                metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
              })),
              totalCount: Type.Number(),
            })),
            totalResults: Type.Number(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { query, types, limit = 10 } = request.body;

      try {
        const searchTypes = types || ['users', 'jobs', 'gigs', 'categories', 'tags'];
        const results = [];
        let totalResults = 0;

        // Search users
        if (searchTypes.includes('users')) {
          const users = await fastify.prisma.user.findMany({
            where: {
              AND: [
                { tenantId: request.user!.tenantId },
                {
                  OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                  ],
                },
              ],
            },
            take: limit,
            select: {
              uuid: true,
              name: true,
              email: true,
              profilePhotoUrl: true,
            },
          });

          if (users.length > 0) {
            results.push({
              type: 'users',
              items: users.map(user => ({
                id: user.uuid,
                title: user.name,
                description: user.email,
                url: `/users/${user.uuid}`,
                metadata: {
                  profilePhoto: user.profilePhotoUrl,
                },
              })),
              totalCount: users.length,
            });
            totalResults += users.length;
          }
        }

        // Search jobs
        if (searchTypes.includes('jobs')) {
          const jobs = await fastify.prisma.job.findMany({
            where: {
              tenantId: request.user!.tenantId,
              status: 'active',
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: limit,
            select: {
              uuid: true,
              title: true,
              description: true,
              location: true,
              remote: true,
            },
          });

          if (jobs.length > 0) {
            results.push({
              type: 'jobs',
              items: jobs.map(job => ({
                id: job.uuid,
                title: job.title,
                description: job.description?.substring(0, 100) + '...',
                url: `/marketplace/jobs/${job.uuid}`,
                metadata: {
                  location: job.location,
                  remote: job.remote,
                },
              })),
              totalCount: jobs.length,
            });
            totalResults += jobs.length;
          }
        }

        // Search gigs
        if (searchTypes.includes('gigs')) {
          const gigs = await fastify.prisma.gig.findMany({
            where: {
              tenantId: request.user!.tenantId,
              status: 'active',
              isPublished: true,
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: limit,
            include: {
              packages: {
                take: 1,
                orderBy: { displayOrder: 'asc' },
              },
            },
          });

          if (gigs.length > 0) {
            results.push({
              type: 'gigs',
              items: gigs.map(gig => ({
                id: gig.uuid,
                title: gig.title,
                description: gig.description?.substring(0, 100) + '...',
                url: `/marketplace/gigs/${gig.uuid}`,
                metadata: {
                  startingPrice: gig.packages[0]?.price,
                  currency: gig.packages[0]?.currency,
                },
              })),
              totalCount: gigs.length,
            });
            totalResults += gigs.length;
          }
        }

        // Search categories
        if (searchTypes.includes('categories')) {
          const categories = await fastify.prisma.category.findMany({
            where: {
              tenantId: request.user!.tenantId,
              isActive: true,
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
            take: limit,
          });

          if (categories.length > 0) {
            results.push({
              type: 'categories',
              items: categories.map(cat => ({
                id: cat.uuid,
                title: cat.name,
                description: cat.description,
                url: `/categories/${cat.uuid}`,
                metadata: {
                  type: cat.type,
                },
              })),
              totalCount: categories.length,
            });
            totalResults += categories.length;
          }
        }

        // Search tags
        if (searchTypes.includes('tags')) {
          const tags = await fastify.prisma.tag.findMany({
            where: {
              tenantId: request.user!.tenantId,
              name: { contains: query, mode: 'insensitive' },
            },
            take: limit,
          });

          if (tags.length > 0) {
            results.push({
              type: 'tags',
              items: tags.map(tag => ({
                id: tag.uuid,
                title: tag.name,
                description: tag.description,
                url: `/tags/${tag.uuid}`,
                metadata: {
                  color: tag.color,
                },
              })),
              totalCount: tags.length,
            });
            totalResults += tags.length;
          }
        }

        return {
          success: true,
          data: {
            results,
            totalResults,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to perform search');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_PERFORM_SEARCH',
        });
      }
    },
  });

  // Search suggestions
  fastify.get('/suggestions', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.search.read')
    ],
    schema: {
      tags: ['user.search'],
      summary: 'Search suggestions',
      description: 'Get search suggestions based on partial query',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        q: Type.String({ minLength: 2 }),
        type: Type.Optional(Type.String()),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 10, default: 5 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            suggestions: Type.Array(Type.Object({
              text: Type.String(),
              type: Type.String(),
              count: Type.Optional(Type.Number()),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { q, type, limit = 5 } = request.query;

      try {
        const suggestions = [];

        // Get suggestions based on type or all types
        if (!type || type === 'jobs') {
          const jobs = await fastify.prisma.job.findMany({
            where: {
              tenantId: request.user!.tenantId,
              status: 'active',
              title: { contains: q, mode: 'insensitive' },
            },
            take: limit,
            select: { title: true },
            distinct: ['title'],
          });

          suggestions.push(...jobs.map(j => ({
            text: j.title,
            type: 'job',
          })));
        }

        if (!type || type === 'gigs') {
          const gigs = await fastify.prisma.gig.findMany({
            where: {
              tenantId: request.user!.tenantId,
              status: 'active',
              title: { contains: q, mode: 'insensitive' },
            },
            take: limit,
            select: { title: true },
            distinct: ['title'],
          });

          suggestions.push(...gigs.map(g => ({
            text: g.title,
            type: 'gig',
          })));
        }

        if (!type || type === 'tags') {
          const tags = await fastify.prisma.tag.findMany({
            where: {
              tenantId: request.user!.tenantId,
              name: { contains: q, mode: 'insensitive' },
            },
            take: limit,
            select: {
              name: true,
              _count: {
                select: { taggedItems: true },
              },
            },
          });

          suggestions.push(...tags.map(t => ({
            text: t.name,
            type: 'tag',
            count: t._count.taggedItems,
          })));
        }

        // Sort by relevance (exact matches first)
        suggestions.sort((a, b) => {
          const aExact = a.text.toLowerCase() === q.toLowerCase();
          const bExact = b.text.toLowerCase() === q.toLowerCase();
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          return 0;
        });

        return {
          success: true,
          data: {
            suggestions: suggestions.slice(0, limit),
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get search suggestions');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_SEARCH_SUGGESTIONS',
        });
      }
    },
  });
};