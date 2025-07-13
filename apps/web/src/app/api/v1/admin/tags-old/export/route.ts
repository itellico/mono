import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { ImportExportService } from '@/lib/services/import-export.service';

/**
 * @openapi
 * /api/v1/admin/tags/export:
 *   get:
 *     summary: Export tags
 *     description: Export all tags as JSON data
 *     tags:
 *       - Admin
 *       - Tags
 *       - Import/Export
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: includeSystem
 *         in: query
 *         description: Include system tags in export
 *         required: false
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Tags exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       description:
 *                         type: string
 *                       color:
 *                         type: string
 *                       isSystem:
 *                         type: boolean
 *                       isActive:
 *                         type: boolean
 *                       usageCount:
 *                         type: number
 *                       metadata:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeSystem = searchParams.get('includeSystem') !== 'false';

    const tenantId = (session.user as any).tenantId;

    logger.info('Tags export requested', {
      tenantId,
      includeSystem
    });

    const result = await ImportExportService.exportTags({
      tenantId,
      includeSystem
    });

    logger.info('Tags export completed', {
      tenantId,
      count: Array.isArray(result.data) ? result.data.length : 0
    });

    return NextResponse.json({
      success: result.success,
      data: result.data,
      message: result.message
    });

  } catch (error) {
    logger.error('Tags export API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 