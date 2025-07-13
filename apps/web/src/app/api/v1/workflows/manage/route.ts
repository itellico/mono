import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { auth } from '@/lib/auth';
import { extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { canAccessAPI, checkPermission } from '@/lib/permissions/detailed-permission-checker';

/**
 * @openapi
 * /api/v1/workflows/manage:
 *   get:
 *     summary: Get workflow management data
 *     description: Retrieve workflows for management (admin only)
 *     tags: [Workflows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workflow data retrieved successfully
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
 *                     workflows:
 *                       type: array
 *                       items:
 *                         type: object
 *                     totalCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await auth();

    // Extract user context using unified permission system
    const userContext = extractUserContext(session);

    logger.info('Workflow API: Checking permissions', {
      isAuthenticated: userContext.isAuthenticated,
      userId: userContext.userId,
      email: userContext.email
    });

    if (!userContext.isAuthenticated) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Check API access using detailed permission checker (includes database lookup)
    const accessResult = await canAccessAPI(userContext, '/api/v1/workflows', 'GET');

    if (!accessResult.allowed) {
      logger.warn('Workflow API: Access denied', {
        reason: accessResult.reason,
        userContext
      });

      return NextResponse.json(
        { 
          success: false,
          error: 'Access denied',
          code: 'INSUFFICIENT_PERMISSIONS',
          reason: accessResult.reason
        },
        { status: 403 }
      );
    }

    // Additionally check specific workflow management permission
    const workflowPermission = await checkPermission(userContext, {
      action: 'manage',
      resource: 'workflows'
    });

    if (!workflowPermission.allowed) {
      logger.warn('Workflow API: Workflow management permission denied', {
        reason: workflowPermission.reason,
        userContext
      });

      return NextResponse.json(
        { 
          success: false,
          error: 'Workflow management access denied',
          code: 'INSUFFICIENT_PERMISSIONS',
          reason: workflowPermission.reason
        },
        { status: 403 }
      );
    }

    logger.info('Workflow API: Access granted', {
      reason: accessResult.reason,
      workflowPermissionReason: workflowPermission.reason
    });

    // Return mock workflow data
    const mockWorkflows = [
      {
        id: 1,
        name: 'User Registration Workflow',
        status: 'active',
        description: 'Handles new user registration process',
        lastModified: new Date().toISOString(),
        createdBy: 'System'
      },
      {
        id: 2,
        name: 'Model Application Review',
        status: 'active', 
        description: 'Reviews and processes model applications',
        lastModified: new Date().toISOString(),
        createdBy: 'Admin'
      },
      {
        id: 3,
        name: 'Photo Review Process',
        status: 'active',
        description: 'Automated photo review and approval workflow',
        lastModified: new Date().toISOString(),
        createdBy: 'System'
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        workflows: mockWorkflows,
        totalCount: mockWorkflows.length,
        permissions: {
          canCreate: workflowPermission.allowed,
          canUpdate: workflowPermission.allowed,
          canDelete: workflowPermission.allowed
        }
      }
    });

  } catch (error) {
    logger.error('Workflow API: Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
} 