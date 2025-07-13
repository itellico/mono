/**
 * @openapi
 * /api/v1/admin/settings:
 *   get:
 *     summary: Get all admin settings
 *     description: Retrieve all admin settings with caching and filtering
 *     tags:
 *       - Admin Settings
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [security, general, email, billing, media, localization, ui, business, queue, content, marketplace]
 *         description: Filter by setting category
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [global, tenant, user]
 *         description: Filter by setting level
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: integer
 *         description: Filter by tenant ID (null for platform-wide)
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       key:
 *                         type: string
 *                       displayName:
 *                         type: string
 *                       description:
 *                         type: string
 *                       value:
 *                         type: any
 *                       category:
 *                         type: string
 *                       level:
 *                         type: string
 *                       governance:
 *                         type: string
 *                       isReadonly:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *   post:
 *     summary: Create new admin setting
 *     description: Create a new admin setting with validation
 *     tags:
 *       - Admin Settings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - displayName
 *               - category
 *               - level
 *               - governance
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *                 example: "custom_feature_enabled"
 *               displayName:
 *                 type: string
 *                 example: "Custom Feature"
 *               description:
 *                 type: string
 *                 example: "Enable custom feature functionality"
 *               value:
 *                 type: any
 *                 example: false
 *               defaultValue:
 *                 type: any
 *                 example: false
 *               category:
 *                 type: string
 *                 enum: [security, general, email, billing, media, localization, ui, business, queue, content, marketplace]
 *                 example: "general"
 *               level:
 *                 type: string
 *                 enum: [global, tenant, user]
 *                 example: "tenant"
 *               governance:
 *                 type: string
 *                 enum: [admin_managed, tenant_managed, user_managed]
 *                 example: "admin_managed"
 *               helpText:
 *                 type: string
 *                 example: "Detailed help text for this setting"
 *     responses:
 *       201:
 *         description: Setting created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: Setting key already exists
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AdminSettingsService } from '@/lib/services/admin-settings.service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access (simplified check)
    const userRoles = session.user.roles || [];
    if (!userRoles.some(role => ['super_admin', 'admin', 'moderator'].includes(role))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const tenantIdParam = searchParams.get('tenantId');
    const tenantId = tenantIdParam ? parseInt(tenantIdParam) : null;

    // Build filters
    const filters: any = {};
    if (category) filters.category = category;
    if (level) filters.level = level;
    if (tenantId !== null) filters.tenantId = tenantId;

    // Get settings using the service
    const settings = await AdminSettingsService.getAdminSettings(filters);

    logger.info('Admin settings retrieved via API', { 
      userId: session.user.id,
      count: settings.length,
      filters
    });

    return NextResponse.json({
      success: true,
      data: settings
    });

  } catch (error) {
    logger.error('Failed to get admin settings via API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access
    const userRoles = session.user.roles || [];
    if (!userRoles.some(role => ['super_admin', 'admin'].includes(role))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    const required = ['key', 'displayName', 'category', 'level', 'governance', 'value'];
    for (const field of required) {
      if (!(field in body)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Note: Creating new settings would require adding to the site_settings table directly
    // For now, we'll return a not implemented response
    return NextResponse.json(
      { error: 'Creating new settings not implemented yet' },
      { status: 501 }
    );

  } catch (error) {
    logger.error('Failed to create admin setting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 