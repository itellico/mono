import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { optionSets, optionValues } from '@/lib/schemas';
import { eq, and } from 'drizzle-orm';

/**
 * @openapi
 * /api/v1/admin/option-sets/bulk/delete:
 *   delete:
 *     summary: Delete multiple option sets
 *     description: Delete multiple option sets and their values in a single operation
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
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of option set IDs to delete
 *               force:
 *                 type: boolean
 *                 description: Force delete even if option sets are in use
 *                 default: false
 *     responses:
 *       200:
 *         description: Option sets deleted successfully
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
        error: 'Invalid data format. Expected array of option set IDs.' 
      }, { status: 400 });
    }

    const tenantId = (session.user as any).tenantId;
    const userId = parseInt(session.user.id || '0');

    logger.info('Bulk deleting option sets', {
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

    // Process each option set ID
    for (const optionSetId of ids) {
      try {
        // First, check if option set exists and belongs to tenant
        const existingOptionSet = await db.query.optionSets.findFirst({
          where: and(
            eq(optionSets.id, optionSetId),
            eq(optionSets.tenantId, tenantId.toString())
          )
        });

        if (!existingOptionSet) {
          results.failed.push({
            id: optionSetId,
            error: 'Option set not found or access denied'
          });
          continue;
        }

        // TODO: Add usage checks here if needed
        // For now, we'll allow deletion with force flag consideration

        await db.transaction(async (tx) => {
          // Delete option values first
          await tx.delete(optionValues)
            .where(eq(optionValues.optionSetId, optionSetId));

          // Delete option set
          const [deletedOptionSet] = await tx
            .delete(optionSets)
            .where(and(
              eq(optionSets.id, optionSetId),
              eq(optionSets.tenantId, tenantId.toString())
            ))
            .returning();

          if (deletedOptionSet) {
            results.deleted.push(deletedOptionSet);
            results.summary.successful++;
          } else {
            results.failed.push({
              id: optionSetId,
              error: 'Failed to delete option set'
            });
            results.summary.failed++;
          }
        });

      } catch (error) {
        results.failed.push({
          id: optionSetId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results.summary.failed++;
      }
    }

    logger.info('Bulk option set deletion completed', {
      tenantId,
      userId,
      summary: results.summary
    });

    return NextResponse.json({
      success: true,
      data: results,
      message: `Successfully deleted ${results.summary.successful} option sets. ${results.summary.failed} failed.`
    });

  } catch (error) {
    logger.error('Bulk option set deletion API error', { error });
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 