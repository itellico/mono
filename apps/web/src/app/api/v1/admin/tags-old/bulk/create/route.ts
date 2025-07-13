import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { CategoriesService } from '@/lib/services/categories.service';

/**
 * @openapi
 * /api/v1/admin/tags/bulk/create:
 *   post:
 *     summary: Create multiple tags
 *     description: Create multiple tags in a single operation
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
 *                     - name
 *                     - slug
 *                   properties:
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
 *       201:
 *         description: Tags created successfully
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
 *                     created:
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
export async function POST(request: NextRequest) {
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

    logger.info('Bulk creating tags', {
      tenantId,
      userId,
      count: tags.length
    });

    const results = {
      created: [] as any[],
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
        if (!tagData.name || !tagData.slug) {
          results.failed.push({
            data: tagData,
            error: 'Name and slug are required'
          });
          continue;
        }

        const tag = await CategoriesService.createTag(tenantId, userId, {
          name: tagData.name,
          slug: tagData.slug,
          description: tagData.description,
          color: tagData.color,
          metadata: tagData.metadata
        });

        results.created.push(tag);
        results.summary.successful++;

      } catch (error) {
        results.failed.push({
          data: tagData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.summary.failed++;
      }
    }

    logger.info('Bulk tag creation completed', {
      tenantId,
      userId,
      summary: results.summary
    });

    return NextResponse.json({
      success: true,
      data: results,
      message: `Successfully created ${results.summary.successful} tags. ${results.summary.failed} failed.`
    }, { status: 201 });

  } catch (error) {
    logger.error('Bulk tag creation API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 