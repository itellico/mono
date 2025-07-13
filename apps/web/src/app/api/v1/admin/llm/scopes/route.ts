/**
* @swagger
 * /api/v1/admin/llm/scopes:
 *   get:
 *     summary: Get all LLM scopes
 *     description: Returns paginated list of all LLM scopes with filtering options
 *     tags: [Admin - LLM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in key or label
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
 *         description: LLM scopes retrieved successfully
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
import { llmScopes } from '@/lib/schemas/llm-integrations';
import { z } from 'zod';
import { and, eq, ilike, or, desc, count, sql } from 'drizzle-orm';

// Validation schemas
const listQuerySchema = z.object({
  category: z.string().optional(),
  active: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

// GET /api/v1/admin/llm/scopes
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

    logger.info('Admin getting LLM scopes list', { 
      userId, 
      params: validatedQuery 
    });

    // Build query conditions
    const conditions = [];

    if (validatedQuery.category) {
      conditions.push(eq(llmScopes.category, validatedQuery.category));
    }

    if (validatedQuery.active !== undefined) {
      conditions.push(eq(llmScopes.isActive, validatedQuery.active));
    }

    if (validatedQuery.search) {
      conditions.push(
        or(
          ilike(llmScopes.key, `%${validatedQuery.search}%`),
          sql`${llmScopes.label}->>'en' ILIKE ${'%' + validatedQuery.search + '%'}`
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(llmScopes)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    // Get paginated data
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;

    const scopes = await db
      .select()
      .from(llmScopes)
      .where(whereClause)
      .orderBy(desc(llmScopes.createdAt))
      .limit(validatedQuery.limit)
      .offset(offset);

    const pagination = {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      total,
      pages: Math.ceil(total / validatedQuery.limit),
      hasNext: validatedQuery.page < Math.ceil(total / validatedQuery.limit),
      hasPrev: validatedQuery.page > 1
    };

    logger.info('LLM scopes retrieved successfully', { 
      userId, 
      count: scopes.length, 
      total,
      page: validatedQuery.page 
    });

    return createApiResponse(
      true,
      { data: scopes, pagination },
      'LLM scopes retrieved successfully'
    );

  } catch (error) {
    logger.error('Failed to get LLM scopes', { 
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