/**
 * RabbitMQ Message Queue Service
 * 
 * Handles reliable message delivery for chat, notifications, and audit events
 */

import amqp, { Connection, Channel, Message } from 'amqplib';
import { config } from '../config/index.js';

export interface QueueMessage {
  id: string;
  tenantId: number;
  type: string;
  payload: any;
  timestamp: Date;
  retryCount?: number;
}

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  tenantId: number;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  timestamp: Date;
}

export interface PushNotification {
  recipientIds: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  tenantId: number;
}

export interface AuditEvent {
  eventType: string;
  userId: string;
  tenantId: number;
  entityType: string;
  entityId: string;
  changes: Record<string, any>;
  timestamp: Date;
}

export class MessageQueueService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnected = false;

  constructor() {
    this.connect();
  }

  async connect(): Promise<void> {
    try {
      const rabbitmqUrl = config.rabbitmq.url || 'amqp://admin:admin123@localhost:5672/mono';
      console.log('🐰 Connecting to RabbitMQ:', rabbitmqUrl);

      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Handle connection events
      this.connection.on('error', (err) => {
        console.error('RabbitMQ connection error:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        this.isConnected = false;
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.connect(), 5000);
      });

      await this.setupExchangesAndQueues();
      this.isConnected = true;
      console.log('✅ RabbitMQ connected successfully');

    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      this.isConnected = false;
      // Retry connection after 10 seconds
      setTimeout(() => this.connect(), 10000);
    }
  }

  private async setupExchangesAndQueues(): Promise<void> {
    if (!this.channel) throw new Error('RabbitMQ channel not initialized');

    // Create exchanges
    await this.channel.assertExchange('messages', 'topic', { durable: true });
    await this.channel.assertExchange('notifications', 'topic', { durable: true });
    await this.channel.assertExchange('audit', 'topic', { durable: true });

    // Create queues with TTL and max length
    const queueOptions = {
      durable: true,
      arguments: {
        'x-message-ttl': 86400000, // 24 hours
        'x-max-length': 100000
      }
    };

    await this.channel.assertQueue('chat.messages', queueOptions);
    await this.channel.assertQueue('push.notifications', {
      ...queueOptions,
      arguments: { ...queueOptions.arguments, 'x-message-ttl': 3600000 } // 1 hour for notifications
    });
    await this.channel.assertQueue('email.notifications', {
      ...queueOptions,
      arguments: { ...queueOptions.arguments, 'x-message-ttl': 3600000 }
    });
    await this.channel.assertQueue('audit.events', {
      ...queueOptions,
      arguments: { ...queueOptions.arguments, 'x-message-ttl': 604800000 } // 7 days for audit
    });

    // Bind queues to exchanges
    await this.channel.bindQueue('chat.messages', 'messages', 'chat.*');
    await this.channel.bindQueue('push.notifications', 'notifications', 'push.*');
    await this.channel.bindQueue('email.notifications', 'notifications', 'email.*');
    await this.channel.bindQueue('audit.events', 'audit', 'audit.*');
  }

  async sendChatMessage(message: ChatMessage): Promise<boolean> {
    return this.publishMessage('messages', 'chat.direct', {
      id: message.messageId,
      tenantId: message.tenantId,
      type: 'chat_message',
      payload: message,
      timestamp: new Date()
    });
  }

  async sendPushNotification(notification: PushNotification): Promise<boolean> {
    return this.publishMessage('notifications', 'push.mobile', {
      id: `push_${Date.now()}`,
      tenantId: notification.tenantId,
      type: 'push_notification',
      payload: notification,
      timestamp: new Date()
    });
  }

  async sendEmailNotification(email: any): Promise<boolean> {
    return this.publishMessage('notifications', 'email.send', {
      id: `email_${Date.now()}`,
      tenantId: email.tenantId,
      type: 'email_notification',
      payload: email,
      timestamp: new Date()
    });
  }

  async sendAuditEvent(event: AuditEvent): Promise<boolean> {
    return this.publishMessage('audit', 'audit.track', {
      id: `audit_${Date.now()}`,
      tenantId: event.tenantId,
      type: 'audit_event',
      payload: event,
      timestamp: new Date()
    });
  }

  private async publishMessage(exchange: string, routingKey: string, message: QueueMessage): Promise<boolean> {
    if (!this.isConnected || !this.channel) {
      console.warn('RabbitMQ not connected, message not sent:', message.type);
      return false;
    }

    try {
      const buffer = Buffer.from(JSON.stringify(message));
      const result = this.channel.publish(exchange, routingKey, buffer, {
        persistent: true,
        timestamp: Date.now(),
        messageId: message.id,
        headers: {
          tenantId: message.tenantId,
          messageType: message.type
        }
      });

      if (result) {
        console.log(`📤 Message sent to ${exchange}/${routingKey}:`, message.id);
        return true;
      } else {
        console.warn('Failed to publish message to RabbitMQ');
        return false;
      }
    } catch (error) {
      console.error('Error publishing message:', error);
      return false;
    }
  }

  async consumeMessages(queue: string, handler: (message: QueueMessage) => Promise<void>): Promise<void> {
    if (!this.channel) throw new Error('RabbitMQ channel not initialized');

    await this.channel.consume(queue, async (msg: Message | null) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString()) as QueueMessage;
        console.log(`📥 Processing message from ${queue}:`, content.id);

        await handler(content);
        this.channel!.ack(msg);
        console.log(`✅ Message processed successfully:`, content.id);

      } catch (error) {
        console.error(`❌ Error processing message from ${queue}:`, error);
        
        // Check retry count
        const retryCount = (msg.properties.headers?.retryCount || 0) + 1;
        const maxRetries = 3;

        if (retryCount <= maxRetries) {
          // Requeue with retry count
          this.channel!.nack(msg, false, true);
          console.log(`🔄 Message requeued (attempt ${retryCount}/${maxRetries})`);
        } else {
          // Send to dead letter queue or discard
          this.channel!.nack(msg, false, false);
          console.log(`💀 Message discarded after ${maxRetries} retries`);
        }
      }
    });

    console.log(`👂 Listening for messages on queue: ${queue}`);
  }

  async getQueueStats(): Promise<Record<string, any>> {
    if (!this.channel) return {};

    try {
      const queues = ['chat.messages', 'push.notifications', 'email.notifications', 'audit.events'];
      const stats: Record<string, any> = {};

      for (const queue of queues) {
        const queueInfo = await this.channel.checkQueue(queue);
        stats[queue] = {
          messageCount: queueInfo.messageCount,
          consumerCount: queueInfo.consumerCount
        };
      }

      return stats;
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return {};
    }
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      console.log('RabbitMQ connection closed');
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
export const messageQueue = new MessageQueueService();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down RabbitMQ connection...');
  await messageQueue.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down RabbitMQ connection...');
  await messageQueue.close();
  process.exit(0);
});