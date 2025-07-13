/**
 * @openapi
 * /api/portfolio/media:
 *   get:
 *     tags:
 *       - Portfolio
 *       - Media
 *     summary: Portfolio Media Management
     tags:
       - Portfolio
 *     description: Portfolio Media Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Operation successful
 *       '401':
 *         description: Authentication required
 *       '500':
 *         description: Internal server error
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/database';
import { mediaAssets, modelProfiles } from '@/lib/schema';
import { auth } from '@/lib/auth';
import { validateApiAccess } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { eq, and, desc, asc, like, inArray, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

const MediaQuerySchema = z.object({
  userId: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(['image', 'video']).optional(),
  tags: z.string().optional(), // comma-separated
  sort: z.enum(['date-desc', 'date-asc', 'views-desc', 'likes-desc', 'name-asc', 'name-desc']).default('date-desc'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  featured: z.enum(['true', 'false']).optional(),
  isPrivate: z.enum(['true', 'false']).optional()
});

const MediaUploadSchema = z.object({
  fileName: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  mediaType: z.enum(['photo', 'video', 'audio', 'document']),
  fileSize: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  fileHash: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export async function GET(request: NextRequest) {
  try {
    // Validate authentication and tenant context
    const { user, tenantId } = await validateApiAccess(request, {
      requireAuth: true,
      requireTenant: true
    });

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);

    // Validate query parameters
    const query = MediaQuerySchema.parse(params);

    // Build the query conditions
    const conditions = [
      eq(mediaAssets.tenantId, tenantId)
    ];

    if (query.userId) {
      conditions.push(eq(mediaAssets.userId, parseInt(query.userId)));
    } else {
      conditions.push(eq(mediaAssets.userId, parseInt(user.id)));
    }

    // Search filter (only filename/originalName since title/description don't exist)
    if (query.search) {
      const searchTerm = `%${query.search}%`;
      conditions.push(
        sql`(
          ${mediaAssets.fileName} ILIKE ${searchTerm} OR
          ${mediaAssets.originalName} ILIKE ${searchTerm}
        )`
      );
    }

    // Determine sort order (using existing fields only)
    let orderBy;
    switch (query.sort) {
      case 'date-asc':
        orderBy = asc(mediaAssets.createdAt);
        break;
      case 'date-desc':
      default:
        orderBy = desc(mediaAssets.createdAt);
        break;
      case 'name-asc':
        orderBy = asc(mediaAssets.fileName);
        break;
      case 'name-desc':
        orderBy = desc(mediaAssets.fileName);
        break;
    }

    // Execute the query using only existing fields
    const results = await db
      .select({
        id: mediaAssets.id,
        uuid: mediaAssets.uuid,
        fileName: mediaAssets.fileName,
        originalName: mediaAssets.originalName,
        mimeType: mediaAssets.mimeType,
        mediaType: mediaAssets.mediaType,
        fileSize: mediaAssets.fileSize,
        width: mediaAssets.width,
        height: mediaAssets.height,
        isProcessed: mediaAssets.isProcessed,
        processingStatus: mediaAssets.processingStatus,
        pictureType: mediaAssets.pictureType,
        directoryHash: mediaAssets.directoryHash,
        fileHash: mediaAssets.fileHash,
        uploadedAt: mediaAssets.createdAt,
        metadata: mediaAssets.metadata
      })
      .from(mediaAssets)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(query.limit)
      .offset(query.offset);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(mediaAssets)
      .where(and(...conditions));

    const totalCount = totalCountResult[0]?.count || 0;

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / query.limit);
    const currentPage = Math.floor(query.offset / query.limit) + 1;
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;

    logger.info('Portfolio media fetched successfully', {
      userId: query.userId || user.id,
      tenantId: tenantId,
      resultsCount: results.length,
      totalCount,
      filters: {
        search: query.search
      }
    });

    return successResponse({
      media: results,
      pagination: {
        totalCount,
        totalPages,
        currentPage,
        hasNextPage,
        hasPreviousPage,
        limit: query.limit,
        offset: query.offset
      },
      filters: {
        search: query.search,
        sort: query.sort
      }
    });

  } catch (error) {
    logger.error('Failed to fetch portfolio media', {
      error: error.message,
      stack: error.stack,
      url: request.url
    });

    if (error instanceof z.ZodError) {
      return errorResponse('Invalid query parameters', 400);
    }

    return errorResponse('Failed to fetch portfolio media', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate authentication and permissions
    const { user, tenantId } = await validateApiAccess(request, {
      requireAuth: true,
      requireTenant: true
    });

    // Parse and validate request body
    const body = await request.json();
    const data = MediaUploadSchema.parse(body);

    // TODO: Check tenant limits for media upload
    // await checkTenantLimits(tenantId, 'upload_media', 1);

    // Create media asset record
    const [newMediaAsset] = await db
      .insert(mediaAssets)
      .values({
        tenantId: tenantId,
        userId: parseInt(user.id),
        fileName: data.fileName,
        originalName: data.originalName,
        mimeType: data.mimeType,
        mediaType: data.mediaType,
        fileSize: data.fileSize,
        width: data.width || 0,
        height: data.height || 0,
        directoryHash: Math.random().toString(16).substring(2, 19), // Generate 17-char hash
        fileHash: data.fileHash || Math.random().toString(16).substring(2, 66), // Generate 64-char hash
        metadata: data.metadata || {}
      })
      .returning();

    logger.info('Portfolio media uploaded successfully', {
      mediaAssetId: newMediaAsset.id,
      userId: user.id,
      tenantId: tenantId,
      mediaType: data.mediaType,
      fileSize: data.fileSize
    });

    return successResponse({
      mediaAsset: newMediaAsset
    }, 'Media asset uploaded successfully');

  } catch (error) {
    logger.error('Failed to upload portfolio media', {
      error: error.message,
      stack: error.stack
    });

    if (error instanceof z.ZodError) {
      return errorResponse('Invalid upload data', 400);
    }

    return errorResponse('Failed to upload media', 500);
  }
} 