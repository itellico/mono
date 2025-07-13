/**
 * Gig Offering Service V2
 * 
 * Enhanced version following all best practices:
 * - Three-layer caching strategy
 * - UUID-first API responses
 * - Proper Redis key naming
 * - Tenant isolation
 * - Performance optimizations
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { cache } from '../lib/cache';
import { nanoid } from 'nanoid';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

// Cache TTLs based on data characteristics
const CACHE_TTL = {
  GIG_LIST: 300,         // 5 minutes for dynamic lists
  GIG_DETAIL: 900,       // 15 minutes for gig details
  GIG_STATS: 1800,       // 30 minutes for statistics
  FEATURED_GIGS: 3600,   // 1 hour for featured content
  CATEGORY_STATS: 7200,  // 2 hours for category statistics
  SEARCH_RESULTS: 300,   // 5 minutes for search results
} as const;

export interface CreateGigOfferingData {
  tenantId: number;
  talentId: number;
  profileId: string;
  title: string;
  category: string;
  subcategory?: string;
  description: string;
  highlights?: string[];
  requirements?: Record<string, any>;
  packages: Array<{
    name: string;
    description: string;
    deliverables: string[];
    price: number;
    currency: string;
    deliveryTime: number;
    revisions: number;
    features?: string[];
  }>;
  extras?: Array<{
    id?: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    deliveryTime: number;
  }>;
  gallery?: {
    images?: Array<{
      url: string;
      alt?: string;
      order: number;
    }>;
    videos?: Array<{
      url: string;
      thumbnail?: string;
      title?: string;
      order: number;
    }>;
  };
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  tags?: string[];
  availability?: {
    expressDelivery?: boolean;
    expressPrice?: number;
    expressTime?: number;
    autoAccept?: boolean;
    timezone?: string;
    workingHours?: Record<string, any>;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

export interface SearchGigFilters {
  tenantId: number;
  status?: string;
  category?: string;
  subcategory?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  deliveryTime?: number;
  featured?: boolean;
  talentLevel?: string;
  minRating?: number;
  talentId?: number;
  accountId?: number;
  includeUnpublished?: boolean;
}

export class GigOfferingServiceV2 {
  /**
   * Create a new gig offering with full caching invalidation
   */
  async createGigOffering(data: CreateGigOfferingData) {
    // Generate slug from title
    const slug = await this.generateUniqueSlug(data.title, data.tenantId);

    // Calculate starting price
    const startingPrice = Math.min(...data.packages.map(p => p.price));

    // Assign IDs to packages and extras
    const packagesWithIds = data.packages.map((pkg, index) => ({
      ...pkg,
      id: `pkg_${nanoid(10)}`,
      order: index,
    }));

    const extrasWithIds = data.extras?.map((extra, index) => ({
      ...extra,
      id: extra.id || `ext_${nanoid(10)}`,
      order: index,
    }));

    // Create gig offering
    const gig = await prisma.gigOffering.create({
      data: {
        ...data,
        slug,
        status: 'draft',
        packages: packagesWithIds,
        extras: extrasWithIds,
        startingPrice,
        stats: {
          views: 0,
          impressions: 0,
          clicks: 0,
          orders: 0,
          totalRevenue: 0,
          avgRating: 0,
          totalReviews: 0,
          completionRate: 0,
          avgResponseTime: '1 hour',
        },
        searchVector: this.generateSearchVector(data),
      },
      select: {
        id: true,
        uuid: true,
        title: true,
        slug: true,
        status: true,
        createdAt: true,
      }
    });

    // Invalidate all cache layers
    await this.invalidateGigCache(data.tenantId);

    // Return UUID-first response
    return {
      uuid: gig.uuid,
      title: gig.title,
      slug: gig.slug,
      status: gig.status,
      createdAt: gig.createdAt,
    };
  }

  /**
   * Get gig offering by UUID with three-layer caching
   */
  async getGigOfferingByUuid(uuid: string, tenantId: number, includePrivate: boolean = false) {
    const cacheKey = `tenant:${tenantId}:gig:${uuid}:detail`;

    // Try Redis cache first (Layer 2)
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Query database with tenant isolation
    const where: Prisma.GigOfferingWhereInput = {
      uuid,
      tenantId,
    };

    if (!includePrivate) {
      where.status = 'published';
    }

    const gig = await prisma.gigOffering.findFirst({
      where,
      include: {
        talent: {
          select: {
            uuid: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            bio: true,
            verified: true,
            createdAt: true,
            timezone: true,
            languages: true,
          }
        },
        reviews: {
          select: {
            uuid: true,
            rating: true,
            comment: true,
            createdAt: true,
            reviewer: {
              select: {
                uuid: true,
                firstName: true,
                lastName: true,
                profilePhotoUrl: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          }
        }
      }
    });

    if (!gig) {
      return null;
    }

    // Transform to UUID-first response
    const response = this.transformGigToPublicResponse(gig);

    // Store in Redis cache
    await cache.setex(cacheKey, CACHE_TTL.GIG_DETAIL, JSON.stringify(response));

    return response;
  }

  /**
   * Get gig offering by slug with caching
   */
  async getGigOfferingBySlug(slug: string, tenantId: number) {
    const cacheKey = `tenant:${tenantId}:gig:slug:${slug}`;

    // Try Redis cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Query database
    const gig = await prisma.gigOffering.findFirst({
      where: {
        slug,
        tenantId,
        status: 'published',
      },
      include: {
        talent: {
          select: {
            uuid: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            bio: true,
            verified: true,
            createdAt: true,
            timezone: true,
            languages: true,
          }
        },
        reviews: {
          select: {
            uuid: true,
            rating: true,
            comment: true,
            categories: true,
            wouldRecommend: true,
            createdAt: true,
            helpful: true,
            reviewer: {
              select: {
                uuid: true,
                firstName: true,
                lastName: true,
                profilePhotoUrl: true,
              }
            }
          },
          orderBy: [
            { helpful: 'desc' },
            { createdAt: 'desc' }
          ],
          take: 10,
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          }
        }
      }
    });

    if (!gig) {
      return null;
    }

    // Transform to UUID-first response
    const response = this.transformGigToPublicResponse(gig);

    // Store in Redis cache
    await cache.setex(cacheKey, CACHE_TTL.GIG_DETAIL, JSON.stringify(response));

    return response;
  }

  /**
   * Search gig offerings with optimized caching
   */
  async searchGigOfferings({
    filters,
    page = 1,
    limit = 20,
    sortBy = 'popular'
  }: {
    filters: SearchGigFilters;
    page: number;
    limit: number;
    sortBy: string;
  }) {
    // Generate cache key from filters
    const cacheHash = this.generateCacheHash(filters, page, limit, sortBy);
    const cacheKey = `tenant:${filters.tenantId}:gigs:search:${cacheHash}`;

    // Try Redis cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Build query
    const where: Prisma.GigOfferingWhereInput = {
      tenantId: filters.tenantId,
    };

    if (filters.status) where.status = filters.status;
    else if (!filters.includeUnpublished) where.status = 'published';

    if (filters.category) where.category = filters.category;
    if (filters.subcategory) where.subcategory = filters.subcategory;
    if (filters.featured !== undefined) where.featured = filters.featured;
    if (filters.talentId) where.talentId = filters.talentId;
    if (filters.accountId) where.accountId = filters.accountId;

    // Price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.startingPrice = {};
      if (filters.minPrice !== undefined) where.startingPrice.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.startingPrice.lte = filters.maxPrice;
    }

    // Delivery time filter
    if (filters.deliveryTime) {
      where.packages = {
        some: {
          deliveryTime: { lte: filters.deliveryTime }
        }
      };
    }

    // Rating filter
    if (filters.minRating) {
      where.stats = {
        path: ['avgRating'],
        gte: filters.minRating,
      };
    }

    // Search filter using full-text search
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search.toLowerCase() } },
      ];
    }

    // Get total count
    const total = await prisma.gigOffering.count({ where });

    // Determine sort order
    let orderBy: Prisma.GigOfferingOrderByWithRelationInput | Prisma.GigOfferingOrderByWithRelationInput[] = {};
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'price_low':
        orderBy = { startingPrice: 'asc' };
        break;
      case 'price_high':
        orderBy = { startingPrice: 'desc' };
        break;
      case 'rating':
        orderBy = [
          { stats: { path: ['avgRating'] } },
          { stats: { path: ['totalReviews'] } }
        ];
        break;
      case 'popular':
        orderBy = [
          { stats: { path: ['totalOrders'] } },
          { stats: { path: ['avgRating'] } }
        ];
        break;
      case 'delivery_fast':
        orderBy = { packages: { _min: { deliveryTime: 'asc' } } };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Execute query
    const gigs = await prisma.gigOffering.findMany({
      where,
      include: {
        talent: {
          select: {
            uuid: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            verified: true,
          }
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get category statistics for filters
    const categoryStats = await this.getCategoryStats(filters.tenantId);

    // Transform to UUID-first responses
    const transformedGigs = gigs.map(gig => this.transformGigToListResponse(gig));

    const result = {
      gigs: transformedGigs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        categories: categoryStats,
        priceRange: await this.getPriceRange(filters.tenantId, filters.category),
      }
    };

    // Cache the results
    await cache.setex(cacheKey, CACHE_TTL.SEARCH_RESULTS, JSON.stringify(result));

    return result;
  }

  /**
   * Update gig offering with cache invalidation
   */
  async updateGigOffering(
    id: number, 
    data: Partial<CreateGigOfferingData>, 
    tenantId: number,
    isAdminUpdate: boolean = false
  ) {
    // First verify the gig belongs to this tenant
    const existing = await prisma.gigOffering.findFirst({
      where: { id, tenantId },
      select: { uuid: true, talentId: true },
    });

    if (!existing) {
      throw new Error('Gig offering not found');
    }

    // Recalculate starting price if packages changed
    let startingPrice = undefined;
    if (data.packages) {
      startingPrice = Math.min(...data.packages.map(p => p.price));
    }

    // Update the gig
    const updated = await prisma.gigOffering.update({
      where: { id },
      data: {
        ...data,
        startingPrice,
        updatedAt: new Date(),
        searchVector: data.title || data.description 
          ? this.generateSearchVector(data as any)
          : undefined,
      },
      select: {
        id: true,
        uuid: true,
        title: true,
        status: true,
        featured: true,
        verified: true,
        updatedAt: true,
      }
    });

    // Invalidate all cache layers
    await this.invalidateGigCache(tenantId, existing.uuid);

    // Return UUID-first response
    return {
      uuid: updated.uuid,
      title: updated.title,
      status: updated.status,
      featured: updated.featured,
      verified: updated.verified,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Publish a gig offering
   */
  async publishGigOffering(id: number, tenantId: number, publishedById: number) {
    const gig = await prisma.gigOffering.findFirst({
      where: { id, tenantId, status: 'draft' },
      select: { uuid: true, title: true },
    });

    if (!gig) {
      throw new Error('Gig offering not found or already published');
    }

    // Validate gig is ready for publishing
    // TODO: Add validation logic

    const published = await prisma.gigOffering.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
      select: {
        uuid: true,
        publishedAt: true,
      }
    });

    // Invalidate caches
    await this.invalidateGigCache(tenantId, gig.uuid);

    return {
      uuid: published.uuid,
      publishedAt: published.publishedAt,
    };
  }

  /**
   * Get gig statistics with caching
   */
  async getGigStats(id: number, tenantId: number) {
    const gig = await prisma.gigOffering.findFirst({
      where: { id, tenantId },
      select: { uuid: true }
    });

    if (!gig) {
      throw new Error('Gig offering not found');
    }

    const cacheKey = `tenant:${tenantId}:gig:${gig.uuid}:stats`;

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get comprehensive stats
    const [gigData, bookingStats, reviewStats] = await Promise.all([
      prisma.gigOffering.findUnique({
        where: { id },
        select: {
          stats: true,
          _count: {
            select: {
              bookings: true,
              reviews: true,
            }
          }
        }
      }),
      prisma.gigBooking.groupBy({
        by: ['status'],
        where: { gigId: id },
        _count: { id: true },
        _sum: { totalPrice: true },
      }),
      prisma.gigReview.aggregate({
        where: { gigId: id },
        _avg: {
          rating: true,
          categories: {
            communication: true,
            quality: true,
            delivery: true,
            value: true,
          }
        },
        _count: {
          id: true,
        }
      })
    ]);

    const stats = {
      ...(gigData?.stats as any),
      totalOrders: gigData?._count.bookings || 0,
      totalReviews: gigData?._count.reviews || 0,
      totalRevenue: bookingStats
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + (s._sum.totalPrice || 0), 0),
      avgRating: reviewStats._avg.rating || 0,
      categoryRatings: {
        communication: reviewStats._avg.categories?.communication || 0,
        quality: reviewStats._avg.categories?.quality || 0,
        delivery: reviewStats._avg.categories?.delivery || 0,
        value: reviewStats._avg.categories?.value || 0,
      },
      ordersByStatus: bookingStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {} as Record<string, number>),
    };

    // Cache the stats
    await cache.setex(cacheKey, CACHE_TTL.GIG_STATS, JSON.stringify(stats));

    return stats;
  }

  /**
   * Get gig reviews with pagination
   */
  async getGigReviews(
    gigId: number,
    tenantId: number,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
    } = {}
  ) {
    const { page = 1, limit = 10, sortBy = 'helpful' } = options;

    // Verify gig belongs to tenant
    const gig = await prisma.gigOffering.findFirst({
      where: { id: gigId, tenantId },
      select: { uuid: true }
    });

    if (!gig) {
      throw new Error('Gig offering not found');
    }

    // Determine sort order
    let orderBy: Prisma.GigReviewOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'rating_high':
        orderBy = { rating: 'desc' };
        break;
      case 'rating_low':
        orderBy = { rating: 'asc' };
        break;
      case 'helpful':
      default:
        orderBy = { helpful: 'desc' };
    }

    const [total, reviews, breakdown] = await Promise.all([
      prisma.gigReview.count({ where: { gigId } }),
      prisma.gigReview.findMany({
        where: { gigId },
        include: {
          reviewer: {
            select: {
              uuid: true,
              firstName: true,
              lastName: true,
              profilePhotoUrl: true,
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.gigReview.aggregate({
        where: { gigId },
        _avg: {
          categories: {
            communication: true,
            quality: true,
            delivery: true,
            value: true,
          }
        }
      })
    ]);

    return {
      reviews: reviews.map(review => ({
        uuid: review.uuid,
        rating: review.rating,
        comment: review.comment,
        categories: review.categories,
        wouldRecommend: review.wouldRecommend,
        createdAt: review.createdAt,
        helpful: review.helpful,
        reviewer: review.reviewer,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      breakdown: {
        communication: breakdown._avg.categories?.communication || 0,
        quality: breakdown._avg.categories?.quality || 0,
        delivery: breakdown._avg.categories?.delivery || 0,
        value: breakdown._avg.categories?.value || 0,
      }
    };
  }

  /**
   * Increment view count (fire and forget)
   */
  async incrementViewCount(id: number, tenantId: number) {
    try {
      // Use raw query for atomic increment
      await prisma.$executeRaw`
        UPDATE "GigOffering" 
        SET stats = jsonb_set(
          stats,
          '{views}',
          to_jsonb(COALESCE((stats->>'views')::int, 0) + 1)
        )
        WHERE id = ${id} AND "tenantId" = ${tenantId}
      `;

      // Invalidate stats cache only
      const gig = await prisma.gigOffering.findUnique({
        where: { id },
        select: { uuid: true }
      });

      if (gig) {
        await cache.del(`tenant:${tenantId}:gig:${gig.uuid}:stats`);
      }
    } catch (error) {
      // Log error but don't throw - this is fire and forget
      console.error('Failed to increment view count:', error);
    }
  }

  /**
   * Transform gig to UUID-first public response (full details)
   */
  private transformGigToPublicResponse(gig: any) {
    return {
      uuid: gig.uuid,
      title: gig.title,
      slug: gig.slug,
      category: gig.category,
      subcategory: gig.subcategory,
      description: gig.description,
      highlights: gig.highlights || [],
      talent: gig.talent ? {
        uuid: gig.talent.uuid,
        firstName: gig.talent.firstName,
        lastName: gig.talent.lastName,
        profilePhotoUrl: gig.talent.profilePhotoUrl,
        bio: gig.talent.bio,
        verified: gig.talent.verified,
        memberSince: gig.talent.createdAt,
        timezone: gig.talent.timezone,
        languages: gig.talent.languages || [],
        responseTime: (gig.stats as any)?.avgResponseTime || '1 hour',
      } : undefined,
      packages: gig.packages,
      extras: gig.extras || [],
      gallery: gig.gallery || { images: [], videos: [] },
      requirements: gig.requirements || { questions: [] },
      faqs: gig.faqs || [],
      stats: {
        avgRating: (gig.stats as any)?.avgRating || 0,
        totalReviews: gig._count?.reviews || (gig.stats as any)?.totalReviews || 0,
        totalOrders: gig._count?.bookings || (gig.stats as any)?.totalOrders || 0,
        completionRate: (gig.stats as any)?.completionRate || 0,
        onTimeDelivery: (gig.stats as any)?.onTimeDelivery || 0,
        repeatBuyers: (gig.stats as any)?.repeatBuyers || 0,
      },
      reviews: gig.reviews?.map((review: any) => ({
        uuid: review.uuid,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        helpful: review.helpful || 0,
        reviewer: {
          uuid: review.reviewer.uuid,
          firstName: review.reviewer.firstName,
          lastName: review.reviewer.lastName,
          profilePhotoUrl: review.reviewer.profilePhotoUrl,
        }
      })) || [],
      tags: gig.tags || [],
      seo: gig.seo || { keywords: [] },
      featured: gig.featured,
      verified: gig.verified,
      availability: gig.availability,
      publishedAt: gig.publishedAt,
      createdAt: gig.createdAt,
    };
  }

  /**
   * Transform gig to UUID-first list response (minimal details)
   */
  private transformGigToListResponse(gig: any) {
    return {
      uuid: gig.uuid,
      title: gig.title,
      slug: gig.slug,
      category: gig.category,
      subcategory: gig.subcategory,
      talent: {
        uuid: gig.talent.uuid,
        firstName: gig.talent.firstName,
        lastName: gig.talent.lastName,
        profilePhotoUrl: gig.talent.profilePhotoUrl,
        level: gig.talentLevel,
        verified: gig.talent.verified,
      },
      packages: gig.packages.map((pkg: any) => ({
        name: pkg.name,
        price: pkg.price,
        currency: pkg.currency,
        deliveryTime: pkg.deliveryTime,
      })),
      startingPrice: gig.startingPrice,
      currency: gig.packages[0]?.currency || 'USD',
      mainImage: (gig.gallery as any)?.images?.[0]?.url,
      stats: {
        avgRating: (gig.stats as any)?.avgRating || 0,
        totalReviews: gig._count?.reviews || (gig.stats as any)?.totalReviews || 0,
        totalOrders: gig._count?.bookings || (gig.stats as any)?.totalOrders || 0,
        completionRate: (gig.stats as any)?.completionRate || 0,
      },
      badges: gig.badges || [],
      featured: gig.featured,
      expressDelivery: (gig.availability as any)?.expressDelivery || false,
    };
  }

  /**
   * Get category statistics for filters
   */
  private async getCategoryStats(tenantId: number) {
    const cacheKey = `tenant:${tenantId}:gigs:category-stats`;

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const stats = await prisma.gigOffering.groupBy({
      by: ['category'],
      where: {
        tenantId,
        status: 'published',
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        }
      }
    });

    const categoryStats = stats.map(stat => ({
      value: stat.category,
      label: stat.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: stat._count.id,
    }));

    // Cache for longer as categories don't change often
    await cache.setex(cacheKey, CACHE_TTL.CATEGORY_STATS, JSON.stringify(categoryStats));

    return categoryStats;
  }

  /**
   * Get price range for a category
   */
  private async getPriceRange(tenantId: number, category?: string) {
    const where: Prisma.GigOfferingWhereInput = {
      tenantId,
      status: 'published',
    };

    if (category) {
      where.category = category;
    }

    const result = await prisma.gigOffering.aggregate({
      where,
      _min: {
        startingPrice: true,
      },
      _max: {
        startingPrice: true,
      }
    });

    return {
      min: result._min.startingPrice || 0,
      max: result._max.startingPrice || 1000,
    };
  }

  /**
   * Generate unique slug for gig offering
   */
  private async generateUniqueSlug(title: string, tenantId: number): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.gigOffering.findFirst({
        where: { slug, tenantId },
        select: { id: true },
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * Generate search vector for full-text search
   */
  private generateSearchVector(data: Partial<CreateGigOfferingData>): string {
    const searchableText = [
      data.title,
      data.description,
      data.category,
      data.subcategory,
      ...(data.highlights || []),
      ...(data.tags || []),
      ...(data.packages?.map(p => p.name) || []),
      ...(data.packages?.flatMap(p => p.deliverables) || []),
    ].filter(Boolean).join(' ');

    return searchableText.toLowerCase();
  }

  /**
   * Generate cache hash from filters
   */
  private generateCacheHash(filters: any, page: number, limit: number, sortBy: string): string {
    const filterString = JSON.stringify({ ...filters, page, limit, sortBy });
    return createHash('md5').update(filterString).digest('hex').substring(0, 8);
  }

  /**
   * Invalidate all gig-related caches
   */
  private async invalidateGigCache(tenantId: number, gigUuid?: string) {
    const patterns = [
      `tenant:${tenantId}:gigs:*`,            // All gig lists
      `tenant:${tenantId}:gig:search:*`,      // All search results
      `tenant:${tenantId}:gigs:category-stats`, // Category stats
    ];

    if (gigUuid) {
      patterns.push(`tenant:${tenantId}:gig:${gigUuid}:*`); // Specific gig data
      patterns.push(`tenant:${tenantId}:gig:slug:*`);       // Slug lookups
    }

    // Clear Redis cache patterns
    for (const pattern of patterns) {
      const keys = await cache.keys(pattern);
      if (keys.length > 0) {
        await cache.del(...keys);
      }
    }

    // Also invalidate Next.js cache tags (would be done in the API route)
    // revalidateTag(`tenant-${tenantId}-gigs`);
  }
}

// Export singleton instance
export const gigOfferingServiceV2 = new GigOfferingServiceV2();