import { PrismaClient } from '@prisma/client';
import { FastifyRedis } from '@fastify/redis';
import { z } from 'zod';
import type { FastifyBaseLogger } from 'fastify';
import { getOrSetCache } from '../utils/cache-utils';

// Input validation schemas
const createGigOfferingSchema = z.object({
  tenantId: z.number().int().positive(),
  talentId: z.number().int().positive(),
  profileId: z.string().uuid(),
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(50),
  subcategory: z.string().optional(),
  description: z.string().min(1),
  highlights: z.array(z.string()).max(5).optional(),
  requirements: z.object({
    skills: z.array(z.string()).optional(),
    tools: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    experience: z.string().optional(),
    other: z.string().optional(),
  }).optional(),
  packages: z.array(z.object({
    name: z.string(),
    description: z.string(),
    deliverables: z.array(z.string()),
    price: z.number().min(0),
    currency: z.string().length(3),
    deliveryTime: z.number().int().positive(), // days
    revisions: z.number().int().min(0),
    features: z.array(z.string()).optional(),
  })).min(1).max(3),
  gallery: z.object({
    images: z.array(z.object({
      url: z.string().url(),
      alt: z.string().optional(),
      order: z.number().int().min(0),
    })).optional(),
    videos: z.array(z.object({
      url: z.string().url(),
      thumbnail: z.string().url().optional(),
      title: z.string().optional(),
      order: z.number().int().min(0),
    })).optional(),
    portfolio: z.array(z.object({
      url: z.string().url(),
      title: z.string(),
      description: z.string().optional(),
      type: z.enum(['image', 'video', 'link', 'document']),
    })).optional(),
  }).optional(),
  extras: z.array(z.object({
    name: z.string(),
    description: z.string(),
    price: z.number().min(0),
    currency: z.string().length(3),
    deliveryTime: z.number().int().positive(),
  })).optional(),
  faq: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
  availability: z.object({
    timezone: z.string(),
    workingHours: z.object({
      start: z.string(), // HH:MM format
      end: z.string(),   // HH:MM format
    }).optional(),
    workingDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).optional(),
    maxConcurrentOrders: z.number().int().positive().optional(),
    autoAccept: z.boolean().optional().default(false),
  }).optional(),
  seo: z.object({
    tags: z.array(z.string()).max(10).optional(),
    searchTerms: z.array(z.string()).max(20).optional(),
  }).optional(),
  featured: z.boolean().optional().default(false),
  visibility: z.enum(['public', 'private', 'draft']).optional().default('draft'),
});

const updateGigOfferingSchema = createGigOfferingSchema.partial().extend({
  id: z.number().int().positive(),
});

const searchGigOfferingsSchema = z.object({
  tenantId: z.number().int().positive(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  deliveryTime: z.number().int().positive().optional(), // max delivery time
  featured: z.boolean().optional(),
  talentLevel: z.enum(['beginner', 'intermediate', 'expert']).optional(),
  avgRating: z.number().min(0).max(5).optional(),
  status: z.enum(['draft', 'published', 'paused', 'archived']).optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  sortBy: z.enum(['createdAt', 'publishedAt', 'price', 'rating', 'orders', 'popularity']).optional().default('publishedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const createGigBookingSchema = z.object({
  gigId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  packageIndex: z.number().int().min(0).max(2), // 0-2 for basic/standard/premium
  selectedExtras: z.array(z.number().int().min(0)).optional(),
  customRequirements: z.string().optional(),
  urgentDelivery: z.boolean().optional().default(false),
  attachments: z.array(z.object({
    url: z.string().url(),
    filename: z.string(),
    size: z.number().int().positive(),
    type: z.string(),
  })).optional(),
  deadline: z.string().datetime().optional(),
  budget: z.object({
    amount: z.number().min(0),
    currency: z.string().length(3),
  }),
});

const createGigReviewSchema = z.object({
  bookingId: z.number().int().positive(),
  reviewerId: z.number().int().positive(),
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(100),
  comment: z.string().min(1).max(1000),
  categories: z.object({
    communication: z.number().min(1).max(5),
    quality: z.number().min(1).max(5),
    delivery: z.number().min(1).max(5),
    value: z.number().min(1).max(5),
  }),
  wouldRecommend: z.boolean(),
});

export type CreateGigOfferingInput = z.infer<typeof createGigOfferingSchema>;
export type UpdateGigOfferingInput = z.infer<typeof updateGigOfferingSchema>;
export type SearchGigOfferingsInput = z.infer<typeof searchGigOfferingsSchema>;
export type CreateGigBookingInput = z.infer<typeof createGigBookingSchema>;
export type CreateGigReviewInput = z.infer<typeof createGigReviewSchema>;

export class GigOfferingService {
  private prisma: PrismaClient;
  private redis: FastifyRedis;
  private logger?: FastifyBaseLogger;

  constructor(prisma: PrismaClient, redis: FastifyRedis, logger?: FastifyBaseLogger) {
    this.prisma = prisma;
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Create a new gig offering
   */
  async createGigOffering(input: CreateGigOfferingInput) {
    const validated = createGigOfferingSchema.parse(input);
    
    // Calculate starting price from packages
    const startingPrice = Math.min(...validated.packages.map(p => p.price));
    const currency = validated.packages[0].currency;
    
    const gigOffering = await this.prisma.gigOffering.create({
      data: {
        ...validated,
        startingPrice,
        currency,
        status: 'draft',
      },
    });
    
    // Invalidate caches
    await this.invalidateGigCache(validated.tenantId);
    
    return gigOffering;
  }

  /**
   * Update gig offering
   */
  async updateGigOffering(input: UpdateGigOfferingInput) {
    const validated = updateGigOfferingSchema.parse(input);
    const { id, ...updates } = validated;
    
    // Get existing gig to check ownership
    const existing = await this.prisma.gigOffering.findUnique({
      where: { id },
    });
    
    if (!existing) {
      throw new Error('Gig offering not found');
    }
    
    // Recalculate pricing if packages were updated
    let additionalUpdates: any = {};
    if (updates.packages) {
      additionalUpdates.startingPrice = Math.min(...updates.packages.map(p => p.price));
      additionalUpdates.currency = updates.packages[0].currency;
    }
    
    // Update gig offering
    const gigOffering = await this.prisma.gigOffering.update({
      where: { id },
      data: { ...updates, ...additionalUpdates },
    });
    
    // Invalidate caches
    await this.invalidateGigCache(existing.tenantId);
    
    return gigOffering;
  }

  /**
   * Publish gig offering
   */
  async publishGig(gigId: number, talentId: number) {
    const gig = await this.prisma.gigOffering.findUnique({
      where: { id: gigId },
    });
    
    if (!gig) {
      throw new Error('Gig offering not found');
    }
    
    if (gig.talentId !== talentId) {
      throw new Error('Unauthorized to publish this gig');
    }
    
    if (gig.status !== 'draft') {
      throw new Error('Gig is already published');
    }
    
    // Validate that gig has required data for publishing
    if (!gig.packages || (gig.packages as any[]).length === 0) {
      throw new Error('Gig must have at least one package to be published');
    }
    
    const updatedGig = await this.prisma.gigOffering.update({
      where: { id: gigId },
      data: {
        status: 'published',
        publishedAt: new Date(),
        visibility: 'public',
      },
    });
    
    // Invalidate caches
    await this.invalidateGigCache(gig.tenantId);
    
    return updatedGig;
  }

  /**
   * Pause/unpause gig offering
   */
  async toggleGigStatus(gigId: number, talentId: number, pause: boolean) {
    const gig = await this.prisma.gigOffering.findUnique({
      where: { id: gigId },
    });
    
    if (!gig) {
      throw new Error('Gig offering not found');
    }
    
    if (gig.talentId !== talentId) {
      throw new Error('Unauthorized to modify this gig');
    }
    
    const newStatus = pause ? 'paused' : 'published';
    
    const updatedGig = await this.prisma.gigOffering.update({
      where: { id: gigId },
      data: { status: newStatus },
    });
    
    // Invalidate caches
    await this.invalidateGigCache(gig.tenantId);
    
    return updatedGig;
  }

  /**
   * Get gig offering by UUID
   */
  async getGigByUuid(uuid: string, incrementViews: boolean = false) {
    const gig = await this.prisma.gigOffering.findUnique({
      where: { uuid },
      include: {
        talent: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });
    
    if (!gig) {
      return null;
    }
    
    // Increment view count if requested
    if (incrementViews && gig.status === 'published') {
      await this.prisma.gigOffering.update({
        where: { id: gig.id },
        data: {
          stats: {
            ...((gig.stats as any) || {}),
            views: ((gig.stats as any)?.views || 0) + 1,
          },
        },
      });
    }
    
    return gig;
  }

  /**
   * Search gig offerings
   */
  async searchGigs(input: SearchGigOfferingsInput) {
    const validated = searchGigOfferingsSchema.parse(input);
    
    // Build where clause
    const where: any = {
      tenantId: validated.tenantId,
    };
    
    if (validated.status) {
      where.status = validated.status;
    } else {
      // Default to showing only published gigs
      where.status = 'published';
    }
    
    if (validated.category) {
      where.category = validated.category;
    }
    
    if (validated.subcategory) {
      where.subcategory = validated.subcategory;
    }
    
    if (validated.featured !== undefined) {
      where.featured = validated.featured;
    }
    
    if (validated.minPrice || validated.maxPrice) {
      where.startingPrice = {};
      if (validated.minPrice) where.startingPrice.gte = validated.minPrice;
      if (validated.maxPrice) where.startingPrice.lte = validated.maxPrice;
    }
    
    if (validated.currency) {
      where.currency = validated.currency;
    }
    
    if (validated.avgRating) {
      where.avgRating = {
        gte: validated.avgRating,
      };
    }
    
    if (validated.search) {
      where.OR = [
        { title: { contains: validated.search, mode: 'insensitive' } },
        { description: { contains: validated.search, mode: 'insensitive' } },
        { category: { contains: validated.search, mode: 'insensitive' } },
      ];
    }
    
    // Build orderBy
    const orderBy: any = {};
    orderBy[validated.sortBy] = validated.sortOrder;
    
    // Execute query
    const [gigs, total] = await Promise.all([
      this.prisma.gigOffering.findMany({
        where,
        orderBy,
        skip: validated.offset,
        take: validated.limit,
        include: {
          talent: {
            select: {
              id: true,
              uuid: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
      }),
      this.prisma.gigOffering.count({ where }),
    ]);
    
    return {
      gigs,
      total,
      hasMore: validated.offset + validated.limit < total,
    };
  }

  /**
   * Get featured gigs (cached)
   */
  async getFeaturedGigs(tenantId: number, limit: number = 6) {
    const cacheKey = `tenant:${tenantId}:gigs:featured`;
    
    return getOrSetCache(
      this.redis,
      cacheKey,
      300, // 5 minutes
      async () => {
        const gigs = await this.prisma.gigOffering.findMany({
          where: {
            tenantId,
            status: 'published',
            featured: true,
          },
          orderBy: [
            { avgRating: 'desc' },
            { publishedAt: 'desc' },
          ],
          take: limit,
          include: {
            talent: {
              select: {
                id: true,
                uuid: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                bookings: true,
                reviews: true,
              },
            },
          },
        });
        
        return gigs;
      }
    );
  }

  /**
   * Get popular gigs by category (cached)
   */
  async getPopularGigsByCategory(tenantId: number, category: string, limit: number = 10) {
    const cacheKey = `tenant:${tenantId}:gigs:popular:${category}`;
    
    return getOrSetCache(
      this.redis,
      cacheKey,
      600, // 10 minutes
      async () => {
        const gigs = await this.prisma.gigOffering.findMany({
          where: {
            tenantId,
            category,
            status: 'published',
          },
          orderBy: [
            { totalOrders: 'desc' },
            { avgRating: 'desc' },
          ],
          take: limit,
          include: {
            talent: {
              select: {
                id: true,
                uuid: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                bookings: true,
                reviews: true,
              },
            },
          },
        });
        
        return gigs;
      }
    );
  }

  /**
   * Create gig booking
   */
  async createGigBooking(input: CreateGigBookingInput) {
    const validated = createGigBookingSchema.parse(input);
    
    // Get gig with packages
    const gig = await this.prisma.gigOffering.findUnique({
      where: { id: validated.gigId },
    });
    
    if (!gig) {
      throw new Error('Gig offering not found');
    }
    
    if (gig.status !== 'published') {
      throw new Error('Gig is not available for booking');
    }
    
    const packages = gig.packages as any[];
    if (!packages || packages.length <= validated.packageIndex) {
      throw new Error('Invalid package selection');
    }
    
    const selectedPackage = packages[validated.packageIndex];
    let totalPrice = selectedPackage.price;
    let totalDeliveryTime = selectedPackage.deliveryTime;
    
    // Add extras pricing
    if (validated.selectedExtras && gig.extras) {
      const extras = gig.extras as any[];
      for (const extraIndex of validated.selectedExtras) {
        if (extraIndex < extras.length) {
          totalPrice += extras[extraIndex].price;
          totalDeliveryTime += extras[extraIndex].deliveryTime;
        }
      }
    }
    
    // Check availability
    const availability = gig.availability as any;
    if (availability?.maxConcurrentOrders) {
      const activeBookings = await this.prisma.gigBooking.count({
        where: {
          gigId: validated.gigId,
          status: { in: ['confirmed', 'in_progress'] },
        },
      });
      
      if (activeBookings >= availability.maxConcurrentOrders) {
        throw new Error('Gig is currently at maximum capacity');
      }
    }
    
    // Calculate delivery date
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + totalDeliveryTime);
    
    // Create booking
    const booking = await this.prisma.$transaction(async (tx) => {
      const newBooking = await tx.gigBooking.create({
        data: {
          ...validated,
          packageDetails: selectedPackage,
          selectedExtrasDetails: validated.selectedExtras?.map(i => (gig.extras as any[])[i]),
          totalPrice,
          deliveryDate,
          status: availability?.autoAccept ? 'confirmed' : 'pending',
        },
      });
      
      // Update gig stats
      await tx.gigOffering.update({
        where: { id: validated.gigId },
        data: {
          stats: {
            ...((gig.stats as any) || {}),
            bookings: ((gig.stats as any)?.bookings || 0) + 1,
          },
        },
      });
      
      return newBooking;
    });
    
    // Invalidate caches
    await this.invalidateGigCache(gig.tenantId);
    
    return booking;
  }

  /**
   * Get gig statistics
   */
  async getGigStats(gigId: number) {
    const gig = await this.prisma.gigOffering.findUnique({
      where: { id: gigId },
      select: {
        stats: true,
        totalOrders: true,
        avgRating: true,
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });
    
    if (!gig) {
      throw new Error('Gig offering not found');
    }
    
    const bookings = await this.prisma.gigBooking.groupBy({
      by: ['status'],
      where: { gigId },
      _count: true,
    });
    
    const statusCounts = bookings.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);
    
    // Get revenue data
    const revenue = await this.prisma.gigBooking.aggregate({
      where: {
        gigId,
        status: { in: ['completed', 'delivered'] },
      },
      _sum: {
        totalPrice: true,
      },
    });
    
    return {
      stats: gig.stats,
      totalOrders: gig.totalOrders,
      avgRating: gig.avgRating,
      totalBookings: gig._count.bookings,
      totalReviews: gig._count.reviews,
      bookingsByStatus: statusCounts,
      totalRevenue: revenue._sum.totalPrice || 0,
    };
  }

  /**
   * Create review for completed gig
   */
  async createGigReview(input: CreateGigReviewInput) {
    const validated = createGigReviewSchema.parse(input);
    
    // Get booking details
    const booking = await this.prisma.gigBooking.findUnique({
      where: { id: validated.bookingId },
      include: {
        gig: true,
      },
    });
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    if (booking.clientId !== validated.reviewerId) {
      throw new Error('Unauthorized to review this booking');
    }
    
    if (booking.status !== 'completed') {
      throw new Error('Can only review completed bookings');
    }
    
    // Check if already reviewed
    const existingReview = await this.prisma.gigReview.findFirst({
      where: {
        bookingId: validated.bookingId,
        reviewerId: validated.reviewerId,
      },
    });
    
    if (existingReview) {
      throw new Error('Booking already reviewed');
    }
    
    // Create review and update gig rating
    const review = await this.prisma.$transaction(async (tx) => {
      const newReview = await tx.gigReview.create({
        data: validated,
      });
      
      // Recalculate gig average rating
      const allReviews = await tx.gigReview.findMany({
        where: { gigId: booking.gigId },
        select: { rating: true },
      });
      
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      // Update gig with new rating
      await tx.gigOffering.update({
        where: { id: booking.gigId },
        data: {
          avgRating: Number(avgRating.toFixed(2)),
          totalReviews: allReviews.length,
        },
      });
      
      return newReview;
    });
    
    // Invalidate caches
    await this.invalidateGigCache(booking.gig.tenantId);
    
    return review;
  }

  /**
   * Helper: Invalidate gig-related caches
   */
  private async invalidateGigCache(tenantId: number) {
    const patterns = [
      `tenant:${tenantId}:gigs:*`,
      `tenant:${tenantId}:stats:gigs:*`,
    ];
    
    await Promise.all(
      patterns.map(pattern => this.redis.eval(
        `for _,k in ipairs(redis.call('keys', ARGV[1])) do redis.call('del', k) end`,
        0,
        pattern
      ))
    );
  }
}