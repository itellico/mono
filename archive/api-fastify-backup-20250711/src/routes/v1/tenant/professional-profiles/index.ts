import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { sendSuccess, sendError, ErrorResponses } from '@/utils/response-helpers';
import { professionalProfilesBackendService } from '@/services/professional-profiles.service';
import { ProfileType } from '@prisma/client';

/**
 * Tenant Professional Profiles Routes
 * Marketplace admin management of all professional profiles in their tenant
 */
export const tenantProfessionalProfilesRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Search and list all professional profiles in tenant
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('profiles:read')],
    schema: {
      tags: ['tenant.professional-profiles'],
      summary: 'Search professional profiles',
      description: 'Search and list all professional profiles in the tenant',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        profileType: Type.Optional(Type.Enum(ProfileType)),
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        location: Type.Optional(Type.String()),
        verified: Type.Optional(Type.Boolean()),
        featured: Type.Optional(Type.Boolean()),
        search: Type.Optional(Type.String()),
        sortBy: Type.Optional(Type.String()),
        sortOrder: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')])),
        // Model-specific filters
        heightMin: Type.Optional(Type.Number()),
        heightMax: Type.Optional(Type.Number()),
        hairColor: Type.Optional(Type.String()),
        eyeColor: Type.Optional(Type.String()),
        experience: Type.Optional(Type.String()),
        // Photographer-specific filters
        photographyTypes: Type.Optional(Type.String()),
        equipment: Type.Optional(Type.String()),
        studioAccess: Type.Optional(Type.Boolean()),
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
              }),
              createdAt: Type.String(),
              updatedAt: Type.String(),
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
          heightMin,
          heightMax,
          hairColor,
          eyeColor,
          experience,
          photographyTypes,
          equipment,
          studioAccess,
          ...otherFilters
        } = request.query;

        // Build filters object
        const filters: any = { ...otherFilters };

        // Add profile-type specific filters
        if (profileType === ProfileType.MODEL) {
          if (heightMin) filters.heightMin = heightMin;
          if (heightMax) filters.heightMax = heightMax;
          if (hairColor) filters.hairColor = hairColor.split(',');
          if (eyeColor) filters.eyeColor = eyeColor.split(',');
          if (experience) filters.experience = experience.split(',');
        } else if (profileType === ProfileType.PHOTOGRAPHER) {
          if (photographyTypes) filters.photographyTypes = photographyTypes.split(',');
          if (equipment) filters.equipment = equipment.split(',');
          if (studioAccess !== undefined) filters.studioAccess = studioAccess;
        }

        const result = await professionalProfilesBackendService.searchProfiles(
          filters,
          request.user!.tenantId,
          page,
          limit
        );

        return sendSuccess(reply, result);
      } catch (error) {
        request.log.error({ error }, 'Failed to search professional profiles');
        return ErrorResponses.internalError(reply, 'Failed to search professional profiles');
      }
    },
  });

  // Get specific professional profile with full details
  fastify.get('/:id', {
    preHandler: [fastify.authenticate, fastify.requirePermission('profiles:read')],
    schema: {
      tags: ['tenant.professional-profiles'],
      summary: 'Get professional profile details',
      description: 'Get detailed information about a specific professional profile',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
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
        const profile = await professionalProfilesBackendService.getProfile(
          request.params.uuid as UUID,
          request.user!.tenantId
        );

        if (!profile) {
          return ErrorResponses.notFound(reply, 'Professional profile not found');
        }

        return sendSuccess(reply, { profile });
      } catch (error) {
        request.log.error({ error }, 'Failed to get professional profile');
        return ErrorResponses.internalError(reply, 'Failed to get professional profile');
      }
    },
  });

  // Update profile status (verify, feature, etc.)
  fastify.patch('/:id/status', {
    preHandler: [fastify.authenticate, fastify.requirePermission('profiles:manage')],
    schema: {
      tags: ['tenant.professional-profiles'],
      summary: 'Update profile status',
      description: 'Update profile status, verification, or featured status',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      body: Type.Object({
        status: Type.Optional(Type.String()),
        verificationStatus: Type.Optional(Type.String()),
        featured: Type.Optional(Type.Boolean()),
        reason: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
            profile: Type.Object({
              status: Type.String(),
              verificationStatus: Type.String(),
              featured: Type.Boolean(),
              updatedAt: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const profile = await professionalProfilesBackendService.updateProfile(
          request.params.uuid as UUID,
          request.body,
          request.user!.tenantId
        );

        // TODO: Send notification to profile owner about status change
        // TODO: Log admin action for audit trail

        return sendSuccess(reply, {
          message: 'Profile status updated successfully',
          profile: {
            status: profile.status,
            verificationStatus: profile.verificationStatus,
            featured: profile.featured,
            updatedAt: profile.updatedAt.toISOString(),
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to update profile status');
        return ErrorResponses.internalError(reply, 'Failed to update profile status');
      }
    },
  });

  // Get profile analytics and statistics
  fastify.get('/:id/analytics', {
    preHandler: [fastify.authenticate, fastify.requirePermission('profiles:read')],
    schema: {
      tags: ['tenant.professional-profiles'],
      summary: 'Get profile analytics',
      description: 'Get analytics and statistics for a professional profile',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      querystring: Type.Object({
        period: Type.Optional(Type.Union([
          Type.Literal('7d'),
          Type.Literal('30d'),
          Type.Literal('90d'),
          Type.Literal('1y'),
        ])),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            analytics: Type.Object({
              totalViews: Type.Number(),
              uniqueViews: Type.Number(),
              viewsThisPeriod: Type.Number(),
              applicationsReceived: Type.Number(),
              bookingsCompleted: Type.Number(),
              averageRating: Type.Optional(Type.Number()),
              profileCompleteness: Type.Number(),
              lastActivityAt: Type.Optional(Type.String()),
              topViewSources: Type.Array(Type.Object({
                source: Type.String(),
                count: Type.Number(),
              })),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const { period = '30d' } = request.query;

        // Get basic profile info
        const profile = await professionalProfilesBackendService.getProfile(
          request.params.uuid as UUID,
          request.user!.tenantId
        );

        if (!profile) {
          return ErrorResponses.notFound(reply, 'Professional profile not found');
        }

        // TODO: Implement comprehensive analytics
        // For now, return basic stats
        const analytics = {
          totalViews: profile.profileViews || 0,
          uniqueViews: Math.floor((profile.profileViews || 0) * 0.7), // Rough estimate
          viewsThisPeriod: Math.floor((profile.profileViews || 0) * 0.3),
          applicationsReceived: 0, // TODO: Count applications
          bookingsCompleted: 0, // TODO: Count completed bookings
          averageRating: null, // TODO: Calculate average rating
          profileCompleteness: profile.completionPercentage || 0,
          lastActivityAt: profile.updatedAt.toISOString(),
          topViewSources: [
            { source: 'search', count: Math.floor((profile.profileViews || 0) * 0.6) },
            { source: 'direct', count: Math.floor((profile.profileViews || 0) * 0.3) },
            { source: 'featured', count: Math.floor((profile.profileViews || 0) * 0.1) },
          ],
        };

        return sendSuccess(reply, { analytics });
      } catch (error) {
        request.log.error({ error }, 'Failed to get profile analytics');
        return ErrorResponses.internalError(reply, 'Failed to get profile analytics');
      }
    },
  });

  // Bulk operations on profiles
  fastify.post('/bulk', {
    preHandler: [fastify.authenticate, fastify.requirePermission('profiles:manage')],
    schema: {
      tags: ['tenant.professional-profiles'],
      summary: 'Bulk profile operations',
      description: 'Perform bulk operations on multiple professional profiles',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        profileIds: Type.Array(Type.Number()),
        operation: Type.Union([
          Type.Literal('feature'),
          Type.Literal('unfeature'),
          Type.Literal('verify'),
          Type.Literal('unverify'),
          Type.Literal('activate'),
          Type.Literal('deactivate'),
        ]),
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
        const { profileIds, operation, reason } = request.body;
        const results = [];
        let processedCount = 0;
        let failedCount = 0;

        for (const profileId of profileIds) {
          try {
            const updateData: any = {};

            switch (operation) {
              case 'feature':
                updateData.featured = true;
                break;
              case 'unfeature':
                updateData.featured = false;
                break;
              case 'verify':
                updateData.verificationStatus = 'VERIFIED';
                break;
              case 'unverify':
                updateData.verificationStatus = 'UNVERIFIED';
                break;
              case 'activate':
                updateData.status = 'ACTIVE';
                break;
              case 'deactivate':
                updateData.status = 'INACTIVE';
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
        request.log.error({ error }, 'Failed to perform bulk operation');
        return ErrorResponses.internalError(reply, 'Failed to perform bulk operation');
      }
    },
  });
};