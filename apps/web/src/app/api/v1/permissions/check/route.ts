import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { 
  checkEnhancedPermission,
  extractUserContext,
  type PermissionCheck 
} from '@/lib/permissions/enhanced-unified-permission-system';

/**
 * @openapi
 * /api/v1/permissions/check:
 *   post:
 *     summary: Check user permissions
 *     description: Validates if the authenticated user has the specified permission
 *     tags:
 *       - Permissions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission
 *             properties:
 *               permission:
 *                 type: string
 *                 description: Permission string in format "resource.action.scope"
 *                 example: "users.read.tenant"
 *               tenantId:
 *                 type: string
 *                 description: Tenant ID for tenant-scoped permissions
 *               accountId:
 *                 type: string
 *                 description: Account ID for account-scoped permissions
 *               resourceId:
 *                 type: string
 *                 description: Specific resource ID for resource-scoped permissions
 *     responses:
 *       200:
 *         description: Permission check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allowed:
 *                   type: boolean
 *                   description: Whether permission is granted
 *                 reason:
 *                   type: string
 *                   description: Explanation for the permission result
 *                 matchedPermission:
 *                   type: object
 *                   description: The specific permission that matched (if any)
 *       401:
 *         description: Unauthorized - user not authenticated
 *       400:
 *         description: Bad request - invalid permission format
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { permission, tenantId, accountId, resourceId } = body;

    if (!permission || typeof permission !== 'string') {
      return NextResponse.json(
        { error: 'Permission string is required' },
        { status: 400 }
      );
    }

    // Parse permission string
    const parts = permission.split('.');
    if (parts.length !== 3) {
      return NextResponse.json(
        { error: 'Invalid permission format. Expected: resource.action.scope' },
        { status: 400 }
      );
    }

    const [resource, action, scope] = parts;

    // Extract user context
    const userContext = extractUserContext(session);
    if (!userContext.isAuthenticated) {
      return NextResponse.json(
        { allowed: false, reason: 'User not authenticated' },
        { status: 200 }
      );
    }

    // Create permission check object
    const permissionCheck: PermissionCheck = {
      action: action as any,
      resource: resource as any,
      scope: scope as any,
      tenantId,
      accountId,
      resourceId
    };

    // Perform permission check
    const result = await checkEnhancedPermission(userContext, permissionCheck);

    // Log the permission check
    logger.info('Permission check performed', {
      userId: userContext.userId,
      permission,
      tenantId,
      accountId,
      resourceId,
      result: result.allowed,
      reason: result.reason,
      type: 'permission_check'
    });

    return NextResponse.json(result);

  } catch (error) {
    logger.error('Permission check API error', {
      error: error instanceof Error ? error.message : String(error),
      type: 'api_error'
    });

    return NextResponse.json(
      { 
        allowed: false, 
        reason: 'Permission check failed due to system error' 
      },
      { status: 500 }
    );
  }
} 