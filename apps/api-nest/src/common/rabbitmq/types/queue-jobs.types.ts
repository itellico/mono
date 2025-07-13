export interface BaseJob {
  id: string;
  type: string;
  created_at: Date;
  attempts: number;
  maxAttempts: number;
}

export interface EmailJob extends BaseJob {
  type: 'email.send';
  data: {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    template?: string;
    templateData?: Record<string, any>;
    html?: string;
    text?: string;
    attachments?: Array<{
      filename: string;
      content: string | Buffer;
      contentType?: string;
    }>;
    priority: number;
    scheduledFor?: Date;
  };
}

export interface NotificationJob extends BaseJob {
  type: 'notification.send';
  data: {
    user_id: string;
    tenantId?: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    channels: ('push' | 'email' | 'sms' | 'in-app')[];
    metadata?: Record<string, any>;
    actionUrl?: string;
    expiresAt?: Date;
  };
}

export interface WebhookJob extends BaseJob {
  type: 'webhook.send';
  data: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;
    payload: any;
    timeout?: number;
    retryConfig: {
      maxAttempts: number;
      backoffMultiplier: number;
      initialDelay: number;
    };
    webhookId?: string;
    eventType?: string;
  };
}

export interface DataProcessingJob extends BaseJob {
  type: 'data.process';
  data: {
    operation: 'create' | 'update' | 'delete' | 'sync' | 'validate' | 'transform';
    entityType: string;
    entityId: string;
    entityData: any;
    userId?: string;
    tenantId?: string;
    accountId?: string;
    metadata?: Record<string, any>;
    dependencies?: string[];
  };
}

export interface ReportJob extends BaseJob {
  type: 'report.generate';
  data: {
    reportType: string;
    format: 'pdf' | 'excel' | 'csv' | 'json';
    filters: Record<string, any>;
    user_id: string;
    tenantId?: string;
    accountId?: string;
    email?: string;
    templateId?: string;
    parameters?: Record<string, any>;
    locale?: string;
    timezone?: string;
  };
}

export interface BackupJob extends BaseJob {
  type: 'backup.create';
  data: {
    backupType: 'full' | 'incremental' | 'differential';
    entities?: string[];
    tenantId?: string;
    compression: boolean;
    encryption: boolean;
    retentionDays: number;
    storageLocation: string;
    metadata?: Record<string, any>;
  };
}

export interface ScheduledJob extends BaseJob {
  type: 'schedule.execute';
  data: {
    originalPattern: string;
    originalPayload: any;
    scheduleId?: string;
    recurringConfig?: {
      interval: number;
      unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
      endAt?: Date;
      nextExecution?: Date;
    };
  };
}

export interface AuditJob extends BaseJob {
  type: 'audit.log';
  data: {
    action: string;
    resource: string;
    resourceId?: string;
    userId?: string;
    tenantId?: string;
    accountId?: string;
    metadata?: Record<string, any>;
    changes?: {
      before?: any;
      after?: any;
    };
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
  };
}

export interface AnalyticsJob extends BaseJob {
  type: 'analytics.track';
  data: {
    event: string;
    userId?: string;
    sessionId?: string;
    tenantId?: string;
    properties?: Record<string, any>;
    timestamp: Date;
    source: string;
    medium?: string;
    campaign?: string;
  };
}

export interface FileProcessingJob extends BaseJob {
  type: 'file.process';
  data: {
    operation: 'upload' | 'download' | 'convert' | 'compress' | 'scan' | 'delete';
    fileId: string;
    fileName: string;
    filePath: string;
    mimeType: string;
    size: number;
    userId?: string;
    tenantId?: string;
    metadata?: Record<string, any>;
    conversionOptions?: {
      format: string;
      quality?: number;
      dimensions?: { width: number; height: number };
    };
  };
}

export type QueueJob = 
  | EmailJob 
  | NotificationJob 
  | WebhookJob 
  | DataProcessingJob 
  | ReportJob 
  | BackupJob 
  | ScheduledJob 
  | AuditJob 
  | AnalyticsJob 
  | FileProcessingJob;

export interface JobResult {
  success: boolean;
  data?: any;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  metadata?: Record<string, any>;
  executionTime: number;
}