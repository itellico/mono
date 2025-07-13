import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import crypto from 'crypto';

/**
 * User Media Upload Routes
 * Handle file uploads for users
 */
export const userMediaUploadRoutes: FastifyPluginAsync = async (fastify) => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mov', 'video/avi'];
  const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain'];

  // Upload single file
  fastify.post('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.media.uploads.read')
    ],
    schema: {
      tags: ['user.media'],
      summary: 'Upload file',
      description: 'Upload a single file',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            file: Type.Object({
              uuid: uuidSchema,
              fileName: Type.String(),
              originalName: Type.String(),
              url: Type.String(),
              mimeType: Type.String(),
              fileSize: Type.Number(),
              uploadedAt: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const parts = request.parts();
        let fileBuffer: Buffer | null = null;
        let filename: string | null = null;
        let mimetype: string | null = null;
        let context = 'general';

        for await (const part of parts) {
          if (part.type === 'file') {
            const chunks: Buffer[] = [];
            for await (const chunk of part.file) {
              chunks.push(chunk);
            }
            fileBuffer = Buffer.concat(chunks);
            filename = part.filename;
            mimetype = part.mimetype;
          } else if (part.fieldname === 'context') {
            context = part.value as string;
          }
        }

        if (!fileBuffer || !filename || !mimetype) {
          return reply.status(400).send({
            success: false,
            error: 'NO_FILE_PROVIDED',
          });
        }

        // Validate file type
        const allAllowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES];
        if (!allAllowedTypes.includes(mimetype)) {
          return reply.status(400).send({
            success: false,
            error: 'FILE_TYPE_NOT_ALLOWED',
          });
        }

        // Validate file size
        if (fileBuffer.length > MAX_FILE_SIZE) {
          return reply.status(400).send({
            success: false,
            error: 'FILE_SIZE_EXCEEDS_${MAX_FILE_SIZE_/_(1024_*_1024)}MB_LIMIT',
          });
        }

        // Determine media type
        let mediaType: 'photo' | 'video' | 'document' = 'document';
        if (ALLOWED_IMAGE_TYPES.includes(mimetype)) mediaType = 'photo';
        else if (ALLOWED_VIDEO_TYPES.includes(mimetype)) mediaType = 'video';

        // Generate file hash
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        const directoryHash = crypto.createHash('md5')
          .update(`${request.user!.tenantId}-${mediaType}-${Date.now()}`)
          .digest('hex')
          .substring(0, 10);

        // Generate filename
        const fileExtension = path.extname(filename).toLowerCase();
        const newFileName = `${directoryHash}_${fileHash}${fileExtension}`;

        // Create directory structure
        const storageBasePath = process.env.UPLOAD_DIR || './public';
        const s3BucketPath = `/media/${request.user!.tenantId}/${directoryHash.substring(0, 2)}/${directoryHash.substring(2, 4)}`;
        const diskPath = path.join(storageBasePath, s3BucketPath, newFileName);
        const cdnUrl = `${s3BucketPath}/${newFileName}`;

        // Ensure directory exists
        await mkdir(path.dirname(diskPath), { recursive: true });

        // Write file to disk
        await writeFile(diskPath, fileBuffer);

        // Create media asset record
        const mediaAsset = await fastify.prisma.mediaAsset.create({
          data: {
            tenantId: request.user!.tenantId,
            userId: request.user!.id,
            fileName: newFileName,
            originalName: filename,
            mimeType: mimetype,
            fileSize: fileBuffer.length,
            mediaType,
            directoryHash,
            fileHash,
            pictureType: context === 'profile' ? 'profile_picture' : 'model_book',
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            file: {
              uuid: mediaAsset.uuid,
              fileName: mediaAsset.fileName,
              originalName: mediaAsset.originalName,
              url: cdnUrl,
              mimeType: mediaAsset.mimeType,
              fileSize: mediaAsset.fileSize,
              uploadedAt: mediaAsset.createdAt.toISOString(),
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to upload file');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPLOAD_FILE',
        });
      }
    },
  });

  // Upload multiple files
  fastify.post('/batch', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.media.uploads.read')
    ],
    schema: {
      tags: ['user.media'],
      summary: 'Upload multiple files',
      description: 'Upload multiple files at once',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            files: Type.Array(Type.Object({
              uuid: uuidSchema,
              fileName: Type.String(),
              originalName: Type.String(),
              url: Type.String(),
              mimeType: Type.String(),
              fileSize: Type.Number(),
            })),
            totalUploaded: Type.Number(),
            totalSize: Type.Number(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const parts = request.parts();
        const files: any[] = [];
        let context = 'general';

        for await (const part of parts) {
          if (part.type === 'file') {
            const chunks: Buffer[] = [];
            for await (const chunk of part.file) {
              chunks.push(chunk);
            }
            files.push({
              buffer: Buffer.concat(chunks),
              filename: part.filename,
              mimetype: part.mimetype,
            });
          } else if (part.fieldname === 'context') {
            context = part.value as string;
          }
        }

        if (files.length === 0) {
          return reply.status(400).send({
            success: false,
            error: 'NO_FILES_PROVIDED',
          });
        }

        // Validate total size
        const totalSize = files.reduce((sum, file) => sum + file.buffer.length, 0);
        if (totalSize > 50 * 1024 * 1024) { // 50MB total
          return reply.status(400).send({
            success: false,
            error: 'TOTAL_FILE_SIZE_EXCEEDS_50MB_LIMIT',
          });
        }

        const uploadedFiles = [];
        const storageBasePath = process.env.UPLOAD_DIR || './public';

        for (const file of files) {
          // Validate file type
          const allAllowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES];
          if (!allAllowedTypes.includes(file.mimetype)) {
            continue; // Skip invalid files
          }

          // Determine media type
          let mediaType: 'photo' | 'video' | 'document' = 'document';
          if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) mediaType = 'photo';
          else if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) mediaType = 'video';

          // Generate file hash
          const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
          const directoryHash = crypto.createHash('md5')
            .update(`${request.user!.tenantId}-${mediaType}-${Date.now()}`)
            .digest('hex')
            .substring(0, 10);

          // Generate filename
          const fileExtension = path.extname(file.filename).toLowerCase();
          const newFileName = `${directoryHash}_${fileHash}${fileExtension}`;

          // Create directory structure
          const s3BucketPath = `/media/${request.user!.tenantId}/${directoryHash.substring(0, 2)}/${directoryHash.substring(2, 4)}`;
          const diskPath = path.join(storageBasePath, s3BucketPath, newFileName);
          const cdnUrl = `${s3BucketPath}/${newFileName}`;

          // Ensure directory exists
          await mkdir(path.dirname(diskPath), { recursive: true });

          // Write file to disk
          await writeFile(diskPath, file.buffer);

          // Create media asset record
          const mediaAsset = await fastify.prisma.mediaAsset.create({
            data: {
              tenantId: request.user!.tenantId,
              userId: request.user!.id,
              fileName: newFileName,
              originalName: file.filename,
              mimeType: file.mimetype,
              fileSize: file.buffer.length,
              mediaType,
              directoryHash,
              fileHash,
              pictureType: 'model_book',
            },
          });

          uploadedFiles.push({
            uuid: mediaAsset.uuid,
            fileName: mediaAsset.fileName,
            originalName: mediaAsset.originalName,
            url: cdnUrl,
            mimeType: mediaAsset.mimeType,
            fileSize: mediaAsset.fileSize,
          });
        }

        return reply.status(201).send({
          success: true,
          data: {
            files: uploadedFiles,
            totalUploaded: uploadedFiles.length,
            totalSize,
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to upload files');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPLOAD_FILES',
        });
      }
    },
  });

  // Get upload limits
  fastify.get('/limits', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.media.uploads.read')
    ],
    schema: {
      tags: ['user.media'],
      summary: 'Get upload limits',
      description: 'Get file upload limits and remaining quota',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            maxFileSize: Type.Number(),
            maxTotalSize: Type.Number(),
            allowedTypes: Type.Array(Type.String()),
            quotaUsed: Type.Number(),
            quotaLimit: Type.Number(),
            quotaRemaining: Type.Number(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        // Get user's current usage
        const usage = await fastify.prisma.mediaAsset.aggregate({
          where: { tenantId: request.user.tenantId, userId: request.user!.id,
            deletionStatus: { not: 'deleted' },
          },
          _sum: {
            fileSize: true,
          },
        });

        const quotaUsed = usage._sum.fileSize || 0;
        const quotaLimit = 1024 * 1024 * 1024; // 1GB default

        return {
          success: true,
          data: {
            maxFileSize: MAX_FILE_SIZE,
            maxTotalSize: 50 * 1024 * 1024, // 50MB for batch uploads
            allowedTypes: [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES],
            quotaUsed,
            quotaLimit,
            quotaRemaining: Math.max(0, quotaLimit - quotaUsed),
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get upload limits');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_UPLOAD_LIMITS',
        });
      }
    },
  });
};