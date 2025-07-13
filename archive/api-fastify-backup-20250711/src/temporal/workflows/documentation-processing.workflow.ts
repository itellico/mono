import { proxyActivities, sleep, defineSignal, setHandler } from '@temporalio/workflow';
import type * as activities from '../activities/documentation.activities';

// Import activity types
const {
  validateDocuments,
  createBackups,
  processDocumentBatch,
  applyDocumentChanges,
  updateSearchIndices,
  rollbackChanges,
  notifyStakeholders,
  optimizeWithAI,
  performTechnicalReview,
  generateQualityReport
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: {
    initialInterval: '30s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

// Define signals for workflow control
export const pauseSignal = defineSignal('pause');
export const resumeSignal = defineSignal('resume');
export const cancelSignal = defineSignal('cancel');

export interface DocumentationWorkflowInput {
  documents: Array<{
    id: string;
    path: string;
    content: string;
    metadata?: Record<string, any>;
  }>;
  operation: 'optimize' | 'migrate' | 'bulk-update' | 'quality-check';
  options?: {
    aiModel?: 'gpt-4' | 'claude-3' | 'both';
    requireApproval?: boolean;
    priority?: 'low' | 'medium' | 'high';
    notificationChannels?: string[];
  };
}

export interface DocumentationWorkflowResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  results: Array<{
    documentId: string;
    status: 'success' | 'failed' | 'skipped';
    changes?: any;
    error?: string;
  }>;
  report?: {
    averageQualityBefore: number;
    averageQualityAfter: number;
    totalIssuesFound: number;
    totalIssuesFixed: number;
  };
}

/**
 * Complex Documentation Processing Workflow
 * Handles multi-stage document processing with reliability guarantees
 */
export async function DocumentationProcessingWorkflow(
  input: DocumentationWorkflowInput
): Promise<DocumentationWorkflowResult> {
  let isPaused = false;
  let isCancelled = false;
  
  // Set up signal handlers
  setHandler(pauseSignal, () => { isPaused = true; });
  setHandler(resumeSignal, () => { isPaused = false; });
  setHandler(cancelSignal, () => { isCancelled = true; });

  const results: DocumentationWorkflowResult['results'] = [];
  let backupIds: string[] = [];

  try {
    // Step 1: Validate all documents
    console.log('Starting document validation...');
    const validationResult = await validateDocuments(input.documents);
    
    if (!validationResult.isValid) {
      throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
    }

    // Step 2: Create backups for rollback capability
    console.log('Creating document backups...');
    backupIds = await createBackups(input.documents);

    // Step 3: Process documents based on operation type
    if (input.operation === 'optimize') {
      await processOptimization(input, results, isPaused, isCancelled);
    } else if (input.operation === 'migrate') {
      await processMigration(input, results, isPaused, isCancelled);
    } else if (input.operation === 'bulk-update') {
      await processBulkUpdate(input, results, isPaused, isCancelled);
    } else if (input.operation === 'quality-check') {
      await processQualityCheck(input, results, isPaused, isCancelled);
    }

    // Step 4: Apply changes if not cancelled
    if (!isCancelled && results.some(r => r.status === 'success')) {
      console.log('Applying document changes...');
      await applyDocumentChanges(
        results.filter(r => r.status === 'success').map(r => ({
          documentId: r.documentId,
          changes: r.changes
        }))
      );

      // Step 5: Update search indices
      console.log('Updating search indices...');
      await updateSearchIndices(
        results.filter(r => r.status === 'success').map(r => r.documentId)
      );
    }

    // Step 6: Generate quality report
    const report = await generateQualityReport(input.documents, results);

    // Step 7: Notify stakeholders
    if (input.options?.notificationChannels) {
      await notifyStakeholders({
        channels: input.options.notificationChannels,
        operation: input.operation,
        results: results,
        report: report
      });
    }

    return {
      success: !isCancelled,
      processedCount: results.filter(r => r.status === 'success').length,
      failedCount: results.filter(r => r.status === 'failed').length,
      results,
      report
    };

  } catch (error) {
    // Rollback on error
    console.error('Workflow error, initiating rollback...', error);
    if (backupIds.length > 0) {
      await rollbackChanges(backupIds);
    }
    throw error;
  }
}

/**
 * Process document optimization with AI
 */
async function processOptimization(
  input: DocumentationWorkflowInput,
  results: DocumentationWorkflowResult['results'],
  isPaused: boolean,
  isCancelled: boolean
): Promise<void> {
  const batchSize = 5;
  const batches = chunk(input.documents, batchSize);

  for (const [index, batch] of batches.entries()) {
    // Check for pause/cancel
    while (isPaused && !isCancelled) {
      await sleep('5s');
    }
    if (isCancelled) break;

    console.log(`Processing batch ${index + 1}/${batches.length}`);

    // Process batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(async (doc) => {
        try {
          // AI optimization
          const optimized = await optimizeWithAI({
            document: doc,
            model: input.options?.aiModel || 'gpt-4'
          });

          // Technical review
          const reviewed = await performTechnicalReview(optimized);

          // Add to results
          results.push({
            documentId: doc.id,
            status: 'success',
            changes: {
              original: doc.content,
              optimized: optimized.content,
              review: reviewed
            }
          });
        } catch (error) {
          results.push({
            documentId: doc.id,
            status: 'failed',
            error: error.message
          });
        }
      })
    );

    // Add delay between batches to avoid rate limits
    if (index < batches.length - 1) {
      await sleep('2s');
    }
  }
}

/**
 * Process document migration
 */
async function processMigration(
  input: DocumentationWorkflowInput,
  results: DocumentationWorkflowResult['results'],
  isPaused: boolean,
  isCancelled: boolean
): Promise<void> {
  // Implementation for migration logic
  console.log('Processing migration...');
  // Similar pattern to processOptimization but with migration-specific logic
}

/**
 * Process bulk updates
 */
async function processBulkUpdate(
  input: DocumentationWorkflowInput,
  results: DocumentationWorkflowResult['results'],
  isPaused: boolean,
  isCancelled: boolean
): Promise<void> {
  // Implementation for bulk update logic
  console.log('Processing bulk updates...');
  // Similar pattern but for bulk operations
}

/**
 * Process quality checks
 */
async function processQualityCheck(
  input: DocumentationWorkflowInput,
  results: DocumentationWorkflowResult['results'],
  isPaused: boolean,
  isCancelled: boolean
): Promise<void> {
  // Implementation for quality check logic
  console.log('Processing quality checks...');
  // Run quality analysis and store results
}

/**
 * Helper function to chunk array
 */
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Additional workflow for handling approval-based documentation changes
export async function DocumentationApprovalWorkflow(
  proposal: {
    id: string;
    changes: any[];
    proposedBy: string;
    metadata: Record<string, any>;
  }
): Promise<{ approved: boolean; appliedAt?: Date; rejectedReason?: string }> {
  // Wait for approval (up to 7 days)
  const approvalDeadline = new Date();
  approvalDeadline.setDate(approvalDeadline.getDate() + 7);

  let approved = false;
  let rejectedReason: string | undefined;

  // Poll for approval status
  while (new Date() < approvalDeadline) {
    const status = await checkApprovalStatus(proposal.id);
    
    if (status.decided) {
      approved = status.approved;
      rejectedReason = status.reason;
      break;
    }

    // Check every 30 minutes
    await sleep('30m');
  }

  if (approved) {
    // Apply the approved changes
    await applyDocumentChanges(proposal.changes);
    
    // Notify the proposer
    await notifyStakeholders({
      channels: ['documentation-updates'],
      operation: 'approval',
      results: [{
        documentId: proposal.id,
        status: 'success',
        changes: proposal.changes
      }],
      report: undefined
    });

    return { approved: true, appliedAt: new Date() };
  } else {
    // Notify rejection
    await notifyStakeholders({
      channels: ['documentation-updates'],
      operation: 'rejection',
      results: [{
        documentId: proposal.id,
        status: 'failed',
        error: rejectedReason
      }],
      report: undefined
    });

    return { approved: false, rejectedReason };
  }
}

// Helper activity imports (these would be implemented in activities file)
async function checkApprovalStatus(proposalId: string): Promise<{
  decided: boolean;
  approved: boolean;
  reason?: string;
}> {
  // This would be implemented as an activity
  return { decided: false, approved: false };
}