import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { lockingService } from '@/lib/services/locking.service';
import { logger } from '@/lib/logger';
import { canAccessAPI, extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';

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

    // Check if user has admin access for force release
    const userId = parseInt(session.user.id);
    const adminInfo = await getAdminRole(userId, tenantId);
    const hasAccess = hasAdminAccess(adminInfo);

    if (!hasAccess.allowed) {
      logger.warn('Forbidden force release attempt', {
        userId,
        userEmail: session.user.email,
        entityType,
        entityId,
        adminRole: adminInfo?.adminRole?.roleType
      });

      return NextResponse.json(
        { error: 'Admin access required for force release' },
        { status: 403 }
      );
    }

    // Attempt to force release the lock
    const success = await lockingService.forceReleaseLock(tenantId, entityType, entityId);

    if (success) {
      logger.info('Lock force released via API', {
        tenantId,
        entityType,
        entityId,
        adminUserId: session.user.id,
        adminRole: adminInfo?.adminRole?.roleType
      });

      return NextResponse.json({ 
        success: true,
        message: 'Lock force released successfully'
      });
    } else {
      logger.warn('Lock force release failed via API', {
        tenantId,
        entityType,
        entityId,
        adminUserId: session.user.id,
        reason: 'Lock does not exist or could not be released'
      });

      return NextResponse.json({ 
        success: false,
        error: 'Unable to force release lock'
      }, { status: 400 });
    }

  } catch (error) {
    logger.error('Failed to force release lock via API', {
      error: (error as Error).message
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 