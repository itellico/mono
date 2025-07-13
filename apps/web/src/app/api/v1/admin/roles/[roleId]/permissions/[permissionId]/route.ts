import { NextRequest, NextResponse } from 'next/server';
import { canAccessAPI } from '@/lib/permissions/canAccessAPI';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { permissionsService } from '@/lib/services/permissions.service';
import { AuditService } from '@/lib/services/audit.service';
import { CacheKeyBuilder } from '@/lib/cache/cache-middleware';
import { cache } from '@/lib/cache/cache-middleware';

/**
 * POST /api/v1/admin/roles/:roleId/permissions/:permissionId
 * Grant a permission to a role
 * 
 * @openapi
 * /api/v1/admin/roles/{roleId}/permissions/{permissionId}:
 *   post:
 *     tags: [Permissions]
 *     summary: Grant a permission to a role
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Permission granted successfully
 *       400:
 *         description: Bad request - permission already granted
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Role or permission not found
 *       500:
 *         description: Internal server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { roleId: string; permissionId: string } }
) {
  try {
    const roleId = parseInt(params.roleId);
    const permissionId = parseInt(params.permissionId);

    if (isNaN(roleId) || isNaN(permissionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role or permission ID' },
        { status: 400 }
      );
    }

    // Check permissions
    const accessResult = await canAccessAPI({
      action: 'manage',
      resource: 'permissions',
      metadata: { roleId, permissionId }
    });

    if (!accessResult.allowed) {
      return NextResponse.json(
        { success: false, error: accessResult.reason },
        { status: 403 }
      );
    }

    // Verify role exists
    const role = await db.role.findUnique({
      where: { id: roleId },
      select: { id: true, name: true, code: true }
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    // Verify permission exists
    const permission = await db.permission.findUnique({
      where: { id: permissionId },
      select: { id: true, name: true, pattern: true }
    });

    if (!permission) {
      return NextResponse.json(
        { success: false, error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Check if permission is already granted
    const existingGrant = await db.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId
        }
      }
    });

    if (existingGrant) {
      return NextResponse.json(
        { success: false, error: 'Permission already granted to this role' },
        { status: 400 }
      );
    }

    // Grant the permission
    const rolePermission = await db.rolePermission.create({
      data: {
        roleId,
        permissionId
      }
    });

    // Audit log
    await AuditService.logEntityChange({
      userId: parseInt(accessResult.userId!),
      entityType: 'role_permission',
      entityId: `${roleId}-${permissionId}`,
      action: 'create',
      changes: {
        roleId,
        roleName: role.name,
        permissionId,
        permissionName: permission.name,
        action: 'granted'
      }
    });

    // Invalidate caches for all users with this role
    const usersWithRole = await db.userRole.findMany({
      where: { roleId },
      select: { userId: true, user: { select: { account: { select: { tenantId: true } } } } }
    });

    for (const userRole of usersWithRole) {
      await permissionsService.invalidateUserPermissions(userRole.userId.toString());
    }

    // Also invalidate role cache
    await cache.invalidateByTag(`role:${roleId}`);

    logger.info('Permission granted to role', {
      userId: accessResult.userId,
      roleId,
      roleName: role.name,
      permissionId,
      permissionName: permission.name
    });

    return NextResponse.json({
      success: true,
      data: rolePermission,
      message: `Permission "${permission.name}" granted to role "${role.name}"`
    });
  } catch (error) {
    logger.error('Failed to grant permission to role', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      roleId: params.roleId,
      permissionId: params.permissionId
    });
    
    return NextResponse.json(
      { success: false, error: 'Failed to grant permission' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/admin/roles/:roleId/permissions/:permissionId
 * Revoke a permission from a role
 * 
 * @openapi
 * /api/v1/admin/roles/{roleId}/permissions/{permissionId}:
 *   delete:
 *     tags: [Permissions]
 *     summary: Revoke a permission from a role
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Permission revoked successfully
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Role permission assignment not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { roleId: string; permissionId: string } }
) {
  try {
    const roleId = parseInt(params.roleId);
    const permissionId = parseInt(params.permissionId);

    if (isNaN(roleId) || isNaN(permissionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role or permission ID' },
        { status: 400 }
      );
    }

    // Check permissions
    const accessResult = await canAccessAPI({
      action: 'manage',
      resource: 'permissions',
      metadata: { roleId, permissionId }
    });

    if (!accessResult.allowed) {
      return NextResponse.json(
        { success: false, error: accessResult.reason },
        { status: 403 }
      );
    }

    // Verify the role permission assignment exists
    const rolePermission = await db.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId
        }
      },
      include: {
        role: { select: { name: true } },
        permission: { select: { name: true } }
      }
    });

    if (!rolePermission) {
      return NextResponse.json(
        { success: false, error: 'Permission not assigned to this role' },
        { status: 404 }
      );
    }

    // Prevent removal of critical permissions from super_admin
    if (rolePermission.role.name === 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot remove permissions from super admin role' },
        { status: 400 }
      );
    }

    // Delete the role permission assignment
    await db.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId
        }
      }
    });

    // Audit log
    await AuditService.logEntityChange({
      userId: parseInt(accessResult.userId!),
      entityType: 'role_permission',
      entityId: `${roleId}-${permissionId}`,
      action: 'delete',
      changes: {
        roleId,
        roleName: rolePermission.role.name,
        permissionId,
        permissionName: rolePermission.permission.name,
        action: 'revoked'
      }
    });

    // Invalidate caches for all users with this role
    const usersWithRole = await db.userRole.findMany({
      where: { roleId },
      select: { userId: true, user: { select: { account: { select: { tenantId: true } } } } }
    });

    for (const userRole of usersWithRole) {
      await permissionsService.invalidateUserPermissions(userRole.userId.toString());
    }

    // Also invalidate role cache
    await cache.invalidateByTag(`role:${roleId}`);

    logger.info('Permission revoked from role', {
      userId: accessResult.userId,
      roleId,
      roleName: rolePermission.role.name,
      permissionId,
      permissionName: rolePermission.permission.name
    });

    return NextResponse.json({
      success: true,
      message: `Permission "${rolePermission.permission.name}" revoked from role "${rolePermission.role.name}"`
    });
  } catch (error) {
    logger.error('Failed to revoke permission from role', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      roleId: params.roleId,
      permissionId: params.permissionId
    });
    
    return NextResponse.json(
      { success: false, error: 'Failed to revoke permission' },
      { status: 500 }
    );
  }
}