import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { extractUserContext, canAccessAPI } from '@/lib/permissions/enhanced-unified-permission-system';
import { logger } from '@/lib/logger';
import { tagsService } from '@/lib/services/tags-service';

/**
 * @openapi
 * /api/v1/admin/tags:
 *   get:
 *     tags:
 *       - Admin
 *       - Tags
 *     summary: Get a list of tags
 *     description: Retrieve a paginated and filterable list of tags.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for tag names or slugs.
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Filter tags by category ID.
 *     responses:
 *       200:
 *         description: A list of tags.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tags:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tag'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET(request: Request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);

  const userContext = extractUserContext(session);
  const accessCheck = canAccessAPI(userContext, '/api/v1/admin/tags', 'GET');

  if (!accessCheck.allowed) {
    logger.warn('Access denied to GET /api/v1/admin/tags', { userId: userContext.userId, reason: accessCheck.reason });
    return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
  }

  try {
    const filters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || '',
      categoryId: searchParams.has('categoryId') ? parseInt(searchParams.get('categoryId') as string) : undefined,
    };

    const result = await tagsService.getAll(filters);
    logger.info('Successfully retrieved tags', { userId: userContext.userId, count: result.tags.length });
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('Error retrieving tags', { userId: userContext.userId, error: error.message, stack: error.stack });
    return NextResponse.json({ error: 'Failed to retrieve tags' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/v1/admin/tags:
 *   post:
 *     tags:
 *       - Admin
 *       - Tags
 *     summary: Create a new tag
 *     description: Create a new tag and optionally assign it to categories.
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
 *                 description: Name of the tag.
 *               slug:
 *                 type: string
 *                 description: Unique slug for the tag.
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Optional description for the tag.
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of category IDs to assign the tag to.
 *     responses:
 *       201:
 *         description: Tag created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function POST(request: Request) {
  const session = await auth();
  const userContext = extractUserContext(session);
  const accessCheck = canAccessAPI(userContext, '/api/v1/admin/tags', 'POST');

  if (!accessCheck.allowed) {
    logger.warn('Access denied to POST /api/v1/admin/tags', { userId: userContext.userId, reason: accessCheck.reason });
    return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
  }

  try {
    const body = await request.json();
    const newTag = await tagsService.create(body);
    logger.info('Tag created successfully', { userId: userContext.userId, tagId: newTag.id });
    return NextResponse.json(newTag, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating tag', { userId: userContext.userId, error: error.message, stack: error.stack, body: request.json() });
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
