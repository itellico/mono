import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { ConversationService } from '@/services/conversation.service';

export const conversationsRoutes: FastifyPluginAsync = async (fastify) => {
  // Create conversation service instance
  const conversationService = new ConversationService(fastify.prisma, fastify.redis, fastify.log);

  // Search/list user's conversations
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.messaging.read')
    ],
    schema: {
      tags: ['user.messaging'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        status: Type.Optional(Type.Union([
          Type.Literal('active'),
          Type.Literal('archived'),
          Type.Literal('closed'),
          Type.Literal('blocked'),
        ])),
        type: Type.Optional(Type.Union([
          Type.Literal('direct'),
          Type.Literal('group'),
          Type.Literal('support'),
          Type.Literal('business'),
        ])),
        search: Type.Optional(Type.String()),
        entityType: Type.Optional(Type.String()),
        entityId: Type.Optional(Type.String({ format: 'uuid' })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
        sortBy: Type.Optional(Type.Union([
          Type.Literal('lastMessageAt'),
          Type.Literal('createdAt'),
          Type.Literal('priority'),
        ])),
        sortOrder: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')])),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            conversations: Type.Array(Type.Object({
              uuid: uuidSchema,
              subject: Type.Optional(Type.String()),
              type: Type.String(),
              status: Type.String(),
              messageCount: Type.Number(),
              lastMessageAt: Type.Optional(Type.String()),
              createdAt: Type.String(),
              participants: Type.Array(Type.Object({
                user: Type.Object({
                  uuid: uuidSchema,
                  firstName: Type.String(),
                  lastName: Type.String(),
                  avatarUrl: Type.Optional(Type.String()),
                }),
                role: Type.String(),
                joinedAt: Type.String(),
                lastReadAt: Type.Optional(Type.String()),
              })),
              lastMessage: Type.Optional(Type.Object({
                content: Type.String(),
                messageType: Type.String(),
                createdAt: Type.String(),
                sender: Type.Object({
                  firstName: Type.String(),
                  lastName: Type.String(),
                }),
              })),
              _count: Type.Object({
                messages: Type.Number(),
              }),
            })),
            total: Type.Number(),
            hasMore: Type.Boolean(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const userId = request.user!.id;
    const tenantId = request.user!.tenantId;
    
    const result = await conversationService.searchConversations({
      ...request.query,
      tenantId,
      userId,
    });
    
    return {
      success: true,
      data: result,
    };
  });

  // Create new conversation
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('conversations:create')],
    schema: {
      tags: ['user.messaging'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        participantIds: Type.Array(Type.Number({ minimum: 1 }), { minItems: 1, maxItems: 9 }),
        subject: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
        type: Type.Optional(Type.Union([
          Type.Literal('direct'),
          Type.Literal('group'),
          Type.Literal('support'),
          Type.Literal('business'),
        ])),
        context: Type.Optional(Type.Object({
          entityType: Type.Optional(Type.String()),
          entityId: Type.Optional(Type.String({ format: 'uuid' })),
          metadata: Type.Optional(Type.Record(Type.String(), Type.Any())),
        })),
        settings: Type.Optional(Type.Object({
          allowInvites: Type.Optional(Type.Boolean()),
          autoArchiveAfter: Type.Optional(Type.Number({ minimum: 1 })),
          priority: Type.Optional(Type.Union([
            Type.Literal('low'),
            Type.Literal('normal'),
            Type.Literal('high'),
            Type.Literal('urgent'),
          ])),
        })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            conversation: Type.Object({
              uuid: uuidSchema,
              subject: Type.Optional(Type.String()),
              type: Type.String(),
              status: Type.String(),
              createdAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const userId = request.user!.id;
    const tenantId = request.user!.tenantId;
    
    const conversation = await conversationService.createConversation({
      ...request.body,
      tenantId,
      createdById: userId,
    });
    
    return reply.code(201).send({
      success: true,
      data: {
        conversation: {
          uuid: conversation.uuid,
          subject: conversation.subject,
          type: conversation.type,
          status: conversation.status,
          createdAt: conversation.createdAt.toISOString(),
        },
      },
    });
  });

  // Get conversation by UUID with messages
  fastify.get('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.messaging.read')
    ],
    schema: {
      tags: ['user.messaging'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      querystring: Type.Object({
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 50 })),
        offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            conversation: Type.Any(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const { limit = 50, offset = 0 } = request.query;
    const userId = request.user!.id;
    
    const conversation = await conversationService.getConversationByUuid(uuid, userId, limit, offset);
    
    if (!conversation) {
      return reply.code(404).send({
        success: false,
        error: 'CONVERSATION_NOT_FOUND',
      });
    }
    
    return {
      success: true,
      data: { conversation },
    };
  });

  // Update conversation
  fastify.patch('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('conversations:update')],
    schema: {
      tags: ['user.messaging'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        subject: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
        status: Type.Optional(Type.Union([
          Type.Literal('active'),
          Type.Literal('archived'),
          Type.Literal('closed'),
          Type.Literal('blocked'),
        ])),
        settings: Type.Optional(Type.Object({
          allowInvites: Type.Optional(Type.Boolean()),
          autoArchiveAfter: Type.Optional(Type.Number({ minimum: 1 })),
          priority: Type.Optional(Type.Union([
            Type.Literal('low'),
            Type.Literal('normal'),
            Type.Literal('high'),
            Type.Literal('urgent'),
          ])),
        })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            conversation: Type.Object({
              uuid: uuidSchema,
              subject: Type.Optional(Type.String()),
              status: Type.String(),
              updatedAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const userId = request.user!.id;
    
    // Get conversation ID from UUID
    const existingConversation = await fastify.prisma.conversation.findUnique({
      where: { tenantId: request.user.tenantId, uuid },
    });
    
    if (!existingConversation) {
      return reply.code(404).send({
        success: false,
        error: 'CONVERSATION_NOT_FOUND',
      });
    }
    
    try {
      const conversation = await conversationService.updateConversation({
        ...request.body,
      }, userId);
      
      return {
        success: true,
        data: {
          conversation: {
            uuid: conversation.uuid,
            subject: conversation.subject,
            status: conversation.status,
            updatedAt: conversation.updatedAt.toISOString(),
          },
        },
      };
    } catch (error: any) {
      return reply.code(403).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Send message in conversation
  fastify.post('/:uuid/messages', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.messaging.read')
    ],
    schema: {
      tags: ['user.messaging'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        content: Type.String({ minLength: 1, maxLength: 10000 }),
        messageType: Type.Optional(Type.Union([
          Type.Literal('text'),
          Type.Literal('file'),
          Type.Literal('image'),
          Type.Literal('system'),
          Type.Literal('notification'),
        ])),
        attachments: Type.Optional(Type.Array(Type.Object({
          url: Type.String({ format: 'uri' }),
          filename: Type.String(),
          size: Type.Number({ minimum: 1 }),
          mimeType: Type.String(),
          thumbnail: Type.Optional(Type.String({ format: 'uri' })),
        }))),
        replyToId: Type.Optional(Type.Number({ minimum: 1 })),
        metadata: Type.Optional(Type.Record(Type.String(), Type.Any())),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.Object({
              uuid: uuidSchema,
              content: Type.String(),
              messageType: Type.String(),
              createdAt: Type.String(),
              sender: Type.Object({
                uuid: uuidSchema,
                firstName: Type.String(),
                lastName: Type.String(),
                avatarUrl: Type.Optional(Type.String()),
              }),
              replyTo: Type.Optional(Type.Object({
                content: Type.String(),
                sender: Type.Object({
                  firstName: Type.String(),
                  lastName: Type.String(),
                }),
              })),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const userId = request.user!.id;
    
    // Get conversation ID from UUID
    const conversation = await fastify.prisma.conversation.findUnique({
      where: { tenantId: request.user.tenantId, uuid },
    });
    
    if (!conversation) {
      return reply.code(404).send({
        success: false,
        error: 'CONVERSATION_NOT_FOUND',
      });
    }
    
    try {
      const message = await conversationService.sendMessage({
        ...request.body,
        conversationId: conversation.uuid as UUID,
        senderId: userId,
      });
      
      return reply.code(201).send({
        success: true,
        data: { message },
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Search messages in conversation
  fastify.get('/:uuid/messages', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.messaging.read')
    ],
    schema: {
      tags: ['user.messaging'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      querystring: Type.Object({
        search: Type.Optional(Type.String()),
        messageType: Type.Optional(Type.Union([
          Type.Literal('text'),
          Type.Literal('file'),
          Type.Literal('image'),
          Type.Literal('system'),
          Type.Literal('notification'),
        ])),
        senderId: Type.Optional(Type.Number({ minimum: 1 })),
        beforeMessageId: Type.Optional(Type.Number({ minimum: 1 })),
        afterMessageId: Type.Optional(Type.Number({ minimum: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 50 })),
        offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            messages: Type.Array(Type.Any()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const userId = request.user!.id;
    
    // Get conversation ID from UUID
    const conversation = await fastify.prisma.conversation.findUnique({
      where: { tenantId: request.user.tenantId, uuid },
    });
    
    if (!conversation) {
      return reply.code(404).send({
        success: false,
        error: 'CONVERSATION_NOT_FOUND',
      });
    }
    
    try {
      const messages = await conversationService.searchMessages({
        ...request.query,
        conversationId: conversation.uuid as UUID,
      }, userId);
      
      return {
        success: true,
        data: { messages },
      };
    } catch (error: any) {
      return reply.code(403).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Get conversation statistics
  fastify.get('/:uuid/stats', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.messaging.read')
    ],
    schema: {
      tags: ['user.messaging'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            totalMessages: Type.Number(),
            messagesByType: Type.Record(Type.String(), Type.Number()),
            participantCount: Type.Number(),
            createdAt: Type.String(),
            lastMessageAt: Type.Optional(Type.String()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const userId = request.user!.id;
    
    // Get conversation ID from UUID
    const conversation = await fastify.prisma.conversation.findUnique({
      where: { tenantId: request.user.tenantId, uuid },
    });
    
    if (!conversation) {
      return reply.code(404).send({
        success: false,
        error: 'CONVERSATION_NOT_FOUND',
      });
    }
    
    try {
      const stats = await conversationService.getConversationStats(conversation.uuid as UUID, userId);
      
      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      return reply.code(403).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Add participant to conversation
  fastify.post('/:uuid/participants', {
    preHandler: [fastify.authenticate, fastify.requirePermission('conversations:manage')],
    schema: {
      tags: ['user.messaging'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        userId: Type.Number({ minimum: 1 }),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            participant: Type.Object({
              userId: Type.Number(),
              role: Type.String(),
              joinedAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const { userId: newUserId } = request.body;
    const currentUserId = request.user!.id;
    
    // Get conversation ID from UUID
    const conversation = await fastify.prisma.conversation.findUnique({
      where: { tenantId: request.user.tenantId, uuid },
    });
    
    if (!conversation) {
      return reply.code(404).send({
        success: false,
        error: 'CONVERSATION_NOT_FOUND',
      });
    }
    
    try {
      const participant = await conversationService.addParticipant(
        conversation.uuid as UUID,
        newUserId,
        currentUserId
      );
      
      return reply.code(201).send({
        success: true,
        data: {
          participant: {
            userId: participant.userId,
            role: participant.role,
            joinedAt: participant.joinedAt.toISOString(),
          },
        },
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Remove participant from conversation
  fastify.delete('/:uuid/participants/:userId', {
    preHandler: [fastify.authenticate, fastify.requirePermission('conversations:manage')],
    schema: {
      tags: ['user.messaging'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
        userId: Type.Number({ minimum: 1 }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    const { uuid, userId: targetUserId } = request.params;
    const currentUserId = request.user!.id;
    
    // Get conversation ID from UUID
    const conversation = await fastify.prisma.conversation.findUnique({
      where: { tenantId: request.user.tenantId, uuid },
    });
    
    if (!conversation) {
      return reply.code(404).send({
        success: false,
        error: 'CONVERSATION_NOT_FOUND',
      });
    }
    
    try {
      await conversationService.removeParticipant(
        conversation.uuid as UUID,
        targetUserId,
        currentUserId
      );
      
      return {
        success: true,
        message: 'Participant removed successfully',
      };
    } catch (error: any) {
      return reply.code(403).send({
        success: false,
        error: error.message,
      });
    }
  });
};