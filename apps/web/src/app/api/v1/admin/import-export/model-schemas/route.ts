import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ImportExportService } from '@/lib/services/import-export.service';
import { logger } from '@/lib/logger';

/**
 * @openapi
 * /api/v1/admin/import-export/model-schemas:
 *   post:
 *     summary: Import model schemas from JSON
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
 *                     type:
 *                       type: string
 *                     subType:
 *                       type: string
 *                     displayName:
 *                       type: object
 *                     description:
 *                       type: object
 *                     schema:
 *                       type: object
 *                       properties:
 *                         fields:
 *                           type: array
 *                           items:
 *                             type: object
 *                     isTemplate:
 *                       type: boolean
 *                     isActive:
 *                       type: boolean
 *                     metadata:
 *                       type: object
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
 *     summary: Export model schemas to JSON
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
        error: 'Invalid data format. Expected array of model schemas.' 
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

    logger.info('Model schemas import requested', {
      tenantId,
      userId,
      mode,
      count: data.length
    });

    const result = await ImportExportService.importModelSchemas(data, {
      mode: mode as 'delete' | 'append',
      tenantId,
      userId
    });

    logger.info('Model schemas import completed', {
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
    logger.error('Model schemas import API error', { error });
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

    logger.info('Model schemas export requested', {
      tenantId
    });

    const result = await ImportExportService.exportModelSchemas({
      tenantId
    });

    logger.info('Model schemas export completed', {
      tenantId,
      count: result.data?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message
    });

  } catch (error) {
    logger.error('Model schemas export API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 