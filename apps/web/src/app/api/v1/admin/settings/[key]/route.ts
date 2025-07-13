/**
 * @openapi
 * /api/v1/admin/settings/{key}:
 *   get:
 *     summary: Get specific admin setting
 *     description: Retrieve a specific admin setting by key
 *     tags:
 *       - Admin Settings
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key
 *       - in: query
 *         name: userId
 *         schema:
 *           type: number
 *         description: User ID for user-specific settings
 *     responses:
 *       200:
 *         description: Setting retrieved successfully
 *       404:
 *         description: Setting not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *   put:
 *     summary: Update admin setting value
 *     description: Update the value of an admin setting
 *     tags:
 *       - Admin Settings
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: any
 *                 example: true
 *               userId:
 *                 type: number
 *                 description: User ID for user-specific settings
 *               reason:
 *                 type: string
 *                 example: "Updated via admin panel"
 *     responses:
 *       200:
 *         description: Setting updated successfully
 *       400:
 *         description: Invalid value or validation failed
 *       404:
 *         description: Setting not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *   delete:
 *     summary: Delete admin setting
 *     description: Delete an admin setting (only custom settings)
 *     tags:
 *       - Admin Settings
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key
 *     responses:
 *       200:
 *         description: Setting deleted successfully
 *       400:
 *         description: Cannot delete system setting
 *       404:
 *         description: Setting not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AdminSettingsService } from '@/lib/services/admin-settings.service';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { canAccessAPI } from '@/lib/permissions/canAccessAPI';

interface RouteParams {
  params: Promise<{ key: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { key } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const hasAccess = await canAccessAPI({
      action: 'read',
      resource: 'admin'
    });
    if (!hasAccess.allowed) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Get setting value
    const value = await AdminSettingsService.getSettingValue(
      key, 
      userId ? parseInt(userId) : undefined
    );

    if (value === null) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    // Get full setting details from siteSettings table
    const setting = await db.siteSettings.findFirst({
      where: {
        key,
        isActive: true,
        ...(userId && { userId: parseInt(userId) })
      }
    });

    if (!setting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...setting,
        currentValue: value
      }
    });

  } catch (error) {
    logger.error(`Failed to get setting ${await params.then(p => p.key)}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { key } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const hasAccess = await canAccessAPI({
      action: 'update',
      resource: 'admin'
    });
    if (!hasAccess.allowed) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { value, userId, reason } = body;

    if (value === undefined) {
      return NextResponse.json(
        { error: 'Value is required' },
        { status: 400 }
      );
    }

    // Update setting value
    const success = await AdminSettingsService.updateSettingValue(
      key,
      value,
      userId || session.user.id,
      session.user.id,
      reason
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update setting' },
        { status: 400 }
      );
    }

    logger.info('Admin setting updated', {
      userId: session.user.id,
      key,
      targetUserId: userId
    });

    return NextResponse.json({
      success: true,
      message: 'Setting updated successfully'
    });

  } catch (error) {
    logger.error(`Failed to update setting ${await params.then(p => p.key)}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { key } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only admin can delete settings
    const hasAccess = await canAccessAPI({
      action: 'delete',
      resource: 'admin'
    });
    if (!hasAccess.allowed) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if it's a system setting (cannot be deleted)
    // TODO: Implement predefined settings check
    const isSystemSetting = ['god_mode_enabled', 'developer_mode_enabled', 'maintenance_mode_enabled'].includes(key);
    if (isSystemSetting) {
      return NextResponse.json(
        { error: 'Cannot delete system setting' },
        { status: 400 }
      );
    }

    // Get setting first
    const setting = await db.siteSettings.findFirst({
      where: { key }
    });

    if (!setting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await db.siteSettings.update({
      where: { id: setting.id },
      data: {
        isActive: false,
        lastModifiedBy: parseInt(session.user.id),
        updatedAt: new Date()
      }
    });

    // Invalidate cache
    await AdminSettingsService['invalidateCache'](
      setting.userId || undefined,
      !!setting.userId
    );

    logger.info('Admin setting deleted', {
      userId: session.user.id,
      settingId: setting.id,
      key
    });

    return NextResponse.json({
      success: true,
      message: 'Setting deleted successfully'
    });

  } catch (error) {
    logger.error(`Failed to delete setting ${await params.then(p => p.key)}:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 