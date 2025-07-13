import { PrismaClient } from '@prisma/client';
import { FastifyRedis } from '@fastify/redis';
import { z } from 'zod';
import type { FastifyBaseLogger } from 'fastify';
import { getOrSetCache } from '../utils/cache-utils';
import { Connection, Client } from '@temporalio/client';

// Workflow definition schemas
const createWorkflowDefinitionSchema = z.object({
  tenantId: z.number().int().positive(),
  createdById: z.number().int().positive(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().min(1).max(50),
  version: z.string().default('1.0.0'),
  definition: z.object({
    nodes: z.array(z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
      data: z.record(z.any()),
    })),
    edges: z.array(z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      type: z.string().optional(),
      data: z.record(z.any()).optional(),
    })),
  }),
  settings: z.object({
    isActive: z.boolean().default(true),
    triggerType: z.enum(['manual', 'event', 'schedule', 'webhook']).default('manual'),
    triggers: z.array(z.object({
      type: z.string(),
      config: z.record(z.any()),
    })).optional(),
    timeout: z.number().int().positive().optional(), // seconds
    retryPolicy: z.object({
      maximumAttempts: z.number().int().min(1).default(3),
      backoffCoefficient: z.number().min(1).default(2),
      maximumInterval: z.string().default('100s'),
    }).optional(),
  }),
  permissions: z.object({
    execute: z.array(z.string()).default(['workflows:execute']),
    view: z.array(z.string()).default(['workflows:read']),
    edit: z.array(z.string()).default(['workflows:update']),
  }).optional(),
});

const executeWorkflowSchema = z.object({
  tenantId: z.number().int().positive(),
  workflowId: z.number().int().positive().optional(),
  workflowSlug: z.string().optional(),
  executedById: z.number().int().positive(),
  input: z.record(z.any()).optional(),
  context: z.object({
    entityType: z.string().optional(),
    entityId: z.string().uuid().optional(),
    metadata: z.record(z.any()).optional(),
  }).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

const searchWorkflowExecutionsSchema = z.object({
  tenantId: z.number().int().positive(),
  workflowId: z.number().int().positive().optional(),
  status: z.enum(['running', 'completed', 'failed', 'cancelled', 'terminated']).optional(),
  executedById: z.number().int().positive().optional(),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['createdAt', 'startedAt', 'completedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateWorkflowDefinitionInput = z.infer<typeof createWorkflowDefinitionSchema>;
export type ExecuteWorkflowInput = z.infer<typeof executeWorkflowSchema>;
export type SearchWorkflowExecutionsInput = z.infer<typeof searchWorkflowExecutionsSchema>;

// Predefined workflow types for marketplace
export enum MarketplaceWorkflowType {
  JOB_APPLICATION_REVIEW = 'job-application-review',
  GIG_DELIVERY_PROCESS = 'gig-delivery-process',
  USER_ONBOARDING = 'user-onboarding',
  PAYMENT_PROCESSING = 'payment-processing',
  CONTENT_MODERATION = 'content-moderation',
  EMAIL_CAMPAIGN = 'email-campaign',
  DISPUTE_RESOLUTION = 'dispute-resolution',
}

interface TemporalConfig {
  address: string;
  namespace: string;
  taskQueue: string;
}

export class WorkflowService {
  private prisma: PrismaClient;
  private redis: FastifyRedis;
  private logger?: FastifyBaseLogger;
  private temporalClient?: Client;
  private temporalConnection?: Connection;
  private temporalConfig: TemporalConfig;

  constructor(
    prisma: PrismaClient,
    redis: FastifyRedis,
    temporalConfig: TemporalConfig,
    logger?: FastifyBaseLogger
  ) {
    this.prisma = prisma;
    this.redis = redis;
    this.temporalConfig = temporalConfig;
    this.logger = logger;
  }

  /**
   * Initialize Temporal connection
   */
  async initialize() {
    try {
      this.temporalConnection = await Connection.connect({
        address: this.temporalConfig.address,
      });

      this.temporalClient = new Client({
        connection: this.temporalConnection,
        namespace: this.temporalConfig.namespace,
      });

      this.logger?.info('Temporal client initialized successfully');
    } catch (error) {
      this.logger?.error({ error }, 'Failed to initialize Temporal client');
      throw error;
    }
  }

  /**
   * Create workflow definition
   */
  async createWorkflowDefinition(input: CreateWorkflowDefinitionInput) {
    const validated = createWorkflowDefinitionSchema.parse(input);

    // Check if slug already exists for tenant
    const existingWorkflow = await this.prisma.workflowDefinition.findFirst({
      where: {
        tenantId: validated.tenantId,
        slug: validated.slug,
      },
    });

    if (existingWorkflow) {
      throw new Error('Workflow with this slug already exists');
    }

    // Validate workflow definition structure
    this.validateWorkflowDefinition(validated.definition);

    const workflow = await this.prisma.workflowDefinition.create({
      data: {
        ...validated,
        definition: validated.definition as any,
        settings: validated.settings as any,
        permissions: validated.permissions || {},
      },
    });

    // Invalidate workflow cache
    await this.invalidateWorkflowCache(validated.tenantId);

    return workflow;
  }

  /**
   * Update workflow definition
   */
  async updateWorkflowDefinition(id: number, updates: Partial<CreateWorkflowDefinitionInput>) {
    const existingWorkflow = await this.prisma.workflowDefinition.findUnique({
      where: { id },
    });

    if (!existingWorkflow) {
      throw new Error('Workflow definition not found');
    }

    // Validate workflow definition if provided
    if (updates.definition) {
      this.validateWorkflowDefinition(updates.definition);
    }

    // Check slug uniqueness if being updated
    if (updates.slug && updates.slug !== existingWorkflow.slug) {
      const duplicateSlug = await this.prisma.workflowDefinition.findFirst({
        where: {
          tenantId: existingWorkflow.tenantId,
          slug: updates.slug,
          id: { not: id },
        },
      });

      if (duplicateSlug) {
        throw new Error('Workflow with this slug already exists');
      }
    }

    const workflow = await this.prisma.workflowDefinition.update({
      where: { id },
      data: {
        ...updates,
        definition: updates.definition as any,
        settings: updates.settings as any,
        permissions: updates.permissions as any,
      },
    });

    // Invalidate workflow cache
    await this.invalidateWorkflowCache(existingWorkflow.tenantId);

    return workflow;
  }

  /**
   * Get workflow definition by ID or slug (cached)
   */
  async getWorkflowDefinition(tenantId: number, workflowId?: number, slug?: string) {
    if (!workflowId && !slug) {
      throw new Error('Either workflowId or slug must be provided');
    }

    const cacheKey = workflowId
      ? `tenant:${tenantId}:workflow:${workflowId}`
      : `tenant:${tenantId}:workflow:slug:${slug}`;

    return getOrSetCache(
      this.redis,
      cacheKey,
      900, // 15 minutes
      async () => {
        const where: any = { tenantId };
        if (workflowId) where.id = workflowId;
        if (slug) where.slug = slug;

        return this.prisma.workflowDefinition.findFirst({ where });
      }
    );
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(input: ExecuteWorkflowInput) {
    const validated = executeWorkflowSchema.parse(input);

    if (!this.temporalClient) {
      throw new Error('Temporal client not initialized');
    }

    // Get workflow definition
    const workflow = await this.getWorkflowDefinition(
      validated.tenantId,
      validated.workflowId,
      validated.workflowSlug
    );

    if (!workflow) {
      throw new Error('Workflow definition not found');
    }

    if (!workflow.settings?.isActive) {
      throw new Error('Workflow is not active');
    }

    // Create execution record
    const execution = await this.prisma.workflowExecution.create({
      data: {
        tenantId: validated.tenantId,
        workflowDefinitionId: workflow.id,
        executedById: validated.executedById,
        input: validated.input || {},
        context: validated.context || {},
        status: 'running',
        priority: validated.priority,
      },
    });

    try {
      // Generate unique workflow ID
      const workflowId = `${workflow.slug}-${execution.uuid}`;

      // Prepare workflow input
      const workflowInput = {
        tenantId: validated.tenantId,
        executionId: execution.uuid,
        workflowDefinition: workflow.definition,
        input: validated.input || {},
        context: validated.context || {},
        settings: workflow.settings,
      };

      // Start Temporal workflow
      const handle = await this.temporalClient.workflow.start('marketplaceWorkflow', {
        taskQueue: this.temporalConfig.taskQueue,
        workflowId,
        args: [workflowInput],
        retry: {
          maximumAttempts: workflow.settings?.retryPolicy?.maximumAttempts || 3,
        },
      });

      // Update execution with Temporal workflow ID
      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          temporalWorkflowId: workflowId,
          temporalRunId: handle.firstExecutionRunId,
          startedAt: new Date(),
        },
      });

      // Invalidate execution cache
      await this.invalidateExecutionCache(validated.tenantId);

      return {
        executionId: execution.uuid,
        workflowId,
        runId: handle.firstExecutionRunId,
        status: 'running',
      };

    } catch (error: any) {
      // Update execution with error
      await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
        },
      });

      this.logger?.error({ error, executionId: execution.uuid }, 'Failed to start workflow');
      throw new Error(`Failed to start workflow: ${error.message}`);
    }
  }

  /**
   * Search workflow definitions
   */
  async searchWorkflowDefinitions(
    tenantId: number,
    search?: string,
    category?: string,
    limit: number = 20,
    offset: number = 0
  ) {
    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const [workflows, total] = await Promise.all([
      this.prisma.workflowDefinition.findMany({
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
          _count: {
            select: {
              executions: true,
            },
          },
        },
      }),
      this.prisma.workflowDefinition.count({ where }),
    ]);

    return {
      workflows,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Search workflow executions
   */
  async searchWorkflowExecutions(input: SearchWorkflowExecutionsInput) {
    const validated = searchWorkflowExecutionsSchema.parse(input);

    const where: any = { tenantId: validated.tenantId };

    if (validated.workflowId) {
      where.workflowDefinitionId = validated.workflowId;
    }

    if (validated.status) {
      where.status = validated.status;
    }

    if (validated.executedById) {
      where.executedById = validated.executedById;
    }

    if (validated.entityType) {
      where.context = {
        path: ['entityType'],
        equals: validated.entityType,
      };
    }

    if (validated.entityId) {
      where.context = {
        ...where.context,
        path: ['entityId'],
        equals: validated.entityId,
      };
    }

    if (validated.dateFrom || validated.dateTo) {
      where.createdAt = {};
      if (validated.dateFrom) where.createdAt.gte = new Date(validated.dateFrom);
      if (validated.dateTo) where.createdAt.lte = new Date(validated.dateTo);
    }

    const orderBy: any = {};
    orderBy[validated.sortBy] = validated.sortOrder;

    const [executions, total] = await Promise.all([
      this.prisma.workflowExecution.findMany({
        where,
        orderBy,
        skip: validated.offset,
        take: validated.limit,
        include: {
          workflowDefinition: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: true,
            },
          },
          executedBy: {
            select: {
              id: true,
              uuid: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.workflowExecution.count({ where }),
    ]);

    return {
      executions,
      total,
      hasMore: validated.offset + validated.limit < total,
    };
  }

  /**
   * Get workflow execution by UUID
   */
  async getWorkflowExecution(executionUuid: string, tenantId: number) {
    const execution = await this.prisma.workflowExecution.findFirst({
      where: {
        uuid: executionUuid,
        tenantId,
      },
      include: {
        workflowDefinition: true,
        executedBy: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!execution) {
      throw new Error('Workflow execution not found');
    }

    // Get Temporal workflow status if available
    if (execution.temporalWorkflowId && this.temporalClient) {
      try {
        const handle = this.temporalClient.workflow.getHandle(execution.temporalWorkflowId);
        const description = await handle.describe();
        
        execution.temporalStatus = {
          status: description.status.name,
          runId: description.runId,
          taskQueue: description.taskQueue,
          type: description.type,
          startTime: description.startTime,
          closeTime: description.closeTime,
        } as any;
      } catch (error) {
        this.logger?.warn({ error, workflowId: execution.temporalWorkflowId }, 'Failed to get Temporal workflow status');
      }
    }

    return execution;
  }

  /**
   * Cancel workflow execution
   */
  async cancelWorkflowExecution(executionUuid: string, userId: number) {
    const execution = await this.prisma.workflowExecution.findFirst({
      where: { uuid: executionUuid },
    });

    if (!execution) {
      throw new Error('Workflow execution not found');
    }

    if (execution.status !== 'running') {
      throw new Error('Workflow is not running');
    }

    // Cancel in Temporal if available
    if (execution.temporalWorkflowId && this.temporalClient) {
      try {
        const handle = this.temporalClient.workflow.getHandle(execution.temporalWorkflowId);
        await handle.cancel();
      } catch (error) {
        this.logger?.warn({ error, workflowId: execution.temporalWorkflowId }, 'Failed to cancel Temporal workflow');
      }
    }

    // Update execution status
    const updatedExecution = await this.prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
        cancelledById: userId,
      },
    });

    // Invalidate execution cache
    await this.invalidateExecutionCache(execution.tenantId);

    return updatedExecution;
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(tenantId: number, dateFrom?: string, dateTo?: string) {
    const cacheKey = `tenant:${tenantId}:workflow:stats:${dateFrom || 'all'}:${dateTo || 'all'}`;

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

        const [statusStats, workflowStats, totalExecutions] = await Promise.all([
          this.prisma.workflowExecution.groupBy({
            by: ['status'],
            where,
            _count: true,
          }),
          this.prisma.workflowExecution.groupBy({
            by: ['workflowDefinitionId'],
            where,
            _count: true,
            orderBy: { _count: { workflowDefinitionId: 'desc' } },
            take: 10,
          }),
          this.prisma.workflowExecution.count({ where }),
        ]);

        const statusCounts = statusStats.reduce((acc, curr) => {
          acc[curr.status] = curr._count;
          return acc;
        }, {} as Record<string, number>);

        return {
          totalExecutions,
          statusCounts,
          topWorkflows: workflowStats,
        };
      }
    );
  }

  /**
   * Marketplace workflow helpers
   */
  async executeJobApplicationReviewWorkflow(jobId: number, applicationId: number, tenantId: number, userId: number) {
    return this.executeWorkflow({
      tenantId,
      workflowSlug: MarketplaceWorkflowType.JOB_APPLICATION_REVIEW,
      executedById: userId,
      input: {
        jobId,
        applicationId,
      },
      context: {
        entityType: 'job_application',
        entityId: applicationId.toString(),
      },
    });
  }

  async executeGigDeliveryWorkflow(gigId: number, bookingId: number, tenantId: number, userId: number) {
    return this.executeWorkflow({
      tenantId,
      workflowSlug: MarketplaceWorkflowType.GIG_DELIVERY_PROCESS,
      executedById: userId,
      input: {
        gigId,
        bookingId,
      },
      context: {
        entityType: 'gig_booking',
        entityId: bookingId.toString(),
      },
    });
  }

  async executeUserOnboardingWorkflow(userId: number, tenantId: number) {
    return this.executeWorkflow({
      tenantId,
      workflowSlug: MarketplaceWorkflowType.USER_ONBOARDING,
      executedById: userId,
      input: {
        userId,
      },
      context: {
        entityType: 'user',
        entityId: userId.toString(),
      },
    });
  }

  /**
   * Private helper methods
   */
  private validateWorkflowDefinition(definition: any) {
    // Validate that the workflow has required nodes
    const { nodes, edges } = definition;

    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      throw new Error('Workflow must have at least one node');
    }

    // Check for start node
    const startNode = nodes.find((node: any) => node.type === 'start');
    if (!startNode) {
      throw new Error('Workflow must have a start node');
    }

    // Check for end node
    const endNode = nodes.find((node: any) => node.type === 'end');
    if (!endNode) {
      throw new Error('Workflow must have an end node');
    }

    // Validate edges reference existing nodes
    const nodeIds = new Set(nodes.map((node: any) => node.id));
    for (const edge of edges || []) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        throw new Error(`Edge references non-existent node: ${edge.source} -> ${edge.target}`);
      }
    }
  }

  /**
   * Helper: Invalidate workflow cache
   */
  private async invalidateWorkflowCache(tenantId: number) {
    const patterns = [
      `tenant:${tenantId}:workflow:*`,
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
   * Helper: Invalidate execution cache
   */
  private async invalidateExecutionCache(tenantId: number) {
    const patterns = [
      `tenant:${tenantId}:workflow:stats:*`,
      `tenant:${tenantId}:execution:*`,
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
   * Cleanup
   */
  async cleanup() {
    if (this.temporalConnection) {
      await this.temporalConnection.close();
    }
  }
}