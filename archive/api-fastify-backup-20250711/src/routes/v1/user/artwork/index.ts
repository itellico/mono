import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { storageService, ArtworkUpload } from '@/services/storage.service';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { Type } from '@sinclair/typebox';

const ArtworkTypeSchema = Type.Union([
  Type.Literal('logos'),
  Type.Literal('banners'), 
  Type.Literal('backgrounds'),
  Type.Literal('themes')
]);

const UploadArtworkSchema = Type.Object({
  artworkType: ArtworkTypeSchema,
  description: Type.Optional(Type.String()),
  tags: Type.Optional(Type.Array(Type.String()))
});

const ArtworkResponseSchema = Type.Object({
  success: Type.Boolean(),
  data: Type.Optional(Type.Object({
    id: Type.String(),
    fileName: Type.String(),
    url: Type.String(),
    relativePath: Type.String(),
    size: Type.Number(),
    mimeType: Type.String(),
    hash: Type.String(),
    artworkType: ArtworkTypeSchema,
    uploadedAt: Type.String(),
    tenantUuid: uuidSchema
  })),
  error: Type.Optional(Type.String())
});

interface UploadArtworkBody {
  artworkType: 'logos' | 'banners' | 'backgrounds' | 'themes';
  description?: string;
  tags?: string[];
}

interface ArtworkListQuery {
  artworkType?: 'logos' | 'banners' | 'backgrounds' | 'themes';
  page?: string;
  limit?: string;
}

export default async function artworkRoutes(fastify: FastifyInstance) {
  // Upload tenant artwork
  fastify.post<{
    Body: UploadArtworkBody;
    Reply: typeof ArtworkResponseSchema;
  }>('/upload', {
    schema: {
      tags: ['user.artwork'],
      summary: 'Upload tenant-specific artwork',
      description: 'Upload artwork files (logos, banners, backgrounds, themes) for a tenant',
      body: UploadArtworkSchema,
      response: {
        200: ArtworkResponseSchema,
        400: Type.Object({
          success: Type.Literal(false),
          error: Type.String()
        })
      },
      security: [{ bearerAuth: [] }]
    },
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('artwork:upload')
    ]
  }, async (request: FastifyRequest<{ Body: UploadArtworkBody }>, reply: FastifyReply) => {
    try {
      const { artworkType, description, tags } = request.body;
      const { tenantId, tenantUuid } = request.tenant;

      // Handle multipart file upload
      const uploadedFiles = request.files();
      
      for await (const file of uploadedFiles) {
        if (file.fieldname !== 'file') continue;

        const fileBuffer = await file.toBuffer();
        const fileName = file.filename || `artwork_${Date.now()}`;
        const mimeType = file.mimetype;

        // Create artwork upload configuration
        const artworkUpload: ArtworkUpload = {
          tenantUuid,
          artworkType,
          fileName,
          fileBuffer,
          mimeType
        };

        // Store artwork using storage service
        const metadata = await storageService.storeArtwork(artworkUpload);

        // TODO: Save artwork record to database
        // const artworkRecord = await prisma.artwork.create({
        //   data: {
        //     tenantId,
        //     fileName,
        //     originalName: file.filename,
        //     mimeType,
        //     size: fileBuffer.length,
        //     relativePath: metadata.relativePath,
        //     url: metadata.url,
        //     hash: metadata.hash,
        //     artworkType,
        //     description,
        //     tags: tags || [],
        //     uploadedAt: new Date()
        //   }
        // });

        return reply.code(200).send({
          success: true,
          data: {
            id: metadata.hash, // Temporary ID until database integration
            fileName,
            url: metadata.url,
            relativePath: metadata.relativePath,
            size: metadata.size,
            mimeType: metadata.mimeType,
            hash: metadata.hash,
            artworkType,
            uploadedAt: new Date().toISOString(),
            tenantUuid
          }
        });
      }

      return reply.code(400).send({
        success: false,
        error: 'NO_VALID_FILE_UPLOADED'
      });

    } catch (error) {
      fastify.log.error('Artwork upload failed:', error);
      
      return reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  });

  // List tenant artwork
  fastify.get<{
    Querystring: ArtworkListQuery;
  }>('/', {
    schema: {
      tags: ['user.artwork'],
      summary: 'List tenant artwork',
      description: 'Get all artwork files for the current tenant',
      querystring: Type.Object({
        artworkType: Type.Optional(ArtworkTypeSchema),
        page: Type.Optional(Type.String()),
        limit: Type.Optional(Type.String())
      }),
      security: [{ bearerAuth: [] }]
    },
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('artwork:read')
    ]
  }, async (request: FastifyRequest<{ Querystring: ArtworkListQuery }>, reply: FastifyReply) => {
    try {
      const { artworkType, page = '1', limit = '50' } = request.query;
      const { tenantUuid } = request.tenant;

      // Get files from storage service
      const files = await storageService.listTenantFiles(
        tenantUuid,
        'artwork',
        artworkType
      );

      // TODO: Get artwork records from database with pagination
      // const artworkRecords = await prisma.artwork.findMany({
      //   where: {
      //     tenantId: request.tenant.tenantId,
      //     ...(artworkType && { artworkType })
      //   },
      //   orderBy: { uploadedAt: 'desc' },
      //   skip: (parseInt(page) - 1) * parseInt(limit),
      //   take: parseInt(limit)
      // });

      // For now, return file list from storage
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedFiles = files.slice(startIndex, startIndex + limitNum);

      const artworkList = await Promise.all(
        paginatedFiles.map(async (filePath) => {
          const metadata = await storageService.getFileMetadata(filePath);
          return {
            id: metadata?.hash || 'unknown',
            fileName: filePath.split('/').pop() || '',
            url: metadata?.url || '',
            relativePath: metadata?.relativePath || '',
            size: metadata?.size || 0,
            mimeType: metadata?.mimeType || 'application/octet-stream',
            hash: metadata?.hash || '',
            artworkType: metadata?.context || 'unknown',
            uploadedAt: new Date().toISOString(), // Would come from database
            tenantUuid
          };
        })
      );

      return reply.send({
        success: true,
        data: artworkList,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: files.length,
          pages: Math.ceil(files.length / limitNum)
        }
      });

    } catch (error) {
      fastify.log.error('Failed to list artwork:', error);
      
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_RETRIEVE_ARTWORK_LIST'
      });
    }
  });

  // Delete artwork
  fastify.delete<{
    Params: { id: string };
  }>('/:id', {
    schema: {
      tags: ['user.artwork'],
      summary: 'Delete artwork',
      description: 'Delete a specific artwork file',
      params: Type.Object({
        id: Type.String()
      }),
      security: [{ bearerAuth: [] }]
    },
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('artwork:delete')
    ]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const { tenantUuid } = request.tenant;

      // TODO: Get artwork record from database and delete file
      // const artwork = await prisma.artwork.findFirst({
      //   where: {
      //     id,
      //     tenantId: request.tenant.tenantId
      //   }
      // });

      // if (!artwork) {
      //   return reply.code(404).send({
      //     success: false,
      //     error: 'ARTWORK_NOT_FOUND'
      //   });
      // }

      // // Delete physical file
      // const deleted = await storageService.deleteFile(artwork.relativePath, tenantUuid);

      // if (deleted) {
      //   // Delete database record
      //   await prisma.artwork.delete({
      //     where: { tenantId: request.user.tenantId, id }
      //   });
      // }

      return reply.send({
        success: true,
        message: 'Artwork deleted successfully'
      });

    } catch (error) {
      fastify.log.error('Failed to delete artwork:', error);
      
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_DELETE_ARTWORK'
      });
    }
  });

  // Get tenant storage statistics
  fastify.get('/stats', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.artwork.read')
    ],
    schema: {
      tags: ['user.artwork'],
      summary: 'Get storage statistics',
      description: 'Get storage usage statistics for the current tenant',
      security: [{ bearerAuth: [] }]
    },
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('artwork:read')
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { tenantUuid } = request.tenant;

      const stats = await storageService.getTenantStorageStats(tenantUuid);

      return reply.send({
        success: true,
        data: {
          tenantUuid,
          ...stats,
          formatted: {
            totalSize: `${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`,
            breakdown: Object.entries(stats.breakdown).map(([category, data]) => ({
              category,
              size: `${(data.size / 1024 / 1024).toFixed(2)} MB`,
              count: data.count
            }))
          }
        }
      });

    } catch (error) {
      fastify.log.error('Failed to get storage stats:', error);
      
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_RETRIEVE_STORAGE_STATISTICS'
      });
    }
  });
}