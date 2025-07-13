import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { optionSets, optionValues } from '@/lib/schemas';
import { eq, and } from 'drizzle-orm';

/**
 * @openapi
 * /api/v1/admin/option-sets/bulk/upsert:
 *   post:
 *     summary: Upsert multiple option sets
 *     description: Insert or update multiple option sets based on slug matching
 *     tags:
 *       - Admin
 *       - Option Sets
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
 *               - optionSets
 *             properties:
 *               optionSets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - slug
 *                     - label
 *                   properties:
 *                     slug:
 *                       type: string
 *                       description: Unique slug for the option set
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
 *               replaceValues:
 *                 type: boolean
 *                 description: Replace all existing values or merge with new ones
 *                 default: false
 *     responses:
 *       200:
 *         description: Option sets upserted successfully
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
    const { optionSets: optionSetsData, replaceValues = false } = body;

    if (!optionSetsData || !Array.isArray(optionSetsData) || optionSetsData.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data format. Expected array of option sets.' 
      }, { status: 400 });
    }

    const tenantId = (session.user as any).tenantId;
    const userId = parseInt(session.user.id || '0');

    logger.info('Bulk upserting option sets', {
      tenantId,
      userId,
      count: optionSetsData.length,
      replaceValues
    });

    const results = {
      created: [] as any[],
      updated: [] as any[],
      failed: [] as any[],
      summary: {
        total: optionSetsData.length,
        created: 0,
        updated: 0,
        failed: 0
      }
    };

    // Process each option set
    for (const optionSetData of optionSetsData) {
      try {
        // Validate required fields
        if (!optionSetData.slug || !optionSetData.label) {
          results.failed.push({
            data: optionSetData,
            error: 'Slug and label are required'
          });
          continue;
        }

        // Check if option set exists (by slug)
        const existingOptionSet = await db.query.optionSets.findFirst({
          where: and(
            eq(optionSets.tenantId, tenantId.toString()),
            eq(optionSets.slug, optionSetData.slug)
          )
        });

        await db.transaction(async (tx) => {
          if (existingOptionSet) {
            // Update existing option set
            const updateData: any = {
              updatedBy: userId,
              updatedAt: new Date()
            };

            if (optionSetData.label) updateData.label = optionSetData.label;
            if (optionSetData.description) updateData.description = optionSetData.description;
            if (optionSetData.isActive !== undefined) updateData.isActive = optionSetData.isActive;

            const [updatedOptionSet] = await tx
              .update(optionSets)
              .set(updateData)
              .where(eq(optionSets.id, existingOptionSet.id))
              .returning();

            // Handle values if provided
            if (optionSetData.values && Array.isArray(optionSetData.values)) {
              if (replaceValues) {
                // Delete existing values
                await tx.delete(optionValues)
                  .where(eq(optionValues.optionSetId, existingOptionSet.id));
              }

              // Insert new values
              for (const [index, valueData] of optionSetData.values.entries()) {
                await tx.insert(optionValues).values({
                  optionSetId: existingOptionSet.id,
                  value: valueData.value,
                  label: valueData.label,
                  order: valueData.order ?? index,
                  canonicalRegion: valueData.canonicalRegion || 'US',
                  regionalMappings: valueData.regionalMappings || {},
                  metadata: valueData.metadata || {},
                  isActive: valueData.isActive ?? true,
                  createdBy: userId,
                  updatedBy: userId
                });
              }
            }

            results.updated.push({
              ...updatedOptionSet,
              valuesCount: optionSetData.values?.length || 0
            });
            results.summary.updated++;

          } else {
            // Create new option set
            const [newOptionSet] = await tx.insert(optionSets).values({
              tenantId: tenantId.toString(),
              slug: optionSetData.slug,
              label: optionSetData.label,
              description: optionSetData.description || { 'en-US': '' },
              isActive: optionSetData.isActive ?? true,
              createdBy: userId,
              updatedBy: userId
            }).returning();

            // Create option values if provided
            if (optionSetData.values && Array.isArray(optionSetData.values)) {
              for (const [index, valueData] of optionSetData.values.entries()) {
                await tx.insert(optionValues).values({
                  optionSetId: newOptionSet.id,
                  value: valueData.value,
                  label: valueData.label,
                  order: valueData.order ?? index,
                  canonicalRegion: valueData.canonicalRegion || 'US',
                  regionalMappings: valueData.regionalMappings || {},
                  metadata: valueData.metadata || {},
                  isActive: valueData.isActive ?? true,
                  createdBy: userId,
                  updatedBy: userId
                });
              }
            }

            results.created.push({
              ...newOptionSet,
              valuesCount: optionSetData.values?.length || 0
            });
            results.summary.created++;
          }
        });

      } catch (error) {
        results.failed.push({
          data: optionSetData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.summary.failed++;
      }
    }

    logger.info('Bulk option set upsert completed', {
      tenantId,
      userId,
      summary: results.summary
    });

    return NextResponse.json({
      success: true,
      data: results,
      message: `Successfully processed ${results.summary.total} option sets. Created: ${results.summary.created}, Updated: ${results.summary.updated}, Failed: ${results.summary.failed}.`
    });

  } catch (error) {
    logger.error('Bulk option set upsert API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 