import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { ImportExportService } from '@/lib/services/import-export.service';

/**
 * @openapi
 * /api/v1/admin/model-schemas/import/append:
 *   post:
 *     summary: Import model schemas (append mode)
 *     description: Import model schemas without deleting existing ones
 *     tags:
 *       - Admin
 *       - Model Schemas
 *       - Import/Export
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                     - subType
 *                     - schema
 *                   properties:
 *                     type:
 *                       type: string
 *                       description: Schema type
 *                     subType:
 *                       type: string
 *                       description: Schema subtype
 *                     displayName:
 *                       type: object
 *                       description: Internationalized display name
 *                     description:
 *                       type: object
 *                       description: Internationalized description
 *                     schema:
 *                       type: object
 *                       description: JSON schema definition
 *                     isActive:
 *                       type: boolean
 *                       description: Whether schema is active
 *                     isTemplate:
 *                       type: boolean
 *                       description: Whether schema is a template
 *                     version:
 *                       type: string
 *                       description: Schema version
 *               skipDuplicates:
 *                 type: boolean
 *                 description: Skip schemas that already exist
 *                 default: true
 *     responses:
 *       200:
 *         description: Model schemas imported successfully
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
 *                     imported:
 *                       type: array
 *                       items:
 *                         type: object
 *                     skipped:
 *                       type: array
 *                       items:
 *                         type: object
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         imported:
 *                           type: number
 *                         skipped:
 *                           type: number
 *                         failed:
 *                           type: number
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { data, skipDuplicates = true } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data format. Expected array of model schemas.' 
      }, { status: 400 });
    }

    const tenantId = (session.user as any).tenantId;
    const userId = parseInt(session.user.id || '0');

    logger.info('Importing model schemas (append mode)', {
      tenantId,
      userId,
      count: data.length,
      skipDuplicates
    });

    const result = await ImportExportService.importModelSchemas(data, {
      tenantId,
      userId,
      mode: 'append',
      skipDuplicates
    });

    logger.info('Model schema import completed', {
      tenantId,
      userId,
      summary: result.summary
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully imported ${result.summary.imported} model schemas. ${result.summary.skipped} skipped, ${result.summary.failed} failed.`
    });

  } catch (error) {
    logger.error('Model schema import API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 