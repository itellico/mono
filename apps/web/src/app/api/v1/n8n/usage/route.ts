import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { unifiedN8NService } from '@/lib/services/n8n.service';

/**
 * @openapi
 * /api/v1/n8n/usage:
 *   get:
 *     summary: Get N8N usage analytics
 *     description: Retrieve tenant usage analytics with optional date filtering
 *     tags:
 *       - N8N Integration
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Usage analytics retrieved successfully
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
 *                     totalExecutions:
 *                       type: number
 *                       description: Total number of workflow executions
 *                     totalCost:
 *                       type: number
 *                       description: Total cost in USD
 *                     totalTokens:
 *                       type: number
 *                       description: Total tokens consumed
 *                     successRate:
 *                       type: number
 *                       description: Success rate percentage
 *                     byProvider:
 *                       type: object
 *                       description: Usage breakdown by LLM provider
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           executions:
 *                             type: number
 *                           cost:
 *                             type: number
 *                           tokens:
 *                             type: number
 *                     byWorkflow:
 *                       type: object
 *                       description: Usage breakdown by workflow
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           executions:
 *                             type: number
 *                           cost:
 *                             type: number
 *                           tokens:
 *                             type: number
 *                 meta:
 *                   $ref: '#/components/schemas/ResponseMeta'
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

const UsageQuerySchema = z.object({
  startDate: z.string().optional().refine((date) => {
    if (!date) return true;
    return !isNaN(Date.parse(date));
  }, 'Invalid start date format'),
  endDate: z.string().optional().refine((date) => {
    if (!date) return true;
    return !isNaN(Date.parse(date));
  }, 'Invalid end date format'),
});

export async function GET(request: NextRequest) {
  try {
    // Get session and validate authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant and user info
    const tenantId = (session.user as any).tenantId || 1;
    const userId = parseInt(session.user.id as string);

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryData = {
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    };
    
    const validatedQuery = UsageQuerySchema.parse(queryData);

    // Convert strings to Date objects if provided
    const startDate = validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined;
    const endDate = validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined;

    logger.info('N8N usage analytics requested', {
      tenantId,
      userId,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });

    // Get usage analytics
    const analytics = await unifiedN8NService.getTenantUsage(
      tenantId,
      startDate,
      endDate
    );

    logger.info('N8N usage analytics retrieved', {
      tenantId,
      userId,
      totalExecutions: analytics.totalExecutions,
      totalCost: analytics.totalCost,
      successRate: analytics.successRate,
    });

    return NextResponse.json({
      success: true,
      data: analytics,
      meta: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        dateRange: {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    logger.error('N8N usage analytics failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 