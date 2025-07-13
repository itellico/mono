import { PrismaClient } from '@prisma/client';
import { FastifyRedis } from '@fastify/redis';
import { z } from 'zod';
import type { FastifyBaseLogger } from 'fastify';
import { getOrSetCache } from '../utils/cache-utils';

// Input validation schemas
const createConversationSchema = z.object({
  tenantId: z.number().int().positive(),
  createdById: z.number().int().positive(),
  participantIds: z.array(z.number().int().positive()).min(2).max(10),
  subject: z.string().min(1).max(200).optional(),
  type: z.enum(['direct', 'group', 'support', 'business']).default('direct'),
  context: z.object({
    entityType: z.string().optional(), // 'job', 'gig', 'support_ticket', etc.
    entityId: z.string().uuid().optional(),
    metadata: z.record(z.any()).optional(),
  }).optional(),
  settings: z.object({
    allowInvites: z.boolean().default(true),
    autoArchiveAfter: z.number().int().positive().optional(), // days
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  }).optional(),
});

const sendMessageSchema = z.object({
  conversationId: z.number().int().positive(),
  senderId: z.number().int().positive(),
  content: z.string().min(1).max(10000),
  messageType: z.enum(['text', 'file', 'image', 'system', 'notification']).default('text'),
  attachments: z.array(z.object({
    url: z.string().url(),
    filename: z.string(),
    size: z.number().int().positive(),
    mimeType: z.string(),
    thumbnail: z.string().url().optional(),
  })).optional(),
  replyToId: z.number().int().positive().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateConversationSchema = z.object({
  id: z.number().int().positive(),
  subject: z.string().min(1).max(200).optional(),
  status: z.enum(['active', 'archived', 'closed', 'blocked']).optional(),
  settings: z.object({
    allowInvites: z.boolean().optional(),
    autoArchiveAfter: z.number().int().positive().optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  }).optional(),
});

const searchConversationsSchema = z.object({
  tenantId: z.number().int().positive(),
  userId: z.number().int().positive(),
  status: z.enum(['active', 'archived', 'closed', 'blocked']).optional(),
  type: z.enum(['direct', 'group', 'support', 'business']).optional(),
  search: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['lastMessageAt', 'createdAt', 'priority']).default('lastMessageAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const searchMessagesSchema = z.object({
  conversationId: z.number().int().positive(),
  search: z.string().optional(),
  messageType: z.enum(['text', 'file', 'image', 'system', 'notification']).optional(),
  senderId: z.number().int().positive().optional(),
  beforeMessageId: z.number().int().positive().optional(),
  afterMessageId: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type SearchConversationsInput = z.infer<typeof searchConversationsSchema>;
export type SearchMessagesInput = z.infer<typeof searchMessagesSchema>;

export class ConversationService {
  private prisma: PrismaClient;
  private redis: FastifyRedis;
  private logger?: FastifyBaseLogger;

  constructor(prisma: PrismaClient, redis: FastifyRedis, logger?: FastifyBaseLogger) {
    this.prisma = prisma;
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Create a new conversation
   */
  async createConversation(input: CreateConversationInput) {
    const validated = createConversationSchema.parse(input);
    
    // Ensure creator is in participants
    if (!validated.participantIds.includes(validated.createdById)) {
      validated.participantIds.push(validated.createdById);
    }

    // Validate that all participants belong to the same tenant
    const participants = await this.prisma.user.findMany({
      where: {
        id: { in: validated.participantIds },
        account: { tenantId: validated.tenantId },
      },
    });

    if (participants.length !== validated.participantIds.length) {
      throw new Error('Some participants do not belong to this tenant');
    }

    // Check for existing direct conversation between same participants
    if (validated.type === 'direct' && validated.participantIds.length === 2) {
      const existing = await this.prisma.conversation.findFirst({
        where: {
          tenantId: validated.tenantId,
          type: 'direct',
          participants: {
            every: {
              userId: { in: validated.participantIds },
            },
          },
          _count: {
            participants: validated.participantIds.length,
          },
        },
        include: {
          participants: true,
        },
      });

      if (existing && existing.participants.length === validated.participantIds.length) {
        return existing;
      }
    }

    // Create conversation with participants
    const conversation = await this.prisma.$transaction(async (tx) => {
      const newConversation = await tx.conversation.create({
        data: {
          tenantId: validated.tenantId,
          createdById: validated.createdById,
          subject: validated.subject,
          type: validated.type,
          context: validated.context || {},
          settings: validated.settings || {},
          status: 'active',
        },
      });

      // Add participants
      await tx.conversationParticipant.createMany({
        data: validated.participantIds.map(userId => ({
          conversationId: newConversation.id,
          userId,
          joinedAt: new Date(),
          role: userId === validated.createdById ? 'owner' : 'member',
        })),
      });

      return newConversation;
    });

    // Invalidate user conversations cache
    await this.invalidateUserConversationsCache(validated.tenantId, validated.participantIds);

    return conversation;
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(input: SendMessageInput) {
    const validated = sendMessageSchema.parse(input);

    // Verify conversation exists and user is participant
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: validated.conversationId,
        participants: {
          some: { userId: validated.senderId },
        },
        status: { in: ['active'] },
      },
      include: {
        participants: {
          select: {
            userId: true,
            role: true,
            lastReadAt: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or user not authorized');
    }

    // Validate reply-to message if specified
    if (validated.replyToId) {
      const replyToMessage = await this.prisma.message.findFirst({
        where: {
          id: validated.replyToId,
          conversationId: validated.conversationId,
        },
      });

      if (!replyToMessage) {
        throw new Error('Reply-to message not found');
      }
    }

    // Create message and update conversation
    const message = await this.prisma.$transaction(async (tx) => {
      const newMessage = await tx.message.create({
        data: {
          conversationId: validated.conversationId,
          senderId: validated.senderId,
          content: validated.content,
          messageType: validated.messageType,
          attachments: validated.attachments || [],
          replyToId: validated.replyToId,
          metadata: validated.metadata || {},
        },
        include: {
          sender: {
            select: {
              id: true,
              uuid: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              sender: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      // Update conversation last message info
      await tx.conversation.update({
        where: { id: validated.conversationId },
        data: {
          lastMessageAt: newMessage.createdAt,
          lastMessageId: newMessage.id,
          messageCount: { increment: 1 },
        },
      });

      // Update sender's last read timestamp
      await tx.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: validated.conversationId,
            userId: validated.senderId,
          },
        },
        data: {
          lastReadAt: newMessage.createdAt,
        },
      });

      return newMessage;
    });

    // Invalidate conversation caches
    await this.invalidateConversationCache(conversation.tenantId, validated.conversationId);
    await this.invalidateUserConversationsCache(
      conversation.tenantId,
      conversation.participants.map(p => p.userId)
    );

    return message;
  }

  /**
   * Get conversation by UUID with messages
   */
  async getConversationByUuid(uuid: string, userId: number, limit: number = 50, offset: number = 0) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { uuid },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                uuid: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
          include: {
            sender: {
              select: {
                id: true,
                uuid: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            replyTo: {
              select: {
                id: true,
                content: true,
                sender: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!conversation) {
      return null;
    }

    // Verify user is participant
    const isParticipant = conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    // Update user's last read timestamp
    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: conversation.id,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return conversation;
  }

  /**
   * Search user's conversations
   */
  async searchConversations(input: SearchConversationsInput) {
    const validated = searchConversationsSchema.parse(input);

    // Build where clause
    const where: any = {
      tenantId: validated.tenantId,
      participants: {
        some: { userId: validated.userId },
      },
    };

    if (validated.status) {
      where.status = validated.status;
    }

    if (validated.type) {
      where.type = validated.type;
    }

    if (validated.entityType) {
      where.context = {
        path: ['entityType'],
        equals: validated.entityType,
      };
    }

    if (validated.entityId) {
      where.context = {
        ...where.context,
        path: ['entityId'],
        equals: validated.entityId,
      };
    }

    if (validated.search) {
      where.OR = [
        { subject: { contains: validated.search, mode: 'insensitive' } },
        {
          messages: {
            some: {
              content: { contains: validated.search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[validated.sortBy] = validated.sortOrder;

    // Execute query
    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        orderBy,
        skip: validated.offset,
        take: validated.limit,
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  uuid: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          lastMessage: {
            select: {
              id: true,
              content: true,
              messageType: true,
              createdAt: true,
              sender: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      conversations,
      total,
      hasMore: validated.offset + validated.limit < total,
    };
  }

  /**
   * Search messages in a conversation
   */
  async searchMessages(input: SearchMessagesInput, userId: number) {
    const validated = searchMessagesSchema.parse(input);

    // Verify user is participant
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: validated.conversationId,
        participants: {
          some: { userId },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or user not authorized');
    }

    // Build where clause
    const where: any = {
      conversationId: validated.conversationId,
    };

    if (validated.messageType) {
      where.messageType = validated.messageType;
    }

    if (validated.senderId) {
      where.senderId = validated.senderId;
    }

    if (validated.search) {
      where.content = { contains: validated.search, mode: 'insensitive' };
    }

    if (validated.beforeMessageId) {
      where.id = { lt: validated.beforeMessageId };
    }

    if (validated.afterMessageId) {
      where.id = { gt: validated.afterMessageId };
    }

    // Execute query
    const messages = await this.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: validated.offset,
      take: validated.limit,
      include: {
        sender: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return messages;
  }

  /**
   * Update conversation
   */
  async updateConversation(input: UpdateConversationInput, userId: number) {
    const validated = updateConversationSchema.parse(input);

    // Verify user is owner or has permissions
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: validated.id,
        OR: [
          { createdById: userId },
          {
            participants: {
              some: {
                userId,
                role: { in: ['owner', 'admin'] },
              },
            },
          },
        ],
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or user not authorized');
    }

    const { id, ...updates } = validated;

    const updatedConversation = await this.prisma.conversation.update({
      where: { id },
      data: updates,
    });

    // Invalidate caches
    await this.invalidateConversationCache(conversation.tenantId, id);

    return updatedConversation;
  }

  /**
   * Add participant to conversation
   */
  async addParticipant(conversationId: number, userId: number, invitedBy: number) {
    // Verify conversation exists and inviter has permission
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { userId: invitedBy },
        },
        settings: {
          path: ['allowInvites'],
          equals: true,
        },
      },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or invites not allowed');
    }

    // Check if user is already a participant
    const existingParticipant = conversation.participants.find(p => p.userId === userId);
    if (existingParticipant) {
      throw new Error('User is already a participant');
    }

    // Add participant
    const participant = await this.prisma.conversationParticipant.create({
      data: {
        conversationId,
        userId,
        joinedAt: new Date(),
        role: 'member',
        invitedById: invitedBy,
      },
    });

    // Invalidate caches
    await this.invalidateConversationCache(conversation.tenantId, conversationId);
    await this.invalidateUserConversationsCache(conversation.tenantId, [userId]);

    return participant;
  }

  /**
   * Remove participant from conversation
   */
  async removeParticipant(conversationId: number, userId: number, removedBy: number) {
    // Verify permissions
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { createdById: removedBy },
          {
            participants: {
              some: {
                userId: removedBy,
                role: { in: ['owner', 'admin'] },
              },
            },
          },
        ],
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or user not authorized');
    }

    // Users can always remove themselves
    if (userId !== removedBy && conversation.createdById !== removedBy) {
      throw new Error('Not authorized to remove this participant');
    }

    // Remove participant
    await this.prisma.conversationParticipant.delete({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    // Invalidate caches
    await this.invalidateConversationCache(conversation.tenantId, conversationId);
    await this.invalidateUserConversationsCache(conversation.tenantId, [userId]);
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(conversationId: number, userId: number) {
    // Verify user is participant
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { userId },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or user not authorized');
    }

    const stats = await this.prisma.message.groupBy({
      by: ['messageType'],
      where: { conversationId },
      _count: true,
    });

    const messagesByType = stats.reduce((acc, curr) => {
      acc[curr.messageType] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalMessages: conversation.messageCount,
      messagesByType,
      participantCount: await this.prisma.conversationParticipant.count({
        where: { conversationId },
      }),
      createdAt: conversation.createdAt,
      lastMessageAt: conversation.lastMessageAt,
    };
  }

  /**
   * Helper: Invalidate conversation cache
   */
  private async invalidateConversationCache(tenantId: number, conversationId: number) {
    const patterns = [
      `tenant:${tenantId}:conversation:${conversationId}:*`,
      `tenant:${tenantId}:conversations:*`,
    ];

    await Promise.all(
      patterns.map(pattern => this.redis.eval(
        `for _,k in ipairs(redis.call('keys', ARGV[1])) do redis.call('del', k) end`,
        0,
        pattern
      ))
    );
  }

  /**
   * Helper: Invalidate user conversations cache
   */
  private async invalidateUserConversationsCache(tenantId: number, userIds: number[]) {
    const patterns = userIds.flatMap(userId => [
      `tenant:${tenantId}:user:${userId}:conversations:*`,
    ]);

    await Promise.all(
      patterns.map(pattern => this.redis.eval(
        `for _,k in ipairs(redis.call('keys', ARGV[1])) do redis.call('del', k) end`,
        0,
        pattern
      ))
    );
  }
}