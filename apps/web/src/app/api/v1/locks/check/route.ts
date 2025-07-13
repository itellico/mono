import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { LockingService } from '@/lib/services/locking.service';
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

    // Check lock status
    const lockingService = new LockingService();
    const lockInfo = await lockingService.isLocked(tenantId, entityType, entityId);

    const response = {
      isLocked: !!lockInfo,
      lockedBy: lockInfo?.lockedBy || null,
      lockedAt: lockInfo?.lockedAt?.toISOString() || null,
      expiresAt: lockInfo?.expiresAt?.toISOString() || null,
      reason: lockInfo?.reason || null,
      isActive: lockInfo?.isActive || false
    };

    logger.debug('Lock status checked via API', {
      tenantId,
      entityType,
      entityId,
      isLocked: response.isLocked,
      userId: session.user.id
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Failed to check lock status via API', {
      error: (error as Error).message
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 