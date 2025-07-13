import { log } from '@temporalio/workflow';
import * as workflow from '@temporalio/workflow';
import type { WorkflowDefinition, ReactFlowNode, ReactFlowEdge } from '../types/workflow';

// Define workflow input interface
export interface MarketplaceWorkflowInput {
  tenantId: number;
  executionId: string;
  workflowDefinition: WorkflowDefinition;
  input: Record<string, any>;
  context: {
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, any>;
  };
  settings: {
    isActive: boolean;
    triggerType: string;
    triggers?: Array<{ type: string; config: Record<string, any> }>;
    timeout?: number;
    retryPolicy?: {
      maximumAttempts: number;
      backoffCoefficient: number;
      maximumInterval: string;
    };
  };
}

interface ReactFlowDefinition {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}

interface WorkflowDefinition {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}

// Activity function definitions (to be imported from activities)
export const executeNodeActivity = workflow.proxyActivities<{
  executeStartNode(input: any): Promise<any>;
  executeTaskNode(input: any): Promise<any>;
  executeDecisionNode(input: any): Promise<{ nextNodeId: string; output: any }>;
  executeApiCallNode(input: any): Promise<any>;
  executeEmailNode(input: any): Promise<any>;
  executeNotificationNode(input: any): Promise<any>;
  executeWaitNode(input: any): Promise<any>;
  executeEndNode(input: any): Promise<any>;
}>({
  startToCloseTimeout: '10 minutes',
  heartbeatTimeout: '30s',
  retryPolicy: {
    initialInterval: '1s',
    backoffCoefficient: 2.0,
    maximumInterval: '100s',
    maximumAttempts: 3,
  },
});

/**
 * Main marketplace workflow that executes React Flow definitions
 */
export async function marketplaceWorkflow(input: MarketplaceWorkflowInput): Promise<any> {
  log.info('Starting marketplace workflow', {
    tenantId: input.tenantId,
    executionId: input.executionId,
    workflowType: input.context.entityType,
  });

  const { workflowDefinition, input: workflowInput, context } = input;
  const { nodes, edges } = workflowDefinition;

  // Find the start node
  const startNode = nodes.find(node => node.type === 'start');
  if (!startNode) {
    throw new Error('Workflow must have a start node');
  }

  // Initialize workflow state
  let currentNodeId = startNode.id;
  let workflowOutput: any = {};
  let nodeOutputs: Record<string, any> = {};

  // Track visited nodes to prevent infinite loops
  const visitedNodes = new Set<string>();
  const maxIterations = 100; // Safety limit
  let iterations = 0;

  try {
    while (currentNodeId && iterations < maxIterations) {
      iterations++;

      if (visitedNodes.has(currentNodeId)) {
        log.warn('Detected potential loop, node already visited', { nodeId: currentNodeId });
        // Allow revisiting decision nodes but not others
        const currentNode = nodes.find(n => n.id === currentNodeId);
        if (currentNode?.type !== 'decision') {
          break;
        }
      }

      visitedNodes.add(currentNodeId);
      const currentNode = nodes.find(node => node.id === currentNodeId);

      if (!currentNode) {
        throw new Error(`Node not found: ${currentNodeId}`);
      }

      log.info('Executing node', {
        nodeId: currentNodeId,
        nodeType: currentNode.type,
        iteration: iterations,
      });

      // Prepare node input with workflow context
      const nodeInput = {
        tenantId: input.tenantId,
        executionId: input.executionId,
        nodeId: currentNodeId,
        nodeData: currentNode.data,
        workflowInput,
        context,
        previousOutputs: nodeOutputs,
      };

      let nodeResult: any;

      // Execute node based on type
      switch (currentNode.type) {
        case 'start':
          nodeResult = await executeNodeActivity.executeStartNode(nodeInput);
          break;

        case 'task':
          nodeResult = await executeNodeActivity.executeTaskNode(nodeInput);
          break;

        case 'decision':
          nodeResult = await executeNodeActivity.executeDecisionNode(nodeInput);
          if (nodeResult.nextNodeId) {
            currentNodeId = nodeResult.nextNodeId;
            nodeOutputs[currentNode.id] = nodeResult.output;
            continue; // Skip normal edge following for decision nodes
          }
          break;

        case 'api-call':
          nodeResult = await executeNodeActivity.executeApiCallNode(nodeInput);
          break;

        case 'email':
          nodeResult = await executeNodeActivity.executeEmailNode(nodeInput);
          break;

        case 'notification':
          nodeResult = await executeNodeActivity.executeNotificationNode(nodeInput);
          break;

        case 'wait':
          nodeResult = await executeNodeActivity.executeWaitNode(nodeInput);
          break;

        case 'end':
          nodeResult = await executeNodeActivity.executeEndNode(nodeInput);
          workflowOutput = { ...workflowOutput, ...nodeResult };
          currentNodeId = ''; // End workflow
          break;

        default:
          log.warn('Unknown node type, skipping', { nodeType: currentNode.type });
          nodeResult = { skipped: true };
      }

      // Store node output
      nodeOutputs[currentNode.id] = nodeResult;

      // Find next node if not already set (decision nodes set their own next node)
      if (currentNodeId && currentNode.type !== 'end') {
        const nextEdge = edges.find(edge => edge.source === currentNodeId);
        if (nextEdge) {
          currentNodeId = nextEdge.target;
        } else {
          log.warn('No outgoing edge found for node', { nodeId: currentNodeId });
          break;
        }
      }
    }

    if (iterations >= maxIterations) {
      throw new Error('Workflow exceeded maximum iterations limit');
    }

    log.info('Workflow completed successfully', {
      tenantId: input.tenantId,
      executionId: input.executionId,
      iterations,
      outputKeys: Object.keys(nodeOutputs),
    });

    return {
      success: true,
      output: workflowOutput,
      nodeOutputs,
      iterations,
      executionId: input.executionId,
    };

  } catch (error: any) {
    log.error('Workflow execution failed', {
      error: error.message,
      tenantId: input.tenantId,
      executionId: input.executionId,
      currentNodeId,
      iterations,
    });

    throw new workflow.ApplicationFailure(
      `Workflow execution failed: ${error.message}`,
      'WorkflowExecutionError',
      false,
      { currentNodeId, iterations, nodeOutputs }
    );
  }
}

/**
 * Job Application Review Workflow
 */
export async function jobApplicationReviewWorkflow(input: {
  tenantId: number;
  jobId: number;
  applicationId: number;
  executionId: string;
}): Promise<any> {
  log.info('Starting job application review workflow', input);

  // This could be a simple predefined workflow or use a React Flow definition
  try {
    // Step 1: Initial screening
    const screeningResult = await executeNodeActivity.executeTaskNode({
      tenantId: input.tenantId,
      executionId: input.executionId,
      nodeId: 'screening',
      nodeData: {
        task: 'initial_screening',
        jobId: input.jobId,
        applicationId: input.applicationId,
      },
      workflowInput: input,
      context: { entityType: 'job_application', entityId: input.applicationId.toString() },
      previousOutputs: {},
    });

    // Step 2: Notify hiring manager
    await executeNodeActivity.executeNotificationNode({
      tenantId: input.tenantId,
      executionId: input.executionId,
      nodeId: 'notify-manager',
      nodeData: {
        type: 'job_application_received',
        jobId: input.jobId,
        applicationId: input.applicationId,
      },
      workflowInput: input,
      context: { entityType: 'job_application', entityId: input.applicationId.toString() },
      previousOutputs: { screening: screeningResult },
    });

    return {
      success: true,
      output: { applicationProcessed: true, screeningResult },
      executionId: input.executionId,
    };

  } catch (error: any) {
    log.error('Job application review workflow failed', { error: error.message, ...input });
    throw new workflow.ApplicationFailure(
      `Job application review failed: ${error.message}`,
      'JobApplicationReviewError',
      false,
      input
    );
  }
}

/**
 * Gig Delivery Process Workflow
 */
export async function gigDeliveryWorkflow(input: {
  tenantId: number;
  gigId: number;
  bookingId: number;
  executionId: string;
}): Promise<any> {
  log.info('Starting gig delivery workflow', input);

  try {
    // Step 1: Confirm booking
    const confirmationResult = await executeNodeActivity.executeTaskNode({
      tenantId: input.tenantId,
      executionId: input.executionId,
      nodeId: 'confirm-booking',
      nodeData: {
        task: 'confirm_gig_booking',
        gigId: input.gigId,
        bookingId: input.bookingId,
      },
      workflowInput: input,
      context: { entityType: 'gig_booking', entityId: input.bookingId.toString() },
      previousOutputs: {},
    });

    // Step 2: Notify talent
    await executeNodeActivity.executeNotificationNode({
      tenantId: input.tenantId,
      executionId: input.executionId,
      nodeId: 'notify-talent',
      nodeData: {
        type: 'gig_booking_received',
        gigId: input.gigId,
        bookingId: input.bookingId,
      },
      workflowInput: input,
      context: { entityType: 'gig_booking', entityId: input.bookingId.toString() },
      previousOutputs: { confirmation: confirmationResult },
    });

    // Step 3: Set delivery deadline reminder
    const reminderTime = workflow.sleep('7 days'); // Wait 7 days then remind
    await reminderTime;

    await executeNodeActivity.executeNotificationNode({
      tenantId: input.tenantId,
      executionId: input.executionId,
      nodeId: 'delivery-reminder',
      nodeData: {
        type: 'gig_delivery_reminder',
        gigId: input.gigId,
        bookingId: input.bookingId,
      },
      workflowInput: input,
      context: { entityType: 'gig_booking', entityId: input.bookingId.toString() },
      previousOutputs: { confirmation: confirmationResult },
    });

    return {
      success: true,
      output: { gigProcessed: true, confirmationResult },
      executionId: input.executionId,
    };

  } catch (error: any) {
    log.error('Gig delivery workflow failed', { error: error.message, ...input });
    throw new workflow.ApplicationFailure(
      `Gig delivery workflow failed: ${error.message}`,
      'GigDeliveryError',
      false,
      input
    );
  }
}

/**
 * User Onboarding Workflow
 */
export async function userOnboardingWorkflow(input: {
  tenantId: number;
  userId: number;
  executionId: string;
}): Promise<any> {
  log.info('Starting user onboarding workflow', input);

  try {
    // Step 1: Send welcome email
    await executeNodeActivity.executeEmailNode({
      tenantId: input.tenantId,
      executionId: input.executionId,
      nodeId: 'welcome-email',
      nodeData: {
        templateSlug: 'welcome',
        userId: input.userId,
      },
      workflowInput: input,
      context: { entityType: 'user', entityId: input.userId.toString() },
      previousOutputs: {},
    });

    // Step 2: Wait 1 day then send onboarding tips
    await workflow.sleep('1 day');

    await executeNodeActivity.executeEmailNode({
      tenantId: input.tenantId,
      executionId: input.executionId,
      nodeId: 'onboarding-tips',
      nodeData: {
        templateSlug: 'onboarding-tips',
        userId: input.userId,
      },
      workflowInput: input,
      context: { entityType: 'user', entityId: input.userId.toString() },
      previousOutputs: {},
    });

    // Step 3: Wait 7 days then send feature introduction
    await workflow.sleep('6 days'); // Total 7 days from start

    await executeNodeActivity.executeEmailNode({
      tenantId: input.tenantId,
      executionId: input.executionId,
      nodeId: 'feature-intro',
      nodeData: {
        templateSlug: 'feature-introduction',
        userId: input.userId,
      },
      workflowInput: input,
      context: { entityType: 'user', entityId: input.userId.toString() },
      previousOutputs: {},
    });

    return {
      success: true,
      output: { userOnboarded: true },
      executionId: input.executionId,
    };

  } catch (error: any) {
    log.error('User onboarding workflow failed', { error: error.message, ...input });
    throw new workflow.ApplicationFailure(
      `User onboarding failed: ${error.message}`,
      'UserOnboardingError',
      false,
      input
    );
  }
}