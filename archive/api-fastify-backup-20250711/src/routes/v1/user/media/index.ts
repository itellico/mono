import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { userMediaUploadRoutes } from './uploads';
import { userArtworkRoutes } from './artwork';

/**
 * User Media Routes
 * Manage media files and artwork
 */
export const userMediaRoutes: FastifyPluginAsync = async (fastify) => {
  // Register upload routes
  await fastify.register(userMediaUploadRoutes, { prefix: '/uploads' });

  // Register artwork routes
  await fastify.register(userArtworkRoutes, { prefix: '/artwork' });

  // Get user's media files
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.media.read')
    ],
    schema: {
      tags: ['user.media'],
      summary: 'Get media files',
      description: 'Get user\'s media files',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        mediaType: Type.Optional(Type.String()),
        pictureType: Type.Optional(Type.String()),
        search: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            media: Type.Array(Type.Object({
              uuid: uuidSchema,
              fileName: Type.String(),
              originalName: Type.String(),
              url: Type.String(),
              thumbnailUrl: Type.Optional(Type.String()),
              fileSize: Type.Number(),
              mimeType: Type.String(),
              mediaType: Type.String(),
              pictureType: Type.String(),
              uploadedAt: Type.String(),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              totalPages: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { page = 1, limit = 20, mediaType, pictureType, search } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          userId: request.user!.id,
          deletionStatus: { not: 'deleted' },
        };

        if (mediaType) {
          where.mediaType = mediaType;
        }

        if (pictureType) {
          where.pictureType = pictureType;
        }

        if (search) {
          where.OR = [
            { fileName: { contains: search, mode: 'insensitive' } },
            { originalName: { contains: search, mode: 'insensitive' } },
          ];
        }

        const [media, total] = await Promise.all([
          fastify.prisma.mediaAsset.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          fastify.prisma.mediaAsset.count({ where }),
        ]);

        return {
          success: true,
          data: {
            media: media.map(m => ({
              uuid: m.uuid,
              fileName: m.fileName,
              originalName: m.originalName,
              url: `/media/${m.directoryHash}/${m.fileName}`,
              thumbnailUrl: m.thumbnailUrl,
              fileSize: m.fileSize,
              mimeType: m.mimeType,
              mediaType: m.mediaType,
              pictureType: m.pictureType,
              uploadedAt: m.createdAt.toISOString(),
            })),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get media files');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_MEDIA_FILES',
        });
      }
    },
  });

  // Get media file details
  fastify.get('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.media.read')
    ],
    schema: {
      tags: ['user.media'],
      summary: 'Get media file details',
      description: 'Get detailed information about a media file',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            media: Type.Object({
              uuid: uuidSchema,
              fileName: Type.String(),
              originalName: Type.String(),
              url: Type.String(),
              thumbnailUrl: Type.Optional(Type.String()),
              fileSize: Type.Number(),
              mimeType: Type.String(),
              mediaType: Type.String(),
              pictureType: Type.String(),
              dimensions: Type.Optional(Type.Object({
                width: Type.Number(),
                height: Type.Number(),
              })),
              isProcessed: Type.Boolean(),
              uploadedAt: Type.String(),
              updatedAt: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const media = await fastify.prisma.mediaAsset.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            userId: request.user!.id,
            deletionStatus: { not: 'deleted' },
          },
        });

        if (!media) {
          return reply.status(404).send({
            success: false,
            error: 'MEDIA_FILE_NOT_FOUND',
          });
        }

        return {
          success: true,
          data: {
            media: {
              uuid: media.uuid,
              fileName: media.fileName,
              originalName: media.originalName,
              url: `/media/${media.directoryHash}/${media.fileName}`,
              thumbnailUrl: media.thumbnailUrl,
              fileSize: media.fileSize,
              mimeType: media.mimeType,
              mediaType: media.mediaType,
              pictureType: media.pictureType,
              dimensions: media.dimensions as any,
              isProcessed: media.isProcessed,
              uploadedAt: media.createdAt.toISOString(),
              updatedAt: media.updatedAt.toISOString(),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get media file');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_MEDIA_FILE',
        });
      }
    },
  });

  // Delete media file
  fastify.delete('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.media.read')
    ],
    schema: {
      tags: ['user.media'],
      summary: 'Delete media file',
      description: 'Mark media file for deletion',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
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
      const { uuid } = request.params as { uuid: string };

      try {
        const media = await fastify.prisma.mediaAsset.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            userId: request.user!.id,
            deletionStatus: { not: 'deleted' },
          },
        });

        if (!media) {
          return reply.status(404).send({
            success: false,
            error: 'MEDIA_FILE_NOT_FOUND',
          });
        }

        // Mark for deletion
        await fastify.prisma.mediaAsset.update({
          where: { tenantId: request.user.tenantId },
          data: {
            deletionStatus: 'pending_deletion',
            deletionRequestedAt: new Date(),
            deletionRequestedBy: request.user!.id,
          },
        });

        return {
          success: true,
          data: {
            message: 'Media file marked for deletion',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to delete media file');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_MEDIA_FILE',
        });
      }
    },
  });
};