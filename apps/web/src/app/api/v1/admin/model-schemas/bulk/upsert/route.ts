import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { modelSchemas } from '@/lib/schemas';
import { eq, and } from 'drizzle-orm';

/**
 * @openapi
 * /api/v1/admin/model-schemas/bulk/upsert:
 *   post:
 *     summary: Upsert multiple model schemas
 *     description: Insert or update multiple model schemas based on type and subType matching
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
 *                     - type
 *                     - subType
 *                     - schema
 *                   properties:
 *                     type:
 *                       type: string
 *                       description: Schema type (e.g., 'profile', 'application')
 *                     subType:
 *                       type: string
 *                       description: Schema subtype (e.g., 'model', 'photographer')
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
 *         description: Model schemas upserted successfully
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
 *                     created:
 *                       type: array
 *                       items:
 *                         type: object
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
 *                         created:
 *                           type: number
 *                         updated:
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
    const { schemas } = body;

    if (!schemas || !Array.isArray(schemas) || schemas.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data format. Expected array of model schemas.' 
      }, { status: 400 });
    }

    const tenantId = (session.user as any).tenantId;
    const userId = parseInt(session.user.id || '0');

    logger.info('Bulk upserting model schemas', {
      tenantId,
      userId,
      count: schemas.length
    });

    const results = {
      created: [] as any[],
      updated: [] as any[],
      failed: [] as any[],
      summary: {
        total: schemas.length,
        created: 0,
        updated: 0,
        failed: 0
      }
    };

    // Process each schema
    for (const schemaData of schemas) {
      try {
        // Validate required fields
        if (!schemaData.type || !schemaData.subType || !schemaData.schema) {
          results.failed.push({
            data: schemaData,
            error: 'Type, subType, and schema are required'
          });
          continue;
        }

        // Check if schema exists (by type and subType)
        const existingSchema = await db.query.modelSchemas.findFirst({
          where: and(
            eq(modelSchemas.tenantId, tenantId.toString()),
            eq(modelSchemas.type, schemaData.type),
            eq(modelSchemas.subType, schemaData.subType)
          )
        });

        if (existingSchema) {
          // Update existing schema
          const updateData: any = {
            updatedBy: userId,
            updatedAt: new Date()
          };

          if (schemaData.displayName) updateData.displayName = schemaData.displayName;
          if (schemaData.description) updateData.description = schemaData.description;
          if (schemaData.schema) updateData.schema = schemaData.schema;
          if (schemaData.isActive !== undefined) updateData.isActive = schemaData.isActive;
          if (schemaData.isTemplate !== undefined) updateData.isTemplate = schemaData.isTemplate;
          if (schemaData.version) updateData.version = schemaData.version;

          const [updatedSchema] = await db
            .update(modelSchemas)
            .set(updateData)
            .where(eq(modelSchemas.id, existingSchema.id))
            .returning();

          results.updated.push(updatedSchema);
          results.summary.updated++;

        } else {
          // Create new schema
          const [newSchema] = await db.insert(modelSchemas).values({
            tenantId: tenantId.toString(),
            type: schemaData.type,
            subType: schemaData.subType,
            displayName: schemaData.displayName || { 'en-US': `${schemaData.type} ${schemaData.subType}` },
            description: schemaData.description || { 'en-US': '' },
            schema: schemaData.schema,
            isActive: schemaData.isActive ?? true,
            isTemplate: schemaData.isTemplate ?? false,
            version: schemaData.version || '1.0.0',
            createdBy: userId,
            updatedBy: userId
          }).returning();

          results.created.push(newSchema);
          results.summary.created++;
        }

      } catch (error) {
        results.failed.push({
          data: schemaData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.summary.failed++;
      }
    }

    logger.info('Bulk model schema upsert completed', {
      tenantId,
      userId,
      summary: results.summary
    });

    return NextResponse.json({
      success: true,
      data: results,
      message: `Successfully processed ${results.summary.total} model schemas. Created: ${results.summary.created}, Updated: ${results.summary.updated}, Failed: ${results.summary.failed}.`
    });

  } catch (error) {
    logger.error('Bulk model schema upsert API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 