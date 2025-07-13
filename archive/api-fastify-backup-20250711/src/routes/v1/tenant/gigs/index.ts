import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { sendSuccess, sendError, ErrorResponses } from '@/utils/response-helpers';
import { gigOfferingService } from '@/services/gig-offering.service';
import { gigBookingService } from '@/services/gig-booking.service';

/**
 * Tenant Gig Routes
 * Marketplace administrator gig management
 * Full access to all gigs within the tenant
 */
export const tenantGigRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Get all gig offerings in the tenant
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant:gigs:read')],
    schema: {
      tags: ['tenant.gigs'],
      summary: 'List all tenant gigs',
      description: 'Get all gig offerings in the tenant (admin view)',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 50 })),
        status: Type.Optional(Type.String()),
        featured: Type.Optional(Type.Boolean()),
        verified: Type.Optional(Type.Boolean()),
        accountId: Type.Optional(Type.Number()),
        talentId: Type.Optional(Type.Number()),
        category: Type.Optional(Type.String()),
        search: Type.Optional(Type.String()),
        dateFrom: Type.Optional(Type.String({ format: 'date' })),
        dateTo: Type.Optional(Type.String({ format: 'date' })),
        minRating: Type.Optional(Type.Number({ minimum: 0, maximum: 5 })),
        hasOrders: Type.Optional(Type.Boolean()),
        sortBy: Type.Optional(Type.String()),
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
              subcategory: Type.Optional(Type.String()),
              status: Type.String(),
              featured: Type.Boolean(),
              verified: Type.Boolean(),
              talent: Type.Object({
                firstName: Type.String(),
                lastName: Type.String(),
                email: Type.String(),
                profilePhotoUrl: Type.Optional(Type.String()),
                accountId: Type.Optional(Type.Number()),
                verified: Type.Boolean(),
              }),
              packages: Type.Array(Type.Object({
                name: Type.String(),
                price: Type.Number(),
                currency: Type.String(),
                deliveryTime: Type.Number(),
              })),
              stats: Type.Object({
                views: Type.Number(),
                impressions: Type.Number(),
                orders: Type.Number(),
                revenue: Type.Number(),
                avgRating: Type.Number(),
                completionRate: Type.Number(),
                responseTime: Type.String(),
              }),
              flags: Type.Object({
                hasReports: Type.Boolean(),
                needsReview: Type.Boolean(),
                copyrightConcern: Type.Boolean(),
              }),
              publishedAt: Type.Optional(Type.String()),
              lastOrderAt: Type.Optional(Type.String()),
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
              withOrders: Type.Number(),
              totalRevenue: Type.Number(),
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

        // Get all gigs in tenant
        const result = await gigOfferingService.searchGigOfferings({
          tenantId: request.user!.tenantId,
          ...filters,
          ...dateFilters,
          page,
          limit,
          sortBy,
          includeUnpublished: true, // Admin can see all gigs
        });

        // Get detailed stats and flags for each gig
        const gigsWithDetails = await Promise.all(
          result.gigs.map(async (gig) => {
            const [stats, flags] = await Promise.all([
              gigOfferingService.getGigStats(gig.uuid as UUID, request.user!.tenantId),
              gigOfferingService.getGigFlags(gig.uuid as UUID, request.user!.tenantId),
            ]);

            return {
              uuid: gig.uuid,
              title: gig.title,
              slug: gig.slug,
              category: gig.category,
              subcategory: gig.subcategory,
              status: gig.status,
              featured: gig.featured,
              verified: gig.verified,
              talent: {
                id: gig.talentId,
                firstName: gig.talent?.firstName || '',
                lastName: gig.talent?.lastName || '',
                email: gig.talent?.email || '',
                profilePhotoUrl: gig.talent?.profilePhotoUrl,
                accountId: gig.accountId,
                verified: gig.talent?.verified || false,
              },
              packages: gig.packages.map(pkg => ({
                name: pkg.name,
                price: pkg.price,
                currency: pkg.currency,
                deliveryTime: pkg.deliveryTime,
              })),
              stats: {
                views: stats.views || 0,
                impressions: stats.impressions || 0,
                orders: stats.totalOrders || 0,
                revenue: stats.totalRevenue || 0,
                avgRating: stats.avgRating || 0,
                completionRate: stats.completionRate || 0,
                responseTime: stats.avgResponseTime || 'N/A',
              },
              flags: {
                hasReports: flags.hasReports || false,
                needsReview: flags.needsReview || false,
                copyrightConcern: flags.copyrightConcern || false,
              },
              publishedAt: gig.publishedAt?.toISOString(),
              lastOrderAt: gig.lastOrderAt?.toISOString(),
              createdAt: gig.createdAt.toISOString(),
              updatedAt: gig.updatedAt.toISOString(),
            };
          })
        );

        // Calculate summary statistics
        const summary = {
          total: result.pagination.total,
          byStatus: gigsWithDetails.reduce((acc, gig) => {
            acc[gig.status] = (acc[gig.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          featured: gigsWithDetails.filter(g => g.featured).length,
          verified: gigsWithDetails.filter(g => g.verified).length,
          withOrders: gigsWithDetails.filter(g => g.stats.orders > 0).length,
          totalRevenue: gigsWithDetails.reduce((sum, g) => sum + g.stats.revenue, 0),
        };

        return sendSuccess(reply, {
          gigs: gigsWithDetails,
          pagination: result.pagination,
          summary,
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to get tenant gigs');
        return ErrorResponses.internalError(reply, 'Failed to get gigs');
      }
    },
  });

  // Get gig details with full admin info
  fastify.get('/:id', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant:gigs:read')],
    schema: {
      tags: ['tenant.gigs'],
      summary: 'Get gig details (admin)',
      description: 'Get complete gig details including admin-only fields',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            gig: Type.Object({}, { additionalProperties: true }), // Full gig object
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const gig = await gigOfferingService.getGigOffering(
          request.params.uuid as UUID,
          request.user!.tenantId,
          true // Include all admin fields
        );

        if (!gig) {
          return ErrorResponses.notFound(reply, 'Gig not found');
        }

        // Get additional admin data
        const [stats, orders, reports] = await Promise.all([
          gigOfferingService.getGigStats(gig.uuid as UUID, request.user!.tenantId),
          gigBookingService.getGigOrders(gig.uuid as UUID, request.user!.tenantId, { limit: 10 }),
          gigOfferingService.getGigReports(gig.uuid as UUID, request.user!.tenantId),
        ]);

        // Include all fields for admin view
        const adminGig = {
          ...gig,
          stats,
          recentOrders: orders.orders,
          reports,
          metadata: gig.metadata,
          searchVector: undefined, // Remove internal fields
        };

        return sendSuccess(reply, { gig: adminGig });
      } catch (error) {
        request.log.error({ error }, 'Failed to get gig details');
        return ErrorResponses.internalError(reply, 'Failed to get gig');
      }
    },
  });

  // Update gig status or settings
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant:gigs:manage')],
    schema: {
      tags: ['tenant.gigs'],
      summary: 'Update gig (admin)',
      description: 'Update gig settings or status as admin',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      body: Type.Object({
        status: Type.Optional(Type.String()),
        featured: Type.Optional(Type.Boolean()),
        verified: Type.Optional(Type.Boolean()),
        visibility: Type.Optional(Type.String()),
        flags: Type.Optional(Type.Object({
          needsReview: Type.Optional(Type.Boolean()),
          copyrightConcern: Type.Optional(Type.Boolean()),
        })),
        adminNotes: Type.Optional(Type.String()),
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            gig: Type.Object({
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
        const gig = await gigOfferingService.updateGigOffering(
          request.params.uuid as UUID,
          request.body,
          request.user!.tenantId,
          true // Admin update
        );

        return sendSuccess(reply, {
          gig: {
            status: gig.status,
            featured: gig.featured,
            verified: gig.verified,
            updatedAt: gig.updatedAt.toISOString(),
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to update gig');
        return ErrorResponses.internalError(reply, 'Failed to update gig');
      }
    },
  });

  // Delete gig offering
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant:gigs:delete')],
    schema: {
      tags: ['tenant.gigs'],
      summary: 'Delete gig (admin)',
      description: 'Permanently delete a gig offering',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      body: Type.Object({
        reason: Type.String(),
        notifyTalent: Type.Optional(Type.Boolean({ default: true })),
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
        await gigOfferingService.deleteGigOffering(
          request.params.uuid as UUID,
          request.user!.tenantId,
          request.body.reason,
          request.body.notifyTalent
        );

        return sendSuccess(reply, {
          message: 'Gig offering deleted successfully',
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to delete gig');
        return ErrorResponses.internalError(reply, 'Failed to delete gig');
      }
    },
  });

  // Bulk operations on gigs
  fastify.post('/bulk', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant:gigs:manage')],
    schema: {
      tags: ['tenant.gigs'],
      summary: 'Bulk gig operations',
      description: 'Perform bulk operations on multiple gigs',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        gigIds: Type.Array(Type.Number()),
        operation: Type.Union([
          Type.Literal('feature'),
          Type.Literal('unfeature'),
          Type.Literal('verify'),
          Type.Literal('unverify'),
          Type.Literal('publish'),
          Type.Literal('unpublish'),
          Type.Literal('pause'),
          Type.Literal('archive'),
          Type.Literal('delete'),
        ]),
        reason: Type.Optional(Type.String()),
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
        const { gigIds, operation, reason } = request.body;
        const results = [];
        let processed = 0;
        let failed = 0;

        for (const gigId of gigIds) {
          try {
            switch (operation) {
              case 'feature':
                await gigOfferingService.updateGigOffering(
                  gigId,
                  { featured: true },
                  request.user!.tenantId,
                  true
                );
                break;
              case 'unfeature':
                await gigOfferingService.updateGigOffering(
                  gigId,
                  { featured: false },
                  request.user!.tenantId,
                  true
                );
                break;
              case 'verify':
                await gigOfferingService.updateGigOffering(
                  gigId,
                  { verified: true },
                  request.user!.tenantId,
                  true
                );
                break;
              case 'unverify':
                await gigOfferingService.updateGigOffering(
                  gigId,
                  { verified: false },
                  request.user!.tenantId,
                  true
                );
                break;
              case 'publish':
                await gigOfferingService.publishGigOffering(
                  gigId,
                  request.user!.tenantId,
                  request.user!.id
                );
                break;
              case 'unpublish':
              case 'pause':
                await gigOfferingService.updateGigOffering(
                  gigId,
                  { status: 'paused' },
                  request.user!.tenantId,
                  true
                );
                break;
              case 'archive':
                await gigOfferingService.updateGigOffering(
                  gigId,
                  { status: 'archived' },
                  request.user!.tenantId,
                  true
                );
                break;
              case 'delete':
                await gigOfferingService.deleteGigOffering(
                  gigId,
                  request.user!.tenantId,
                  reason || 'Bulk deletion by admin'
                );
                break;
            }
            results.push({ id: gigId, success: true });
            processed++;
          } catch (error) {
            results.push({ 
              id: gigId, 
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

  // Get tenant-wide gig analytics
  fastify.get('/analytics/overview', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant:gigs:analytics')],
    schema: {
      tags: ['tenant.gigs'],
      summary: 'Get tenant gig analytics',
      description: 'Get aggregate analytics for all gigs in the tenant',
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
              gigs: Type.Number(),
              activeGigs: Type.Number(),
              talents: Type.Number(),
              orders: Type.Number(),
              revenue: Type.Number(),
              avgOrderValue: Type.Number(),
              avgRating: Type.Number(),
              platformFees: Type.Number(),
            }),
            byCategory: Type.Array(Type.Object({
              category: Type.String(),
              gigs: Type.Number(),
              orders: Type.Number(),
              revenue: Type.Number(),
              avgPrice: Type.Number(),
            })),
            byStatus: Type.Object({}, { additionalProperties: true }),
            topPerformers: Type.Array(Type.Object({
              title: Type.String(),
              revenue: Type.Number(),
              orders: Type.Number(),
              rating: Type.Number(),
            })),
            timeline: Type.Array(Type.Object({
              period: Type.String(),
              gigs: Type.Number(),
              orders: Type.Number(),
              revenue: Type.Number(),
              newTalents: Type.Number(),
            })),
            talentDistribution: Type.Object({
              byLevel: Type.Object({}, { additionalProperties: true }),
              byOrders: Type.Object({}, { additionalProperties: true }),
              byRevenue: Type.Object({}, { additionalProperties: true }),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const { dateFrom, dateTo, groupBy = 'week' } = request.query;

        const analytics = await gigOfferingService.getTenantAnalytics(
          request.user!.tenantId,
          { dateFrom, dateTo, groupBy }
        );

        return sendSuccess(reply, analytics);
      } catch (error) {
        request.log.error({ error }, 'Failed to get tenant analytics');
        return ErrorResponses.internalError(reply, 'Failed to get analytics');
      }
    },
  });

  // Manage gig reports
  fastify.get('/reports', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant:gigs:moderate')],
    schema: {
      tags: ['tenant.gigs'],
      summary: 'Get gig reports',
      description: 'Get all reports filed against gigs',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 20 })),
        status: Type.Optional(Type.Union([
          Type.Literal('pending'),
          Type.Literal('reviewing'),
          Type.Literal('resolved'),
          Type.Literal('dismissed')
        ])),
        type: Type.Optional(Type.String()),
        gigId: Type.Optional(Type.Number()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            reports: Type.Array(Type.Object({
              gig: Type.Object({
                title: Type.String(),
                slug: Type.String(),
                talent: Type.Object({
                  name: Type.String(),
                }),
              }),
              reporter: Type.Object({
                name: Type.String(),
                email: Type.String(),
              }),
              type: Type.String(),
              reason: Type.String(),
              description: Type.String(),
              evidence: Type.Optional(Type.Array(Type.String())),
              status: Type.String(),
              resolution: Type.Optional(Type.String()),
              createdAt: Type.String(),
              resolvedAt: Type.Optional(Type.String()),
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
        const { page = 1, limit = 20, ...filters } = request.query;

        const result = await gigOfferingService.getReports(
          request.user!.tenantId,
          filters,
          page,
          limit
        );

        return sendSuccess(reply, result);
      } catch (error) {
        request.log.error({ error }, 'Failed to get gig reports');
        return ErrorResponses.internalError(reply, 'Failed to get reports');
      }
    },
  });

  // Export gig data
  fastify.get('/export', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant:gigs:export')],
    schema: {
      tags: ['tenant.gigs'],
      summary: 'Export gig data',
      description: 'Export gig data in various formats',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        format: Type.Union([Type.Literal('csv'), Type.Literal('json'), Type.Literal('xlsx')]),
        type: Type.Union([
          Type.Literal('gigs'),
          Type.Literal('orders'),
          Type.Literal('analytics'),
          Type.Literal('talents')
        ]),
        dateFrom: Type.Optional(Type.String({ format: 'date' })),
        dateTo: Type.Optional(Type.String({ format: 'date' })),
        includePersonalData: Type.Optional(Type.Boolean()),
      }),
    },
    async handler(request, reply) {
      try {
        // TODO: Implement data export functionality
        return ErrorResponses.notImplemented(reply, 'Export functionality coming soon');
      } catch (error) {
        request.log.error({ error }, 'Failed to export gigs');
        return ErrorResponses.internalError(reply, 'Failed to export data');
      }
    },
  });
};