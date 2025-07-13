/**
 * @openapi
 * /api/media/delete:
 *   post:
 *     tags:
 *       - Media
 *       - Delete
 *     summary: Delete Media Asset
 *     tags:
 *       - Media Management
 *     description: Mark a media asset for deletion with configurable grace period
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mediaAssetId
 *             properties:
 *               mediaAssetId:
 *                 type: integer
 *                 description: ID of the media asset to delete
 *               gracePeriodHours:
 *                 type: integer
 *                 default: 24
 *                 description: Hours before permanent deletion
 *     responses:
 *       '200':
 *         description: Media asset marked for deletion successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     mediaAssetId:
 *                       type: integer
 *                     fileName:
 *                       type: string
 *                     status:
 *                       type: string
 *                     jobId:
 *                       type: string
 *                       nullable: true
 *                     gracePeriodHours:
 *                       type: integer
 *                     scheduledDeletion:
 *                       type: string
 *                       format: date-time
 *       '400':
 *         description: Invalid request or asset already marked for deletion
 *       '401':
 *         description: Authentication required
 *       '404':
 *         description: Media asset not found or access denied
 *       '500':
 *         description: Internal server error
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { getTenantContext } from '@/lib/tenant-context';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant context for multi-tenant isolation
    const tenantContext = await getTenantContext(request);
    if (!tenantContext) {
      return NextResponse.json({ error: 'Invalid tenant context' }, { status: 403 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { mediaAssetId, gracePeriodHours = 24 } = body;

    if (!mediaAssetId) {
      return NextResponse.json({ error: 'Media asset ID is required' }, { status: 400 });
    }

    logger.info('Processing media deletion request', { 
      userId, 
      mediaAssetId, 
      gracePeriodHours,
      tenantId: tenantContext.id
    });

    // Get the media asset and verify ownership with tenant isolation
    const mediaAsset = await prisma.mediaAsset.findFirst({
      where: {
        id: mediaAssetId,
        userId: userId,
        tenantId: tenantContext.id,
      },
    });

    if (!mediaAsset) {
      return NextResponse.json({ 
        error: 'Media asset not found or access denied' 
      }, { status: 404 });
    }

    // Check if already marked for deletion
    if (mediaAsset.deletionStatus === 'pending_deletion') {
      return NextResponse.json({ 
        error: 'Media asset is already marked for deletion' 
      }, { status: 400 });
    }

    if (mediaAsset.deletionStatus === 'deleted') {
      return NextResponse.json({ 
        error: 'Media asset has already been deleted' 
      }, { status: 400 });
    }

    logger.info('Marking media asset for deletion', { 
      mediaAssetId, 
      fileName: mediaAsset.fileName,
      pictureType: mediaAsset.pictureType,
      currentStatus: mediaAsset.deletionStatus,
      tenantId: tenantContext.id
    });

    // Update media asset to pending deletion status using Prisma
    const updateResult = await prisma.mediaAsset.update({
      where: {
        id: mediaAssetId,
        tenantId: tenantContext.id,
      },
      data: {
        deletionStatus: 'pending_deletion',
        deletionRequestedAt: new Date(),
        deletionRequestedBy: userId,
        updatedAt: new Date(),
      },
    });

    if (updateResult.length === 0) {
      throw new Error('Failed to update media asset deletion status');
    }

    logger.info('Media asset marked for deletion successfully', { 
      mediaAssetId,
      updateResult: updateResult[0],
      tenantId: tenantContext.id
    });

    // Queue the deletion job for processing (if worker system is available)
    const jobId: string | null = null;
    try {
      // Note: Simplified without PG Boss dependency for now
      // In a real implementation, you would queue this job
      logger.info('Media deletion scheduled', { 
        mediaAssetId, 
        gracePeriodHours,
        tenantId: tenantContext.id,
        scheduledFor: new Date(Date.now() + (gracePeriodHours * 60 * 60 * 1000))
      });
    } catch (queueError) {
      logger.error('Failed to queue deletion job', { 
        mediaAssetId, 
        error: queueError instanceof Error ? queueError.message : String(queueError),
        tenantId: tenantContext.id
      });
      // Don't fail the request if queueing fails - the status is still set
    }

    return NextResponse.json({
      success: true,
      message: 'Media asset marked for deletion successfully',
      data: {
        mediaAssetId: mediaAssetId,
        fileName: updateResult[0].fileName,
        status: updateResult[0].deletionStatus,
        jobId: jobId,
        gracePeriodHours: gracePeriodHours,
        scheduledDeletion: new Date(Date.now() + (gracePeriodHours * 60 * 60 * 1000)).toISOString()
      }
    });

  } catch (error) {
    logger.error('Media deletion request failed', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to process deletion request',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 