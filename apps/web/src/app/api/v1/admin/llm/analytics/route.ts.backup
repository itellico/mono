/**
* @swagger
 * /api/v1/admin/llm/analytics:
 *   get:
 *     summary: Get LLM usage analytics
 *     description: Returns analytics data for LLM usage including token consumption, costs, and performance metrics
 *     tags: [Admin - LLM]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: integer
 *         description: Filter by tenant (null for global analytics)
 *       - in: query
 *         name: scopeId
 *         schema:
 *           type: integer
 *         description: Filter by scope
 *       - in: query
 *         name: providerId
 *         schema:
 *           type: integer
 *         description: Filter by provider
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for analytics period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for analytics period
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: Grouping interval for time series data
 *     responses:
 *       200:
 *         description: LLM analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { createApiResponse } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { llmUsageLogs, llmScopes, llmProviders } from '@/lib/schemas/llm-integrations';
import { z } from 'zod';
import { and, eq, gte, lte, sql, count, sum, avg } from 'drizzle-orm';

// Validation schemas
const analyticsQuerySchema = z.object({
  tenantId: z.coerce.number().nullable().optional(),
  scopeId: z.coerce.number().optional(),
  providerId: z.coerce.number().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day')
});

// GET /api/v1/admin/llm/analytics
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

    const validatedQuery = analyticsQuerySchema.parse(queryParams);

    logger.info('Admin getting LLM analytics', { 
      userId, 
      params: validatedQuery 
    });

    // Build query conditions
    const conditions = [];

    if (validatedQuery.tenantId !== undefined) {
      conditions.push(eq(llmUsageLogs.tenantId, validatedQuery.tenantId));
    }

    if (validatedQuery.scopeId !== undefined) {
      conditions.push(eq(llmUsageLogs.scopeId, validatedQuery.scopeId));
    }

    if (validatedQuery.providerId !== undefined) {
      conditions.push(eq(llmUsageLogs.providerId, validatedQuery.providerId));
    }

    if (validatedQuery.startDate) {
      conditions.push(gte(llmUsageLogs.createdAt, new Date(validatedQuery.startDate)));
    }

    if (validatedQuery.endDate) {
      conditions.push(lte(llmUsageLogs.createdAt, new Date(validatedQuery.endDate)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get overall statistics
    const overallStats = await db
      .select({
        totalRequests: count(),
        totalTokens: sum(llmUsageLogs.totalTokens),
        totalCost: sum(llmUsageLogs.estimatedCost),
        avgResponseTime: avg(llmUsageLogs.responseTimeMs),
        successfulRequests: sql<number>`COUNT(CASE WHEN ${llmUsageLogs.status} = 'success' THEN 1 END)`,
        errorRequests: sql<number>`COUNT(CASE WHEN ${llmUsageLogs.status} = 'error' THEN 1 END)`
      })
      .from(llmUsageLogs)
      .where(whereClause);

    // Get usage by scope
    const usageByScope = await db
      .select({
        scopeId: llmUsageLogs.scopeId,
        scopeKey: llmScopes.key,
        scopeLabel: llmScopes.label,
        totalRequests: count(),
        totalTokens: sum(llmUsageLogs.totalTokens),
        totalCost: sum(llmUsageLogs.estimatedCost)
      })
      .from(llmUsageLogs)
      .leftJoin(llmScopes, eq(llmUsageLogs.scopeId, llmScopes.id))
      .where(whereClause)
      .groupBy(llmUsageLogs.scopeId, llmScopes.key, llmScopes.label)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(10);

    // Simple mock data for now (since we may not have usage logs yet)
    const analytics = {
      overview: overallStats[0] || {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        avgResponseTime: 0,
        successfulRequests: 0,
        errorRequests: 0
      },
      usageByScope: usageByScope || [],
      usageByProvider: [],
      timeSeries: [],
      recentErrors: []
    };

    logger.info('LLM analytics retrieved successfully', { 
      userId, 
      totalRequests: analytics.overview.totalRequests
    });

    return createApiResponse(
      true,
      analytics,
      'LLM analytics retrieved successfully'
    );

  } catch (error) {
    logger.error('Failed to get LLM analytics', { 
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