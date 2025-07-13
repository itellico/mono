import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { sendSuccess, sendError, ErrorResponses } from '@/utils/response-helpers';
import { professionalProfilesBackendService } from '@/services/professional-profiles.service';
import { ProfileType } from '@prisma/client';

/**
 * Account Professional Profiles Routes
 * Agency/business account management of their talent roster's professional profiles
 */
export const accountProfessionalProfilesRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Get all professional profiles under account management
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.profiles.read')],
    schema: {
      tags: ['account.professional-profiles'],
      summary: 'Get account professional profiles',
      description: 'Get all professional profiles managed by this account (agency roster)',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        profileType: Type.Optional(Type.Enum(ProfileType)),
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        status: Type.Optional(Type.String()),
        search: Type.Optional(Type.String()),
        featured: Type.Optional(Type.Boolean()),
        available: Type.Optional(Type.Boolean()),
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
              status: Type.String(),
              verificationStatus: Type.String(),
              featured: Type.Boolean(),
              profileViews: Type.Number(),
              user: Type.Object({
                firstName: Type.Optional(Type.String()),
                lastName: Type.Optional(Type.String()),
                profilePhotoUrl: Type.Optional(Type.String()),
                email: Type.Optional(Type.String()),
              }),
              createdAt: Type.String(),
              updatedAt: Type.String(),
            })),
            stats: Type.Object({
              totalProfiles: Type.Number(),
              activeProfiles: Type.Number(),
              verifiedProfiles: Type.Number(),
              featuredProfiles: Type.Number(),
              profilesByType: Type.Object({}, { additionalProperties: true }),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const { profileType, page = 1, limit = 20, search, ...filters } = request.query;

        // TODO: Implement proper account-to-user relationship
        // For now, this is a placeholder implementation
        // In a real agency system, you'd have account-user relationships
        // where agencies can manage profiles of their talent

        // Get profiles that belong to users under this account
        // This would typically involve a junction table like AccountUsers
        const searchFilters = {
          ...filters,
          // TODO: Add account-based filtering
          // accountId: request.user!.accountId,
        };

        const result = await professionalProfilesBackendService.searchProfiles(
          searchFilters,
          request.user!.tenantId,
          page,
          limit
        );

        // Calculate stats for the account
        const stats = {
          totalProfiles: result.pagination.total,
          activeProfiles: result.profiles.filter(p => p.status === 'ACTIVE').length,
          verifiedProfiles: result.profiles.filter(p => p.verificationStatus === 'VERIFIED').length,
          featuredProfiles: result.profiles.filter(p => p.featured).length,
          profilesByType: result.profiles.reduce((acc, profile) => {
            acc[profile.profileType] = (acc[profile.profileType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        };

        return sendSuccess(reply, {
          profiles: result.profiles,
          stats,
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to get account professional profiles');
        return ErrorResponses.internalError(reply, 'Failed to get account professional profiles');
      }
    },
  });

  // Create professional profile for account talent
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.profiles.create')],
    schema: {
      tags: ['account.professional-profiles'],
      summary: 'Create professional profile for talent',
      description: 'Create a professional profile for talent under account management',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        userId: Type.Number(), // The talent user this profile is for
        profileType: Type.Enum(ProfileType),
        professionalName: Type.Optional(Type.String({ minLength: 2, maxLength: 255 })),
        tagline: Type.Optional(Type.String({ maxLength: 500 })),
        yearsExperience: Type.Optional(Type.Number({ minimum: 0, maximum: 50 })),
        specialties: Type.Optional(Type.Array(Type.String())),
        professionalEmail: Type.Optional(Type.String({ format: 'email' })),
        professionalPhone: Type.Optional(Type.String()),
        websiteUrl: Type.Optional(Type.String({ format: 'uri' })),
        baseLocation: Type.Optional(Type.String({ maxLength: 255 })),
        travelRadius: Type.Optional(Type.Number({ minimum: 0, maximum: 10000 })),
        travelInternationally: Type.Optional(Type.Boolean()),
        currency: Type.Optional(Type.String({ minLength: 3, maxLength: 3 })),
        rateNegotiable: Type.Optional(Type.Boolean()),
        keywords: Type.Optional(Type.Array(Type.String())),
        industryData: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            profile: Type.Object({
              profileType: Type.String(),
              professionalName: Type.Optional(Type.String()),
              completionPercentage: Type.Number(),
              slug: Type.Optional(Type.String()),
              createdAt: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const { userId, ...profileData } = request.body;

        // TODO: Verify that the user belongs to this account
        // In a real system, you'd check AccountUsers relationship
        
        // Check if the talent already has this profile type
        const existingProfiles = await professionalProfilesBackendService.getUserProfiles(
          userId,
          request.user!.tenantId
        );

        const hasProfileType = existingProfiles.some(p => p.profileType === profileData.profileType);
        if (hasProfileType) {
          return sendError(reply, 400, 'PROFILE_EXISTS', `Talent already has a ${profileData.profileType} profile`);
        }

        const profile = await professionalProfilesBackendService.createProfile({
          ...profileData,
          userId,
          tenantId: request.user!.tenantId,
        });

        // TODO: Log account management action
        // TODO: Notify talent of profile creation

        return sendSuccess(reply, {
          profile: {
            profileType: profile.profileType,
            professionalName: profile.professionalName,
            completionPercentage: profile.completionPercentage,
            slug: profile.slug,
            createdAt: profile.createdAt.toISOString(),
          },
        }, 201);
      } catch (error) {
        request.log.error({ error }, 'Failed to create professional profile for talent');
        return ErrorResponses.internalError(reply, 'Failed to create professional profile');
      }
    },
  });

  // Update professional profile (agency managing talent)
  fastify.put('/:id', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.profiles.update')],
    schema: {
      tags: ['account.professional-profiles'],
      summary: 'Update talent professional profile',
      description: 'Update a professional profile for talent under account management',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      querystring: Type.Object({
        section: Type.Optional(Type.String()),
      }),
      body: Type.Object({
        professionalName: Type.Optional(Type.String({ minLength: 2, maxLength: 255 })),
        tagline: Type.Optional(Type.String({ maxLength: 500 })),
        yearsExperience: Type.Optional(Type.Number({ minimum: 0, maximum: 50 })),
        specialties: Type.Optional(Type.Array(Type.String())),
        professionalEmail: Type.Optional(Type.String({ format: 'email' })),
        professionalPhone: Type.Optional(Type.String()),
        websiteUrl: Type.Optional(Type.String({ format: 'uri' })),
        baseLocation: Type.Optional(Type.String({ maxLength: 255 })),
        travelRadius: Type.Optional(Type.Number({ minimum: 0, maximum: 10000 })),
        travelInternationally: Type.Optional(Type.Boolean()),
        currency: Type.Optional(Type.String({ minLength: 3, maxLength: 3 })),
        rateNegotiable: Type.Optional(Type.Boolean()),
        keywords: Type.Optional(Type.Array(Type.String())),
        industryData: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            profile: Type.Object({}, { additionalProperties: true }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        // Verify the profile exists and belongs to account-managed talent
        const existingProfile = await professionalProfilesBackendService.getProfile(
          request.params.uuid as UUID,
          request.user!.tenantId
        );

        if (!existingProfile) {
          return ErrorResponses.notFound(reply, 'Professional profile not found');
        }

        // TODO: Verify account can manage this profile
        // In a real system, check if existingProfile.userId is in AccountUsers

        const profile = await professionalProfilesBackendService.updateProfile(
          request.params.uuid as UUID,
          request.body,
          request.user!.tenantId
        );

        // TODO: Log account management action
        // TODO: Notify talent of profile update

        return sendSuccess(reply, { profile });
      } catch (error) {
        request.log.error({ error }, 'Failed to update talent professional profile');
        return ErrorResponses.internalError(reply, 'Failed to update professional profile');
      }
    },
  });

  // Get talent roster overview
  fastify.get('/roster', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.profiles.read')],
    schema: {
      tags: ['account.professional-profiles'],
      summary: 'Get talent roster overview',
      description: 'Get overview of all talent under account management',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            roster: Type.Array(Type.Object({
              userId: Type.Number(),
              user: Type.Object({
                firstName: Type.Optional(Type.String()),
                lastName: Type.Optional(Type.String()),
                profilePhotoUrl: Type.Optional(Type.String()),
                email: Type.Optional(Type.String()),
              }),
              profiles: Type.Array(Type.Object({
                profileType: Type.String(),
                professionalName: Type.Optional(Type.String()),
                completionPercentage: Type.Number(),
                status: Type.String(),
                verificationStatus: Type.String(),
                featured: Type.Boolean(),
                profileViews: Type.Number(),
              })),
              stats: Type.Object({
                totalProfiles: Type.Number(),
                completionAverage: Type.Number(),
                totalViews: Type.Number(),
                activeBookings: Type.Number(),
              }),
            })),
            summary: Type.Object({
              totalTalent: Type.Number(),
              totalProfiles: Type.Number(),
              averageCompletion: Type.Number(),
              featuredTalent: Type.Number(),
              verifiedTalent: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        // TODO: Implement proper talent roster functionality
        // This would typically involve:
        // 1. Get all users associated with this account (AccountUsers table)
        // 2. Get their professional profiles
        // 3. Calculate roster statistics

        // Placeholder implementation
        const roster: any[] = [];
        const summary = {
          totalTalent: 0,
          totalProfiles: 0,
          averageCompletion: 0,
          featuredTalent: 0,
          verifiedTalent: 0,
        };

        return sendSuccess(reply, {
          roster,
          summary,
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to get talent roster');
        return ErrorResponses.internalError(reply, 'Failed to get talent roster');
      }
    },
  });

  // Bulk operations on account-managed profiles
  fastify.post('/bulk', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.profiles.manage')],
    schema: {
      tags: ['account.professional-profiles'],
      summary: 'Bulk operations on talent profiles',
      description: 'Perform bulk operations on professional profiles under account management',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        profileIds: Type.Array(Type.Number()),
        operation: Type.Union([
          Type.Literal('feature'),
          Type.Literal('unfeature'),
          Type.Literal('activate'),
          Type.Literal('deactivate'),
          Type.Literal('update_availability'),
        ]),
        data: Type.Optional(Type.Object({}, { additionalProperties: true })),
        reason: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            processedCount: Type.Number(),
            failedCount: Type.Number(),
            results: Type.Array(Type.Object({
              profileId: Type.Number(),
              success: Type.Boolean(),
              error: Type.Optional(Type.String()),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const { profileIds, operation, data, reason } = request.body;
        const results = [];
        let processedCount = 0;
        let failedCount = 0;

        for (const profileId of profileIds) {
          try {
            // Verify profile belongs to account-managed talent
            const profile = await professionalProfilesBackendService.getProfile(
              profileId,
              request.user!.tenantId
            );

            if (!profile) {
              results.push({
                profileId,
                success: false,
                error: 'PROFILE_NOT_FOUND',
              });
              failedCount++;
              continue;
            }

            // TODO: Verify account can manage this profile

            const updateData: any = { ...data };

            switch (operation) {
              case 'feature':
                updateData.featured = true;
                break;
              case 'unfeature':
                updateData.featured = false;
                break;
              case 'activate':
                updateData.status = 'ACTIVE';
                break;
              case 'deactivate':
                updateData.status = 'INACTIVE';
                break;
              case 'update_availability':
                // updateData would contain availability calendar data
                break;
            }

            await professionalProfilesBackendService.updateProfile(
              profileId,
              updateData,
              request.user!.tenantId
            );

            results.push({ profileId, success: true });
            processedCount++;
          } catch (error) {
            results.push({
              profileId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            failedCount++;
          }
        }

        return sendSuccess(reply, {
          message: `Bulk ${operation} operation completed`,
          processedCount,
          failedCount,
          results,
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to perform bulk operation on talent profiles');
        return ErrorResponses.internalError(reply, 'Failed to perform bulk operation');
      }
    },
  });
};