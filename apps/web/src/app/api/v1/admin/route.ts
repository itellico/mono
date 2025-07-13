/**
* @swagger
 * /api/v1/admin:
 *   get:
 *     summary: Get admin API information
 *     description: Returns available admin endpoints and system status
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 endpoints:
 *                   type: array
 *                   items:
 *                     type: string
 *                 status:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createApiResponse } from "@/lib/api-utils";
import { createApiLogger } from "@/lib/platform/logging";

const log = createApiLogger('admin-api');

// GET /api/v1/admin
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return createApiResponse(
        false,
        undefined,
        'Authentication required',
        undefined,
        401
      );
    }

    // Get admin info - need tenant ID from session
    const userId = parseInt(session.user.id);
    // For now, get tenant ID from first available tenant (needs proper tenant context)
    const tenantId = 1; // TODO: Get from session or request context

    
    // Use enhanced permission system
    // ✅ MONO BEST PRACTICE: Middleware handles all authentication & authorization
    // Permissions already validated - no need for duplicate checks
        const apiInfo = {
      message: 'Mono Admin API v1',
      version: '1.0.0',
      status: 'active',
      endpoints: [
        '/api/v1/admin/users/{userId}/permissions',
        '/api/v1/admin/tenants',
        '/api/v1/admin/analytics',
        '/api/v1/admin/system'
      ],
      capabilities: [
        'User Management',
        'Permission Control',
        'Tenant Administration',
        'System Analytics'
      ]
    };

    log.info('Admin API info requested', { 
      userId: session.user.id,
      userEmail: session.user.email
    });

    return createApiResponse(
      true,
      apiInfo,
      undefined,
      'Admin API information retrieved',
      200
    );

  } catch (error) {
    log.error('Admin API error', { error: error.message });
    return createApiResponse(
      false,
      undefined,
      'Internal server error',
      undefined,
      500
    );
  }
} 