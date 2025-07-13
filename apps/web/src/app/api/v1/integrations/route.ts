/**
 * @swagger
 * /api/v1/integrations:
 *   get:
 *     summary: Get tenant integrations
 *     description: Returns paginated list of tenant's enabled integrations with filtering options
 *     tags: [Integrations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, disabled]
 *         description: Filter by integration status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [communication, payment, automation, crm, marketing, analytics, storage, other]
 *         description: Filter by integration category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in integration name or slug
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, status, lastSyncedAt, createdAt]
 *           default: name
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Tenant integrations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TenantIntegration'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Enable integration for tenant
 *     description: Enables an available integration for the tenant
 *     tags: [Integrations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTenantIntegrationRequest'
 *     responses:
 *       201:
 *         description: Integration enabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TenantIntegration'
 *       400:
 *         description: Invalid request data or integration already enabled
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Integration not found or not available
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createApiResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { IntegrationsService } from '@/lib/services/integrations.service';
import type { 
  TenantIntegrationsListQuery, 
  CreateTenantIntegrationRequest
} from '@/types/integrations';
import { z } from 'zod';

// Validation schemas
const createTenantIntegrationSchema = z.object({
  integrationSlug: z.string().min(1),
  settings: z.record(z.any()).optional(),
  fieldMappings: z.record(z.any()).optional(),
  isTestMode: z.boolean().optional().default(false)
});

const listQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'disabled']).optional(),
  category: z.enum(['communication', 'payment', 'automation', 'workflow', 'external', 'crm', 'marketing', 'analytics', 'storage', 'other']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  sortBy: z.enum(['name', 'status', 'lastSyncedAt', 'createdAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
});

// GET /api/v1/integrations
export async function GET(request: NextRequest) {
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

    const userId = parseInt(session.user.id);
    const tenantId = 1; // TODO: Get from session context

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const validatedQuery = listQuerySchema.parse(queryParams);

    logger.info('Getting tenant integrations', { 
      userId, 
      tenantId,
      params: validatedQuery 
    });

    const result = await IntegrationsService.getTenantIntegrations(tenantId, validatedQuery);

    logger.info('Tenant integrations retrieved successfully', { 
      userId,
      tenantId,
      count: result.data.length,
      total: result.pagination.total
    });

    return createApiResponse(
      true,
      result,
      undefined,
      'Tenant integrations retrieved successfully',
      200
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Invalid query parameters for tenant integrations', { 
        error: error.issues,
        userId: session?.user?.id 
      });
      return createApiResponse(
        false,
        undefined,
        'Invalid query parameters',
        undefined,
        400
      );
    }

    logger.error('Error in tenant integrations GET', { 
      error: error.message,
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

// POST /api/v1/integrations
export async function POST(request: NextRequest) {
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

    const userId = parseInt(session.user.id);
    const tenantId = 1; // TODO: Get from session context

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createTenantIntegrationSchema.parse(body);

    logger.info('Enabling tenant integration', { 
      userId, 
      tenantId,
      integrationSlug: validatedData.integrationSlug 
    });

    const tenantIntegration = await IntegrationsService.enableTenantIntegration(
      tenantId, 
      validatedData as CreateTenantIntegrationRequest, 
      userId
    );

    logger.info('Tenant integration enabled successfully', { 
      userId,
      tenantId,
      integrationSlug: validatedData.integrationSlug,
      id: tenantIntegration.id
    });

    return createApiResponse(
      true,
      tenantIntegration,
      undefined,
      'Integration enabled successfully',
      201
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Invalid request data for tenant integration creation', { 
        error: error.issues,
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

    if (error.message.includes('already enabled')) {
      return createApiResponse(
        false,
        undefined,
        'Integration already enabled for this tenant',
        undefined,
        400
      );
    }

    if (error.message.includes('not available')) {
      return createApiResponse(
        false,
        undefined,
        'Integration not found or not available',
        undefined,
        404
      );
    }

    logger.error('Error in tenant integration POST', { 
      error: error.message,
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