import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { modelSchemas } from '@/lib/schemas';
import { eq, and } from 'drizzle-orm';

/**
 * @openapi
 * /api/v1/admin/model-schemas/bulk/update:
 *   put:
 *     summary: Update multiple model schemas
 *     description: Update multiple model schemas in a single operation
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
 *               - schemas
 *             properties:
 *               schemas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Schema ID
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
 *     responses:
 *       200:
 *         description: Model schemas updated successfully
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
 *                     updated:
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
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { schemas } = body;

    if (!schemas || !Array.isArray(schemas) || schemas.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data format. Expected array of model schemas.' 
      }, { status: 400 });
    }

    const tenantId = (session.user as any).tenantId;
    const userId = parseInt(session.user.id || '0');

    logger.info('Bulk updating model schemas', {
      tenantId,
      userId,
      count: schemas.length
    });

    const results = {
      updated: [] as any[],
      failed: [] as any[],
      summary: {
        total: schemas.length,
        successful: 0,
        failed: 0
      }
    };

    // Process each schema
    for (const schemaData of schemas) {
      try {
        // Validate required fields
        if (!schemaData.id) {
          results.failed.push({
            data: schemaData,
            error: 'Schema ID is required for updates'
          });
          continue;
        }

        const updateData: any = {
          updatedBy: userId,
          updatedAt: new Date()
        };

        // Only update provided fields
        if (schemaData.type) updateData.type = schemaData.type;
        if (schemaData.subType) updateData.subType = schemaData.subType;
        if (schemaData.displayName) updateData.displayName = schemaData.displayName;
        if (schemaData.description) updateData.description = schemaData.description;
        if (schemaData.schema) updateData.schema = schemaData.schema;
        if (schemaData.isActive !== undefined) updateData.isActive = schemaData.isActive;
        if (schemaData.isTemplate !== undefined) updateData.isTemplate = schemaData.isTemplate;
        if (schemaData.version) updateData.version = schemaData.version;

        const [updatedSchema] = await db
          .update(modelSchemas)
          .set(updateData)
          .where(and(
            eq(modelSchemas.id, schemaData.id),
            eq(modelSchemas.tenantId, tenantId.toString())
          ))
          .returning();

        if (!updatedSchema) {
          results.failed.push({
            data: schemaData,
            error: 'Schema not found or access denied'
          });
          continue;
        }

        results.updated.push(updatedSchema);
        results.summary.successful++;

      } catch (error) {
        results.failed.push({
          data: schemaData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.summary.failed++;
      }
    }

    logger.info('Bulk model schema update completed', {
      tenantId,
      userId,
      summary: results.summary
    });

    return NextResponse.json({
      success: true,
      data: results,
      message: `Successfully updated ${results.summary.successful} model schemas. ${results.summary.failed} failed.`
    });

  } catch (error) {
    logger.error('Bulk model schema update API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 