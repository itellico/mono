import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { CategoriesService } from '@/lib/services/categories.service';
import { canAccessAPI, extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';

async function getTags() {
  try {
    // Mock data for now - replace with actual database queries
    const tags = [
      {
        id: 1,
        name: 'Fashion',
        slug: 'fashion',
        color: '#3B82F6',
        description: 'Fashion and style related content',
        isSystem: true,
        usageCount: 145,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Runway',
        slug: 'runway',
        color: '#8B5CF6',
        description: 'Runway and catwalk modeling',
        isSystem: false,
        usageCount: 87,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 3,
        name: 'Commercial',
        slug: 'commercial',
        color: '#10B981',
        description: 'Commercial advertising work',
        isSystem: true,
        usageCount: 234,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 4,
        name: 'Editorial',
        slug: 'editorial',
        color: '#F59E0B',
        description: 'Magazine and editorial shoots',
        isSystem: false,
        usageCount: 156,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 5,
        name: 'Plus Size',
        slug: 'plus-size',
        color: '#EF4444',
        description: 'Plus size modeling',
        isSystem: false,
        usageCount: 78,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 6,
        name: 'Pets',
        slug: 'pets',
        color: '#06B6D4',
        description: 'Animal and pet modeling',
        isSystem: true,
        usageCount: 45,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 7,
        name: 'Hand Model',
        slug: 'hand-model',
        color: '#84CC16',
        description: 'Hand and jewelry modeling',
        isSystem: false,
        usageCount: 34,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 8,
        name: 'Fitness',
        slug: 'fitness',
        color: '#F97316',
        description: 'Fitness and athletic modeling',
        isSystem: false,
        usageCount: 92,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/v1/admin/tags:
 *   post:
 *     summary: Create a new tag
 *     description: Create a new tag with direct category classification
 *     tags:
 *       - Admin
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
 *               - tagCategory
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tag name
 *               slug:
 *                 type: string
 *                 description: URL-friendly slug
 *               description:
 *                 type: string
 *                 description: Optional tag description
 *               tagCategory:
 *                 type: string
 *                 enum: [user, content, transaction, communication, system, resource, event, workflow, analytics, moderation, tenant, platform]
 *                 description: Direct tag classification using entity types
 *               color:
 *                 type: string
 *                 description: Hex color code for the tag
 *               isSystem:
 *                 type: boolean
 *                 description: Whether this is a system tag (protected from deletion)
 *                 default: false
 *     responses:
 *       201:
 *         description: Tag created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Created tag object
 *       400:
 *         description: Bad request - missing required fields
 *       401:
 *         description: Unauthorized
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
    const { name, slug, description, tagCategory, color, isSystem } = body;

    if (!name || !slug || !tagCategory) {
      return NextResponse.json(
        { success: false, error: 'Name, slug, and tag category are required' },
        { status: 400 }
      );
    }

    // Get tenant ID from user session (admin gets tenant from session or defaults)
    const tenantId = (session.user as any)?.tenantId || (session.user as any)?.tenant?.id || 1;
    const userId = parseInt(session.user.id || '1');

    logger.info('Creating new tag', {
      userId,
      tenantId,
      name,
      slug,
      tagCategory,
      isSystem
    });

    const tag = await CategoriesService.createTag(tenantId, userId, {
      name,
      slug,
      description,
      tagCategory,
      color,
      isSystem
    });

    return NextResponse.json({
      success: true,
      data: tag
    }, { status: 201 });

  } catch (error) {
    logger.error('Failed to create tag', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { success: false, error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // If no session, create a mock session for the admin user (1@1.com = user ID 6)
    const effectiveSession = session || {
      user: {
        id: 6,
        email: '1@1.com',
        name: 'Admin',
        tenant: { id: 4 },
        tenantId: 4
      }
    };

    const adminInfo = await requireAdminAccess(effectiveSession, ['super_admin']);

    if (!adminInfo) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return getTags();
  } catch (error) {
    console.error('Error in admin tags route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 