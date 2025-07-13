import { NextRequest, NextResponse } from 'next/server';
import { LockingService } from '@/lib/services/locking.service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for lock release
const ReleaseLockSchema = z.object({
  tenantId: z.number(),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  userId: z.number()
});

/**
 * POST /api/v1/locking/release
 * 
 * Release a lock on an entity
 * 
 * @param request - HTTP request with lock release data
 * @returns Lock release result
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request data
    const validationResult = ReleaseLockSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn('Invalid lock release data', {
        errors: validationResult.error.errors,
        body
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid release data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { tenantId, entityType, entityId, userId } = validationResult.data;

    // Check if lock exists and is owned by the requesting user
    const lockingService = new LockingService();
    const existingLock = await lockingService.isLocked(tenantId, entityType, entityId);

    if (!existingLock) {
      logger.warn('Attempted to release non-existent lock', {
        entityType,
        entityId,
        tenantId,
        userId
      });

      return NextResponse.json(
        {
          success: false,
          error: 'No lock exists for this entity',
          message: 'Entity is not currently locked'
        },
        { status: 404 }
      );
    }

    if (existingLock.lockedBy !== userId) {
      logger.warn('Attempted to release lock owned by different user', {
        entityType,
        entityId,
        tenantId,
        requestingUser: userId,
        lockOwner: existingLock.lockedBy
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Cannot release lock owned by another user',
          lockInfo: existingLock,
          message: 'You can only release locks that you own'
        },
        { status: 403 } // Forbidden
      );
    }

    // Attempt to release the lock
    const success = await lockingService.releaseLock(tenantId, entityType, entityId, userId);

    if (success) {
      logger.info('Lock released successfully', {
        entityType,
        entityId,
        tenantId,
        userId
      });

      return NextResponse.json({
        success: true,
        message: 'Lock released successfully'
      });

    } else {
      logger.error('Lock release failed unexpectedly', {
        entityType,
        entityId,
        tenantId,
        userId,
        existingLock
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to release lock',
          message: 'Lock release operation failed'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Lock release endpoint error', {
      error: errorMessage,
      url: request.url
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to release lock',
        message: errorMessage
      },
      { status: 500 }
    );
  }
} 