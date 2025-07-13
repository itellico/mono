import { NextRequest, NextResponse } from 'next/server';
import { Client, Connection } from '@temporalio/client';
import { ReactFlowTemporalBridge, type ReactFlowWorkflowDefinition, type TemporalWorkflowContext } from '@/lib/temporal/reactflow-bridge';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowDefinition, context }: {
      workflowDefinition: ReactFlowWorkflowDefinition;
      context: TemporalWorkflowContext;
    } = body;

    // Validate input
    if (!workflowDefinition || !context) {
      return NextResponse.json(
        { success: false, error: 'Missing workflowDefinition or context' },
        { status: 400 }
      );
    }

    // Create Temporal connection and client
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    });

    const client = new Client({
      connection,
      namespace: context.namespace,
    });

    // Create bridge and execute workflow
    const bridge = new ReactFlowTemporalBridge(client);
    const workflowId = await bridge.executeReactFlowWorkflow(workflowDefinition, context);

    logger.info('Workflow executed successfully', {
      workflowId,
      workflowName: workflowDefinition.name,
      tenantId: context.tenantId
    });

    return NextResponse.json({
      success: true,
      workflowId,
      message: 'Workflow execution started successfully'
    });

  } catch (error) {
    logger.error('Failed to execute workflow', { error });

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 