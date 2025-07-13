import type { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { UUID, uuidSchema, toUUID } from '@/types/uuid';
import { WorkflowService } from '@/services/workflow.service';
import { MARKETPLACE_WORKFLOW_TEMPLATES } from '@/types/workflow';

const WorkflowStatus = Type.Union([
  Type.Literal('draft'),
  Type.Literal('active'),
  Type.Literal('paused'),
  Type.Literal('archived'),
]);

const WorkflowTrigger = Type.Union([
  Type.Literal('manual'),
  Type.Literal('schedule'),
  Type.Literal('webhook'),
  Type.Literal('form_submission'),
  Type.Literal('user_action'),
]);

export const workflowsRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize workflow service with Temporal integration
  const temporalConfig = {
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'marketplace-workflows',
  };

  const workflowService = new WorkflowService(
    fastify.prisma,
    fastify.redis,
    temporalConfig,
    fastify.log
  );

  // Initialize Temporal connection asynchronously (non-blocking)
  workflowService.initialize()
    .then(() => {
      fastify.log.info('Temporal workflow service initialized');
    })
    .catch((error) => {
      fastify.log.warn('Temporal not available, using basic workflow functionality', error);
    });
  // Get all workflows with filtering and pagination
  fastify.get('/', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.workflows.read')
    ],
    schema: {
      tags: ['tenant.workflows'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
        status: Type.Optional(WorkflowStatus),
        trigger: Type.Optional(WorkflowTrigger),
        search: Type.Optional(Type.String()),
        category: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            workflows: Type.Array(Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              description: Type.Optional(Type.String()),
              status: WorkflowStatus,
              trigger: WorkflowTrigger,
              category: Type.Optional(Type.String()),
              version: Type.Number(),
              isActive: Type.Boolean(),
              executionCount: Type.Number(),
              lastExecutedAt: Type.Optional(Type.String()),
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
  }, async (request, reply) => {
    const { page = 1, limit = 20, status, trigger, search, category } = request.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      account: {
        tenantId: request.user!.tenantId,
      },
    };

    if (status) {
      where.status = status;
    }

    if (trigger) {
      where.trigger = trigger;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get workflows with count
    const [workflows, total] = await Promise.all([
      fastify.prisma.workflow.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { executions: true },
          },
          executions: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
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
          status: workflow.status as any,
          trigger: workflow.trigger as any,
          category: workflow.category,
          version: workflow.version,
          isActive: workflow.isActive,
          executionCount: workflow._count.executions,
          lastExecutedAt: workflow.executions[0]?.createdAt.toISOString(),
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
  });

  // Get workflow by UUID
  fastify.get('/:uuid', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.workflows.read')
    ],
    schema: {
      tags: ['tenant.workflows'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            workflow: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              description: Type.Optional(Type.String()),
              status: WorkflowStatus,
              trigger: WorkflowTrigger,
              category: Type.Optional(Type.String()),
              definition: Type.Object({}, { additionalProperties: true }),
              version: Type.Number(),
              isActive: Type.Boolean(),
              settings: Type.Optional(Type.Object({}, { additionalProperties: true })),
              executionCount: Type.Number(),
              successCount: Type.Number(),
              failureCount: Type.Number(),
              lastExecutedAt: Type.Optional(Type.String()),
              createdAt: Type.String(),
              updatedAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);

    const workflow = await fastify.prisma.workflow.findFirst({
      where: {
        uuid,
        account: {
          tenantId: request.user!.tenantId,
        },
      },
      include: {
        _count: {
          select: { executions: true },
        },
        executions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        },
      },
    });

    if (!workflow) {
      return reply.code(404).send({
        success: false,
        error: 'WORKFLOW_NOT_FOUND',
      });
    }

    // Get execution stats
    const [successCount, failureCount] = await Promise.all([
      fastify.prisma.workflowExecution.count({
        where: { tenantId: request.user.tenantId, workflowId: workflow.uuid as UUID,
          status: 'completed', },
      }),
      fastify.prisma.workflowExecution.count({
        where: { tenantId: request.user.tenantId, workflowId: workflow.uuid as UUID,
          status: 'failed', },
      }),
    ]);

    return {
      success: true,
      data: {
        workflow: {
          uuid: workflow.uuid,
          name: workflow.name,
          description: workflow.description,
          status: workflow.status as any,
          trigger: workflow.trigger as any,
          category: workflow.category,
          definition: workflow.definition,
          version: workflow.version,
          isActive: workflow.isActive,
          settings: workflow.settings,
          executionCount: workflow._count.executions,
          successCount,
          failureCount,
          lastExecutedAt: workflow.executions[0]?.createdAt.toISOString(),
          createdAt: workflow.createdAt.toISOString(),
          updatedAt: workflow.updatedAt.toISOString(),
        },
      },
    };
  });

  // Create workflow
  fastify.post('/', {
    preHandler: [fastify.authenticate, fastify.requirePermission('workflows.create')],
    schema: {
      tags: ['tenant.workflows'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1 }),
        description: Type.Optional(Type.String()),
        trigger: WorkflowTrigger,
        category: Type.Optional(Type.String()),
        definition: Type.Object({}, { additionalProperties: true }),
        settings: Type.Optional(Type.Object({}, { additionalProperties: true })),
        isActive: Type.Optional(Type.Boolean({ default: true })),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            workflow: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              status: WorkflowStatus,
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { name, description, trigger, category, definition, settings, isActive = true } = request.body;

    const workflow = await fastify.prisma.workflow.create({
      data: {
        name,
        description,
        status: 'draft',
        trigger,
        category,
        definition,
        version: 1,
        isActive,
        settings,
        accountId: request.user!.accountId,
      },
    });

    return reply.code(201).send({
      success: true,
      data: {
        workflow: {
          uuid: workflow.uuid,
          name: workflow.name,
          status: workflow.status as any,
        },
      },
    });
  });

  // Update workflow
  fastify.patch('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('workflows.update')],
    schema: {
      tags: ['tenant.workflows'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1 })),
        description: Type.Optional(Type.String()),
        status: Type.Optional(WorkflowStatus),
        definition: Type.Optional(Type.Object({}, { additionalProperties: true })),
        settings: Type.Optional(Type.Object({}, { additionalProperties: true })),
        isActive: Type.Optional(Type.Boolean()),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            workflow: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              version: Type.Number(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const updates = request.body;

    // Find workflow
    const existing = await fastify.prisma.workflow.findFirst({
      where: {
        uuid,
        account: {
          tenantId: request.user!.tenantId,
        },
      },
    });

    if (!existing) {
      return reply.code(404).send({
        success: false,
        error: 'WORKFLOW_NOT_FOUND',
      });
    }

    // If definition is updated, increment version
    const updateData: any = { ...updates };
    if (updates.definition) {
      updateData.version = existing.version + 1;
    }

    // Update workflow
    const workflow = await fastify.prisma.workflow.update({
      where: { tenantId: request.user.tenantId },
      data: updateData,
    });

    return {
      success: true,
      data: {
        workflow: {
          uuid: workflow.uuid,
          name: workflow.name,
          version: workflow.version,
        },
      },
    };
  });

  // Delete workflow
  fastify.delete('/:uuid', {
    preHandler: [fastify.authenticate, fastify.requirePermission('workflows.delete')],
    schema: {
      tags: ['tenant.workflows'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: uuidSchema,
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);

    // Find workflow
    const workflow = await fastify.prisma.workflow.findFirst({
      where: {
        uuid,
        account: {
          tenantId: request.user!.tenantId,
        },
      },
      include: {
        _count: {
          select: { executions: true },
        },
      },
    });

    if (!workflow) {
      return reply.code(404).send({
        success: false,
        error: 'WORKFLOW_NOT_FOUND',
      });
    }

    // Check if workflow has executions
    if (workflow._count.executions > 0) {
      return reply.code(400).send({
        success: false,
        error: 'CANNOT_DELETE_WORKFLOW_WITH_EXECUTION_HISTORY._ARCHIVE_IT_INSTEAD.',
      });
    }

    // Delete workflow
    await fastify.prisma.workflow.delete({
      where: { tenantId: request.user.tenantId },
    });

    return {
      success: true,
      message: 'Workflow deleted successfully',
    };
  });

  // Execute workflow manually
  fastify.post('/:uuid/execute', {
    preHandler: [fastify.authenticate, fastify.requirePermission('workflows.execute')],
    schema: {
      tags: ['tenant.workflows'],
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
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const { input, context } = request.body;

    // Find workflow
    const workflow = await fastify.prisma.workflow.findFirst({
      where: {
        uuid,
        account: {
          tenantId: request.user!.tenantId,
        },
        isActive: true,
      },
    });

    if (!workflow) {
      return reply.code(404).send({
        success: false,
        error: 'WORKFLOW_NOT_FOUND_OR_INACTIVE',
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

    // TODO: Implement actual workflow execution logic here
    // This would typically involve:
    // 1. Parse workflow definition
    // 2. Execute steps in sequence/parallel
    // 3. Handle conditions and branches
    // 4. Update execution status
    
    // For now, just simulate execution
    setTimeout(async () => {
      try {
        await fastify.prisma.workflowExecution.update({
          where: { tenantId: request.user.tenantId },
          data: {
            status: 'completed',
            output: { message: 'Workflow executed successfully' },
            completedAt: new Date(),
          },
        });
      } catch (error) {
        await fastify.prisma.workflowExecution.update({
          where: { tenantId: request.user.tenantId },
          data: {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date(),
          },
        });
      }
    }, 1000);

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
  });

  // Get workflow executions
  fastify.get('/:uuid/executions', {
    preHandler: [
      fastify.authenticate,
      fastify.requirePermission('tenant.workflows.read')
    ],
    schema: {
      tags: ['tenant.workflows'],
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
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const { page = 1, limit = 20, status } = request.query;
    const offset = (page - 1) * limit;

    // Find workflow
    const workflow = await fastify.prisma.workflow.findFirst({
      where: {
        uuid,
        account: {
          tenantId: request.user!.tenantId,
        },
      },
    });

    if (!workflow) {
      return reply.code(404).send({
        success: false,
        error: 'WORKFLOW_NOT_FOUND',
      });
    }

    // Build where clause
    const where: any = { workflowId: workflow.uuid as UUID };
    if (status) {
      where.status = status;
    }

    // Get executions with count
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
  });

  // =============================================================================
  // TEMPORAL-BASED WORKFLOW ROUTES (NEW IMPLEMENTATION)
  // =============================================================================

  // Get workflow templates
  fastify.get('/templates', {
    preHandler: [fastify.authenticate, fastify.requirePermission('workflows:read')],
    schema: {
      tags: ['tenant.workflows'],
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            templates: Type.Array(Type.Any()),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    return {
      success: true,
      data: {
        templates: MARKETPLACE_WORKFLOW_TEMPLATES,
      },
    };
  });

  // Create workflow from template
  fastify.post('/templates/:templateSlug/create', {
    preHandler: [fastify.authenticate, fastify.requirePermission('workflows:create')],
    schema: {
      tags: ['tenant.workflows'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        templateSlug: Type.String(),
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
        slug: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
        customizations: Type.Optional(Type.Record(Type.String(), Type.Any())),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            workflow: Type.Object({
              uuid: uuidSchema,
              name: Type.String(),
              slug: Type.String(),
              createdAt: Type.String(),
            }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const { templateSlug } = request.params;
    const userId = request.user!.id;
    const tenantId = request.user!.tenantId;

    const template = MARKETPLACE_WORKFLOW_TEMPLATES.find(t => t.slug === templateSlug);
    if (!template) {
      return reply.code(404).send({
        success: false,
        error: 'WORKFLOW_TEMPLATE_NOT_FOUND',
      });
    }

    try {
      const workflow = await workflowService.createWorkflowDefinition({
        name: request.body.name || template.name,
        slug: request.body.slug || `${template.slug}-${Date.now()}`,
        description: template.description,
        category: template.category,
        definition: template.definition,
        settings: template.settings,
        permissions: template.permissions,
        tenantId,
        createdById: userId,
      });

      return reply.code(201).send({
        success: true,
        data: {
          workflow: {
            uuid: workflow.uuid,
            name: workflow.name,
            slug: workflow.slug,
            createdAt: workflow.createdAt.toISOString(),
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

  // Execute Temporal workflow by UUID
  fastify.post('/:uuid/execute-temporal', {
    preHandler: [fastify.authenticate, fastify.requirePermission('workflows:execute')],
    schema: {
      tags: ['tenant.workflows'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        uuid: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        input: Type.Optional(Type.Record(Type.String(), Type.Any())),
        context: Type.Optional(Type.Object({
          entityType: Type.Optional(Type.String()),
          entityId: Type.Optional(Type.String({ format: 'uuid' })),
          metadata: Type.Optional(Type.Record(Type.String(), Type.Any())),
        })),
        priority: Type.Optional(Type.Union([
          Type.Literal('low'),
          Type.Literal('normal'),
          Type.Literal('high'),
          Type.Literal('urgent'),
        ])),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            executionId: Type.String(),
            workflowId: Type.String(),
            runId: Type.String(),
            status: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const uuid = toUUID(request.params.uuid);
    const userId = request.user!.id;
    const tenantId = request.user!.tenantId;

    // Get workflow definition from our service
    const workflow = await fastify.prisma.workflowDefinition.findFirst({
      where: {
        uuid,
        tenantId,
      },
    });

    if (!workflow) {
      return reply.code(404).send({
        success: false,
        error: 'WORKFLOW_DEFINITION_NOT_FOUND',
      });
    }

    try {
      const result = await workflowService.executeWorkflow({
        tenantId,
        workflowId: workflow.uuid as UUID,
        executedById: userId,
        ...request.body,
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

  // Marketplace workflow helpers
  fastify.post('/marketplace/job-application-review', {
    preHandler: [fastify.authenticate, fastify.requirePermission('jobs:manage')],
    schema: {
      tags: ['tenant.workflows'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        jobId: Type.Number({ minimum: 1 }),
        applicationId: Type.Number({ minimum: 1 }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            executionId: Type.String(),
            workflowId: Type.String(),
            runId: Type.String(),
            status: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const userId = request.user!.id;
    const tenantId = request.user!.tenantId;
    const { jobId, applicationId } = request.body;

    try {
      const result = await workflowService.executeJobApplicationReviewWorkflow(
        jobId,
        applicationId,
        tenantId,
        userId
      );

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

  fastify.post('/marketplace/gig-delivery', {
    preHandler: [fastify.authenticate, fastify.requirePermission('gigs:manage')],
    schema: {
      tags: ['tenant.workflows'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        gigId: Type.Number({ minimum: 1 }),
        bookingId: Type.Number({ minimum: 1 }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            executionId: Type.String(),
            workflowId: Type.String(),
            runId: Type.String(),
            status: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const userId = request.user!.id;
    const tenantId = request.user!.tenantId;
    const { gigId, bookingId } = request.body;

    try {
      const result = await workflowService.executeGigDeliveryWorkflow(
        gigId,
        bookingId,
        tenantId,
        userId
      );

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

  fastify.post('/marketplace/user-onboarding', {
    preHandler: [fastify.authenticate, fastify.requirePermission('users:manage')],
    schema: {
      tags: ['tenant.workflows'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        userId: Type.Number({ minimum: 1 }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            executionId: Type.String(),
            workflowId: Type.String(),
            runId: Type.String(),
            status: Type.String(),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    const currentUserId = request.user!.id;
    const tenantId = request.user!.tenantId;
    const { userId } = request.body;

    try {
      const result = await workflowService.executeUserOnboardingWorkflow(
        userId,
        tenantId
      );

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

  // Cleanup on shutdown
  fastify.addHook('onClose', async () => {
    try {
      await workflowService.cleanup();
    } catch (error) {
      fastify.log.warn('Error cleaning up workflow service:', error);
    }
  });
};