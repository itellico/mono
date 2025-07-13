import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/example-activities';

// Proxy activities to be executed by workers
const { greetUser, processModelProfile, sendNotification } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

/**
 * Example workflow for go-models tenant
 * This demonstrates how ReactFlow workflows become Temporal workflows
 */
export async function goModelsExampleWorkflow(input: {
  userId: string;
  profileId: string;
  workflowType: 'profile_approval' | 'job_application' | 'payment_processing';
}): Promise<string> {
  const { userId, profileId, workflowType } = input;

  // Step 1: Greet user (Start node equivalent)
  const greeting = await greetUser(userId);

  // Step 2: Process based on workflow type (Decision node equivalent)
  let result: string;

  switch (workflowType) {
    case 'profile_approval':
      // Step 3a: Process model profile (Action node equivalent)
      result = await processModelProfile(profileId, 'pending_approval');

      // Step 4a: Send notification (Action node equivalent)
      await sendNotification(userId, 'profile_submitted', {
        profileId,
        status: 'pending_approval'
      });
      break;

    case 'job_application':
      // Step 3b: Different processing path
      result = await processModelProfile(profileId, 'job_application');
      await sendNotification(userId, 'application_received', { profileId });
      break;

    case 'payment_processing':
      // Step 3c: Payment workflow
      result = await processModelProfile(profileId, 'payment_processing');
      await sendNotification(userId, 'payment_initiated', { profileId });
      break;

    default:
      throw new Error(`Unknown workflow type: ${workflowType}`);
  }

  // Step 5: Final notification (End node equivalent)
  await sendNotification(userId, 'workflow_completed', {
    profileId,
    result,
    workflowType
  });

  return `Workflow completed: ${result}`;
}

/**
 * Platform-level workflow for mono system operations
 */
export async function monoPlatformWorkflow(input: {
  operation: 'tenant_billing' | 'system_maintenance' | 'analytics_report';
  tenantId?: string;
}): Promise<string> {
  const { operation, tenantId } = input;

  switch (operation) {
    case 'tenant_billing':
      // Process billing for a tenant
      if (!tenantId) throw new Error('tenantId required for billing');

      const billingResult = await processModelProfile(tenantId, 'billing_cycle');
      await sendNotification('system', 'billing_completed', { tenantId, result: billingResult });
      return `Billing completed for tenant: ${tenantId}`;

    case 'system_maintenance':
      // System maintenance workflow
      await sendNotification('system', 'maintenance_started', {});
      const maintenanceResult = await processModelProfile('system', 'maintenance');
      await sendNotification('system', 'maintenance_completed', { result: maintenanceResult });
      return 'System maintenance completed';

    case 'analytics_report':
      // Generate analytics report
      const reportResult = await processModelProfile('analytics', 'generate_report');
      await sendNotification('system', 'report_generated', { result: reportResult });
      return 'Analytics report generated';

    default:
      throw new Error(`Unknown platform operation: ${operation}`);
  }
} 