import { proxyActivities, log } from '@temporalio/workflow';
import type { WorkflowStep } from '../reactflow-bridge';
import { logger } from '@/lib/logger'; // It's okay to have both, workflow logger is for history
import type { ActivityInput, ActivityOutput } from '../activities/workflow-activities';

// Import activities with proper proxy
const activities = proxyActivities<typeof import('../activities/workflow-activities')>({
  startToCloseTimeout: '1 minute',
  retry: {
    initialInterval: '1s',
    backoffCoefficient: 2,
    maximumInterval: '1m',
    maximumAttempts: 3,
  },
});

// Workflow input interface
export interface DynamicWorkflowInput {
  steps: WorkflowStep[];
  tenantId: string;
  input: Record<string, any>;
  metadata: {
    originalWorkflowId: string;
    workflowName: string;
  };
}

/**
 * Dynamic workflow that executes ReactFlow-generated steps
 */
export async function reactFlowDynamicWorkflow(input: DynamicWorkflowInput): Promise<any> {
  const { steps, tenantId, input: workflowInput, metadata } = input;

  log.info(`Starting workflow: ${metadata.workflowName} for tenant: ${tenantId}`);

  const stepResults: Record<string, any> = {};
  let variables = { ...workflowInput };

  try {
    // Execute workflow steps sequentially
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      log.info(`Executing step ${i + 1}/${steps.length}: ${step.type} (${step.id})`);

      // Prepare step input
      const stepInput: ActivityInput = {
        payload: step.input,
        tenantId,
        variables,
        stepId: step.id
      };

      // Execute step based on activity
      const stepResult = await executeWorkflowStep(step, stepInput);

      // Store step result
      stepResults[step.id] = stepResult.result;

      // Update variables with step results
      if (stepResult.result && typeof stepResult.result === 'object') {
        variables = { ...variables, ...stepResult.result };
      }

      log.info(`Completed step: ${step.id}`);
    }

    log.info('Workflow completed successfully');

    return {
      success: true,
      results: stepResults,
      finalVariables: variables,
      metadata
    };

  } catch (error) {
    log.error('Workflow failed:', { error });
    throw error;
  }
}

/**
 * Execute individual workflow step
 */
async function executeWorkflowStep(step: WorkflowStep, stepInput: ActivityInput): Promise<ActivityOutput> {
  switch (step.activity) {
    case 'initializeWorkflow':
      return await activities.initializeWorkflow(stepInput);

    case 'requestApproval':
      return await activities.requestApproval(stepInput);

    case 'sendEmail':
      return await activities.sendEmail(stepInput);

    case 'callWebhook':
      return await activities.callWebhook(stepInput);

    case 'updateDatabase':
      return await activities.updateDatabase(stepInput);

    case 'sendNotification':
      return await activities.sendNotification(stepInput);

    case 'evaluateCondition':
      return await activities.evaluateCondition(stepInput);

    case 'executeBranch':
      return await activities.executeBranch(stepInput);

    case 'handleApprovalOutcome':
      return await activities.handleApprovalOutcome(stepInput);

    case 'completeWorkflow':
      return await activities.completeWorkflow(stepInput);

    default:
      log.warn(`Unknown activity: ${step.activity}`);
      return await activities.executeGenericAction(stepInput);
  }
}

/**
 * Helper function to create workflow execution context
 */
export function createWorkflowContext(
  workflowDefinition: any,
  triggerData: any,
  tenantId: string
): DynamicWorkflowInput {
  return {
    steps: [], // Will be populated by ReactFlowTemporalBridge
    tenantId,
    input: triggerData,
    metadata: {
      originalWorkflowId: workflowDefinition.id,
      workflowName: workflowDefinition.name
    }
  };
} 