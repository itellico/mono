import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { ImportExportService } from '@/lib/services/import-export.service';

/**
 * @openapi
 * /api/v1/admin/model-schemas/export:
 *   get:
 *     summary: Export model schemas
 *     description: Export all model schemas for the current tenant
 *     tags:
 *       - Admin
 *       - Model Schemas
 *       - Import/Export
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeTemplates
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include template schemas in export
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json]
 *           default: json
 *         description: Export format
 *     responses:
 *       200:
 *         description: Model schemas exported successfully
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
    const includeTemplates = searchParams.get('includeTemplates') !== 'false';
    const format = searchParams.get('format') || 'json';

    const tenantId = (session.user as any).tenantId;
    const userId = parseInt(session.user.id || '0');

    logger.info('Exporting model schemas', {
      tenantId,
      userId,
      includeTemplates,
      format
    });

    const result = await ImportExportService.exportModelSchemas({
      tenantId,
      includeTemplates
    });

    logger.info('Model schema export completed', {
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
      message: `Successfully exported ${result.data.length} model schemas.`
    });

  } catch (error) {
    logger.error('Model schema export API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 