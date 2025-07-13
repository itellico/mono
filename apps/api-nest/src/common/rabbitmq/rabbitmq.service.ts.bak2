import { Injectable, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, lastValueFrom, timeout } from 'rxjs';
import { LoggerService } from '../logging/logger.service';

export interface QueueMessage {
  id: string;
  type: string;
  payload: any;
  priority?: number;
  delay?: number;
  attempts?: number;
  maxAttempts?: number;
  created_at: Date;
  scheduledFor?: Date;
}

export interface QueueOptions {
  priority?: number;
  delay?: number;
  maxAttempts?: number;
  timeout?: number;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject('RABBITMQ_SERVICE') private client: ClientProxy,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.logSystem('RabbitMQ connection established');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.close();
      this.logger.logSystem('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error);
    }
  }

  /**
   * Send a message to a queue
   */
  async sendMessage(
    pattern: string,
    data: any,
    options: QueueOptions = {}
  ): Promise<void> {
    try {
      const message: QueueMessage = {
        id: this.generateId(),
        type: pattern,
        payload: data,
        priority: options.priority || 0,
        delay: options.delay || 0,
        attempts: 0,
        maxAttempts: options.maxAttempts || 3,
        created_at: new Date(),
        scheduledFor: options.delay ? new Date(Date.now() + options.delay) : new Date(),
      };

      await lastValueFrom(
        this.client.emit(pattern, message).pipe(
          timeout(options.timeout || 10000)
        )
      );

      this.logger.info(`📤 Message sent to queue: ${pattern}`, {
        messageId: message.id,
        pattern,
        priority: message.priority,
        delay: message.delay,
      });
    } catch (error) {
      this.logger.error(`❌ Failed to send message to queue: ${pattern}`, error, {
        pattern,
        data,
        options,
      });
      throw error;
    }
  }

  /**
   * Send a message and wait for response
   */
  async sendAndReceive<T = any>(
    pattern: string,
    data: any,
    options: QueueOptions = {}
  ): Promise<T> {
    try {
      const message: QueueMessage = {
        id: this.generateId(),
        type: pattern,
        payload: data,
        priority: options.priority || 0,
        attempts: 0,
        maxAttempts: options.maxAttempts || 3,
        created_at: new Date(),
      };

      const response = await lastValueFrom(
        this.client.send<T>(pattern, message).pipe(
          timeout(options.timeout || 30000)
        )
      );

      this.logger.info(`🔄 Message sent and response received: ${pattern}`, {
        messageId: message.id,
        pattern,
        priority: message.priority,
      });

      return response;
    } catch (error) {
      this.logger.error(`❌ Failed to send/receive message: ${pattern}`, error, {
        pattern,
        data,
        options,
      });
      throw error;
    }
  }

  /**
   * Queue patterns for different job types
   */
  async queueEmailJob(emailData: {
    to: string | string[];
    subject: string;
    template?: string;
    data?: any;
    priority?: number;
  }): Promise<void> {
    await this.sendMessage('email.send', emailData, {
      priority: emailData.priority || 5,
      maxAttempts: 3,
    });
  }

  async queueNotificationJob(notificationData: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    channels?: string[];
  }): Promise<void> {
    await this.sendMessage('notification.send', notificationData, {
      priority: 7,
      maxAttempts: 2,
    });
  }

  async queueWebhookJob(webhookData: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    payload: any;
    retryConfig?: {
      maxAttempts: number;
      backoffMultiplier: number;
    };
  }): Promise<void> {
    await this.sendMessage('webhook.send', webhookData, {
      priority: 3,
      maxAttempts: webhookData.retryConfig?.maxAttempts || 5,
    });
  }

  async queueDataProcessingJob(processingData: {
    type: string;
    entityId: string;
    entityType: string;
    operation: string;
    data: any;
    userId?: string;
    tenantId?: string;
  }): Promise<void> {
    await this.sendMessage('data.process', processingData, {
      priority: 4,
      maxAttempts: 3,
    });
  }

  async queueReportJob(reportData: {
    type: string;
    format: string;
    filters: any;
    user_id: string;
    tenantId?: string;
    email?: string;
  }): Promise<void> {
    await this.sendMessage('report.generate', reportData, {
      priority: 2,
      maxAttempts: 2,
      timeout: 300000, // 5 minutes for reports
    });
  }

  async queueBackupJob(backupData: {
    type: 'full' | 'incremental';
    entities?: string[];
    tenantId?: string;
    compression?: boolean;
  }): Promise<void> {
    await this.sendMessage('backup.create', backupData, {
      priority: 1,
      maxAttempts: 1,
      timeout: 3600000, // 1 hour for backups
    });
  }

  async queueScheduledJob(scheduleData: {
    pattern: string;
    payload: any;
    scheduleFor: Date;
    recurring?: {
      interval: number;
      unit: 'seconds' | 'minutes' | 'hours' | 'days';
      endAt?: Date;
    };
  }): Promise<void> {
    const delay = scheduleData.scheduleFor.getTime() - Date.now();
    
    await this.sendMessage(scheduleData.pattern, scheduleData.payload, {
      delay: Math.max(0, delay),
      priority: 3,
      maxAttempts: 2,
    });
  }

  /**
   * Health check for RabbitMQ connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Send a simple ping message
      await this.sendAndReceive('health.ping', { timestamp: Date.now() }, {
        timeout: 5000,
        maxAttempts: 1,
      });
      return true;
    } catch (error) {
      this.logger.warn('RabbitMQ health check failed', { error: error.message });
      return false;
    }
  }

  /**
   * Get queue statistics (if available)
   */
  async getQueueStats(queueName?: string): Promise<any> {
    try {
      return await this.sendAndReceive('queue.stats', { queueName }, {
        timeout: 10000,
      });
    } catch (error) {
      this.logger.warn('Failed to get queue statistics', { error: error.message });
      return null;
    }
  }

  /**
   * Purge a queue (admin operation)
   */
  async purgeQueue(queueName: string): Promise<void> {
    try {
      await this.sendAndReceive('queue.purge', { queueName }, {
        timeout: 30000,
      });
      this.logger.logSystem(`Queue purged: ${queueName}`);
    } catch (error) {
      this.logger.error(`Failed to purge queue: ${queueName}`, error);
      throw error;
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}