'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

// Types
interface LLMProvider {
  provider: string;
  name: string;
  description: string;
  models: Array<{
    id: string;
    name: string;
    description: string;
    maxTokens: number;
    inputCostPer1k: number;
    outputCostPer1k: number;
    capabilities: string[];
  }>;
  isConfigured: boolean;
  isActive: boolean;
}

interface LLMResponse {
  id: string;
  provider: string;
  model: string;
  response: {
    content: string;
    role: string;
    finishReason: string;
  };
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: any;
  processingTimeMs: number;
  createdAt: string;
}

interface LLMAnalytics {
  summary: {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageResponseTime: number;
    successRate: number;
  };
  usage: Array<{
    date: string;
    requests: number;
    tokens: number;
    cost: number;
    averageResponseTime: number;
  }>;
  byProvider: Array<{
    provider: string;
    requests: number;
    tokens: number;
    cost: number;
  }>;
  byModel: Array<{
    model: string;
    provider: string;
    requests: number;
    tokens: number;
    cost: number;
  }>;
}

interface LLMApiKey {
  id: number;
  provider: string;
  name: string;
  keyPreview: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Hook for getting LLM providers
export function useLLMProviders() {
  return useQuery({
    queryKey: ['llm-providers'],
    queryFn: async () => {
      const response = await apiClient.getLLMProviders();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch LLM providers');
      }
      return response.data;
    },
    staleTime: 300000, // 5 minutes
  });
}

// Hook for executing LLM requests
export function useExecuteLLM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      provider,
      model,
      messages,
      temperature = 0.7,
      maxTokens = 1000,
      systemPrompt,
      tools,
      stream = false,
      metadata = {},
    }: {
      provider: string;
      model: string;
      messages: Array<{ role: string; content: string }>;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      tools?: any[];
      stream?: boolean;
      metadata?: any;
    }) => {
      const response = await apiClient.executeLLM({
        provider,
        model,
        messages,
        temperature,
        maxTokens,
        systemPrompt,
        tools,
        stream,
        metadata,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'LLM request failed');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate analytics to reflect new usage
      queryClient.invalidateQueries({ queryKey: ['llm-analytics'] });
      
      // Show success notification with token usage
      toast.success(
        `Request completed (${data.usage.totalTokens} tokens, ${data.processingTimeMs}ms)`
      );
    },
    onError: (error: any) => {
      if (error.message.includes('limit exceeded')) {
        toast.error('Usage limit exceeded. Please check your subscription.');
      } else if (error.message.includes('API configuration')) {
        toast.error('LLM provider not configured. Please add API keys.');
      } else {
        toast.error(`LLM request failed: ${error.message}`);
      }
    },
  });
}

// Hook for getting LLM usage analytics
export function useLLMAnalytics(filters: {
  period?: string;
  provider?: string;
  model?: string;
} = {}) {
  return useQuery({
    queryKey: ['llm-analytics', filters],
    queryFn: async () => {
      const response = await apiClient.getLLMAnalytics(filters);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch LLM analytics');
      }
      return response.data;
    },
    staleTime: 60000, // 1 minute
  });
}

// Hook for managing API keys
export function useLLMApiKeys() {
  return useQuery({
    queryKey: ['llm-api-keys'],
    queryFn: async () => {
      const response = await apiClient.getLLMApiKeys();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch API keys');
      }
      return response.data;
    },
  });
}

// Hook for creating API keys
export function useCreateLLMApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      provider,
      name,
      apiKey,
      isActive = true,
    }: {
      provider: string;
      name: string;
      apiKey: string;
      isActive?: boolean;
    }) => {
      const response = await apiClient.createLLMApiKey({
        provider,
        name,
        apiKey,
        isActive,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create API key');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`API key for ${data.provider} created successfully`);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['llm-api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['llm-providers'] });
    },
    onError: (error) => {
      toast.error(`Failed to create API key: ${error.message}`);
    },
  });
}

// Utility functions and helpers
export const LLMUtils = {
  // Calculate estimated cost for a request
  estimateCost: (
    promptTokens: number,
    completionTokens: number,
    provider: string,
    model: string
  ) => {
    // Mock pricing - in real implementation, get from provider data
    const pricing = {
      'openai': {
        'gpt-4': { input: 0.03, output: 0.06 },
        'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
      },
      'anthropic': {
        'claude-3-opus': { input: 0.015, output: 0.075 },
        'claude-3-sonnet': { input: 0.003, output: 0.015 },
      },
    };

    const modelPricing = pricing[provider as keyof typeof pricing]?.[model as keyof any];
    if (!modelPricing) return 0;

    const inputCost = (promptTokens / 1000) * modelPricing.input;
    const outputCost = (completionTokens / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
  },

  // Format cost for display
  formatCost: (cost: number) => {
    if (cost < 0.01) return `$${(cost * 100).toFixed(3)}¢`;
    return `$${cost.toFixed(4)}`;
  },

  // Get provider color/icon
  getProviderInfo: (provider: string) => {
    switch (provider) {
      case 'openai':
        return { color: 'text-green-600', icon: '🤖', name: 'OpenAI' };
      case 'anthropic':
        return { color: 'text-blue-600', icon: '🧠', name: 'Anthropic' };
      case 'google':
        return { color: 'text-red-600', icon: '🔍', name: 'Google' };
      default:
        return { color: 'text-gray-600', icon: '⚡', name: provider };
    }
  },

  // Validate message format
  validateMessages: (messages: Array<{ role: string; content: string }>) => {
    if (!messages.length) return 'At least one message is required';
    
    const validRoles = ['system', 'user', 'assistant'];
    for (const message of messages) {
      if (!validRoles.includes(message.role)) {
        return `Invalid role: ${message.role}`;
      }
      if (!message.content.trim()) {
        return 'Message content cannot be empty';
      }
    }
    
    return null;
  },

  // Count tokens (rough estimate)
  estimateTokens: (text: string) => {
    // Very rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  },

  // Build conversation context
  buildConversationContext: (
    messages: Array<{ role: string; content: string }>,
    systemPrompt?: string
  ) => {
    const context = [];
    
    if (systemPrompt) {
      context.push({ role: 'system', content: systemPrompt });
    }
    
    return [...context, ...messages];
  },

  // Format response time
  formatResponseTime: (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  },

  // Get capability badges
  getCapabilityBadges: (capabilities: string[]) => {
    const badgeMap = {
      text: { label: 'Text', color: 'bg-blue-100 text-blue-800' },
      code: { label: 'Code', color: 'bg-green-100 text-green-800' },
      reasoning: { label: 'Reasoning', color: 'bg-purple-100 text-purple-800' },
      'long-context': { label: 'Long Context', color: 'bg-orange-100 text-orange-800' },
      vision: { label: 'Vision', color: 'bg-pink-100 text-pink-800' },
      tools: { label: 'Function Calls', color: 'bg-indigo-100 text-indigo-800' },
    };

    return capabilities.map(cap => badgeMap[cap as keyof typeof badgeMap] || {
      label: cap,
      color: 'bg-gray-100 text-gray-800'
    });
  },

  // Format success rate
  formatSuccessRate: (rate: number) => {
    const color = rate >= 95 ? 'text-green-600' : rate >= 90 ? 'text-yellow-600' : 'text-red-600';
    return { percentage: `${rate.toFixed(1)}%`, color };
  },
};

// Pre-built message templates
export const MessageTemplates = {
  codeReview: (code: string) => [
    {
      role: 'user',
      content: `Please review this code and provide feedback on improvements, potential bugs, and best practices:\n\n${code}`,
    },
  ],

  summarize: (text: string) => [
    {
      role: 'user',
      content: `Please provide a concise summary of the following text:\n\n${text}`,
    },
  ],

  translate: (text: string, targetLanguage: string) => [
    {
      role: 'user',
      content: `Please translate the following text to ${targetLanguage}:\n\n${text}`,
    },
  ],

  explain: (concept: string) => [
    {
      role: 'user',
      content: `Please explain the concept of "${concept}" in simple terms with examples.`,
    },
  ],

  debug: (error: string, code?: string) => [
    {
      role: 'user',
      content: `I'm getting this error: "${error}"${code ? `\n\nIn this code:\n${code}` : ''}\n\nCan you help me debug and fix it?`,
    },
  ],
};