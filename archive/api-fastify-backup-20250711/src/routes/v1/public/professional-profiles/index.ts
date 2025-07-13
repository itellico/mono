import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { sendSuccess, ErrorResponses } from '@/utils/response-helpers';
import { professionalProfilesBackendService } from '@/services/professional-profiles.service';
import { ProfileType } from '@prisma/client';

/**
 * Public Professional Profiles Routes
 * Public discovery and viewing of professional profiles (no authentication required)
 */
export const publicProfessionalProfilesRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Public search and discovery of professional profiles
  fastify.get('/', {
    schema: {
      tags: ['public.professional-profiles'],
      summary: 'Search professional profiles publicly',
      description: 'Public search and discovery of professional profiles',
      querystring: Type.Object({
        profileType: Type.Optional(Type.Enum(ProfileType)),
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 20 })), // Lower limit for public
        location: Type.Optional(Type.String()),
        verified: Type.Optional(Type.Boolean()),
        featured: Type.Optional(Type.Boolean()),
        search: Type.Optional(Type.String()),
        // Basic filters only for public access
        heightMin: Type.Optional(Type.Number()),
        heightMax: Type.Optional(Type.Number()),
        experienceLevel: Type.Optional(Type.Union([
          Type.Literal('beginner'),
          Type.Literal('intermediate'), 
          Type.Literal('experienced'),
          Type.Literal('expert'),
        ])),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            profiles: Type.Array(Type.Object({
              profileType: Type.String(),
              professionalName: Type.Optional(Type.String()),
              tagline: Type.Optional(Type.String()),
              baseLocation: Type.Optional(Type.String()),
              completionPercentage: Type.Number(),
              verificationStatus: Type.String(),
              featured: Type.Boolean(),
              profileViews: Type.Number(),
              slug: Type.Optional(Type.String()),
              // Public profile photo from user
              profilePhotoUrl: Type.Optional(Type.String()),
              // Basic industry data (non-sensitive)
              yearsExperience: Type.Optional(Type.Number()),
              specialties: Type.Optional(Type.Array(Type.String())),
              createdAt: Type.String(),
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
        const {
          profileType = ProfileType.MODEL,
          page = 1,
          limit = 20,
          experienceLevel,
          ...otherFilters
        } = request.query;

        // Only search active, public profiles
        const filters: any = {
          ...otherFilters,
          status: 'ACTIVE', // Only active profiles
          // TODO: Add privacy settings filter when implemented
          // isPublic: true,
        };

        // Map experience level to years
        if (experienceLevel) {
          switch (experienceLevel) {
            case 'beginner':
              filters.experienceMax = 2;
              break;
            case 'intermediate':
              filters.experienceMin = 2;
              filters.experienceMax = 5;
              break;
            case 'experienced':
              filters.experienceMin = 5;
              filters.experienceMax = 10;
              break;
            case 'expert':
              filters.experienceMin = 10;
              break;
          }
        }

        // Get tenant ID from subdomain or default tenant
        // TODO: Implement proper tenant resolution from request
        const tenantId = 1; // Default tenant for now

        const result = await professionalProfilesBackendService.searchProfiles(
          filters,
          tenantId,
          page,
          Math.min(limit, 50) // Enforce lower limit for public
        );

        // Filter out sensitive data for public view
        const publicProfiles = result.profiles.map(profile => ({
          profileType: profile.profileType,
          professionalName: profile.professionalName,
          tagline: profile.tagline,
          baseLocation: profile.baseLocation,
          completionPercentage: profile.completionPercentage,
          verificationStatus: profile.verificationStatus,
          featured: profile.featured,
          profileViews: profile.profileViews,
          slug: profile.slug,
          profilePhotoUrl: profile.user?.profilePhotoUrl,
          yearsExperience: profile.yearsExperience,
          specialties: profile.specialties,
          createdAt: profile.createdAt.toISOString(),
        }));

        return sendSuccess(reply, {
          profiles: publicProfiles,
          pagination: result.pagination,
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to search public professional profiles');
        return ErrorResponses.internalError(reply, 'Failed to search professional profiles');
      }
    },
  });

  // Get public professional profile by slug
  fastify.get('/:slug', {
    schema: {
      tags: ['public.professional-profiles'],
      summary: 'Get public professional profile',
      description: 'Get public view of a professional profile by slug',
      params: Type.Object({
        slug: Type.String(),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            profile: Type.Object({
              profileType: Type.String(),
              professionalName: Type.Optional(Type.String()),
              tagline: Type.Optional(Type.String()),
              baseLocation: Type.Optional(Type.String()),
              websiteUrl: Type.Optional(Type.String()),
              completionPercentage: Type.Number(),
              verificationStatus: Type.String(),
              featured: Type.Boolean(),
              profileViews: Type.Number(),
              slug: Type.Optional(Type.String()),
              yearsExperience: Type.Optional(Type.Number()),
              specialties: Type.Optional(Type.Array(Type.String())),
              // User info (public fields only)
              user: Type.Object({
                firstName: Type.Optional(Type.String()),
                lastName: Type.Optional(Type.String()),
                profilePhotoUrl: Type.Optional(Type.String()),
                bio: Type.Optional(Type.String()),
              }),
              // Selected industry data (non-sensitive)
              industryHighlights: Type.Optional(Type.Object({}, { additionalProperties: true })),
              // Public portfolio images
              portfolio: Type.Optional(Type.Array(Type.Object({
                url: Type.String(),
                caption: Type.Optional(Type.String()),
                featured: Type.Boolean(),
              }))),
              createdAt: Type.String(),
              updatedAt: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        // Get tenant ID from subdomain or default tenant
        // TODO: Implement proper tenant resolution from request
        const tenantId = 1; // Default tenant for now

        const profile = await professionalProfilesBackendService.getProfileBySlug(
          request.params.slug,
          tenantId
        );

        if (!profile) {
          return ErrorResponses.notFound(reply, 'Professional profile not found');
        }

        // Only show active, public profiles
        if (profile.status !== 'ACTIVE') {
          return ErrorResponses.notFound(reply, 'Professional profile not found');
        }

        // TODO: Check privacy settings
        // if (!profile.isPublic) {
        //   return ErrorResponses.notFound(reply, 'Professional profile not found');
        // }

        // Increment view count (async, don't wait)
        professionalProfilesBackendService.incrementProfileViews(profile.uuid as UUID, tenantId)
          .catch(error => {
            request.log.error({ error }, 'Failed to increment profile views');
          });

        // Extract public-safe industry highlights
        let industryHighlights = {};
        if (profile.industryData && typeof profile.industryData === 'object') {
          const data = profile.industryData as any;
          
          if (profile.profileType === ProfileType.MODEL) {
            industryHighlights = {
              campaignTypes: data.experience?.campaignTypes || [],
              notableClients: data.experience?.notableClients || [],
              publications: data.experience?.publications || [],
              workTypes: data.preferences?.workTypes || [],
            };
          } else if (profile.profileType === ProfileType.PHOTOGRAPHER) {
            industryHighlights = {
              photographyTypes: data.specialties?.photographyTypes || [],
              featuredWork: data.portfolioHighlights?.featuredWork || [],
              publishedIn: data.portfolioHighlights?.publishedIn || [],
              awards: data.portfolioHighlights?.awards || [],
            };
          }
        }

        // Format public profile response
        const publicProfile = {
          profileType: profile.profileType,
          professionalName: profile.professionalName,
          tagline: profile.tagline,
          baseLocation: profile.baseLocation,
          websiteUrl: profile.websiteUrl,
          completionPercentage: profile.completionPercentage,
          verificationStatus: profile.verificationStatus,
          featured: profile.featured,
          profileViews: profile.profileViews,
          slug: profile.slug,
          yearsExperience: profile.yearsExperience,
          specialties: profile.specialties,
          user: {
            firstName: profile.user?.firstName,
            lastName: profile.user?.lastName,
            profilePhotoUrl: profile.user?.profilePhotoUrl,
            bio: profile.user?.bio,
          },
          industryHighlights,
          portfolio: profile.media?.filter(m => m.featured).map(m => ({
            url: m.url,
            caption: m.caption,
            featured: m.featured,
          })) || [],
          createdAt: profile.createdAt.toISOString(),
          updatedAt: profile.updatedAt.toISOString(),
        };

        return sendSuccess(reply, { profile: publicProfile });
      } catch (error) {
        request.log.error({ error }, 'Failed to get public professional profile');
        return ErrorResponses.internalError(reply, 'Failed to get professional profile');
      }
    },
  });

  // Get featured professional profiles
  fastify.get('/featured/list', {
    schema: {
      tags: ['public.professional-profiles'],
      summary: 'Get featured professional profiles',
      description: 'Get list of featured professional profiles for homepage/discovery',
      querystring: Type.Object({
        profileType: Type.Optional(Type.Enum(ProfileType)),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 20, default: 10 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            featured: Type.Array(Type.Object({
              profileType: Type.String(),
              professionalName: Type.Optional(Type.String()),
              tagline: Type.Optional(Type.String()),
              baseLocation: Type.Optional(Type.String()),
              verificationStatus: Type.String(),
              profileViews: Type.Number(),
              slug: Type.Optional(Type.String()),
              profilePhotoUrl: Type.Optional(Type.String()),
              featuredImage: Type.Optional(Type.String()),
              createdAt: Type.String(),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const { profileType, limit = 10 } = request.query;

        // Get tenant ID from subdomain or default tenant
        const tenantId = 1; // Default tenant for now

        const filters = {
          featured: true,
          status: 'ACTIVE',
        };

        const result = await professionalProfilesBackendService.searchProfiles(
          filters,
          tenantId,
          1,
          limit
        );

        // Format for featured list
        const featured = result.profiles.map(profile => ({
          profileType: profile.profileType,
          professionalName: profile.professionalName,
          tagline: profile.tagline,
          baseLocation: profile.baseLocation,
          verificationStatus: profile.verificationStatus,
          profileViews: profile.profileViews,
          slug: profile.slug,
          profilePhotoUrl: profile.user?.profilePhotoUrl,
          featuredImage: profile.media?.find(m => m.featured)?.url,
          createdAt: profile.createdAt.toISOString(),
        }));

        return sendSuccess(reply, { featured });
      } catch (error) {
        request.log.error({ error }, 'Failed to get featured professional profiles');
        return ErrorResponses.internalError(reply, 'Failed to get featured profiles');
      }
    },
  });
};