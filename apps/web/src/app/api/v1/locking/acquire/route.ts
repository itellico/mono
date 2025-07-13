import { NextRequest, NextResponse } from 'next/server';
import { LockingService } from '@/lib/services/locking.service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for lock acquisition
const AcquireLockSchema = z.object({
  tenantId: z.number(),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  lockedBy: z.number(),
  ttlMinutes: z.number().min(1).max(1440).default(30), // Max 24 hours
  reason: z.string().optional()
});

/**
 * POST /api/v1/locking/acquire
 * 
 * Acquire a lock on an entity
 * 
 * @param request - HTTP request with lock acquisition data
 * @returns Lock acquisition result
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request data
    const validationResult = AcquireLockSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn('Invalid lock acquisition data', {
        errors: validationResult.error.errors,
        body
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid lock data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const lockData = validationResult.data;

    // Attempt to acquire lock using LockingService
    const lockingService = new LockingService();
    const success = await lockingService.acquireLock({
      tenantId: lockData.tenantId,
      entityType: lockData.entityType,
      entityId: lockData.entityId,
      lockedBy: lockData.lockedBy,
      ttlMinutes: lockData.ttlMinutes,
      reason: lockData.reason
    });

    if (success) {
      // Return lock information if acquisition was successful
      const lockInfo = await lockingService.isLocked(
        lockData.tenantId, 
        lockData.entityType, 
        lockData.entityId
      );

      logger.info('Lock acquired successfully', {
        entityType: lockData.entityType,
        entityId: lockData.entityId,
        tenantId: lockData.tenantId,
        lockedBy: lockData.lockedBy,
        ttlMinutes: lockData.ttlMinutes
      });

      return NextResponse.json({
        success: true,
        lockInfo,
        message: 'Lock acquired successfully'
      });

    } else {
      // Lock acquisition failed (likely already locked)
      const existingLock = await lockingService.isLocked(
        lockData.tenantId, 
        lockData.entityType, 
        lockData.entityId
      );

      logger.warn('Lock acquisition failed', {
        entityType: lockData.entityType,
        entityId: lockData.entityId,
        tenantId: lockData.tenantId,
        requestedBy: lockData.lockedBy,
        existingLock
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Entity is already locked',
          existingLock,
          message: 'Cannot acquire lock - entity is currently locked by another user'
        },
        { status: 409 } // Conflict
      );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Lock acquisition endpoint error', {
      error: errorMessage,
      url: request.url
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to acquire lock',
        message: errorMessage
      },
      { status: 500 }
    );
  }
} 