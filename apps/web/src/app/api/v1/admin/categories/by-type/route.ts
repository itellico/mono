import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { CategoriesService } from '@/lib/services/categories.service';
import { EntityType, isValidEntityType } from '@/lib/schemas/entities';
import { logger } from '@/lib/logger';
import { canAccessAPI } from '@/lib/permissions/canAccessAPI';

/**
 * @openapi
 * /api/v1/admin/categories/by-type:
 *   get:
 *     summary: Get categories filtered by entity type
 *     description: Retrieve categories optionally filtered by entity type for dropdown population
 *     tags:
 *       - Admin Categories
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tenant ID
 *       - in: query
 *         name: entityType
 *         required: false
 *         schema:
 *           type: string
 *           enum: [user, content, transaction, communication, system, resource, event, workflow, analytics, moderation, tenant, platform]
 *         description: Filter by entity type
 *       - in: query
 *         name: includeInactive
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive categories
 *       - in: query
 *         name: parentId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by parent category ID (null for root categories)
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 *                 meta:
 *                   $ref: '#/components/schemas/ResponseMeta'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permissions
    const hasPermission = await canAccessAPI({
      action: 'read',
      resource: 'categories'
    });

    if (!hasPermission.allowed) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const tenantId = parseInt(searchParams.get('tenantId') || '0');
    const entityType = searchParams.get('entityType') as EntityType | null;
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const parentId = searchParams.get('parentId');

    // Validate required parameters
    if (!tenantId || tenantId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid tenant ID is required' },
        { status: 400 }
      );
    }

    // Validate entity type if provided
    if (entityType && !isValidEntityType(entityType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid entity type' },
        { status: 400 }
      );
    }

    // Handle parentId: convert 'null' string to null, undefined for others
    const parentIdParam = parentId === 'null' ? null : (parentId || undefined);

    // Get categories
    const categories = await CategoriesService.getCategoriesByType(
      tenantId,
      entityType || undefined,
      {
        includeInactive,
        parentId: parentIdParam
      }
    );

    logger.info('Categories retrieved by type', {
      tenantId,
      entityType,
      categoriesCount: categories.length,
      userId: session.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        categories
      },
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        total: categories.length
      }
    });

  } catch (error) {
    logger.error('Failed to get categories by type', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 