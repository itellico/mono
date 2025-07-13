import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { versioningService } from '@/lib/services/versioning.service';
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
      logger.warn('Forbidden access attempt to version history', {
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
    const entityType = url.searchParams.get('entityType') || '';
    const entityId = url.searchParams.get('entityId') || '';
    const search = url.searchParams.get('search') || '';

    // Build filters for version history
    const filters = {
      tenantId,
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(search && { search }),
      page,
      limit
    };

    // Fetch version history
    let versions: any[] = [];

    if (entityType && entityId) {
      // Get versions for specific entity
      versions = await versioningService.getEntityVersions(tenantId, entityType, entityId);
    } else {
      // For now, return empty array when no specific entity is requested
      // In a full implementation, this would query all versions with pagination
      versions = [];
    }

    logger.info('Version history fetched by admin', {
      adminUserId: userId,
      adminRole: adminInfo?.adminRole?.roleType,
      filters,
      resultCount: versions.length
    });

    return NextResponse.json({
      success: true,
      versions: versions,
      pagination: {
        page,
        limit,
        total: versions.length, // This would need proper total count in a real implementation
        totalPages: Math.ceil(versions.length / limit),
        hasMore: versions.length === limit
      }
    });

  } catch (error) {
    logger.error('Failed to fetch version history', {
      error: (error as Error).message
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 