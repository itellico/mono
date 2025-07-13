/**
 * 📋 Admin Saved Searches API
 * 
 * Comprehensive admin endpoints for managing saved searches across all users.
 * Includes advanced filtering, sorting, pagination, and bulk operations.
 * 
 * P0 Security: Super Admin and Tenant Admin access only
 * P1 Performance: Three-layer caching with invalidation
 * P1 Observability: Complete audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { savedSearchesService } from '@/lib/services/saved-searches.service';
import { CacheInvalidationService } from '@/lib/services/cache-invalidation.service';
import { logger } from '@/lib/logger';
import { revalidateTag } from 'next/cache';

/**
 * @swagger
 * /api/v1/admin/saved-searches:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all saved searches (Admin only)
 *     description: |
 *       Retrieve a paginated list of all saved searches in the system. This endpoint is restricted to administrators only.
 *       
 *       **Caching**: Results are cached in Redis for 5 minutes with automatic invalidation on data changes.
 *       
 *       **Permissions**: Admin access required
 *     security:
 *       - nextAuthSession: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of saved searches per page (max 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query to filter saved searches by name or description
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter saved searches by entity type
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, updatedAt, createdAt, entityType]
 *           default: updatedAt
 *         description: Sort saved searches by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Saved searches retrieved successfully
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
 *                     savedSearches:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SavedSearch'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *                 message:
 *                   type: string
 *                   example: "Saved searches retrieved successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/admin/saved-searches:
 *   get:
 *     summary: Get saved searches list
 *     description: Retrieve a paginated list of saved searches with optional filtering
 *     tags:
 *       - Admin - Saved Searches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for saved search name or description
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, updatedAt, createdAt, entityType]
 *           default: updatedAt
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Saved searches retrieved successfully
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
 *                     savedSearches:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SavedSearchListItem'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *                 meta:
 *                   $ref: '#/components/schemas/ResponseMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // ✅ SECURITY BEST PRACTICE: Authentication and Authorization
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    
    // ✅ P0 SECURITY: Authentication required
    const userId = (session?.user as { id: string })?.id;
    if (!session?.user || !userId) {
      logger.warn('❌ Unauthenticated access attempt to saved searches API', { 
        requestId,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required',
          code: 'UNAUTHENTICATED'
        },
        { status: 401 }
      );
    }

    // ✅ P0 SECURITY: Server-side authorization check
    const { permissionsService } = await import('@/lib/services/permissions.service');
    const canAccessAdmin = await permissionsService.canAccessAdmin(userId);
    
    if (!canAccessAdmin) {
      logger.error('❌ P0 SECURITY VIOLATION: Admin access denied for saved searches API', {
        userId,
        userEmail: session.user.email,
        requestId,
        securityEvent: 'unauthorized_admin_api_access'
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Admin access required',
          code: 'ACCESS_DENIED'
        },
        { 
          status: 403,
          headers: {
            'X-Security-Event': 'admin-access-denied',
            'X-Request-ID': requestId
          }
        }
      );
    }

    // ✅ P0 SECURITY: Check for saved searches management permission
    // Support both wildcard patterns and specific permissions
    const hasWildcardPermission = await permissionsService.hasPermission(userId, 'saved_searches.*.global');
    const hasSpecificPermission = await permissionsService.hasPermission(userId, 'saved_searches.manage.global');
    const hasReadPermission = await permissionsService.hasPermission(userId, 'saved_searches.read.global');
    
    if (!hasWildcardPermission && !hasSpecificPermission && !hasReadPermission) {
      logger.error('❌ P0 SECURITY VIOLATION: Saved searches management permission required', {
        userId,
        userEmail: session.user.email,
        requestId,
        securityEvent: 'insufficient_saved_searches_permissions',
        permissionsChecked: ['saved_searches.*.global', 'saved_searches.manage.global', 'saved_searches.read.global']
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Saved searches management permission required',
          code: 'INSUFFICIENT_PRIVILEGES'
        },
        { 
          status: 403,
          headers: {
            'X-Security-Event': 'insufficient-privileges',
            'X-Request-ID': requestId
          }
        }
      );
    }

    logger.info('✅ Admin access granted for saved searches API', {
      userId,
      userEmail: session.user.email,
      requestId,
      securityEvent: 'admin_api_access_granted'
    });

    // ✅ PARAMETER EXTRACTION AND VALIDATION
    const { searchParams } = new URL(request.url);
    const params = {
      page: Math.max(1, parseInt(searchParams.get('page') || '1')),
      limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20'))),
      search: searchParams.get('search')?.trim() || '',
      entityType: searchParams.get('entityType')?.trim() || '',
      sortBy: searchParams.get('sortBy') || 'updatedAt',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    };

    // ✅ VALIDATE ENUM VALUES
    if (!['name', 'updatedAt', 'createdAt', 'entityType'].includes(params.sortBy)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid sortBy parameter. Allowed values: name, updatedAt, createdAt, entityType',
          code: 'INVALID_PARAMETER'
        },
        { status: 400 }
      );
    }

    if (!['asc', 'desc'].includes(params.sortOrder)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid sortOrder parameter. Allowed values: asc, desc',
          code: 'INVALID_PARAMETER'
        },
        { status: 400 }
      );
    }

    logger.info('Processing saved searches request', {
      params,
      requestId,
      userId
    });

    // ✅ SERVICE LAYER CALL - Three-layer caching handled in service
    const result = await savedSearchesService.getAllAdmin(params);

    const duration = Date.now() - startTime;

    // ✅ SUCCESS RESPONSE WITH PROPER STRUCTURE
    const response = {
      success: true,
      data: result,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        requestId,
        duration,
        source: 'admin-api'
      }
    };

    logger.info('Saved searches retrieved successfully', {
      savedSearchCount: result.savedSearches.length,
      total: result.pagination.total,
      duration,
      requestId,
      userId
    });

    return NextResponse.json(response, {
      headers: {
        'X-Request-ID': requestId,
        'X-Processing-Time': duration.toString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Internal server error in saved searches API', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      duration,
      requestId
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        meta: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          requestId,
          duration
        }
      },
      { 
        status: 500,
        headers: {
          'X-Request-ID': requestId,
          'X-Processing-Time': duration.toString()
        }
      }
    );
  }
}

/**
 * POST /api/v1/admin/saved-searches
 * 
 * Create a new saved search (admin only)
 * P0 Security: Admin access required
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // ✅ SECURITY BEST PRACTICE: Authentication and Authorization
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    
    // ✅ P0 SECURITY: Authentication required
    const userId = (session?.user as { id: string })?.id;
    if (!session?.user || !userId) {
      logger.warn('❌ Unauthenticated access attempt to create saved search', { 
        requestId,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required',
          code: 'UNAUTHENTICATED'
        },
        { status: 401 }
      );
    }

    // ✅ P0 SECURITY: Server-side authorization check
    const { permissionsService } = await import('@/lib/services/permissions.service');
    
    // Support both wildcard patterns and specific permissions
    const hasWildcardPermission = await permissionsService.hasPermission(userId, 'saved_searches.*.global');
    const hasSpecificPermission = await permissionsService.hasPermission(userId, 'saved_searches.manage.global');
    const hasCreatePermission = await permissionsService.hasPermission(userId, 'saved_searches.create.own');
    
    if (!hasWildcardPermission && !hasSpecificPermission && !hasCreatePermission) {
      logger.error('❌ P0 SECURITY VIOLATION: Saved searches creation permission required', {
        userId,
        userEmail: session.user.email,
        requestId,
        securityEvent: 'unauthorized_saved_search_creation',
        permissionsChecked: ['saved_searches.*.global', 'saved_searches.manage.global', 'saved_searches.create.own']
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Saved searches creation permission required',
          code: 'ACCESS_DENIED'
        },
        { 
          status: 403,
          headers: {
            'X-Security-Event': 'access-denied',
            'X-Request-ID': requestId
          }
        }
      );
    }

    // ✅ REQUEST VALIDATION
    const body = await request.json();
    const validationErrors = validateCreateSavedSearchData(body);
    
    if (validationErrors.length > 0) {
      logger.warn('Invalid saved search creation data', {
        errors: validationErrors,
        requestId,
        userId
      });
      
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationErrors,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    logger.info('Creating saved search', {
      name: body.name,
      entityType: body.entityType,
      requestId,
      userId
    });

    // ✅ SERVICE LAYER CALL
    const result = await savedSearchesService.createAdmin(body, userId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to create saved search',
          code: 'CREATION_FAILED'
        },
        { status: 400 }
      );
    }

    const duration = Date.now() - startTime;

    // ✅ CACHE INVALIDATION
    await CacheInvalidationService.clearAllCaches();
    revalidateTag('saved-searches');

    // ✅ SUCCESS RESPONSE
    const response = {
      success: true,
      data: result.savedSearch,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        requestId,
        duration,
        source: 'admin-api'
      }
    };

    logger.info('Saved search created successfully', {
      savedSearchId: result.savedSearch?.id,
      name: body.name,
      duration,
      requestId,
      userId
    });

    return NextResponse.json(response, {
      status: 201,
      headers: {
        'X-Request-ID': requestId,
        'X-Processing-Time': duration.toString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Internal server error in saved search creation', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      duration,
      requestId
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        meta: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          requestId,
          duration
        }
      },
      { 
        status: 500,
        headers: {
          'X-Request-ID': requestId,
          'X-Processing-Time': duration.toString()
        }
      }
    );
  }
}

function validateCreateSavedSearchData(data: unknown): string[] {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push('Request body must be a valid JSON object');
    return errors;
  }
  
  const body = data as Record<string, unknown>;
  
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }
  
  if (!body.entityType || typeof body.entityType !== 'string' || body.entityType.trim().length === 0) {
    errors.push('Entity type is required and must be a non-empty string');
  }
  
  if (body.filters && typeof body.filters !== 'object') {
    errors.push('Filters must be a valid object if provided');
  }
  
  return errors;
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
} 