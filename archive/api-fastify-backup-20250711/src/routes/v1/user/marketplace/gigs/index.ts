import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * User Marketplace Gigs Routes
 * Browse and book gigs
 */
export const userGigsRoutes: FastifyPluginAsync = async (fastify) => {
  // Browse gigs
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.marketplace.gigs.read')
    ],
    schema: {
      tags: ['user.marketplace'],
      summary: 'Browse gigs',
      description: 'Browse available gigs in the marketplace',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        categoryId: Type.Optional(Type.Number()),
        minPrice: Type.Optional(Type.Number()),
        maxPrice: Type.Optional(Type.Number()),
        deliveryTime: Type.Optional(Type.Number()),
        sellerLevel: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            gigs: Type.Array(Type.Object({
              uuid: uuidSchema,
              title: Type.String(),
              description: Type.String(),
              category: Type.Object({
                name: Type.String(),
              }),
              packages: Type.Array(Type.Object({
                name: Type.String(),
                price: Type.Number(),
                currency: Type.String(),
                deliveryDays: Type.Number(),
                features: Type.Array(Type.String()),
              })),
              coverImage: Type.Optional(Type.String()),
              seller: Type.Object({
                name: Type.String(),
                profilePhoto: Type.Optional(Type.String()),
                level: Type.String(),
                rating: Type.Number(),
                reviewCount: Type.Number(),
              }),
              rating: Type.Number(),
              reviewCount: Type.Number(),
              orderCount: Type.Number(),
              tags: Type.Array(Type.String()),
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
        minPrice, 
        maxPrice, 
        deliveryTime,
        sellerLevel
      } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          tenantId: request.user!.tenantId,
          status: 'active',
          isPublished: true,
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

        // Price filter would need to check packages
        if (minPrice !== undefined || maxPrice !== undefined) {
          where.packages = {
            some: {
              AND: [
                minPrice !== undefined ? { price: { gte: minPrice } } : {},
                maxPrice !== undefined ? { price: { lte: maxPrice } } : {},
              ],
            },
          };
        }

        if (deliveryTime !== undefined) {
          where.packages = {
            some: {
              deliveryDays: { lte: deliveryTime },
            },
          };
        }

        if (sellerLevel) {
          where.seller = {
            sellerProfile: {
              level: sellerLevel,
            },
          };
        }

        const [gigs, total] = await Promise.all([
          fastify.prisma.gig.findMany({
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
              seller: {
                include: {
                  sellerProfile: true,
                },
              },
              packages: {
                orderBy: { displayOrder: 'asc' },
              },
              media: {
                where: { tenantId: request.user.tenantId, isPrimary: true },
                take: 1,
              },
              _count: {
                select: {
                  reviews: true,
                  orders: true,
                },
              },
              reviews: {
                select: {
                  rating: true,
                },
              },
              gigTags: {
                select: {
                  tag: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          }),
          fastify.prisma.gig.count({ where }),
        ]);

        return {
          success: true,
          data: {
            gigs: gigs.map(gig => {
              const avgRating = gig.reviews.length > 0
                ? gig.reviews.reduce((sum, r) => sum + r.rating, 0) / gig.reviews.length
                : 0;

              return {
                uuid: gig.uuid,
                title: gig.title,
                description: gig.description,
                category: gig.category,
                packages: gig.packages.map(pkg => ({
                  name: pkg.name,
                  price: pkg.price,
                  currency: pkg.currency,
                  deliveryDays: pkg.deliveryDays,
                  features: pkg.features as string[],
                })),
                coverImage: gig.media[0]?.url,
                seller: {
                  id: gig.seller.uuid as UUID,
                  name: gig.seller.name,
                  profilePhoto: gig.seller.profilePhotoUrl,
                  level: gig.seller.sellerProfile?.level || 'new',
                  rating: gig.seller.sellerProfile?.rating || 0,
                  reviewCount: gig.seller.sellerProfile?.totalReviews || 0,
                },
                rating: avgRating,
                reviewCount: gig._count.reviews,
                orderCount: gig._count.orders,
                tags: gig.gigTags.map(gt => gt.tag.name),
                createdAt: gig.createdAt.toISOString(),
              };
            }),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to browse gigs');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_BROWSE_GIGS',
        });
      }
    },
  });

  // Get gig details
  fastify.get('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.marketplace.gigs.read')
    ],
    schema: {
      tags: ['user.marketplace'],
      summary: 'Get gig details',
      description: 'Get detailed information about a gig',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            gig: Type.Object({
              uuid: uuidSchema,
              title: Type.String(),
              description: Type.String(),
              category: Type.Object({
                name: Type.String(),
              }),
              packages: Type.Array(Type.Object({
                name: Type.String(),
                description: Type.String(),
                price: Type.Number(),
                currency: Type.String(),
                deliveryDays: Type.Number(),
                revisions: Type.Number(),
                features: Type.Array(Type.String()),
              })),
              media: Type.Array(Type.Object({
                url: Type.String(),
                type: Type.String(),
                isPrimary: Type.Boolean(),
              })),
              seller: Type.Object({
                name: Type.String(),
                profilePhoto: Type.Optional(Type.String()),
                bio: Type.Optional(Type.String()),
                level: Type.String(),
                rating: Type.Number(),
                reviewCount: Type.Number(),
                responseTime: Type.String(),
                memberSince: Type.String(),
              }),
              faqs: Type.Array(Type.Object({
                question: Type.String(),
                answer: Type.String(),
              })),
              requirements: Type.Array(Type.Object({
                title: Type.String(),
                description: Type.String(),
                required: Type.Boolean(),
              })),
              rating: Type.Number(),
              reviewCount: Type.Number(),
              recentReviews: Type.Array(Type.Object({
                rating: Type.Number(),
                comment: Type.String(),
                reviewer: Type.Object({
                  name: Type.String(),
                  profilePhoto: Type.Optional(Type.String()),
                }),
                createdAt: Type.String(),
              })),
              tags: Type.Array(Type.String()),
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
        const gig = await fastify.prisma.gig.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
            status: 'active',
            isPublished: true,
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            seller: {
              include: {
                sellerProfile: true,
              },
            },
            packages: {
              orderBy: { displayOrder: 'asc' },
            },
            media: {
              orderBy: { order: 'asc' },
            },
            faqs: {
              where: { tenantId: request.user.tenantId, isActive: true },
              orderBy: { order: 'asc' },
            },
            requirements: {
              orderBy: { order: 'asc' },
            },
            reviews: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                reviewer: {
                  select: {
                    name: true,
                    profilePhotoUrl: true,
                  },
                },
              },
            },
            _count: {
              select: {
                reviews: true,
              },
            },
            savedGigs: {
              where: { tenantId: request.user.tenantId, userId: request.user!.id, },
              select: {
                id: true,
              },
            },
            gigTags: {
              select: {
                tag: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        if (!gig) {
          return reply.status(404).send({
            success: false,
            error: 'GIG_NOT_FOUND',
          });
        }

        // Track gig view
        await fastify.prisma.gigView.create({
          data: {
            gigId: gig.uuid as UUID,
            viewerId: request.user!.id,
          },
        });

        const avgRating = gig.reviews.length > 0
          ? gig.reviews.reduce((sum, r) => sum + r.rating, 0) / gig.reviews.length
          : 0;

        return {
          success: true,
          data: {
            gig: {
              uuid: gig.uuid,
              title: gig.title,
              description: gig.description,
              category: gig.category,
              packages: gig.packages.map(pkg => ({
                name: pkg.name,
                description: pkg.description,
                price: pkg.price,
                currency: pkg.currency,
                deliveryDays: pkg.deliveryDays,
                revisions: pkg.revisions,
                features: pkg.features as string[],
              })),
              media: gig.media.map(m => ({
                url: m.url,
                type: m.type,
                isPrimary: m.isPrimary,
              })),
              seller: {
                id: gig.seller.uuid as UUID,
                name: gig.seller.name,
                profilePhoto: gig.seller.profilePhotoUrl,
                bio: gig.seller.bio,
                level: gig.seller.sellerProfile?.level || 'new',
                rating: gig.seller.sellerProfile?.rating || 0,
                reviewCount: gig.seller.sellerProfile?.totalReviews || 0,
                responseTime: gig.seller.sellerProfile?.averageResponseTime || 'N/A',
                memberSince: gig.seller.createdAt.toISOString(),
              },
              faqs: gig.faqs.map(faq => ({
                question: faq.question,
                answer: faq.answer,
              })),
              requirements: gig.requirements.map(req => ({
                title: req.title,
                description: req.description,
                required: req.isRequired,
              })),
              rating: avgRating,
              reviewCount: gig._count.reviews,
              recentReviews: gig.reviews.map(review => ({
                rating: review.rating,
                comment: review.comment,
                reviewer: {
                  name: review.reviewer.name,
                  profilePhoto: review.reviewer.profilePhotoUrl,
                },
                createdAt: review.createdAt.toISOString(),
              })),
              tags: gig.gigTags.map(gt => gt.tag.name),
              isSaved: gig.savedGigs.length > 0,
              createdAt: gig.createdAt.toISOString(),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get gig details');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_GIG_DETAILS',
        });
      }
    },
  });

  // Book gig
  fastify.post('/:uuid/book', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.marketplace.gigs.read')
    ],
    schema: {
      tags: ['user.marketplace'],
      summary: 'Book gig',
      description: 'Create a booking/order for a gig',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        packageId: Type.Number(),
        requirements: Type.Object({}, { additionalProperties: true }),
        extras: Type.Optional(Type.Array(Type.Number())),
        quantity: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        notes: Type.Optional(Type.String()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            orderId: Type.Number(),
            orderNumber: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { packageId, requirements, extras, quantity = 1, notes } = request.body;

      try {
        const gig = await fastify.prisma.gig.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
            status: 'active',
            isPublished: true,
          },
          include: {
            packages: {
              where: { tenantId: request.user.tenantId, id: packageId },
            },
          },
        });

        if (!gig || gig.packages.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'GIG_OR_PACKAGE_NOT_FOUND',
          });
        }

        const selectedPackage = gig.packages[0];

        // Calculate total price
        let totalPrice = selectedPackage.price * quantity;
        // TODO: Add extras pricing

        // Create order
        const order = await fastify.prisma.gigOrder.create({
          data: {
            gigId: gig.uuid as UUID,
            packageId: selectedPackage.uuid as UUID,
            buyerId: request.user!.id,
            sellerId: gig.sellerId,
            orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            quantity,
            unitPrice: selectedPackage.price,
            totalPrice,
            currency: selectedPackage.currency,
            requirements,
            notes,
            status: 'pending_requirements',
            deliveryDays: selectedPackage.deliveryDays,
            expectedDeliveryAt: new Date(Date.now() + selectedPackage.deliveryDays * 24 * 60 * 60 * 1000),
          },
        });

        // Send notification to seller
        await fastify.prisma.notification.create({
          data: {
            userId: gig.sellerId,
            type: 'new_order',
            title: 'New Order Received',
            content: `You have received a new order for "${gig.title}"`,
            data: {
              orderId: order.uuid as UUID,
              gigId: gig.uuid as UUID,
            },
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            message: 'Order created successfully',
            orderId: order.uuid as UUID,
            orderNumber: order.orderNumber,
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to book gig');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_BOOK_GIG',
        });
      }
    },
  });

  // Save/unsave gig
  fastify.post('/:uuid/save', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.marketplace.gigs.read')
    ],
    schema: {
      tags: ['user.marketplace'],
      summary: 'Save/unsave gig',
      description: 'Toggle gig save status',
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
        const gig = await fastify.prisma.gig.findFirst({
          where: {
            uuid,
            tenantId: request.user!.tenantId,
          },
        });

        if (!gig) {
          return reply.status(404).send({
            success: false,
            error: 'GIG_NOT_FOUND',
          });
        }

        const savedGig = await fastify.prisma.savedGig.findFirst({
          where: { tenantId: request.user.tenantId, gigId: gig.uuid as UUID,
            userId: request.user!.id, },
        });

        if (savedGig) {
          // Unsave
          await fastify.prisma.savedGig.delete({
            where: { tenantId: request.user.tenantId },
          });

          return {
            success: true,
            data: {
              message: 'Gig removed from saved list',
              saved: false,
            },
          };
        } else {
          // Save
          await fastify.prisma.savedGig.create({
            data: {
              gigId: gig.uuid as UUID,
              userId: request.user!.id,
            },
          });

          return {
            success: true,
            data: {
              message: 'Gig saved successfully',
              saved: true,
            },
          };
        }
      } catch (error) {
        request.log.error({ error }, 'Failed to save/unsave gig');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_SAVE/UNSAVE_GIG',
        });
      }
    },
  });
};