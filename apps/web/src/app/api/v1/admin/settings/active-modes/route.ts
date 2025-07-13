/**
 * @openapi
 * /api/v1/admin/settings/active-modes:
 *   get:
 *     summary: Get active admin modes
 *     description: Get current user's active admin modes for top bar display
 *     tags:
 *       - Admin Settings
 *     responses:
 *       200:
 *         description: Active modes retrieved successfully
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
 *                     godMode:
 *                       type: boolean
 *                       example: false
 *                     developerMode:
 *                       type: boolean
 *                       example: true
 *                     debugMode:
 *                       type: boolean
 *                       example: false
 *                     maintenanceMode:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AdminSettingsService } from '@/lib/services/admin-settings.service';
import { logger } from '@/lib/logger';
import { canAccessAPI } from '@/lib/permissions/canAccessAPI';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const hasAccess = await canAccessAPI({
      action: 'read',
      resource: 'admin'
    });
    if (!hasAccess.allowed) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get user's access level from session
    const userRoles = session.user.roles || [];
    const accessLevel = userRoles.includes('super_admin') ? 'super_admin' : 
                       userRoles.some(role => ['admin', 'tenant_admin'].includes(role)) ? 'admin' : 'moderator';

    // Get active modes
    const modes = await AdminSettingsService.getActiveModes(session.user.id, accessLevel);

    return NextResponse.json({
      success: true,
      data: modes
    });

  } catch (error) {
    logger.error('Failed to get active modes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 