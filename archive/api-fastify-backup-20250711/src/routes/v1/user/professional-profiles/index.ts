import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { sendSuccess, sendError, ErrorResponses } from '@/utils/response-helpers';
import { professionalProfilesBackendService } from '@/services/professional-profiles.service';
import { ProfileType } from '@prisma/client';

/**
 * User Professional Profiles Routes
 * Individual user management of their professional profiles (Model, Photographer, etc.)
 */
export const userProfessionalProfilesRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Get current user's professional profiles
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.professional-profiles.read')
    ],
    schema: {
      tags: ['user.professional-profiles'],
      summary: 'Get user professional profiles',
      description: 'Get all professional profiles for the current user',
      security: [{ bearerAuth: [] }],
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
              createdAt: Type.String(),
              updatedAt: Type.String(),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const profiles = await professionalProfilesBackendService.getUserProfiles(
          request.user!.id,
          request.user!.tenantId
        );

        return sendSuccess(reply, {
          profiles: profiles.map(profile => ({
            profileType: profile.profileType,
            professionalName: profile.professionalName,
            tagline: profile.tagline,
            baseLocation: profile.baseLocation,
            completionPercentage: profile.completionPercentage,
            status: profile.status,
            verificationStatus: profile.verificationStatus,
            featured: profile.featured,
            profileViews: profile.profileViews,
            createdAt: profile.createdAt.toISOString(),
            updatedAt: profile.updatedAt.toISOString(),
          })),
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to get user professional profiles');
        return ErrorResponses.internalError(reply, 'Failed to get professional profiles');
      }
    },
  });

  // Create new professional profile
  fastify.post('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.professional-profiles.read')
    ],
    schema: {
      tags: ['user.professional-profiles'],
      summary: 'Create professional profile',
      description: 'Create a new professional profile for the current user',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
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
        // Check if user already has this profile type
        const existingProfiles = await professionalProfilesBackendService.getUserProfiles(
          request.user!.id,
          request.user!.tenantId
        );

        const hasProfileType = existingProfiles.some(p => p.profileType === request.body.profileType);
        if (hasProfileType) {
          return sendError(reply, 400, 'PROFILE_EXISTS', `You already have a ${request.body.profileType} profile`);
        }

        const profile = await professionalProfilesBackendService.createProfile({
          ...request.body,
          userId: request.user!.id,
          tenantId: request.user!.tenantId,
        });

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
        request.log.error({ error }, 'Failed to create professional profile');
        return ErrorResponses.internalError(reply, 'Failed to create professional profile');
      }
    },
  });

  // Get specific professional profile
  fastify.get('/:id', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.professional-profiles.read')
    ],
    schema: {
      tags: ['user.professional-profiles'],
      summary: 'Get professional profile',
      description: 'Get a specific professional profile by ID',
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

        // Check ownership
        if (profile.userId !== request.user!.id) {
          return ErrorResponses.forbidden(reply, 'Access denied');
        }

        return sendSuccess(reply, { profile });
      } catch (error) {
        request.log.error({ error }, 'Failed to get professional profile');
        return ErrorResponses.internalError(reply, 'Failed to get professional profile');
      }
    },
  });

  // Update professional profile
  fastify.put('/:id', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.professional-profiles.read')
    ],
    schema: {
      tags: ['user.professional-profiles'],
      summary: 'Update professional profile',
      description: 'Update a professional profile',
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
        // Verify ownership before update
        const existingProfile = await professionalProfilesService.getProfile(
          request.params.uuid as UUID,
          request.user!.tenantId
        );

        if (!existingProfile) {
          return ErrorResponses.notFound(reply, 'Professional profile not found');
        }

        if (existingProfile.userId !== request.user!.id) {
          return ErrorResponses.forbidden(reply, 'Access denied');
        }

        const profile = await professionalProfilesBackendService.updateProfile(
          request.params.uuid as UUID,
          request.body,
          request.user!.tenantId
        );

        return sendSuccess(reply, { profile });
      } catch (error) {
        request.log.error({ error }, 'Failed to update professional profile');
        return ErrorResponses.internalError(reply, 'Failed to update professional profile');
      }
    },
  });

  // Delete professional profile
  fastify.delete('/:id', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.professional-profiles.read')
    ],
    schema: {
      tags: ['user.professional-profiles'],
      summary: 'Delete professional profile',
      description: 'Delete a professional profile',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        await professionalProfilesBackendService.deleteProfile(
          request.params.uuid as UUID,
          request.user!.tenantId,
          request.user!.id
        );

        return sendSuccess(reply, {
          message: 'Professional profile deleted successfully',
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to delete professional profile');
        return ErrorResponses.internalError(reply, 'Failed to delete professional profile');
      }
    },
  });

  // Increment profile views
  fastify.post('/:id/views', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.professional-profiles.read')
    ],
    schema: {
      tags: ['user.professional-profiles'],
      summary: 'Increment profile views',
      description: 'Increment view count for a professional profile',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        // Verify profile exists and is in the same tenant
        const profile = await professionalProfilesBackendService.getProfile(
          request.params.uuid as UUID,
          request.user!.tenantId
        );

        if (!profile) {
          return ErrorResponses.notFound(reply, 'Professional profile not found');
        }

        // Don't increment views for the profile owner
        if (profile.userId === request.user!.id) {
          return sendSuccess(reply, {
            message: 'View not counted for profile owner',
          });
        }

        await professionalProfilesBackendService.incrementProfileViews(
          request.params.uuid as UUID,
          request.user!.tenantId
        );

        return sendSuccess(reply, {
          message: 'View count incremented',
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to increment profile views');
        return ErrorResponses.internalError(reply, 'Failed to increment view count');
      }
    },
  });
};