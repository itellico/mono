import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { CategoriesService } from '@/lib/services/categories.service';

/**
 * @openapi
 * /api/v1/admin/tags/bulk/delete:
 *   delete:
 *     summary: Delete multiple tags
 *     description: Delete multiple tags in a single operation
 *     tags:
 *       - Admin
 *       - Tags
 *       - Bulk Operations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Array of tag IDs to delete
 *               force:
 *                 type: boolean
 *                 description: Force delete even if tags are in use
 *                 default: false
 *     responses:
 *       200:
 *         description: Tags deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted:
 *                       type: array
 *                       items:
 *                         type: number
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         successful:
 *                           type: number
 *                         failed:
 *                           type: number
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ids, force = false } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data format. Expected array of tag IDs.' 
      }, { status: 400 });
    }

    const tenantId = (session.user as any).tenantId;
    const userId = parseInt(session.user.id || '0');

    logger.info('Bulk deleting tags', {
      tenantId,
      userId,
      count: ids.length,
      force
    });

    const results = {
      deleted: [] as number[],
      failed: [] as any[],
      summary: {
        total: ids.length,
        successful: 0,
        failed: 0
      }
    };

    // Process each tag ID
    for (const tagId of ids) {
      try {
        // Validate ID
        if (!Number.isInteger(tagId) || tagId <= 0) {
          results.failed.push({
            id: tagId,
            error: 'Invalid tag ID'
          });
          continue;
        }

        await CategoriesService.deleteTag(String(tagId), tenantId, userId);
        results.deleted.push(tagId);
        results.summary.successful++;

      } catch (error) {
        results.failed.push({
          id: tagId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.summary.failed++;
      }
    }

    logger.info('Bulk tag deletion completed', {
      tenantId,
      userId,
      summary: results.summary
    });

    return NextResponse.json({
      success: true,
      data: results,
      message: `Successfully deleted ${results.summary.successful} tags. ${results.summary.failed} failed.`
    });

  } catch (error) {
    logger.error('Bulk tag deletion API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 