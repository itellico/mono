import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { 
  emailTemplates, 
  emailDeliveries, 
  emailPreferences, 
  emailCampaigns,
  emailAnalytics,
  emailProviders,
  emailTemplateVariables,
  tenants
} from '@/lib/schemas';
import { queueEmail } from '@/lib/email-queue';
import { logger } from '@/lib/logger';
import Handlebars from 'handlebars';
import { readFile } from 'fs/promises';
import path from 'path';
import { reactEmailService, type EmailTemplateName } from './react-email-service';

// Type definitions for enums
type EmailType = 'transactional' | 'marketing' | 'notification' | 'system';
type EmailPriority = 'high' | 'normal' | 'low';
type EmailStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked';
type TemplateType = 'welcome' | 'verification' | 'password_reset' | 'notification' | 'marketing' | 'workflow' | 'custom';

// Types for email service
export interface EmailTemplateData {
  id?: number;
  tenantId: number;
  key: string;
  name: string;
  description?: string;
  type: TemplateType;
  language: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  variables?: TemplateVariable[];
  defaultVariables?: Record<string, any>;
  workflowTriggers?: string[];
  isActive?: boolean;
  isDefault?: boolean;
  testData?: Record<string, any>;
  renderEngine?: 'handlebars' | 'react-email'; // New field for template engine
  reactComponent?: string; // React component name for React Email templates
}

export interface TemplateVariable {
  key: string;
  name: string;
  description?: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  isRequired: boolean;
  defaultValue?: any;
  validationRules?: Record<string, any>;
  formatters?: string[];
  groupName?: string;
  displayOrder?: number;
}

export interface EmailSendOptions {
  tenantId: number;
  to: string | string[];
  templateKey?: string;
  templateId?: number;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  variables?: Record<string, any>;
  language?: string;
  emailType: EmailType;
  priority?: EmailPriority;
  userId?: number;
  campaignId?: number;
  workflowId?: string;
  workflowRunId?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  scheduledAt?: Date;
}

export interface ReactEmailSendOptions extends Omit<EmailSendOptions, 'templateKey' | 'templateId' | 'htmlContent' | 'textContent'> {
  templateName: EmailTemplateName;
  props: Record<string, any>;
}

export interface EmailCampaignOptions {
  tenantId: number;
  name: string;
  description?: string;
  templateId: number;
  targetAudience: Record<string, any>;
  scheduledAt?: Date;
  isTest?: boolean;
  sendTestTo?: string[];
  createdBy: number;
}

// Enhanced Email Service Class with React Email Support
export class EnhancedEmailService {
  private static instance: EnhancedEmailService;
  private templateCache = new Map<string, any>();
  private handlebarsCache = new Map<string, HandlebarsTemplateDelegate>();

  static getInstance(): EnhancedEmailService {
    if (!EnhancedEmailService.instance) {
      EnhancedEmailService.instance = new EnhancedEmailService();
    }
    return EnhancedEmailService.instance;
  }

  // React Email Methods
  async sendReactEmail(options: ReactEmailSendOptions): Promise<string> {
    try {
      // Add tenant and system context to props
      const enhancedProps = {
        ...options.props,
        tenant: await this.getTenantContext(options.tenantId),
        system: this.getSystemContext()
      };

      // Render React Email template
      const { html, text } = await reactEmailService.renderTemplate(options.templateName, enhancedProps);

      // Use the existing sendEmail method with rendered content
      return this.sendEmail({
        ...options,
        htmlContent: html,
        textContent: text
      });
    } catch (error) {
      logger.error('Failed to send React email', {
        error: error.message,
        templateName: options.templateName,
        props: options.props,
        options
      });
      throw error;
    }
  }

  async previewReactEmail(
    templateName: EmailTemplateName,
    props: Record<string, any>,
    tenantId: number
  ): Promise<{ html: string; text: string }> {
    try {
      // Add tenant and system context to props
      const enhancedProps = {
        ...props,
        tenant: await this.getTenantContext(tenantId),
        system: this.getSystemContext()
      };

      return reactEmailService.renderTemplate(templateName, enhancedProps);
    } catch (error) {
      logger.error('Failed to preview React email', {
        error: error.message,
        templateName,
        props,
        tenantId
      });
      throw error;
    }
  }

  async sendTestReactEmail(
    templateName: EmailTemplateName,
    testEmail: string,
    props?: Record<string, any>,
    tenantId: number = 1
  ): Promise<string> {
    try {
      return this.sendReactEmail({
        tenantId,
        to: testEmail,
        templateName,
        props: props || {},
        emailType: 'transactional',
        priority: 'normal'
      });
    } catch (error) {
      logger.error('Failed to send test React email', {
        error: error.message,
        templateName,
        testEmail,
        props
      });
      throw error;
    }
  }

  // Template Management (existing methods enhanced)
  async createTemplate(templateData: EmailTemplateData): Promise<number> {
    try {
      const result = await db.insert(emailTemplates).values({
        tenantId: templateData.tenantId,
        key: templateData.key,
        name: templateData.name,
        description: templateData.description,
        type: templateData.type,
        language: templateData.language || 'en',
        subject: templateData.subject,
        htmlContent: templateData.htmlContent,
        textContent: templateData.textContent,
        variables: templateData.variables ? JSON.stringify(templateData.variables) : '[]',
        defaultVariables: templateData.defaultVariables ? JSON.stringify(templateData.defaultVariables) : '{}',
        workflowTriggers: templateData.workflowTriggers ? JSON.stringify(templateData.workflowTriggers) : '[]',
        isActive: templateData.isActive ?? true,
        isDefault: templateData.isDefault ?? false,
        testData: templateData.testData ? JSON.stringify(templateData.testData) : '{}',
        // Add React Email support fields
        metadata: JSON.stringify({
          renderEngine: templateData.renderEngine || 'handlebars',
          reactComponent: templateData.reactComponent
        })
      }).returning({ id: emailTemplates.id });

      const templateId = result[0].id;

      // Create template variables if provided
      if (templateData.variables && templateData.variables.length > 0) {
        await this.createTemplateVariables(templateId, templateData.variables);
      }

      // Clear cache for this template
      this.clearTemplateCache(templateData.tenantId, templateData.key, templateData.language);

      logger.info('Email template created', {
        templateId,
        tenantId: templateData.tenantId,
        key: templateData.key,
        language: templateData.language,
        renderEngine: templateData.renderEngine
      });

      return templateId;
    } catch (error) {
      logger.error('Failed to create email template', {
        error: error.message,
        templateData
      });
      throw error;
    }
  }

  async updateTemplate(templateId: number, templateData: Partial<EmailTemplateData>): Promise<void> {
    try {
      const updateData: any = {
        ...templateData,
        updatedAt: new Date().toISOString(),
      };

      // Handle JSON fields
      if (templateData.variables) {
        updateData.variables = JSON.stringify(templateData.variables);
      }
      if (templateData.defaultVariables) {
        updateData.defaultVariables = JSON.stringify(templateData.defaultVariables);
      }
      if (templateData.workflowTriggers) {
        updateData.workflowTriggers = JSON.stringify(templateData.workflowTriggers);
      }
      if (templateData.testData) {
        updateData.testData = JSON.stringify(templateData.testData);
      }

      // Handle React Email metadata
      if (templateData.renderEngine || templateData.reactComponent) {
        const existingTemplate = await this.getTemplateById(templateId);
        const existingMetadata = JSON.parse(existingTemplate.metadata || '{}');

        updateData.metadata = JSON.stringify({
          ...existingMetadata,
          renderEngine: templateData.renderEngine || existingMetadata.renderEngine,
          reactComponent: templateData.reactComponent || existingMetadata.reactComponent
        });
      }

      await db.update(emailTemplates)
        .set(updateData)
        .where(eq(emailTemplates.id, templateId));

      // Update template variables if provided
      if (templateData.variables) {
        await this.updateTemplateVariables(templateId, templateData.variables);
      }

      // Clear cache
      if (templateData.tenantId && templateData.key && templateData.language) {
        this.clearTemplateCache(templateData.tenantId, templateData.key, templateData.language);
      }

      logger.info('Email template updated', { templateId });
    } catch (error) {
      logger.error('Failed to update email template', {
        error: error.message,
        templateId
      });
      throw error;
    }
  }

  async getTemplate(tenantId: number, key: string, language: string = 'en'): Promise<any> {
    const cacheKey = `${tenantId}:${key}:${language}`;

    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey);
    }

    try {
      const template = await db.select().from(emailTemplates)
        .where(and(
          eq(emailTemplates.tenantId, tenantId),
          eq(emailTemplates.key, key),
          eq(emailTemplates.language, language),
          eq(emailTemplates.isActive, true)
        ))
        .limit(1)
        .then(results => results[0]);

      if (!template) {
        // Try fallback to default language (en)
        if (language !== 'en') {
          return this.getTemplate(tenantId, key, 'en');
        }
        throw new Error(`Template not found: ${key} for tenant ${tenantId} in language ${language}`);
      }

      // Parse JSON fields
      template.variables = JSON.parse(template.variables as string || '[]');
      template.defaultVariables = JSON.parse(template.defaultVariables as string || '{}');
      template.workflowTriggers = JSON.parse(template.workflowTriggers as string || '[]');
      template.testData = JSON.parse(template.testData as string || '{}');

      // Parse metadata for React Email support
      const metadata = JSON.parse(template.metadata as string || '{}');
      template.renderEngine = metadata.renderEngine || 'handlebars';
      template.reactComponent = metadata.reactComponent;

      // Cache the template
      this.templateCache.set(cacheKey, template);

      return template;
    } catch (error) {
      logger.error('Failed to get email template', {
        error: error.message,
        tenantId,
        key,
        language
      });
      throw error;
    }
  }

  // Enhanced sendEmail method that supports both Handlebars and React Email
  async sendEmail(options: EmailSendOptions): Promise<string> {
    try {
      let htmlContent = options.htmlContent;
      let textContent = options.textContent;
      let subject = options.subject;
      let templateId: number | undefined;

      // If using a template, render it
      if (options.templateKey || options.templateId) {
        const template = options.templateId 
          ? await this.getTemplateById(options.templateId)
          : await this.getTemplate(options.tenantId, options.templateKey!, options.language);

        templateId = template.id;

        // Merge variables with defaults
        const templateVariables = {
          ...template.defaultVariables,
          ...options.variables,
          tenant: await this.getTenantContext(options.tenantId),
          system: this.getSystemContext()
        };

        // Choose rendering engine based on template configuration
        if (template.renderEngine === 'react-email' && template.reactComponent) {
          // Use React Email rendering
          if (reactEmailService.hasTemplate(template.reactComponent)) {
            const rendered = await reactEmailService.renderTemplate(
              template.reactComponent as EmailTemplateName, 
              templateVariables
            );
            htmlContent = rendered.html;
            textContent = rendered.text;
          } else {
            logger.warn('React Email template not found, falling back to Handlebars', {
              reactComponent: template.reactComponent
            });
            // Fall back to Handlebars
            if (template.htmlContent) {
              htmlContent = await this.renderTemplate(template.htmlContent, templateVariables);
            }
            if (template.textContent) {
              textContent = await this.renderTemplate(template.textContent, templateVariables);
            }
          }
        } else {
          // Use Handlebars rendering (default)
          if (template.htmlContent) {
            htmlContent = await this.renderTemplate(template.htmlContent, templateVariables);
          }
          if (template.textContent) {
            textContent = await this.renderTemplate(template.textContent, templateVariables);
          }
        }

        subject = await this.renderTemplate(template.subject, templateVariables);
      }

      // Check user email preferences
      if (options.userId) {
        const canSend = await this.checkEmailPreferences(
          options.userId, 
          options.tenantId, 
          options.emailType
        );
        if (!canSend) {
          logger.info('Email skipped due to user preferences', {
            userId: options.userId,
            emailType: options.emailType
          });
          return 'skipped';
        }
      }

      // Create delivery record
      const deliveryResult = await db.insert(emailDeliveries).values({
        tenantId: options.tenantId,
        userId: options.userId,
        recipientEmail: Array.isArray(options.to) ? options.to[0] : options.to,
        templateId,
        templateKey: options.templateKey,
        campaignId: options.campaignId,
        subject: subject!,
        emailType: options.emailType,
        priority: options.priority || 'normal',
        templateVariables: options.variables ? JSON.stringify(options.variables) : '{}',
        renderedContent: JSON.stringify({ html: htmlContent, text: textContent }),
        metadata: options.metadata ? JSON.stringify(options.metadata) : '{}',
        tags: options.tags ? JSON.stringify(options.tags) : '[]',
        workflowId: options.workflowId,
        workflowRunId: options.workflowRunId,
        scheduledAt: options.scheduledAt?.toISOString(),
      }).returning({ id: emailDeliveries.id });

      const deliveryId = deliveryResult[0].id;

      // Queue email for sending
      const jobId = await queueEmail({
        to: options.to,
        subject: subject!,
        html: htmlContent,
        text: textContent,
        priority: options.priority || 'normal',
        templateId: templateId?.toString(),
        templateData: {
          deliveryId,
          tenantId: options.tenantId,
          ...options.variables
        }
      }, {
        delay: options.scheduledAt ? Math.max(0, options.scheduledAt.getTime() - Date.now()) : 0
      });

      logger.info('Email queued for delivery', {
        deliveryId,
        jobId,
        tenantId: options.tenantId,
        to: options.to,
        templateKey: options.templateKey,
        emailType: options.emailType
      });

      return jobId;
    } catch (error) {
      logger.error('Failed to send email', {
        error: error.message,
        options
      });
      throw error;
    }
  }

  // Helper methods (keeping existing implementation)
  private async createTemplateVariables(templateId: number, variables: TemplateVariable[]): Promise<void> {
    const variableData = variables.map((variable, index) => ({
      templateId,
      key: variable.key,
      name: variable.name,
      description: variable.description,
      dataType: variable.dataType,
      isRequired: variable.isRequired,
      defaultValue: variable.defaultValue ? String(variable.defaultValue) : null,
      validationRules: variable.validationRules ? JSON.stringify(variable.validationRules) : '{}',
      formatters: variable.formatters ? JSON.stringify(variable.formatters) : '[]',
      displayOrder: variable.displayOrder ?? index,
      groupName: variable.groupName,
    }));

    await db.insert(emailTemplateVariables).values(variableData);
  }

  private async updateTemplateVariables(templateId: number, variables: TemplateVariable[]): Promise<void> {
    // Delete existing variables
    await db.delete(emailTemplateVariables)
      .where(eq(emailTemplateVariables.templateId, templateId));

    // Create new variables
    await this.createTemplateVariables(templateId, variables);
  }

  private async renderTemplate(template: string, variables: Record<string, any>): Promise<string> {
    try {
      const cacheKey = Buffer.from(template).toString('base64').substring(0, 50);

      let compiledTemplate: HandlebarsTemplateDelegate;
      if (this.handlebarsCache.has(cacheKey)) {
        compiledTemplate = this.handlebarsCache.get(cacheKey)!;
      } else {
        compiledTemplate = Handlebars.compile(template);
        this.handlebarsCache.set(cacheKey, compiledTemplate);
      }

      return compiledTemplate(variables);
    } catch (error) {
      logger.error('Failed to render template', {
        error: error.message,
        template: template.substring(0, 100)
      });
      throw error;
    }
  }

  private async getTenantContext(tenantId: number): Promise<Record<string, any>> {
    // Get tenant information for template variables
    const tenant = await db.select().from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1)
      .then(results => results[0]);

    return {
      id: tenant?.id,
      name: tenant?.name,
      domain: tenant?.domain,
      subdomain: tenant?.subdomain,
      settings: tenant?.settings ? JSON.parse(tenant.settings as string) : {}
    };
  }

  private getSystemContext(): Record<string, any> {
    return {
      domain: process.env.SYSTEM_DOMAIN || 'https://mono.com',
      supportEmail: process.env.SYSTEM_SUPPORT_EMAIL || 'support@mono.com',
      companyName: process.env.COMPANY_NAME || 'GoModels',
      currentYear: new Date().getFullYear(),
    };
  }

  private async checkEmailPreferences(
    userId: number, 
    tenantId: number, 
    emailType: EmailType
  ): Promise<boolean> {
    try {
      const preferences = await db.select().from(emailPreferences)
        .where(and(
          eq(emailPreferences.userId, userId),
          eq(emailPreferences.tenantId, tenantId)
        ))
        .limit(1)
        .then(results => results[0]);

      if (!preferences) {
        // Default to allowing all emails if no preferences set
        return true;
      }

      const settings = JSON.parse(preferences.preferences as string || '{}');

      // Check specific email type preferences
      switch (emailType) {
        case 'transactional':
          return settings.transactional !== false; // Default to true
        case 'marketing':
          return settings.marketing === true; // Default to false
        case 'notification':
          return settings.notification !== false; // Default to true
        case 'system':
          return true; // System emails always sent
        default:
          return true;
      }
    } catch (error) {
      logger.error('Failed to check email preferences', {
        error: error.message,
        userId,
        tenantId,
        emailType
      });
      // Default to allowing email on error
      return true;
    }
  }

  private async getTemplateById(templateId: number): Promise<any> {
    try {
      const template = await db.select().from(emailTemplates)
        .where(eq(emailTemplates.id, templateId))
        .limit(1)
        .then(results => results[0]);

      if (!template) {
        throw new Error(`Template not found with ID: ${templateId}`);
      }

      // Parse JSON fields
      template.variables = JSON.parse(template.variables as string || '[]');
      template.defaultVariables = JSON.parse(template.defaultVariables as string || '{}');
      template.workflowTriggers = JSON.parse(template.workflowTriggers as string || '[]');
      template.testData = JSON.parse(template.testData as string || '{}');

      // Parse metadata for React Email support
      const metadata = JSON.parse(template.metadata as string || '{}');
      template.renderEngine = metadata.renderEngine || 'handlebars';
      template.reactComponent = metadata.reactComponent;

      return template;
    } catch (error) {
      logger.error('Failed to get template by ID', {
        error: error.message,
        templateId
      });
      throw error;
    }
  }

  private clearTemplateCache(tenantId: number, key: string, language: string): void {
    const cacheKey = `${tenantId}:${key}:${language}`;
    this.templateCache.delete(cacheKey);
  }

  async sendTestEmail(
    templateId: number, 
    testEmail: string, 
    variables?: Record<string, any>
  ): Promise<string> {
    try {
      const template = await this.getTemplateById(templateId);

      return this.sendEmail({
        tenantId: template.tenantId,
        to: testEmail,
        templateId,
        variables: variables || template.testData || {},
        emailType: 'transactional',
        priority: 'normal'
      });
    } catch (error) {
      logger.error('Failed to send test email', {
        error: error.message,
        templateId,
        testEmail
      });
      throw error;
    }
  }

  // React Email specific helper methods
  getAvailableReactTemplates(): EmailTemplateName[] {
    return reactEmailService.getAvailableTemplates();
  }

  async generateReactTemplatePreview(
    templateName: EmailTemplateName,
    sampleData?: Record<string, any>
  ): Promise<{ html: string; text: string }> {
    return reactEmailService.previewTemplate(templateName, sampleData);
  }
}

// Export singleton instance
export const enhancedEmailService = EnhancedEmailService.getInstance(); 