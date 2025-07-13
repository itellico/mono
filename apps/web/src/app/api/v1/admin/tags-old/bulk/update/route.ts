import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { CategoriesService } from '@/lib/services/categories.service';

/**
 * @openapi
 * /api/v1/admin/tags/bulk/update:
 *   put:
 *     summary: Update multiple tags
 *     description: Update multiple tags in a single operation
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
 *               - tags
 *             properties:
 *               tags:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                   properties:
 *                     id:
 *                       type: number
 *                       description: Tag ID
 *                     name:
 *                       type: string
 *                       description: Tag name
 *                     slug:
 *                       type: string
 *                       description: URL-friendly slug
 *                     description:
 *                       type: string
 *                       description: Tag description
 *                     color:
 *                       type: string
 *                       description: Hex color code
 *                     metadata:
 *                       type: object
 *                       description: Additional metadata
 *     responses:
 *       200:
 *         description: Tags updated successfully
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
 *                     updated:
 *                       type: array
 *                       items:
 *                         type: object
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
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tags } = body;

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data format. Expected array of tags.' 
      }, { status: 400 });
    }

    const tenantId = (session.user as any).tenantId;
    const userId = parseInt(session.user.id || '0');

    logger.info('Bulk updating tags', {
      tenantId,
      userId,
      count: tags.length
    });

    const results = {
      updated: [] as any[],
      failed: [] as any[],
      summary: {
        total: tags.length,
        successful: 0,
        failed: 0
      }
    };

    // Process each tag
    for (const tagData of tags) {
      try {
        // Validate required fields
        if (!tagData.id) {
          results.failed.push({
            data: tagData,
            error: 'Tag ID is required for updates'
          });
          continue;
        }

        const tag = await CategoriesService.updateTag(tagData.id, tenantId, userId, {
          name: tagData.name,
          slug: tagData.slug,
          description: tagData.description,
          color: tagData.color,
          metadata: tagData.metadata
        });

        results.updated.push(tag);
        results.summary.successful++;

      } catch (error) {
        results.failed.push({
          data: tagData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.summary.failed++;
      }
    }

    logger.info('Bulk tag update completed', {
      tenantId,
      userId,
      summary: results.summary
    });

    return NextResponse.json({
      success: true,
      data: results,
      message: `Successfully updated ${results.summary.successful} tags. ${results.summary.failed} failed.`
    });

  } catch (error) {
    logger.error('Bulk tag update API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 