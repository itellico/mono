import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * User Artwork Routes
 * Manage artwork and creative content
 */
export const userArtworkRoutes: FastifyPluginAsync = async (fastify) => {
  // Get user's artwork
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.media.artwork.read')
    ],
    schema: {
      tags: ['user.media'],
      summary: 'Get artwork',
      description: 'Get user\'s artwork and creative content',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        type: Type.Optional(Type.String()),
        categoryId: Type.Optional(Type.Number()),
        tags: Type.Optional(Type.Array(Type.String())),
        sortBy: Type.Optional(Type.String({ default: 'createdAt' })),
        sortOrder: Type.Optional(Type.String({ default: 'desc' })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            artwork: Type.Array(Type.Object({
              uuid: uuidSchema,
              title: Type.String(),
              description: Type.Optional(Type.String()),
              type: Type.String(),
              mediaAssets: Type.Array(Type.Object({
                url: Type.String(),
                thumbnailUrl: Type.Optional(Type.String()),
                mimeType: Type.String(),
                isPrimary: Type.Boolean(),
              })),
              category: Type.Optional(Type.Object({
                name: Type.String(),
              })),
              tags: Type.Array(Type.String()),
              visibility: Type.String(),
              viewCount: Type.Number(),
              likeCount: Type.Number(),
              isLiked: Type.Boolean(),
              createdAt: Type.String(),
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
      const { page = 1, limit = 20, type, categoryId, tags, sortBy = 'createdAt', sortOrder = 'desc' } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          userId: request.user!.id,
          deletedAt: null,
        };

        if (type) {
          where.type = type;
        }

        if (categoryId) {
          where.categoryId = categoryId;
        }

        if (tags && tags.length > 0) {
          where.artworkTags = {
            some: {
              tag: {
                name: { in: tags },
              },
            },
          };
        }

        const orderBy: any = {};
        orderBy[sortBy] = sortOrder;

        const [artworks, total] = await Promise.all([
          fastify.prisma.artwork.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy,
            include: {
              artworkMedia: {
                include: {
                  mediaAsset: true,
                },
                orderBy: { order: 'asc' },
              },
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              artworkTags: {
                select: {
                  tag: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  views: true,
                  likes: true,
                },
              },
              likes: {
                where: { tenantId: request.user.tenantId, userId: request.user!.id, },
                select: {
                  id: true,
                },
              },
            },
          }),
          fastify.prisma.artwork.count({ where }),
        ]);

        return {
          success: true,
          data: {
            artwork: artworks.map(artwork => ({
              uuid: artwork.uuid,
              title: artwork.title,
              description: artwork.description,
              type: artwork.type,
              mediaAssets: artwork.artworkMedia.map(am => ({
                id: am.mediaAsset.uuid as UUID,
                url: `/media/${am.mediaAsset.directoryHash}/${am.mediaAsset.fileName}`,
                thumbnailUrl: am.mediaAsset.thumbnailUrl,
                mimeType: am.mediaAsset.mimeType,
                isPrimary: am.isPrimary,
              })),
              category: artwork.category,
              tags: artwork.artworkTags.map(at => at.tag.name),
              visibility: artwork.visibility,
              viewCount: artwork._count.views,
              likeCount: artwork._count.likes,
              isLiked: artwork.likes.length > 0,
              createdAt: artwork.createdAt.toISOString(),
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
        request.log.error({ error }, 'Failed to get artwork');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_ARTWORK',
        });
      }
    },
  });

  // Create artwork
  fastify.post('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.media.artwork.read')
    ],
    schema: {
      tags: ['user.media'],
      summary: 'Create artwork',
      description: 'Create new artwork entry',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        title: Type.String({ minLength: 1, maxLength: 200 }),
        description: Type.Optional(Type.String({ maxLength: 2000 })),
        type: Type.String(),
        categoryId: Type.Optional(Type.Number()),
        tags: Type.Optional(Type.Array(Type.String())),
        visibility: Type.Optional(Type.Union([
          Type.Literal('public'),
          Type.Literal('private'),
          Type.Literal('unlisted'),
        ])),
        mediaAssetIds: Type.Array(Type.Number(), { minItems: 1 }),
        primaryMediaAssetId: Type.Optional(Type.Number()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            artwork: Type.Object({
              uuid: uuidSchema,
              title: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { title, description, type, categoryId, tags, visibility = 'private', mediaAssetIds, primaryMediaAssetId } = request.body;

      try {
        // Verify media assets belong to user
        const mediaAssets = await fastify.prisma.mediaAsset.findMany({
          where: { tenantId: request.user.tenantId, id: { in: mediaAssetIds },
            userId: request.user!.id,
            deletionStatus: { not: 'deleted' },
          },
        });

        if (mediaAssets.length !== mediaAssetIds.length) {
          return reply.status(400).send({
            success: false,
            error: 'SOME_MEDIA_ASSETS_NOT_FOUND_OR_NOT_OWNED_BY_USER',
          });
        }

        // Create artwork
        const artwork = await fastify.prisma.artwork.create({
          data: {
            userId: request.user!.id,
            title,
            description,
            type,
            categoryId,
            visibility,
            artworkMedia: {
              create: mediaAssetIds.map((mediaId, index) => ({
                mediaAssetId: mediaId,
                isPrimary: primaryMediaAssetId ? mediaId === primaryMediaAssetId : index === 0,
                order: index,
              })),
            },
            artworkTags: tags ? {
              create: tags.map(tagName => ({
                tag: {
                  connectOrCreate: {
                    where: {
                      tenantId_name: {
                        tenantId: request.user!.tenantId,
                        name: tagName,
                      },
                    },
                    create: {
                      tenantId: request.user!.tenantId,
                      name: tagName,
                      slug: tagName.toLowerCase().replace(/\s+/g, '-'),
                    },
                  },
                },
              })),
            } : undefined,
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            artwork: {
              uuid: artwork.uuid,
              title: artwork.title,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to create artwork');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CREATE_ARTWORK',
        });
      }
    },
  });

  // Update artwork
  fastify.put('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.media.artwork.read')
    ],
    schema: {
      tags: ['user.media'],
      summary: 'Update artwork',
      description: 'Update existing artwork',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        title: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
        description: Type.Optional(Type.String({ maxLength: 2000 })),
        categoryId: Type.Optional(Type.Number()),
        tags: Type.Optional(Type.Array(Type.String())),
        visibility: Type.Optional(Type.Union([
          Type.Literal('public'),
          Type.Literal('private'),
          Type.Literal('unlisted'),
        ])),
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
      const updates = request.body;

      try {
        const artwork = await fastify.prisma.artwork.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            userId: request.user!.id,
            deletedAt: null, },
        });

        if (!artwork) {
          return reply.status(404).send({
            success: false,
            error: 'ARTWORK_NOT_FOUND',
          });
        }

        // Update artwork
        await fastify.prisma.artwork.update({
          where: { tenantId: request.user.tenantId },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        });

        // Update tags if provided
        if (updates.tags) {
          // Remove existing tags
          await fastify.prisma.artworkTag.deleteMany({
            where: { tenantId: request.user.tenantId, artworkId: artwork.uuid as UUID },
          });

          // Add new tags
          await fastify.prisma.artworkTag.createMany({
            data: updates.tags.map(tagName => ({
              artworkId: artwork.uuid as UUID,
              tagId: 0, // This will be replaced by connectOrCreate
            })),
          });
        }

        return {
          success: true,
          data: {
            message: 'Artwork updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update artwork');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_ARTWORK',
        });
      }
    },
  });

  // Delete artwork
  fastify.delete('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.media.artwork.read')
    ],
    schema: {
      tags: ['user.media'],
      summary: 'Delete artwork',
      description: 'Soft delete artwork',
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
        const artwork = await fastify.prisma.artwork.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            userId: request.user!.id,
            deletedAt: null, },
        });

        if (!artwork) {
          return reply.status(404).send({
            success: false,
            error: 'ARTWORK_NOT_FOUND',
          });
        }

        // Soft delete
        await fastify.prisma.artwork.update({
          where: { tenantId: request.user.tenantId },
          data: {
            deletedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'Artwork deleted successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to delete artwork');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_ARTWORK',
        });
      }
    },
  });
};