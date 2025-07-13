import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { optionSets, optionValues } from '@/lib/schemas';

/**
 * @openapi
 * /api/v1/admin/option-sets/bulk/create:
 *   post:
 *     summary: Create multiple option sets
 *     description: Create multiple option sets with their values in a single operation
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
 *                         required:
 *                           - value
 *                           - label
 *                         properties:
 *                           value:
 *                             type: string
 *                             description: Option value
 *                           label:
 *                             type: object
 *                             description: Internationalized label
 *                           order:
 *                             type: number
 *                             description: Display order
 *                           canonicalRegion:
 *                             type: string
 *                             description: Canonical region for this value
 *                           regionalMappings:
 *                             type: object
 *                             description: Regional mappings and conversions
 *                           metadata:
 *                             type: object
 *                             description: Additional metadata
 *                           isActive:
 *                             type: boolean
 *                             description: Whether value is active
 *     responses:
 *       201:
 *         description: Option sets created successfully
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
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { optionSets: optionSetsData } = body;

    if (!optionSetsData || !Array.isArray(optionSetsData) || optionSetsData.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data format. Expected array of option sets.' 
      }, { status: 400 });
    }

    const tenantId = (session.user as any).tenantId;
    const userId = parseInt(session.user.id || '0');

    logger.info('Bulk creating option sets', {
      tenantId,
      userId,
      count: optionSetsData.length
    });

    const results = {
      created: [] as any[],
      failed: [] as any[],
      summary: {
        total: optionSetsData.length,
        successful: 0,
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

        await db.transaction(async (tx) => {
          // Create option set
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
        });

        results.summary.successful++;

      } catch (error) {
        results.failed.push({
          data: optionSetData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.summary.failed++;
      }
    }

    logger.info('Bulk option set creation completed', {
      tenantId,
      userId,
      summary: results.summary
    });

    return NextResponse.json({
      success: true,
      data: results,
      message: `Successfully created ${results.summary.successful} option sets. ${results.summary.failed} failed.`
    }, { status: 201 });

  } catch (error) {
    logger.error('Bulk option set creation API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 