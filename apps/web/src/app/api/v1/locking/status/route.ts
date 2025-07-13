import { NextRequest, NextResponse } from 'next/server';
import { LockingService } from '@/lib/services/locking.service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for lock status query
const LockStatusQuerySchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  tenantId: z.coerce.number()
});

/**
 * GET /api/v1/locking/status
 * 
 * Check the lock status of an entity
 * 
 * @param request - HTTP request with query parameters
 * @returns Lock status information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = {
      entityType: searchParams.get('entityType'),
      entityId: searchParams.get('entityId'),
      tenantId: searchParams.get('tenantId')
    };

    // Validate query parameters
    const validationResult = LockStatusQuerySchema.safeParse(queryData);
    if (!validationResult.success) {
      logger.warn('Invalid lock status query parameters', {
        errors: validationResult.error.errors,
        queryData
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { entityType, entityId, tenantId } = validationResult.data;

    // Check lock status using LockingService
    const lockingService = new LockingService();
    const lockInfo = await lockingService.isLocked(tenantId, entityType, entityId);

    logger.debug('Lock status checked', {
      entityType,
      entityId,
      tenantId,
      isLocked: !!lockInfo,
      lockedBy: lockInfo?.lockedBy
    });

    return NextResponse.json({
      success: true,
      isLocked: !!lockInfo,
      lockInfo: lockInfo || null
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Lock status check failed', {
      error: errorMessage,
      url: request.url
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check lock status',
        message: errorMessage
      },
      { status: 500 }
    );
  }
} 