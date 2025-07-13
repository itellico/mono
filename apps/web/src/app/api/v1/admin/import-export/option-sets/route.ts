import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ImportExportService } from '@/lib/services/import-export.service';
import { logger } from '@/lib/logger';

/**
 * @openapi
 * /api/v1/admin/import-export/option-sets:
 *   post:
 *     summary: Import option sets from JSON
 *     tags: [Admin, Import/Export]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     slug:
 *                       type: string
 *                     label:
 *                       type: string
 *                     categoryId:
 *                       type: string
 *                     values:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                           value:
 *                             type: string
 *                           order:
 *                             type: integer
 *                           isDefault:
 *                             type: boolean
 *                           canonicalRegion:
 *                             type: string
 *                           regionalMappings:
 *                             type: object
 *                           metadata:
 *                             type: object
 *               mode:
 *                 type: string
 *                 enum: [delete, append]
 *                 description: Whether to delete existing data or append to it
 *     responses:
 *       200:
 *         description: Import result
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Export option sets to JSON
 *     tags: [Admin, Import/Export]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Export result
 */

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { data, mode = 'append' } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data format. Expected array of option sets.' 
      }, { status: 400 });
    }

    if (!['delete', 'append'].includes(mode)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid mode. Must be "delete" or "append".' 
      }, { status: 400 });
    }

    const tenantId = (session.user as any).tenantId;
    const userId = parseInt(session.user.id || '0');

    logger.info('Option sets import requested', {
      tenantId,
      userId,
      mode,
      count: data.length
    });

    const result = await ImportExportService.importOptionSets(data, {
      mode: mode as 'delete' | 'append',
      tenantId,
      userId
    });

    logger.info('Option sets import completed', {
      tenantId,
      userId,
      result: {
        success: result.success,
        imported: result.imported,
        errors: result.errors.length
      }
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Option sets import API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId;

    logger.info('Option sets export requested', {
      tenantId
    });

    const result = await ImportExportService.exportOptionSets({
      tenantId
    });

    logger.info('Option sets export completed', {
      tenantId,
      count: result.data?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message
    });

  } catch (error) {
    logger.error('Option sets export API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 