# GoCare Content Moderation & Messaging System Architecture

## Overview

GoCare is itellico Mono's quality control and content moderation system that ensures uploaded content meets platform standards and is correctly categorized. It combines LLM analysis with human-in-the-loop moderation, integrated with a sophisticated messaging system for user feedback.

## 🎯 **System Components**

### **1. GoCare Moderation Workflow**

```typescript
// GoCare workflow stages
export const GOCARE_WORKFLOW = {
  
  // Stage 1: AI Analysis
  aiAnalysis: {
    activities: ['imageQualityCheck', 'contentAppropriateness', 'categoryMatch'],
    llmProvider: 'tenant_configured', // Uses tenant's LLM
    confidence_threshold: 0.85
  },
  
  // Stage 2: Human Review (if needed)
  humanReview: {
    trigger: 'ai_confidence < threshold OR flagged_content',
    reviewers: 'tenant_moderators',
    actions: ['approve', 'reject', 'recategorize', 'request_changes']
  },
  
  // Stage 3: User Communication
  userFeedback: {
    channel: 'internal_messaging',
    fallback: 'email_notification',
    includes: ['image_reference', 'feedback_text', 'action_required']
  }
};
```

### **2. Messaging System Architecture**

```sql
-- Core messaging tables with moderation support
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    conversation_type VARCHAR(50) NOT NULL, -- 'gocare_moderation', 'direct', 'group'
    entity_type VARCHAR(50), -- 'image_moderation', 'profile_review', etc.
    entity_id UUID, -- Reference to the moderated content
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    INDEX idx_conversations_tenant (tenant_id),
    INDEX idx_conversations_entity (entity_type, entity_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    sender_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL, -- 'user', 'moderator', 'system'
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text', -- 'text', 'image_feedback', 'system_notification'
    
    -- GoCare specific fields
    moderation_action VARCHAR(50), -- 'approve', 'reject', 'recategorize', 'request_changes'
    moderation_metadata JSONB, -- Stores image URLs, category suggestions, etc.
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    INDEX idx_messages_conversation (conversation_id, created_at),
    INDEX idx_messages_tenant (tenant_id)
);

CREATE TABLE message_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    message_id UUID NOT NULL REFERENCES messages(id),
    user_id UUID NOT NULL,
    delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    email_sent_at TIMESTAMP,
    email_opened_at TIMESTAMP,
    
    UNIQUE(message_id, user_id),
    INDEX idx_receipts_unread (user_id, read_at) WHERE read_at IS NULL
);

-- Configuration for email fallback
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    conversation_type VARCHAR(50) NOT NULL,
    
    -- Notification settings
    email_enabled BOOLEAN DEFAULT TRUE,
    email_delay_minutes INTEGER DEFAULT 30, -- Send email if unread after X minutes
    push_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    
    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    UNIQUE(user_id, conversation_type)
);
```

### **3. Real-Time Messaging Implementation**

```typescript
// WebSocket server for real-time messaging
import { Server } from 'socket.io';
import { Redis } from 'ioredis';

export class GoCareMessagingServer {
  private io: Server;
  private redis: Redis;
  private pubClient: Redis;
  private subClient: Redis;

  constructor() {
    this.setupWebSocketServer();
    this.setupRedisAdapter();
  }

  private setupWebSocketServer() {
    this.io = new Server({
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(','),
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      const token = socket.handshake.auth.token;
      const user = await this.verifyToken(token);
      
      if (!user) {
        return next(new Error('Authentication failed'));
      }
      
      socket.data.user = user;
      socket.data.tenantId = user.tenantId;
      next();
    });

    // Connection handling
    this.io.on('connection', (socket) => {
      const { user, tenantId } = socket.data;

      // Join user's personal room for direct messages
      socket.join(`user:${user.id}`);
      
      // Join tenant room for tenant-wide broadcasts
      socket.join(`tenant:${tenantId}`);

      // Handle joining conversation rooms
      socket.on('join:conversation', async (conversationId) => {
        const hasAccess = await this.checkConversationAccess(user.id, conversationId);
        if (hasAccess) {
          socket.join(`conversation:${conversationId}`);
          
          // Mark messages as delivered
          await this.markMessagesDelivered(conversationId, user.id);
        }
      });

      // Handle read receipts
      socket.on('messages:read', async ({ messageIds, conversationId }) => {
        await this.markMessagesAsRead(user.id, messageIds);
        
        // Cancel pending email notifications
        await this.cancelPendingEmails(user.id, messageIds);
        
        // Notify other participants
        socket.to(`conversation:${conversationId}`).emit('receipts:updated', {
          userId: user.id,
          messageIds,
          readAt: new Date()
        });
      });

      // Handle sending messages
      socket.on('message:send', async (data) => {
        const message = await this.createMessage({
          ...data,
          senderId: user.id,
          tenantId
        });

        // Emit to conversation participants
        this.io.to(`conversation:${message.conversationId}`).emit('message:new', message);

        // Queue email notifications for offline users
        await this.queueEmailNotifications(message);
      });

      // Track user presence
      socket.on('disconnect', () => {
        this.updateUserPresence(user.id, false);
      });

      this.updateUserPresence(user.id, true);
    });
  }

  private async queueEmailNotifications(message: Message) {
    const participants = await this.getConversationParticipants(message.conversationId);
    
    for (const participant of participants) {
      if (participant.userId === message.senderId) continue;
      
      const prefs = await this.getNotificationPreferences(participant.userId);
      
      if (prefs.emailEnabled && prefs.emailDelayMinutes > 0) {
        await this.emailQueue.add(
          'moderation-feedback-email',
          {
            messageId: message.id,
            userId: participant.userId,
            conversationId: message.conversationId,
            moderationData: message.moderationMetadata
          },
          {
            delay: prefs.emailDelayMinutes * 60 * 1000,
            jobId: `email:${message.id}:${participant.userId}`
          }
        );
      }
    }
  }
}
```

### **4. GoCare Integration with Messaging**

```typescript
// GoCare moderation service integration
export class GoCareService {
  constructor(
    private messagingService: MessagingService,
    private llmService: LLMService,
    private temporalClient: TemporalClient
  ) {}

  async processUploadedContent(content: {
    id: string;
    type: 'image' | 'video';
    url: string;
    category: string;
    uploadedBy: string;
    tenantId: string;
  }) {
    // Start Temporal workflow for moderation
    const workflowHandle = await this.temporalClient.start('gocareModeration', {
      args: [content],
      taskQueue: `tenant-${content.tenantId}-gocare`,
      workflowId: `gocare-${content.id}`
    });

    return workflowHandle;
  }

  async sendModerationFeedback(params: {
    contentId: string;
    userId: string;
    moderatorId: string;
    action: 'approve' | 'reject' | 'recategorize' | 'request_changes';
    feedback: string;
    suggestedCategory?: string;
    tenantId: string;
  }) {
    // Create or get existing conversation
    const conversation = await this.messagingService.findOrCreateConversation({
      type: 'gocare_moderation',
      entityType: 'content_moderation',
      entityId: params.contentId,
      tenantId: params.tenantId,
      participants: [params.userId, params.moderatorId]
    });

    // Generate secure media URL for the content
    const secureUrl = await this.generateSecureMediaUrl(params.contentId, params.userId);

    // Create moderation message
    const message = await this.messagingService.sendMessage({
      conversationId: conversation.id,
      senderId: params.moderatorId,
      senderType: 'moderator',
      content: this.formatModerationMessage(params),
      messageType: 'image_feedback',
      moderationAction: params.action,
      moderationMetadata: {
        contentId: params.contentId,
        contentUrl: secureUrl,
        originalCategory: conversation.metadata.originalCategory,
        suggestedCategory: params.suggestedCategory,
        action: params.action,
        moderatorName: await this.getModeratorName(params.moderatorId)
      },
      tenantId: params.tenantId
    });

    // Handle specific actions
    switch (params.action) {
      case 'reject':
        await this.markContentAsRejected(params.contentId, params.feedback);
        break;
      case 'recategorize':
        await this.updateContentCategory(params.contentId, params.suggestedCategory!);
        break;
      case 'request_changes':
        await this.createChangeRequest(params.contentId, params.feedback);
        break;
    }

    return message;
  }

  private formatModerationMessage(params: any): string {
    const templates = {
      approve: 'Your content has been approved! 🎉',
      reject: `Your content needs attention: ${params.feedback}`,
      recategorize: `We've moved your content to a better category: ${params.suggestedCategory}`,
      request_changes: `Please update your content: ${params.feedback}`
    };

    return templates[params.action] || params.feedback;
  }
}
```

### **5. Email Notification System**

```typescript
// Email notification worker for unread messages
export class EmailNotificationWorker {
  constructor(
    private emailQueue: Queue,
    private mailgunService: MailgunService,
    private messagingService: MessagingService
  ) {
    this.setupWorker();
  }

  private setupWorker() {
    this.emailQueue.process('moderation-feedback-email', async (job) => {
      const { messageId, userId, conversationId, moderationData } = job.data;

      // Check if message is still unread
      const isRead = await this.messagingService.isMessageRead(messageId, userId);
      if (isRead) {
        return { status: 'skipped', reason: 'message_already_read' };
      }

      // Get user preferences
      const user = await this.getUser(userId);
      const message = await this.messagingService.getMessage(messageId);

      // Prepare email content
      const emailData = {
        to: user.email,
        subject: this.getEmailSubject(moderationData.action),
        template: 'gocare-moderation-feedback',
        variables: {
          userName: user.name,
          moderatorName: moderationData.moderatorName,
          action: moderationData.action,
          feedback: message.content,
          contentUrl: moderationData.contentUrl,
          conversationUrl: `${process.env.APP_URL}/messages/${conversationId}`,
          suggestedCategory: moderationData.suggestedCategory
        },
        tags: ['gocare', 'moderation', moderationData.action],
        'v:conversation_id': conversationId,
        'v:message_id': messageId
      };

      // Send via Mailgun
      const result = await this.mailgunService.send(emailData);

      // Update message receipt
      await this.messagingService.updateReceipt(messageId, userId, {
        emailSentAt: new Date(),
        emailMessageId: result.id
      });

      return { status: 'sent', mailgunId: result.id };
    });
  }

  private getEmailSubject(action: string): string {
    const subjects = {
      approve: '✅ Your content has been approved',
      reject: '❌ Action required: Content feedback',
      recategorize: '📁 Your content has been recategorized',
      request_changes: '✏️ Please update your content'
    };

    return subjects[action] || 'New message from moderation team';
  }
}
```

### **6. Secure Media URL Implementation**

```typescript
// Secure media URL service for GoCare
export class SecureMediaService {
  private readonly salt = process.env.MEDIA_SALT!;
  private readonly secret = process.env.MEDIA_SECRET!;

  generateSecureUrl(contentId: string, userId: string, options: {
    expirationHours?: number;
    accessLevel?: 'public' | 'private' | 'moderation';
  } = {}) {
    const { expirationHours = 24, accessLevel = 'moderation' } = options;

    // Generate unique identifier
    const uniqueId = crypto.randomBytes(8).toString('hex');
    
    // Create content hash
    const contentHash = crypto
      .createHash('sha256')
      .update(`${contentId}-${uniqueId}-${this.salt}`)
      .digest('hex')
      .substring(0, 16);

    // Set expiration
    const expiration = Math.floor(Date.now() / 1000) + (expirationHours * 3600);

    // Create signature
    const dataToSign = `${contentHash}/${expiration}/${userId}/${accessLevel}`;
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(dataToSign)
      .digest('hex')
      .substring(0, 16);

    // Build URL
    const path = `${contentHash}/${expiration}/${signature}`;
    
    // Add user token for moderation access
    const userToken = this.generateUserToken(userId, contentId, expiration);
    
    return {
      url: `${process.env.CDN_URL}/media/${path}?t=${userToken}`,
      expiresAt: new Date(expiration * 1000)
    };
  }

  private generateUserToken(userId: string, contentId: string, expiration: number): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(`${userId}:${contentId}:${expiration}`)
      .digest('hex')
      .substring(0, 8);
  }
}
```

## 🔄 **Workflow Integration**

### **Complete GoCare Temporal Workflow**

```typescript
export async function gocareModeratio
Workflow(input: {
  contentId: string;
  contentType: 'image' | 'video';
  contentUrl: string;
  category: string;
  uploadedBy: string;
  tenantId: string;
}): Promise<ModerationResult> {
  
  const { contentId, contentType, contentUrl, category, uploadedBy, tenantId } = input;
  
  try {
    // Step 1: AI Analysis
    const aiAnalysis = await executeActivity(aiContentAnalysisActivity, {
      contentId,
      contentUrl,
      expectedCategory: category,
      contentType,
      tenantId // Uses tenant's LLM configuration
    });

    // Step 2: Determine if human review needed
    const needsHumanReview = 
      aiAnalysis.confidence < 0.85 ||
      aiAnalysis.flaggedContent ||
      aiAnalysis.suggestedCategory !== category;

    let finalDecision: ModerationDecision;

    if (needsHumanReview) {
      // Create moderation task
      const moderationTask = await executeActivity(createModerationTaskActivity, {
        contentId,
        aiAnalysis,
        priority: aiAnalysis.flaggedContent ? 'high' : 'normal',
        tenantId
      });

      // Wait for human review
      finalDecision = await executeActivity(waitForHumanReviewActivity, {
        taskId: moderationTask.id,
        timeout: '24h'
      });
    } else {
      // Auto-approve based on AI
      finalDecision = {
        action: 'approve',
        moderatorId: 'system',
        feedback: 'Automatically approved based on AI analysis'
      };
    }

    // Step 3: Send feedback via messaging system
    await executeActivity(sendModerationFeedbackActivity, {
      contentId,
      userId: uploadedBy,
      moderatorId: finalDecision.moderatorId,
      action: finalDecision.action,
      feedback: finalDecision.feedback,
      suggestedCategory: finalDecision.suggestedCategory,
      tenantId
    });

    // Step 4: Update content status
    await executeActivity(updateContentStatusActivity, {
      contentId,
      status: finalDecision.action === 'approve' ? 'approved' : 'requires_action',
      category: finalDecision.suggestedCategory || category
    });

    return {
      contentId,
      action: finalDecision.action,
      processingTime: Date.now() - startTime,
      aiConfidence: aiAnalysis.confidence,
      humanReviewRequired: needsHumanReview
    };

  } catch (error) {
    logger.error('GoCare moderation workflow failed', {
      error: error.message,
      contentId,
      tenantId
    });
    throw error;
  }
}
```

## 🔐 **Security & Privacy**

### **Multi-Tenant Isolation**
- All messages are isolated by `tenant_id`
- PostgreSQL RLS enforces data boundaries
- Redis keys include tenant prefix
- WebSocket rooms are tenant-specific

### **Content Security**
- Media URLs are time-limited and user-specific
- HMAC signatures prevent URL tampering
- CDN access requires valid tokens
- Audit logs track all access

### **Message Privacy**
- End-to-end encryption for sensitive content (optional)
- Messages can be deleted by moderators
- GDPR compliance with data export/deletion

## 📊 **Monitoring & Analytics**

### **Key Metrics**
- Average moderation response time
- AI accuracy vs human decisions
- Message read rates
- Email notification effectiveness
- Content approval/rejection ratios

### **Dashboard Views**
- Real-time moderation queue
- Moderator performance metrics
- User engagement with feedback
- Category accuracy trends

## 🚀 **Implementation Priority**

### **Phase 1: Core Messaging (Week 1-2)**
- [ ] Database schema setup
- [ ] WebSocket server implementation
- [ ] Basic message send/receive
- [ ] Read receipt tracking

### **Phase 2: GoCare Integration (Week 3-4)**
- [ ] AI analysis integration
- [ ] Moderation workflow in Temporal
- [ ] Feedback message formatting
- [ ] Secure media URL generation

### **Phase 3: Email Fallback (Week 5)**
- [ ] Email queue setup
- [ ] Mailgun integration
- [ ] Email templates
- [ ] Notification preferences

### **Phase 4: Polish & Scale (Week 6)**
- [ ] Push notifications
- [ ] Analytics dashboard
- [ ] Performance optimization
- [ ] Load testing

---

This architecture provides a complete, scalable solution for the GoCare content moderation system with integrated messaging and multi-channel notifications.