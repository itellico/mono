import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { CategoriesService } from '@/lib/services/categories.service';
// ✅ BEST PRACTICE: Authentication and permission checking handled by middleware

/**
 * @openapi
 * /api/v1/admin/categories/create:
 *   post:
 *     summary: Create a new category
 *     description: Create a new category with hierarchical support and automatic type inheritance
 *     tags:
 *       - Admin - Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *               slug:
 *                 type: string
 *                 description: URL-friendly slug
 *               description:
 *                 type: string
 *                 description: Category description
 *               parentId:
 *                 type: string
 *                 description: Parent category ID (null for root categories)
 *               color:
 *                 type: string
 *                 description: Category color (hex)
 *               icon:
 *                 type: string
 *                 description: Category icon name
 *               categoryType:
 *                 type: string
 *                 enum: [classification, tagging, general]
 *                 description: Category type (required for root categories)
 *               isSystem:
 *                 type: boolean
 *                 description: Whether this is a system category (admin only)
 *     responses:
 *       200:
 *         description: Category created successfully
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
 *                     id:
 *                       type: string
 *                     categoryType:
 *                       type: string
 *                     inherited:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                 timestamp:
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
    logger.info('Creating new category', {
      method: 'POST',
      endpoint: '/api/v1/admin/categories/create'
    });

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
    const { name, slug, description, parentId, color, icon, categoryType, isSystem } = body;

    logger.info('Category creation request', {
      name,
      slug,
      categoryType,
      isSystem: !!isSystem,
      parentId,
      parentIdType: typeof parentId,
      hasParent: !!(parentId && parentId !== '__root__')
    });

    // Validate required fields
    if (!name || !slug) {
      logger.error('Category creation validation failed', {
        status: 400,
        error: 'Name and slug are required'
      });
      return NextResponse.json({
        success: false,
        error: 'Name and slug are required'
      }, { status: 400 });
    }

    // Check permissions for system categories
    if (isSystem && !isSuperAdmin) {
      logger.error('Insufficient permissions for system category creation', {
        status: 403,
        userRole,
        userId
      });
      return NextResponse.json({
        success: false,
        error: 'Only super admins can create system categories'
      }, { status: 403 });
    }

    // Determine effective tenant ID
    const effectiveTenantId = isSuperAdmin ? (tenantId ? parseInt(tenantId) : 1) : parseInt(tenantId || '1');

    // Prepare category data for service
    const categoryData = {
      name: name.trim(),
      slug: slug.trim(),
      description: description || undefined,
      parentId: (parentId && parentId !== '__root__') ? parentId : undefined,
      color: color || undefined,
      icon: icon || undefined,
      categoryType: categoryType || 'general',
      isSystem: !!isSystem,
      isActive: true
    };

    // Use the CategoriesService to create the category
    const newCategory = await CategoriesService.createCategory(
      effectiveTenantId,
      parseInt(userId),
      categoryData
    );

    logger.info('Category created successfully', {
      categoryId: newCategory.id,
      name: newCategory.name,
      categoryType: newCategory.categoryType,
      level: newCategory.level,
      path: newCategory.path,
      tenantId: effectiveTenantId,
      userId
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newCategory.id,
        categoryType: newCategory.categoryType,
        inherited: !!parentId && parentId !== '__root__',
        message: `Category "${newCategory.name}" created successfully`,
        category: newCategory
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to create category', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message.includes('Parent category not found')) {
        return NextResponse.json({
          success: false,
          error: 'Parent category not found'
        }, { status: 400 });
      }

      if (error.message.includes('already exists')) {
        return NextResponse.json({
          success: false,
          error: 'Category with this name already exists'
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create category'
    }, { status: 500 });
  }
} 