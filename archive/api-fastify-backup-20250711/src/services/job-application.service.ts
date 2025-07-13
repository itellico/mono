/**
 * Job Application Backend Service
 * 
 * Backend service for managing job applications
 * Direct database interaction for Fastify API routes
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { cache } from '../lib/cache';

const prisma = new PrismaClient();

export interface CreateApplicationData {
  jobId: number;
  applicantId: number;
  profileId: string;
  coverLetter?: string;
  answers?: Array<{
    questionId: string;
    answer: string;
  }>;
  portfolio?: {
    selectedImages: string[];
    customUploads?: string[];
    externalLinks?: string[];
  };
  availability?: {
    confirmedDates: boolean;
    alternativeDates?: Date[];
    notes?: string;
  };
  proposedRate?: {
    amount: number;
    currency: string;
    notes?: string;
  };
}

export interface ApplicationFilters {
  tenantId: number;
  jobId?: number;
  applicantId?: number;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export type ApplicationStatus = 
  | 'draft'
  | 'submitted'
  | 'viewed'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export class JobApplicationService {
  /**
   * Create a new job application
   */
  async createApplication(data: CreateApplicationData, tenantId: number) {
    // Check if already applied
    const existing = await prisma.jobApplication.findFirst({
      where: {
        jobId: data.jobId,
        applicantId: data.applicantId,
      }
    });

    if (existing) {
      throw new Error('You have already applied to this job');
    }

    // Check if job is still accepting applications
    const job = await prisma.jobPosting.findFirst({
      where: {
        id: data.jobId,
        tenantId,
        status: 'published',
      },
      select: {
        maxApplications: true,
        autoCloseOnMax: true,
        applicationDeadline: true,
        _count: {
          select: {
            applications: true,
          }
        }
      }
    });

    if (!job) {
      throw new Error('Job posting not found or not accepting applications');
    }

    // Check deadline
    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      throw new Error('Application deadline has passed');
    }

    // Check max applications
    if (job.maxApplications && job._count.applications >= job.maxApplications) {
      throw new Error('Maximum number of applications reached');
    }

    // Create application
    const application = await prisma.jobApplication.create({
      data: {
        jobId: data.jobId,
        applicantId: data.applicantId,
        profileId: data.profileId,
        coverLetter: data.coverLetter,
        answers: data.answers,
        portfolio: data.portfolio,
        availability: data.availability,
        proposedRate: data.proposedRate,
        status: 'submitted',
        statusHistory: [{
          status: 'submitted',
          changedAt: new Date(),
          changedBy: data.applicantId.toString(),
        }],
      },
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
          }
        }
      }
    });

    // Update job application count
    await prisma.$executeRaw`
      UPDATE "JobPosting" 
      SET stats = jsonb_set(
        stats,
        '{applications}',
        to_jsonb(COALESCE((stats->>'applications')::int, 0) + 1)
      )
      WHERE id = ${data.jobId}
    `;

    // Check if need to auto-close job
    if (job.autoCloseOnMax && job.maxApplications && 
        job._count.applications + 1 >= job.maxApplications) {
      await prisma.jobPosting.update({
        where: { id: data.jobId },
        data: { 
          status: 'filled',
          filledAt: new Date()
        }
      });
    }

    // Clear cache
    await this.clearApplicationCache(tenantId, data.jobId);

    return application;
  }

  /**
   * Get application by ID
   */
  async getApplication(id: number, tenantId: number) {
    const application = await prisma.jobApplication.findFirst({
      where: { id },
      include: {
        job: {
          include: {
            tenant: {
              select: { id: true }
            }
          }
        },
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            email: true,
          }
        }
      }
    });

    if (!application || application.job.tenant.id !== tenantId) {
      return null;
    }

    return application;
  }

  /**
   * Get applications for a job
   */
  async getJobApplications(
    jobId: number,
    tenantId: number,
    filters: {
      status?: string;
      sortBy?: string;
    } = {},
    page: number = 1,
    limit: number = 20
  ) {
    const where: Prisma.JobApplicationWhereInput = {
      jobId,
      job: {
        tenantId
      }
    };

    if (filters.status) {
      where.status = filters.status;
    }

    const total = await prisma.jobApplication.count({ where });

    // Determine sort order
    let orderBy: Prisma.JobApplicationOrderByWithRelationInput = {};
    switch (filters.sortBy) {
      case 'newest':
        orderBy = { appliedAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { appliedAt: 'asc' };
        break;
      default:
        orderBy = { appliedAt: 'desc' };
    }

    const applications = await prisma.jobApplication.findMany({
      where,
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            email: true,
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get user's applications
   */
  async getUserApplications(
    userId: number,
    tenantId: number,
    filters: ApplicationFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    const where: Prisma.JobApplicationWhereInput = {
      applicantId: userId,
      job: {
        tenantId
      }
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.appliedAt = {};
      if (filters.dateFrom) {
        where.appliedAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.appliedAt.lte = filters.dateTo;
      }
    }

    const total = await prisma.jobApplication.count({ where });

    const applications = await prisma.jobApplication.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            uuid: true,
            title: true,
            category: true,
            companyName: true,
            compensation: true,
            applicationDeadline: true,
            postedByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePhotoUrl: true,
              }
            }
          }
        }
      },
      orderBy: { appliedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    id: number,
    status: ApplicationStatus,
    updatedBy: number,
    reason?: string
  ) {
    const application = await prisma.jobApplication.findUnique({
      where: { id },
      include: {
        statusHistory: true
      }
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Add status history entry
    const statusHistory = [
      ...(application.statusHistory as any[] || []),
      {
        status,
        changedAt: new Date(),
        changedBy: updatedBy.toString(),
        reason
      }
    ];

    const updated = await prisma.jobApplication.update({
      where: { id },
      data: {
        status,
        statusHistory,
        viewedAt: status === 'viewed' && !application.viewedAt ? new Date() : undefined,
        shortlistedAt: status === 'shortlisted' ? new Date() : undefined,
      }
    });

    // Clear cache
    await this.clearApplicationCache(0, application.jobId);

    return updated;
  }

  /**
   * Withdraw application
   */
  async withdrawApplication(id: number, userId: number) {
    const application = await prisma.jobApplication.findFirst({
      where: {
        id,
        applicantId: userId
      }
    });

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status === 'withdrawn') {
      throw new Error('Application already withdrawn');
    }

    if (['accepted', 'rejected'].includes(application.status)) {
      throw new Error('Cannot withdraw application after final decision');
    }

    return this.updateApplicationStatus(id, 'withdrawn', userId, 'Withdrawn by applicant');
  }

  /**
   * Bulk update application status
   */
  async bulkUpdateStatus(
    applicationIds: number[],
    status: ApplicationStatus,
    updatedBy: number,
    reason?: string
  ) {
    const results = [];

    for (const id of applicationIds) {
      try {
        const updated = await this.updateApplicationStatus(id, status, updatedBy, reason);
        results.push({ id, success: true, status: updated.status });
      } catch (error) {
        results.push({ 
          id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return results;
  }

  /**
   * Get application statistics for a job
   */
  async getJobApplicationStats(jobId: number, tenantId: number) {
    const stats = await prisma.jobApplication.groupBy({
      by: ['status'],
      where: {
        jobId,
        job: { tenantId }
      },
      _count: {
        id: true
      }
    });

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Get additional stats
    const [totalApplications, averageResponseTime] = await Promise.all([
      prisma.jobApplication.count({
        where: { jobId, job: { tenantId } }
      }),
      prisma.$queryRaw<[{ avg: number }]>`
        SELECT AVG(EXTRACT(EPOCH FROM (viewed_at - applied_at))/3600) as avg
        FROM "JobApplication" ja
        JOIN "JobPosting" j ON ja."jobId" = j.id
        WHERE ja."jobId" = ${jobId}
        AND j."tenantId" = ${tenantId}
        AND ja.viewed_at IS NOT NULL
      `
    ]);

    return {
      total: totalApplications,
      byStatus: statusCounts,
      averageResponseTimeHours: averageResponseTime[0]?.avg || null,
      conversionRate: {
        viewed: statusCounts.viewed ? (statusCounts.viewed / totalApplications) * 100 : 0,
        shortlisted: statusCounts.shortlisted ? (statusCounts.shortlisted / totalApplications) * 100 : 0,
        accepted: statusCounts.accepted ? (statusCounts.accepted / totalApplications) * 100 : 0,
      }
    };
  }

  /**
   * Clear application-related cache
   */
  private async clearApplicationCache(tenantId: number, jobId?: number) {
    const keys = [
      `applications:${tenantId}:*`,
    ];

    if (jobId) {
      keys.push(`job:${tenantId}:${jobId}:applications:*`);
    }

    // Clear Redis cache patterns
    for (const pattern of keys) {
      const existingKeys = await cache.keys(pattern);
      if (existingKeys.length > 0) {
        await cache.del(...existingKeys);
      }
    }
  }
}

// Export singleton instance
export const jobApplicationService = new JobApplicationService();