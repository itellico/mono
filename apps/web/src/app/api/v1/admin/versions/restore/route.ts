import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { versioningService } from '@/lib/services/versioning.service';
import { auditService } from '@/lib/services/audit.service';
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

    // Check admin access
    const userId = parseInt(session.user.id);
    const tenantId = 1; // TODO: Get from session when tenant support is added
    const adminInfo = await getAdminRole(userId, tenantId);
    const hasAccess = hasAdminAccess(adminInfo);

    if (!hasAccess.allowed) {
      logger.warn('Forbidden version restore attempt', {
        userId,
        userEmail: session.user.email,
        adminRole: adminInfo?.adminRole?.roleType
      });

      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { versionId, entityType, entityId } = body;

    // Validate required fields
    if (!versionId || !entityType || !entityId) {
      return NextResponse.json(
        { error: 'versionId, entityType, and entityId are required' },
        { status: 400 }
      );
    }

    // Get the version to restore
    const versionToRestore = await versioningService.getVersionById(versionId, tenantId);

    if (!versionToRestore) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // Verify the version matches the requested entity
    if (versionToRestore.entityType !== entityType || versionToRestore.entityId !== entityId) {
      return NextResponse.json(
        { error: 'Version does not match requested entity' },
        { status: 400 }
      );
    }

    // Create a new version with the restored data
    const restoredVersionId = await versioningService.createVersion({
      tenantId,
      entityType,
      entityId,
      data: versionToRestore.data,
      note: `Restored from version ${versionToRestore.version} by admin`,
      createdBy: userId
    });

    if (!restoredVersionId) {
      return NextResponse.json(
        { error: 'Failed to create restored version' },
        { status: 500 }
      );
    }

    // Log the restoration action
    await auditService.logAction({
      tenantId,
      entityType,
      entityId,
      action: 'update',
      userId,
      changes: {
        restored_from_version: versionToRestore.version,
        restored_version_id: versionToRestore.id
      },
      context: {
        action_type: 'version_restore',
        admin_user: userId,
        admin_role: adminInfo?.adminRole?.roleType
      }
    });

    logger.info('Version restored by admin', {
      adminUserId: userId,
      adminRole: adminInfo?.adminRole?.roleType,
      tenantId,
      entityType,
      entityId,
      originalVersionId: versionId,
      originalVersion: versionToRestore.version,
      newVersionId: restoredVersionId
    });

    return NextResponse.json({
      success: true,
      message: 'Version restored successfully',
      restoredVersionId,
      originalVersion: versionToRestore.version
    });

  } catch (error) {
    logger.error('Failed to restore version', {
      error: (error as Error).message
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 