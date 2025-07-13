import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { LlmResolver } from '@/lib/services/llm-resolver';
import { Client } from '@temporalio/client';
import { llmExecutionWorkflow, type LlmExecutionInput } from '@/lib/temporal/workflows/llm-execution';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-middleware';

// ============================
// TEMPORAL CLIENT HELPER
// ============================

async function getTemporalClient(): Promise<Client> {
  return new Client({
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    namespace: process.env.TEMPORAL_NAMESPACE || 'mono-tenant-go-models',
  });
}

// ============================
// LLM EXECUTION API ENDPOINT
// ============================

interface LlmExecuteRequest {
  scope: string;
  variables: Record<string, any>;
  metadata?: Record<string, any>;
  synchronous?: boolean; // If true, wait for result; if false, return workflow ID
}

interface LlmExecuteResponse {
  success: boolean;
  data?: {
    content?: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    model?: string;
    provider?: string;
    responseTimeMs?: number;
    estimatedCost?: number;
    workflowId?: string;
  };
  error?: string;
  workflowId?: string;
}

/**
 * POST /api/v1/llm/execute
 * Execute an LLM prompt using configured scope
 */
async function handleLlmExecute(request: AuthenticatedRequest): Promise<NextResponse<LlmExecuteResponse>> {
  try {
    const tenantId = request.user?.tenantId;
    const userId = parseInt(request.user?.id || '0');

    // Parse and validate request body
    const body: LlmExecuteRequest = await request.json();

    if (!body.scope) {
      logger.warn({ userId, tenantId }, 'LLM execution missing scope');
      return NextResponse.json(
        { success: false, error: 'Scope is required' },
        { status: 400 }
      );
    }

    if (!body.variables || typeof body.variables !== 'object') {
      logger.warn({ userId, tenantId, scope: body.scope }, 'LLM execution invalid variables');
      return NextResponse.json(
        { success: false, error: 'Variables must be a valid object' },
        { status: 400 }
      );
    }

    // Validate that configuration exists for this scope
    try {
      LlmResolver.validatePromptRequest({
        scope: body.scope,
        variables: body.variables,
        tenantId,
        userId
      });
    } catch (error) {
      logger.warn({ 
        error: error.message, 
        scope: body.scope, 
        tenantId, 
        userId 
      }, 'LLM execution validation failed');
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Create workflow input
    const workflowInput: LlmExecutionInput = {
      scope: body.scope,
      variables: body.variables,
      tenantId,
      userId,
      metadata: {
        ...body.metadata,
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      },
      requestId: `llm-${tenantId}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    };

    logger.info({ 
      scope: body.scope,
      tenantId,
      userId,
      workflowId: workflowInput.requestId,
      synchronous: body.synchronous
    }, 'Executing LLM workflow');

    // Get Temporal client
    const client = await getTemporalClient();

    if (body.synchronous !== false) {
      // Synchronous execution - wait for result
      try {
        const handle = await client.workflow.start(llmExecutionWorkflow, {
          workflowId: workflowInput.requestId,
          args: [workflowInput],
          taskQueue: 'llm-queue'
        });

        const result = await handle.result();

        if (result.success) {
          logger.info({ 
            workflowId: workflowInput.requestId,
            scope: body.scope,
            totalTokens: result.usage?.totalTokens,
            responseTimeMs: result.responseTimeMs
          }, 'LLM execution completed successfully');

          return NextResponse.json({
            success: true,
            data: {
              content: result.content,
              usage: result.usage,
              model: result.model,
              provider: result.provider,
              responseTimeMs: result.responseTimeMs,
              estimatedCost: result.estimatedCost,
              workflowId: result.requestId
            }
          });
        } else {
          logger.error({ 
            workflowId: workflowInput.requestId,
            error: result.error 
          }, 'LLM execution workflow failed');

          return NextResponse.json(
            { success: false, error: result.error, workflowId: result.requestId },
            { status: 500 }
          );
        }

      } catch (error) {
        logger.error({ 
          error: error.message,
          workflowId: workflowInput.requestId,
          scope: body.scope
        }, 'LLM workflow execution failed');

        return NextResponse.json(
          { success: false, error: 'Workflow execution failed', workflowId: workflowInput.requestId },
          { status: 500 }
        );
      }

    } else {
      // Asynchronous execution - return workflow ID immediately
      try {
        const handle = await client.workflow.start(llmExecutionWorkflow, {
          workflowId: workflowInput.requestId,
          args: [workflowInput],
          taskQueue: 'llm-queue'
        });

        logger.info({ 
          workflowId: workflowInput.requestId,
          scope: body.scope,
          tenantId,
          userId
        }, 'LLM workflow started asynchronously');

        return NextResponse.json({
          success: true,
          workflowId: workflowInput.requestId,
          data: {
            workflowId: workflowInput.requestId
          }
        });

      } catch (error) {
        logger.error({ 
          error: error.message,
          workflowId: workflowInput.requestId,
          scope: body.scope
        }, 'Failed to start LLM workflow');

        return NextResponse.json(
          { success: false, error: 'Failed to start workflow' },
          { status: 500 }
        );
      }
    }

  } catch (error) {
    logger.error({ error: error.message }, 'LLM execution endpoint error');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/llm/execute
 * Get workflow status and result for asynchronous executions
 */
async function handleGetWorkflowStatus(request: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');

    if (!workflowId) {
      return NextResponse.json(
        { success: false, error: 'workflowId parameter is required' },
        { status: 400 }
      );
    }

    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(workflowId);

    try {
      const result = await handle.result();
      return NextResponse.json({
        success: true,
        status: 'completed',
        workflowId,
        data: result
      });
    } catch (error) {
      // Check if workflow is still running
      try {
        const description = await handle.describe();
        if (description.status.name === 'RUNNING') {
          return NextResponse.json({
            success: true,
            status: 'running',
            workflowId
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'Workflow failed or not found', workflowId },
            { status: 404 }
          );
        }
      } catch (describeError) {
        return NextResponse.json(
          { success: false, error: 'Workflow not found', workflowId },
          { status: 404 }
        );
      }
    }

  } catch (error) {
    logger.error({ error: error.message }, 'Workflow status check failed');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers with auth middleware
export const POST = async (request: NextRequest) => 
  withAuth(request, handleLlmExecute, { requireAuth: true });

export const GET = async (request: NextRequest) => 
  withAuth(request, handleGetWorkflowStatus, { requireAuth: true }); 