import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditService } from '@/lib/services/audit.service';
import { logger } from '@/lib/logger';
import { canAccessAPI, extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { getAdminRole, hasAdminAccess } from '@/lib/admin-access-control';

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
    const validAdminInfo = await hasAdminAccess(adminInfo);

    if (!validAdminInfo) {
      logger.warn('Forbidden access attempt to audit logs', {
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
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100);
    const search = url.searchParams.get('search') || '';
    const entityType = url.searchParams.get('entityType') || '';
    const action = url.searchParams.get('action') || '';
    const filterUserId = url.searchParams.get('userId') || '';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build filters
    const filters: any = {
      page,
      limit,
      ...(search && { search }),
      ...(entityType && { entityType }),
      ...(action && { action }),
      ...(filterUserId && { changedBy: parseInt(filterUserId) }), // Changed from userId to changedBy
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) })
    };

    // Fetch audit logs using the correct method
    const result = await auditService.getAuditLogs({
      tenantId,
      ...filters
    });

    logger.info('Audit logs fetched by admin', {
      adminUserId: userId,
      adminRole: validAdminInfo?.adminRole?.roleType,
      filters,
      resultCount: result.logs?.length || 0
    });

    return NextResponse.json({
      success: true,
      logs: result.logs || [],
      pagination: result.pagination
    });

  } catch (error) {
    logger.error('Failed to fetch audit logs', {
      error: (error as Error).message
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 