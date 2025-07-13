import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * Account Business AI Routes
 * AI and LLM features for business
 */
export const accountAIRoutes: FastifyPluginAsync = async (fastify) => {
  // Get AI models
  fastify.get('/models', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.ai.read')],
    schema: {
      tags: ['account.business'],
      summary: 'Get AI models',
      description: 'Get available AI models and their capabilities',
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            models: Type.Array(Type.Object({
              id: Type.String(),
              name: Type.String(),
              provider: Type.String(),
              description: Type.String(),
              capabilities: Type.Array(Type.String()),
              pricing: Type.Object({
                inputCost: Type.Number(),
                outputCost: Type.Number(),
                unit: Type.String(),
              }),
              limits: Type.Object({
                maxTokens: Type.Number(),
                contextWindow: Type.Number(),
                rateLimit: Type.Number(),
              }),
              status: Type.String(),
            })),
          }),
        }),
      },
    },
    async handler(request, reply) {
      try {
        const models = [
          {
            id: 'gpt-4-turbo',
            name: 'GPT-4 Turbo',
            provider: 'openai',
            description: 'Most capable GPT-4 model for complex tasks',
            capabilities: ['text-generation', 'chat', 'analysis', 'coding'],
            pricing: {
              inputCost: 0.01,
              outputCost: 0.03,
              unit: 'per 1K tokens',
            },
            limits: {
              maxTokens: 4096,
              contextWindow: 128000,
              rateLimit: 10000,
            },
            status: 'active',
          },
          {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            provider: 'openai',
            description: 'Fast and efficient for most tasks',
            capabilities: ['text-generation', 'chat', 'summarization'],
            pricing: {
              inputCost: 0.0005,
              outputCost: 0.0015,
              unit: 'per 1K tokens',
            },
            limits: {
              maxTokens: 4096,
              contextWindow: 16385,
              rateLimit: 90000,
            },
            status: 'active',
          },
          {
            id: 'claude-3-opus',
            name: 'Claude 3 Opus',
            provider: 'anthropic',
            description: 'Powerful model for complex reasoning',
            capabilities: ['text-generation', 'chat', 'analysis', 'coding'],
            pricing: {
              inputCost: 0.015,
              outputCost: 0.075,
              unit: 'per 1K tokens',
            },
            limits: {
              maxTokens: 4096,
              contextWindow: 200000,
              rateLimit: 5000,
            },
            status: 'active',
          },
          {
            id: 'dalle-3',
            name: 'DALL-E 3',
            provider: 'openai',
            description: 'Advanced image generation',
            capabilities: ['image-generation'],
            pricing: {
              inputCost: 0.04,
              outputCost: 0,
              unit: 'per image',
            },
            limits: {
              maxTokens: 0,
              contextWindow: 4000,
              rateLimit: 50,
            },
            status: 'active',
          },
          {
            id: 'whisper-1',
            name: 'Whisper',
            provider: 'openai',
            description: 'Speech to text transcription',
            capabilities: ['transcription', 'translation'],
            pricing: {
              inputCost: 0.006,
              outputCost: 0,
              unit: 'per minute',
            },
            limits: {
              maxTokens: 0,
              contextWindow: 0,
              rateLimit: 50,
            },
            status: 'active',
          },
        ];

        return {
          success: true,
          data: {
            models,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get AI models');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_AI_MODELS',
        });
      }
    },
  });

  // Get AI assistants
  fastify.get('/assistants', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.ai.read')],
    schema: {
      tags: ['account.business'],
      summary: 'Get AI assistants',
      description: 'Get configured AI assistants for the account',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        type: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            assistants: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              description: Type.Optional(Type.String()),
              type: Type.String(),
              model: Type.String(),
              instructions: Type.String(),
              temperature: Type.Number(),
              tools: Type.Array(Type.String()),
              metadata: Type.Object({}, { additionalProperties: true }),
              isActive: Type.Boolean(),
              usageCount: Type.Number(),
              lastUsedAt: Type.Optional(Type.String()),
              createdBy: Type.Object({
                name: Type.String(),
              }),
              createdAt: Type.String(),
              updatedAt: Type.String(),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              totalPages: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { page = 1, limit = 20, search, type } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          accountId: request.user!.accountId,
        };

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ];
        }

        if (type) {
          where.type = type;
        }

        const [assistants, total] = await Promise.all([
          fastify.prisma.aiAssistant.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { lastUsedAt: 'desc' },
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
              _count: {
                select: {
                  conversations: true,
                },
              },
            },
          }),
          fastify.prisma.aiAssistant.count({ where }),
        ]);

        return {
          success: true,
          data: {
            assistants: assistants.map(assistant => ({
              uuid: assistant.uuid,
              name: assistant.name,
              description: assistant.description,
              type: assistant.type,
              model: assistant.model,
              instructions: assistant.instructions,
              temperature: assistant.temperature,
              tools: assistant.tools,
              metadata: assistant.metadata,
              isActive: assistant.isActive,
              usageCount: assistant._count.conversations,
              lastUsedAt: assistant.lastUsedAt?.toISOString(),
              createdBy: assistant.createdBy,
              createdAt: assistant.createdAt.toISOString(),
              updatedAt: assistant.updatedAt.toISOString(),
            })),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get AI assistants');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_AI_ASSISTANTS',
        });
      }
    },
  });

  // Create AI assistant
  fastify.post('/assistants', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.ai.create')],
    schema: {
      tags: ['account.business'],
      summary: 'Create AI assistant',
      description: 'Create a new AI assistant',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        description: Type.Optional(Type.String()),
        type: Type.String(),
        model: Type.String(),
        instructions: Type.String(),
        temperature: Type.Optional(Type.Number({ minimum: 0, maximum: 2, default: 0.7 })),
        tools: Type.Optional(Type.Array(Type.String())),
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            assistant: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { name, description, type, model, instructions, temperature = 0.7, tools = [], metadata } = request.body;

      try {
        const assistant = await fastify.prisma.aiAssistant.create({
          data: {
            name,
            description,
            type,
            model,
            instructions,
            temperature,
            tools,
            metadata: metadata || {},
            isActive: true,
            accountId: request.user!.accountId,
            createdById: request.user!.id,
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            assistant: {
              uuid: assistant.uuid,
              name: assistant.name,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to create AI assistant');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CREATE_AI_ASSISTANT',
        });
      }
    },
  });

  // Chat with assistant
  fastify.post('/assistants/:uuid/chat', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.ai.execute')],
    schema: {
      tags: ['account.business'],
      summary: 'Chat with assistant',
      description: 'Send a message to an AI assistant',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        message: Type.String({ minLength: 1 }),
        conversationId: Type.Optional(Type.String()),
        context: Type.Optional(Type.Object({}, { additionalProperties: true })),
        stream: Type.Optional(Type.Boolean({ default: false })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            response: Type.String(),
            conversationId: Type.String(),
            messageId: Type.String(),
            usage: Type.Object({
              promptTokens: Type.Number(),
              completionTokens: Type.Number(),
              totalTokens: Type.Number(),
              cost: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { message, conversationId, context, stream } = request.body;

      try {
        const assistant = await fastify.prisma.aiAssistant.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId,
            isActive: true, },
        });

        if (!assistant) {
          return reply.status(404).send({
            success: false,
            error: 'AI_ASSISTANT_NOT_FOUND',
          });
        }

        // Get or create conversation
        let conversation;
        if (conversationId) {
          conversation = await fastify.prisma.aiConversation.findFirst({
            where: { tenantId: request.user.tenantId, uuid: conversationId,
              assistantId: assistant.uuid as UUID,
              userId: request.user!.id, },
          });
        }

        if (!conversation) {
          conversation = await fastify.prisma.aiConversation.create({
            data: {
              assistantId: assistant.uuid as UUID,
              userId: request.user!.id,
              metadata: context || {},
            },
          });
        }

        // Save user message
        const userMessage = await fastify.prisma.aiMessage.create({
          data: {
            conversationId: conversation.uuid as UUID,
            role: 'user',
            content: message,
          },
        });

        // TODO: Implement actual AI call based on provider
        // For now, simulate response
        const aiResponse = `I understand you said: "${message}". This is a simulated response from the ${assistant.name} assistant using ${assistant.model}.`;
        const usage = {
          promptTokens: Math.floor(message.length / 4),
          completionTokens: Math.floor(aiResponse.length / 4),
          totalTokens: 0,
          cost: 0,
        };
        usage.totalTokens = usage.promptTokens + usage.completionTokens;
        usage.cost = (usage.promptTokens * 0.01 + usage.completionTokens * 0.03) / 1000;

        // Save AI response
        const assistantMessage = await fastify.prisma.aiMessage.create({
          data: {
            conversationId: conversation.uuid as UUID,
            role: 'assistant',
            content: aiResponse,
            metadata: {
              model: assistant.model,
              usage,
            },
          },
        });

        // Update assistant usage
        await fastify.prisma.aiAssistant.update({
          where: { tenantId: request.user.tenantId },
          data: {
            lastUsedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            response: aiResponse,
            conversationId: conversation.uuid,
            messageId: assistantMessage.uuid,
            usage,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to chat with assistant');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CHAT_WITH_ASSISTANT',
        });
      }
    },
  });

  // Get conversations
  fastify.get('/conversations', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.ai.read')],
    schema: {
      tags: ['account.business'],
      summary: 'Get conversations',
      description: 'Get AI conversation history',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        assistantId: Type.Optional(Type.Number()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            conversations: Type.Array(Type.Object({
              uuid: uuidSchema,
              assistant: Type.Object({
                name: Type.String(),
                model: Type.String(),
              }),
              messageCount: Type.Number(),
              lastMessage: Type.Optional(Type.Object({
                role: Type.String(),
                content: Type.String(),
                createdAt: Type.String(),
              })),
              createdAt: Type.String(),
              updatedAt: Type.String(),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              totalPages: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { page = 1, limit = 20, assistantId } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          userId: request.user!.id,
        };

        if (assistantId) {
          where.assistantId = assistantId;
        }

        const [conversations, total] = await Promise.all([
          fastify.prisma.aiConversation.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { updatedAt: 'desc' },
            include: {
              assistant: {
                select: {
                  id: true,
                  name: true,
                  model: true,
                },
              },
              _count: {
                select: {
                  messages: true,
                },
              },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  role: true,
                  content: true,
                  createdAt: true,
                },
              },
            },
          }),
          fastify.prisma.aiConversation.count({ where }),
        ]);

        return {
          success: true,
          data: {
            conversations: conversations.map(conv => ({
              uuid: conv.uuid,
              assistant: conv.assistant,
              messageCount: conv._count.messages,
              lastMessage: conv.messages[0] ? {
                role: conv.messages[0].role,
                content: conv.messages[0].content,
                createdAt: conv.messages[0].createdAt.toISOString(),
              } : undefined,
              createdAt: conv.createdAt.toISOString(),
              updatedAt: conv.updatedAt.toISOString(),
            })),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get conversations');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_CONVERSATIONS',
        });
      }
    },
  });

  // Get conversation messages
  fastify.get('/conversations/:uuid/messages', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.ai.read')],
    schema: {
      tags: ['account.business'],
      summary: 'Get conversation messages',
      description: 'Get messages from a conversation',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 50 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            messages: Type.Array(Type.Object({
              uuid: uuidSchema,
              role: Type.String(),
              content: Type.String(),
              metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
              createdAt: Type.String(),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              totalPages: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { page = 1, limit = 50 } = request.query;
      const offset = (page - 1) * limit;

      try {
        const conversation = await fastify.prisma.aiConversation.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            userId: request.user!.id, },
        });

        if (!conversation) {
          return reply.status(404).send({
            success: false,
            error: 'CONVERSATION_NOT_FOUND',
          });
        }

        const [messages, total] = await Promise.all([
          fastify.prisma.aiMessage.findMany({
            where: { tenantId: request.user.tenantId, conversationId: conversation.uuid as UUID, },
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'asc' },
          }),
          fastify.prisma.aiMessage.count({
            where: { tenantId: request.user.tenantId, conversationId: conversation.uuid as UUID, },
          }),
        ]);

        return {
          success: true,
          data: {
            messages: messages.map(msg => ({
              uuid: msg.uuid,
              role: msg.role,
              content: msg.content,
              metadata: msg.metadata,
              createdAt: msg.createdAt.toISOString(),
            })),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get conversation messages');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_CONVERSATION_MESSAGES',
        });
      }
    },
  });

  // Generate content
  fastify.post('/generate', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.ai.execute')],
    schema: {
      tags: ['account.business'],
      summary: 'Generate content',
      description: 'Generate content using AI',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        type: Type.String(),
        prompt: Type.String({ minLength: 1 }),
        model: Type.Optional(Type.String()),
        parameters: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            content: Type.Any(),
            type: Type.String(),
            model: Type.String(),
            usage: Type.Object({
              promptTokens: Type.Number(),
              completionTokens: Type.Number(),
              totalTokens: Type.Number(),
              cost: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { type, prompt, model = 'gpt-3.5-turbo', parameters } = request.body;

      try {
        // TODO: Implement actual content generation based on type
        let content;
        let usage = {
          promptTokens: Math.floor(prompt.length / 4),
          completionTokens: 0,
          totalTokens: 0,
          cost: 0,
        };

        switch (type) {
          case 'text':
            content = `Generated text based on prompt: "${prompt}". This is a placeholder response.`;
            usage.completionTokens = Math.floor(content.length / 4);
            break;
            
          case 'image':
            content = {
              url: 'https://via.placeholder.com/512x512.png?text=AI+Generated+Image',
              prompt: prompt,
              revised_prompt: `Enhanced: ${prompt}`,
            };
            usage.completionTokens = 0;
            usage.cost = 0.04; // Fixed cost per image
            break;
            
          case 'code':
            content = `// Generated code based on: ${prompt}\nfunction example() {\n  console.log('This is generated code');\n}`;
            usage.completionTokens = Math.floor(content.length / 4);
            break;
            
          default:
            return reply.status(400).send({
              success: false,
              error: 'UNSUPPORTED_CONTENT_TYPE:_${TYPE}',
            });
        }

        usage.totalTokens = usage.promptTokens + usage.completionTokens;
        if (type !== 'image') {
          usage.cost = (usage.promptTokens * 0.0005 + usage.completionTokens * 0.0015) / 1000;
        }

        // Log generation
        await fastify.prisma.aiGeneration.create({
          data: {
            type,
            prompt,
            model,
            parameters,
            output: content,
            usage,
            accountId: request.user!.accountId,
            userId: request.user!.id,
          },
        });

        return {
          success: true,
          data: {
            content,
            type,
            model,
            usage,
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to generate content');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GENERATE_CONTENT',
        });
      }
    },
  });

  // Update assistant
  fastify.put('/assistants/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.ai.update')],
    schema: {
      tags: ['account.business'],
      summary: 'Update AI assistant',
      description: 'Update AI assistant configuration',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1 })),
        description: Type.Optional(Type.String()),
        instructions: Type.Optional(Type.String()),
        temperature: Type.Optional(Type.Number({ minimum: 0, maximum: 2 })),
        tools: Type.Optional(Type.Array(Type.String())),
        metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
        isActive: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const updates = request.body;

      try {
        const assistant = await fastify.prisma.aiAssistant.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!assistant) {
          return reply.status(404).send({
            success: false,
            error: 'AI_ASSISTANT_NOT_FOUND',
          });
        }

        await fastify.prisma.aiAssistant.update({
          where: { tenantId: request.user.tenantId },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'AI assistant updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update AI assistant');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_AI_ASSISTANT',
        });
      }
    },
  });

  // Delete assistant
  fastify.delete('/assistants/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.ai.delete')],
    schema: {
      tags: ['account.business'],
      summary: 'Delete AI assistant',
      description: 'Delete an AI assistant',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const assistant = await fastify.prisma.aiAssistant.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
          include: {
            _count: {
              select: {
                conversations: true,
              },
            },
          },
        });

        if (!assistant) {
          return reply.status(404).send({
            success: false,
            error: 'AI_ASSISTANT_NOT_FOUND',
          });
        }

        // Soft delete if has conversations
        if (assistant._count.conversations > 0) {
          await fastify.prisma.aiAssistant.update({
            where: { tenantId: request.user.tenantId },
            data: {
              isActive: false,
              deletedAt: new Date(),
            },
          });
        } else {
          await fastify.prisma.aiAssistant.delete({
            where: { tenantId: request.user.tenantId },
          });
        }

        return {
          success: true,
          data: {
            message: 'AI assistant deleted successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to delete AI assistant');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_AI_ASSISTANT',
        });
      }
    },
  });
};