import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { optionSets } from '@/lib/schemas';
import { eq, and } from 'drizzle-orm';

/**
 * @openapi
 * /api/v1/admin/option-sets/bulk/update:
 *   put:
 *     summary: Update multiple option sets
 *     description: Update multiple option sets in a single operation
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
 *                     - id
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Option set ID
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
 *     responses:
 *       200:
 *         description: Option sets updated successfully
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
    const { optionSets: optionSetsData } = body;

    if (!optionSetsData || !Array.isArray(optionSetsData) || optionSetsData.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid data format. Expected array of option sets.' 
      }, { status: 400 });
    }

    const tenantId = (session.user as any).tenantId;
    const userId = parseInt(session.user.id || '0');

    logger.info('Bulk updating option sets', {
      tenantId,
      userId,
      count: optionSetsData.length
    });

    const results = {
      updated: [] as any[],
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
        if (!optionSetData.id) {
          results.failed.push({
            data: optionSetData,
            error: 'Option set ID is required for updates'
          });
          continue;
        }

        const updateData: any = {
          updatedBy: userId,
          updatedAt: new Date()
        };

        // Only update provided fields
        if (optionSetData.slug) updateData.slug = optionSetData.slug;
        if (optionSetData.label) updateData.label = optionSetData.label;
        if (optionSetData.description) updateData.description = optionSetData.description;
        if (optionSetData.isActive !== undefined) updateData.isActive = optionSetData.isActive;

        const [updatedOptionSet] = await db
          .update(optionSets)
          .set(updateData)
          .where(and(
            eq(optionSets.id, optionSetData.id),
            eq(optionSets.tenantId, tenantId.toString())
          ))
          .returning();

        if (!updatedOptionSet) {
          results.failed.push({
            data: optionSetData,
            error: 'Option set not found or access denied'
          });
          continue;
        }

        results.updated.push(updatedOptionSet);
        results.summary.successful++;

      } catch (error) {
        results.failed.push({
          data: optionSetData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.summary.failed++;
      }
    }

    logger.info('Bulk option set update completed', {
      tenantId,
      userId,
      summary: results.summary
    });

    return NextResponse.json({
      success: true,
      data: results,
      message: `Successfully updated ${results.summary.successful} option sets. ${results.summary.failed} failed.`
    });

  } catch (error) {
    logger.error('Bulk option set update API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 