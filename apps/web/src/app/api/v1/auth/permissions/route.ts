/**
 * @openapi
 * /api/v1/auth/permissions:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get User Permissions (Three-Layer Cache)
 *     description: |
 *       Retrieves user permissions using three-layer caching system:
 *       1. TanStack Query (client-side cache)
 *       2. Redis (server-side cache)
 *       3. Database (source of truth)
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to fetch permissions for
 *     responses:
 *       '200':
 *         description: User permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                 cached:
 *                   type: boolean
 *                 source:
 *                   type: string
 *                   enum: [redis, database]
 *       '400':
 *         description: Bad request - missing userId
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { permissionsService } from '@/lib/services/permissions.service';
import { ensureCacheReady } from '@/lib/cache/cache-init';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // ✅ Ensure cache middleware is ready
    await ensureCacheReady();

    // ✅ P0 Security: Authentication required
    const session = await auth();
    if (!session?.user) {
      logger.warn('Unauthorized permissions request');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          code: 'UNAUTHENTICATED'
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    if (!requestedUserId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'userId parameter is required' 
        },
        { status: 400 }
      );
    }

    // ✅ Security: Only allow users to fetch their own permissions
    const sessionUserId = (session.user as { id?: string })?.id;
    if (sessionUserId !== requestedUserId) {
      logger.warn('Permission request for different user denied', {
        sessionUserId,
        requestedUserId
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Access denied: Can only fetch your own permissions' 
        },
        { status: 403 }
      );
    }

    logger.info('Fetching user permissions', { 
      userId: requestedUserId,
      sessionUserId 
    });

    // ✅ Three-layer caching system using unified cache middleware
    const userPermissions = await permissionsService.getUserPermissions(requestedUserId);

    if (!userPermissions) {
      logger.warn('No permissions found for user', { userId: requestedUserId });
      return NextResponse.json(
        { 
          success: false, 
          error: 'User permissions not found' 
        },
        { status: 404 }
      );
    }

    logger.info('User permissions retrieved successfully', {
      userId: requestedUserId,
      permissionCount: userPermissions.permissions.length,
      roles: userPermissions.roles
    });

    return NextResponse.json({
      success: true,
      permissions: userPermissions.permissions,
      roles: userPermissions.roles,
      tenantId: userPermissions.tenantId,
      cached: true, // PermissionsService handles caching internally
      source: 'unified-cache-middleware' // Three-layer architecture
    });

  } catch (error) {
    logger.error('Error fetching user permissions', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 