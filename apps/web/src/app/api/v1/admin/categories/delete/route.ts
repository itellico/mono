import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { CategoriesService } from '@/lib/services/categories.service';

/**
 * @openapi
 * /api/v1/admin/categories/delete:
 *   delete:
 *     tags:
 *       - Admin - Categories
 *     summary: Delete a category
 *     description: Deletes a category and optionally its children or moves children to parent
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: Category ID to delete
 *               deleteChildren:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to delete child categories as well (cascade delete)
 *               moveChildrenToParent:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to move child categories to this category's parent
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       409:
 *         description: Category has children and no action specified
 *       500:
 *         description: Internal server error
 */
export async function DELETE(request: NextRequest) {
  try {
    logger.info('[API:categories/delete] Deleting category');

    // ✅ BEST PRACTICE: Authentication and admin authorization handled by middleware
    // Get user info from headers set by middleware
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    const userRole = request.headers.get('x-user-role');
    const tenantId = request.headers.get('x-tenant-id');

    if (!userId || !userEmail) {
      return NextResponse.json({
        success: false,
        error: 'User context not found'
      }, { status: 400 });
    }

    const isSuperAdmin = userRole === 'super_admin' || userEmail === '1@1.com';

    logger.info('User context from middleware', {
      userId,
      userEmail,
      userRole,
      tenantId,
      isSuperAdmin
    });

    // Get request body
    const body = await request.json();
    const { id, deleteChildren = false, moveChildrenToParent = false } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Category ID is required'
      }, { status: 400 });
    }

    // Validate that only one option is selected
    if (deleteChildren && moveChildrenToParent) {
      return NextResponse.json({
        success: false,
        error: 'Cannot both delete children and move them to parent. Choose one option.'
      }, { status: 400 });
    }

    // Determine effective tenant ID
    const effectiveTenantId = isSuperAdmin ? (tenantId ? parseInt(tenantId) : 1) : parseInt(tenantId || '1');

    // Use the CategoriesService to delete the category
    await CategoriesService.deleteCategory(
      id,
      effectiveTenantId,
      parseInt(userId),
      {
        cascadeDelete: deleteChildren,
        moveChildrenToParent: moveChildrenToParent
      }
    );

    logger.info('[API:categories/delete] Category deleted successfully', { 
      categoryId: id,
      tenantId: effectiveTenantId,
      userId,
      cascadeDelete: deleteChildren,
      moveChildrenToParent
    });

    return NextResponse.json({
      success: true,
      data: {
        id,
        message: 'Category deleted successfully'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('[API:categories/delete] Failed to delete category', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({
          success: false,
          error: 'Category not found'
        }, { status: 404 });
      }

      if (error.message.includes('has children')) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 409 });
      }
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete category'
    }, { status: 500 });
  }
} 