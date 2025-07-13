import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import crypto from 'crypto';
import { config } from '@/config/index';

// File size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB for multiple files

// Allowed file types with categorization
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
const ALLOWED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain'];

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_AUDIO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES
];

// Media type detection
function getMediaType(mimeType: string): 'photo' | 'video' | 'audio' | 'document' {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'photo';
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video';
  if (ALLOWED_AUDIO_TYPES.includes(mimeType)) return 'audio';
  if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return 'document';
  return 'photo'; // Default fallback
}

// Picture type detection from context
function getPictureType(context: string): 'profile_picture' | 'model_book' | 'set_card' | 'application_photo' | 'verification_photo' {
  if (context === 'profile_picture') return 'profile_picture';
  if (context === 'compcard' || context === 'comp_card') return 'set_card';
  if (context === 'portfolio') return 'model_book';
  if (context === 'voice_portfolio') return 'model_book';
  if (context === 'application' || context === 'job_submission') return 'application_photo';
  if (context === 'document' || context === 'verification') return 'verification_photo';
  return 'model_book'; // Default fallback
}

// Generate file hash
function generateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Generate directory hash
function generateDirectoryHash(tenantUuid: string, mediaType: string): string {
  const combined = tenantUuid + mediaType + Date.now().toString();
  return crypto.createHash('md5').update(combined).digest('hex').substring(0, 10);
}

export const mediaRoutes: FastifyPluginAsync = async (fastify) => {
  // Ensure upload directory exists
  const storageBasePath = config.UPLOAD_DIR || './public';
  await mkdir(storageBasePath, { recursive: true });

  // Enhanced upload with comprehensive processing
  fastify.post('/upload', {
    preHandler: [fastify.authenticate, fastify.requirePermission('media:upload')],
    schema: {
      tags: ['tenant.media'],
      consumes: ['multipart/form-data'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            uploadedFiles: Type.Array(Type.Object({
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
              metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
              processingStatus: Type.String(),
              jobId: Type.Optional(Type.String()),
            })),
            totalSize: Type.Number(),
            processedCount: Type.Number(),
          }),
        }),
        400: Type.Object({
          success: Type.Boolean(),
          error: Type.String(),
          details: Type.Optional(Type.Array(Type.String())),
        }),
      },
    },
  }, async (request, reply) => {
    const startTime = Date.now();
    request.log.info('=== FASTIFY UPLOAD API START ===');

    try {
      if (!request.user?.id || !request.user?.tenantId) {
        return reply.code(401).send({
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
        });
      }

      // Get multipart data
      const parts = request.parts();
      const files: any[] = [];
      let context = '';
      let metadata: any = {};

      for await (const part of parts) {
        if (part.type === 'file') {
          // Convert to buffer for processing
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);
          
          files.push({
            filename: part.filename,
            mimetype: part.mimetype,
            buffer,
            size: buffer.length,
          });
        } else {
          // Handle form fields
          if (part.fieldname === 'context') {
            context = part.value as string;
          } else if (part.fieldname === 'metadata') {
            try {
              metadata = JSON.parse(part.value as string);
            } catch {
              metadata = {};
            }
          }
        }
      }

      if (!files.length) {
        return reply.code(400).send({
          success: false,
          error: 'NO_FILES_PROVIDED',
        });
      }

      if (!context) {
        return reply.code(400).send({
          success: false,
          error: 'UPLOAD_CONTEXT_REQUIRED',
        });
      }

      // Validate file types
      const invalidTypes = files.filter(f => !ALL_ALLOWED_TYPES.includes(f.mimetype)).map(f => f.mimetype);
      if (invalidTypes.length > 0) {
        return reply.code(400).send({
          success: false,
          error: `FILE_TYPES_${invalidTypes.join(', ')} not allowed. Allowed: ${ALL_ALLOWED_TYPES.join(', ')}`,
        });
      }

      // Validate file sizes
      const tooLargeFiles = files.filter(f => f.size > MAX_FILE_SIZE);
      if (tooLargeFiles.length > 0) {
        return reply.code(400).send({
          success: false,
          error: `FILES_EXCEED_MAXIMUM_SIZE_OF_${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          details: tooLargeFiles.map(f => `${f.filename} (${(f.size / (1024 * 1024)).toFixed(1)}MB)`),
        });
      }

      const totalSize = files.reduce((acc, f) => acc + f.size, 0);
      if (totalSize > MAX_TOTAL_SIZE) {
        return reply.code(400).send({
          success: false,
          error: `TOTAL_SIZE_EXCEEDS_${MAX_TOTAL_SIZE / (1024 * 1024)}MB_LIMIT`,
        });
      }

      // Get user account and tenant info
      const user = await fastify.prisma.user.findUnique({
        where: { tenantId: request.user.tenantId, id: request.user.uuid as UUID },
        include: {
          account: {
            include: {
              tenant: true,
            },
          },
        },
      });

      if (!user?.account?.tenant) {
        return reply.code(404).send({
          success: false,
          error: 'USER_ACCOUNT_OR_TENANT_NOT_FOUND',
        });
      }

      // Process each file
      const processedFiles = [];
      for (const file of files) {
        const mediaType = getMediaType(file.mimetype);
        const pictureType = getPictureType(context);
        const fileHash = generateFileHash(file.buffer);
        const directoryHash = generateDirectoryHash(user.account.tenant.uuid, mediaType);
        
        // Generate structured filename and path
        const fileExtension = path.extname(file.filename).toLowerCase();
        const fileName = `${directoryHash}_${fileHash}${fileExtension}`;
        
        // Create directory structure
        const s3BucketPath = `/media/${user.account.tenant.uuid}/${directoryHash.substring(0, 2)}/${directoryHash.substring(2, 4)}/${directoryHash.substring(4, 6)}/${directoryHash.substring(6, 8)}`;
        const diskPath = path.join(storageBasePath, s3BucketPath, fileName);
        const cdnUrl = `${s3BucketPath}/${fileName}`;

        // Ensure directory exists
        await mkdir(path.dirname(diskPath), { recursive: true });
        
        // Write file to disk
        await writeFile(diskPath, file.buffer);
        
        // Create media asset record
        const mediaAsset = await fastify.prisma.mediaAsset.create({
          data: {
            tenantId: user.account.tenantId,
            userId: request.user.uuid as UUID,
            fileName,
            originalName: file.filename,
            mimeType: file.mimetype,
            fileSize: file.size,
            mediaType,
            directoryHash,
            fileHash,
            pictureType,
            // CDN URL is computed from directoryHash + fileName
            // Other fields use database defaults
          },
        });

        // Update user profile picture if context is profile_picture
        if (pictureType === 'profile_picture') {
          try {
            await fastify.prisma.user.update({
              where: { tenantId: request.user.tenantId, id: request.user.uuid as UUID },
              data: { 
                profilePhotoUrl: cdnUrl,
                updatedAt: new Date(),
              },
            });
            request.log.info('User profile picture URL updated', { userId: request.user.uuid as UUID, cdnUrl });
          } catch (profileUpdateError) {
            request.log.error('Failed to update user profile picture URL', { error: profileUpdateError });
          }
        }

        // Create processing record for optimization
        const processingRecord = await fastify.prisma.mediaProcessing.create({
          data: {
            mediaId: mediaAsset.uuid as UUID,
            processingType: 'optimization',
            status: 'pending',
            startedAt: new Date(),
          },
        });

        // Queue optimization job based on media type
        let jobId: string | null = null;
        try {
          const optimizationParams = {
            mediaAssetId: mediaAsset.uuid as UUID,
            filePath: diskPath,
            mimeType: file.mimetype,
            quality: 80,
          };

          if (mediaType === 'photo') {
            // Queue image optimization
            request.log.info('Queueing image optimization', optimizationParams);
            // jobId = await queueImageOptimization({ ...optimizationParams, thumbnailSizes: ['150', '300', '600'] });
          } else if (mediaType === 'video') {
            // Queue video optimization
            request.log.info('Queueing video optimization', optimizationParams);
            // jobId = await queueVideoOptimization(optimizationParams);
          } else if (mediaType === 'document') {
            // Queue document optimization
            request.log.info('Queueing document optimization', { ...optimizationParams, generateThumbnail: true });
            // jobId = await queueDocumentOptimization({ ...optimizationParams, generateThumbnail: true });
          }

          // Update processing record with job ID
          if (jobId) {
            await fastify.prisma.mediaProcessing.update({
              where: { tenantId: request.user.tenantId },
              data: { jobId },
            });
          }
        } catch (queueError) {
          request.log.warn('Failed to queue optimization job', { error: queueError });
        }

        processedFiles.push({
          fileName: mediaAsset.fileName,
          originalName: mediaAsset.originalName,
          url: cdnUrl,
          thumbnailUrl: null, // Will be set after processing
          fileSize: mediaAsset.fileSize,
          mimeType: mediaAsset.mimeType,
          mediaType: mediaAsset.mediaType,
          pictureType: mediaAsset.pictureType,
          dimensions: null, // Will be extracted during processing
          metadata,
          processingStatus: jobId ? 'queued' : 'pending',
          jobId,
        });
      }

      request.log.info('Upload completed successfully', {
        fileCount: processedFiles.length,
        totalSize,
        duration: Date.now() - startTime,
      });

      return {
        success: true,
        data: {
          uploadedFiles: processedFiles,
          totalSize,
          processedCount: processedFiles.length,
        },
      };

    } catch (error: any) {
      request.log.error('Upload failed', { 
        error: error.message, 
        stack: error.stack,
        duration: Date.now() - startTime,
      });
      
      return reply.code(500).send({
        success: false,
        error: 'UPLOAD_FAILED._PLEASE_TRY_AGAIN.',
      });
    }
  });

  // Enhanced delete with grace period and garbage collection
  fastify.post('/delete', {
    preHandler: [fastify.authenticate, fastify.requirePermission('media:delete')],
    schema: {
      tags: ['tenant.media'],
      body: Type.Object({
        mediaAssetId: Type.Number(),
        gracePeriodHours: Type.Optional(Type.Number({ minimum: 1, maximum: 168, default: 24 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          data: Type.Object({
            mediaAssetId: Type.Number(),
            fileName: Type.String(),
            status: Type.String(),
            gracePeriodHours: Type.Number(),
            scheduledDeletion: Type.String(),
          }),
        }),
        400: Type.Object({
          success: Type.Boolean(),
          error: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    const { mediaAssetId, gracePeriodHours = 24 } = request.body;
    const startTime = Date.now();

    try {
      if (!request.user?.id || !request.user?.tenantId) {
        return reply.code(401).send({
          success: false,
          error: 'AUTHENTICATION_REQUIRED',
        });
      }

      request.log.info('Processing media deletion request', {
        userId: request.user.uuid as UUID,
        mediaAssetId,
        gracePeriodHours,
        tenantId: request.user.tenantId,
      });

      // Get the media asset and verify ownership with tenant isolation
      const mediaAsset = await fastify.prisma.mediaAsset.findFirst({
        where: {
          id: mediaAssetId,
          userId: request.user.uuid as UUID,
          tenantId: request.user.tenantId,
        },
      });

      if (!mediaAsset) {
        return reply.code(404).send({
          success: false,
          error: 'MEDIA_ASSET_NOT_FOUND_OR_ACCESS_DENIED',
        });
      }

      // Check if already marked for deletion
      if (mediaAsset.deletionStatus === 'pending_deletion') {
        return reply.code(400).send({
          success: false,
          error: 'MEDIA_ASSET_IS_ALREADY_MARKED_FOR_DELETION',
        });
      }

      if (mediaAsset.deletionStatus === 'deleted') {
        return reply.code(400).send({
          success: false,
          error: 'MEDIA_ASSET_HAS_ALREADY_BEEN_DELETED',
        });
      }

      request.log.info('Marking media asset for deletion', {
        mediaAssetId,
        fileName: mediaAsset.fileName,
        currentStatus: mediaAsset.deletionStatus,
        tenantId: request.user.tenantId,
      });

      // Update media asset to pending deletion status
      const updatedAsset = await fastify.prisma.mediaAsset.update({
        where: {
          id: mediaAssetId,
          tenantId: request.user.tenantId,
        },
        data: {
          deletionStatus: 'pending_deletion',
          deletionRequestedAt: new Date(),
          deletionRequestedBy: request.user.uuid as UUID,
          updatedAt: new Date(),
        },
      });

      request.log.info('Media asset marked for deletion successfully', {
        mediaAssetId,
        fileName: updatedAsset.fileName,
        tenantId: request.user.tenantId,
        duration: Date.now() - startTime,
      });

      const scheduledDeletion = new Date(Date.now() + (gracePeriodHours * 60 * 60 * 1000));

      // Note: In a real implementation, you would queue this for deletion
      request.log.info('Media deletion scheduled', {
        mediaAssetId,
        gracePeriodHours,
        tenantId: request.user.tenantId,
        scheduledFor: scheduledDeletion,
      });

      return {
        success: true,
        message: 'Media asset marked for deletion successfully',
        data: {
          mediaAssetId,
          fileName: updatedAsset.fileName,
          status: updatedAsset.deletionStatus,
          gracePeriodHours,
          scheduledDeletion: scheduledDeletion.toISOString(),
        },
      };

    } catch (error: any) {
      request.log.error('Media deletion request failed', {
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime,
      });

      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_PROCESS_DELETION_REQUEST',
      });
    }
  });

  // Garbage collection endpoint
  fastify.post('/garbage-collect', {
    preHandler: [fastify.authenticate, fastify.requirePermission('media:admin')],
    schema: {
      tags: ['tenant.media'],
      body: Type.Object({
        dryRun: Type.Optional(Type.Boolean({ default: false })),
        olderThanDays: Type.Optional(Type.Number({ minimum: 1, default: 30 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            deletedCount: Type.Number(),
            freedSpaceBytes: Type.Number(),
            dryRun: Type.Boolean(),
            processedAssets: Type.Array(Type.Object({
              fileName: Type.String(),
              fileSize: Type.Number(),
            })),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { dryRun = false, olderThanDays = 30 } = request.body;
    const startTime = Date.now();

    try {
      const cutoffDate = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));

      // Find assets eligible for permanent deletion
      const eligibleAssets = await fastify.prisma.mediaAsset.findMany({
        where: { tenantId: request.user.tenantId, deletionStatus: 'pending_deletion',
          deletionRequestedAt: {
            lte: cutoffDate, },
          tenantId: request.user!.tenantId,
        },
      });

      const processedAssets = [];
      let freedSpaceBytes = 0;

      for (const asset of eligibleAssets) {
        processedAssets.push({
          fileName: asset.fileName,
          fileSize: asset.fileSize,
        });
        freedSpaceBytes += asset.fileSize;

        if (!dryRun) {
          // Update status to deleted
          await fastify.prisma.mediaAsset.update({
            where: { tenantId: request.user.tenantId },
            data: {
              deletionStatus: 'deleted',
              deletedAt: new Date(),
            },
          });

          // Note: In production, you would also delete the physical files here
          request.log.info('Asset permanently deleted', {
            assetId: asset.uuid as UUID,
            fileName: asset.fileName,
          });
        }
      }

      request.log.info('Garbage collection completed', {
        deletedCount: processedAssets.length,
        freedSpaceBytes,
        dryRun,
        duration: Date.now() - startTime,
      });

      return {
        success: true,
        data: {
          deletedCount: processedAssets.length,
          freedSpaceBytes,
          dryRun,
          processedAssets,
        },
      };

    } catch (error: any) {
      request.log.error('Garbage collection failed', {
        error: error.message,
        stack: error.stack,
      });

      return reply.code(500).send({
        success: false,
        error: 'GARBAGE_COLLECTION_FAILED',
      });
    }
  });

  // Get media asset details
  fastify.get('/:id', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.media.read')
    ],
    schema: {
      tags: ['tenant.media'],
      params: Type.Object({
        }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
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
            processingStatus: Type.String(),
            uploadedAt: Type.String(),
            updatedAt: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: number };

    try {
      const mediaAsset = await fastify.prisma.mediaAsset.findFirst({
        where: {
          id,
          tenantId: request.user!.tenantId,
          deletionStatus: { not: 'deleted' },
        },
      });

      if (!mediaAsset) {
        return reply.code(404).send({
          success: false,
          error: 'MEDIA_ASSET_NOT_FOUND',
        });
      }

      // Check ownership or admin permission
      if (mediaAsset.userId !== request.user!.id && !request.user!.roles.includes('admin')) {
        return reply.code(403).send({
          success: false,
          error: 'PERMISSION_DENIED',
        });
      }

      // Compute CDN URL
      const cdnUrl = `/media/${mediaAsset.directoryHash.substring(0, 2)}/${mediaAsset.directoryHash.substring(2, 4)}/${mediaAsset.directoryHash.substring(4, 6)}/${mediaAsset.directoryHash.substring(6, 8)}/${mediaAsset.fileName}`;

      return {
        success: true,
        data: {
          fileName: mediaAsset.fileName,
          originalName: mediaAsset.originalName,
          url: cdnUrl,
          thumbnailUrl: mediaAsset.thumbnailUrl,
          fileSize: mediaAsset.fileSize,
          mimeType: mediaAsset.mimeType,
          mediaType: mediaAsset.mediaType,
          pictureType: mediaAsset.pictureType,
          dimensions: mediaAsset.dimensions as any,
          isProcessed: mediaAsset.isProcessed,
          processingStatus: mediaAsset.processingStatus,
          uploadedAt: mediaAsset.createdAt.toISOString(),
          updatedAt: mediaAsset.updatedAt.toISOString(),
        },
      };

    } catch (error: any) {
      request.log.error('Failed to get media asset', { error: error.message, id });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_GET_MEDIA_ASSET',
      });
    }
  });

  // Immediate delete (without grace period)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate, fastify.requirePermission('media:delete')],
    schema: {
      tags: ['tenant.media'],
      params: Type.Object({
        }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: number };

    try {
      // Find media asset
      const mediaAsset = await fastify.prisma.mediaAsset.findFirst({
        where: {
          id,
          tenantId: request.user!.tenantId,
        },
      });

      if (!mediaAsset) {
        return reply.code(404).send({
          success: false,
          error: 'MEDIA_ASSET_NOT_FOUND',
        });
      }

      // Check ownership or admin permission
      if (mediaAsset.userId !== request.user!.id && !request.user!.roles.includes('admin')) {
        return reply.code(403).send({
          success: false,
          error: 'PERMISSION_DENIED',
        });
      }

      // Immediate soft delete
      await fastify.prisma.mediaAsset.update({
        where: { tenantId: request.user.tenantId, id },
        data: { 
          deletionStatus: 'deleted',
          deletedAt: new Date(),
          deletionRequestedBy: request.user!.id,
        },
      });

      request.log.info('Media asset deleted immediately', {
        mediaAssetId: id,
        fileName: mediaAsset.fileName,
        userId: request.user!.id,
      });

      return {
        success: true,
        message: 'Media asset deleted successfully',
      };

    } catch (error: any) {
      request.log.error('Media deletion error', { error: error.message, id });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_DELETE_MEDIA_ASSET',
      });
    }
  });

  // Enhanced list user's media with comprehensive filtering
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.media.read')
    ],
    schema: {
      tags: ['tenant.media'],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        mediaType: Type.Optional(Type.String()), // photo, video, audio, document
        pictureType: Type.Optional(Type.String()), // profile_picture, model_book, etc.
        search: Type.Optional(Type.String()),
        sortBy: Type.Optional(Type.String({ default: 'createdAt' })), // createdAt, fileName, fileSize
        sortOrder: Type.Optional(Type.String({ default: 'desc' })), // asc, desc
        isProcessed: Type.Optional(Type.Boolean()),
        includeDeleted: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            media: Type.Array(Type.Object({
              fileName: Type.String(),
              originalName: Type.String(),
              url: Type.String(),
              thumbnailUrl: Type.Optional(Type.String()),
              fileSize: Type.Number(),
              mimeType: Type.String(),
              mediaType: Type.String(),
              pictureType: Type.String(),
              isProcessed: Type.Boolean(),
              processingStatus: Type.String(),
              uploadedAt: Type.String(),
              updatedAt: Type.String(),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              totalPages: Type.Number(),
            }),
            stats: Type.Object({
              totalSize: Type.Number(),
              photoCount: Type.Number(),
              videoCount: Type.Number(),
              audioCount: Type.Number(),
              documentCount: Type.Number(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { 
      page = 1, 
      limit = 20, 
      mediaType, 
      pictureType, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      isProcessed,
      includeDeleted = false
    } = request.query as any;
    
    const skip = (page - 1) * limit;

    // Build where clause with comprehensive filtering
    const where: any = {
      userId: request.user!.id,
      tenantId: request.user!.tenantId,
    };

    if (!includeDeleted) {
      where.deletionStatus = { not: 'deleted' };
    }

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

    if (isProcessed !== undefined) {
      where.isProcessed = isProcessed;
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    try {
      const [media, total, stats] = await Promise.all([
        fastify.prisma.mediaAsset.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: {
            id: true,
            fileName: true,
            originalName: true,
            fileSize: true,
            mimeType: true,
            mediaType: true,
            pictureType: true,
            directoryHash: true,
            thumbnailUrl: true,
            isProcessed: true,
            processingStatus: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        fastify.prisma.mediaAsset.count({ where }),
        // Get stats for all user's media
        fastify.prisma.mediaAsset.groupBy({
          by: ['mediaType'],
          where: {
            userId: request.user!.id,
            tenantId: request.user!.tenantId,
            deletionStatus: { not: 'deleted' },
          },
          _count: { mediaType: true },
          _sum: { fileSize: true },
        }),
      ]);

      // Process stats
      const mediaStats = {
        totalSize: 0,
        photoCount: 0,
        videoCount: 0,
        audioCount: 0,
        documentCount: 0,
      };

      stats.forEach(stat => {
        mediaStats.totalSize += stat._sum.fileSize || 0;
        switch (stat.mediaType) {
          case 'photo':
            mediaStats.photoCount = stat._count.mediaType;
            break;
          case 'video':
            mediaStats.videoCount = stat._count.mediaType;
            break;
          case 'audio':
            mediaStats.audioCount = stat._count.mediaType;
            break;
          case 'document':
            mediaStats.documentCount = stat._count.mediaType;
            break;
        }
      });

      return {
        success: true,
        data: {
          media: media.map(m => {
            // Compute CDN URL
            const cdnUrl = `/media/${m.directoryHash.substring(0, 2)}/${m.directoryHash.substring(2, 4)}/${m.directoryHash.substring(4, 6)}/${m.directoryHash.substring(6, 8)}/${m.fileName}`;
            
            return {
              fileName: m.fileName,
              originalName: m.originalName,
              url: cdnUrl,
              thumbnailUrl: m.thumbnailUrl,
              fileSize: m.fileSize,
              mimeType: m.mimeType,
              mediaType: m.mediaType,
              pictureType: m.pictureType,
              isProcessed: m.isProcessed,
              processingStatus: m.processingStatus,
              uploadedAt: m.createdAt.toISOString(),
              updatedAt: m.updatedAt.toISOString(),
            };
          }),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          stats: mediaStats,
        },
      };

    } catch (error: any) {
      request.log.error('Failed to list media assets', { error: error.message });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_LIST_MEDIA_ASSETS',
      });
    }
  });

  // Get processing status for multiple assets
  fastify.post('/processing-status', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.media.read')
    ],
    schema: {
      tags: ['tenant.media'],
      body: Type.Object({
        mediaAssetIds: Type.Array(Type.Number()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(Type.Object({
            isProcessed: Type.Boolean(),
            processingStatus: Type.String(),
            jobId: Type.Optional(Type.String()),
            thumbnailUrl: Type.Optional(Type.String()),
            dimensions: Type.Optional(Type.Object({
              width: Type.Number(),
              height: Type.Number(),
            })),
          })),
        }),
      },
    },
  }, async (request, reply) => {
    const { mediaAssetIds } = request.body;

    try {
      const assets = await fastify.prisma.mediaAsset.findMany({
        where: { tenantId: request.user.tenantId, id: { in: mediaAssetIds },
          userId: request.user!.id,
          tenantId: request.user!.tenantId,
        },
        include: {
          processing: {
            orderBy: { startedAt: 'desc' },
            take: 1,
          },
        },
      });

      return {
        success: true,
        data: assets.map(asset => ({
          isProcessed: asset.isProcessed,
          processingStatus: asset.processingStatus,
          jobId: asset.processing[0]?.jobId || null,
          thumbnailUrl: asset.thumbnailUrl,
          dimensions: asset.dimensions as any,
        })),
      };

    } catch (error: any) {
      request.log.error('Failed to get processing status', { error: error.message });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_GET_PROCESSING_STATUS',
      });
    }
  });
};