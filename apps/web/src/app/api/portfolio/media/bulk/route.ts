/**
 * @openapi
 * /api/portfolio/media/bulk:
 *   get:
 *     tags:
 *       - Portfolio
 *       - Media
 *     summary: Bulk Portfolio Operations
     tags:
       - Portfolio
 *     description: Bulk Portfolio Operations
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
import { mediaAssets } from '@/lib/schema';
import { validateApiAccess } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { eq, and, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';

const BulkActionSchema = z.object({
  action: z.enum(['feature', 'unfeature', 'delete', 'private', 'public', 'categorize', 'tag', 'download']),
  mediaIds: z.array(z.string()).min(1).max(50),
  metadata: z.object({
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    addTags: z.boolean().optional(), // true = add to existing, false = replace
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    // Validate authentication and permissions
    const { user, tenantId } = await validateApiAccess(request, {
      requireAuth: true,
      requireTenant: true
    });

    const body = await request.json();
    const { action, mediaIds, metadata = {} } = BulkActionSchema.parse(body);

    // Verify all media assets belong to the user and tenant
    const mediaToUpdate = await db
      .select({
        id: mediaAssets.id,
        uuid: mediaAssets.uuid,
        fileName: mediaAssets.fileName,
        originalName: mediaAssets.originalName,
        mimeType: mediaAssets.mimeType,
        mediaType: mediaAssets.mediaType,
        width: mediaAssets.width,
        height: mediaAssets.height,
        fileSize: mediaAssets.fileSize,
        isProcessed: mediaAssets.isProcessed,
        createdAt: mediaAssets.createdAt
      })
      .from(mediaAssets)
      .where(
        and(
          eq(mediaAssets.tenantId, tenantId),
          eq(mediaAssets.userId, user.id),
          inArray(mediaAssets.id, mediaIds.map(id => parseInt(id)))
        )
      );

    if (mediaToUpdate.length !== mediaIds.length) {
      return errorResponse('Some media assets not found or unauthorized', 404);
    }

    // Determine update data based on action
    let updateData: any = { updatedAt: new Date() };
    let actionDescription = '';

    switch (action) {
      case 'delete':
        // Use deletionStatus which exists in the schema
        updateData = { 
          ...updateData, 
          deletionStatus: 'pending_deletion',
          deletionRequestedAt: new Date(),
          deletionRequestedBy: user.id
        };
        actionDescription = 'Marked for deletion';
        break;

      case 'download':
        // For download, we don't update the database but track the action
        logger.info('Bulk download initiated', {
          userId: user.id,
          tenantId,
          mediaIds,
          count: mediaIds.length
        });

        return successResponse({
          downloadUrl: `/api/portfolio/media/download?ids=${mediaIds.join(',')}`,
          count: mediaIds.length
        }, 'Download link generated');

      default:
        return errorResponse('Invalid bulk action', 400);
    }

    // For all other actions, update in bulk
    const result = await db
      .update(mediaAssets)
      .set(updateData)
      .where(
        and(
          eq(mediaAssets.tenantId, tenantId),
          eq(mediaAssets.userId, user.id),
          inArray(mediaAssets.id, mediaIds.map(id => parseInt(id)))
        )
      )
      .returning();

    logger.info('Bulk action completed successfully', {
      action,
      userId: user.id,
      tenantId,
      mediaIds,
      updatedCount: result.length,
      metadata
    });

    return successResponse({
      updated: result.length,
      action: actionDescription,
      mediaIds: result.map(r => r.id)
    }, `Successfully ${actionDescription.toLowerCase()} ${result.length} items`);

  } catch (error) {
    logger.error('Bulk action failed', {
      error: error.message,
      stack: error.stack,
      body: await request.json().catch(() => ({}))
    });

    if (error instanceof z.ZodError) {
      return errorResponse('Invalid bulk action data', 400);
    }

    return errorResponse('Bulk action failed', 500);
  }
}

export async function GET() {
  // Return available bulk actions and their requirements
  return successResponse({
    availableActions: [
      {
        action: 'feature',
        name: 'Feature Items',
        description: 'Mark items as featured in portfolio',
        requiresMetadata: false
      },
      {
        action: 'unfeature',
        name: 'Unfeature Items',
        description: 'Remove featured status from items',
        requiresMetadata: false
      },
      {
        action: 'delete',
        name: 'Delete Items',
        description: 'Soft delete items from portfolio',
        requiresMetadata: false,
        warning: 'This action cannot be undone'
      },
      {
        action: 'private',
        name: 'Make Private',
        description: 'Hide items from public portfolio view',
        requiresMetadata: false
      },
      {
        action: 'public',
        name: 'Make Public',
        description: 'Show items in public portfolio view',
        requiresMetadata: false
      },
      {
        action: 'categorize',
        name: 'Change Category',
        description: 'Update category for selected items',
        requiresMetadata: true,
        metadataFields: ['category']
      },
      {
        action: 'tag',
        name: 'Update Tags',
        description: 'Add or replace tags for selected items',
        requiresMetadata: true,
        metadataFields: ['tags', 'addTags']
      },
      {
        action: 'download',
        name: 'Download Items',
        description: 'Generate download link for selected items',
        requiresMetadata: false
      }
    ],
    limits: {
      maxItemsPerAction: 50,
      maxTagsPerItem: 20
    }
  });
} 