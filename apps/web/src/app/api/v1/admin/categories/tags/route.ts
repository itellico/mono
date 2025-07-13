import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { CategoriesService } from '@/lib/services/categories.service';

/**
 * @openapi
 * /api/v1/admin/categories/tags:
 *   post:
 *     summary: Create a new tag
 *     description: Create a new tag
 *     tags:
 *       - Admin
 *       - Tags
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Photography"
 *               slug:
 *                 type: string
 *                 example: "photography"
 *               description:
 *                 type: string
 *                 example: "Photography related content"
 *               color:
 *                 type: string
 *                 example: "#3B82F6"
 *               metadata:
 *                 type: object
 *                 example: {}
 *     responses:
 *       201:
 *         description: Tag created successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Get session and validate authentication
    const session = await auth();
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to create tag');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, slug, description, color, metadata } = body;

    // Basic validation
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Get tenant ID from session or default to 1
    const tenantId = session.user.tenantId || 1;

    logger.info('Creating new tag', {
      userId: session.user.id,
      tenantId,
      name,
      slug
    });

    // Create tag using the service method
    const newTag = await CategoriesService.createTag(
      tenantId,
      session.user.id,
      {
        name,
        slug,
        description,
        color,
        metadata
      }
    );

    logger.info('Tag created successfully', {
      userId: session.user.id,
      tenantId,
      tagId: newTag.id,
      name: newTag.name
    });

    return NextResponse.json({
      success: true,
      data: newTag
    }, { status: 201 });

  } catch (error) {
    logger.error('Failed to create tag', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Handle permission errors specifically
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message 
        },
        { status: 403 }
      );
    }

    // Handle validation errors
    if (error instanceof Error && (
      error.message.includes('already exists') ||
      error.message.includes('required')
    )) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create tag' 
      },
      { status: 500 }
    );
  }
} 