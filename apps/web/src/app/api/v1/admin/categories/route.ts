import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { extractUserContext, canAccessAPI } from '@/lib/permissions/enhanced-unified-permission-system';
import { logger } from '@/lib/logger';
import { categoriesService } from '@/lib/services/categories-service';

/**
 * @openapi
 * /api/v1/admin/categories:
 *   get:
 *     tags:
 *       - Admin
 *       - Categories
 *     summary: Get a list of categories
 *     description: Retrieve a paginated and filterable list of categories.
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
 *         description: Search term for category names or slugs.
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: integer
 *           nullable: true
 *         description: Filter categories by parent ID. Use 0 or omit for top-level categories.
 *     responses:
 *       200:
 *         description: A list of categories.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
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
  const accessCheck = canAccessAPI(userContext, '/api/v1/admin/categories', 'GET');

  if (!accessCheck.allowed) {
    logger.warn('Access denied to GET /api/v1/admin/categories', { userId: userContext.userId, reason: accessCheck.reason });
    return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
  }

  try {
    const filters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || '',
      parentId: searchParams.has('parentId') ? parseInt(searchParams.get('parentId') as string) : undefined,
    };

    const result = await categoriesService.getAll(filters);
    logger.info('Successfully retrieved categories', { userId: userContext.userId, count: result.categories.length });
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('Error retrieving categories', { userId: userContext.userId, error: error.message, stack: error.stack });
    return NextResponse.json({ error: 'Failed to retrieve categories' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/v1/admin/categories:
 *   post:
 *     tags:
 *       - Admin
 *       - Categories
 *     summary: Create a new category
 *     description: Create a new category with optional parent association.
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
 *                 description: Name of the category.
 *               slug:
 *                 type: string
 *                 description: Unique slug for the category.
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: Optional description for the category.
 *               parentId:
 *                 type: integer
 *                 nullable: true
 *                 description: ID of the parent category for hierarchical organization.
 *     responses:
 *       201:
 *         description: Category created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
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
  const accessCheck = canAccessAPI(userContext, '/api/v1/admin/categories', 'POST');

  if (!accessCheck.allowed) {
    logger.warn('Access denied to POST /api/v1/admin/categories', { userId: userContext.userId, reason: accessCheck.reason });
    return NextResponse.json({ error: accessCheck.reason }, { status: 403 });
  }

  try {
    const body = await request.json();
    const newCategory = await categoriesService.create(body);
    logger.info('Category created successfully', { userId: userContext.userId, categoryId: newCategory.id });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating category', { userId: userContext.userId, error: error.message, stack: error.stack, body: request.json() });
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
