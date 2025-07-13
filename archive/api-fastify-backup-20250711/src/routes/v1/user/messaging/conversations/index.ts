import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * User Messaging Conversations Routes
 * Manage conversations and messages
 */
export const userConversationsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get conversations
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.messaging.conversations.read')
    ],
    schema: {
      tags: ['user.messaging.conversations'],
      summary: 'Get conversations',
      description: 'Get user\'s conversations',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        filter: Type.Optional(Type.Union([
          Type.Literal('all'),
          Type.Literal('unread'),
          Type.Literal('archived'),
        ])),
        search: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            conversations: Type.Array(Type.Object({
              uuid: uuidSchema,
              type: Type.String(),
              title: Type.Optional(Type.String()),
              lastMessage: Type.Optional(Type.Object({
                content: Type.String(),
                sentAt: Type.String(),
                sender: Type.Object({
                  name: Type.String(),
                }),
              })),
              participants: Type.Array(Type.Object({
                name: Type.String(),
                profilePhoto: Type.Optional(Type.String()),
                isOnline: Type.Boolean(),
              })),
              unreadCount: Type.Number(),
              isArchived: Type.Boolean(),
              isPinned: Type.Boolean(),
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
      const { page = 1, limit = 20, filter = 'all', search } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          participants: {
            some: {
              userId: request.user!.id,
            },
          },
        };

        if (filter === 'archived') {
          where.participants = {
            some: {
              userId: request.user!.id,
              isArchived: true,
            },
          };
        } else if (filter === 'unread') {
          where.messages = {
            some: {
              NOT: {
                senderId: request.user!.id,
              },
              readBy: {
                none: {
                  userId: request.user!.id,
                },
              },
            },
          };
        }

        if (search) {
          where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            {
              participants: {
                some: {
                  user: {
                    name: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            },
          ];
        }

        const [conversations, total] = await Promise.all([
          fastify.prisma.conversation.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { updatedAt: 'desc' },
            include: {
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      profilePhotoUrl: true,
                      lastActiveAt: true,
                    },
                  },
                },
              },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                  sender: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  messages: {
                    where: { tenantId: request.user.tenantId, NOT: {
                        senderId: request.user!.id, },
                      readBy: {
                        none: {
                          userId: request.user!.id,
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
          fastify.prisma.conversation.count({ where }),
        ]);

        return {
          success: true,
          data: {
            conversations: conversations.map(conv => {
              const userParticipant = conv.participants.find(p => p.userId === request.user!.id);
              const otherParticipants = conv.participants.filter(p => p.userId !== request.user!.id);

              return {
                uuid: conv.uuid,
                type: conv.type,
                title: conv.title,
                lastMessage: conv.messages[0] ? {
                  content: conv.messages[0].content,
                  sentAt: conv.messages[0].createdAt.toISOString(),
                  sender: conv.messages[0].sender,
                } : undefined,
                participants: otherParticipants.map(p => ({
                  id: p.user.uuid as UUID,
                  name: p.user.name,
                  profilePhoto: p.user.profilePhotoUrl,
                  isOnline: p.user.lastActiveAt ? 
                    (Date.now() - p.user.lastActiveAt.getTime()) < 5 * 60 * 1000 : false,
                })),
                unreadCount: conv._count.messages,
                isArchived: userParticipant?.isArchived || false,
                isPinned: userParticipant?.isPinned || false,
                updatedAt: conv.updatedAt.toISOString(),
              };
            }),
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

  // Get conversation details with messages
  fastify.get('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.messaging.conversations.read')
    ],
    schema: {
      tags: ['user.messaging.conversations'],
      summary: 'Get conversation',
      description: 'Get conversation details with messages',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      querystring: Type.Object({
        messagesPage: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        messagesLimit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 20 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            conversation: Type.Object({
              uuid: uuidSchema,
              type: Type.String(),
              title: Type.Optional(Type.String()),
              participants: Type.Array(Type.Object({
                name: Type.String(),
                profilePhoto: Type.Optional(Type.String()),
                isOnline: Type.Boolean(),
                role: Type.String(),
              })),
              settings: Type.Object({
                isArchived: Type.Boolean(),
                isPinned: Type.Boolean(),
                isMuted: Type.Boolean(),
              }),
            }),
            messages: Type.Array(Type.Object({
              uuid: uuidSchema,
              content: Type.String(),
              type: Type.String(),
              sender: Type.Object({
                name: Type.String(),
                profilePhoto: Type.Optional(Type.String()),
              }),
              attachments: Type.Array(Type.Object({
                url: Type.String(),
                name: Type.String(),
                size: Type.Number(),
                type: Type.String(),
              })),
              isEdited: Type.Boolean(),
              isDeleted: Type.Boolean(),
              readBy: Type.Array(Type.Object({
                userId: Type.Number(),
                readAt: Type.String(),
              })),
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
      const { messagesPage = 1, messagesLimit = 20 } = request.query;
      const offset = (messagesPage - 1) * messagesLimit;

      try {
        const conversation = await fastify.prisma.conversation.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            participants: {
              some: {
                userId: request.user!.id, },
            },
          },
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profilePhotoUrl: true,
                    lastActiveAt: true,
                  },
                },
              },
            },
          },
        });

        if (!conversation) {
          return reply.status(404).send({
            success: false,
            error: 'CONVERSATION_NOT_FOUND',
          });
        }

        // Get messages
        const [messages, totalMessages] = await Promise.all([
          fastify.prisma.message.findMany({
            where: { tenantId: request.user.tenantId, conversationId: conversation.uuid as UUID,
              isDeleted: false, },
            skip: offset,
            take: messagesLimit,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  profilePhotoUrl: true,
                },
              },
              attachments: true,
              readBy: {
                select: {
                  userId: true,
                  readAt: true,
                },
              },
            },
          }),
          fastify.prisma.message.count({
            where: { tenantId: request.user.tenantId, conversationId: conversation.uuid as UUID,
              isDeleted: false, },
          }),
        ]);

        // Mark messages as read
        await fastify.prisma.messageRead.createMany({
          data: messages
            .filter(m => m.senderId !== request.user!.id)
            .filter(m => !m.readBy.some(r => r.userId === request.user!.id))
            .map(m => ({
              messageId: m.uuid as UUID,
              userId: request.user!.id,
              readAt: new Date(),
            })),
          skipDuplicates: true,
        });

        const userParticipant = conversation.participants.find(p => p.userId === request.user!.id);

        return {
          success: true,
          data: {
            conversation: {
              uuid: conversation.uuid,
              type: conversation.type,
              title: conversation.title,
              participants: conversation.participants.map(p => ({
                id: p.user.uuid as UUID,
                name: p.user.name,
                profilePhoto: p.user.profilePhotoUrl,
                isOnline: p.user.lastActiveAt ? 
                  (Date.now() - p.user.lastActiveAt.getTime()) < 5 * 60 * 1000 : false,
                role: p.role,
              })),
              settings: {
                isArchived: userParticipant?.isArchived || false,
                isPinned: userParticipant?.isPinned || false,
                isMuted: userParticipant?.isMuted || false,
              },
            },
            messages: messages.reverse().map(msg => ({
              uuid: msg.uuid,
              content: msg.content,
              type: msg.type,
              sender: msg.sender,
              attachments: msg.attachments.map(att => ({
                url: att.url,
                name: att.name,
                size: att.size,
                type: att.type,
              })),
              isEdited: msg.isEdited,
              isDeleted: msg.isDeleted,
              readBy: msg.readBy.map(r => ({
                userId: r.userId,
                readAt: r.readAt.toISOString(),
              })),
              createdAt: msg.createdAt.toISOString(),
            })),
            pagination: {
              page: messagesPage,
              limit: messagesLimit,
              total: totalMessages,
              totalPages: Math.ceil(totalMessages / messagesLimit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get conversation');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_CONVERSATION',
        });
      }
    },
  });

  // Create conversation
  fastify.post('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.messaging.conversations.read')
    ],
    schema: {
      tags: ['user.messaging.conversations'],
      summary: 'Create conversation',
      description: 'Start a new conversation',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        participantIds: Type.Array(Type.Number(), { minItems: 1 }),
        title: Type.Optional(Type.String()),
        type: Type.Optional(Type.Union([
          Type.Literal('direct'),
          Type.Literal('group'),
        ])),
        initialMessage: Type.Optional(Type.String()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            conversation: Type.Object({
              uuid: uuidSchema,
              type: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { participantIds, title, type, initialMessage } = request.body;

      try {
        // Add current user to participants
        const allParticipantIds = [...new Set([...participantIds, request.user!.id])];
        const conversationType = type || (allParticipantIds.length === 2 ? 'direct' : 'group');

        // Check for existing direct conversation
        if (conversationType === 'direct' && allParticipantIds.length === 2) {
          const existingConversation = await fastify.prisma.conversation.findFirst({
            where: { tenantId: request.user.tenantId, type: 'direct',
              AND: allParticipantIds.map(userId => ({
                participants: {
                  some: { userId },
                },
              })),
            },
          });

          if (existingConversation) {
            return reply.status(200).send({
              success: true,
              data: {
                conversation: {
                  uuid: existingConversation.uuid,
                  type: existingConversation.type,
                },
              },
            });
          }
        }

        // Create new conversation
        const conversation = await fastify.prisma.conversation.create({
          data: {
            type: conversationType,
            title: title || null,
            tenantId: request.user!.tenantId,
            participants: {
              create: allParticipantIds.map((userId, index) => ({
                userId,
                role: userId === request.user!.id ? 'owner' : 'member',
                joinedAt: new Date(),
              })),
            },
            messages: initialMessage ? {
              create: {
                senderId: request.user!.id,
                content: initialMessage,
                type: 'text',
              },
            } : undefined,
          },
        });

        // Send notifications to other participants
        const otherParticipants = allParticipantIds.filter(id => id !== request.user!.id);
        await Promise.all(
          otherParticipants.map(userId =>
            fastify.prisma.notification.create({
              data: {
                userId,
                type: 'new_conversation',
                title: 'New Conversation',
                content: `You've been added to a new conversation`,
                data: {
                  conversationId: conversation.uuid as UUID,
                },
              },
            })
          )
        );

        return reply.status(201).send({
          success: true,
          data: {
            conversation: {
              uuid: conversation.uuid,
              type: conversation.type,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to create conversation');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CREATE_CONVERSATION',
        });
      }
    },
  });

  // Send message
  fastify.post('/:uuid/messages', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.messaging.conversations.read')
    ],
    schema: {
      tags: ['user.messaging.conversations'],
      summary: 'Send message',
      description: 'Send a message in a conversation',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        content: Type.String({ minLength: 1 }),
        type: Type.Optional(Type.Union([
          Type.Literal('text'),
          Type.Literal('image'),
          Type.Literal('file'),
        ])),
        attachmentIds: Type.Optional(Type.Array(Type.Number())),
        replyToId: Type.Optional(Type.Number()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.Object({
              uuid: uuidSchema,
              content: Type.String(),
              createdAt: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { content, type = 'text', attachmentIds, replyToId } = request.body;

      try {
        const conversation = await fastify.prisma.conversation.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            participants: {
              some: {
                userId: request.user!.id, },
            },
          },
          include: {
            participants: true,
          },
        });

        if (!conversation) {
          return reply.status(404).send({
            success: false,
            error: 'CONVERSATION_NOT_FOUND',
          });
        }

        // Create message
        const message = await fastify.prisma.message.create({
          data: {
            conversationId: conversation.uuid as UUID,
            senderId: request.user!.id,
            content,
            type,
            replyToId,
            attachments: attachmentIds ? {
              create: attachmentIds.map((mediaId, index) => ({
                mediaAssetId: mediaId,
                order: index,
              })),
            } : undefined,
          },
        });

        // Update conversation timestamp
        await fastify.prisma.conversation.update({
          where: { tenantId: request.user.tenantId },
          data: { updatedAt: new Date() },
        });

        // Send notifications to other participants
        const otherParticipants = conversation.participants.filter(p => p.userId !== request.user!.id);
        await Promise.all(
          otherParticipants.map(participant =>
            fastify.prisma.notification.create({
              data: {
                userId: participant.userId,
                type: 'new_message',
                title: 'New Message',
                content: content.substring(0, 100),
                data: {
                  conversationId: conversation.uuid as UUID,
                  messageId: message.uuid as UUID,
                },
              },
            })
          )
        );

        return reply.status(201).send({
          success: true,
          data: {
            message: {
              uuid: message.uuid,
              content: message.content,
              createdAt: message.createdAt.toISOString(),
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to send message');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_SEND_MESSAGE',
        });
      }
    },
  });

  // Update conversation settings
  fastify.patch('/:uuid/settings', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('user.messaging.conversations.read')
    ],
    schema: {
      tags: ['user.messaging.conversations'],
      summary: 'Update conversation settings',
      description: 'Update user settings for a conversation',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        isArchived: Type.Optional(Type.Boolean()),
        isPinned: Type.Optional(Type.Boolean()),
        isMuted: Type.Optional(Type.Boolean()),
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
        const conversation = await fastify.prisma.conversation.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            participants: {
              some: {
                userId: request.user!.id, },
            },
          },
        });

        if (!conversation) {
          return reply.status(404).send({
            success: false,
            error: 'CONVERSATION_NOT_FOUND',
          });
        }

        await fastify.prisma.conversationParticipant.update({
          where: { tenantId: request.user.tenantId, conversationId_userId: {
              conversationId: conversation.uuid as UUID,
              userId: request.user!.id, },
          },
          data: updates,
        });

        return {
          success: true,
          data: {
            message: 'Conversation settings updated',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update conversation settings');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_CONVERSATION_SETTINGS',
        });
      }
    },
  });
};