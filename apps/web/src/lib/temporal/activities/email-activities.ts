import { emailService, type EmailSendOptions } from '@/lib/services/email-service';
import { logger } from '@/lib/logger';

// Email workflow activities
export interface EmailActivityContext {
  tenantId: number;
  workflowId: string;
  workflowRunId: string;
  userId?: number;
}

export interface SendEmailActivity {
  templateKey: string;
  to: string | string[];
  variables?: Record<string, any>;
  language?: string;
  priority?: 'high' | 'normal' | 'low';
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

export interface SendBulkEmailActivity {
  templateKey: string;
  recipients: Array<{
    email: string;
    variables?: Record<string, any>;
    userId?: number;
  }>;
  language?: string;
  priority?: 'high' | 'normal' | 'low';
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

export interface CreateEmailTemplateActivity {
  key: string;
  name: string;
  description?: string;
  type: 'welcome' | 'verification' | 'password_reset' | 'notification' | 'marketing' | 'workflow' | 'custom';
  language: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  variables?: Array<{
    key: string;
    name: string;
    description?: string;
    dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
    isRequired: boolean;
    defaultValue?: any;
  }>;
  defaultVariables?: Record<string, any>;
  testData?: Record<string, any>;
}

// Activity implementations
export async function sendEmailActivity(
  context: EmailActivityContext,
  emailData: SendEmailActivity
): Promise<string> {
  try {
    logger.info('Sending email via workflow activity', {
      workflowId: context.workflowId,
      templateKey: emailData.templateKey,
      to: emailData.to,
      tenantId: context.tenantId
    });

    const jobId = await emailService.sendEmail({
      tenantId: context.tenantId,
      to: emailData.to,
      templateKey: emailData.templateKey,
      variables: emailData.variables,
      language: emailData.language || 'en',
      emailType: 'notification',
      priority: emailData.priority || 'normal',
      userId: context.userId,
      workflowId: context.workflowId,
      workflowRunId: context.workflowRunId,
      metadata: {
        ...emailData.metadata,
        triggeredByWorkflow: true,
        workflowActivity: 'sendEmailActivity'
      },
      scheduledAt: emailData.scheduledAt,
      tags: ['workflow', 'automated']
    });

    logger.info('Email sent successfully via workflow', {
      jobId,
      workflowId: context.workflowId,
      templateKey: emailData.templateKey
    });

    return jobId;
  } catch (error) {
    logger.error('Failed to send email via workflow activity', {
      error: error.message,
      workflowId: context.workflowId,
      templateKey: emailData.templateKey,
      tenantId: context.tenantId
    });
    throw error;
  }
}

export async function sendBulkEmailActivity(
  context: EmailActivityContext,
  bulkEmailData: SendBulkEmailActivity
): Promise<string[]> {
  try {
    logger.info('Sending bulk emails via workflow activity', {
      workflowId: context.workflowId,
      templateKey: bulkEmailData.templateKey,
      recipientCount: bulkEmailData.recipients.length,
      tenantId: context.tenantId
    });

    const jobIds: string[] = [];

    // Send emails in parallel with controlled concurrency
    const concurrency = 5; // Limit concurrent email sends
    for (let i = 0; i < bulkEmailData.recipients.length; i += concurrency) {
      const batch = bulkEmailData.recipients.slice(i, i + concurrency);

      const batchPromises = batch.map(async (recipient) => {
        return emailService.sendEmail({
          tenantId: context.tenantId,
          to: recipient.email,
          templateKey: bulkEmailData.templateKey,
          variables: recipient.variables || {},
          language: bulkEmailData.language || 'en',
          emailType: 'notification',
          priority: bulkEmailData.priority || 'normal',
          userId: recipient.userId || context.userId,
          workflowId: context.workflowId,
          workflowRunId: context.workflowRunId,
          metadata: {
            ...bulkEmailData.metadata,
            triggeredByWorkflow: true,
            workflowActivity: 'sendBulkEmailActivity',
            batchIndex: Math.floor(i / concurrency)
          },
          scheduledAt: bulkEmailData.scheduledAt,
          tags: ['workflow', 'automated', 'bulk']
        });
      });

      const batchJobIds = await Promise.all(batchPromises);
      jobIds.push(...batchJobIds);

      // Small delay between batches to avoid overwhelming the system
      if (i + concurrency < bulkEmailData.recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    logger.info('Bulk emails sent successfully via workflow', {
      jobIds: jobIds.slice(0, 5), // Log first 5 job IDs
      totalSent: jobIds.length,
      workflowId: context.workflowId,
      templateKey: bulkEmailData.templateKey
    });

    return jobIds;
  } catch (error) {
    logger.error('Failed to send bulk emails via workflow activity', {
      error: error.message,
      workflowId: context.workflowId,
      templateKey: bulkEmailData.templateKey,
      tenantId: context.tenantId
    });
    throw error;
  }
}

export async function sendWelcomeEmailActivity(
  context: EmailActivityContext,
  userData: {
    email: string;
    firstName: string;
    lastName: string;
    userId?: number;
    language?: string;
    customVariables?: Record<string, any>;
  }
): Promise<string> {
  try {
    logger.info('Sending welcome email via workflow activity', {
      workflowId: context.workflowId,
      email: userData.email,
      tenantId: context.tenantId
    });

    const jobId = await emailService.sendEmail({
      tenantId: context.tenantId,
      to: userData.email,
      templateKey: 'welcome',
      variables: {
        user: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          fullName: `${userData.firstName} ${userData.lastName}`,
          email: userData.email
        },
        ...userData.customVariables
      },
      language: userData.language || 'en',
      emailType: 'transactional',
      priority: 'normal',
      userId: userData.userId || context.userId,
      workflowId: context.workflowId,
      workflowRunId: context.workflowRunId,
      metadata: {
        triggeredByWorkflow: true,
        workflowActivity: 'sendWelcomeEmailActivity',
        userOnboarding: true
      },
      tags: ['workflow', 'welcome', 'onboarding']
    });

    logger.info('Welcome email sent successfully via workflow', {
      jobId,
      workflowId: context.workflowId,
      email: userData.email
    });

    return jobId;
  } catch (error) {
    logger.error('Failed to send welcome email via workflow activity', {
      error: error.message,
      workflowId: context.workflowId,
      email: userData.email,
      tenantId: context.tenantId
    });
    throw error;
  }
}

export async function sendNotificationEmailActivity(
  context: EmailActivityContext,
  notificationData: {
    to: string | string[];
    subject?: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
    priority?: 'high' | 'normal' | 'low';
    metadata?: Record<string, any>;
  }
): Promise<string> {
  try {
    logger.info('Sending notification email via workflow activity', {
      workflowId: context.workflowId,
      to: notificationData.to,
      tenantId: context.tenantId
    });

    const jobId = await emailService.sendEmail({
      tenantId: context.tenantId,
      to: notificationData.to,
      templateKey: 'notification',
      variables: {
        notification: {
          message: notificationData.message,
          actionUrl: notificationData.actionUrl,
          actionText: notificationData.actionText || 'View Details'
        }
      },
      subject: notificationData.subject,
      emailType: 'notification',
      priority: notificationData.priority || 'normal',
      userId: context.userId,
      workflowId: context.workflowId,
      workflowRunId: context.workflowRunId,
      metadata: {
        ...notificationData.metadata,
        triggeredByWorkflow: true,
        workflowActivity: 'sendNotificationEmailActivity'
      },
      tags: ['workflow', 'notification']
    });

    logger.info('Notification email sent successfully via workflow', {
      jobId,
      workflowId: context.workflowId,
      to: notificationData.to
    });

    return jobId;
  } catch (error) {
    logger.error('Failed to send notification email via workflow activity', {
      error: error.message,
      workflowId: context.workflowId,
      to: notificationData.to,
      tenantId: context.tenantId
    });
    throw error;
  }
}

export async function createEmailTemplateActivity(
  context: EmailActivityContext,
  templateData: CreateEmailTemplateActivity
): Promise<number> {
  try {
    logger.info('Creating email template via workflow activity', {
      workflowId: context.workflowId,
      templateKey: templateData.key,
      tenantId: context.tenantId
    });

    const templateId = await emailService.createTemplate({
      tenantId: context.tenantId,
      key: templateData.key,
      name: templateData.name,
      description: templateData.description,
      type: templateData.type,
      language: templateData.language,
      subject: templateData.subject,
      htmlContent: templateData.htmlContent,
      textContent: templateData.textContent,
      variables: templateData.variables,
      defaultVariables: templateData.defaultVariables,
      testData: templateData.testData,
      workflowTriggers: [context.workflowId]
    });

    logger.info('Email template created successfully via workflow', {
      templateId,
      workflowId: context.workflowId,
      templateKey: templateData.key
    });

    return templateId;
  } catch (error) {
    logger.error('Failed to create email template via workflow activity', {
      error: error.message,
      workflowId: context.workflowId,
      templateKey: templateData.key,
      tenantId: context.tenantId
    });
    throw error;
  }
}

export async function sendTestEmailActivity(
  context: EmailActivityContext,
  testData: {
    templateId: number;
    testEmail: string;
    variables?: Record<string, any>;
  }
): Promise<string> {
  try {
    logger.info('Sending test email via workflow activity', {
      workflowId: context.workflowId,
      templateId: testData.templateId,
      testEmail: testData.testEmail,
      tenantId: context.tenantId
    });

    const jobId = await emailService.sendTestEmail(
      testData.templateId,
      testData.testEmail,
      {
        ...testData.variables,
        workflow: {
          id: context.workflowId,
          runId: context.workflowRunId
        }
      }
    );

    logger.info('Test email sent successfully via workflow', {
      jobId,
      workflowId: context.workflowId,
      templateId: testData.templateId
    });

    return jobId;
  } catch (error) {
    logger.error('Failed to send test email via workflow activity', {
      error: error.message,
      workflowId: context.workflowId,
      templateId: testData.templateId,
      tenantId: context.tenantId
    });
    throw error;
  }
}

// Email verification activity for workflow-based verification
export async function sendVerificationEmailActivity(
  context: EmailActivityContext,
  verificationData: {
    email: string;
    firstName: string;
    verificationToken: string;
    expiresAt: Date;
    userId?: number;
    language?: string;
  }
): Promise<string> {
  try {
    logger.info('Sending verification email via workflow activity', {
      workflowId: context.workflowId,
      email: verificationData.email,
      tenantId: context.tenantId
    });

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationData.verificationToken}`;

    const jobId = await emailService.sendEmail({
      tenantId: context.tenantId,
      to: verificationData.email,
      templateKey: 'verification',
      variables: {
        user: {
          firstName: verificationData.firstName,
          email: verificationData.email
        },
        verification: {
          url: verificationUrl,
          token: verificationData.verificationToken,
          expiresAt: verificationData.expiresAt.toISOString()
        }
      },
      language: verificationData.language || 'en',
      emailType: 'transactional',
      priority: 'high',
      userId: verificationData.userId || context.userId,
      workflowId: context.workflowId,
      workflowRunId: context.workflowRunId,
      metadata: {
        triggeredByWorkflow: true,
        workflowActivity: 'sendVerificationEmailActivity',
        verificationType: 'email'
      },
      tags: ['workflow', 'verification', 'security']
    });

    logger.info('Verification email sent successfully via workflow', {
      jobId,
      workflowId: context.workflowId,
      email: verificationData.email
    });

    return jobId;
  } catch (error) {
    logger.error('Failed to send verification email via workflow activity', {
      error: error.message,
      workflowId: context.workflowId,
      email: verificationData.email,
      tenantId: context.tenantId
    });
    throw error;
  }
}

// Export all activities for Temporal worker registration
export const emailActivities = {
  sendEmailActivity,
  sendBulkEmailActivity,
  sendWelcomeEmailActivity,
  sendNotificationEmailActivity,
  createEmailTemplateActivity,
  sendTestEmailActivity,
  sendVerificationEmailActivity,
}; 