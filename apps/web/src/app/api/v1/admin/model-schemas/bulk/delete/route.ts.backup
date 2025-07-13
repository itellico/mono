import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { modelSchemas } from '@/lib/schemas';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * @openapi
 * /api/v1/admin/model-schemas/bulk/delete:
 *   delete:
 *     summary: Delete multiple model schemas
 *     description: Delete multiple model schemas in a single operation
 *     tags:
 *       - Admin
 *       - Model Schemas
 *       - Bulk Operations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of model schema IDs to delete
 *               force:
 *                 type: boolean
 *                 description: Force delete even if schemas are in use
 *                 default: false
 *     responses:
 *       200:
 *         description: Model schemas deleted successfully
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
 *                         successful:
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
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ids, force = false } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data format. Expected array of schema IDs.' 
      }, { status: 400 });
    }

    const tenantId = (session.user as any).tenantId;
    const userId = parseInt(session.user.id || '0');

    logger.info('Bulk deleting model schemas', {
      tenantId,
      userId,
      count: ids.length,
      force
    });

    const results = {
      deleted: [] as any[],
      failed: [] as any[],
      summary: {
        total: ids.length,
        successful: 0,
        failed: 0
      }
    };

    // Process each schema ID
    for (const schemaId of ids) {
      try {
        // First, check if schema exists and belongs to tenant
        const existingSchema = await db.query.modelSchemas.findFirst({
          where: and(
            eq(modelSchemas.id, schemaId),
            eq(modelSchemas.tenantId, tenantId.toString())
          )
        });

        if (!existingSchema) {
          results.failed.push({
            id: schemaId,
            error: 'Schema not found or access denied'
          });
          continue;
        }

        // TODO: Add usage checks here if needed
        // For now, we'll allow deletion with force flag consideration

        const [deletedSchema] = await db
          .delete(modelSchemas)
          .where(and(
            eq(modelSchemas.id, schemaId),
            eq(modelSchemas.tenantId, tenantId.toString())
          ))
          .returning();

        if (deletedSchema) {
          results.deleted.push(deletedSchema);
          results.summary.successful++;
        } else {
          results.failed.push({
            id: schemaId,
            error: 'Failed to delete schema'
          });
          results.summary.failed++;
        }

      } catch (error) {
        results.failed.push({
          id: schemaId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.summary.failed++;
      }
    }

    logger.info('Bulk model schema deletion completed', {
      tenantId,
      userId,
      summary: results.summary
    });

    return NextResponse.json({
      success: true,
      data: results,
      message: `Successfully deleted ${results.summary.successful} model schemas. ${results.summary.failed} failed.`
    });

  } catch (error) {
    logger.error('Bulk model schema deletion API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 