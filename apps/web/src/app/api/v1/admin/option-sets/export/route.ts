import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { ImportExportService } from '@/lib/services/import-export.service';

/**
 * @openapi
 * /api/v1/admin/option-sets/export:
 *   get:
 *     summary: Export option sets
 *     description: Export all option sets for the current tenant
 *     tags:
 *       - Admin
 *       - Option Sets
 *       - Import/Export
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeValues
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include option values in export
 *       - in: query
 *         name: includeSystem
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include system option sets in export
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json]
 *           default: json
 *         description: Export format
 *     responses:
 *       200:
 *         description: Option sets exported successfully
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
 *                 meta:
 *                   type: object
 *                   properties:
 *                     exportedAt:
 *                       type: string
 *                       format: date-time
 *                     tenantId:
 *                       type: string
 *                     count:
 *                       type: number
 *                     version:
 *                       type: string
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
    const includeValues = searchParams.get('includeValues') !== 'false';
    const includeSystem = searchParams.get('includeSystem') === 'true';
    const format = searchParams.get('format') || 'json';

    const tenantId = (session.user as any).tenantId;
    const userId = parseInt(session.user.id || '0');

    logger.info('Exporting option sets', {
      tenantId,
      userId,
      includeValues,
      includeSystem,
      format
    });

    const result = await ImportExportService.exportOptionSets({
      tenantId,
      includeValues,
      includeSystem
    });

    logger.info('Option set export completed', {
      tenantId,
      userId,
      count: result.data.length
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: {
        exportedAt: new Date().toISOString(),
        tenantId,
        count: result.data.length,
        version: '1.0.0'
      },
      message: `Successfully exported ${result.data.length} option sets.`
    });

  } catch (error) {
    logger.error('Option set export API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 