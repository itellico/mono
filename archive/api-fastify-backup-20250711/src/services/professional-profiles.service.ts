/**
 * Professional Profiles Backend Service
 * 
 * Backend service for managing professional profiles (Models, Photographers, Agencies, Clients)
 * Direct database interaction for Fastify API routes
 */

import { PrismaClient, ProfileType, ProfileStatus } from '@prisma/client';
import { generateSlug } from '../utils/slug-generator';
import { calculateProfileCompletion } from '../utils/profile-completion';

const prisma = new PrismaClient();

export class ProfessionalProfilesBackendService {
  
  /**
   * Create a new professional profile
   */
  async createProfile(data: {
    userId: number;
    tenantId: number;
    profileType: ProfileType;
    professionalName?: string;
    tagline?: string;
    yearsExperience?: number;
    specialties?: string[];
    professionalEmail?: string;
    professionalPhone?: string;
    websiteUrl?: string;
    baseLocation?: string;
    travelRadius?: number;
    travelInternationally?: boolean;
    currency?: string;
    rateNegotiable?: boolean;
    keywords?: string[];
    industryData?: object;
  }) {
    // Generate unique slug
    const slug = await this.generateUniqueSlug(
      data.professionalName || `${data.profileType.toLowerCase()}-profile`,
      data.tenantId
    );

    // Calculate completion percentage
    const completionPercentage = calculateProfileCompletion(data);

    const profile = await prisma.professionalProfile.create({
      data: {
        ...data,
        slug,
        completionPercentage,
        status: ProfileStatus.DRAFT,
        verificationStatus: 'UNVERIFIED',
        featured: false,
        profileViews: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            email: true,
          },
        },
      },
    });

    return profile;
  }
  
  /**
   * Get professional profile by ID
   */
  async getProfile(id: number, tenantId: number) {
    const profile = await prisma.professionalProfile.findFirst({
      where: { 
        id, 
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            email: true,
            bio: true,
          },
        },
        media: {
          select: {
            id: true,
            url: true,
            caption: true,
            featured: true,
          },
        },
      },
    });

    return profile;
  }
  
  /**
   * Get professional profile by slug
   */
  async getProfileBySlug(slug: string, tenantId: number) {
    const profile = await prisma.professionalProfile.findFirst({
      where: { 
        slug, 
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            email: true,
            bio: true,
          },
        },
        media: {
          select: {
            id: true,
            url: true,
            caption: true,
            featured: true,
          },
        },
      },
    });

    return profile;
  }
  
  /**
   * Get all profiles for user
   */
  async getUserProfiles(userId: number, tenantId: number) {
    const profiles = await prisma.professionalProfile.findMany({
      where: { 
        userId, 
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return profiles;
  }
  
  /**
   * Update professional profile
   */
  async updateProfile(
    id: number, 
    data: {
      professionalName?: string;
      tagline?: string;
      yearsExperience?: number;
      specialties?: string[];
      professionalEmail?: string;
      professionalPhone?: string;
      websiteUrl?: string;
      baseLocation?: string;
      travelRadius?: number;
      travelInternationally?: boolean;
      currency?: string;
      rateNegotiable?: boolean;
      keywords?: string[];
      industryData?: object;
      status?: ProfileStatus;
      verificationStatus?: string;
      featured?: boolean;
    },
    tenantId: number
  ) {
    // Recalculate completion percentage
    const existingProfile = await this.getProfile(id, tenantId);
    if (!existingProfile) {
      throw new Error('Profile not found');
    }

    const updatedData = { ...existingProfile, ...data };
    const completionPercentage = calculateProfileCompletion(updatedData);

    const profile = await prisma.professionalProfile.update({
      where: { id },
      data: {
        ...data,
        completionPercentage,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            email: true,
          },
        },
      },
    });

    return profile;
  }
  
  /**
   * Search profiles with filters
   */
  async searchProfiles(
    filters: {
      profileType?: ProfileType;
      status?: string;
      verified?: boolean;
      featured?: boolean;
      search?: string;
      location?: string;
      heightMin?: number;
      heightMax?: number;
      hairColor?: string[];
      eyeColor?: string[];
      experience?: string[];
      photographyTypes?: string[];
      equipment?: string[];
      studioAccess?: boolean;
      experienceMin?: number;
      experienceMax?: number;
    },
    tenantId: number,
    page: number = 1,
    limit: number = 20
  ) {
    const where: any = { tenantId };

    // Apply basic filters
    if (filters.profileType) {
      where.profileType = filters.profileType;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.verified !== undefined) {
      where.verificationStatus = filters.verified ? 'VERIFIED' : 'UNVERIFIED';
    }
    if (filters.featured !== undefined) {
      where.featured = filters.featured;
    }
    if (filters.location) {
      where.baseLocation = {
        contains: filters.location,
        mode: 'insensitive',
      };
    }
    if (filters.search) {
      where.OR = [
        {
          professionalName: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          tagline: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          keywords: {
            has: filters.search,
          },
        },
      ];
    }

    // Apply industry data filters using JSON queries
    if (filters.heightMin || filters.heightMax) {
      const heightFilter: any = { path: ['measurements', 'height', 'value'] };
      if (filters.heightMin) heightFilter.gte = filters.heightMin;
      if (filters.heightMax) heightFilter.lte = filters.heightMax;
      where.industryData = heightFilter;
    }

    if (filters.experienceMin || filters.experienceMax) {
      if (filters.experienceMin) {
        where.yearsExperience = { gte: filters.experienceMin };
      }
      if (filters.experienceMax) {
        where.yearsExperience = { ...where.yearsExperience, lte: filters.experienceMax };
      }
    }

    // Get total count
    const total = await prisma.professionalProfile.count({ where });

    // Get paginated results
    const profiles = await prisma.professionalProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhotoUrl: true,
            email: true,
          },
        },
        media: {
          select: {
            id: true,
            url: true,
            caption: true,
            featured: true,
          },
          where: { featured: true },
          take: 3,
        },
      },
      orderBy: [
        { featured: 'desc' },
        { profileViews: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      profiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
  
  /**
   * Delete professional profile
   */
  async deleteProfile(id: number, tenantId: number, userId?: number) {
    const where: any = { id, tenantId };
    if (userId) {
      where.userId = userId;
    }

    await prisma.professionalProfile.delete({ where });
  }
  
  /**
   * Increment profile view count
   */
  async incrementProfileViews(id: number, tenantId: number) {
    await prisma.professionalProfile.update({
      where: { id, tenantId },
      data: {
        profileViews: {
          increment: 1,
        },
      },
    });
  }
  
  /**
   * Generate unique slug for profile
   */
  private async generateUniqueSlug(name: string, tenantId: number): Promise<string> {
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;
    
    while (await this.slugExists(slug, tenantId)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  }
  
  /**
   * Check if slug exists
   */
  private async slugExists(slug: string, tenantId: number): Promise<boolean> {
    const existing = await prisma.professionalProfile.findFirst({
      where: { slug, tenantId },
      select: { id: true },
    });
    
    return !!existing;
  }
}

// Export singleton instance
export const professionalProfilesBackendService = new ProfessionalProfilesBackendService();