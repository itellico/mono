/**
 * Admin Operational Modes API
 * 
 * Returns current God Mode and Developer Mode status with permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { canAccessAPI, extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { AdminSettingsService } from '@/lib/services/admin-settings.service';
import { logger } from '@/lib/logger';

/**
 * @openapi
 * /api/v1/admin/operational-modes:
 *   get:
 *     summary: Get operational modes status
 *     description: Returns current God Mode and Developer Mode status with permissions
 *     tags:
 *       - Admin Settings
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Operational modes status
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
 *                     godMode:
 *                       type: object
 *                       properties:
 *                         hasPermission:
 *                           type: boolean
 *                         isActive:
 *                           type: boolean
 *                         state:
 *                           type: object
 *                           nullable: true
 *                     developerMode:
 *                       type: object
 *                       properties:
 *                         hasPermission:
 *                           type: boolean
 *                         isActive:
 *                           type: boolean
 *                         state:
 *                           type: object
 *                           nullable: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userContext = extractUserContext(session);
    
    // Check API access
    const hasAccess = canAccessAPI(userContext, '/api/v1/admin/operational-modes', 'GET');
    if (!hasAccess.allowed) {
      return NextResponse.json(
        { success: false, error: hasAccess.reason || 'Access denied' },
        { status: 403 }
      );
    }

    const userId = parseInt(session.user.id);

    // Get current operational mode states from settings
    const [godModeEnabled, developerModeEnabled] = await Promise.all([
      AdminSettingsService.getSettingValue('god_mode_enabled', userId).catch(() => false),
      AdminSettingsService.getSettingValue('developer_mode_enabled', userId).catch(() => false)
    ]);

    // Check permissions using unified permission system
    // God Mode and Developer Mode are restricted to super_admin role ONLY
    const hasGodModePermission = userContext.adminRole === 'super_admin';
    const hasDeveloperModePermission = userContext.adminRole === 'super_admin';

    const response = {
      success: true,
      data: {
        godMode: {
          hasPermission: hasGodModePermission,
          isActive: Boolean(godModeEnabled),
          state: godModeEnabled ? {
            isEnabled: true,
            enabledAt: new Date().toISOString(),
            enabledBy: userId,
            reason: 'Enabled via admin settings'
          } : null
        },
        developerMode: {
          hasPermission: hasDeveloperModePermission,
          isActive: Boolean(developerModeEnabled),
          state: developerModeEnabled ? {
            isEnabled: true,
            enabledAt: new Date().toISOString(),
            enabledBy: userId,
            reason: 'Enabled via admin settings'
          } : null
        }
      }
    };

    logger.info('Operational modes status retrieved', {
      userId,
      godModeActive: Boolean(godModeEnabled),
      developerModeActive: Boolean(developerModeEnabled)
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Error getting operational modes status', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 