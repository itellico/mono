import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { sendSuccess, ErrorResponses } from '@/utils/response-helpers';
import { gigOfferingServiceV2 } from '@/services/gig-offering-v2.service';

/**
 * Public Gig Routes
 * Browse and view gig offerings without authentication
 */
export const publicGigRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Search and list public gig offerings
  fastify.get('/', {
    schema: {
      tags: ['public.gigs'],
      summary: 'Browse gig offerings',
      description: 'Search and browse gig offerings without authentication',
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 20 })),
        category: Type.Optional(Type.String()),
        subcategory: Type.Optional(Type.String()),
        search: Type.Optional(Type.String()),
        minPrice: Type.Optional(Type.Number({ minimum: 0 })),
        maxPrice: Type.Optional(Type.Number({ minimum: 0 })),
        currency: Type.Optional(Type.String({ minLength: 3, maxLength: 3, default: 'USD' })),
        deliveryTime: Type.Optional(Type.Number({ minimum: 1, maximum: 90 })),
        talentLevel: Type.Optional(Type.Union([
          Type.Literal('beginner'),
          Type.Literal('intermediate'),
          Type.Literal('expert')
        ])),
        minRating: Type.Optional(Type.Number({ minimum: 0, maximum: 5 })),
        sortBy: Type.Optional(Type.Union([
          Type.Literal('newest'),
          Type.Literal('price_low'),
          Type.Literal('price_high'),
          Type.Literal('rating'),
          Type.Literal('popular'),
          Type.Literal('delivery_fast')
        ])),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            gigs: Type.Array(Type.Object({
              uuid: Type.String({ format: 'uuid' }), // Validates PostgreSQL UUID format
              title: Type.String(),
              slug: Type.String(),
              category: Type.String(),
              subcategory: Type.Optional(Type.String()),
              talent: Type.Object({
                firstName: Type.String(),
                lastName: Type.String(),
                profilePhotoUrl: Type.Optional(Type.String()),
                level: Type.String(),
                verified: Type.Boolean(),
              }),
              packages: Type.Array(Type.Object({
                name: Type.String(),
                price: Type.Number(),
                currency: Type.String(),
                deliveryTime: Type.Number(),
              })),
              startingPrice: Type.Number(),
              currency: Type.String(),
              mainImage: Type.Optional(Type.String()),
              stats: Type.Object({
                avgRating: Type.Number(),
                totalReviews: Type.Number(),
                totalOrders: Type.Number(),
                completionRate: Type.Number(),
              }),
              badges: Type.Array(Type.String()),
              featured: Type.Boolean(),
              expressDelivery: Type.Boolean(),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              pages: Type.Number(),
            }),
            filters: Type.Object({
              categories: Type.Array(Type.Object({
                value: Type.String(),
                label: Type.String(),
                count: Type.Number(),
              })),
              priceRange: Type.Object({
                min: Type.Number(),
                max: Type.Number(),
              }),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const { page = 1, limit = 20, sortBy = 'popular', ...filters } = request.query;

        // Get tenant ID from subdomain or default
        // TODO: Implement proper tenant resolution from request
        const tenantId = 1; // Default tenant for now

        const result = await gigOfferingServiceV2.searchGigOfferings({
          filters: {
            tenantId,
            status: 'published', // Only show published gigs publicly
            ...filters,
          },
          page,
          limit,
          sortBy,
        });

        // V2 service already returns UUID-first format
        return sendSuccess(reply, result);
        // Removed - V2 service returns formatted data
      } catch (error) {
        request.log.error({ error }, 'Failed to search gig offerings');
        return ErrorResponses.internalError(reply, 'Failed to search gig offerings');
      }
    },
  });

  // Get public gig details by slug
  fastify.get('/:slug', {
    schema: {
      tags: ['public.gigs'],
      summary: 'Get gig details',
      description: 'Get detailed information about a specific gig offering',
      params: Type.Object({
        slug: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            gig: Type.Object({
              uuid: Type.String({ format: 'uuid' }), // Validates PostgreSQL UUID format
              title: Type.String(),
              slug: Type.String(),
              category: Type.String(),
              subcategory: Type.Optional(Type.String()),
              description: Type.String(),
              highlights: Type.Array(Type.String()),
              talent: Type.Object({
                firstName: Type.String(),
                lastName: Type.String(),
                profilePhotoUrl: Type.Optional(Type.String()),
                bio: Type.Optional(Type.String()),
                level: Type.String(),
                verified: Type.Boolean(),
                memberSince: Type.String(),
                lastDelivery: Type.Optional(Type.String()),
                languages: Type.Array(Type.String()),
                timezone: Type.String(),
                responseTime: Type.String(),
              }),
              packages: Type.Array(Type.Object({
                id: Type.String(),
                name: Type.String(),
                description: Type.String(),
                price: Type.Number(),
                currency: Type.String(),
                deliveryTime: Type.Number(),
                revisions: Type.Number(),
                deliverables: Type.Array(Type.String()),
                features: Type.Array(Type.String()),
              })),
              extras: Type.Array(Type.Object({
                id: Type.String(),
                title: Type.String(),
                description: Type.String(),
                price: Type.Number(),
                currency: Type.String(),
                deliveryTime: Type.Number(),
              })),
              gallery: Type.Object({
                images: Type.Array(Type.Object({
                  url: Type.String(),
                  alt: Type.Optional(Type.String()),
                  order: Type.Number(),
                })),
                videos: Type.Array(Type.Object({
                  url: Type.String(),
                  thumbnail: Type.Optional(Type.String()),
                  title: Type.Optional(Type.String()),
                  order: Type.Number(),
                })),
              }),
              requirements: Type.Object({
                questions: Type.Array(Type.Object({
                  id: Type.String(),
                  question: Type.String(),
                  type: Type.String(),
                  required: Type.Boolean(),
                  options: Type.Optional(Type.Array(Type.String())),
                })),
              }),
              faqs: Type.Array(Type.Object({
                question: Type.String(),
                answer: Type.String(),
              })),
              stats: Type.Object({
                avgRating: Type.Number(),
                totalReviews: Type.Number(),
                totalOrders: Type.Number(),
                completionRate: Type.Number(),
                onTimeDelivery: Type.Number(),
                repeatBuyers: Type.Number(),
              }),
              reviews: Type.Object({
                recent: Type.Array(Type.Object({
                  rating: Type.Number(),
                  comment: Type.String(),
                  buyer: Type.Object({
                    firstName: Type.String(),
                    lastName: Type.String(),
                    profilePhotoUrl: Type.Optional(Type.String()),
                  }),
                  createdAt: Type.String(),
                  helpful: Type.Number(),
                })),
                breakdown: Type.Object({
                  communication: Type.Number(),
                  quality: Type.Number(),
                  delivery: Type.Number(),
                  value: Type.Number(),
                }),
              }),
              tags: Type.Array(Type.String()),
              seo: Type.Object({
                metaTitle: Type.Optional(Type.String()),
                metaDescription: Type.Optional(Type.String()),
                keywords: Type.Array(Type.String()),
              }),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        // Get tenant ID from subdomain or default
        const tenantId = 1; // Default tenant for now

        const gig = await gigOfferingServiceV2.getGigOfferingBySlug(
          request.params.slug,
          tenantId
        );

        if (!gig) {
          return ErrorResponses.notFound(reply, 'Gig offering not found');
        }

        // V2 service handles view count internally and returns UUID-first data

        // V2 service includes reviews in the response

        return sendSuccess(reply, { gig }); // V2 already returns formatted data
        // Removed - V2 service returns formatted data
      } catch (error) {
        request.log.error({ error }, 'Failed to get gig details');
        return ErrorResponses.internalError(reply, 'Failed to get gig details');
      }
    },
  });

  // Get featured gig offerings
  fastify.get('/featured/list', {
    schema: {
      tags: ['public.gigs'],
      summary: 'Get featured gigs',
      description: 'Get list of featured gig offerings for homepage display',
      querystring: Type.Object({
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 20, default: 10 })),
        category: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            featuredGigs: Type.Array(Type.Object({
              uuid: Type.String({ format: 'uuid' }), // Validates PostgreSQL UUID format
              title: Type.String(),
              slug: Type.String(),
              category: Type.String(),
              talentName: Type.String(),
              startingPrice: Type.Number(),
              currency: Type.String(),
              mainImage: Type.Optional(Type.String()),
              avgRating: Type.Number(),
              totalReviews: Type.Number(),
              deliveryTime: Type.Number(),
              badges: Type.Array(Type.String()),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const { limit = 10, category } = request.query;
        const tenantId = 1; // Default tenant

        const result = await gigOfferingServiceV2.searchGigOfferings({
          filters: {
            tenantId,
            status: 'published',
            featured: true,
            category,
          },
          page: 1,
          limit,
          sortBy: 'popular',
        });

        const featuredGigs = result.gigs.map(gig => ({
          uuid: gig.uuid,
          title: gig.title,
          slug: gig.slug,
          category: gig.category,
          talentName: `${gig.talent?.firstName} ${gig.talent?.lastName}`.trim(),
          startingPrice: gig.startingPrice,
          currency: gig.packages[0]?.currency || 'USD',
          mainImage: gig.gallery?.images?.[0]?.url,
          avgRating: gig.stats?.avgRating || 0,
          totalReviews: gig.stats?.totalReviews || 0,
          deliveryTime: Math.min(...gig.packages.map(p => p.deliveryTime)),
          badges: gig.badges || [],
        }));

        return sendSuccess(reply, { featuredGigs });
      } catch (error) {
        request.log.error({ error }, 'Failed to get featured gigs');
        return ErrorResponses.internalError(reply, 'Failed to get featured gigs');
      }
    },
  });

  // Get popular gigs by category
  fastify.get('/popular/:category', {
    schema: {
      tags: ['public.gigs'],
      summary: 'Get popular gigs by category',
      description: 'Get popular gig offerings in a specific category',
      params: Type.Object({
        category: Type.String(),
      }),
      querystring: Type.Object({
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 20, default: 12 })),
        subcategory: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            category: Type.String(),
            subcategory: Type.Optional(Type.String()),
            gigs: Type.Array(Type.Object({
              uuid: Type.String({ format: 'uuid' }), // Validates PostgreSQL UUID format
              title: Type.String(),
              slug: Type.String(),
              talentName: Type.String(),
              startingPrice: Type.Number(),
              currency: Type.String(),
              mainImage: Type.Optional(Type.String()),
              avgRating: Type.Number(),
              totalOrders: Type.Number(),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const { category } = request.params;
        const { limit = 12, subcategory } = request.query;
        const tenantId = 1; // Default tenant

        const result = await gigOfferingServiceV2.searchGigOfferings({
          filters: {
            tenantId,
            status: 'published',
            category,
            subcategory,
          },
          page: 1,
          limit,
          sortBy: 'popular',
        });

        const popularGigs = result.gigs.map(gig => ({
          uuid: gig.uuid,
          title: gig.title,
          slug: gig.slug,
          talentName: `${gig.talent?.firstName} ${gig.talent?.lastName}`.trim(),
          startingPrice: gig.startingPrice,
          currency: gig.packages[0]?.currency || 'USD',
          mainImage: gig.gallery?.images?.[0]?.url,
          avgRating: gig.stats?.avgRating || 0,
          totalOrders: gig.stats?.totalOrders || 0,
        }));

        return sendSuccess(reply, {
          category,
          subcategory,
          gigs: popularGigs,
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to get popular gigs');
        return ErrorResponses.internalError(reply, 'Failed to get popular gigs');
      }
    },
  });
};