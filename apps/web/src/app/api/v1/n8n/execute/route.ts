import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { unifiedN8NService } from '@/lib/services/n8n.service';

/**
 * @openapi
 * /api/v1/n8n/execute:
 *   post:
 *     summary: Execute N8N workflow
 *     description: Execute a workflow with tenant isolation and usage tracking
 *     tags:
 *       - N8N Integration
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workflowId
 *               - inputData
 *             properties:
 *               workflowId:
 *                 type: string
 *                 description: ID of the workflow to execute
 *               nodeId:
 *                 type: string
 *                 description: Specific node ID to execute (optional)
 *               inputData:
 *                 type: object
 *                 description: Input data for the workflow
 *               executionMode:
 *                 type: string
 *                 enum: [sync, async, test]
 *                 default: sync
 *                 description: Execution mode
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for execution context
 *     responses:
 *       200:
 *         description: Workflow executed successfully
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
 *                     success:
 *                       type: boolean
 *                     data:
 *                       type: object
 *                       description: Workflow execution results
 *                     executionTime:
 *                       type: number
 *                       description: Execution time in milliseconds
 *                     tokensUsed:
 *                       type: number
 *                       description: Number of tokens consumed
 *                     estimatedCost:
 *                       type: number
 *                       description: Estimated cost in USD
 *                     error:
 *                       type: object
 *                       properties:
 *                         code:
 *                           type: string
 *                         message:
 *                           type: string
 *                 meta:
 *                   $ref: '#/components/schemas/ResponseMeta'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Workflow not found
 *       500:
 *         description: Internal server error
 */

const ExecutionRequestSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required'),
  nodeId: z.string().optional(),
  inputData: z.record(z.any()),
  executionMode: z.enum(['sync', 'async', 'test']).default('sync'),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = ExecutionRequestSchema.parse(body);

    logger.info('N8N workflow execution started', {
      tenantId,
      userId,
      workflowId: validatedData.workflowId,
      executionMode: validatedData.executionMode,
    });

    // Execute workflow
    const result = await unifiedN8NService.executeWorkflow(
      tenantId,
      userId,
      validatedData
    );

    logger.info('N8N workflow execution completed', {
      tenantId,
      userId,
      workflowId: validatedData.workflowId,
      success: result.success,
      executionTime: result.executionTime,
      tokensUsed: result.tokensUsed,
      estimatedCost: result.estimatedCost,
    });

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    logger.error('N8N workflow execution failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 