import { PrismaClient } from '@prisma/client';
import { FastifyRedis } from '@fastify/redis';
import { log } from '@temporalio/activity';
import { EmailService } from '../services/email.service';
import { NotificationService } from '../services/notification.service';

// Activity input interface
interface ActivityInput {
  tenantId: number;
  executionId: string;
  nodeId: string;
  nodeData: Record<string, any>;
  workflowInput: Record<string, any>;
  context: {
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, any>;
  };
  previousOutputs: Record<string, any>;
}

// Services that will be injected
let prisma: PrismaClient;
let redis: FastifyRedis;
let emailService: EmailService;
let notificationService: NotificationService;

// Initialize services (called from worker)
export function initializeServices(services: {
  prisma: PrismaClient;
  redis: FastifyRedis;
  emailService: EmailService;
  notificationService: NotificationService;
}) {
  prisma = services.prisma;
  redis = services.redis;
  emailService = services.emailService;
  notificationService = services.notificationService;
}

/**
 * Start Node Activity
 */
export async function executeStartNode(input: ActivityInput): Promise<any> {
  log.info('Executing start node', { nodeId: input.nodeId, tenantId: input.tenantId });

  // Update workflow execution status
  await prisma.workflowExecution.updateMany({
    where: {
      uuid: input.executionId,
      tenantId: input.tenantId,
    },
    data: {
      status: 'running',
      startedAt: new Date(),
    },
  });

  return {
    nodeType: 'start',
    timestamp: new Date().toISOString(),
    input: input.workflowInput,
  };
}

/**
 * Task Node Activity
 */
export async function executeTaskNode(input: ActivityInput): Promise<any> {
  log.info('Executing task node', { 
    nodeId: input.nodeId, 
    task: input.nodeData.task,
    tenantId: input.tenantId 
  });

  const { task } = input.nodeData;

  switch (task) {
    case 'initial_screening':
      return await executeInitialScreening(input);
    
    case 'confirm_gig_booking':
      return await confirmGigBooking(input);
    
    case 'update_application_status':
      return await updateApplicationStatus(input);
    
    case 'calculate_payment':
      return await calculatePayment(input);
    
    default:
      log.warn('Unknown task type', { task });
      return { taskType: task, completed: true, result: 'unknown_task' };
  }
}

/**
 * Decision Node Activity
 */
export async function executeDecisionNode(input: ActivityInput): Promise<{ nextNodeId: string; output: any }> {
  log.info('Executing decision node', { 
    nodeId: input.nodeId, 
    condition: input.nodeData.condition,
    tenantId: input.tenantId 
  });

  const { condition, trueNode, falseNode, rules } = input.nodeData;

  // Simple condition evaluation
  let result = false;

  if (condition && rules) {
    // Evaluate rules based on previous outputs or input data
    result = evaluateCondition(condition, rules, input.previousOutputs, input.workflowInput);
  }

  const nextNodeId = result ? trueNode : falseNode;
  
  return {
    nextNodeId,
    output: {
      condition,
      evaluated: result,
      nextNode: nextNodeId,
    },
  };
}

/**
 * API Call Node Activity
 */
export async function executeApiCallNode(input: ActivityInput): Promise<any> {
  log.info('Executing API call node', { 
    nodeId: input.nodeId, 
    endpoint: input.nodeData.endpoint,
    tenantId: input.tenantId 
  });

  const { endpoint, method = 'GET', headers = {}, body } = input.nodeData;

  try {
    // For security, only allow internal API calls
    if (!endpoint.startsWith('/api/') && !endpoint.startsWith('http://localhost:3001/')) {
      throw new Error('Only internal API calls are allowed');
    }

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const result = await response.json();

    return {
      nodeType: 'api-call',
      endpoint,
      method,
      statusCode: response.status,
      success: response.ok,
      result,
    };

  } catch (error: any) {
    log.error('API call failed', { error: error.message, endpoint });
    throw new Error(`API call failed: ${error.message}`);
  }
}

/**
 * Email Node Activity
 */
export async function executeEmailNode(input: ActivityInput): Promise<any> {
  log.info('Executing email node', { 
    nodeId: input.nodeId, 
    templateSlug: input.nodeData.templateSlug,
    tenantId: input.tenantId 
  });

  const { templateSlug, userId, to, subject, variables = {} } = input.nodeData;

  try {
    let recipients: Array<{ email: string; name?: string }> = [];

    // If userId provided, get user email
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          account: {
            select: { email: true },
          },
        },
      });

      if (user?.account?.email) {
        recipients.push({
          email: user.account.email,
          name: `${user.firstName} ${user.lastName}`,
        });
      }
    }

    // If explicit recipients provided
    if (to && Array.isArray(to)) {
      recipients = [...recipients, ...to];
    }

    if (recipients.length === 0) {
      throw new Error('No email recipients specified');
    }

    // Merge variables with workflow context
    const emailVariables = {
      ...variables,
      ...input.workflowInput,
      executionId: input.executionId,
    };

    const result = await emailService.sendEmail({
      tenantId: input.tenantId,
      templateSlug,
      to: recipients,
      subject,
      variables: emailVariables,
      tags: ['workflow', input.nodeId],
      metadata: {
        workflowExecutionId: input.executionId,
        nodeId: input.nodeId,
      },
    });

    return {
      nodeType: 'email',
      templateSlug,
      recipients: recipients.length,
      emailId: result.emailId,
      success: true,
    };

  } catch (error: any) {
    log.error('Email sending failed', { error: error.message, templateSlug });
    throw new Error(`Email sending failed: ${error.message}`);
  }
}

/**
 * Notification Node Activity
 */
export async function executeNotificationNode(input: ActivityInput): Promise<any> {
  log.info('Executing notification node', { 
    nodeId: input.nodeId, 
    type: input.nodeData.type,
    tenantId: input.tenantId 
  });

  const { type, userId, title, message, channels = ['in_app'], data = {} } = input.nodeData;

  try {
    // Handle specific notification types
    switch (type) {
      case 'job_application_received':
        if (input.nodeData.jobId && input.nodeData.applicationId) {
          await notificationService.notifyJobApplicationReceived(
            input.nodeData.jobId,
            input.nodeData.applicationId
          );
        }
        break;

      case 'gig_booking_received':
        if (input.nodeData.bookingId) {
          await notificationService.notifyGigBookingReceived(input.nodeData.bookingId);
        }
        break;

      case 'custom':
        if (userId && title && message) {
          await notificationService.sendNotification({
            tenantId: input.tenantId,
            userId,
            type: 'system.workflow',
            title,
            message,
            data: {
              ...data,
              workflowExecutionId: input.executionId,
              nodeId: input.nodeId,
            },
            channels,
          });
        }
        break;

      default:
        log.warn('Unknown notification type', { type });
    }

    return {
      nodeType: 'notification',
      notificationType: type,
      success: true,
    };

  } catch (error: any) {
    log.error('Notification sending failed', { error: error.message, type });
    throw new Error(`Notification sending failed: ${error.message}`);
  }
}

/**
 * Wait Node Activity
 */
export async function executeWaitNode(input: ActivityInput): Promise<any> {
  log.info('Executing wait node', { 
    nodeId: input.nodeId, 
    duration: input.nodeData.duration,
    tenantId: input.tenantId 
  });

  const { duration = '1 minute', reason } = input.nodeData;

  // Convert duration to milliseconds
  const durationMs = parseDuration(duration);
  
  // For activities, we don't actually wait (that's handled by workflow sleep)
  // This is just for logging and tracking
  return {
    nodeType: 'wait',
    duration,
    durationMs,
    reason,
    scheduledFor: new Date(Date.now() + durationMs).toISOString(),
  };
}

/**
 * End Node Activity
 */
export async function executeEndNode(input: ActivityInput): Promise<any> {
  log.info('Executing end node', { nodeId: input.nodeId, tenantId: input.tenantId });

  // Update workflow execution status
  await prisma.workflowExecution.updateMany({
    where: {
      uuid: input.executionId,
      tenantId: input.tenantId,
    },
    data: {
      status: 'completed',
      completedAt: new Date(),
      output: input.nodeData.output || {},
    },
  });

  return {
    nodeType: 'end',
    timestamp: new Date().toISOString(),
    workflowCompleted: true,
    finalOutput: input.nodeData.output || {},
  };
}

/**
 * Helper Functions
 */

async function executeInitialScreening(input: ActivityInput): Promise<any> {
  const { jobId, applicationId } = input.nodeData;

  // Get application details
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      job: true,
      applicant: true,
    },
  });

  if (!application) {
    throw new Error('Job application not found');
  }

  // Simple screening logic (can be enhanced)
  const hasRequiredFields = !!(
    application.coverLetter &&
    application.resumeUrl &&
    application.experience
  );

  const screeningScore = hasRequiredFields ? 0.8 : 0.4;
  const passed = screeningScore >= 0.6;

  // Update application with screening results
  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      metadata: {
        ...(application.metadata as any),
        screening: {
          score: screeningScore,
          passed,
          checkedAt: new Date().toISOString(),
          hasRequiredFields,
        },
      },
    },
  });

  return {
    taskType: 'initial_screening',
    applicationId,
    jobId,
    score: screeningScore,
    passed,
    details: { hasRequiredFields },
  };
}

async function confirmGigBooking(input: ActivityInput): Promise<any> {
  const { gigId, bookingId } = input.nodeData;

  // Update booking status
  const booking = await prisma.gigBooking.update({
    where: { id: bookingId },
    data: {
      status: 'confirmed',
      confirmedAt: new Date(),
    },
  });

  return {
    taskType: 'confirm_gig_booking',
    bookingId,
    gigId,
    confirmed: true,
    confirmedAt: booking.confirmedAt?.toISOString(),
  };
}

async function updateApplicationStatus(input: ActivityInput): Promise<any> {
  const { applicationId, status } = input.nodeData;

  await prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status },
  });

  return {
    taskType: 'update_application_status',
    applicationId,
    newStatus: status,
    updatedAt: new Date().toISOString(),
  };
}

async function calculatePayment(input: ActivityInput): Promise<any> {
  const { bookingId, gigId } = input.nodeData;

  const booking = await prisma.gigBooking.findUnique({
    where: { id: bookingId },
    include: { gig: true },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Simple payment calculation
  const subtotal = booking.totalPrice;
  const platformFee = Math.round(subtotal * 0.05); // 5% platform fee
  const processingFee = Math.round(subtotal * 0.03); // 3% processing fee
  const total = subtotal + platformFee + processingFee;

  return {
    taskType: 'calculate_payment',
    bookingId,
    subtotal,
    platformFee,
    processingFee,
    total,
  };
}

function evaluateCondition(
  condition: string,
  rules: any,
  previousOutputs: Record<string, any>,
  workflowInput: Record<string, any>
): boolean {
  // Simple condition evaluation
  // In a real implementation, you might use a rules engine
  
  try {
    // Example: "screening.passed === true"
    if (condition.includes('screening.passed')) {
      const screeningOutput = Object.values(previousOutputs).find((output: any) => 
        output.taskType === 'initial_screening'
      ) as any;
      return screeningOutput?.passed === true;
    }

    // Example: "score > 0.7"
    if (condition.includes('score >')) {
      const threshold = parseFloat(condition.split('> ')[1]);
      const screeningOutput = Object.values(previousOutputs).find((output: any) => 
        output.score !== undefined
      ) as any;
      return screeningOutput?.score > threshold;
    }

    // Default to false for unknown conditions
    return false;

  } catch (error) {
    log.warn('Failed to evaluate condition', { condition, error });
    return false;
  }
}

function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)\s*(second|minute|hour|day)s?/i);
  if (!match) {
    return 60000; // Default 1 minute
  }

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'second':
      return value * 1000;
    case 'minute':
      return value * 60 * 1000;
    case 'hour':
      return value * 60 * 60 * 1000;
    case 'day':
      return value * 24 * 60 * 60 * 1000;
    default:
      return value * 1000;
  }
}