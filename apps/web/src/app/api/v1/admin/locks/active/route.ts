import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { lockingService } from '@/lib/services/locking.service';
import { logger } from '@/lib/logger';
import { canAccessAPI, extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';

export async function GET(request: NextRequest) {
  try {
    // Get session for authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin access
    const userId = parseInt(session.user.id);
    const tenantId = 1; // TODO: Get from session when tenant support is added
    const adminInfo = await getAdminRole(userId, tenantId);
    const hasAccess = hasAdminAccess(adminInfo);

    if (!hasAccess.allowed) {
      logger.warn('Forbidden access attempt to active locks', {
        userId,
        userEmail: session.user.email,
        adminRole: adminInfo?.adminRole?.roleType
      });

      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';

    // Get all active locks for the tenant
    const activeLocks = await lockingService.getActiveLocks(tenantId);

    // Filter locks if search term provided
    const filteredLocks = search 
      ? activeLocks.filter(lock => 
          lock.entityType.toLowerCase().includes(search.toLowerCase()) ||
          lock.entityId.toLowerCase().includes(search.toLowerCase()) ||
          lock.lockedBy.toString().includes(search) ||
          (lock.reason && lock.reason.toLowerCase().includes(search.toLowerCase()))
        )
      : activeLocks;

    logger.info('Active locks fetched by admin', {
      adminUserId: userId,
      adminRole: adminInfo?.adminRole?.roleType,
      tenantId,
      totalLocks: activeLocks.length,
      filteredLocks: filteredLocks.length,
      search
    });

    return NextResponse.json({
      success: true,
      locks: filteredLocks
    });

  } catch (error) {
    logger.error('Failed to fetch active locks', {
      error: (error as Error).message
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 