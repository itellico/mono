import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { lockingService } from '@/lib/services/locking.service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Get session for authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { entityType, entityId, reason, ttlMinutes } = body;

    // Validate required fields
    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    // Get tenant ID - using default for now
    const tenantId = 1; // TODO: Get from session when tenant support is added

    // Attempt to acquire the lock
    const success = await lockingService.acquireLock({
      tenantId,
      entityType,
      entityId,
      lockedBy: parseInt(session.user.id),
      reason: reason || 'Editing record',
      ttlMinutes: ttlMinutes || 30
    });

    if (success) {
      logger.info('Lock acquired via API', {
        tenantId,
        entityType,
        entityId,
        userId: session.user.id,
        reason,
        ttlMinutes
      });

      return NextResponse.json({ 
        success: true,
        message: 'Lock acquired successfully'
      });
    } else {
      logger.warn('Lock acquisition failed via API', {
        tenantId,
        entityType,
        entityId,
        userId: session.user.id,
        reason: 'Lock already held by another user'
      });

      return NextResponse.json({ 
        success: false,
        error: 'Unable to acquire lock - entity may be locked by another user'
      }, { status: 409 });
    }

  } catch (error) {
    logger.error('Failed to acquire lock via API', {
      error: (error as Error).message
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 