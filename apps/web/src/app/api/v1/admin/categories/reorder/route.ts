import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { CategoriesService } from '@/lib/services/categories.service';

/**
 * @openapi
 * /api/v1/admin/categories/reorder:
 *   post:
 *     summary: Reorder categories
 *     description: Update the sort order of multiple categories
 *     tags:
 *       - Admin
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - sortOrder
 *                   properties:
 *                     id:
 *                       type: string
 *                     sortOrder:
 *                       type: number
 *     responses:
 *       200:
 *         description: Categories reordered successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Items array is required' },
        { status: 400 }
      );
    }

    const tenantId = 1; // Default tenant for now

    logger.info('Reordering categories', {
      userId: session.user.id,
      itemCount: items.length
    });

    const categoriesService = new CategoriesService();
    await categoriesService.reorderCategories(tenantId, items);

    return NextResponse.json({
      success: true,
      message: 'Categories reordered successfully'
    });

  } catch (error) {
    logger.error('Failed to reorder categories', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { success: false, error: 'Failed to reorder categories' },
      { status: 500 }
    );
  }
} 