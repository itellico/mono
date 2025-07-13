/**
* @swagger
 * /api/v1/admin/llm/providers:
 *   get:
 *     summary: Get all LLM providers
 *     description: Returns paginated list of all LLM providers with filtering options
 *     tags: [Admin - LLM Providers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name or description
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
 *         description: LLM providers retrieved successfully
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
 *                         $ref: '#/components/schemas/LlmProvider'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *   post:
 *     summary: Create new LLM provider
 *     description: Creates a new LLM provider
 *     tags: [Admin - LLM Providers]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLlmProviderRequest'
 *     responses:
 *       201:
 *         description: LLM provider created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/LlmProvider'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: Provider with name already exists
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createApiResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { db } from '@/lib/db';
import { llmProviders } from '@/lib/schemas/llm-integrations';
import { eq, ilike, and, desc, sql } from 'drizzle-orm';

// Validation schemas
const createProviderSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  apiBaseUrl: z.string().url().optional(),
  supportedModels: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  isActive: z.boolean().default(true),
});

const listQuerySchema = z.object({
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

// GET /api/v1/admin/llm/providers
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

    logger.info('Admin getting LLM providers list', { 
      userId, 
      params: validatedQuery 
    });

    // Build the where clause
    const whereConditions = [];

    if (validatedQuery.isActive !== undefined) {
      whereConditions.push(eq(llmProviders.isActive, validatedQuery.isActive));
    }

    if (validatedQuery.search) {
      whereConditions.push(
        sql`(${llmProviders.name} ILIKE ${`%${validatedQuery.search}%`} OR ${llmProviders.description} ILIKE ${`%${validatedQuery.search}%`})`
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(llmProviders)
      .where(whereClause);

    // Get paginated results
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;

    const providers = await db
      .select()
      .from(llmProviders)
      .where(whereClause)
      .orderBy(desc(llmProviders.createdAt))
      .limit(validatedQuery.limit)
      .offset(offset);

    const totalPages = Math.ceil(count / validatedQuery.limit);

    const result = {
      data: providers,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: count,
        totalPages,
        hasNext: validatedQuery.page < totalPages,
        hasPrev: validatedQuery.page > 1,
      },
    };

    logger.info('LLM providers retrieved successfully', { 
      userId,
      count: providers.length,
      total: count
    });

    return createApiResponse(
      true,
      result,
      undefined,
      'LLM providers retrieved successfully',
      200
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Invalid query parameters for LLM providers', { 
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

    logger.error('Error in LLM providers GET', { 
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

// POST /api/v1/admin/llm/providers
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
        // Parse and validate request body
    const body = await request.json();
    const validatedData = createProviderSchema.parse(body);

    logger.info('Admin creating new LLM provider', { 
      userId, 
      name: validatedData.name 
    });

    // Check if provider with name already exists
    const [existingProvider] = await db
      .select()
      .from(llmProviders)
      .where(eq(llmProviders.name, validatedData.name))
      .limit(1);

    if (existingProvider) {
      return createApiResponse(
        false,
        undefined,
        'Provider with this name already exists',
        undefined,
        409
      );
    }

    // Create the provider
    const [provider] = await db
      .insert(llmProviders)
      .values({
        name: validatedData.name,
        description: validatedData.description,
        apiBaseUrl: validatedData.apiBaseUrl,
        supportedModels: validatedData.supportedModels,
        metadata: validatedData.metadata,
        isActive: validatedData.isActive,
      })
      .returning();

    logger.info('LLM provider created successfully', { 
      userId,
      providerId: provider.id,
      name: provider.name
    });

    return createApiResponse(
      true,
      provider,
      undefined,
      'LLM provider created successfully',
      201
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Invalid request data for LLM provider creation', { 
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

    logger.error('Error in LLM provider POST', { 
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