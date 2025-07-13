import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { createApiResponse } from '@/lib/api-utils';
import { createApiLogger } from '@/lib/platform/logging';
import { db } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { EntityAttributesService } from '@/lib/services/entity-attributes.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/platform/api-responses';
import { logger } from '@/lib/logger';
const log = createApiLogger('admin-entity-attributes-api');

// Validation schemas
const GetAttributesSchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  attributeKey: z.string().optional(),
  includeExpired: z.string().transform(val => val === 'true').optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => parseInt(val) || 50).optional(),
});

const CreateAttributeSchema = z.object({
  entityType: z.enum(['account', 'user', 'profile', 'media_asset', 'subscription', 'tenant']),
  entityId: z.number().int().positive(),
  attributeKey: z.string().min(1),
  attributeValue: z.any(),
  isSystem: z.boolean().optional(),
  expiresAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

const UpdateAttributeSchema = z.object({
  attributeValue: z.any(),
  expiresAt: z.string().datetime().optional().nullable().transform(val => val ? new Date(val) : undefined),
});

const DeleteAttributeSchema = z.object({
  id: z.string().uuid(),
  confirmationText: z.string().optional(), // For system attributes
});

const BulkCreateSchema = z.object({
  attributes: z.array(CreateAttributeSchema).min(1).max(100),
});

/**
 * GET /api/v1/admin/entity-attributes
 * List and filter entity attributes with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const params = GetAttributesSchema.parse(Object.fromEntries(searchParams));

    const redis = await getRedisClient();
    const tenantId = (session.user as any).tenant?.id || (session.user as any).tenantId || 4;
    const attributesService = new EntityAttributesService(db, redis, tenantId);

    const filters = {
      entityType: params.entityType as any,
      entityId: params.entityId,
      attributeKey: params.attributeKey,
      includeExpired: params.includeExpired,
    };

    const pagination = {
      page: params.page || 1,
      limit: params.limit || 50,
    };

    const result = await attributesService.getAttributesPaginated(filters, pagination);

    logger.info('Paginated attributes retrieved', {
      userId: session.user.id,
      tenantId,
      filters,
      pagination,
      total: result.total
    });

    return successResponse({
      attributes: result.attributes,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / pagination.limit)
      }
    });

  } catch (error) {
    logger.error('Failed to get paginated attributes', {
      error: error instanceof Error ? error.message : String(error)
    });
    return errorResponse('Failed to retrieve attributes', 500);
  }
}

/**
 * POST /api/v1/admin/entity-attributes
 * Create or update a single entity attribute
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const data = CreateAttributeSchema.parse(body);

    const redis = await getRedisClient();
    const tenantId = (session.user as any).tenant?.id || (session.user as any).tenantId || 4;
    const attributesService = new EntityAttributesService(db, redis, tenantId);

    const attribute = await attributesService.setAttribute(
      data.entityType,
      data.entityId,
      data.attributeKey,
      data.attributeValue,
      {
        isSystem: data.isSystem,
        expiresAt: data.expiresAt,
        userId: parseInt(session.user.id),
      }
    );

    logger.info('Entity attribute created', {
      userId: session.user.id,
      tenantId,
      entityType: data.entityType,
      entityId: data.entityId,
      attributeKey: data.attributeKey
    });

    return successResponse(attribute);

  } catch (error) {
    logger.error('Failed to create entity attribute', {
      error: error instanceof Error ? error.message : String(error)
    });
    return errorResponse('Failed to create attribute', 500);
  }
}

/**
 * PUT /api/v1/admin/entity-attributes/bulk
 * Bulk create/update multiple entity attributes
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createApiResponse(false, undefined, 'Authentication required', undefined, 401);
    }

    const userId = parseInt(session.user.id);

    // Check admin access
    
    // Use enhanced permission system
    // ✅ Mono BEST PRACTICE: Middleware handles all authentication & authorization
    // Permissions already validated - no need for duplicate checks
        const body = await request.json();
    const { attributes } = BulkCreateSchema.parse(body);

    const redis = await getRedisClient();
    const attributesService = new EntityAttributesService(db, redis, 1);

    const results = await attributesService.setBulkAttributes(
      attributes.map(attr => ({
        entityType: attr.entityType,
        entityId: attr.entityId,
        attributeKey: attr.attributeKey,
        attributeValue: attr.attributeValue,
        expiresAt: attr.expiresAt,
        userId: userId,
      })),
      userId
    );

    log.info('Bulk entity attributes created/updated', {
      userId: session.user.id,
      count: attributes.length
    });

    return createApiResponse(true, { 
      data: results, 
      count: results.length 
    }, undefined, 'Bulk entity attributes created successfully', 201);

  } catch (error) {
    log.error('Failed to bulk create entity attributes', {
      error: error instanceof Error ? error.message : String(error)
    });

    if (error instanceof z.ZodError) {
      return createApiResponse(false, undefined, 'Invalid data', JSON.stringify(error.errors), 400);
    }

    return createApiResponse(false, undefined, 'Internal server error', undefined, 500);
  }
}

/**
 * DELETE /api/v1/admin/entity-attributes
 * Remove a specific entity attribute
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return createApiResponse(false, undefined, 'Authentication required', undefined, 401);
    }

    const userId = parseInt(session.user.id);

    // Check admin access
    
    // Use enhanced permission system
    // ✅ Mono BEST PRACTICE: Middleware handles all authentication & authorization
    // Permissions already validated - no need for duplicate checks
        const body = await request.json();
    const { entityType, entityId, attributeKey } = body;

    if (!entityType || !entityId || !attributeKey) {
      return createApiResponse(false, undefined, 'Missing required fields: entityType, entityId, attributeKey', undefined, 400);
    }

    const redis = await getRedisClient();
    const attributesService = new EntityAttributesService(db, redis, 1);

    await attributesService.removeAttribute(entityType, entityId, attributeKey);

    log.info('Entity attribute deleted', {
      userId: session.user.id,
      entityType,
      entityId,
      attributeKey
    });

    return createApiResponse(true, { success: true }, undefined, 'Entity attribute deleted successfully', 200);

  } catch (error) {
    log.error('Failed to delete entity attribute', {
      error: error instanceof Error ? error.message : String(error)
    });

    return createApiResponse(false, undefined, 'Internal server error', undefined, 500);
  }
} 