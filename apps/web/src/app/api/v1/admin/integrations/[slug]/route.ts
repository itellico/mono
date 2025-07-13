/**
import { canAccessAPI, extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
 * @swagger
 * /api/v1/admin/integrations/{slug}:
 *   get:
 *     summary: Get integration by slug
 *     description: Returns a specific integration by its slug
 *     tags: [Admin - Integrations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Integration slug
 *     responses:
 *       200:
 *         description: Integration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Integration'
 *       404:
 *         description: Integration not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *   put:
 *     summary: Update integration
 *     description: Updates an existing integration
 *     tags: [Admin - Integrations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Integration slug
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateIntegrationRequest'
 *     responses:
 *       200:
 *         description: Integration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Integration'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Integration not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *   delete:
 *     summary: Delete integration
 *     description: Deletes an integration (this will also remove all tenant configurations)
 *     tags: [Admin - Integrations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Integration slug
 *     responses:
 *       200:
 *         description: Integration deleted successfully
 *       404:
 *         description: Integration not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createApiResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { IntegrationsService } from '@/lib/services/integrations.service';
import type { UpdateIntegrationRequest } from '@/types/integrations';
import { z } from 'zod';

// Validation schema for updates
const updateIntegrationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  iconUrl: z.string().url().optional(),
  settingsSchema: z.record(z.any()).optional(),
  defaultSettings: z.record(z.any()).optional(),
  category: z.enum(['communication', 'payment', 'automation', 'workflow', 'external', 'crm', 'marketing', 'analytics', 'storage', 'other']).optional(),
  isTemporalEnabled: z.boolean().optional(),
  handler: z.string().optional(),
  enabled: z.boolean().optional(),
  version: z.string().optional(),
  author: z.string().optional(),
  supportUrl: z.string().url().optional(),
  documentationUrl: z.string().url().optional(),
  webhookUrl: z.string().url().optional(),
  requiresAuth: z.boolean().optional(),
  authType: z.enum(['oauth', 'api_key', 'basic', 'custom']).optional()
});

// GET /api/v1/admin/integrations/[slug]
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  let session: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return createApiResponse(
        false,
        undefined,
        'Authentication required',
        undefined,
        401
      );
    }

    // Check admin access
    const userId = parseInt(session.user.id);
    const tenantId = 1; // TODO: Get from session context

    const adminInfo = await getAdminRole(userId, tenantId);
    const hasAccess = hasAdminAccess(adminInfo);

    if (!hasAccess.allowed) {
      return createApiResponse(
        false,
        undefined,
        'Insufficient permissions',
        undefined,
        403
      );
    }

    const { slug } = params;

    logger.info('Admin getting integration by slug', { userId, slug });

    const integration = await IntegrationsService.getIntegrationBySlug(slug);

    if (!integration) {
      return createApiResponse(
        false,
        undefined,
        'Integration not found',
        undefined,
        404
      );
    }

    logger.info('Admin integration retrieved successfully', { userId, slug });

    return createApiResponse(
      true,
      integration,
      undefined,
      'Integration retrieved successfully',
      200
    );

  } catch (error) {
    logger.error('Error in admin integration GET by slug', { 
      error: error.message,
      slug: params.slug,
      userId: session?.user?.id 
    });
    return createApiResponse(
      false,
      undefined,
      'Internal server error',
      undefined,
      500
    );
  }
}

// PUT /api/v1/admin/integrations/[slug]
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  let session: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return createApiResponse(
        false,
        undefined,
        'Authentication required',
        undefined,
        401
      );
    }

    // Check admin access
    const userId = parseInt(session.user.id);
    const tenantId = 1; // TODO: Get from session context

    const adminInfo = await getAdminRole(userId, tenantId);
    const hasAccess = hasAdminAccess(adminInfo);

    if (!hasAccess.allowed) {
      return createApiResponse(
        false,
        undefined,
        'Insufficient permissions',
        undefined,
        403
      );
    }

    const { slug } = params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateIntegrationSchema.parse(body);

    logger.info('Admin updating integration', { userId, slug, data: validatedData });

    const integration = await IntegrationsService.updateIntegration(slug, validatedData as UpdateIntegrationRequest);

    if (!integration) {
      return createApiResponse(
        false,
        undefined,
        'Integration not found',
        undefined,
        404
      );
    }

    logger.info('Admin integration updated successfully', { userId, slug });

    return createApiResponse(
      true,
      integration,
      undefined,
      'Integration updated successfully',
      200
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Invalid request data for admin integration update', { 
        error: error.issues,
        slug: params.slug,
        userId: session?.user?.id 
      });
      return createApiResponse(
        false,
        undefined,
        'Invalid request data',
        undefined,
        400
      );
    }

    logger.error('Error in admin integration PUT', { 
      error: error.message,
      slug: params.slug,
      userId: session?.user?.id 
    });
    return createApiResponse(
      false,
      undefined,
      'Internal server error',
      undefined,
      500
    );
  }
}

// DELETE /api/v1/admin/integrations/[slug]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  let session: any = null;

  try {
    session = await auth();

    if (!session?.user?.id) {
      return createApiResponse(
        false,
        undefined,
        'Authentication required',
        undefined,
        401
      );
    }

    // Check admin access
    const userId = parseInt(session.user.id);
    const tenantId = 1; // TODO: Get from session context

    const adminInfo = await getAdminRole(userId, tenantId);
    const hasAccess = hasAdminAccess(adminInfo);

    if (!hasAccess.allowed) {
      return createApiResponse(
        false,
        undefined,
        'Insufficient permissions',
        undefined,
        403
      );
    }

    const { slug } = params;

    logger.info('Admin deleting integration', { userId, slug });

    const integration = await IntegrationsService.deleteIntegration(slug);

    if (!integration) {
      return createApiResponse(
        false,
        undefined,
        'Integration not found',
        undefined,
        404
      );
    }

    logger.info('Admin integration deleted successfully', { userId, slug });

    return createApiResponse(
      true,
      undefined,
      undefined,
      'Integration deleted successfully',
      200
    );

  } catch (error) {
    logger.error('Error in admin integration DELETE', { 
      error: error.message,
      slug: params.slug,
      userId: session?.user?.id 
    });
    return createApiResponse(
      false,
      undefined,
      'Internal server error',
      undefined,
      500
    );
  }
} 