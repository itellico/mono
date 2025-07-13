import { proxyActivities, log, sleep } from '@temporalio/workflow';
import type * as activities from '../activities/llm-activities';

// ============================
// LLM EXECUTION WORKFLOW
// ============================

// Proxy activities with timeout and retry configuration
const {
  executePrompt,
  logUsage,
  validateConfig,
  processTemplate
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30s',
  heartbeatTimeout: '10s',
  retry: {
    initialInterval: '1s',
    maximumInterval: '10s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
    nonRetryableErrorTypes: [
      'ValidationError',
      'ConfigurationError',
      'AuthenticationError'
    ]
  }
});

// Workflow input interface
export interface LlmExecutionInput {
  scope: string;
  variables: Record<string, any>;
  tenantId?: number;
  userId?: number;
  metadata?: Record<string, any>;
  requestId?: string;
}

// Workflow output interface
export interface LlmExecutionOutput {
  success: boolean;
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
  error?: string;
  requestId?: string;
}

/**
 * Main LLM execution workflow
 * Handles prompt processing with retries, monitoring, and audit
 */
export async function llmExecutionWorkflow(input: LlmExecutionInput): Promise<LlmExecutionOutput> {
  const workflowId = input.requestId || 'llm-' + Date.now();
  const startTime = Date.now();

  log.info('Starting LLM execution workflow', { 
    workflowId,
    scope: input.scope,
    tenantId: input.tenantId,
    userId: input.userId
  });

  try {
    // Step 1: Validate configuration exists for scope
    log.info('Validating LLM configuration', { scope: input.scope, tenantId: input.tenantId });

    const configValid = await validateConfig({
      scope: input.scope,
      tenantId: input.tenantId
    });

    if (!configValid) {
      const error = `No valid LLM configuration found for scope: ${input.scope}`;
      log.error(error, { scope: input.scope, tenantId: input.tenantId });

      return {
        success: false,
        error,
        requestId: workflowId
      };
    }

    // Step 2: Process prompt template with variables
    log.info('Processing prompt template', { 
      scope: input.scope,
      variableKeys: Object.keys(input.variables)
    });

    const processedPrompt = await processTemplate({
      scope: input.scope,
      variables: input.variables,
      tenantId: input.tenantId
    });

    // Step 3: Execute the prompt with the LLM provider
    log.info('Executing LLM prompt', { 
      scope: input.scope,
      promptLength: processedPrompt.length
    });

    const result = await executePrompt({
      scope: input.scope,
      prompt: processedPrompt,
      tenantId: input.tenantId,
      userId: input.userId,
      metadata: input.metadata
    });

    const responseTimeMs = Date.now() - startTime;

    // Step 4: Log usage statistics
    log.info('Logging LLM usage', { 
      scope: input.scope,
      tenantId: input.tenantId,
      totalTokens: result.usage.totalTokens,
      responseTimeMs
    });

    await logUsage({
      scope: input.scope,
      tenantId: input.tenantId,
      userId: input.userId,
      usage: result.usage,
      model: result.model,
      provider: result.provider,
      responseTimeMs,
      estimatedCost: result.estimatedCost,
      status: 'success',
      metadata: input.metadata
    });

    log.info('LLM execution workflow completed successfully', {
      workflowId,
      scope: input.scope,
      responseTimeMs,
      totalTokens: result.usage.totalTokens
    });

    return {
      success: true,
      content: result.content,
      usage: result.usage,
      model: result.model,
      provider: result.provider,
      responseTimeMs,
      estimatedCost: result.estimatedCost,
      requestId: workflowId
    };

  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    log.error('LLM execution workflow failed', {
      workflowId,
      error: errorMessage,
      scope: input.scope,
      tenantId: input.tenantId,
      responseTimeMs
    });

    // Log the failed attempt
    try {
      await logUsage({
        scope: input.scope,
        tenantId: input.tenantId,
        userId: input.userId,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        model: 'unknown',
        provider: 'unknown',
        responseTimeMs,
        status: 'error',
        errorMessage,
        metadata: input.metadata
      });
    } catch (logError) {
      log.warn('Failed to log error usage', { logError: logError.message });
    }

    return {
      success: false,
      error: errorMessage,
      responseTimeMs,
      requestId: workflowId
    };
  }
}

/**
 * Batch LLM execution workflow
 * Processes multiple prompts in parallel with concurrency control
 */
export async function batchLlmExecutionWorkflow(
  inputs: LlmExecutionInput[]
): Promise<LlmExecutionOutput[]> {
  const batchId = 'batch-' + Date.now();
  const maxConcurrency = 5; // Limit concurrent executions

  log.info('Starting batch LLM execution workflow', {
    batchId,
    batchSize: inputs.length,
    maxConcurrency
  });

  const results: LlmExecutionOutput[] = [];

  // Process in batches to control concurrency
  for (let i = 0; i < inputs.length; i += maxConcurrency) {
    const batch = inputs.slice(i, i + maxConcurrency);

    log.info('Processing batch chunk', {
      batchId,
      chunkStart: i,
      chunkSize: batch.length
    });

    // Execute batch concurrently
    const batchPromises = batch.map(input => 
      llmExecutionWorkflow({
        ...input,
        requestId: input.requestId || `${batchId}-${i + batch.indexOf(input)}`
      })
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Small delay between batches to avoid overwhelming the LLM provider
    if (i + maxConcurrency < inputs.length) {
      await sleep('100ms');
    }
  }

  const successCount = results.filter(r => r.success).length;
  const errorCount = results.length - successCount;

  log.info('Batch LLM execution workflow completed', {
    batchId,
    totalProcessed: results.length,
    successCount,
    errorCount
  });

  return results;
} 