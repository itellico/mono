import { PrismaClient } from '@prisma/client';
import { FastifyRedis } from '@fastify/redis';
import { z } from 'zod';
import type { FastifyBaseLogger } from 'fastify';
import { EmailService } from './email.service';

// Notification types for marketplace events
export enum NotificationType {
  // Job-related notifications
  JOB_APPLICATION_RECEIVED = 'job.application.received',
  JOB_APPLICATION_STATUS_CHANGED = 'job.application.status_changed',
  JOB_PUBLISHED = 'job.published',
  JOB_DEADLINE_APPROACHING = 'job.deadline.approaching',
  
  // Gig-related notifications
  GIG_BOOKING_RECEIVED = 'gig.booking.received',
  GIG_BOOKING_CONFIRMED = 'gig.booking.confirmed',
  GIG_DELIVERY_COMPLETED = 'gig.delivery.completed',
  GIG_REVIEW_RECEIVED = 'gig.review.received',
  
  // Conversation notifications
  NEW_MESSAGE = 'conversation.new_message',
  CONVERSATION_CREATED = 'conversation.created',
  
  // System notifications
  WELCOME = 'system.welcome',
  PASSWORD_RESET = 'system.password_reset',
  ACCOUNT_VERIFICATION = 'system.account_verification',
}

// Input validation schemas
const sendNotificationSchema = z.object({
  tenantId: z.number().int().positive(),
  userId: z.number().int().positive(),
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.record(z.any()).optional(),
  channels: z.array(z.enum(['email', 'push', 'sms', 'in_app'])).default(['in_app']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  expiresAt: z.string().datetime().optional(),
  actionUrl: z.string().url().optional(),
  emailTemplate: z.string().optional(),
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;

export class NotificationService {
  private prisma: PrismaClient;
  private redis: FastifyRedis;
  private logger?: FastifyBaseLogger;
  private emailService?: EmailService;

  constructor(
    prisma: PrismaClient, 
    redis: FastifyRedis, 
    emailService?: EmailService,
    logger?: FastifyBaseLogger
  ) {
    this.prisma = prisma;
    this.redis = redis;
    this.emailService = emailService;
    this.logger = logger;
  }

  /**
   * Send notification through multiple channels
   */
  async sendNotification(input: SendNotificationInput) {
    const validated = sendNotificationSchema.parse(input);

    // Create notification record
    const notification = await this.prisma.notification.create({
      data: {
        tenantId: validated.tenantId,
        userId: validated.userId,
        type: validated.type,
        title: validated.title,
        message: validated.message,
        data: validated.data || {},
        priority: validated.priority,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
        actionUrl: validated.actionUrl,
        channels: validated.channels,
        status: 'pending',
      },
    });

    // Get user preferences for notifications
    const userPreferences = await this.getUserNotificationPreferences(validated.userId);

    // Send through each requested channel
    const results: any = {};

    for (const channel of validated.channels) {
      if (!userPreferences[channel]) {
        results[channel] = { status: 'disabled', reason: 'User preference' };
        continue;
      }

      try {
        switch (channel) {
          case 'email':
            results[channel] = await this.sendEmailNotification(validated, notification.uuid);
            break;
          case 'in_app':
            results[channel] = await this.sendInAppNotification(validated, notification.id);
            break;
          case 'push':
            results[channel] = { status: 'not_implemented' };
            break;
          case 'sms':
            results[channel] = { status: 'not_implemented' };
            break;
        }
      } catch (error: any) {
        this.logger?.error({ error, channel, notificationId: notification.uuid }, 'Failed to send notification');
        results[channel] = { status: 'failed', error: error.message };
      }
    }

    // Update notification status
    const allFailed = Object.values(results).every((r: any) => r.status === 'failed');
    const anySucceeded = Object.values(results).some((r: any) => r.status === 'sent' || r.status === 'delivered');

    await this.prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: allFailed ? 'failed' : anySucceeded ? 'sent' : 'pending',
        deliveryResults: results,
        sentAt: anySucceeded ? new Date() : null,
      },
    });

    return {
      notificationId: notification.uuid,
      results,
    };
  }

  /**
   * Job-related notification helpers
   */
  async notifyJobApplicationReceived(jobId: number, applicationId: number) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        postedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        tenant: {
          select: { id: true, name: true },
        },
      },
    });

    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        applicant: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!job || !application) return;

    await this.sendNotification({
      tenantId: job.tenantId,
      userId: job.postedById,
      type: NotificationType.JOB_APPLICATION_RECEIVED,
      title: 'New Job Application',
      message: `${application.applicant.firstName} ${application.applicant.lastName} applied for "${job.title}"`,
      data: {
        jobId: job.uuid,
        applicationId: application.uuid,
        jobTitle: job.title,
        applicantName: `${application.applicant.firstName} ${application.applicant.lastName}`,
      },
      channels: ['email', 'in_app'],
      actionUrl: `${this.getBaseUrl()}/jobs/${job.uuid}/applications`,
      emailTemplate: 'job-application-received',
    });
  }

  async notifyJobApplicationStatusChanged(applicationId: number, newStatus: string) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: { uuid: true, title: true, tenantId: true },
        },
        applicant: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!application) return;

    await this.sendNotification({
      tenantId: application.job.tenantId,
      userId: application.applicantId,
      type: NotificationType.JOB_APPLICATION_STATUS_CHANGED,
      title: 'Application Status Update',
      message: `Your application for "${application.job.title}" has been ${newStatus}`,
      data: {
        jobId: application.job.uuid,
        applicationId: application.uuid,
        jobTitle: application.job.title,
        newStatus,
      },
      channels: ['email', 'in_app'],
      actionUrl: `${this.getBaseUrl()}/jobs/${application.job.uuid}`,
      emailTemplate: 'job-application-status-changed',
    });
  }

  /**
   * Gig-related notification helpers
   */
  async notifyGigBookingReceived(bookingId: number) {
    const booking = await this.prisma.gigBooking.findUnique({
      where: { id: bookingId },
      include: {
        gig: {
          select: { uuid: true, title: true, tenantId: true, talentId: true },
        },
        client: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!booking) return;

    await this.sendNotification({
      tenantId: booking.gig.tenantId,
      userId: booking.gig.talentId,
      type: NotificationType.GIG_BOOKING_RECEIVED,
      title: 'New Gig Booking',
      message: `${booking.client.firstName} ${booking.client.lastName} booked your gig "${booking.gig.title}"`,
      data: {
        gigId: booking.gig.uuid,
        bookingId: booking.uuid,
        gigTitle: booking.gig.title,
        clientName: `${booking.client.firstName} ${booking.client.lastName}`,
        totalPrice: booking.totalPrice,
      },
      channels: ['email', 'in_app'],
      actionUrl: `${this.getBaseUrl()}/gigs/${booking.gig.uuid}/bookings`,
      emailTemplate: 'gig-booking-received',
    });
  }

  /**
   * Conversation notification helpers
   */
  async notifyNewMessage(messageId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: {
              where: {
                userId: { not: message.senderId },
              },
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true },
                },
              },
            },
          },
        },
        sender: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!message) return;

    // Notify all participants except the sender
    for (const participant of message.conversation.participants) {
      await this.sendNotification({
        tenantId: message.conversation.tenantId,
        userId: participant.userId,
        type: NotificationType.NEW_MESSAGE,
        title: 'New Message',
        message: `${message.sender.firstName} ${message.sender.lastName}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
        data: {
          conversationId: message.conversation.uuid,
          messageId: message.uuid,
          senderName: `${message.sender.firstName} ${message.sender.lastName}`,
          preview: message.content.substring(0, 200),
        },
        channels: ['email', 'in_app'],
        actionUrl: `${this.getBaseUrl()}/conversations/${message.conversation.uuid}`,
        emailTemplate: 'new-message',
      });
    }
  }

  /**
   * System notification helpers
   */
  async sendWelcomeNotification(userId: number, tenantId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (!user) return;

    await this.sendNotification({
      tenantId,
      userId,
      type: NotificationType.WELCOME,
      title: 'Welcome to the platform!',
      message: `Hi ${user.firstName}! Welcome to our marketplace. Get started by exploring jobs and gigs.`,
      data: {
        userName: `${user.firstName} ${user.lastName}`,
      },
      channels: ['email', 'in_app'],
      actionUrl: `${this.getBaseUrl()}/dashboard`,
      emailTemplate: 'welcome',
    });
  }

  /**
   * Private helper methods
   */
  private async sendEmailNotification(notification: SendNotificationInput, notificationUuid: string) {
    if (!this.emailService) {
      return { status: 'disabled', reason: 'Email service not configured' };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: notification.userId },
      include: {
        account: {
          select: { email: true },
        },
      },
    });

    if (!user?.account?.email) {
      return { status: 'failed', reason: 'User email not found' };
    }

    const variables = {
      userName: `${user.firstName} ${user.lastName}`,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
      ...notification.data,
    };

    try {
      const result = await this.emailService.sendEmail({
        tenantId: notification.tenantId,
        templateSlug: notification.emailTemplate,
        to: [{ email: user.account.email, name: `${user.firstName} ${user.lastName}` }],
        subject: notification.title,
        variables,
        priority: notification.priority,
        tags: ['notification', notification.type],
        metadata: {
          notificationId: notificationUuid,
          userId: notification.userId.toString(),
        },
      });

      return { status: 'sent', emailId: result.emailId };
    } catch (error: any) {
      return { status: 'failed', error: error.message };
    }
  }

  private async sendInAppNotification(notification: SendNotificationInput, notificationId: number) {
    // In-app notifications are stored in the database and handled by the frontend
    // We could also use WebSocket/SSE here for real-time delivery
    
    // Invalidate user notifications cache
    await this.redis.del(`tenant:${notification.tenantId}:user:${notification.userId}:notifications`);
    
    return { status: 'delivered' };
  }

  private async getUserNotificationPreferences(userId: number) {
    // Get user notification preferences from cache or database
    const cacheKey = `user:${userId}:notification-preferences`;
    
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Default preferences if none set
    const defaultPreferences = {
      email: true,
      push: true,
      sms: false,
      in_app: true,
    };

    // Cache for 1 hour
    await this.redis.setex(cacheKey, 3600, JSON.stringify(defaultPreferences));
    
    return defaultPreferences;
  }

  private getBaseUrl(): string {
    // In production, this should come from configuration
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(userId: number, tenantId: number, limit: number = 20, offset: number = 0) {
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: {
          userId,
          tenantId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.notification.count({
        where: {
          userId,
          tenantId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      }),
    ]);

    return {
      notifications,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: number) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        uuid: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notification.id },
      data: {
        readAt: new Date(),
        status: 'read',
      },
    });
  }

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(userId: number, tenantId: number) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        tenantId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
        status: 'read',
      },
    });
  }
}