import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * Account Business Forms Routes
 * Manage dynamic forms for business processes
 */
export const accountFormsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get forms
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.forms.read')],
    schema: {
      tags: ['account.business'],
      summary: 'Get forms',
      description: 'Get all forms for the account',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        type: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            forms: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              description: Type.Optional(Type.String()),
              type: Type.String(),
              status: Type.String(),
              fields: Type.Array(Type.Object({
                name: Type.String(),
                type: Type.String(),
                label: Type.String(),
                required: Type.Boolean(),
                options: Type.Optional(Type.Array(Type.Any())),
              })),
              settings: Type.Object({}, { additionalProperties: true }),
              submissionCount: Type.Number(),
              createdBy: Type.Object({
                name: Type.String(),
              }),
              createdAt: Type.String(),
              updatedAt: Type.String(),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              totalPages: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { page = 1, limit = 20, search, type, status } = request.query;
      const offset = (page - 1) * limit;

      try {
        const where: any = {
          accountId: request.user!.accountId,
        };

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ];
        }

        if (type) {
          where.type = type;
        }

        if (status) {
          where.status = status;
        }

        const [forms, total] = await Promise.all([
          fastify.prisma.form.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
              _count: {
                select: {
                  submissions: true,
                },
              },
            },
          }),
          fastify.prisma.form.count({ where }),
        ]);

        return {
          success: true,
          data: {
            forms: forms.map(form => ({
              uuid: form.uuid,
              name: form.name,
              description: form.description,
              type: form.type,
              status: form.status,
              fields: form.fields as any,
              settings: form.settings,
              submissionCount: form._count.submissions,
              createdBy: form.createdBy,
              createdAt: form.createdAt.toISOString(),
              updatedAt: form.updatedAt.toISOString(),
            })),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get forms');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_FORMS',
        });
      }
    },
  });

  // Create form
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.forms.create')],
    schema: {
      tags: ['account.business'],
      summary: 'Create form',
      description: 'Create a new dynamic form',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        description: Type.Optional(Type.String()),
        type: Type.String(),
        fields: Type.Array(Type.Object({
          name: Type.String(),
          type: Type.String(),
          label: Type.String(),
          placeholder: Type.Optional(Type.String()),
          required: Type.Optional(Type.Boolean({ default: false })),
          validation: Type.Optional(Type.Object({}, { additionalProperties: true })),
          options: Type.Optional(Type.Array(Type.Any())),
          defaultValue: Type.Optional(Type.Any()),
        })),
        settings: Type.Optional(Type.Object({
          submitButtonText: Type.Optional(Type.String()),
          successMessage: Type.Optional(Type.String()),
          redirectUrl: Type.Optional(Type.String()),
          notificationEmail: Type.Optional(Type.String()),
          webhookUrl: Type.Optional(Type.String()),
        }, { additionalProperties: true })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            form: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { name, description, type, fields, settings } = request.body;

      try {
        const form = await fastify.prisma.form.create({
          data: {
            name,
            description,
            type,
            fields,
            settings: settings || {},
            status: 'active',
            accountId: request.user!.accountId,
            createdById: request.user!.id,
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            form: {
              uuid: form.uuid,
              name: form.name,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to create form');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CREATE_FORM',
        });
      }
    },
  });

  // Get form details
  fastify.get('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.forms.read')],
    schema: {
      tags: ['account.business'],
      summary: 'Get form details',
      description: 'Get detailed information about a form',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            form: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              description: Type.Optional(Type.String()),
              type: Type.String(),
              status: Type.String(),
              fields: Type.Array(Type.Any()),
              settings: Type.Object({}, { additionalProperties: true }),
              submissionCount: Type.Number(),
              lastSubmissionAt: Type.Optional(Type.String()),
              createdBy: Type.Object({
                name: Type.String(),
              }),
              createdAt: Type.String(),
              updatedAt: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const form = await fastify.prisma.form.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                submissions: true,
              },
            },
            submissions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                createdAt: true,
              },
            },
          },
        });

        if (!form) {
          return reply.status(404).send({
            success: false,
            error: 'FORM_NOT_FOUND',
          });
        }

        return {
          success: true,
          data: {
            form: {
              uuid: form.uuid,
              name: form.name,
              description: form.description,
              type: form.type,
              status: form.status,
              fields: form.fields as any,
              settings: form.settings,
              submissionCount: form._count.submissions,
              lastSubmissionAt: form.submissions[0]?.createdAt.toISOString(),
              createdBy: form.createdBy,
              createdAt: form.createdAt.toISOString(),
              updatedAt: form.updatedAt.toISOString(),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get form details');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_FORM_DETAILS',
        });
      }
    },
  });

  // Update form
  fastify.put('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.forms.update')],
    schema: {
      tags: ['account.business'],
      summary: 'Update form',
      description: 'Update form configuration',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1 })),
        description: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
        fields: Type.Optional(Type.Array(Type.Any())),
        settings: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const updates = request.body;

      try {
        const form = await fastify.prisma.form.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!form) {
          return reply.status(404).send({
            success: false,
            error: 'FORM_NOT_FOUND',
          });
        }

        await fastify.prisma.form.update({
          where: { tenantId: request.user.tenantId },
          data: {
            ...updates,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'Form updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update form');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_FORM',
        });
      }
    },
  });

  // Delete form
  fastify.delete('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.forms.delete')],
    schema: {
      tags: ['account.business'],
      summary: 'Delete form',
      description: 'Delete a form (soft delete)',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            message: Type.String(),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };

      try {
        const form = await fastify.prisma.form.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
          include: {
            _count: {
              select: {
                submissions: true,
              },
            },
          },
        });

        if (!form) {
          return reply.status(404).send({
            success: false,
            error: 'FORM_NOT_FOUND',
          });
        }

        // Archive instead of delete if has submissions
        if (form._count.submissions > 0) {
          await fastify.prisma.form.update({
            where: { tenantId: request.user.tenantId },
            data: {
              status: 'archived',
              updatedAt: new Date(),
            },
          });
        } else {
          await fastify.prisma.form.delete({
            where: { tenantId: request.user.tenantId },
          });
        }

        return {
          success: true,
          data: {
            message: form._count.submissions > 0 ? 'Form archived successfully' : 'Form deleted successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to delete form');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_FORM',
        });
      }
    },
  });

  // Get form submissions
  fastify.get('/:uuid/submissions', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.forms.read')],
    schema: {
      tags: ['account.business'],
      summary: 'Get form submissions',
      description: 'Get submissions for a specific form',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        startDate: Type.Optional(Type.String()),
        endDate: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            submissions: Type.Array(Type.Object({
              uuid: uuidSchema,
              data: Type.Object({}, { additionalProperties: true }),
              submittedBy: Type.Optional(Type.Object({
                name: Type.String(),
                email: Type.String(),
              })),
              ipAddress: Type.String(),
              userAgent: Type.String(),
              createdAt: Type.String(),
            })),
            pagination: Type.Object({
              page: Type.Number(),
              limit: Type.Number(),
              total: Type.Number(),
              totalPages: Type.Number(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { page = 1, limit = 20, startDate, endDate } = request.query;
      const offset = (page - 1) * limit;

      try {
        const form = await fastify.prisma.form.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!form) {
          return reply.status(404).send({
            success: false,
            error: 'FORM_NOT_FOUND',
          });
        }

        const where: any = {
          formId: form.uuid as UUID,
        };

        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) {
            where.createdAt.gte = new Date(startDate);
          }
          if (endDate) {
            where.createdAt.lte = new Date(endDate);
          }
        }

        const [submissions, total] = await Promise.all([
          fastify.prisma.formSubmission.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              submittedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          }),
          fastify.prisma.formSubmission.count({ where }),
        ]);

        return {
          success: true,
          data: {
            submissions: submissions.map(submission => ({
              uuid: submission.uuid,
              data: submission.data,
              submittedBy: submission.submittedBy,
              ipAddress: submission.ipAddress,
              userAgent: submission.userAgent,
              createdAt: submission.createdAt.toISOString(),
            })),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get form submissions');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_FORM_SUBMISSIONS',
        });
      }
    },
  });

  // Export form submissions
  fastify.get('/:uuid/export', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.forms.export')],
    schema: {
      tags: ['account.business'],
      summary: 'Export form submissions',
      description: 'Export form submissions as CSV',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      querystring: Type.Object({
        format: Type.Optional(Type.Union([Type.Literal('csv'), Type.Literal('json')])),
        startDate: Type.Optional(Type.String()),
        endDate: Type.Optional(Type.String()),
      }),
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { format = 'csv', startDate, endDate } = request.query;

      try {
        const form = await fastify.prisma.form.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!form) {
          return reply.status(404).send({
            success: false,
            error: 'FORM_NOT_FOUND',
          });
        }

        const where: any = {
          formId: form.uuid as UUID,
        };

        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) {
            where.createdAt.gte = new Date(startDate);
          }
          if (endDate) {
            where.createdAt.lte = new Date(endDate);
          }
        }

        const submissions = await fastify.prisma.formSubmission.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            submittedBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });

        if (format === 'json') {
          reply.header('Content-Type', 'application/json');
          reply.header('Content-Disposition', `attachment; filename="${form.name}-submissions.json"`);
          return submissions;
        } else {
          // Convert to CSV
          const fields = form.fields as any[];
          const headers = ['Submission ID', 'Submitted At', 'Submitted By', ...fields.map(f => f.label)];
          
          const rows = submissions.map(sub => {
            const data = sub.data as any;
            return [
              sub.uuid,
              sub.createdAt.toISOString(),
              sub.submittedBy ? `${sub.submittedBy.name} (${sub.submittedBy.email})` : 'Anonymous',
              ...fields.map(f => data[f.name] || ''),
            ];
          });

          const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
          ].join('\n');

          reply.header('Content-Type', 'text/csv');
          reply.header('Content-Disposition', `attachment; filename="${form.name}-submissions.csv"`);
          return csv;
        }
      } catch (error) {
        request.log.error({ error }, 'Failed to export form submissions');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_EXPORT_FORM_SUBMISSIONS',
        });
      }
    },
  });
};