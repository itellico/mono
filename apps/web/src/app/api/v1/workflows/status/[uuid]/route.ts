import { NextRequest, NextResponse } from 'next/server';
import { Client, Connection } from '@temporalio/client';
import { ReactFlowTemporalBridge } from '@/lib/temporal/reactflow-bridge';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const { workflowId } = await params;
    const { searchParams } = new URL(request.url);
    const namespace = searchParams.get('namespace') || 'mono-tenant-go-models';

    if (!workflowId) {
      return NextResponse.json(
        { success: false, error: 'Missing workflowId' },
        { status: 400 }
      );
    }

    // Create Temporal connection and client
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    });

    const client = new Client({
      connection,
      namespace,
    });

    // Get workflow status
    const bridge = new ReactFlowTemporalBridge(client);
    const status = await bridge.getWorkflowStatus(workflowId);

    logger.info('Workflow status retrieved', {
      workflowId,
      status: status.status,
      namespace
    });

    return NextResponse.json({
      success: true,
      ...status
    });

  } catch (error) {
    logger.error('Failed to get workflow status', { error });

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 