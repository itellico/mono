import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

export const llmRoutes: FastifyPluginAsync = async (fastify) => {
  // Execute LLM request
  fastify.post('/execute', {
    preHandler: [fastify.authenticate, fastify.requirePermission('llm:execute')],
    schema: {
      tags: ['platform.ai'],
      body: Type.Object({
        provider: Type.String(),
        model: Type.String(),
        messages: Type.Array(Type.Object({
          role: Type.String(),
          content: Type.String(),
        })),
        temperature: Type.Optional(Type.Number({ minimum: 0, maximum: 2, default: 0.7 })),
        maxTokens: Type.Optional(Type.Number({ minimum: 1, maximum: 4000, default: 1000 })),
        systemPrompt: Type.Optional(Type.String()),
        tools: Type.Optional(Type.Array(Type.Object({}, { additionalProperties: true }))),
        stream: Type.Optional(Type.Boolean({ default: false })),
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String(),
            provider: Type.String(),
            model: Type.String(),
            response: Type.Object({
              content: Type.String(),
              role: Type.String(),
              finishReason: Type.String(),
            }),
            usage: Type.Object({
              promptTokens: Type.Number(),
              completionTokens: Type.Number(),
              totalTokens: Type.Number(),
            }),
            metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
            processingTimeMs: Type.Number(),
            createdAt: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const {
      provider,
      model,
      messages,
      temperature = 0.7,
      maxTokens = 1000,
      systemPrompt,
      tools,
      stream = false,
      metadata = {},
    } = request.body;

    const startTime = Date.now();

    try {
      // Check usage limits
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayUsage = await fastify.prisma.llmRequest.aggregate({
        where: {
          tenantId: request.user!.tenantId,
          createdAt: { gte: today },
        },
        _sum: { totalTokens: true },
        _count: { id: true },
      });

      // Mock usage limits (would come from subscription)
      const dailyTokenLimit = 100000;
      const dailyRequestLimit = 1000;

      if ((todayUsage._sum.totalTokens || 0) + maxTokens > dailyTokenLimit) {
        return reply.code(429).send({
          success: false,
          error: 'DAILY_TOKEN_LIMIT_EXCEEDED',
          details: {
            used: todayUsage._sum.totalTokens || 0,
            limit: dailyTokenLimit,
            requested: maxTokens,
          },
        });
      }

      if ((todayUsage._count.id || 0) >= dailyRequestLimit) {
        return reply.code(429).send({
          success: false,
          error: 'DAILY_REQUEST_LIMIT_EXCEEDED',
          details: {
            used: todayUsage._count.id || 0,
            limit: dailyRequestLimit,
          },
        });
      }

      // Get API configuration for provider
      const apiConfig = await fastify.prisma.llmApiKey.findFirst({
        where: {
          tenantId: request.user!.tenantId,
          provider,
          isActive: true,
        },
      });

      if (!apiConfig) {
        return reply.code(400).send({
          success: false,
          error: 'NO_ACTIVE_API_CONFIGURATION_FOUND_FOR_PROVIDER:_${PROVIDER}',
        });
      }

      // Mock LLM execution (in real implementation, this would call the actual LLM API)
      const mockResponse = {
        content: `This is a mock response from ${provider}/${model}. In a real implementation, this would be the actual LLM response.`,
        role: 'assistant',
        finishReason: 'stop',
      };

      const mockUsage = {
        promptTokens: messages.reduce((acc, msg) => acc + Math.floor(msg.content.length / 4), 0),
        completionTokens: Math.floor(mockResponse.content.length / 4),
        totalTokens: 0,
      };
      mockUsage.totalTokens = mockUsage.promptTokens + mockUsage.completionTokens;

      const processingTime = Date.now() - startTime;

      // Save request to database
      const llmRequest = await fastify.prisma.llmRequest.create({
        data: {
          tenantId: request.user!.tenantId,
          userId: request.user!.id,
          provider,
          model,
          promptTokens: mockUsage.promptTokens,
          completionTokens: mockUsage.completionTokens,
          totalTokens: mockUsage.totalTokens,
          temperature,
          maxTokens,
          processingTimeMs: processingTime,
          status: 'completed',
          request: {
            messages,
            systemPrompt,
            tools,
            metadata,
          },
          response: mockResponse,
        },
      });

      request.log.info('LLM request completed', {
        requestId: llmRequest.uuid as UUID,
        provider,
        model,
        tokens: mockUsage.totalTokens,
        processingTime,
      });

      return {
        success: true,
        data: {
          provider,
          model,
          response: mockResponse,
          usage: mockUsage,
          metadata,
          processingTimeMs: processingTime,
          createdAt: llmRequest.createdAt.toISOString(),
        },
      };

    } catch (error: any) {
      // Save failed request
      try {
        await fastify.prisma.llmRequest.create({
          data: {
            tenantId: request.user!.tenantId,
            userId: request.user!.id,
            provider,
            model,
            temperature,
            maxTokens,
            processingTimeMs: Date.now() - startTime,
            status: 'failed',
            error: error.message,
            request: {
              messages,
              systemPrompt,
              tools,
              metadata,
            },
          },
        });
      } catch (dbError) {
        request.log.error('Failed to save LLM request error', { error: dbError });
      }

      request.log.error('LLM request failed', { error: error.message, provider, model });
      return reply.code(500).send({
        success: false,
        error: 'LLM_REQUEST_FAILED',
        details: error.message,
      });
    }
  });

  // Get LLM providers and models
  fastify.get('/providers', {
    preHandler: [fastify.authenticate, fastify.requirePermission('llm:read')],
    schema: {
      tags: ['platform.ai'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(Type.Object({
            provider: Type.String(),
            name: Type.String(),
            description: Type.String(),
            models: Type.Array(Type.Object({
              id: Type.String(),
              name: Type.String(),
              description: Type.String(),
              maxTokens: Type.Number(),
              inputCostPer1k: Type.Number(),
              outputCostPer1k: Type.Number(),
              capabilities: Type.Array(Type.String()),
            })),
            isConfigured: Type.Boolean(),
            isActive: Type.Boolean(),
          })),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      // Get configured API keys
      const apiKeys = await fastify.prisma.llmApiKey.findMany({
        where: {
          tenantId: request.user!.tenantId,
        },
        select: {
          provider: true,
          isActive: true,
        },
      });

      const configuredProviders = new Map(
        apiKeys.map(key => [key.provider, key.isActive])
      );

      // Mock provider data (would come from a configuration file or database)
      const providers = [
        {
          provider: 'openai',
          name: 'OpenAI',
          description: 'Advanced language models from OpenAI',
          models: [
            {
              id: 'gpt-4',
              name: 'GPT-4',
              description: 'Most capable GPT-4 model',
              maxTokens: 8192,
              inputCostPer1k: 0.03,
              outputCostPer1k: 0.06,
              capabilities: ['text', 'code', 'reasoning'],
            },
            {
              id: 'gpt-3.5-turbo',
              name: 'GPT-3.5 Turbo',
              description: 'Fast and efficient model',
              maxTokens: 4096,
              inputCostPer1k: 0.001,
              outputCostPer1k: 0.002,
              capabilities: ['text', 'code'],
            },
          ],
          isConfigured: configuredProviders.has('openai'),
          isActive: configuredProviders.get('openai') || false,
        },
        {
          provider: 'anthropic',
          name: 'Anthropic',
          description: 'Claude models from Anthropic',
          models: [
            {
              id: 'claude-3-opus',
              name: 'Claude 3 Opus',
              description: 'Most powerful Claude model',
              maxTokens: 200000,
              inputCostPer1k: 0.015,
              outputCostPer1k: 0.075,
              capabilities: ['text', 'code', 'reasoning', 'long-context'],
            },
            {
              id: 'claude-3-sonnet',
              name: 'Claude 3 Sonnet',
              description: 'Balanced performance and speed',
              maxTokens: 200000,
              inputCostPer1k: 0.003,
              outputCostPer1k: 0.015,
              capabilities: ['text', 'code', 'reasoning', 'long-context'],
            },
          ],
          isConfigured: configuredProviders.has('anthropic'),
          isActive: configuredProviders.get('anthropic') || false,
        },
      ];

      return {
        success: true,
        data: providers,
      };

    } catch (error: any) {
      request.log.error('Failed to get LLM providers', { error: error.message });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_GET_LLM_PROVIDERS',
      });
    }
  });

  // Get LLM usage analytics
  fastify.get('/analytics', {
    preHandler: [fastify.authenticate, fastify.requirePermission('llm:read')],
    schema: {
      tags: ['platform.ai'],
      querystring: Type.Object({
        period: Type.Optional(Type.String({ default: '7d' })), // 24h, 7d, 30d
        provider: Type.Optional(Type.String()),
        model: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            summary: Type.Object({
              totalRequests: Type.Number(),
              totalTokens: Type.Number(),
              totalCost: Type.Number(),
              averageResponseTime: Type.Number(),
              successRate: Type.Number(),
            }),
            usage: Type.Array(Type.Object({
              date: Type.String(),
              requests: Type.Number(),
              tokens: Type.Number(),
              cost: Type.Number(),
              averageResponseTime: Type.Number(),
            })),
            byProvider: Type.Array(Type.Object({
              provider: Type.String(),
              requests: Type.Number(),
              tokens: Type.Number(),
              cost: Type.Number(),
            })),
            byModel: Type.Array(Type.Object({
              model: Type.String(),
              provider: Type.String(),
              requests: Type.Number(),
              tokens: Type.Number(),
              cost: Type.Number(),
            })),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { period = '7d', provider, model } = request.query as any;

    try {
      // Calculate date range
      const now = new Date();
      const daysBack = period === '24h' ? 1 : period === '7d' ? 7 : 30;
      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

      // Build where clause
      const where: any = {
        tenantId: request.user!.tenantId,
        createdAt: { gte: startDate },
      };

      if (provider) where.provider = provider;
      if (model) where.model = model;

      // Get summary stats
      const summary = await fastify.prisma.llmRequest.aggregate({
        where,
        _count: { id: true },
        _sum: { totalTokens: true },
        _avg: { processingTimeMs: true },
      });

      const successCount = await fastify.prisma.llmRequest.count({
        where: { ...where, status: 'completed' },
      });

      // Get usage by date
      const dailyUsage = await fastify.prisma.llmRequest.groupBy({
        by: ['createdAt'],
        where,
        _count: { id: true },
        _sum: { totalTokens: true },
        _avg: { processingTimeMs: true },
      });

      // Get usage by provider
      const providerUsage = await fastify.prisma.llmRequest.groupBy({
        by: ['provider'],
        where,
        _count: { id: true },
        _sum: { totalTokens: true },
      });

      // Get usage by model
      const modelUsage = await fastify.prisma.llmRequest.groupBy({
        by: ['model', 'provider'],
        where,
        _count: { id: true },
        _sum: { totalTokens: true },
      });

      // Mock cost calculation (would be based on actual pricing)
      const calculateCost = (tokens: number, provider: string) => {
        const costPer1k = provider === 'openai' ? 0.002 : 0.01;
        return (tokens / 1000) * costPer1k;
      };

      return {
        success: true,
        data: {
          summary: {
            totalRequests: summary._count.uuid as UUID,
            totalTokens: summary._sum.totalTokens || 0,
            totalCost: calculateCost(summary._sum.totalTokens || 0, 'openai'),
            averageResponseTime: summary._avg.processingTimeMs || 0,
            successRate: summary._count.id > 0 ? (successCount / summary._count.id) * 100 : 0,
          },
          usage: dailyUsage.map(day => ({
            date: day.createdAt.toISOString().split('T')[0],
            requests: day._count.uuid as UUID,
            tokens: day._sum.totalTokens || 0,
            cost: calculateCost(day._sum.totalTokens || 0, 'openai'),
            averageResponseTime: day._avg.processingTimeMs || 0,
          })),
          byProvider: providerUsage.map(p => ({
            provider: p.provider,
            requests: p._count.uuid as UUID,
            tokens: p._sum.totalTokens || 0,
            cost: calculateCost(p._sum.totalTokens || 0, p.provider),
          })),
          byModel: modelUsage.map(m => ({
            model: m.model,
            provider: m.provider,
            requests: m._count.uuid as UUID,
            tokens: m._sum.totalTokens || 0,
            cost: calculateCost(m._sum.totalTokens || 0, m.provider),
          })),
        },
      };

    } catch (error: any) {
      request.log.error('Failed to get LLM analytics', { error: error.message });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_GET_LLM_ANALYTICS',
      });
    }
  });

  // Manage API keys
  fastify.get('/api-keys', {
    preHandler: [fastify.authenticate, fastify.requirePermission('llm:admin')],
    schema: {
      tags: ['platform.ai'],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(Type.Object({
            provider: Type.String(),
            name: Type.String(),
            keyPreview: Type.String(),
            isActive: Type.Boolean(),
            createdAt: Type.String(),
            updatedAt: Type.String(),
          })),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const apiKeys = await fastify.prisma.llmApiKey.findMany({
        where: {
          tenantId: request.user!.tenantId,
        },
        select: {
          id: true,
          provider: true,
          name: true,
          keyHash: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        data: apiKeys.map(key => ({
          provider: key.provider,
          name: key.name,
          keyPreview: key.keyHash.substring(0, 8) + '...',
          isActive: key.isActive,
          createdAt: key.createdAt.toISOString(),
          updatedAt: key.updatedAt.toISOString(),
        })),
      };

    } catch (error: any) {
      request.log.error('Failed to get API keys', { error: error.message });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_GET_API_KEYS',
      });
    }
  });

  fastify.post('/api-keys', {
    preHandler: [fastify.authenticate, fastify.requirePermission('llm:admin')],
    schema: {
      tags: ['platform.ai'],
      body: Type.Object({
        provider: Type.String(),
        name: Type.String(),
        apiKey: Type.String(),
        isActive: Type.Optional(Type.Boolean({ default: true })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            provider: Type.String(),
            name: Type.String(),
            keyPreview: Type.String(),
            isActive: Type.Boolean(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { provider, name, apiKey, isActive = true } = request.body;

    try {
      // Hash the API key for storage (in real implementation, use proper encryption)
      const keyHash = Buffer.from(apiKey).toString('base64').substring(0, 32);

      const newApiKey = await fastify.prisma.llmApiKey.create({
        data: {
          tenantId: request.user!.tenantId,
          provider,
          name,
          keyHash,
          isActive,
        },
      });

      request.log.info('LLM API key created', {
        keyId: newApiKey.uuid as UUID,
        provider,
        name,
      });

      return reply.code(201).send({
        success: true,
        data: {
          provider: newApiKey.provider,
          name: newApiKey.name,
          keyPreview: keyHash.substring(0, 8) + '...',
          isActive: newApiKey.isActive,
        },
      });

    } catch (error: any) {
      request.log.error('Failed to create API key', { error: error.message });
      return reply.code(500).send({
        success: false,
        error: 'FAILED_TO_CREATE_API_KEY',
      });
    }
  });
};