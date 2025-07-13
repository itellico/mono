import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';

/**
 * Account Business Workflows Routes
 * Manage business automation workflows
 */
export const accountWorkflowsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get workflows
  fastify.get('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.workflows.read')],
    schema: {
      tags: ['account.business'],
      summary: 'Get workflows',
      description: 'Get all workflows for the account',
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        search: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
        trigger: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            workflows: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              description: Type.Optional(Type.String()),
              status: Type.String(),
              trigger: Type.String(),
              category: Type.Optional(Type.String()),
              definition: Type.Object({}, { additionalProperties: true }),
              isActive: Type.Boolean(),
              executionCount: Type.Number(),
              lastExecutedAt: Type.Optional(Type.String()),
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
      const { page = 1, limit = 20, search, status, trigger } = request.query;
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

        if (status) {
          where.status = status;
        }

        if (trigger) {
          where.trigger = trigger;
        }

        const [workflows, total] = await Promise.all([
          fastify.prisma.workflow.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { updatedAt: 'desc' },
            include: {
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
              _count: {
                select: {
                  executions: true,
                },
              },
              executions: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  createdAt: true,
                },
              },
            },
          }),
          fastify.prisma.workflow.count({ where }),
        ]);

        return {
          success: true,
          data: {
            workflows: workflows.map(workflow => ({
              uuid: workflow.uuid,
              name: workflow.name,
              description: workflow.description,
              status: workflow.status,
              trigger: workflow.trigger,
              category: workflow.category,
              definition: workflow.definition,
              isActive: workflow.isActive,
              executionCount: workflow._count.executions,
              lastExecutedAt: workflow.executions[0]?.createdAt.toISOString(),
              createdBy: workflow.createdBy,
              createdAt: workflow.createdAt.toISOString(),
              updatedAt: workflow.updatedAt.toISOString(),
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
        request.log.error({ error }, 'Failed to get workflows');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_WORKFLOWS',
        });
      }
    },
  });

  // Create workflow
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.workflows.create')],
    schema: {
      tags: ['account.business'],
      summary: 'Create workflow',
      description: 'Create a new automation workflow',
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        description: Type.Optional(Type.String()),
        trigger: Type.String(),
        category: Type.Optional(Type.String()),
        definition: Type.Object({
          steps: Type.Array(Type.Object({
            id: Type.String(),
            type: Type.String(),
            name: Type.String(),
            config: Type.Object({}, { additionalProperties: true }),
            conditions: Type.Optional(Type.Array(Type.Any())),
          })),
          connections: Type.Array(Type.Object({
            from: Type.String(),
            to: Type.String(),
            condition: Type.Optional(Type.String()),
          })),
        }),
        settings: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            workflow: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { name, description, trigger, category, definition, settings } = request.body;

      try {
        const workflow = await fastify.prisma.workflow.create({
          data: {
            name,
            description,
            status: 'draft',
            trigger,
            category,
            definition,
            settings,
            version: 1,
            isActive: false,
            accountId: request.user!.accountId,
            createdById: request.user!.id,
          },
        });

        return reply.status(201).send({
          success: true,
          data: {
            workflow: {
              uuid: workflow.uuid,
              name: workflow.name,
            },
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to create workflow');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_CREATE_WORKFLOW',
        });
      }
    },
  });

  // Execute workflow
  fastify.post('/:uuid/execute', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.workflows.execute')],
    schema: {
      tags: ['account.business'],
      summary: 'Execute workflow',
      description: 'Manually execute a workflow',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        input: Type.Optional(Type.Object({}, { additionalProperties: true })),
        context: Type.Optional(Type.Object({}, { additionalProperties: true })),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            execution: Type.Object({
              uuid: uuidSchema,
              status: Type.String(),
              startedAt: Type.String(),
            }),
          }),
        }),
      },
    },
    async handler(request, reply) {
      const { uuid } = request.params as { uuid: string };
      const { input, context } = request.body;

      try {
        const workflow = await fastify.prisma.workflow.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId,
            isActive: true, },
        });

        if (!workflow) {
          return reply.status(404).send({
            success: false,
            error: 'WORKFLOW_NOT_FOUND_OR_NOT_ACTIVE',
          });
        }

        // Create execution record
        const execution = await fastify.prisma.workflowExecution.create({
          data: {
            workflowId: workflow.uuid as UUID,
            status: 'running',
            input,
            context: {
              ...context,
              triggeredBy: 'manual',
              userId: request.user!.id,
            },
          },
        });

        // TODO: Execute workflow steps asynchronously
        // For now, simulate completion
        setTimeout(async () => {
          await fastify.prisma.workflowExecution.update({
            where: { tenantId: request.user.tenantId },
            data: {
              status: 'completed',
              output: { message: 'Workflow executed successfully' },
              completedAt: new Date(),
            },
          });
        }, 2000);

        return {
          success: true,
          data: {
            execution: {
              uuid: execution.uuid,
              status: execution.status,
              startedAt: execution.createdAt.toISOString(),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to execute workflow');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_EXECUTE_WORKFLOW',
        });
      }
    },
  });

  // Get workflow executions
  fastify.get('/:uuid/executions', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.workflows.read')],
    schema: {
      tags: ['account.business'],
      summary: 'Get workflow executions',
      description: 'Get execution history for a workflow',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        status: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            executions: Type.Array(Type.Object({
              uuid: uuidSchema,
              status: Type.String(),
              input: Type.Optional(Type.Object({}, { additionalProperties: true })),
              output: Type.Optional(Type.Object({}, { additionalProperties: true })),
              error: Type.Optional(Type.String()),
              duration: Type.Optional(Type.Number()),
              createdAt: Type.String(),
              completedAt: Type.Optional(Type.String()),
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
      const { page = 1, limit = 20, status } = request.query;
      const offset = (page - 1) * limit;

      try {
        const workflow = await fastify.prisma.workflow.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!workflow) {
          return reply.status(404).send({
            success: false,
            error: 'WORKFLOW_NOT_FOUND',
          });
        }

        const where: any = {
          workflowId: workflow.uuid as UUID,
        };

        if (status) {
          where.status = status;
        }

        const [executions, total] = await Promise.all([
          fastify.prisma.workflowExecution.findMany({
            where,
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          fastify.prisma.workflowExecution.count({ where }),
        ]);

        return {
          success: true,
          data: {
            executions: executions.map(execution => {
              const duration = execution.completedAt
                ? execution.completedAt.getTime() - execution.createdAt.getTime()
                : undefined;

              return {
                uuid: execution.uuid,
                status: execution.status,
                input: execution.input,
                output: execution.output,
                error: execution.error,
                duration,
                createdAt: execution.createdAt.toISOString(),
                completedAt: execution.completedAt?.toISOString(),
              };
            }),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to get workflow executions');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_GET_WORKFLOW_EXECUTIONS',
        });
      }
    },
  });

  // Update workflow
  fastify.put('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.workflows.update')],
    schema: {
      tags: ['account.business'],
      summary: 'Update workflow',
      description: 'Update workflow configuration',
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1 })),
        description: Type.Optional(Type.String()),
        status: Type.Optional(Type.String()),
        definition: Type.Optional(Type.Object({}, { additionalProperties: true })),
        settings: Type.Optional(Type.Object({}, { additionalProperties: true })),
        isActive: Type.Optional(Type.Boolean()),
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
        const workflow = await fastify.prisma.workflow.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
        });

        if (!workflow) {
          return reply.status(404).send({
            success: false,
            error: 'WORKFLOW_NOT_FOUND',
          });
        }

        const updateData: any = { ...updates };

        // Increment version if definition changes
        if (updates.definition) {
          updateData.version = workflow.version + 1;
        }

        await fastify.prisma.workflow.update({
          where: { tenantId: request.user.tenantId },
          data: {
            ...updateData,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: {
            message: 'Workflow updated successfully',
          },
        };
      } catch (error) {
        request.log.error({ error }, 'Failed to update workflow');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_UPDATE_WORKFLOW',
        });
      }
    },
  });

  // Delete workflow
  fastify.delete('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('account.workflows.delete')],
    schema: {
      tags: ['account.business'],
      summary: 'Delete workflow',
      description: 'Delete or archive a workflow',
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
        const workflow = await fastify.prisma.workflow.findFirst({
          where: { tenantId: request.user.tenantId, uuid,
            accountId: request.user!.accountId, },
          include: {
            _count: {
              select: {
                executions: true,
              },
            },
          },
        });

        if (!workflow) {
          return reply.status(404).send({
            success: false,
            error: 'WORKFLOW_NOT_FOUND',
          });
        }

        // Archive if has executions, otherwise delete
        if (workflow._count.executions > 0) {
          await fastify.prisma.workflow.update({
            where: { tenantId: request.user.tenantId },
            data: {
              status: 'archived',
              isActive: false,
              updatedAt: new Date(),
            },
          });

          return {
            success: true,
            data: {
              message: 'Workflow archived successfully',
            },
          };
        } else {
          await fastify.prisma.workflow.delete({
            where: { tenantId: request.user.tenantId },
          });

          return {
            success: true,
            data: {
              message: 'Workflow deleted successfully',
            },
          };
        }
      } catch (error) {
        request.log.error({ error }, 'Failed to delete workflow');
        return reply.status(500).send({
          success: false,
          error: 'FAILED_TO_DELETE_WORKFLOW',
        });
      }
    },
  });
};