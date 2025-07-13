import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { ImportExportService } from '@/lib/services/import-export.service';

/**
 * @openapi
 * /api/v1/admin/option-sets/import/replace:
 *   post:
 *     summary: Import option sets (replace mode)
 *     description: Import option sets and replace all existing ones
 *     tags:
 *       - Admin
 *       - Option Sets
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
 *                     - slug
 *                     - label
 *                   properties:
 *                     slug:
 *                       type: string
 *                       description: Option set slug
 *                     label:
 *                       type: object
 *                       description: Internationalized label
 *                     description:
 *                       type: object
 *                       description: Internationalized description
 *                     isActive:
 *                       type: boolean
 *                       description: Whether option set is active
 *                     values:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                           label:
 *                             type: object
 *                           order:
 *                             type: number
 *                           canonicalRegion:
 *                             type: string
 *                           regionalMappings:
 *                             type: object
 *                           metadata:
 *                             type: object
 *                           isActive:
 *                             type: boolean
 *               preserveSystem:
 *                 type: boolean
 *                 description: Preserve existing system option sets
 *                 default: true
 *     responses:
 *       200:
 *         description: Option sets imported successfully
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
 *                     deleted:
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
 *                         deleted:
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
    const { data, preserveSystem = true } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data format. Expected array of option sets.' 
      }, { status: 400 });
    }

    const tenantId = (session.user as any).tenantId;
    const userId = parseInt(session.user.id || '0');

    logger.info('Importing option sets (replace mode)', {
      tenantId,
      userId,
      count: data.length,
      preserveSystem
    });

    const result = await ImportExportService.importOptionSets(data, {
      tenantId,
      userId,
      mode: 'replace',
      preserveSystem
    });

    logger.info('Option set import (replace) completed', {
      tenantId,
      userId,
      summary: result.summary
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully imported ${result.summary.imported} option sets. ${result.summary.deleted} deleted, ${result.summary.failed} failed.`
    });

  } catch (error) {
    logger.error('Option set import (replace) API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 