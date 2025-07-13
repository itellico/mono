/**
 * Simplified Email Service
 * 
 * This service implements the finalized email architecture:
 * - Single unified API for sending emails
 * - MJML + Nunjucks template rendering
 * - Mailgun integration for production
 * - Mailpit for development
 * - Queue-based sending with Redis
 * - Tenant branding support
 * - Template validation and error handling
 */

import { templateRenderer, type TemplateVariables, type EmailTemplate } from './template-renderer';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

// Types
export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  templatePath?: string;
  templateString?: string;
  variables?: TemplateVariables;
  subject?: string;
  tenantId?: number;
  category?: 'authentication' | 'notification' | 'workflow' | 'marketing' | 'system';
  priority?: 'high' | 'normal' | 'low';
  scheduleAt?: Date;
  trackOpens?: boolean;
  trackClicks?: boolean;
  tags?: string[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  templateRendered?: EmailTemplate;
}

export interface EmailQueueItem {
  id: string;
  options: EmailOptions;
  attempts: number;
  createdAt: Date;
  scheduledFor?: Date;
}

export class SimplifiedEmailService {
  private mailgun: any;
  private isProduction: boolean;
  private domain: string;
  private queueKey = 'email:queue';
  
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.domain = process.env.MAILGUN_DOMAIN || 'mg.monoplatform.com';
    
    // Initialize Mailgun for production
    if (this.isProduction && process.env.MAILGUN_API_KEY) {
      const mg = new Mailgun(formData);
      this.mailgun = mg.client({
        username: 'api',
        key: process.env.MAILGUN_API_KEY,
        url: 'https://api.mailgun.net',
      });
    }
  }
  
  /**
   * Send email using template path
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Validate required options
      if (!options.to) {
        throw new Error('Recipient email address is required');
      }
      
      if (!options.templatePath && !options.templateString) {
        throw new Error('Either templatePath or templateString is required');
      }
      
      // Render template
      let template: EmailTemplate;
      
      if (options.templatePath) {
        template = await templateRenderer.renderTemplate(
          options.templatePath,
          options.variables || {},
          options.tenantId
        );
      } else if (options.templateString) {
        template = await templateRenderer.renderTemplateString(
          options.templateString,
          options.variables || {},
          options.subject || 'mono Platform Notification'
        );
      } else {
        throw new Error('No template provided');
      }
      
      // Override subject if provided
      if (options.subject) {
        template.subject = options.subject;
      }
      
      // Queue email for processing
      if (options.scheduleAt && options.scheduleAt > new Date()) {
        await this.scheduleEmail(options, template);
        return {
          success: true,
          messageId: `scheduled-${Date.now()}`,
          templateRendered: template,
        };
      }
      
      // Send immediately or queue for background processing
      if (options.priority === 'high') {
        return await this.sendEmailDirect(options, template);
      } else {
        await this.queueEmail(options, template);
        return {
          success: true,
          messageId: `queued-${Date.now()}`,
          templateRendered: template,
        };
      }
      
    } catch (error) {
      console.error('Email sending error:', error);
      
      // Log error to database
      await this.logEmailError(options, error.message);
      
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  /**
   * Send email immediately (synchronous)
   */
  async sendEmailDirect(options: EmailOptions, template: EmailTemplate): Promise<EmailResult> {
    try {
      let result: any;
      
      if (this.isProduction && this.mailgun) {
        // Production: Use Mailgun
        result = await this.sendViaMailgun(options, template);
      } else {
        // Development: Use Mailpit (SMTP)
        result = await this.sendViaDevelopmentSMTP(options, template);
      }
      
      // Log successful send
      await this.logEmailSent(options, template, result.id || result.messageId);
      
      return {
        success: true,
        messageId: result.id || result.messageId,
        templateRendered: template,
      };
      
    } catch (error) {
      console.error('Direct email sending error:', error);
      await this.logEmailError(options, error.message);
      
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  /**
   * Queue email for background processing
   */
  private async queueEmail(options: EmailOptions, template: EmailTemplate): Promise<void> {
    const queueItem: EmailQueueItem = {
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      options,
      attempts: 0,
      createdAt: new Date(),
      scheduledFor: options.scheduleAt,
    };
    
    // Add template to options for queue processing
    const queueData = {
      ...queueItem,
      template,
    };
    
    await redis.lpush(this.queueKey, JSON.stringify(queueData));
  }
  
  /**
   * Schedule email for future sending
   */
  private async scheduleEmail(options: EmailOptions, template: EmailTemplate): Promise<void> {
    const scheduleTime = options.scheduleAt!.getTime();
    const queueItem = {
      id: `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      options,
      template,
      attempts: 0,
      createdAt: new Date(),
      scheduledFor: options.scheduleAt,
    };
    
    await redis.zadd(
      'email:scheduled',
      scheduleTime,
      JSON.stringify(queueItem)
    );
  }
  
  /**
   * Send via Mailgun (Production)
   */
  private async sendViaMailgun(options: EmailOptions, template: EmailTemplate): Promise<any> {
    const mailgunData = {
      from: this.getFromAddress(options.tenantId),
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      ...(options.cc && { cc: Array.isArray(options.cc) ? options.cc.join(',') : options.cc }),
      ...(options.bcc && { bcc: Array.isArray(options.bcc) ? options.bcc.join(',') : options.bcc }),
      ...(options.replyTo && { 'h:Reply-To': options.replyTo }),
      ...(options.trackOpens !== false && { 'o:tracking-opens': 'yes' }),
      ...(options.trackClicks !== false && { 'o:tracking-clicks': 'yes' }),
      ...(options.tags && { 'o:tag': options.tags }),
    };
    
    return await this.mailgun.messages.create(this.domain, mailgunData);
  }
  
  /**
   * Send via Development SMTP (Mailpit)
   */
  private async sendViaDevelopmentSMTP(options: EmailOptions, template: EmailTemplate): Promise<any> {
    // For development, we'll use nodemailer with Mailpit SMTP
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      host: 'localhost',
      port: 1025, // Mailpit SMTP port
      secure: false,
      auth: false, // Mailpit doesn't require auth
    });
    
    const mailOptions = {
      from: this.getFromAddress(options.tenantId),
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      ...(options.cc && { cc: Array.isArray(options.cc) ? options.cc.join(', ') : options.cc }),
      ...(options.bcc && { bcc: Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc }),
      ...(options.replyTo && { replyTo: options.replyTo }),
    };
    
    return await transporter.sendMail(mailOptions);
  }
  
  /**
   * Get appropriate "from" address based on tenant
   */
  private getFromAddress(tenantId?: number): string {
    // TODO: Load tenant-specific from address from database
    if (tenantId) {
      return `${process.env.TENANT_FROM_NAME || 'mono Platform'} <noreply@${this.domain}>`;
    }
    
    return `${process.env.PLATFORM_NAME || 'mono Platform'} <noreply@${this.domain}>`;
  }
  
  /**
   * Log successful email send to database
   */
  private async logEmailSent(
    options: EmailOptions,
    template: EmailTemplate,
    messageId: string
  ): Promise<void> {
    try {
      // TODO: Implement database logging
      await prisma.emailLog.create({
        data: {
          messageId,
          to: Array.isArray(options.to) ? options.to.join(',') : options.to,
          subject: template.subject,
          templatePath: options.templatePath,
          category: options.category || 'notification',
          status: 'sent',
          tenantId: options.tenantId,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error logging email send:', error);
    }
  }
  
  /**
   * Log email error to database
   */
  private async logEmailError(options: EmailOptions, error: string): Promise<void> {
    try {
      // TODO: Implement database logging
      await prisma.emailLog.create({
        data: {
          messageId: `error-${Date.now()}`,
          to: Array.isArray(options.to) ? options.to.join(',') : options.to,
          subject: options.subject || 'Unknown',
          templatePath: options.templatePath,
          category: options.category || 'notification',
          status: 'failed',
          error,
          tenantId: options.tenantId,
          sentAt: new Date(),
        },
      });
    } catch (dbError) {
      console.error('Error logging email error:', dbError);
    }
  }
  
  /**
   * Process email queue (called by background worker)
   */
  async processEmailQueue(maxItems: number = 10): Promise<number> {
    let processed = 0;
    
    try {
      for (let i = 0; i < maxItems; i++) {
        const queueData = await redis.rpop(this.queueKey);
        if (!queueData) break;
        
        const item = JSON.parse(queueData);
        const result = await this.sendEmailDirect(item.options, item.template);
        
        if (!result.success && item.attempts < 3) {
          // Retry failed emails up to 3 times
          item.attempts++;
          await redis.lpush(this.queueKey, JSON.stringify(item));
        }
        
        processed++;
      }
    } catch (error) {
      console.error('Error processing email queue:', error);
    }
    
    return processed;
  }
  
  /**
   * Process scheduled emails (called by background worker)
   */
  async processScheduledEmails(): Promise<number> {
    let processed = 0;
    const now = Date.now();
    
    try {
      // Get emails scheduled for now or earlier
      const scheduledEmails = await redis.zrangebyscore(
        'email:scheduled',
        0,
        now,
        'WITHSCORES'
      );
      
      for (let i = 0; i < scheduledEmails.length; i += 2) {
        const emailData = scheduledEmails[i];
        const score = scheduledEmails[i + 1];
        
        const item = JSON.parse(emailData);
        await this.sendEmailDirect(item.options, item.template);
        
        // Remove from scheduled set
        await redis.zrem('email:scheduled', emailData);
        processed++;
      }
    } catch (error) {
      console.error('Error processing scheduled emails:', error);
    }
    
    return processed;
  }
  
  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    scheduled: number;
    processing: boolean;
  }> {
    try {
      const pending = await redis.llen(this.queueKey);
      const scheduled = await redis.zcard('email:scheduled');
      
      return {
        pending,
        scheduled,
        processing: true, // TODO: Implement processing status tracking
      };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      return { pending: 0, scheduled: 0, processing: false };
    }
  }
  
  /**
   * Validate template exists
   */
  async validateTemplate(templatePath: string): Promise<boolean> {
    return await templateRenderer.templateExists(templatePath);
  }
  
  /**
   * List available templates
   */
  async listTemplates(category?: string): Promise<string[]> {
    return await templateRenderer.listTemplates(category);
  }
}

// Export singleton instance
export const emailService = new SimplifiedEmailService();

// Convenience functions for common email types
export const sendWelcomeEmail = async (
  userEmail: string,
  userName: string,
  userType: string,
  tenantId?: number
) => {
  return await emailService.sendEmail({
    to: userEmail,
    templatePath: 'system/auth/welcome',
    variables: {
      userName,
      userEmail,
      userType,
      verificationRequired: true,
    },
    tenantId,
    category: 'authentication',
    priority: 'high',
  });
};

export const sendPasswordResetEmail = async (
  userEmail: string,
  userName: string,
  resetUrl: string,
  tenantId?: number
) => {
  return await emailService.sendEmail({
    to: userEmail,
    templatePath: 'system/auth/password-reset',
    variables: {
      userName,
      userEmail,
      resetUrl,
      expirationHours: 24,
      requestIp: 'Unknown', // TODO: Get from request context
      requestTime: new Date().toLocaleString(),
    },
    tenantId,
    category: 'authentication',
    priority: 'high',
  });
};

export const sendEmailVerification = async (
  userEmail: string,
  userName: string,
  verificationUrl: string,
  userType: string,
  tenantId?: number
) => {
  return await emailService.sendEmail({
    to: userEmail,
    templatePath: 'system/auth/email-verification',
    variables: {
      userName,
      userEmail,
      verificationUrl,
      userType,
      expirationHours: 48,
    },
    tenantId,
    category: 'authentication',
    priority: 'high',
  });
};

export const sendApplicationStatusEmail = async (
  userEmail: string,
  userName: string,
  status: 'approved' | 'rejected' | 'shortlisted',
  projectTitle: string,
  additionalData: Record<string, any> = {},
  tenantId?: number
) => {
  return await emailService.sendEmail({
    to: userEmail,
    templatePath: 'tenant/workflow/application-status',
    variables: {
      userName,
      status,
      projectTitle,
      ...additionalData,
    },
    tenantId,
    category: 'workflow',
    priority: 'normal',
  });
};

// Export types
export type { EmailOptions, EmailResult, EmailQueueItem };