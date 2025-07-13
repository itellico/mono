import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { CategoriesService } from '@/lib/services/categories.service';

/**
 * @openapi
 * /api/v1/admin/categories/tags/{id}:
 *   put:
 *     summary: Update a tag
 *     description: Update an existing tag
 *     tags:
 *       - Admin
 *       - Tags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tag ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Tag Name"
 *               slug:
 *                 type: string
 *                 example: "updated-tag-name"
 *               description:
 *                 type: string
 *                 example: "Updated tag description"
 *               color:
 *                 type: string
 *                 example: "#FF5733"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               metadata:
 *                 type: object
 *                 example: {}
 *               tagCategory:
 *                 type: string
 *                 example: "Product"
 *               isSystem:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Tag updated successfully
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Tag not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session and validate authentication
    const session = await auth();
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to update tag');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get and validate tag ID
    const resolvedParams = await params;
    const tagId = resolvedParams.id;
    if (!tagId || tagId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Invalid tag ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, slug, description, color, isActive, metadata, tagCategory, isSystem } = body;

    // Get tenant ID from session or default to 1
    const tenantId = session.user.tenantId || 1;

    logger.info('Updating tag', {
      userId: session.user.id,
      tenantId,
      tagId,
      changes: Object.keys(body)
    });

    // Update tag using the service
    const updatedTag = await CategoriesService.updateTag(
      tagId,
      tenantId,
      session.user.id,
      {
        name,
        slug,
        description,
        color,
        isActive,
        metadata,
        tagCategory,
        isSystem
      }
    );

    logger.info('Tag updated successfully', {
      userId: session.user.id,
      tenantId,
      tagId,
      name: updatedTag.name
    });

    return NextResponse.json({
      success: true,
      data: updatedTag
    });

  } catch (error) {
    logger.error('Failed to update tag', {
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

    // Handle not found errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message 
        },
        { status: 404 }
      );
    }

    // Handle validation errors
    if (error instanceof Error && (
      error.message.includes('already exists') ||
      error.message.includes('required') ||
      error.message.includes('system')
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
        error: 'Failed to update tag' 
      },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/v1/admin/categories/tags/{id}:
 *   delete:
 *     summary: Delete a tag
 *     description: Delete an existing tag
 *     tags:
 *       - Admin
 *       - Tags
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Tag ID (UUID)
 *     responses:
 *       200:
 *         description: Tag deleted successfully
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Tag not found
 *       409:
 *         description: Conflict - tag is in use or system protected
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session and validate authentication
    const session = await auth();
    if (!session?.user) {
      logger.warn('Unauthorized access attempt to delete tag');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get and validate tag ID
    const resolvedParams = await params;
    const tagId = resolvedParams.id;
    if (!tagId || tagId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Invalid tag ID' },
        { status: 400 }
      );
    }

    // Get tenant ID from session or default to 1
    const tenantId = session.user.tenantId || 1;

    logger.info('Deleting tag', {
      userId: session.user.id,
      tenantId,
      tagId
    });

    // Delete tag using the service
    await CategoriesService.deleteTag(
      tagId,
      tenantId,
      session.user.id
    );

    logger.info('Tag deleted successfully', {
      userId: session.user.id,
      tenantId,
      tagId
    });

    return NextResponse.json({
      success: true,
      message: 'Tag deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete tag', {
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

    // Handle not found errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message 
        },
        { status: 404 }
      );
    }

    // Handle conflict errors (in use or system protected)
    if (error instanceof Error && (
      error.message.includes('in use') ||
      error.message.includes('system')
    )) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete tag' 
      },
      { status: 500 }
    );
  }
} 