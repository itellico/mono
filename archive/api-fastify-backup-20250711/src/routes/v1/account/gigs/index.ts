import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { sendSuccess, sendError, ErrorResponses } from '@/utils/response-helpers';
import { gigOfferingService } from '@/services/gig-offering.service';
import { gigBookingService } from '@/services/gig-booking.service';

/**
 * Account Gig Routes
 * Agency-level gig offering management
 * Agencies can manage gig offerings on behalf of their talents
 */
export const accountGigRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Get all gig offerings for the account
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account:gigs:read')],
    schema: {
      tags: ['account.gigs'],
      summary: 'List account gig offerings',
      description: 'Get all gig offerings managed by this account',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 20 })),
        status: Type.Optional(Type.String()),
        talentId: Type.Optional(Type.Number()),
        category: Type.Optional(Type.String()),
        search: Type.Optional(Type.String()),
        sortBy: Type.Optional(Type.Union([
          Type.Literal('newest'),
          Type.Literal('oldest'),
          Type.Literal('best_performing'),
          Type.Literal('most_orders'),
          Type.Literal('highest_rated')
        ])),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            gigs: Type.Array(Type.Object({
              uuid: uuidSchema,
              title: Type.String(),
              slug: Type.String(),
              category: Type.String(),
              status: Type.String(),
              talent: Type.Object({
                firstName: Type.String(),
                lastName: Type.String(),
                profilePhotoUrl: Type.Optional(Type.String()),
                email: Type.String(),
              }),
              packages: Type.Array(Type.Object({
                name: Type.String(),
                price: Type.Number(),
                currency: Type.String(),
              })),
              stats: Type.Object({
                views: Type.Number(),
                orders: Type.Number(),
                revenue: Type.Number(),
                avgRating: Type.Number(),
                completionRate: Type.Number(),
              }),
              featured: Type.Boolean(),
              verified: Type.Boolean(),
              publishedAt: Type.Optional(Type.String()),
              createdAt: Type.String(),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              pages: Type.Number(),
            }),
            summary: Type.Object({
              totalGigs: Type.Number(),
              totalOrders: Type.Number(),
              totalRevenue: Type.Number(),
              avgRating: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const { page = 1, limit = 20, sortBy = 'newest', ...filters } = request.query;

        // Get account context
        const accountId = request.user!.accountId;
        if (!accountId) {
          return ErrorResponses.forbidden(reply, 'Account context required');
        }

        // Search gigs managed by this account
        const result = await gigOfferingService.searchGigOfferings({
          tenantId: request.user!.tenantId,
          accountId,
          ...filters,
          page,
          limit,
          sortBy,
        });

        // Calculate summary stats
        const summary = await gigOfferingService.getAccountGigStats(
          accountId,
          request.user!.tenantId
        );

        // Enhance gigs with detailed stats
        const gigsWithStats = await Promise.all(
          result.gigs.map(async (gig) => {
            const stats = await gigOfferingService.getGigStats(
              gig.uuid as UUID,
              request.user!.tenantId
            );

            return {
              uuid: gig.uuid,
              title: gig.title,
              slug: gig.slug,
              category: gig.category,
              status: gig.status,
              talent: {
                id: gig.talentId,
                firstName: gig.talent?.firstName || '',
                lastName: gig.talent?.lastName || '',
                profilePhotoUrl: gig.talent?.profilePhotoUrl,
                email: gig.talent?.email || '',
              },
              packages: gig.packages.map(pkg => ({
                name: pkg.name,
                price: pkg.price,
                currency: pkg.currency,
              })),
              stats: {
                views: stats.views || 0,
                orders: stats.totalOrders || 0,
                revenue: stats.totalRevenue || 0,
                avgRating: stats.avgRating || 0,
                completionRate: stats.completionRate || 0,
              },
              featured: gig.featured,
              verified: gig.verified,
              publishedAt: gig.publishedAt?.toISOString(),
              createdAt: gig.createdAt.toISOString(),
            };
          })
        );

        return sendSuccess(reply, {
          gigs: gigsWithStats,
          pagination: result.pagination,
          summary,
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to get account gigs');
        return ErrorResponses.internalError(reply, 'Failed to get gigs');
      }
    },
  });

  // Create gig offering on behalf of a talent
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account:gigs:create')],
    schema: {
      tags: ['account.gigs'],
      summary: 'Create gig for talent',
      description: 'Create a new gig offering on behalf of a talent',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        talentId: Type.Number({ description: 'ID of the talent this gig is for' }),
        profileId: Type.String({ format: 'uuid' }),
        title: Type.String({ minLength: 10, maxLength: 200 }),
        category: Type.String(),
        subcategory: Type.Optional(Type.String()),
        description: Type.String({ minLength: 100, maxLength: 5000 }),
        highlights: Type.Optional(Type.Array(Type.String())),
        packages: Type.Array(Type.Object({}, { additionalProperties: true })),
        extras: Type.Optional(Type.Array(Type.Object({}, { additionalProperties: true }))),
        gallery: Type.Optional(Type.Object({}, { additionalProperties: true })),
        requirements: Type.Optional(Type.Object({}, { additionalProperties: true })),
        faqs: Type.Optional(Type.Array(Type.Object({}, { additionalProperties: true }))),
        tags: Type.Optional(Type.Array(Type.String())),
        availability: Type.Optional(Type.Object({}, { additionalProperties: true })),
        autoPublish: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            gig: Type.Object({
              uuid: uuidSchema,
              title: Type.String(),
              slug: Type.String(),
              status: Type.String(),
              createdAt: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        // Verify agency has permission to manage this talent
        const accountId = request.user!.accountId;
        if (!accountId) {
          return ErrorResponses.forbidden(reply, 'Account context required');
        }

        // TODO: Verify talent relationship
        // This would check if the agency has permission to create gigs for talentId

        const gigData = {
          ...request.body,
          tenantId: request.user!.tenantId,
          accountId, // Track which account created it
          metadata: {
            createdByAgency: true,
            agencyUserId: request.user!.id,
            agencyAccountId: accountId,
          },
        };

        const gig = await gigOfferingService.createGigOffering(gigData);

        // Auto-publish if requested
        if (request.body.autoPublish) {
          await gigOfferingService.publishGigOffering(
            gig.uuid as UUID,
            request.user!.tenantId,
            request.user!.id
          );
        }

        return sendSuccess(reply, {
          gig: {
            uuid: gig.uuid,
            title: gig.title,
            slug: gig.slug,
            status: gig.status,
            createdAt: gig.createdAt.toISOString(),
          },
        }, 201);
      } catch (error) {
        request.log.error({ error }, 'Failed to create gig for talent');
        return ErrorResponses.internalError(reply, 'Failed to create gig');
      }
    },
  });

  // Get orders for all account gigs
  fastify.get('/orders', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account:gigs:read')],
    schema: {
      tags: ['account.gigs'],
      summary: 'Get account orders',
      description: 'Get all orders for gigs managed by this account',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 20 })),
        status: Type.Optional(Type.String()),
        talentId: Type.Optional(Type.Number()),
        dateFrom: Type.Optional(Type.String({ format: 'date' })),
        dateTo: Type.Optional(Type.String({ format: 'date' })),
        sortBy: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            orders: Type.Array(Type.Object({
              uuid: uuidSchema,
              buyer: Type.Object({
                firstName: Type.String(),
                lastName: Type.String(),
                email: Type.String(),
                profilePhotoUrl: Type.Optional(Type.String()),
              }),
              gig: Type.Object({
                title: Type.String(),
                slug: Type.String(),
                talent: Type.Object({
                  firstName: Type.String(),
                  lastName: Type.String(),
                }),
              }),
              package: Type.Object({
                name: Type.String(),
                price: Type.Number(),
                currency: Type.String(),
              }),
              totalPrice: Type.Number(),
              currency: Type.String(),
              status: Type.String(),
              estimatedDelivery: Type.String(),
              actualDelivery: Type.Optional(Type.String()),
              requirements: Type.Object({}, { additionalProperties: true }),
              createdAt: Type.String(),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              pages: Type.Number(),
            }),
            stats: Type.Object({
              byStatus: Type.Object({}, { additionalProperties: true }),
              totalRevenue: Type.Number(),
              avgOrderValue: Type.Number(),
              completionRate: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const accountId = request.user!.accountId;
        if (!accountId) {
          return ErrorResponses.forbidden(reply, 'Account context required');
        }

        const { page = 1, limit = 20, dateFrom, dateTo, ...filters } = request.query;

        // Build date filters
        const dateFilters: any = {};
        if (dateFrom) dateFilters.createdAt = { gte: new Date(dateFrom) };
        if (dateTo) {
          if (!dateFilters.createdAt) dateFilters.createdAt = {};
          dateFilters.createdAt.lte = new Date(dateTo);
        }

        const result = await gigBookingService.getAccountOrders(
          accountId,
          request.user!.tenantId,
          { ...filters, ...dateFilters },
          page,
          limit
        );

        return sendSuccess(reply, result);
      } catch (error) {
        request.log.error({ error }, 'Failed to get account orders');
        return ErrorResponses.internalError(reply, 'Failed to get orders');
      }
    },
  });

  // Update order status (manage delivery)
  fastify.patch('/orders/:id/status', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account:gigs:manage')],
    schema: {
      tags: ['account.gigs'],
      summary: 'Update order status',
      description: 'Update the status of an order (e.g., mark as delivered)',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      body: Type.Object({
        status: Type.Union([
          Type.Literal('accepted'),
          Type.Literal('in_progress'),
          Type.Literal('delivered'),
          Type.Literal('revision_requested'),
          Type.Literal('completed'),
          Type.Literal('cancelled')
        ]),
        message: Type.Optional(Type.String()),
        deliverables: Type.Optional(Type.Array(Type.Object({
          url: Type.String({ format: 'uri' }),
          filename: Type.String(),
          description: Type.Optional(Type.String()),
        }))),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            order: Type.Object({
              status: Type.String(),
              updatedAt: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        // Verify order belongs to account's gig
        const order = await gigBookingService.getBooking(
          request.params.uuid as UUID,
          request.user!.tenantId
        );

        if (!order) {
          return ErrorResponses.notFound(reply, 'Order not found');
        }

        // Verify gig belongs to account
        const accountId = request.user!.accountId;
        if (!accountId || (order.gig.metadata as any)?.agencyAccountId !== accountId) {
          return ErrorResponses.forbidden(reply, 'Access denied');
        }

        const updated = await gigBookingService.updateOrderStatus(
          request.params.uuid as UUID,
          request.body.status,
          request.user!.id,
          request.body.message,
          request.body.deliverables
        );

        return sendSuccess(reply, {
          order: {
            status: updated.status,
            updatedAt: updated.updatedAt.toISOString(),
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to update order status');
        return ErrorResponses.internalError(reply, 'Failed to update order');
      }
    },
  });

  // Bulk update gig statuses
  fastify.post('/bulk-update', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account:gigs:manage')],
    schema: {
      tags: ['account.gigs'],
      summary: 'Bulk update gigs',
      description: 'Update multiple gig offerings at once',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        gigIds: Type.Array(Type.Number()),
        updates: Type.Object({
          status: Type.Optional(Type.String()),
          featured: Type.Optional(Type.Boolean()),
          verified: Type.Optional(Type.Boolean()),
          tags: Type.Optional(Type.Array(Type.String())),
        }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            updated: Type.Number(),
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
        const { gigIds, updates } = request.body;
        const results = [];
        let updated = 0;
        let failed = 0;

        for (const gigId of gigIds) {
          try {
            // Verify gig belongs to account
            const gig = await gigOfferingService.getGigOffering(
              gigId,
              request.user!.tenantId
            );

            const accountId = request.user!.accountId;
            if (!gig || !accountId || (gig.metadata as any)?.agencyAccountId !== accountId) {
              throw new Error('Access denied');
            }

            await gigOfferingService.updateGigOffering(
              gigId,
              updates,
              request.user!.tenantId
            );

            results.push({ id: gigId, success: true });
            updated++;
          } catch (error) {
            results.push({ 
              id: gigId, 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            failed++;
          }
        }

        return sendSuccess(reply, { updated, failed, results });
      } catch (error) {
        request.log.error({ error }, 'Failed to bulk update gigs');
        return ErrorResponses.internalError(reply, 'Failed to bulk update');
      }
    },
  });

  // Get gig performance analytics
  fastify.get('/analytics', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account:gigs:analytics')],
    schema: {
      tags: ['account.gigs'],
      summary: 'Get account gig analytics',
      description: 'Get aggregate analytics for all account gigs',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        period: Type.Optional(Type.Union([
          Type.Literal('week'),
          Type.Literal('month'),
          Type.Literal('quarter'),
          Type.Literal('year'),
        ])),
        talentId: Type.Optional(Type.Number()),
        category: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            overview: Type.Object({
              totalGigs: Type.Number(),
              activeGigs: Type.Number(),
              totalOrders: Type.Number(),
              totalRevenue: Type.Number(),
              avgOrderValue: Type.Number(),
              avgRating: Type.Number(),
              conversionRate: Type.Number(),
            }),
            topPerformers: Type.Array(Type.Object({
              gig: Type.Object({
                title: Type.String(),
                slug: Type.String(),
              }),
              talent: Type.Object({
                name: Type.String(),
              }),
              revenue: Type.Number(),
              orders: Type.Number(),
              rating: Type.Number(),
            })),
            revenueByCategory: Type.Array(Type.Object({
              category: Type.String(),
              revenue: Type.Number(),
              orders: Type.Number(),
            })),
            timeline: Type.Array(Type.Object({
              date: Type.String(),
              revenue: Type.Number(),
              orders: Type.Number(),
              views: Type.Number(),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const accountId = request.user!.accountId;
        if (!accountId) {
          return ErrorResponses.forbidden(reply, 'Account context required');
        }

        const { period = 'month', talentId, category } = request.query;

        const analytics = await gigOfferingService.getAccountAnalytics(
          accountId,
          request.user!.tenantId,
          { period, talentId, category }
        );

        return sendSuccess(reply, analytics);
      } catch (error) {
        request.log.error({ error }, 'Failed to get account analytics');
        return ErrorResponses.internalError(reply, 'Failed to get analytics');
      }
    },
  });

  // Export gig data
  fastify.get('/export', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account:gigs:export')],
    schema: {
      tags: ['account.gigs'],
      summary: 'Export gig data',
      description: 'Export gig and order data in various formats',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        format: Type.Union([Type.Literal('csv'), Type.Literal('json'), Type.Literal('xlsx')]),
        type: Type.Union([Type.Literal('gigs'), Type.Literal('orders'), Type.Literal('analytics')]),
        dateFrom: Type.Optional(Type.String({ format: 'date' })),
        dateTo: Type.Optional(Type.String({ format: 'date' })),
      }),
    },
    async handler(request, reply) {
      try {
        // TODO: Implement data export functionality
        return ErrorResponses.notImplemented(reply, 'Export functionality coming soon');
      } catch (error) {
        request.log.error({ error }, 'Failed to export gig data');
        return ErrorResponses.internalError(reply, 'Failed to export data');
      }
    },
  });
};