import { PrismaClient } from '@prisma/client';
import { FastifyRedis } from '@fastify/redis';
import { z } from 'zod';
import type { FastifyBaseLogger } from 'fastify';
import { getOrSetCache } from '../utils/cache-utils';
import Mailgun from 'mailgun.js';
import formData from 'form-data';

// Input validation schemas
const sendEmailSchema = z.object({
  tenantId: z.number().int().positive(),
  templateId: z.number().int().positive().optional(),
  templateSlug: z.string().optional(),
  to: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })).min(1),
  cc: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })).optional(),
  bcc: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })).optional(),
  subject: z.string().min(1).max(998).optional(), // Will use template if not provided
  variables: z.record(z.any()).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    data: z.string(), // base64 encoded or file path
    contentType: z.string(),
  })).optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  scheduledAt: z.string().datetime().optional(),
  tags: z.array(z.string()).max(3).optional(),
  metadata: z.record(z.string()).optional(),
});

const createTemplateSchema = z.object({
  tenantId: z.number().int().positive(),
  createdById: z.number().int().positive(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().min(1).max(50),
  subject: z.string().min(1).max(200),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'number', 'date', 'boolean', 'url', 'email']),
    required: z.boolean().default(false),
    defaultValue: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  settings: z.object({
    isActive: z.boolean().default(true),
    trackOpens: z.boolean().default(true),
    trackClicks: z.boolean().default(true),
    unsubscribeUrl: z.string().url().optional(),
  }).optional(),
  localization: z.object({
    defaultLocale: z.string().default('en-US'),
    translations: z.record(z.object({
      subject: z.string(),
      htmlContent: z.string(),
      textContent: z.string().optional(),
    })).optional(),
  }).optional(),
});

const updateTemplateSchema = createTemplateSchema.partial().extend({
  id: z.number().int().positive(),
});

const searchEmailsSchema = z.object({
  tenantId: z.number().int().positive(),
  status: z.enum(['pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked']).optional(),
  templateId: z.number().int().positive().optional(),
  recipient: z.string().email().optional(),
  subject: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['createdAt', 'scheduledAt', 'sentAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type SearchEmailsInput = z.infer<typeof searchEmailsSchema>;

interface MailgunConfig {
  apiKey: string;
  domain: string;
  host?: string;
}

export class EmailService {
  private prisma: PrismaClient;
  private redis: FastifyRedis;
  private logger?: FastifyBaseLogger;
  private mailgunConfig: MailgunConfig;
  private mailgun: any;

  constructor(
    prisma: PrismaClient, 
    redis: FastifyRedis, 
    mailgunConfig: MailgunConfig,
    logger?: FastifyBaseLogger
  ) {
    this.prisma = prisma;
    this.redis = redis;
    this.mailgunConfig = mailgunConfig;
    this.logger = logger;
    
    // Initialize Mailgun
    const mailgunInstance = new Mailgun(formData);
    this.mailgun = mailgunInstance.client({
      username: 'api',
      key: mailgunConfig.apiKey,
      url: mailgunConfig.host || 'https://api.mailgun.net',
    });
  }

  /**
   * Send email using template or direct content
   */
  async sendEmail(input: SendEmailInput) {
    const validated = sendEmailSchema.parse(input);
    
    let template = null;
    let emailSubject = validated.subject;
    let htmlContent = '';
    let textContent = '';

    // Get template if specified
    if (validated.templateId || validated.templateSlug) {
      template = await this.getTemplate(
        validated.tenantId, 
        validated.templateId, 
        validated.templateSlug
      );
      
      if (!template) {
        throw new Error('Email template not found');
      }

      if (!template.settings?.isActive) {
        throw new Error('Email template is not active');
      }

      // Use template content
      emailSubject = emailSubject || template.subject;
      htmlContent = template.htmlContent;
      textContent = template.textContent || '';

      // Replace variables in content
      if (validated.variables && Object.keys(validated.variables).length > 0) {
        emailSubject = this.replaceVariables(emailSubject, validated.variables);
        htmlContent = this.replaceVariables(htmlContent, validated.variables);
        textContent = this.replaceVariables(textContent, validated.variables);
      }
    }

    if (!emailSubject) {
      throw new Error('Email subject is required');
    }

    // Create email record
    const emailRecord = await this.prisma.emailLog.create({
      data: {
        tenantId: validated.tenantId,
        templateId: template?.id,
        recipients: validated.to.map(r => r.email),
        subject: emailSubject,
        htmlContent,
        textContent,
        variables: validated.variables || {},
        status: 'pending',
        priority: validated.priority,
        scheduledAt: validated.scheduledAt ? new Date(validated.scheduledAt) : null,
        tags: validated.tags || [],
        metadata: validated.metadata || {},
      },
    });

    try {
      // Prepare Mailgun message data
      const messageData: any = {
        from: await this.getTenantFromAddress(validated.tenantId),
        to: validated.to.map(r => r.name ? `${r.name} <${r.email}>` : r.email),
        subject: emailSubject,
        html: htmlContent,
        text: textContent,
        'o:tag': validated.tags || [],
        'o:tracking': template?.settings?.trackOpens !== false,
        'o:tracking-clicks': template?.settings?.trackClicks !== false,
        'v:email_id': emailRecord.uuid,
        'v:tenant_id': validated.tenantId,
      };

      // Add CC and BCC if specified
      if (validated.cc?.length) {
        messageData.cc = validated.cc.map(r => r.name ? `${r.name} <${r.email}>` : r.email);
      }
      if (validated.bcc?.length) {
        messageData.bcc = validated.bcc.map(r => r.name ? `${r.name} <${r.email}>` : r.email);
      }

      // Add attachments if specified
      if (validated.attachments?.length) {
        messageData.attachment = validated.attachments.map(att => ({
          data: Buffer.from(att.data, 'base64'),
          filename: att.filename,
          contentType: att.contentType,
        }));
      }

      // Schedule or send immediately
      if (validated.scheduledAt) {
        messageData['o:deliverytime'] = new Date(validated.scheduledAt).toUTCString();
      }

      // Send via Mailgun
      const result = await this.mailgun.messages.create(this.mailgunConfig.domain, messageData);

      // Update email record with success
      await this.prisma.emailLog.update({
        where: { id: emailRecord.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          mailgunId: result.id,
          response: result,
        },
      });

      // Invalidate email stats cache
      await this.invalidateEmailCache(validated.tenantId);

      return {
        emailId: emailRecord.uuid,
        mailgunId: result.id,
        status: 'sent',
        message: result.message,
      };

    } catch (error: any) {
      // Update email record with failure
      await this.prisma.emailLog.update({
        where: { id: emailRecord.id },
        data: {
          status: 'failed',
          error: error.message,
          response: { error: error.message },
        },
      });

      this.logger?.error({ error, emailId: emailRecord.uuid }, 'Failed to send email');
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Create email template
   */
  async createTemplate(input: CreateTemplateInput) {
    const validated = createTemplateSchema.parse(input);
    
    // Check if slug already exists for tenant
    const existingTemplate = await this.prisma.emailTemplate.findFirst({
      where: {
        tenantId: validated.tenantId,
        slug: validated.slug,
      },
    });

    if (existingTemplate) {
      throw new Error('Template with this slug already exists');
    }

    const template = await this.prisma.emailTemplate.create({
      data: {
        ...validated,
        settings: validated.settings || {},
        localization: validated.localization || {},
      },
    });

    // Invalidate template cache
    await this.invalidateTemplateCache(validated.tenantId);

    return template;
  }

  /**
   * Update email template
   */
  async updateTemplate(input: UpdateTemplateInput) {
    const validated = updateTemplateSchema.parse(input);
    const { id, ...updates } = validated;

    // Check template exists and belongs to tenant
    const existingTemplate = await this.prisma.emailTemplate.findFirst({
      where: {
        id,
        tenantId: updates.tenantId,
      },
    });

    if (!existingTemplate) {
      throw new Error('Template not found');
    }

    // Check slug uniqueness if being updated
    if (updates.slug && updates.slug !== existingTemplate.slug) {
      const duplicateSlug = await this.prisma.emailTemplate.findFirst({
        where: {
          tenantId: updates.tenantId,
          slug: updates.slug,
          id: { not: id },
        },
      });

      if (duplicateSlug) {
        throw new Error('Template with this slug already exists');
      }
    }

    const template = await this.prisma.emailTemplate.update({
      where: { id },
      data: updates,
    });

    // Invalidate template cache
    await this.invalidateTemplateCache(existingTemplate.tenantId);

    return template;
  }

  /**
   * Get template by ID or slug (cached)
   */
  async getTemplate(tenantId: number, templateId?: number, slug?: string) {
    if (!templateId && !slug) {
      throw new Error('Either templateId or slug must be provided');
    }

    const cacheKey = templateId 
      ? `tenant:${tenantId}:template:${templateId}`
      : `tenant:${tenantId}:template:slug:${slug}`;

    return getOrSetCache(
      this.redis,
      cacheKey,
      900, // 15 minutes
      async () => {
        const where: any = { tenantId };
        if (templateId) where.id = templateId;
        if (slug) where.slug = slug;

        return this.prisma.emailTemplate.findFirst({ where });
      }
    );
  }

  /**
   * Search email templates
   */
  async searchTemplates(tenantId: number, search?: string, category?: string, limit: number = 20, offset: number = 0) {
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const [templates, total] = await Promise.all([
      this.prisma.emailTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              uuid: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.emailTemplate.count({ where }),
    ]);

    return {
      templates,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Search email logs
   */
  async searchEmails(input: SearchEmailsInput) {
    const validated = searchEmailsSchema.parse(input);

    const where: any = { tenantId: validated.tenantId };

    if (validated.status) {
      where.status = validated.status;
    }

    if (validated.templateId) {
      where.templateId = validated.templateId;
    }

    if (validated.recipient) {
      where.recipients = {
        has: validated.recipient,
      };
    }

    if (validated.subject) {
      where.subject = { contains: validated.subject, mode: 'insensitive' };
    }

    if (validated.dateFrom || validated.dateTo) {
      where.createdAt = {};
      if (validated.dateFrom) where.createdAt.gte = new Date(validated.dateFrom);
      if (validated.dateTo) where.createdAt.lte = new Date(validated.dateTo);
    }

    if (validated.tags?.length) {
      where.tags = {
        hasEvery: validated.tags,
      };
    }

    const orderBy: any = {};
    orderBy[validated.sortBy] = validated.sortOrder;

    const [emails, total] = await Promise.all([
      this.prisma.emailLog.findMany({
        where,
        orderBy,
        skip: validated.offset,
        take: validated.limit,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      this.prisma.emailLog.count({ where }),
    ]);

    return {
      emails,
      total,
      hasMore: validated.offset + validated.limit < total,
    };
  }

  /**
   * Get email statistics
   */
  async getEmailStats(tenantId: number, dateFrom?: string, dateTo?: string) {
    const cacheKey = `tenant:${tenantId}:email:stats:${dateFrom || 'all'}:${dateTo || 'all'}`;

    return getOrSetCache(
      this.redis,
      cacheKey,
      300, // 5 minutes
      async () => {
        const where: any = { tenantId };

        if (dateFrom || dateTo) {
          where.createdAt = {};
          if (dateFrom) where.createdAt.gte = new Date(dateFrom);
          if (dateTo) where.createdAt.lte = new Date(dateTo);
        }

        const [statusStats, templateStats, totalEmails] = await Promise.all([
          this.prisma.emailLog.groupBy({
            by: ['status'],
            where,
            _count: true,
          }),
          this.prisma.emailLog.groupBy({
            by: ['templateId'],
            where: { ...where, templateId: { not: null } },
            _count: true,
            orderBy: { _count: { templateId: 'desc' } },
            take: 10,
          }),
          this.prisma.emailLog.count({ where }),
        ]);

        const statusCounts = statusStats.reduce((acc, curr) => {
          acc[curr.status] = curr._count;
          return acc;
        }, {} as Record<string, number>);

        return {
          totalEmails,
          statusCounts,
          topTemplates: templateStats,
        };
      }
    );
  }

  /**
   * Process Mailgun webhooks
   */
  async processWebhook(eventData: any) {
    const { eventType, message, recipient, timestamp } = eventData;

    if (!message?.headers?.['x-mailgun-variables']) {
      this.logger?.warn('Webhook missing required variables');
      return;
    }

    const variables = JSON.parse(message.headers['x-mailgun-variables']);
    const emailId = variables.email_id;
    const tenantId = variables.tenant_id;

    if (!emailId || !tenantId) {
      this.logger?.warn('Webhook missing email_id or tenant_id');
      return;
    }

    // Update email log status
    const updateData: any = {
      [`${eventType}At`]: new Date(timestamp * 1000),
    };

    // Update status based on event type
    if (['delivered', 'opened', 'clicked'].includes(eventType)) {
      updateData.status = eventType;
    } else if (['failed', 'bounced'].includes(eventType)) {
      updateData.status = eventType;
      updateData.error = eventData.reason || `Email ${eventType}`;
    }

    try {
      await this.prisma.emailLog.update({
        where: { uuid: emailId },
        data: updateData,
      });

      // Invalidate email stats cache
      await this.invalidateEmailCache(tenantId);

      this.logger?.info({ emailId, eventType }, 'Email status updated from webhook');
    } catch (error) {
      this.logger?.error({ error, emailId, eventType }, 'Failed to update email status');
    }
  }

  /**
   * Get tenant from address (cached)
   */
  private async getTenantFromAddress(tenantId: number): Promise<string> {
    const cacheKey = `tenant:${tenantId}:from-address`;

    return getOrSetCache(
      this.redis,
      cacheKey,
      3600, // 1 hour
      async () => {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { name: true, domain: true },
        });

        if (!tenant) {
          throw new Error('Tenant not found');
        }

        // Use tenant domain or default domain
        const domain = tenant.domain || this.mailgunConfig.domain;
        return `${tenant.name} <noreply@${domain}>`;
      }
    );
  }

  /**
   * Replace variables in template content
   */
  private replaceVariables(content: string, variables: Record<string, any>): string {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  /**
   * Helper: Invalidate email cache
   */
  private async invalidateEmailCache(tenantId: number) {
    const patterns = [
      `tenant:${tenantId}:email:*`,
      `tenant:${tenantId}:template:*`,
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
   * Helper: Invalidate template cache
   */
  private async invalidateTemplateCache(tenantId: number) {
    const patterns = [
      `tenant:${tenantId}:template:*`,
    ];

    await Promise.all(
      patterns.map(pattern => this.redis.eval(
        `for _,k in ipairs(redis.call('keys', ARGV[1])) do redis.call('del', k) end`,
        0,
        pattern
      ))
    );
  }
}