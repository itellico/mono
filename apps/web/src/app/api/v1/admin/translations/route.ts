import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { translationsService } from '@/lib/services/translations-service';
import { auth } from '@/lib/auth';
import { checkApiAdminAccess } from '@/lib/utils/role-checker';

/**
 * @swagger
 * /api/v1/admin/translations:
 *   get:
 *     summary: Get translations with filters and pagination
 *     description: Retrieves translations with optional filtering by tenant, entity type, language, and search terms
 *     tags: [Admin, Translations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tenantId
 *         in: query
 *         description: Filter by tenant ID
 *         schema:
 *           type: integer
 *       - name: entityType
 *         in: query
 *         description: Filter by entity type (e.g., 'ui', 'option_value', 'email_template')
 *         schema:
 *           type: string
 *       - name: entityId
 *         in: query
 *         description: Filter by specific entity ID
 *         schema:
 *           type: string
 *       - name: languageCode
 *         in: query
 *         description: Filter by language code (e.g., 'en-US', 'de-DE')
 *         schema:
 *           type: string
 *       - name: key
 *         in: query
 *         description: Filter by translation key
 *         schema:
 *           type: string
 *       - name: needsReview
 *         in: query
 *         description: Filter by review status
 *         schema:
 *           type: boolean
 *       - name: isAutoTranslated
 *         in: query
 *         description: Filter by auto-translation status
 *         schema:
 *           type: boolean
 *       - name: search
 *         in: query
 *         description: Search in translation values and keys
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         description: Page number for pagination
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Number of items per page
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *       - name: sortBy
 *         in: query
 *         description: Field to sort by
 *         schema:
 *           type: string
 *           default: updatedAt
 *       - name: sortOrder
 *         in: query
 *         description: Sort order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Translations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       tenantId:
 *                         type: integer
 *                         nullable: true
 *                       entityType:
 *                         type: string
 *                       entityId:
 *                         type: string
 *                       languageCode:
 *                         type: string
 *                       key:
 *                         type: string
 *                       value:
 *                         type: string
 *                       isAutoTranslated:
 *                         type: boolean
 *                       needsReview:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new translation
 *     description: Creates a new translation entry
 *     tags: [Admin, Translations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [entityType, entityId, languageCode, key, value]
 *             properties:
 *               tenantId:
 *                 type: integer
 *                 nullable: true
 *               entityType:
 *                 type: string
 *               entityId:
 *                 type: string
 *               languageCode:
 *                 type: string
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *               isAutoTranslated:
 *                 type: boolean
 *                 default: false
 *               needsReview:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Translation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Translation'
 *       400:
 *         description: Bad request - Invalid input data
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access using secure role checker
    const adminPermissions = await checkApiAdminAccess(session, ['super_admin', 'tenant_admin']);
    if (!adminPermissions) {
      logger.warn('Translation API access denied', { 
        userId: (session.user as any)?.userId,
        email: session.user.email
      });
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    logger.info('Translation API access granted', {
      roleType: adminPermissions.roleType,
      isSuperAdmin: adminPermissions.isSuperAdmin,
      tenantId: adminPermissions.tenantId
    });

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      tenantId: searchParams.get('tenantId') ? parseInt(searchParams.get('tenantId')!) : undefined,
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      languageCode: searchParams.get('languageCode') || undefined,
      key: searchParams.get('key') || undefined,
      needsReview: searchParams.get('needsReview') ? searchParams.get('needsReview') === 'true' : undefined,
      isAutoTranslated: searchParams.get('isAutoTranslated') ? searchParams.get('isAutoTranslated') === 'true' : undefined,
      search: searchParams.get('search') || undefined,
    };

    const pagination = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      sortBy: searchParams.get('sortBy') || 'updatedAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    logger.info('Getting translations with filters', { filters, pagination });

    const result = await translationsService.getTranslations(filters, pagination);

    logger.info('Translations retrieved', { count: result.data.length, total: result.pagination.total });

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching translations', { error: errorMessage });
    return NextResponse.json(
      { error: 'Failed to fetch translations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access using secure role checker
    const adminPermissions = await checkApiAdminAccess(session, ['super_admin', 'tenant_admin']);
    if (!adminPermissions) {
      logger.warn('User without admin permissions creating translation', { 
        userId: (session.user as any)?.userId,
        email: session.user.email
      });
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    logger.info('Translation creation access granted', {
      userId: (session.user as any)?.userId,
      roleType: adminPermissions.roleType,
      isSuperAdmin: adminPermissions.isSuperAdmin
    });

    const data = await request.json();

    logger.info('Creating translation', { data });

    const translation = await translationsService.createTranslation(data);

    logger.info('Translation created', { id: translation.id });

    return NextResponse.json({ data: translation }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error creating translation', { error: errorMessage });
    return NextResponse.json(
      { error: 'Failed to create translation' },
      { status: 500 }
    );
  }
} 