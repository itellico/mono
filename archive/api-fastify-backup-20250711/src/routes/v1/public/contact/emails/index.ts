import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { EmailService } from '@/services/email.service';
import { config } from '@/config/index';

export const emailsRoutes: FastifyPluginAsync = async (fastify) => {
  // Create email service instance with Mailgun config
  const mailgunConfig = {
    apiKey: config.MAILGUN_API_KEY || '',
    domain: config.MAILGUN_DOMAIN || '',
    host: config.MAILGUN_HOST,
  };

  if (!mailgunConfig.apiKey || !mailgunConfig.domain) {
    fastify.log.warn('Mailgun not configured - email functionality disabled');
    return;
  }

  const emailService = new EmailService(fastify.prisma, fastify.redis, mailgunConfig, fastify.log);

  // Send email
  fastify.post('/send', {
    preHandler: [fastify.authenticate, fastify.requirePermission('emails:send')],
    schema: {
      tags: ['public.contact.emails'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        templateId: Type.Optional(Type.Number({ minimum: 1 })),
        templateSlug: Type.Optional(Type.String()),
        to: Type.Array(Type.Object({
          email: Type.String({ format: 'email' }),
          name: Type.Optional(Type.String()),
        }), { minItems: 1 }),
        cc: Type.Optional(Type.Array(Type.Object({
          email: Type.String({ format: 'email' }),
          name: Type.Optional(Type.String()),
        }))),
        bcc: Type.Optional(Type.Array(Type.Object({
          email: Type.String({ format: 'email' }),
          name: Type.Optional(Type.String()),
        }))),
        subject: Type.Optional(Type.String({ minLength: 1, maxLength: 998 })),
        variables: Type.Optional(Type.Record(Type.String(), Type.Any())),
        attachments: Type.Optional(Type.Array(Type.Object({
          filename: Type.String(),
          data: Type.String(),
          contentType: Type.String(),
        }))),
        priority: Type.Optional(Type.Union([
          Type.Literal('low'),
          Type.Literal('normal'),
          Type.Literal('high'),
        ])),
        scheduledAt: Type.Optional(Type.String({ format: 'date-time' })),
        tags: Type.Optional(Type.Array(Type.String(), { maxItems: 3 })),
        metadata: Type.Optional(Type.Record(Type.String(), Type.String())),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            emailId: Type.String(),
            mailgunId: Type.String(),
            status: Type.String(),
            message: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const tenantId = request.user!.tenantId;

    try {
      const result = await emailService.sendEmail({
        ...request.body,
        tenantId,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Search emails
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('emails:read')],
    schema: {
      tags: ['public.contact.emails'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        status: Type.Optional(Type.Union([
          Type.Literal('pending'),
          Type.Literal('sent'),
          Type.Literal('delivered'),
          Type.Literal('failed'),
          Type.Literal('bounced'),
          Type.Literal('opened'),
          Type.Literal('clicked'),
        ])),
        templateId: Type.Optional(Type.Number({ minimum: 1 })),
        recipient: Type.Optional(Type.String({ format: 'email' })),
        subject: Type.Optional(Type.String()),
        dateFrom: Type.Optional(Type.String({ format: 'date-time' })),
        dateTo: Type.Optional(Type.String({ format: 'date-time' })),
        tags: Type.Optional(Type.Array(Type.String())),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
        sortBy: Type.Optional(Type.Union([
          Type.Literal('createdAt'),
          Type.Literal('scheduledAt'),
          Type.Literal('sentAt'),
        ])),
        sortOrder: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')])),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            emails: Type.Array(Type.Object({
              uuid: uuidSchema,
              recipients: Type.Array(Type.String()),
              subject: Type.String(),
              status: Type.String(),
              priority: Type.String(),
              createdAt: Type.String(),
              sentAt: Type.Optional(Type.String()),
              scheduledAt: Type.Optional(Type.String()),
              tags: Type.Array(Type.String()),
              template: Type.Optional(Type.Object({
                name: Type.String(),
                slug: Type.String(),
              })),
            })),
            total: Type.Number(),
            hasMore: Type.Boolean(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const tenantId = request.user!.tenantId;

    const result = await emailService.searchEmails({
      ...request.query,
      tenantId,
    });

    return {
      success: true,
      data: result,
    };
  });

  // Get email statistics
  fastify.get('/stats', {
    preHandler: [fastify.authenticate, fastify.requirePermission('emails:read')],
    schema: {
      tags: ['public.contact.emails'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        dateFrom: Type.Optional(Type.String({ format: 'date-time' })),
        dateTo: Type.Optional(Type.String({ format: 'date-time' })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            totalEmails: Type.Number(),
            statusCounts: Type.Record(Type.String(), Type.Number()),
            topTemplates: Type.Array(Type.Any()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const tenantId = request.user!.tenantId;
    const { dateFrom, dateTo } = request.query;

    const stats = await emailService.getEmailStats(tenantId, dateFrom, dateTo);

    return {
      success: true,
      data: stats,
    };
  });

  // Email Templates Routes

  // Search email templates
  fastify.get('/templates', {
    preHandler: [fastify.authenticate, fastify.requirePermission('email-templates:read')],
    schema: {
      tags: ['public.contact.emails'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        search: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            templates: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              slug: Type.String(),
              description: Type.Optional(Type.String()),
              category: Type.String(),
              subject: Type.String(),
              settings: Type.Any(),
              createdAt: Type.String(),
              updatedAt: Type.String(),
              createdBy: Type.Object({
                uuid: uuidSchema,
                firstName: Type.String(),
                lastName: Type.String(),
              }),
            })),
            total: Type.Number(),
            hasMore: Type.Boolean(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const tenantId = request.user!.tenantId;
    const { search, category, limit = 20, offset = 0 } = request.query;

    const result = await emailService.searchTemplates(tenantId, search, category, limit, offset);

    return {
      success: true,
      data: result,
    };
  });

  // Create email template
  fastify.post('/templates', {
    preHandler: [fastify.authenticate, fastify.requirePermission('email-templates:create')],
    schema: {
      tags: ['public.contact.emails'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1, maxLength: 200 }),
        slug: Type.String({ minLength: 1, maxLength: 100 }),
        description: Type.Optional(Type.String()),
        category: Type.String({ minLength: 1, maxLength: 50 }),
        subject: Type.String({ minLength: 1, maxLength: 200 }),
        htmlContent: Type.String({ minLength: 1 }),
        textContent: Type.Optional(Type.String()),
        variables: Type.Optional(Type.Array(Type.Object({
          name: Type.String(),
          type: Type.Union([
            Type.Literal('text'),
            Type.Literal('number'),
            Type.Literal('date'),
            Type.Literal('boolean'),
            Type.Literal('url'),
            Type.Literal('email'),
          ]),
          required: Type.Optional(Type.Boolean()),
          defaultValue: Type.Optional(Type.String()),
          description: Type.Optional(Type.String()),
        }))),
        settings: Type.Optional(Type.Object({
          isActive: Type.Optional(Type.Boolean()),
          trackOpens: Type.Optional(Type.Boolean()),
          trackClicks: Type.Optional(Type.Boolean()),
          unsubscribeUrl: Type.Optional(Type.String({ format: 'uri' })),
        })),
        localization: Type.Optional(Type.Object({
          defaultLocale: Type.Optional(Type.String()),
          translations: Type.Optional(Type.Record(Type.String(), Type.Object({
            subject: Type.String(),
            htmlContent: Type.String(),
            textContent: Type.Optional(Type.String()),
          }))),
        })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            template: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              slug: Type.String(),
              category: Type.String(),
              createdAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const userId = request.user!.id;
    const tenantId = request.user!.tenantId;

    try {
      const template = await emailService.createTemplate({
        ...request.body,
        tenantId,
        createdById: userId,
      });

      return reply.code(201).send({
        success: true,
        data: {
          template: {
            uuid: template.uuid,
            name: template.name,
            slug: template.slug,
            category: template.category,
            createdAt: template.createdAt.toISOString(),
          },
        },
      });
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Get email template by UUID
  fastify.get('/templates/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('email-templates:read')],
    schema: {
      tags: ['public.contact.emails'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            template: Type.Any(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const tenantId = request.user!.tenantId;

    // Get template by UUID first
    const template = await fastify.prisma.emailTemplate.findFirst({
      where: {
        uuid,
        tenantId,
      },
    });

    if (!template) {
      return reply.code(404).send({
        success: false,
        error: 'EMAIL_TEMPLATE_NOT_FOUND',
      });
    }

    return {
      success: true,
      data: { template },
    };
  });

  // Update email template
  fastify.patch('/templates/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('email-templates:update')],
    schema: {
      tags: ['public.contact.emails'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
        slug: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
        description: Type.Optional(Type.String()),
        category: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
        subject: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
        htmlContent: Type.Optional(Type.String({ minLength: 1 })),
        textContent: Type.Optional(Type.String()),
        variables: Type.Optional(Type.Array(Type.Object({
          name: Type.String(),
          type: Type.Union([
            Type.Literal('text'),
            Type.Literal('number'),
            Type.Literal('date'),
            Type.Literal('boolean'),
            Type.Literal('url'),
            Type.Literal('email'),
          ]),
          required: Type.Optional(Type.Boolean()),
          defaultValue: Type.Optional(Type.String()),
          description: Type.Optional(Type.String()),
        }))),
        settings: Type.Optional(Type.Object({
          isActive: Type.Optional(Type.Boolean()),
          trackOpens: Type.Optional(Type.Boolean()),
          trackClicks: Type.Optional(Type.Boolean()),
          unsubscribeUrl: Type.Optional(Type.String({ format: 'uri' })),
        })),
        localization: Type.Optional(Type.Object({
          defaultLocale: Type.Optional(Type.String()),
          translations: Type.Optional(Type.Record(Type.String(), Type.Object({
            subject: Type.String(),
            htmlContent: Type.String(),
            textContent: Type.Optional(Type.String()),
          }))),
        })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            template: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              slug: Type.String(),
              updatedAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const tenantId = request.user!.tenantId;

    // Get template by UUID first
    const existingTemplate = await fastify.prisma.emailTemplate.findFirst({
      where: {
        uuid,
        tenantId,
      },
    });

    if (!existingTemplate) {
      return reply.code(404).send({
        success: false,
        error: 'EMAIL_TEMPLATE_NOT_FOUND',
      });
    }

    try {
      const template = await emailService.updateTemplate({
        tenantId,
        ...request.body,
      });

      return {
        success: true,
        data: {
          template: {
            uuid: template.uuid,
            name: template.name,
            slug: template.slug,
            updatedAt: template.updatedAt.toISOString(),
          },
        },
      };
    } catch (error: any) {
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Mailgun webhook handler
  fastify.post('/webhooks/mailgun', {
    schema: {
      tags: ['public.contact.emails'],
      body: Type.Any(),
    },
  }, async (request, reply) => {
    try {
      await emailService.processWebhook(request.body);
      return { success: true };
    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to process Mailgun webhook');
      return reply.code(400).send({
        success: false,
        error: 'FAILED_TO_PROCESS_WEBHOOK',
      });
    }
  });
};