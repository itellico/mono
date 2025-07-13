import { PrismaClient } from '@prisma/client';
import { FastifyRedis } from '@fastify/redis';
import { z } from 'zod';
import type { FastifyBaseLogger } from 'fastify';
import { getOrSetCache } from '../utils/cache-utils';

// Input validation schemas
const createJobPostingSchema = z.object({
  tenantId: z.number().int().positive(),
  postedById: z.number().int().positive(),
  profileId: z.string().uuid(),
  profileType: z.enum(['client', 'agency']),
  companyName: z.string().optional(),
  verified: z.boolean().optional().default(false),
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(50),
  type: z.string().min(1).max(50),
  description: z.string().min(1),
  requirements: z.object({
    skills: z.array(z.string()).optional(),
    experience: z.string().optional(),
    languages: z.array(z.string()).optional(),
    certifications: z.array(z.string()).optional(),
  }),
  targetProfiles: z.object({
    categories: z.array(z.string()),
    gender: z.array(z.string()).optional(),
    ageRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
    location: z.object({
      city: z.string().optional(),
      radius: z.number().optional(),
      remote: z.boolean().optional(),
    }).optional(),
    experience: z.string().optional(),
    specificRequirements: z.record(z.any()).optional(),
  }),
  applicationDeadline: z.string().datetime(),
  maxApplications: z.number().int().positive().optional(),
  autoCloseOnMax: z.boolean().optional().default(false),
  applicationQuestions: z.array(z.object({
    question: z.string(),
    type: z.enum(['text', 'textarea', 'select', 'multiselect']),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
  })).optional(),
  jobDates: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    duration: z.string().optional(),
    flexible: z.boolean().optional(),
  }),
  compensation: z.object({
    type: z.enum(['fixed', 'hourly', 'daily', 'negotiable']),
    amount: z.number().optional(),
    currency: z.string().optional(),
    description: z.string().optional(),
  }),
  visibility: z.enum(['public', 'private', 'unlisted']).optional().default('public'),
  featured: z.boolean().optional().default(false),
  boost: z.object({
    boosted: z.boolean(),
    boostUntil: z.string().datetime().optional(),
    boostBudget: z.number().optional(),
  }).optional(),
});

const updateJobPostingSchema = createJobPostingSchema.partial().extend({
  id: z.number().int().positive(),
});

const searchJobPostingsSchema = z.object({
  tenantId: z.number().int().positive(),
  category: z.string().optional(),
  type: z.string().optional(),
  location: z.object({
    city: z.string().optional(),
    radius: z.number().optional(),
  }).optional(),
  compensation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  status: z.enum(['draft', 'published', 'closed', 'filled']).optional(),
  featured: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  sortBy: z.enum(['publishedAt', 'applicationDeadline', 'compensation', 'views']).optional().default('publishedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const createApplicationSchema = z.object({
  jobId: z.number().int().positive(),
  applicantId: z.number().int().positive(),
  profileId: z.string().uuid(),
  coverLetter: z.string().optional(),
  answers: z.record(z.any()).optional(),
  portfolio: z.array(z.object({
    url: z.string().url(),
    title: z.string(),
    type: z.string(),
  })).optional(),
  availability: z.object({
    startDate: z.string().datetime(),
    flexible: z.boolean(),
    notes: z.string().optional(),
  }).optional(),
  proposedRate: z.object({
    amount: z.number(),
    currency: z.string(),
    type: z.enum(['fixed', 'hourly', 'daily']),
  }).optional(),
});

export type CreateJobPostingInput = z.infer<typeof createJobPostingSchema>;
export type UpdateJobPostingInput = z.infer<typeof updateJobPostingSchema>;
export type SearchJobPostingsInput = z.infer<typeof searchJobPostingsSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export class JobPostingService {
  private prisma: PrismaClient;
  private redis: FastifyRedis;
  private logger?: FastifyBaseLogger;

  constructor(prisma: PrismaClient, redis: FastifyRedis, logger?: FastifyBaseLogger) {
    this.prisma = prisma;
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Create a new job posting
   */
  async createJobPosting(input: CreateJobPostingInput) {
    const validated = createJobPostingSchema.parse(input);
    
    const jobPosting = await this.prisma.jobPosting.create({
      data: {
        ...validated,
        status: 'draft',
      },
    });
    
    // Invalidate caches
    await this.invalidateJobCache(validated.tenantId);
    
    return jobPosting;
  }

  /**
   * Update job posting
   */
  async updateJobPosting(input: UpdateJobPostingInput) {
    const validated = updateJobPostingSchema.parse(input);
    const { id, ...updates } = validated;
    
    // Get existing job to check ownership
    const existing = await this.prisma.jobPosting.findUnique({
      where: { id },
    });
    
    if (!existing) {
      throw new Error('Job posting not found');
    }
    
    // Update job posting
    const jobPosting = await this.prisma.jobPosting.update({
      where: { id },
      data: updates,
    });
    
    // Invalidate caches
    await this.invalidateJobCache(existing.tenantId);
    
    return jobPosting;
  }

  /**
   * Publish job posting
   */
  async publishJob(jobId: number, publisherId: number) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: jobId },
    });
    
    if (!job) {
      throw new Error('Job posting not found');
    }
    
    if (job.postedById !== publisherId) {
      throw new Error('Unauthorized to publish this job');
    }
    
    if (job.status !== 'draft') {
      throw new Error('Job is already published');
    }
    
    const updatedJob = await this.prisma.jobPosting.update({
      where: { id: jobId },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });
    
    // Invalidate caches
    await this.invalidateJobCache(job.tenantId);
    
    return updatedJob;
  }

  /**
   * Close job posting
   */
  async closeJob(jobId: number, closerId: number, filled: boolean = false) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: jobId },
    });
    
    if (!job) {
      throw new Error('Job posting not found');
    }
    
    if (job.postedById !== closerId) {
      throw new Error('Unauthorized to close this job');
    }
    
    const updatedJob = await this.prisma.jobPosting.update({
      where: { id: jobId },
      data: {
        status: filled ? 'filled' : 'closed',
        filledAt: filled ? new Date() : undefined,
      },
    });
    
    // Invalidate caches
    await this.invalidateJobCache(job.tenantId);
    
    return updatedJob;
  }

  /**
   * Get job posting by UUID
   */
  async getJobByUuid(uuid: string, incrementViews: boolean = false) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { uuid },
      include: {
        postedBy: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });
    
    if (!job) {
      return null;
    }
    
    // Increment view count if requested
    if (incrementViews && job.status === 'published') {
      await this.prisma.jobPosting.update({
        where: { id: job.id },
        data: {
          stats: {
            ...((job.stats as any) || {}),
            views: ((job.stats as any)?.views || 0) + 1,
          },
        },
      });
    }
    
    return job;
  }

  /**
   * Search job postings
   */
  async searchJobs(input: SearchJobPostingsInput) {
    const validated = searchJobPostingsSchema.parse(input);
    
    // Build where clause
    const where: any = {
      tenantId: validated.tenantId,
    };
    
    if (validated.status) {
      where.status = validated.status;
    } else {
      // Default to showing only published jobs
      where.status = 'published';
    }
    
    if (validated.category) {
      where.category = validated.category;
    }
    
    if (validated.type) {
      where.type = validated.type;
    }
    
    if (validated.featured !== undefined) {
      where.featured = validated.featured;
    }
    
    if (validated.search) {
      where.OR = [
        { title: { contains: validated.search, mode: 'insensitive' } },
        { description: { contains: validated.search, mode: 'insensitive' } },
        { companyName: { contains: validated.search, mode: 'insensitive' } },
      ];
    }
    
    // Build orderBy
    const orderBy: any = {};
    orderBy[validated.sortBy] = validated.sortOrder;
    
    // Execute query
    const [jobs, total] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        orderBy,
        skip: validated.offset,
        take: validated.limit,
        include: {
          _count: {
            select: {
              applications: true,
            },
          },
        },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);
    
    return {
      jobs,
      total,
      hasMore: validated.offset + validated.limit < total,
    };
  }

  /**
   * Get featured jobs (cached)
   */
  async getFeaturedJobs(tenantId: number, limit: number = 6) {
    const cacheKey = `tenant:${tenantId}:jobs:featured`;
    
    return getOrSetCache(
      this.redis,
      cacheKey,
      300, // 5 minutes
      async () => {
        const jobs = await this.prisma.jobPosting.findMany({
          where: {
            tenantId,
            status: 'published',
            featured: true,
            applicationDeadline: {
              gt: new Date(),
            },
          },
          orderBy: {
            publishedAt: 'desc',
          },
          take: limit,
          include: {
            _count: {
              select: {
                applications: true,
              },
            },
          },
        });
        
        return jobs;
      }
    );
  }

  /**
   * Get job statistics
   */
  async getJobStats(jobId: number) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: jobId },
      select: {
        stats: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });
    
    if (!job) {
      throw new Error('Job posting not found');
    }
    
    const applications = await this.prisma.jobApplication.groupBy({
      by: ['status'],
      where: { jobId },
      _count: true,
    });
    
    const statusCounts = applications.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      stats: job.stats,
      totalApplications: job._count.applications,
      applicationsByStatus: statusCounts,
    };
  }

  /**
   * Create job application
   */
  async createApplication(input: CreateApplicationInput) {
    const validated = createApplicationSchema.parse(input);
    
    // Check if job exists and is accepting applications
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: validated.jobId },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });
    
    if (!job) {
      throw new Error('Job posting not found');
    }
    
    if (job.status !== 'published') {
      throw new Error('Job is not accepting applications');
    }
    
    if (new Date(job.applicationDeadline) < new Date()) {
      throw new Error('Application deadline has passed');
    }
    
    if (job.maxApplications && job._count.applications >= job.maxApplications) {
      throw new Error('Maximum applications reached');
    }
    
    // Check if already applied
    const existingApplication = await this.prisma.jobApplication.findFirst({
      where: {
        jobId: validated.jobId,
        applicantId: validated.applicantId,
      },
    });
    
    if (existingApplication) {
      throw new Error('Already applied to this job');
    }
    
    // Create application
    const application = await this.prisma.$transaction(async (tx) => {
      // Create the application
      const app = await tx.jobApplication.create({
        data: {
          ...validated,
          status: 'draft',
        },
      });
      
      // Update job stats
      await tx.jobPosting.update({
        where: { id: validated.jobId },
        data: {
          stats: {
            ...((job.stats as any) || {}),
            applications: ((job.stats as any)?.applications || 0) + 1,
          },
        },
      });
      
      // Check if we should auto-close
      if (job.autoCloseOnMax && job.maxApplications && 
          job._count.applications + 1 >= job.maxApplications) {
        await tx.jobPosting.update({
          where: { id: validated.jobId },
          data: { status: 'closed' },
        });
      }
      
      return app;
    });
    
    // Invalidate caches
    await this.invalidateJobCache(job.tenantId);
    
    return application;
  }

  /**
   * Submit job application
   */
  async submitApplication(applicationId: number, applicantId: number) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
      },
    });
    
    if (!application) {
      throw new Error('Application not found');
    }
    
    if (application.applicantId !== applicantId) {
      throw new Error('Unauthorized to submit this application');
    }
    
    if (application.status !== 'draft') {
      throw new Error('Application already submitted');
    }
    
    const updatedApplication = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status: 'pending',
        appliedAt: new Date(),
      },
    });
    
    return updatedApplication;
  }

  /**
   * Get applications for a job
   */
  async getJobApplications(jobId: number, postedById: number, status?: string) {
    // Verify ownership
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: jobId },
    });
    
    if (!job || job.postedById !== postedById) {
      throw new Error('Unauthorized to view applications');
    }
    
    const where: any = { jobId };
    if (status) {
      where.status = status;
    }
    
    const applications = await this.prisma.jobApplication.findMany({
      where,
      orderBy: {
        appliedAt: 'desc',
      },
      include: {
        applicant: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    
    return applications;
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    applicationId: number, 
    postedById: number,
    status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted'
  ) {
    // Get application with job details
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
      },
    });
    
    if (!application) {
      throw new Error('Application not found');
    }
    
    if (application.job.postedById !== postedById) {
      throw new Error('Unauthorized to update this application');
    }
    
    const statusUpdateData: any = {
      status,
      statusHistory: [
        ...((application.statusHistory as any[]) || []),
        { status, changedAt: new Date() },
      ],
    };
    
    // Add specific timestamp fields
    if (status === 'reviewing' && !application.viewedAt) {
      statusUpdateData.viewedAt = new Date();
    } else if (status === 'shortlisted') {
      statusUpdateData.shortlistedAt = new Date();
    } else if (status === 'rejected') {
      statusUpdateData.rejectedAt = new Date();
    } else if (status === 'accepted') {
      statusUpdateData.acceptedAt = new Date();
    }
    
    const updatedApplication = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: statusUpdateData,
    });
    
    return updatedApplication;
  }

  /**
   * Helper: Invalidate job-related caches
   */
  private async invalidateJobCache(tenantId: number) {
    const patterns = [
      `tenant:${tenantId}:jobs:*`,
      `tenant:${tenantId}:stats:jobs:*`,
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