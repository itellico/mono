/**
 * @openapi
 * /api/v1/admin/housekeeping:
 *   get:
 *     tags:
 *       - Admin
 *     summary: System Housekeeping
     tags:
       - Admin
 *     description: System Housekeeping
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Operation successful
 *       '401':
 *         description: Authentication required
 *       '500':
 *         description: Internal server error
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { HousekeepingWorker } from '@/workers/housekeeping.worker';
import { queueHousekeeping } from '@/lib/workers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation') || 'analyze';

    if (operation === 'analyze') {
      // Run dry-run analysis to show what would be cleaned
      const worker = new HousekeepingWorker({
        dryRun: true,
        maxFiles: 100,
        gracePeriodHours: 24,
        detectionTypes: ['pending_deletion_files', 'deleted_status_files', 'failed_processing_files', 'abandoned_uploads'],
        logDetails: true
      });

      const result = await worker.runHousekeeping();

      logger.info('Housekeeping analysis completed', {
        userId: session.user.id,
        success: result.success,
        totalProcessed: result.totalProcessed,
        totalCleaned: result.totalCleaned
      });

      return NextResponse.json({
        success: true,
        analysis: result
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid operation' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Housekeeping API error', { 
      error: error.message,
      stack: error.stack 
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { operation, config } = body;

    if (operation === 'queue') {
      // Queue housekeeping job
      const jobId = await queueHousekeeping({
        dryRun: config?.dryRun || false,
        maxFiles: config?.maxFiles || 50,
        gracePeriodHours: config?.gracePeriodHours || 24,
        detectionTypes: config?.detectionTypes || ['pending_deletion_files', 'deleted_status_files', 'failed_processing_files', 'abandoned_uploads'],
        logDetails: config?.logDetails || true
      });

      if (!jobId) {
        return NextResponse.json(
          { success: false, error: 'Failed to queue housekeeping job' },
          { status: 500 }
        );
      }

      logger.info('Housekeeping job queued via API', {
        userId: session.user.id,
        jobId,
        config
      });

      return NextResponse.json({
        success: true,
        jobId,
        message: config?.dryRun ? 'Dry run queued successfully' : 'Housekeeping job queued successfully'
      });
    }

    if (operation === 'immediate') {
      // Run immediate housekeeping (for testing/manual execution)
      const worker = new HousekeepingWorker({
        dryRun: config?.dryRun || false,
        maxFiles: config?.maxFiles || 50,
        gracePeriodHours: config?.gracePeriodHours || 24,
        detectionTypes: config?.detectionTypes || ['pending_deletion_files', 'deleted_status_files', 'failed_processing_files', 'abandoned_uploads'],
        logDetails: config?.logDetails || true
      });

      const result = await worker.runHousekeeping();

      logger.info('Immediate housekeeping completed', {
        userId: session.user.id,
        success: result.success,
        totalProcessed: result.totalProcessed,
        totalCleaned: result.totalCleaned,
        dryRun: result.dryRun
      });

      return NextResponse.json({
        success: true,
        result,
        message: result.dryRun ? 'Dry run completed successfully' : 'Housekeeping completed successfully'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid operation' },
      { status: 400 }
    );

  } catch (error) {
    logger.error('Housekeeping POST API error', { 
      error: error.message,
      stack: error.stack 
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 