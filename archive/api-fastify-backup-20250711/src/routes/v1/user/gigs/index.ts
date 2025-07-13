import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { GigOfferingService } from '@/services/gig-offering.service';

export const gigsRoutes: FastifyPluginAsync = async (fastify) => {
  // Create gig offering service instance
  const gigOfferingService = new GigOfferingService(fastify.prisma, fastify.redis, fastify.log);

  // Search/list gig offerings
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.gigs.read')
    ],
    schema: {
      tags: ['user.gigs'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        category: Type.Optional(Type.String()),
        subcategory: Type.Optional(Type.String()),
        search: Type.Optional(Type.String()),
        minPrice: Type.Optional(Type.Number({ minimum: 0 })),
        maxPrice: Type.Optional(Type.Number({ minimum: 0 })),
        currency: Type.Optional(Type.String({ minLength: 3, maxLength: 3 })),
        deliveryTime: Type.Optional(Type.Number({ minimum: 1 })),
        featured: Type.Optional(Type.Boolean()),
        talentLevel: Type.Optional(Type.Union([
          Type.Literal('beginner'),
          Type.Literal('intermediate'),
          Type.Literal('expert'),
        ])),
        avgRating: Type.Optional(Type.Number({ minimum: 0, maximum: 5 })),
        status: Type.Optional(Type.Union([
          Type.Literal('draft'),
          Type.Literal('published'),
          Type.Literal('paused'),
          Type.Literal('archived'),
        ])),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
        sortBy: Type.Optional(Type.Union([
          Type.Literal('createdAt'),
          Type.Literal('publishedAt'),
          Type.Literal('price'),
          Type.Literal('rating'),
          Type.Literal('orders'),
          Type.Literal('popularity'),
        ])),
        sortOrder: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')])),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            gigs: Type.Array(Type.Object({
              uuid: uuidSchema,
              title: Type.String(),
              category: Type.String(),
              subcategory: Type.Optional(Type.String()),
              startingPrice: Type.Number(),
              currency: Type.String(),
              avgRating: Type.Optional(Type.Number()),
              totalOrders: Type.Number(),
              totalReviews: Type.Number(),
              featured: Type.Boolean(),
              status: Type.String(),
              publishedAt: Type.Optional(Type.String()),
              talent: Type.Object({
                uuid: uuidSchema,
                firstName: Type.String(),
                lastName: Type.String(),
                avatarUrl: Type.Optional(Type.String()),
              }),
              _count: Type.Object({
                bookings: Type.Number(),
                reviews: Type.Number(),
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
    const isAdmin = fastify.hasPermission(request.user!, 'gigs:admin');
    
    // Non-admins can only see published gigs unless filtering their own
    const searchParams: any = {
      ...request.query,
      tenantId,
    };
    
    if (!isAdmin && !request.query.status) {
      searchParams.status = 'published';
    }
    
    const result = await gigOfferingService.searchGigs(searchParams);
    
    return {
      success: true,
      data: result,
    };
  });

  // Get featured gigs
  fastify.get('/featured', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.gigs.read')
    ],
    schema: {
      tags: ['user.gigs'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 20, default: 6 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            gigs: Type.Array(Type.Any()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const tenantId = request.user!.tenantId;
    const { limit = 6 } = request.query;
    
    const gigs = await gigOfferingService.getFeaturedGigs(tenantId, limit);
    
    return {
      success: true,
      data: { gigs },
    };
  });

  // Get popular gigs by category
  fastify.get('/popular/:category', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.gigs.read')
    ],
    schema: {
      tags: ['user.gigs'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        category: Type.String(),
      }),
      querystring: Type.Object({
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 20, default: 10 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            gigs: Type.Array(Type.Any()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const tenantId = request.user!.tenantId;
    const { category } = request.params;
    const { limit = 10 } = request.query;
    
    const gigs = await gigOfferingService.getPopularGigsByCategory(tenantId, category, limit);
    
    return {
      success: true,
      data: { gigs },
    };
  });

  // Create gig offering
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('gigs:create')],
    schema: {
      tags: ['user.gigs'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        profileId: Type.String({ format: 'uuid' }),
        title: Type.String({ minLength: 1, maxLength: 200 }),
        category: Type.String({ minLength: 1, maxLength: 50 }),
        subcategory: Type.Optional(Type.String()),
        description: Type.String({ minLength: 1 }),
        highlights: Type.Optional(Type.Array(Type.String(), { maxItems: 5 })),
        requirements: Type.Optional(Type.Object({
          skills: Type.Optional(Type.Array(Type.String())),
          tools: Type.Optional(Type.Array(Type.String())),
          languages: Type.Optional(Type.Array(Type.String())),
          experience: Type.Optional(Type.String()),
          other: Type.Optional(Type.String()),
        })),
        packages: Type.Array(Type.Object({
          name: Type.String(),
          description: Type.String(),
          deliverables: Type.Array(Type.String()),
          price: Type.Number({ minimum: 0 }),
          currency: Type.String({ minLength: 3, maxLength: 3 }),
          deliveryTime: Type.Number({ minimum: 1 }),
          revisions: Type.Number({ minimum: 0 }),
          features: Type.Optional(Type.Array(Type.String())),
        }), { minItems: 1, maxItems: 3 }),
        gallery: Type.Optional(Type.Object({
          images: Type.Optional(Type.Array(Type.Object({
            url: Type.String({ format: 'uri' }),
            alt: Type.Optional(Type.String()),
            order: Type.Number({ minimum: 0 }),
          }))),
          videos: Type.Optional(Type.Array(Type.Object({
            url: Type.String({ format: 'uri' }),
            thumbnail: Type.Optional(Type.String({ format: 'uri' })),
            title: Type.Optional(Type.String()),
            order: Type.Number({ minimum: 0 }),
          }))),
          portfolio: Type.Optional(Type.Array(Type.Object({
            url: Type.String({ format: 'uri' }),
            title: Type.String(),
            description: Type.Optional(Type.String()),
            type: Type.Union([
              Type.Literal('image'),
              Type.Literal('video'),
              Type.Literal('link'),
              Type.Literal('document'),
            ]),
          }))),
        })),
        extras: Type.Optional(Type.Array(Type.Object({
          name: Type.String(),
          description: Type.String(),
          price: Type.Number({ minimum: 0 }),
          currency: Type.String({ minLength: 3, maxLength: 3 }),
          deliveryTime: Type.Number({ minimum: 1 }),
        }))),
        faq: Type.Optional(Type.Array(Type.Object({
          question: Type.String(),
          answer: Type.String(),
        }))),
        availability: Type.Optional(Type.Object({
          timezone: Type.String(),
          workingHours: Type.Optional(Type.Object({
            start: Type.String(),
            end: Type.String(),
          })),
          workingDays: Type.Optional(Type.Array(Type.Union([
            Type.Literal('monday'),
            Type.Literal('tuesday'),
            Type.Literal('wednesday'),
            Type.Literal('thursday'),
            Type.Literal('friday'),
            Type.Literal('saturday'),
            Type.Literal('sunday'),
          ]))),
          maxConcurrentOrders: Type.Optional(Type.Number({ minimum: 1 })),
          autoAccept: Type.Optional(Type.Boolean()),
        })),
        seo: Type.Optional(Type.Object({
          tags: Type.Optional(Type.Array(Type.String(), { maxItems: 10 })),
          searchTerms: Type.Optional(Type.Array(Type.String(), { maxItems: 20 })),
        })),
        featured: Type.Optional(Type.Boolean()),
        visibility: Type.Optional(Type.Union([
          Type.Literal('public'),
          Type.Literal('private'),
          Type.Literal('draft'),
        ])),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            gig: Type.Object({
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
    
    const gig = await gigOfferingService.createGigOffering({
      ...request.body,
      tenantId,
      talentId: userId,
    });
    
    return reply.code(201).send({
      success: true,
      data: {
        gig: {
          uuid: gig.uuid,
          title: gig.title,
          status: gig.status,
          createdAt: gig.createdAt.toISOString(),
        },
      },
    });
  });

  // Get gig by UUID
  fastify.get('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.gigs.read')
    ],
    schema: {
      tags: ['user.gigs'],
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
            gig: Type.Any(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const { incrementViews = false } = request.query;
    
    const gig = await gigOfferingService.getGigByUuid(uuid, incrementViews);
    
    if (!gig) {
      return reply.code(404).send({
        success: false,
        error: 'GIG_OFFERING_NOT_FOUND',
      });
    }
    
    // Check if user can view draft/paused gigs
    if (gig.status !== 'published' && gig.talentId !== request.user!.id) {
      const canViewAll = fastify.hasPermission(request.user!, 'gigs:admin');
      if (!canViewAll) {
        return reply.code(403).send({
          success: false,
          error: 'ACCESS_DENIED',
        });
      }
    }
    
    return {
      success: true,
      data: { gig },
    };
  });

  // Update gig offering
  fastify.patch('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('gigs:update')],
    schema: {
      tags: ['user.gigs'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      body: Type.Any(), // Use partial of create schema
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            gig: Type.Object({
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
    
    // Get gig ID from UUID
    const existingGig = await gigOfferingService.getGigByUuid(uuid);
    if (!existingGig) {
      return reply.code(404).send({
        success: false,
        error: 'GIG_OFFERING_NOT_FOUND',
      });
    }
    
    // Check ownership
    if (existingGig.talentId !== request.user!.id) {
      const isAdmin = fastify.hasPermission(request.user!, 'gigs:admin');
      if (!isAdmin) {
        return reply.code(403).send({
          success: false,
          error: 'ACCESS_DENIED',
        });
      }
    }
    
    const gig = await gigOfferingService.updateGigOffering({
      ...request.body,
    });
    
    return {
      success: true,
      data: {
        gig: {
          uuid: gig.uuid,
          title: gig.title,
          updatedAt: gig.updatedAt.toISOString(),
        },
      },
    };
  });

  // Publish gig offering
  fastify.post('/:uuid/publish', {
    preHandler: [fastify.authenticate, fastify.requirePermission('gigs:update')],
    schema: {
      tags: ['user.gigs'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            gig: Type.Object({
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
    
    // Get gig ID from UUID
    const existingGig = await gigOfferingService.getGigByUuid(uuid);
    if (!existingGig) {
      return reply.code(404).send({
        success: false,
        error: 'GIG_OFFERING_NOT_FOUND',
      });
    }
    
    try {
      const gig = await gigOfferingService.publishGig(existingGig.uuid as UUID, request.user!.id);
      
      return {
        success: true,
        data: {
          gig: {
            uuid: gig.uuid,
            status: gig.status,
            publishedAt: gig.publishedAt!.toISOString(),
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

  // Pause/unpause gig offering
  fastify.post('/:uuid/toggle-status', {
    preHandler: [fastify.authenticate, fastify.requirePermission('gigs:update')],
    schema: {
      tags: ['user.gigs'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        pause: Type.Boolean(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            gig: Type.Object({
              uuid: uuidSchema,
              status: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const { pause } = request.body;
    
    // Get gig ID from UUID
    const existingGig = await gigOfferingService.getGigByUuid(uuid);
    if (!existingGig) {
      return reply.code(404).send({
        success: false,
        error: 'GIG_OFFERING_NOT_FOUND',
      });
    }
    
    try {
      const gig = await gigOfferingService.toggleGigStatus(existingGig.uuid as UUID, request.user!.id, pause);
      
      return {
        success: true,
        data: {
          gig: {
            uuid: gig.uuid,
            status: gig.status,
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

  // Get gig statistics
  fastify.get('/:uuid/stats', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.gigs.read')
    ],
    schema: {
      tags: ['user.gigs'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            stats: Type.Any(),
            totalOrders: Type.Number(),
            avgRating: Type.Optional(Type.Number()),
            totalBookings: Type.Number(),
            totalReviews: Type.Number(),
            bookingsByStatus: Type.Record(Type.String(), Type.Number()),
            totalRevenue: Type.Number(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    
    // Get gig ID from UUID
    const gig = await gigOfferingService.getGigByUuid(uuid);
    if (!gig) {
      return reply.code(404).send({
        success: false,
        error: 'GIG_OFFERING_NOT_FOUND',
      });
    }
    
    // Check ownership
    if (gig.talentId !== request.user!.id) {
      const isAdmin = fastify.hasPermission(request.user!, 'gigs:admin');
      if (!isAdmin) {
        return reply.code(403).send({
          success: false,
          error: 'ACCESS_DENIED',
        });
      }
    }
    
    const stats = await gigOfferingService.getGigStats(gig.id);
    
    return {
      success: true,
      data: stats,
    };
  });

  // Create gig booking
  fastify.post('/:uuid/book', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.gigs.read')
    ],
    schema: {
      tags: ['user.gigs'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        packageIndex: Type.Number({ minimum: 0, maximum: 2 }),
        selectedExtras: Type.Optional(Type.Array(Type.Number({ minimum: 0 }))),
        customRequirements: Type.Optional(Type.String()),
        urgentDelivery: Type.Optional(Type.Boolean()),
        attachments: Type.Optional(Type.Array(Type.Object({
          url: Type.String({ format: 'uri' }),
          filename: Type.String(),
          size: Type.Number({ minimum: 1 }),
          type: Type.String(),
        }))),
        deadline: Type.Optional(Type.String({ format: 'date-time' })),
        budget: Type.Object({
          amount: Type.Number({ minimum: 0 }),
          currency: Type.String({ minLength: 3, maxLength: 3 }),
        }),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            booking: Type.Object({
              uuid: uuidSchema,
              status: Type.String(),
              totalPrice: Type.Number(),
              deliveryDate: Type.String(),
              createdAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const userId = request.user!.id;
    
    // Get gig ID from UUID
    const gig = await gigOfferingService.getGigByUuid(uuid);
    if (!gig) {
      return reply.code(404).send({
        success: false,
        error: 'GIG_OFFERING_NOT_FOUND',
      });
    }
    
    try {
      const booking = await gigOfferingService.createGigBooking({
        ...request.body,
        gigId: gig.uuid as UUID,
        clientId: userId,
      });
      
      return reply.code(201).send({
        success: true,
        data: {
          booking: {
            uuid: booking.uuid,
            status: booking.status,
            totalPrice: booking.totalPrice,
            deliveryDate: booking.deliveryDate.toISOString(),
            createdAt: booking.createdAt.toISOString(),
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

  // Create gig review
  fastify.post('/bookings/:bookingUuid/review', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.gigs.read')
    ],
    schema: {
      tags: ['user.gigs'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        bookingUuid: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        rating: Type.Number({ minimum: 1, maximum: 5 }),
        title: Type.String({ minLength: 1, maxLength: 100 }),
        comment: Type.String({ minLength: 1, maxLength: 1000 }),
        categories: Type.Object({
          communication: Type.Number({ minimum: 1, maximum: 5 }),
          quality: Type.Number({ minimum: 1, maximum: 5 }),
          delivery: Type.Number({ minimum: 1, maximum: 5 }),
          value: Type.Number({ minimum: 1, maximum: 5 }),
        }),
        wouldRecommend: Type.Boolean(),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            review: Type.Object({
              uuid: uuidSchema,
              rating: Type.Number(),
              title: Type.String(),
              createdAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { bookingUuid } = request.params;
    const userId = request.user!.id;
    
    // Get booking by UUID
    const booking = await fastify.prisma.gigBooking.findUnique({
      where: { tenantId: request.user.tenantId, uuid: bookingUuid },
    });
    
    if (!booking) {
      return reply.code(404).send({
        success: false,
        error: 'BOOKING_NOT_FOUND',
      });
    }
    
    try {
      const review = await gigOfferingService.createGigReview({
        ...request.body,
        bookingId: booking.uuid as UUID,
        reviewerId: userId,
      });
      
      return reply.code(201).send({
        success: true,
        data: {
          review: {
            uuid: review.uuid,
            rating: review.rating,
            title: review.title,
            createdAt: review.createdAt.toISOString(),
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
};