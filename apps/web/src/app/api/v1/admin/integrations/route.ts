/**
* @swagger
 * /api/v1/admin/integrations:
 *   get:
 *     summary: Get all system integrations
 *     description: Returns paginated list of all system integrations with filtering options
 *     tags: [Admin - Integrations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [communication, payment, automation, crm, marketing, analytics, storage, other]
 *         description: Filter by integration category
 *       - in: query
 *         name: enabled
 *         schema:
 *           type: boolean
 *         description: Filter by enabled status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, slug, or description
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
 *           enum: [name, category, createdAt, updatedAt]
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
 *         description: Integrations retrieved successfully
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
 *                         $ref: '#/components/schemas/Integration'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *   post:
 *     summary: Create new integration
 *     description: Creates a new system integration
 *     tags: [Admin - Integrations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateIntegrationRequest'
 *     responses:
 *       201:
 *         description: Integration created successfully
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: Integration with slug already exists
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { IntegrationsService } from '@/lib/services/integrations.service';
import { z } from 'zod';
import { getTranslations } from 'next-intl/server';
import { getRedisClient } from '@/lib/redis';
import { revalidateTag, revalidatePath } from 'next/cache';
import { withMiddleware } from '@/lib/api-middleware';
import { extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { auth } from '@/lib/auth';

// Validation schemas
const createIntegrationSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-_]+$/, 'Slug must contain only lowercase letters, numbers, hyphens, and underscores'),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  iconUrl: z.string().url().optional(),
  settingsSchema: z.record(z.any()),
  defaultSettings: z.record(z.any()).optional(),
  category: z.enum(['communication', 'payment', 'automation', 'workflow', 'external', 'crm', 'marketing', 'analytics', 'storage', 'other']),
  isTemporalEnabled: z.boolean().optional().default(true),
  handler: z.string().optional(),
  enabled: z.boolean().optional().default(true),
  version: z.string().optional().default('1.0.0'),
  author: z.string().optional(),
  supportUrl: z.string().url().optional(),
  documentationUrl: z.string().url().optional(),
  webhookUrl: z.string().url().optional(),
  requiresAuth: z.boolean().optional().default(true),
  authType: z.enum(['oauth', 'api_key', 'basic', 'custom']).optional()
});

const listQuerySchema = z.object({
  category: z.enum(['communication', 'payment', 'automation', 'workflow', 'external', 'crm', 'marketing', 'analytics', 'storage', 'other']).optional(),
  enabled: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  sortBy: z.enum(['name', 'category', 'createdAt', 'updatedAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
});

// GET /api/v1/admin/integrations
async function _GET(request: NextRequest) {
  const t = await getTranslations('admin-common');

  try {
    const session = await auth();
    const userContext = extractUserContext(session);

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const validatedQuery = listQuerySchema.parse(queryParams);

    logger.info('Admin getting integrations list', { 
      userId: userContext.userId, 
      params: validatedQuery 
    });

    const result = await IntegrationsService.getIntegrations(validatedQuery);

    logger.info('Admin integrations list retrieved successfully', { 
      userId: userContext.userId,
      count: result.data.length,
      total: result.pagination.total
    });

    return createApiResponse(
      true,
      result,
      undefined,
      t('integrations.listSuccess'),
      200
    );

  } catch (error) {
    logger.error({ err: error, userId: (await auth())?.user?.id, path: request.nextUrl.pathname }, 'Error in admin integrations GET');
    if (error instanceof z.ZodError) {
      return createApiResponse(
        false,
        { details: error.issues },
        t('errors.invalidQueryParameters'),
        undefined,
        400
      );
    }

    return createApiResponse(
      false,
      undefined,
      t('errors.internalServerError'),
      undefined,
      500
    );
  }
}

// POST /api/v1/admin/integrations
async function _POST(request: NextRequest) {
  const t = await getTranslations('admin-common');

  try {
    const session = await auth();
    const userContext = extractUserContext(session);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createIntegrationSchema.parse(body);

    logger.info('Admin creating new integration', { 
      userId: userContext.userId, 
      slug: validatedData.slug,
      name: validatedData.name 
    });

    // Check if integration with slug already exists
    const existingIntegration = await IntegrationsService.getIntegrationBySlug(validatedData.slug);
    if (existingIntegration) {
      return createApiResponse(
        false,
        undefined,
        t('integrations.errors.slugExists'),
        undefined,
        409
      );
    }

    const integration = await IntegrationsService.createIntegration(validatedData as any);

    // 🔴 CRITICAL: Multi-level cache invalidation (cursor rules compliance)
    try {
      const redis = await getRedisClient();

      // Invalidate Redis cache patterns for integrations
      const cachePatterns = [
        'cache:global:integrations:list:*',
        'cache:global:integrations:statistics',
        'cache:global:integrations:categories:*'
      ];

      for (const pattern of cachePatterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          logger.info('Cleared Redis cache keys after integration creation', { 
            pattern, 
            keysCount: keys.length,
            integrationSlug: integration.slug 
          });
        }
      }

      // Invalidate Next.js cache tags
      revalidateTag('integrations');
      revalidateTag('integrations-list');
      revalidateTag('integrations-statistics');
      revalidatePath('/admin/integrations');

      logger.info('Cache invalidation completed after integration creation', { 
        integrationSlug: integration.slug,
        userId: userContext.userId
      });

    } catch (cacheError) {
      // Cache failures should not break the API response - graceful degradation
      logger.warn('Cache invalidation failed after integration creation', { 
        error: cacheError instanceof Error ? cacheError.message : 'Unknown cache error',
        integrationSlug: integration.slug,
        userId: userContext.userId
      });
    }

    logger.info('Admin integration created successfully', { 
      userId: userContext.userId,
      slug: integration.slug,
      name: integration.name
    });

    // Return response with cache invalidation headers for TanStack Query
    const response = createApiResponse(
      true,
      integration,
      undefined,
      t('integrations.createSuccess'),
      201
    );

    // Add cache invalidation headers for client-side cache invalidation
    response.headers.set('X-Cache-Invalidate', 'integrations');
    response.headers.set('X-Cache-Tags', 'integrations,integrations-list,integrations-statistics');

    return response;

  } catch (error) {
    logger.error({ err: error, userId: (await auth())?.user?.id, path: request.nextUrl.pathname }, 'Error in admin integrations POST');
    if (error instanceof z.ZodError) {
      return createApiResponse(
        false, 
        { details: error.issues }, 
        t('errors.invalidRequestData'),
        undefined, 
        400
      );
    }

    if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
      return createApiResponse(
        false, 
        undefined, 
        t('integrations.errors.slugExists'),
        undefined, 
        409
      );
    }

    return createApiResponse(
      false, 
      undefined, 
      t('errors.internalServerError'),
      undefined, 
      500
    );
  }
}

export const { GET, POST } = withMiddleware({
  GET: _GET,
  POST: _POST,
}, {
  requireAuth: true,
  permissions: {
    GET: { action: 'integrations.read.global', resource: 'admin' },
    POST: { action: 'integrations.create.global', resource: 'admin' },
  },
  audit: {
    logRequests: true,
    logResponses: true,
  },
}); 