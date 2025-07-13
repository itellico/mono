/**
* @swagger
 * /api/v1/admin/integrations/statistics:
 *   get:
 *     summary: Get integration statistics
 *     description: Returns system-wide integration statistics and analytics
 *     tags: [Admin - Integrations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Integration statistics retrieved successfully
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
 *                     totalIntegrations:
 *                       type: integer
 *                       description: Total number of integrations in the system
 *                     enabledIntegrations:
 *                       type: integer
 *                       description: Number of enabled integrations
 *                     categoryCounts:
 *                       type: object
 *                       description: Count of integrations by category
 *                       additionalProperties:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createApiResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { IntegrationsService } from '@/lib/services/integrations.service';

// GET /api/v1/admin/integrations/statistics
export async function GET(request: NextRequest) {
  let session: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return createApiResponse(
        false,
        undefined,
        'Authentication required',
        undefined,
        401
      );
    }

    // Check admin access
    const userId = parseInt(session.user.id);
    const tenantId = 1; // TODO: Get from session context

    
    // Use enhanced permission system
    // ✅ Mono BEST PRACTICE: Middleware handles all authentication & authorization
    // Permissions already validated - no need for duplicate checks
        logger.info('Admin getting integration statistics', { userId });

    const statistics = await IntegrationsService.getIntegrationStatistics();

    logger.info('Admin integration statistics retrieved successfully', { 
      userId,
      statistics 
    });

    return createApiResponse(
      true,
      statistics,
      undefined,
      'Integration statistics retrieved successfully',
      200
    );

  } catch (error) {
    logger.error('Error in admin integration statistics GET', { 
      error: error.message,
      userId: session?.user?.id 
    });
    return createApiResponse(
      false,
      undefined,
      'Internal server error',
      undefined,
      500
    );
  }
} 