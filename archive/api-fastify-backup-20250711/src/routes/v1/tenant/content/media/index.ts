import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * Tenant Content Media Routes
 * Manage global media assets for the tenant
 */
export const tenantMediaRoutes: FastifyPluginAsync = async (fastify) => {
  // Get media assets
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.media.read')],
    schema: {
      tags: ['tenant.content'],
      summary: 'Get tenant media',
      description: 'Get all media assets across all accounts in the tenant',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        type: Type.Optional(Type.Union([
          Type.Literal('image'),
          Type.Literal('video'),
          Type.Literal('audio'),
          Type.Literal('document'),
          Type.Literal('other'),
        ])),
        accountId: Type.Optional(Type.Number()),
        tag: Type.Optional(Type.String()),
        minSize: Type.Optional(Type.Number()),
        maxSize: Type.Optional(Type.Number()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            media: Type.Array(Type.Object({
              uuid: uuidSchema,
              filename: Type.String(),
              originalName: Type.String(),
              mimeType: Type.String(),
              size: Type.Number(),
              type: Type.String(),
              url: Type.String(),
              thumbnailUrl: Type.Optional(Type.String()),
              metadata: Type.Object({}, { additionalProperties: true }),
              tags: Type.Array(Type.String()),
              account: Type.Object({
                name: Type.String(),
                uuid: uuidSchema,
              }),
              uploadedBy: Type.Object({
                name: Type.String(),
              }),
              usageCount: Type.Number(),
              createdAt: Type.String(),
              updatedAt: Type.String(),
            })),
            statistics: Type.Object({
              totalFiles: Type.Number(),
              totalSize: Type.Number(),
              byType: Type.Object({}, { additionalProperties: Type.Number() }),
              byAccount: Type.Array(Type.Object({
                accountId: Type.Number(),
                accountName: Type.String(),
                fileCount: Type.Number(),
                totalSize: Type.Number(),
              })),
            }),
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
      const { page = 1, limit = 20, search, type, accountId, tag, minSize, maxSize } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          account: {
            tenantId: request.user!.tenantId,
          },
        };

        if (search) {
          where.OR = [
            { filename: { contains: search, mode: 'insensitive' } },
            { originalName: { contains: search, mode: 'insensitive' } },
            { mimeType: { contains: search, mode: 'insensitive' } },
          ];
        }

        if (type) {
          where.type = type;
        }

        if (accountId) {
          where.accountId = accountId;
        }

        if (tag) {
          where.tags = {
            has: tag,
          };
        }

        if (minSize !== undefined || maxSize !== undefined) {
          where.size = {};
          if (minSize !== undefined) where.size.gte = minSize;
          if (maxSize !== undefined) where.size.lte = maxSize;
        }

        const [media, total, totalSize, typeStats, accountStats] = await Promise.all([
          fastify.prisma.media.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              account: {
                select: {
                  id: true,
                  name: true,
                  uuid: true,
                },
              },
              uploadedBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
              _count: {
                select: {
                  content: true,
                },
              },
            },
          }),
          fastify.prisma.media.count({ where }),
          fastify.prisma.media.aggregate({
            where: {
              account: { tenantId: request.user!.tenantId },
            },
            _sum: { size: true },
          }),
          fastify.prisma.media.groupBy({
            by: ['type'],
            where: {
              account: { tenantId: request.user!.tenantId },
            },
            _count: { type: true },
          }),
          fastify.prisma.media.groupBy({
            by: ['accountId'],
            where: {
              account: { tenantId: request.user!.tenantId },
            },
            _count: { accountId: true },
            _sum: { size: true },
          }),
        ]);

        // Get account names for statistics
        const accountNames = await fastify.prisma.account.findMany({
          where: { tenantId: request.user.tenantId, id: { in: accountStats.map(stat => stat.accountId) },
          },
          select: { id: true, name: true },
        });

        const accountNameMap = Object.fromEntries(
          accountNames.map(acc => [acc.uuid as UUID, acc.name])
        );

        return {
          success: true,
          data: {
            media: media.map(file => ({
              uuid: file.uuid,
              filename: file.filename,
              originalName: file.originalName,
              mimeType: file.mimeType,
              size: file.size,
              type: file.type,
              url: file.url,
              thumbnailUrl: file.thumbnailUrl,
              metadata: file.metadata,
              tags: file.tags,
              account: file.account,
              uploadedBy: file.uploadedBy,
              usageCount: file._count.content,
              createdAt: file.createdAt.toISOString(),
              updatedAt: file.updatedAt.toISOString(),
            })),
            statistics: {
              totalFiles: await fastify.prisma.media.count({
                where: { account: { tenantId: request.user!.tenantId } },
              }),
              totalSize: totalSize._sum.size || 0,
              byType: Object.fromEntries(
                typeStats.map(stat => [stat.type, stat._count.type])
              ),
              byAccount: accountStats.map(stat => ({
                accountId: stat.accountId,
                accountName: accountNameMap[stat.accountId] || 'Unknown',
                fileCount: stat._count.accountId,
                totalSize: stat._sum.size || 0,
              })),
            },
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get tenant media');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_TENANT_MEDIA',
        });
      }
    },
  });

  // Get media details
  fastify.get('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.media.read')],
    schema: {
      tags: ['tenant.content'],
      summary: 'Get media details',
      description: 'Get detailed information about a specific media file',
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
              filename: Type.String(),
              originalName: Type.String(),
              mimeType: Type.String(),
              size: Type.Number(),
              type: Type.String(),
              url: Type.String(),
              thumbnailUrl: Type.Optional(Type.String()),
              metadata: Type.Object({}, { additionalProperties: true }),
              tags: Type.Array(Type.String()),
              account: Type.Object({
                name: Type.String(),
                uuid: uuidSchema,
              }),
              uploadedBy: Type.Object({
                name: Type.String(),
                email: Type.String(),
              }),
              usage: Type.Object({
                totalUses: Type.Number(),
                recentUses: Type.Array(Type.Object({
                  contentId: Type.Number(),
                  contentTitle: Type.String(),
                  contentType: Type.String(),
                  createdAt: Type.String(),
                })),
              }),
              versions: Type.Array(Type.Object({
                filename: Type.String(),
                size: Type.Number(),
                url: Type.String(),
                versionNote: Type.Optional(Type.String()),
                createdAt: Type.String(),
              })),
              createdAt: Type.String(),
              updatedAt: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const media = await fastify.prisma.media.findFirst({
          where: {
            uuid,
            account: {
              tenantId: request.user!.tenantId,
            },
          },
          include: {
            account: {
              select: {
                id: true,
                name: true,
                uuid: true,
              },
            },
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            content: {
              select: {
                id: true,
                title: true,
                type: true,
                createdAt: true,
              },
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
            versions: {
              select: {
                id: true,
                filename: true,
                size: true,
                url: true,
                versionNote: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
            },
            _count: {
              select: {
                content: true,
              },
            },
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
              filename: media.filename,
              originalName: media.originalName,
              mimeType: media.mimeType,
              size: media.size,
              type: media.type,
              url: media.url,
              thumbnailUrl: media.thumbnailUrl,
              metadata: media.metadata,
              tags: media.tags,
              account: media.account,
              uploadedBy: media.uploadedBy,
              usage: {
                totalUses: media._count.content,
                recentUses: media.content.map(content => ({
                  contentId: content.uuid as UUID,
                  contentTitle: content.title,
                  contentType: content.type,
                  createdAt: content.createdAt.toISOString(),
                })),
              },
              versions: media.versions.map(version => ({
                filename: version.filename,
                size: version.size,
                url: version.url,
                versionNote: version.versionNote,
                createdAt: version.createdAt.toISOString(),
              })),
              createdAt: media.createdAt.toISOString(),
              updatedAt: media.updatedAt.toISOString(),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get media details');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_MEDIA_DETAILS',
        });
      }
    },
  });

  // Update media metadata
  fastify.put('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.media.update')],
    schema: {
      tags: ['tenant.content'],
      summary: 'Update media metadata',
      description: 'Update media file metadata and tags',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        originalName: Type.Optional(Type.String()),
        tags: Type.Optional(Type.Array(Type.String())),
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
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
        const media = await fastify.prisma.media.findFirst({
          where: {
            uuid,
            account: {
              tenantId: request.user!.tenantId,
            },
          },
        });

        if (!media) {
          return reply.status(404).send({
            success: false,
            error: 'MEDIA_FILE_NOT_FOUND',
          });
        }

        await fastify.prisma.media.update({
          where: { tenantId: request.user.tenantId },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'Media metadata updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update media metadata');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_MEDIA_METADATA',
        });
      }
    },
  });

  // Move media to different account
  fastify.post('/:uuid/move', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.media.update')],
    schema: {
      tags: ['tenant.content'],
      summary: 'Move media to account',
      description: 'Move a media file to a different account within the tenant',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        targetAccountId: Type.Number(),
        reason: Type.Optional(Type.String()),
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
      const { targetAccountId, reason } = request.body;

      try {
        const [media, targetAccount] = await Promise.all([
          fastify.prisma.media.findFirst({
            where: {
              uuid,
              account: {
                tenantId: request.user!.tenantId,
              },
            },
          }),
          fastify.prisma.account.findFirst({
            where: {
              id: targetAccountId,
              tenantId: request.user!.tenantId,
            },
          }),
        ]);

        if (!media) {
          return reply.status(404).send({
            success: false,
            error: 'MEDIA_FILE_NOT_FOUND',
          });
        }

        if (!targetAccount) {
          return reply.status(404).send({
            success: false,
            error: 'TARGET_ACCOUNT_NOT_FOUND',
          });
        }

        if (media.accountId === targetAccountId) {
          return reply.status(400).send({
            success: false,
            error: 'MEDIA_FILE_IS_ALREADY_IN_THE_TARGET_ACCOUNT',
          });
        }

        await fastify.prisma.media.update({
          where: { tenantId: request.user.tenantId },
          data: {
            accountId: targetAccountId,
            metadata: {
              ...media.metadata,
              transfer: {
                fromAccountId: media.accountId,
                toAccountId: targetAccountId,
                transferredAt: new Date().toISOString(),
                transferredBy: request.user!.id,
                reason: reason || 'Administrative transfer',
              },
            },
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'Media file moved successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to move media file');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_MOVE_MEDIA_FILE',
        });
      }
    },
  });

  // Delete media
  fastify.delete('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.media.delete')],
    schema: {
      tags: ['tenant.content'],
      summary: 'Delete media',
      description: 'Delete a media file (soft delete if in use)',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Optional(Type.Object({
        force: Type.Optional(Type.Boolean({ default: false })),
        reason: Type.Optional(Type.String()),
      })),
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
      const { force = false, reason } = request.body || {};

      try {
        const media = await fastify.prisma.media.findFirst({
          where: {
            uuid,
            account: {
              tenantId: request.user!.tenantId,
            },
          },
          include: {
            _count: {
              select: {
                content: true,
              },
            },
          },
        });

        if (!media) {
          return reply.status(404).send({
            success: false,
            error: 'MEDIA_FILE_NOT_FOUND',
          });
        }

        if (media._count.content > 0 && !force) {
          // Soft delete if media is in use and not forced
          await fastify.prisma.media.update({
            where: { tenantId: request.user.tenantId },
            data: {
              deletedAt: new Date(),
              metadata: {
                ...media.metadata,
                deletion: {
                  deletedBy: request.user!.id,
                  deletedAt: new Date().toISOString(),
                  reason: reason || 'Soft delete due to usage',
                  usageCount: media._count.content,
                },
              },
            },
          });

          return {
            success: true,
            data: {
              message: 'Media file marked for deletion (file is in use)',
            },
          };
        } else {
          // Hard delete if not in use or forced
          await fastify.prisma.media.delete({
            where: { tenantId: request.user.tenantId },
          });

          // TODO: Delete actual file from storage

          return {
            success: true,
            data: {
              message: 'Media file deleted successfully',
            },
          };
        }
      } catch (error) {
        request.log.error({ error }, 'Failed to delete media file');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_MEDIA_FILE',
        });
      }
    },
  });

  // Bulk operations
  fastify.post('/bulk', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.media.update')],
    schema: {
      tags: ['tenant.content'],
      summary: 'Bulk media operations',
      description: 'Perform bulk operations on multiple media files',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        mediaIds: Type.Array(Type.Number()),
        operation: Type.Union([
          Type.Literal('move'),
          Type.Literal('tag'),
          Type.Literal('delete'),
          Type.Literal('untag'),
        ]),
        parameters: Type.Object({}, { additionalProperties: true }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            processed: Type.Number(),
            failed: Type.Number(),
            results: Type.Array(Type.Object({
              mediaId: Type.Number(),
              success: Type.Boolean(),
              error: Type.Optional(Type.String()),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { mediaIds, operation, parameters } = request.body;

      try {
        const results = [];
        let processed = 0;
        let failed = 0;

        for (const mediaId of mediaIds) {
          try {
            const media = await fastify.prisma.media.findFirst({
              where: {
                id: mediaId,
                account: {
                  tenantId: request.user!.tenantId,
                },
              },
            });

            if (!media) {
              results.push({
                mediaId,
                success: false,
                error: 'MEDIA_FILE_NOT_FOUND',
              });
              failed++;
              continue;
            }

            switch (operation) {
              case 'move':
                if (!parameters.targetAccountId) {
                  throw new Error('Target account ID required for move operation');
                }
                await fastify.prisma.media.update({
                  where: { tenantId: request.user.tenantId, id: mediaId },
                  data: {
                    accountId: parameters.targetAccountId,
                    updatedAt: new Date(),
                  },
                });
                break;

              case 'tag':
                if (!parameters.tags || !Array.isArray(parameters.tags)) {
                  throw new Error('Tags array required for tag operation');
                }
                await fastify.prisma.media.update({
                  where: { tenantId: request.user.tenantId, id: mediaId },
                  data: {
                    tags: [...new Set([...media.tags, ...parameters.tags])],
                    updatedAt: new Date(),
                  },
                });
                break;

              case 'untag':
                if (!parameters.tags || !Array.isArray(parameters.tags)) {
                  throw new Error('Tags array required for untag operation');
                }
                await fastify.prisma.media.update({
                  where: { tenantId: request.user.tenantId, id: mediaId },
                  data: {
                    tags: media.tags.filter(tag => !parameters.tags.includes(tag)),
                    updatedAt: new Date(),
                  },
                });
                break;

              case 'delete':
                await fastify.prisma.media.update({
                  where: { tenantId: request.user.tenantId, id: mediaId },
                  data: {
                    deletedAt: new Date(),
                  },
                });
                break;
            }

            results.push({
              mediaId,
              success: true,
            });
            processed++;
          } catch (error) {
            results.push({
              mediaId,
              success: false,
              error: 'OPERATION_FAILED',
            });
            failed++;
          }
        }

        return {
          success: true,
          data: {
            processed,
            failed,
            results,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to perform bulk media operation');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_PERFORM_BULK_MEDIA_OPERATION',
        });
      }
    },
  });

  // Get storage statistics
  fastify.get('/statistics/storage', {
    preHandler: [fastify.authenticate, fastify.requirePermission('tenant.media.read')],
    schema: {
      tags: ['tenant.content'],
      summary: 'Get storage statistics',
      description: 'Get detailed storage usage statistics for the tenant',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            storage: Type.Object({
              totalFiles: Type.Number(),
              totalSize: Type.Number(),
              averageFileSize: Type.Number(),
              quota: Type.Optional(Type.Number()),
              quotaUsage: Type.Optional(Type.Number()),
              byType: Type.Object({}, { additionalProperties: Type.Object({
                count: Type.Number(),
                size: Type.Number(),
                percentage: Type.Number(),
              }) }),
              byAccount: Type.Array(Type.Object({
                accountId: Type.Number(),
                accountName: Type.String(),
                fileCount: Type.Number(),
                totalSize: Type.Number(),
                percentage: Type.Number(),
              })),
              growth: Type.Object({
                thisMonth: Type.Object({
                  files: Type.Number(),
                  size: Type.Number(),
                }),
                lastMonth: Type.Object({
                  files: Type.Number(),
                  size: Type.Number(),
                }),
                percentageChange: Type.Number(),
              }),
              largestFiles: Type.Array(Type.Object({
                filename: Type.String(),
                size: Type.Number(),
                accountName: Type.String(),
                createdAt: Type.String(),
              })),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const tenantId = request.user!.tenantId;
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Get basic statistics
        const [totalStats, typeStats, accountStats] = await Promise.all([
          fastify.prisma.media.aggregate({
            where: { account: { tenantId } },
            _count: { id: true },
            _sum: { size: true },
            _avg: { size: true },
          }),
          fastify.prisma.media.groupBy({
            by: ['type'],
            where: { account: { tenantId } },
            _count: { type: true },
            _sum: { size: true },
          }),
          fastify.prisma.media.groupBy({
            by: ['accountId'],
            where: { account: { tenantId } },
            _count: { accountId: true },
            _sum: { size: true },
          }),
        ]);

        // Get growth statistics
        const [thisMonthStats, lastMonthStats] = await Promise.all([
          fastify.prisma.media.aggregate({
            where: {
              account: { tenantId },
              createdAt: { gte: thisMonthStart },
            },
            _count: { id: true },
            _sum: { size: true },
          }),
          fastify.prisma.media.aggregate({
            where: {
              account: { tenantId },
              createdAt: {
                gte: lastMonthStart,
                lt: thisMonthStart,
              },
            },
            _count: { id: true },
            _sum: { size: true },
          }),
        ]);

        // Get largest files
        const largestFiles = await fastify.prisma.media.findMany({
          where: { account: { tenantId } },
          include: {
            account: {
              select: { name: true },
            },
          },
          orderBy: { size: 'desc' },
          take: 10,
        });

        // Get account names
        const accountNames = await fastify.prisma.account.findMany({
          where: { tenantId: request.user.tenantId, id: { in: accountStats.map(stat => stat.accountId) },
          },
          select: { id: true, name: true },
        });

        const accountNameMap = Object.fromEntries(
          accountNames.map(acc => [acc.uuid as UUID, acc.name])
        );

        const totalSize = totalStats._sum.size || 0;
        const totalFiles = totalStats._count.id || 0;

        // Calculate percentages and organize data
        const byType = Object.fromEntries(
          typeStats.map(stat => [
            stat.type,
            {
              count: stat._count.type,
              size: stat._sum.size || 0,
              percentage: totalSize > 0 ? ((stat._sum.size || 0) / totalSize) * 100 : 0,
            }
          ])
        );

        const byAccount = accountStats.map(stat => ({
          accountId: stat.accountId,
          accountName: accountNameMap[stat.accountId] || 'Unknown',
          fileCount: stat._count.accountId,
          totalSize: stat._sum.size || 0,
          percentage: totalSize > 0 ? ((stat._sum.size || 0) / totalSize) * 100 : 0,
        }));

        const sizeChange = (thisMonthStats._sum.size || 0) - (lastMonthStats._sum.size || 0);
        const percentageChange = lastMonthStats._sum.size 
          ? (sizeChange / (lastMonthStats._sum.size || 1)) * 100
          : 0;

        return {
          success: true,
          data: {
            storage: {
              totalFiles,
              totalSize,
              averageFileSize: totalStats._avg.size || 0,
              quota: undefined, // TODO: Get from tenant settings
              quotaUsage: undefined, // TODO: Calculate quota usage percentage
              byType,
              byAccount,
              growth: {
                thisMonth: {
                  files: thisMonthStats._count.id || 0,
                  size: thisMonthStats._sum.size || 0,
                },
                lastMonth: {
                  files: lastMonthStats._count.id || 0,
                  size: lastMonthStats._sum.size || 0,
                },
                percentageChange,
              },
              largestFiles: largestFiles.map(file => ({
                filename: file.filename,
                size: file.size,
                accountName: file.account.name,
                createdAt: file.createdAt.toISOString(),
              })),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get storage statistics');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_STORAGE_STATISTICS',
        });
      }
    },
  });
};