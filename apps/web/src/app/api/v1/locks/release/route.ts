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
    const { entityType, entityId } = body;

    // Validate required fields
    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    // Get tenant ID - using default for now
    const tenantId = 1; // TODO: Get from session when tenant support is added

    // Attempt to release the lock
    const success = await lockingService.releaseLock(
      tenantId,
      entityType,
      entityId,
      parseInt(session.user.id)
    );

    if (success) {
      logger.info('Lock released via API', {
        tenantId,
        entityType,
        entityId,
        userId: session.user.id
      });

      return NextResponse.json({ 
        success: true,
        message: 'Lock released successfully'
      });
    } else {
      logger.warn('Lock release failed via API', {
        tenantId,
        entityType,
        entityId,
        userId: session.user.id,
        reason: 'User does not own the lock or lock does not exist'
      });

      return NextResponse.json({ 
        success: false,
        error: 'Unable to release lock - you may not own this lock'
      }, { status: 403 });
    }

  } catch (error) {
    logger.error('Failed to release lock via API', {
      error: (error as Error).message
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 