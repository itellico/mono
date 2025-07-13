import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, inArray } from 'drizzle-orm';
import postgres from 'postgres';
import { categories } from '@/lib/schemas';

/**
 * @openapi
 * /api/v1/admin/categories/bulk:
 *   post:
 *     tags:
 *       - Admin - Categories
 *     summary: Bulk operations on categories
 *     description: Perform bulk operations like activate, deactivate, delete on multiple categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operation
 *               - categoryIds
 *             properties:
 *               operation:
 *                 type: string
 *                 enum: [activate, deactivate, delete]
 *                 description: Bulk operation to perform
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of category IDs to operate on
 *               deleteChildren:
 *                 type: boolean
 *                 default: false
 *                 description: For delete operation, whether to delete children as well
 *     responses:
 *       200:
 *         description: Bulk operation completed successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API:categories/bulk] Starting bulk operation');

    // Check authentication
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { operation, categoryIds, deleteChildren = false } = body;

    // Validate required fields
    if (!operation || !categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Operation and categoryIds array are required'
      }, { status: 400 });
    }

    const validOperations = ['activate', 'deactivate', 'delete'];
    if (!validOperations.includes(operation)) {
      return NextResponse.json({
        success: false,
        error: `Invalid operation. Must be one of: ${validOperations.join(', ')}`
      }, { status: 400 });
    }

    const sql = postgres(process.env.DATABASE_URL || 'postgresql://developer:developer@localhost:5432/mono');
    const db = drizzle(sql, { schema: { categories } });

    let affectedCount = 0;
    const results: any[] = [];

    switch (operation) {
      case 'activate':
        await db
          .update(categories)
          .set({ isActive: true, updatedAt: new Date() })
          .where(inArray(categories.id, categoryIds));
        affectedCount = categoryIds.length;
        break;

      case 'deactivate':
        await db
          .update(categories)
          .set({ isActive: false, updatedAt: new Date() })
          .where(inArray(categories.id, categoryIds));
        affectedCount = categoryIds.length;
        break;

      case 'delete':
        // For delete, we need to handle each category individually
        // to check for children and handle deleteChildren option
        for (const categoryId of categoryIds) {
          try {
            // Get category
            const existingCategory = await db
              .select()
              .from(categories)
              .where(eq(categories.id, categoryId))
              .limit(1);

            if (existingCategory.length === 0) {
              results.push({
                id: categoryId,
                success: false,
                error: 'Category not found'
              });
              continue;
            }

            const category = existingCategory[0];

            // Check for children
            const children = await db
              .select()
              .from(categories)
              .where(eq(categories.parentId, categoryId));

            if (children.length > 0 && !deleteChildren) {
              results.push({
                id: categoryId,
                success: false,
                error: `Category has ${children.length} children. Set deleteChildren to true to delete them as well.`
              });
              continue;
            }

            // Delete category and optionally its children
            if (deleteChildren && children.length > 0) {
              // Delete all descendants
              await db
                .delete(categories)
                .where(eq(categories.path, category.path));
            } else {
              // Delete only this category
              await db
                .delete(categories)
                .where(eq(categories.id, categoryId));
            }

            results.push({
              id: categoryId,
              success: true,
              deletedChildren: deleteChildren && children.length > 0,
              childrenCount: children.length
            });
            affectedCount++;

          } catch (error) {
            results.push({
              id: categoryId,
              success: false,
              error: 'Failed to delete category'
            });
          }
        }
        break;
    }

    await sql.end();

    console.log('[API:categories/bulk] Bulk operation completed', { 
      operation,
      requestedCount: categoryIds.length,
      affectedCount,
      successRate: `${affectedCount}/${categoryIds.length}`
    });

    return NextResponse.json({
      success: true,
      data: {
        operation,
        requestedCount: categoryIds.length,
        affectedCount,
        results: operation === 'delete' ? results : undefined,
        message: `Bulk ${operation} completed. ${affectedCount}/${categoryIds.length} categories processed successfully.`
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[API:categories/bulk] Error in bulk operation', { error });

    return NextResponse.json({
      success: false,
      error: 'Failed to complete bulk operation',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 