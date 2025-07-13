/**
* @swagger
 * /api/v1/admin/llm/api-keys:
 *   get:
 *     summary: Get all LLM API keys
 *     description: Returns paginated list of all LLM API keys (encrypted data redacted)
 *     tags: [Admin - LLM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: integer
 *         description: Filter by tenant (null for global keys)
 *       - in: query
 *         name: providerId
 *         schema:
 *           type: integer
 *         description: Filter by provider
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
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
 *     responses:
 *       200:
 *         description: LLM API keys retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *   post:
 *     summary: Create new LLM API key
 *     description: Creates a new encrypted LLM API key
 *     tags: [Admin - LLM]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: LLM API key created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createApiResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { llmApiKeys, llmProviders, type NewLlmApiKey } from '@/lib/schemas/llm-integrations';
import { encrypt } from '@/lib/utils/encryption';
import { z } from 'zod';
import { and, eq, desc, count } from 'drizzle-orm';

// Validation schemas
const createApiKeySchema = z.object({
  tenantId: z.number().nullable().optional(),
  providerId: z.number(),
  name: z.string().min(1).max(100),
  apiKey: z.string().min(1),
  metadata: z.record(z.any()).default({}),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional()
});

const listQuerySchema = z.object({
  tenantId: z.coerce.number().nullable().optional(),
  providerId: z.coerce.number().optional(),
  active: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

// GET /api/v1/admin/llm/api-keys
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

    // Check admin access
    const userId = parseInt(session.user.id);
    const tenantId = 1; // TODO: Get from session context

    
    // Use enhanced permission system
    // ✅ Mono BEST PRACTICE: Middleware handles all authentication & authorization
    // Permissions already validated - no need for duplicate checks
        // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const validatedQuery = listQuerySchema.parse(queryParams);

    logger.info('Admin getting LLM API keys list', { 
      userId, 
      params: validatedQuery 
    });

    // Build query conditions
    const conditions = [];

    if (validatedQuery.tenantId !== undefined) {
      conditions.push(eq(llmApiKeys.tenantId, validatedQuery.tenantId));
    }

    if (validatedQuery.providerId !== undefined) {
      conditions.push(eq(llmApiKeys.providerId, validatedQuery.providerId));
    }

    if (validatedQuery.active !== undefined) {
      conditions.push(eq(llmApiKeys.isActive, validatedQuery.active));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(llmApiKeys)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    // Get paginated data with provider info (redact sensitive data)
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;

    const apiKeysWithProviders = await db
      .select({
        id: llmApiKeys.id,
        uuid: llmApiKeys.uuid,
        tenantId: llmApiKeys.tenantId,
        providerId: llmApiKeys.providerId,
        name: llmApiKeys.name,
        apiKey: llmApiKeys.apiKey, // Will be redacted below
        metadata: llmApiKeys.metadata,
        isActive: llmApiKeys.isActive,
        expiresAt: llmApiKeys.expiresAt,
        lastUsedAt: llmApiKeys.lastUsedAt,
        createdAt: llmApiKeys.createdAt,
        updatedAt: llmApiKeys.updatedAt,
        createdBy: llmApiKeys.createdBy,
        providerName: llmProviders.name
      })
      .from(llmApiKeys)
      .leftJoin(llmProviders, eq(llmApiKeys.providerId, llmProviders.id))
      .where(whereClause)
      .orderBy(desc(llmApiKeys.createdAt))
      .limit(validatedQuery.limit)
      .offset(offset);

    // Redact API keys for security
    const redactedApiKeys = apiKeysWithProviders.map(key => ({
      ...key,
      apiKey: '***REDACTED***'
    }));

    const pagination = {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      total,
      pages: Math.ceil(total / validatedQuery.limit),
      hasNext: validatedQuery.page < Math.ceil(total / validatedQuery.limit),
      hasPrev: validatedQuery.page > 1
    };

    logger.info('LLM API keys retrieved successfully', { 
      userId, 
      count: redactedApiKeys.length, 
      total,
      page: validatedQuery.page 
    });

    return createApiResponse(
      true,
      { data: redactedApiKeys, pagination },
      'LLM API keys retrieved successfully'
    );

  } catch (error) {
    logger.error('Failed to get LLM API keys', { 
      error: error.message, 
      userId: session?.user?.id 
    });

    if (error instanceof z.ZodError) {
      return createApiResponse(
        false,
        undefined,
        'Invalid query parameters',
        error.errors.map(e => e.message).join(', '),
        400
      );
    }

    return createApiResponse(
      false,
      undefined,
      'Internal server error',
      undefined,
      500
    );
  }
}

// POST /api/v1/admin/llm/api-keys
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

    // Check admin access
    const userId = parseInt(session.user.id);
    const tenantId = 1; // TODO: Get from session context

    
    // Use enhanced permission system
    // ✅ Mono BEST PRACTICE: Middleware handles all authentication & authorization
    // Permissions already validated - no need for duplicate checks
        // Parse request body
    const body = await request.json();
    const validatedData = createApiKeySchema.parse(body);

    logger.info('Admin creating LLM API key', { 
      userId, 
      providerId: validatedData.providerId,
      keyName: validatedData.name
    });

    // Encrypt the API key
    const encryptedApiKey = await encrypt(validatedData.apiKey);

    // Create the API key
    const newApiKey: NewLlmApiKey = {
      tenantId: validatedData.tenantId || null,
      providerId: validatedData.providerId,
      name: validatedData.name,
      apiKey: encryptedApiKey,
      metadata: validatedData.metadata,
      isActive: validatedData.isActive,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      createdBy: userId
    };

    const [createdApiKey] = await db
      .insert(llmApiKeys)
      .values(newApiKey)
      .returning();

    // Redact the API key in response
    const responseData = {
      ...createdApiKey,
      apiKey: '***REDACTED***'
    };

    logger.info('LLM API key created successfully', { 
      userId, 
      apiKeyId: createdApiKey.id,
      keyName: createdApiKey.name
    });

    return createApiResponse(
      true,
      responseData,
      'LLM API key created successfully',
      undefined,
      201
    );

  } catch (error) {
    logger.error('Failed to create LLM API key', { 
      error: error.message, 
      userId: session?.user?.id 
    });

    if (error instanceof z.ZodError) {
      return createApiResponse(
        false,
        undefined,
        'Invalid request data',
        error.errors.map(e => e.message).join(', '),
        400
      );
    }

    return createApiResponse(
      false,
      undefined,
      'Internal server error',
      undefined,
      500
    );
  }
} 