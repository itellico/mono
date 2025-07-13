/**
 * Job Posting Service V2
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
  JOB_LIST: 300,        // 5 minutes for dynamic lists
  JOB_DETAIL: 900,      // 15 minutes for job details
  JOB_STATS: 1800,      // 30 minutes for statistics
  FEATURED_JOBS: 3600,  // 1 hour for featured content
  SEARCH_RESULTS: 300,  // 5 minutes for search results
} as const;

export interface CreateJobPostingData {
  tenantId: number;
  postedById: number;
  profileId: string;
  profileType: string;
  companyName?: string;
  title: string;
  category: string;
  type: string;
  description: string;
  requirements: string[];
  targetProfiles: Record<string, any>;
  applicationDeadline?: Date;
  maxApplications?: number;
  autoCloseOnMax?: boolean;
  applicationQuestions?: Array<{
    id: string;
    question: string;
    type: string;
    required: boolean;
    options?: string[];
  }>;
  jobDates: Record<string, any>;
  compensation: Record<string, any>;
  visibility?: string;
  featured?: boolean;
  metadata?: Record<string, any>;
}

export interface SearchJobFilters {
  tenantId: number;
  status?: string;
  category?: string;
  type?: string;
  location?: string;
  search?: string;
  compensationType?: string;
  experienceLevel?: string;
  featured?: boolean;
  postedById?: number;
  accountId?: number;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

export class JobPostingServiceV2 {
  /**
   * Create a new job posting with full caching invalidation
   */
  async createJobPosting(data: CreateJobPostingData) {
    // Generate slug from title
    const slug = await this.generateUniqueSlug(data.title, data.tenantId);

    // Create job posting
    const jobPosting = await prisma.jobPosting.create({
      data: {
        ...data,
        slug,
        status: 'draft',
        stats: {
          views: 0,
          applications: 0,
          saved: 0,
          shares: 0,
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
    await this.invalidateJobCache(data.tenantId);

    // Return UUID-first response
    return {
      uuid: jobPosting.uuid,
      title: jobPosting.title,
      slug: jobPosting.slug,
      status: jobPosting.status,
      createdAt: jobPosting.createdAt,
    };
  }

  /**
   * Get job posting by UUID with three-layer caching
   */
  async getJobPostingByUuid(uuid: string, tenantId: number) {
    const cacheKey = `tenant:${tenantId}:job:${uuid}:detail`;

    // Try Redis cache first (Layer 2)
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Query database with tenant isolation
    const job = await prisma.jobPosting.findFirst({
      where: {
        uuid,
        tenantId,
      },
      include: {
        postedByUser: {
          select: {
            uuid: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            verified: true,
          }
        },
        applications: {
          select: {
            uuid: true,
          }
        },
        savedBy: {
          select: {
            userUuid: true,
          }
        }
      }
    });

    if (!job) {
      return null;
    }

    // Transform to UUID-first response
    const response = this.transformJobToPublicResponse(job);

    // Store in Redis cache
    await cache.setex(cacheKey, CACHE_TTL.JOB_DETAIL, JSON.stringify(response));

    return response;
  }

  /**
   * Search job postings with optimized caching
   */
  async searchJobPostings(
    filters: SearchJobFilters,
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'newest'
  ) {
    // Generate cache key from filters
    const cacheHash = this.generateCacheHash(filters, page, limit, sortBy);
    const cacheKey = `tenant:${filters.tenantId}:jobs:search:${cacheHash}`;

    // Try Redis cache
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Build query
    const where: Prisma.JobPostingWhereInput = {
      tenantId: filters.tenantId,
    };

    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.type) where.type = filters.type;
    if (filters.featured !== undefined) where.featured = filters.featured;
    if (filters.postedById) where.postedById = filters.postedById;
    if (filters.accountId) where.accountId = filters.accountId;
    if (filters.createdAt) where.createdAt = filters.createdAt;

    // Search filter using full-text search
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { companyName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Location filter
    if (filters.location) {
      where.targetProfiles = {
        path: ['location', 'city'],
        string_contains: filters.location,
      };
    }

    // Get total count
    const total = await prisma.jobPosting.count({ where });

    // Determine sort order
    let orderBy: Prisma.JobPostingOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'deadline_soon':
        orderBy = { applicationDeadline: 'asc' };
        break;
      case 'most_viewed':
        orderBy = { stats: { path: ['views'], } };
        break;
      case 'most_applications':
        orderBy = { stats: { path: ['applications'], } };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Execute query
    const jobs = await prisma.jobPosting.findMany({
      where,
      include: {
        postedByUser: {
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
            applications: true,
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform to UUID-first responses
    const transformedJobs = jobs.map(job => this.transformJobToPublicResponse(job));

    const result = {
      jobs: transformedJobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // Cache the results
    await cache.setex(cacheKey, CACHE_TTL.SEARCH_RESULTS, JSON.stringify(result));

    return result;
  }

  /**
   * Update job posting with cache invalidation
   */
  async updateJobPosting(id: number, data: Partial<CreateJobPostingData>, tenantId: number) {
    // First verify the job belongs to this tenant
    const existing = await prisma.jobPosting.findFirst({
      where: { id, tenantId },
      select: { uuid: true },
    });

    if (!existing) {
      throw new Error('Job posting not found');
    }

    // Update the job
    const updated = await prisma.jobPosting.update({
      where: { id },
      data: {
        ...data,
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
        updatedAt: true,
      }
    });

    // Invalidate all cache layers
    await this.invalidateJobCache(tenantId, existing.uuid);

    // Return UUID-first response
    return {
      uuid: updated.uuid,
      title: updated.title,
      status: updated.status,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Publish a job posting
   */
  async publishJobPosting(id: number, tenantId: number, publishedById: number) {
    const job = await prisma.jobPosting.findFirst({
      where: { id, tenantId, status: 'draft' },
      select: { uuid: true, title: true },
    });

    if (!job) {
      throw new Error('Job posting not found or already published');
    }

    // Validate job is ready for publishing
    // TODO: Add validation logic

    const published = await prisma.jobPosting.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
        publishedById,
      },
      select: {
        uuid: true,
        publishedAt: true,
      }
    });

    // Invalidate caches
    await this.invalidateJobCache(tenantId, job.uuid);

    return {
      uuid: published.uuid,
      publishedAt: published.publishedAt,
    };
  }

  /**
   * Increment view count (fire and forget)
   */
  async incrementViewCount(id: number, tenantId: number) {
    try {
      // Use raw query for atomic increment
      await prisma.$executeRaw`
        UPDATE "JobPosting" 
        SET stats = jsonb_set(
          stats,
          '{views}',
          to_jsonb(COALESCE((stats->>'views')::int, 0) + 1)
        )
        WHERE id = ${id} AND "tenantId" = ${tenantId}
      `;

      // Invalidate stats cache only
      const job = await prisma.jobPosting.findUnique({
        where: { id },
        select: { uuid: true }
      });

      if (job) {
        await cache.del(`tenant:${tenantId}:job:${job.uuid}:stats`);
      }
    } catch (error) {
      // Log error but don't throw - this is fire and forget
      console.error('Failed to increment view count:', error);
    }
  }

  /**
   * Get job statistics
   */
  async getJobStats(id: number, tenantId: number) {
    const job = await prisma.jobPosting.findFirst({
      where: { id, tenantId },
      select: { uuid: true }
    });

    if (!job) {
      throw new Error('Job posting not found');
    }

    const cacheKey = `tenant:${tenantId}:job:${job.uuid}:stats`;

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get comprehensive stats
    const [jobData, applicationStats] = await Promise.all([
      prisma.jobPosting.findUnique({
        where: { id },
        select: {
          stats: true,
          _count: {
            select: {
              applications: true,
              savedBy: true,
            }
          }
        }
      }),
      prisma.jobApplication.groupBy({
        by: ['status'],
        where: { jobId: id },
        _count: { id: true },
      })
    ]);

    const stats = {
      views: (jobData?.stats as any)?.views || 0,
      applications: jobData?._count.applications || 0,
      saved: jobData?._count.savedBy || 0,
      shares: (jobData?.stats as any)?.shares || 0,
      applicationsByStatus: applicationStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {} as Record<string, number>),
    };

    // Cache the stats
    await cache.setex(cacheKey, CACHE_TTL.JOB_STATS, JSON.stringify(stats));

    return stats;
  }

  /**
   * Get featured jobs with caching
   */
  async getFeaturedJobs(tenantId: number, limit: number = 10) {
    const cacheKey = `tenant:${tenantId}:jobs:featured`;

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const jobs = await prisma.jobPosting.findMany({
      where: {
        tenantId,
        status: 'published',
        featured: true,
      },
      include: {
        postedByUser: {
          select: {
            uuid: true,
            firstName: true,
            lastName: true,
            companyName: true,
          }
        }
      },
      orderBy: [
        { stats: { path: ['views'] } },
        { publishedAt: 'desc' }
      ],
      take: limit,
    });

    const featuredJobs = jobs.map(job => ({
      uuid: job.uuid,
      title: job.title,
      slug: job.slug,
      category: job.category,
      companyName: job.companyName,
      compensation: job.compensation,
      applicationDeadline: job.applicationDeadline,
      publishedAt: job.publishedAt,
    }));

    // Cache for longer as featured jobs change less frequently
    await cache.setex(cacheKey, CACHE_TTL.FEATURED_JOBS, JSON.stringify(featuredJobs));

    return featuredJobs;
  }

  /**
   * Transform job to UUID-first public response
   */
  private transformJobToPublicResponse(job: any) {
    return {
      uuid: job.uuid,
      title: job.title,
      slug: job.slug,
      category: job.category,
      type: job.type,
      description: job.description,
      requirements: job.requirements,
      targetProfiles: job.targetProfiles,
      applicationDeadline: job.applicationDeadline,
      maxApplications: job.maxApplications,
      jobDates: job.jobDates,
      compensation: job.compensation,
      companyName: job.companyName,
      verified: job.verified,
      featured: job.featured,
      postedBy: job.postedByUser ? {
        uuid: job.postedByUser.uuid,
        firstName: job.postedByUser.firstName,
        lastName: job.postedByUser.lastName,
        profilePhotoUrl: job.postedByUser.profilePhotoUrl,
        verified: job.postedByUser.verified,
      } : undefined,
      stats: {
        views: (job.stats as any)?.views || 0,
        applications: job._count?.applications || (job.stats as any)?.applications || 0,
        saved: job._count?.savedBy || (job.stats as any)?.saved || 0,
      },
      publishedAt: job.publishedAt,
      createdAt: job.createdAt,
    };
  }

  /**
   * Generate unique slug for job posting
   */
  private async generateUniqueSlug(title: string, tenantId: number): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.jobPosting.findFirst({
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
  private generateSearchVector(data: Partial<CreateJobPostingData>): string {
    const searchableText = [
      data.title,
      data.description,
      data.companyName,
      data.category,
      data.type,
      ...(data.requirements || []),
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
   * Invalidate all job-related caches
   */
  private async invalidateJobCache(tenantId: number, jobUuid?: string) {
    const patterns = [
      `tenant:${tenantId}:jobs:*`,           // All job lists
      `tenant:${tenantId}:job:search:*`,     // All search results
    ];

    if (jobUuid) {
      patterns.push(`tenant:${tenantId}:job:${jobUuid}:*`); // Specific job data
    }

    // Clear Redis cache patterns
    for (const pattern of patterns) {
      const keys = await cache.keys(pattern);
      if (keys.length > 0) {
        await cache.del(...keys);
      }
    }

    // Also invalidate Next.js cache tags (would be done in the API route)
    // revalidateTag(`tenant-${tenantId}-jobs`);
  }
}

// Export singleton instance
export const jobPostingServiceV2 = new JobPostingServiceV2();