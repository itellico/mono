import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { LlmResolver } from '@/lib/services/llm-resolver';
import {
  llmUsageLogs,
  type LlmPromptResponse,
  type NewLlmUsageLog
} from '@/lib/schemas/llm-integrations';

// ============================
// LLM TEMPORAL ACTIVITIES
// ============================

// Activity input interfaces
export interface ValidateConfigInput {
  scope: string;
  tenantId?: number;
}

export interface ProcessTemplateInput {
  scope: string;
  variables: Record<string, any>;
  tenantId?: number;
}

export interface ExecutePromptInput {
  scope: string;
  prompt: string;
  tenantId?: number;
  userId?: number;
  metadata?: Record<string, any>;
}

export interface LogUsageInput {
  scope: string;
  tenantId?: number;
  userId?: number;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
  responseTimeMs: number;
  estimatedCost?: number;
  status: 'success' | 'error' | 'timeout';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Validate that a configuration exists for the given scope and tenant
 */
export async function validateConfig(input: ValidateConfigInput): Promise<boolean> {
  try {
    logger.debug({ scope: input.scope, tenantId: input.tenantId }, 'Validating LLM config');

    const config = await LlmResolver.resolveConfig(input.scope, input.tenantId);

    if (!config) {
      logger.warn({ scope: input.scope, tenantId: input.tenantId }, 'No LLM config found');
      return false;
    }

    logger.debug({ 
      scope: input.scope, 
      tenantId: input.tenantId,
      configId: config.id,
      provider: config.provider.name,
      model: config.modelName
    }, 'LLM config validation successful');

    return true;

  } catch (error) {
    logger.error({ 
      error: error.message, 
      scope: input.scope, 
      tenantId: input.tenantId 
    }, 'LLM config validation failed');
    return false;
  }
}

/**
 * Process prompt template with variables
 */
export async function processTemplate(input: ProcessTemplateInput): Promise<string> {
  try {
    logger.debug({ 
      scope: input.scope, 
      tenantId: input.tenantId,
      variableCount: Object.keys(input.variables).length
    }, 'Processing prompt template');

    const config = await LlmResolver.resolveConfig(input.scope, input.tenantId);

    if (!config) {
      throw new Error(`No LLM configuration found for scope: ${input.scope}`);
    }

    const processedPrompt = LlmResolver.processPromptTemplate(
      config.promptTemplate,
      input.variables
    );

    logger.debug({ 
      scope: input.scope, 
      promptLength: processedPrompt.length 
    }, 'Prompt template processed successfully');

    return processedPrompt;

  } catch (error) {
    logger.error({ 
      error: error.message, 
      scope: input.scope, 
      tenantId: input.tenantId 
    }, 'Prompt template processing failed');
    throw error;
  }
}

/**
 * Execute prompt with the configured LLM provider
 */
export async function executePrompt(input: ExecutePromptInput): Promise<LlmPromptResponse> {
  const startTime = Date.now();

  try {
    logger.info({ 
      scope: input.scope, 
      tenantId: input.tenantId,
      promptLength: input.prompt.length
    }, 'Executing LLM prompt');

    const config = await LlmResolver.getConfigWithApiKey(input.scope, input.tenantId);

    if (!config) {
      throw new Error(`No LLM configuration found for scope: ${input.scope}`);
    }

    // Call the appropriate LLM provider based on configuration
    const response = await callLlmProvider(config, input.prompt);

    const responseTimeMs = Date.now() - startTime;

    logger.info({ 
      scope: input.scope,
      provider: config.provider.name,
      model: config.modelName,
      totalTokens: response.usage.totalTokens,
      responseTimeMs
    }, 'LLM prompt executed successfully');

    return {
      ...response,
      responseTimeMs
    };

  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    logger.error({ 
      error: error.message, 
      scope: input.scope, 
      tenantId: input.tenantId,
      responseTimeMs
    }, 'LLM prompt execution failed');
    throw error;
  }
}

/**
 * Log usage statistics to the database
 */
export async function logUsage(input: LogUsageInput): Promise<void> {
  try {
    // First, resolve scope and config for IDs
    const config = await LlmResolver.resolveConfig(input.scope, input.tenantId);

    if (!config) {
      logger.warn({ scope: input.scope, tenantId: input.tenantId }, 'Could not find config for usage logging');
      return;
    }

    const usageLogData: NewLlmUsageLog = {
      tenantId: input.tenantId || null,
      scopeId: config.scopeId,
      configId: config.id,
      providerId: config.providerId,
      modelName: input.model,
      promptTokens: input.usage.promptTokens,
      completionTokens: input.usage.completionTokens,
      totalTokens: input.usage.totalTokens,
      estimatedCost: input.estimatedCost || null,
      responseTimeMs: input.responseTimeMs,
      status: input.status,
      errorMessage: input.errorMessage || null,
      metadata: input.metadata || {},
      userId: input.userId || null
    };

    await db.insert(llmUsageLogs).values(usageLogData);

    logger.debug({ 
      scope: input.scope,
      tenantId: input.tenantId,
      totalTokens: input.usage.totalTokens,
      status: input.status
    }, 'LLM usage logged successfully');

  } catch (error) {
    logger.error({ 
      error: error.message, 
      scope: input.scope, 
      tenantId: input.tenantId 
    }, 'Failed to log LLM usage');
    // Don't throw - usage logging failures shouldn't break the workflow
  }
}

// ============================
// LLM PROVIDER IMPLEMENTATIONS
// ============================

/**
 * Call the appropriate LLM provider based on configuration
 */
async function callLlmProvider(
  config: any, // LlmScopeConfigWithRelations with decrypted API key
  prompt: string
): Promise<Omit<LlmPromptResponse, 'responseTimeMs'>> {
  const providerName = config.provider.name.toLowerCase();

  switch (providerName) {
    case 'openai':
      return callOpenAI(config, prompt);
    case 'anthropic':
      return callAnthropic(config, prompt);
    case 'mistral':
      return callMistral(config, prompt);
    default:
      throw new Error(`Unsupported LLM provider: ${providerName}`);
  }
}

/**
 * OpenAI API implementation
 */
async function callOpenAI(config: any, prompt: string): Promise<Omit<LlmPromptResponse, 'responseTimeMs'>> {
  const apiKey = config.apiKey.apiKey;
  const baseUrl = config.provider.apiBaseUrl || 'https://api.openai.com/v1';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.modelName,
      messages: [{ role: 'user', content: prompt }],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      top_p: config.topP,
      frequency_penalty: config.frequencyPenalty,
      presence_penalty: config.presencePenalty
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0].message.content,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens
    },
    model: config.modelName,
    provider: 'OpenAI',
    estimatedCost: calculateOpenAICost(config.modelName, data.usage)
  };
}

/**
 * Anthropic API implementation
 */
async function callAnthropic(config: any, prompt: string): Promise<Omit<LlmPromptResponse, 'responseTimeMs'>> {
  const apiKey = config.apiKey.apiKey;
  const baseUrl = config.provider.apiBaseUrl || 'https://api.anthropic.com/v1';

  const response = await fetch(`${baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.modelName,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: config.maxTokens,
      temperature: config.temperature
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    content: data.content[0].text,
    usage: {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens
    },
    model: config.modelName,
    provider: 'Anthropic',
    estimatedCost: calculateAnthropicCost(config.modelName, data.usage)
  };
}

/**
 * Mistral API implementation
 */
async function callMistral(config: any, prompt: string): Promise<Omit<LlmPromptResponse, 'responseTimeMs'>> {
  const apiKey = config.apiKey.apiKey;
  const baseUrl = config.provider.apiBaseUrl || 'https://api.mistral.ai/v1';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.modelName,
      messages: [{ role: 'user', content: prompt }],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      top_p: config.topP
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mistral API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0].message.content,
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens
    },
    model: config.modelName,
    provider: 'Mistral',
    estimatedCost: calculateMistralCost(config.modelName, data.usage)
  };
}

// ============================
// COST CALCULATION HELPERS
// ============================

function calculateOpenAICost(model: string, usage: any): number {
  // Simplified cost calculation - should be updated with actual pricing
  const costPer1kTokens = model.includes('gpt-4') ? 0.03 : 0.002;
  return (usage.total_tokens / 1000) * costPer1kTokens;
}

function calculateAnthropicCost(model: string, usage: any): number {
  // Simplified cost calculation - should be updated with actual pricing
  const costPer1kTokens = 0.008;
  return ((usage.input_tokens + usage.output_tokens) / 1000) * costPer1kTokens;
}

function calculateMistralCost(model: string, usage: any): number {
  // Simplified cost calculation - should be updated with actual pricing
  const costPer1kTokens = 0.0002;
  return (usage.total_tokens / 1000) * costPer1kTokens;
} 