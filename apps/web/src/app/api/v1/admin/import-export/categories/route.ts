import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ImportExportService } from '@/lib/services/import-export.service';
import { logger } from '@/lib/logger';

/**
 * @openapi
 * /api/v1/admin/import-export/categories:
 *   post:
 *     summary: Import categories from JSON
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
 *                     name:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     description:
 *                       type: string
 *                     parentId:
 *                       type: string
 *                     level:
 *                       type: integer
 *                     sortOrder:
 *                       type: integer
 *                     color:
 *                       type: string
 *                     icon:
 *                       type: string
 *                     categoryType:
 *                       type: string
 *                       enum: [entity, classification, attribute, relationship, activity, location, temporal, organizational, functional, descriptive, general]
 *                       description: The type/category of the category
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
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     imported:
 *                       type: integer
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                     warnings:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Export categories to JSON
 *     tags: [Admin, Import/Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: includeSystem
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Whether to include system categories
 *     responses:
 *       200:
 *         description: Export result
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
        error: 'Invalid data format. Expected array of categories.' 
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

    logger.info('Categories import requested', {
      tenantId,
      userId,
      mode,
      count: data.length
    });

    const result = await ImportExportService.importCategories(data, {
      mode: mode as 'delete' | 'append',
      tenantId,
      userId
    });

    logger.info('Categories import completed', {
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
    logger.error('Categories import API error', { error });
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

    const { searchParams } = new URL(request.url);
    const includeSystem = searchParams.get('includeSystem') === 'true';

    const tenantId = (session.user as any).tenantId;

    logger.info('Categories export requested', {
      tenantId,
      includeSystem
    });

    const result = await ImportExportService.exportCategories({
      tenantId,
      includeSystem
    });

    logger.info('Categories export completed', {
      tenantId,
      count: result.data?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message
    });

  } catch (error) {
    logger.error('Categories export API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 