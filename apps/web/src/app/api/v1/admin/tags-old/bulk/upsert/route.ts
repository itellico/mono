import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { CategoriesService } from '@/lib/services/categories.service';

/**
 * @openapi
 * /api/v1/admin/tags/bulk/upsert:
 *   post:
 *     summary: Upsert multiple tags
 *     description: Create or update multiple tags in a single operation (insert if not exists, update if exists)
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
 *                     - slug
 *                   properties:
 *                     id:
 *                       type: number
 *                       description: Tag ID (for updates)
 *                     name:
 *                       type: string
 *                       description: Tag name
 *                     slug:
 *                       type: string
 *                       description: URL-friendly slug (used for matching)
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
 *         description: Tags upserted successfully
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
 *                         created:
 *                           type: number
 *                         updated:
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

    logger.info('Bulk upserting tags', {
      tenantId,
      userId,
      count: tags.length
    });

    const results = {
      created: [] as any[],
      updated: [] as any[],
      failed: [] as any[],
      summary: {
        total: tags.length,
        created: 0,
        updated: 0,
        failed: 0
      }
    };

    // Process each tag
    for (const tagData of tags) {
      try {
        // Validate required fields
        if (!tagData.slug) {
          results.failed.push({
            data: tagData,
            error: 'Slug is required for upsert operations'
          });
          continue;
        }

        // Check if tag exists by slug
        const existingTags = await CategoriesService.getCategoriesAndTags(tenantId, userId, {
          includeInactive: true,
          includeSystem: true
        });
        const existingTag = existingTags.tags.find(tag => tag.slug === tagData.slug);
        
        if (existingTag) {
          // Update existing tag
          const updatedTag = await CategoriesService.updateTag(
            existingTag.id,
            tenantId,
            userId,
            {
              name: tagData.name || existingTag.name,
              description: tagData.description,
              color: tagData.color,
              metadata: tagData.metadata
            }
          );

          results.updated.push(updatedTag);
          results.summary.updated++;
        } else {
          // Create new tag
          if (!tagData.name) {
            results.failed.push({
              data: tagData,
              error: 'Name is required for new tags'
            });
            continue;
          }

          const newTag = await CategoriesService.createTag(tenantId, userId, {
            name: tagData.name,
            slug: tagData.slug,
            description: tagData.description,
            color: tagData.color,
            metadata: tagData.metadata
          });

          results.created.push(newTag);
          results.summary.created++;
        }

      } catch (error) {
        results.failed.push({
          data: tagData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.summary.failed++;
      }
    }

    logger.info('Bulk tag upsert completed', {
      tenantId,
      userId,
      summary: results.summary
    });

    return NextResponse.json({
      success: true,
      data: results,
      message: `Successfully processed ${results.summary.created + results.summary.updated} tags (${results.summary.created} created, ${results.summary.updated} updated). ${results.summary.failed} failed.`
    });

  } catch (error) {
    logger.error('Bulk tag upsert API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 