import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { ImportExportService } from '@/lib/services/import-export.service';

/**
 * @openapi
 * /api/v1/admin/tags/import/append:
 *   post:
 *     summary: Import tags (append mode)
 *     description: Import tags from JSON data, adding to existing tags without deletion
 *     tags:
 *       - Admin
 *       - Tags
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
 *                     - name
 *                     - slug
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Tag name
 *                     slug:
 *                       type: string
 *                       description: URL-friendly slug
 *                     description:
 *                       type: string
 *                       description: Tag description
 *                     color:
 *                       type: string
 *                       description: Hex color code
 *                     metadata:
 *                       type: object
 *                       description: Additional metadata
 *     responses:
 *       200:
 *         description: Tags imported successfully
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
    const { data } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data format. Expected array of tags.' 
      }, { status: 400 });
    }

    const tenantId = (session.user as any).tenantId;
    const userId = parseInt(session.user.id || '0');

    logger.info('Tags import (append mode) requested', {
      tenantId,
      userId,
      count: data.length
    });

    const result = await ImportExportService.importTags(data, {
      tenantId,
      userId,
      mode: 'append'
    });

    logger.info('Tags import (append mode) completed', {
      tenantId,
      userId,
      imported: result.imported,
      errors: result.errors?.length || 0
    });

    return NextResponse.json({
      success: result.success,
      data: {
        imported: result.imported,
        errors: result.errors,
        warnings: result.warnings
      },
      message: result.message
    });

  } catch (error) {
    logger.error('Tags import (append mode) API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 