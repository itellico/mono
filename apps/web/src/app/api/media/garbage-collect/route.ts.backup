/**
 * @openapi
 * /api/media/garbage-collect:
 *   post:
 *     tags:
 *       - Media
 *       - Admin
 *     summary: Media Garbage Collection
     tags:
       - Media Management
 *     description: Media Garbage Collection
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
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { mediaAssets } from '@/lib/schema';
import { eq, and, inArray, lt } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// Cleanup failed or cancelled uploads
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fileIds } = body;

    if (!fileIds || !Array.isArray(fileIds)) {
      return NextResponse.json({ error: 'Invalid file IDs' }, { status: 400 });
    }

    // Find media assets that are incomplete or failed and belong to the user
    const orphanedAssets = await db.query.mediaAssets.findMany({
      where: and(
        eq(mediaAssets.userId, parseInt(session.user.id)),
        inArray(mediaAssets.id, fileIds),
        eq(mediaAssets.isProcessed, false)
      )
    });

    if (orphanedAssets.length > 0) {
      // Delete from database
      await db.delete(mediaAssets)
        .where(
          inArray(mediaAssets.id, orphanedAssets.map(asset => asset.id))
        );

      // TODO: Delete from S3 as well
      // await s3Service.deleteFiles(orphanedAssets.map(asset => asset.s3BucketPath));

      logger.info('Garbage collection completed', {
        userId: session.user.id,
        deletedAssets: orphanedAssets.length,
        fileIds
      });
    }

    return NextResponse.json({
      success: true,
      deletedCount: orphanedAssets.length
    });

  } catch (error) {
    logger.error('Garbage collection failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'Garbage collection failed' },
      { status: 500 }
    );
  }
}

// Automatic cleanup of old temporary files
export async function DELETE() {
  try {
    // Clean up files older than 24 hours that are still in pending status
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const oldPendingAssets = await db.query.mediaAssets.findMany({
      where: and(
        lt(mediaAssets.createdAt, oneDayAgo),
        eq(mediaAssets.processingStatus, 'pending'),
        eq(mediaAssets.isProcessed, false)
      )
    });

    if (oldPendingAssets.length > 0) {
      await db.delete(mediaAssets)
        .where(
          inArray(mediaAssets.id, oldPendingAssets.map(asset => asset.id))
        );

      logger.info('Automatic cleanup completed', {
        deletedAssets: oldPendingAssets.length
      });
    }

    return NextResponse.json({
      success: true,
      deletedCount: oldPendingAssets.length
    });

  } catch (error) {
    logger.error('Automatic cleanup failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
} 