/**
 * @fileoverview Bulk Permissions API - Efficient permission loading endpoint
 * @version 1.0.0
 * @author itellico Mono
 * 
 * @description
 * API endpoint for bulk loading user permissions. This dramatically improves
 * performance by loading all permissions in a single request instead of
 * multiple individual permission checks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UnifiedPermissionService } from '@/lib/services/unified-permission.service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

/**
 * @openapi
 * /api/v1/permissions/bulk:
 *   get:
 *     summary: Load all user permissions in bulk
 *     description: |
 *       Efficiently loads all permissions for the authenticated user in a single request.
 *       This endpoint dramatically improves performance by reducing N permission API calls to 1 bulk load.
 *       
 *       Performance Benefits:
 *       - Single database query instead of multiple permission checks
 *       - Redis caching with 10-minute TTL
 *       - Scope-aware permission mapping (global → tenant → account)
 *       - Graceful fallback when Redis is disabled
 *     tags:
 *       - Permissions
 *       - Performance
 *     parameters:
 *       - name: tenantId
 *         in: query
 *         description: Tenant ID for tenant-scoped permissions
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - name: useCache
 *         in: query
 *         description: Whether to use Redis cache (default: true)
 *         required: false
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Bulk permissions loaded successfully
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
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     tenantId:
 *                       type: integer
 *                       nullable: true
 *                       example: 1
 *                     permissions:
 *                       type: object
 *                       additionalProperties:
 *                         type: boolean
 *                       example:
 *                         "users.view": true
 *                         "users.create": true
 *                         "users.update": false
 *                         "settings.manage": true
 *                     cachedAt:
 *                       type: integer
 *                       description: Unix timestamp when permissions were cached
 *                       example: 1640995200000
 *                     source:
 *                       type: string
 *                       enum: [cache, database, hybrid]
 *                       description: Where the permissions were loaded from
 *                       example: cache
 *                 meta:
 *                   type: object
 *                   properties:
 *                     permissionCount:
 *                       type: integer
 *                       description: Total number of permissions checked
 *                       example: 25
 *                     loadTime:
 *                       type: string
 *                       description: Time taken to load permissions
 *                       example: "15ms"
 *                     cacheHit:
 *                       type: boolean
 *                       description: Whether data was served from cache
 *                       example: true
 *       401:
 *         description: Unauthorized - User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Authentication required"
 *       400:
 *         description: Bad Request - Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Invalid tenantId parameter"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to load permissions"
 */

// Query parameters validation schema
const querySchema = z.object({
  tenantId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  useCache: z.string().optional().transform(val => val !== 'false').default('true'),
});

/**
 * GET /api/v1/permissions/bulk
 * 
 * Load all user permissions in bulk for efficient permission checking
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      logger.warn('Bulk permissions request without authentication');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // 2. Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    
    const parseResult = querySchema.safeParse(queryParams);
    if (!parseResult.success) {
      logger.warn('Invalid bulk permissions query parameters', {
        errors: parseResult.error.errors,
        userId
      });
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters' },
        { status: 400 }
      );
    }

    const { tenantId, useCache } = parseResult.data;

    // 3. Load bulk permissions
    logger.debug('Loading bulk permissions', {
      userId,
      tenantId,
      useCache,
      userAgent: request.headers.get('user-agent')
    });

    const bulkResult = await UnifiedPermissionService.bulkLoadUserPermissions(userId, {
      tenantId,
      useCache,
    });

    const loadTime = Date.now() - startTime;

    // 4. Log performance metrics
    logger.info('Bulk permissions loaded successfully', {
      userId,
      tenantId,
      permissionCount: Object.keys(bulkResult.permissions).length,
      loadTime: `${loadTime}ms`,
      source: bulkResult.source,
      cacheHit: bulkResult.source === 'cache'
    });

    // 5. Return success response
    return NextResponse.json({
      success: true,
      data: {
        userId: bulkResult.userId,
        tenantId: bulkResult.tenantId,
        permissions: bulkResult.permissions,
        cachedAt: bulkResult.cachedAt,
        source: bulkResult.source
      },
      meta: {
        permissionCount: Object.keys(bulkResult.permissions).length,
        loadTime: `${loadTime}ms`,
        cacheHit: bulkResult.source === 'cache',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const loadTime = Date.now() - startTime;
    
    logger.error('Bulk permissions loading failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      loadTime: `${loadTime}ms`,
      url: request.url
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load permissions',
        meta: {
          loadTime: `${loadTime}ms`,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/permissions/bulk/invalidate
 * 
 * Invalidate bulk permission cache for user (used after permission changes)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // 2. Parse request body
    const body = await request.json();
    const { tenantId } = body;

    // 3. Invalidate cache
    logger.info('Invalidating bulk permission cache', { userId, tenantId });
    
    await UnifiedPermissionService.invalidateBulkCache(userId, tenantId);

    return NextResponse.json({
      success: true,
      message: 'Permission cache invalidated successfully',
      meta: {
        userId,
        tenantId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to invalidate permission cache', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { success: false, error: 'Failed to invalidate cache' },
      { status: 500 }
    );
  }
} 