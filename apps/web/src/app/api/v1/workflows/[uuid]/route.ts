import { NextRequest, NextResponse } from 'next/server';
import { logger, logApiRequest, logApiResponse } from '@/lib/logger';
import { auth } from '@/lib/auth';
import { WorkflowService } from '@/lib/services/workflow.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * @openapi
 * /api/v1/workflows/{id}:
 *   get:
 *     summary: Get specific workflow by ID
 *     description: Retrieve a workflow definition with ReactFlow nodes and edges for editing
 *     tags:
 *       - Workflows
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Workflow ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [system, user]
 *                     category:
 *                       type: string
 *                     reactflowDefinition:
 *                       type: object
 *                       properties:
 *                         nodes:
 *                           type: array
 *                         edges:
 *                           type: array
 *                         viewport:
 *                           type: object
 *                     metadata:
 *                       type: object
 *                 meta:
 *                   $ref: '#/components/schemas/ResponseMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = uuidv4();
  const startTime = Date.now();
  const { id } = await params;

  logApiRequest(request.method, request.url, correlationId);

  try {
    // Authentication
    const session = await auth();
    if (!session?.user) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          meta: {
            timestamp: new Date().toISOString(),
            correlationId,
            version: '1.0.0'
          }
        },
        { status: 401 }
      );

      logApiResponse(request.method, request.url, 401, correlationId, Date.now() - startTime);
      return response;
    }

    // Get tenant ID (for development, using default)
    const tenantId = (session.user as any).tenantId || '00000000-0000-0000-0000-000000000000';

    // Load workflow from database
    const workflowData = await WorkflowService.loadWorkflow(id, tenantId);

    if (!workflowData) {
      // If not found in database, return mock data for specific known system workflows
      const systemWorkflows: { [key: string]: any } = {
        'backup-workflow-001': {
          id: 'backup-workflow-001',
          name: 'Database Backup Workflow',
          description: 'Automated database backup with compression and encryption',
          type: 'system',
          category: 'backup',
          reactflowDefinition: {
            nodes: [
              {
                id: 'start-1',
                type: 'start',
                position: { x: 100, y: 100 },
                data: {
                  label: 'Start Backup',
                  description: 'Initialize database backup process',
                  config: {
                    triggerType: 'scheduled',
                    triggerSource: 'cron.daily',
                    filters: []
                  }
                }
              },
              {
                id: 'backup-1',
                type: 'updateRecord',
                position: { x: 300, y: 100 },
                data: {
                  label: 'Create Database Backup',
                  description: 'Create compressed and encrypted database backup',
                  config: {
                    actionType: 'backup',
                    target: 'database',
                    compression: true,
                    encryption: true
                  }
                }
              },
              {
                id: 'upload-1',
                type: 'webhook',
                position: { x: 500, y: 100 },
                data: {
                  label: 'Upload to Storage',
                  description: 'Upload backup to cloud storage',
                  config: {
                    url: 'https://storage.api.example.com/backup',
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer {{token}}' }
                  }
                }
              },
              {
                id: 'end-1',
                type: 'end',
                position: { x: 700, y: 100 },
                data: {
                  label: 'Backup Complete',
                  description: 'Database backup completed successfully'
                }
              }
            ],
            edges: [
              { id: 'e1', source: 'start-1', target: 'backup-1' },
              { id: 'e2', source: 'backup-1', target: 'upload-1' },
              { id: 'e3', source: 'upload-1', target: 'end-1' }
            ],
            viewport: { x: 0, y: 0, zoom: 1 }
          },
          metadata: {
            version: '1.0.0',
            createdBy: 'system',
            lastModified: '2024-01-15T10:00:00Z',
            isProtected: true,
            executionCount: 127,
            successRate: 99.2
          }
        },
        'user-onboarding-001': {
          id: 'user-onboarding-001',
          name: 'Model Onboarding Workflow',
          description: 'Complete onboarding process with approval and verification',
          type: 'system',
          category: 'onboarding',
          reactflowDefinition: {
            nodes: [
              {
                id: 'start-1',
                type: 'start',
                position: { x: 100, y: 100 },
                data: {
                  label: 'Start Onboarding',
                  description: 'Begin model onboarding process',
                  config: {
                    triggerType: 'manual',
                    triggerSource: 'user_registration',
                    filters: []
                  }
                }
              },
              {
                id: 'approval-1',
                type: 'approval',
                position: { x: 300, y: 100 },
                data: {
                  label: 'Profile Review',
                  description: 'Review and approve model profile',
                  config: {
                    approvers: ['admin', 'moderator'],
                    autoApprove: false,
                    timeoutDays: 7
                  }
                }
              },
              {
                id: 'email-1',
                type: 'email',
                position: { x: 500, y: 100 },
                data: {
                  label: 'Welcome Email',
                  description: 'Send welcome email to approved model',
                  config: {
                    template: 'model_welcome',
                    recipients: ['{{user.email}}']
                  }
                }
              },
              {
                id: 'end-1',
                type: 'end',
                position: { x: 700, y: 100 },
                data: {
                  label: 'Onboarding Complete',
                  description: 'Model successfully onboarded'
                }
              }
            ],
            edges: [
              { id: 'e1', source: 'start-1', target: 'approval-1' },
              { id: 'e2', source: 'approval-1', target: 'email-1' },
              { id: 'e3', source: 'email-1', target: 'end-1' }
            ],
            viewport: { x: 0, y: 0, zoom: 1 }
          },
          metadata: {
            version: '1.0.0',
            createdBy: 'system',
            lastModified: '2024-01-10T15:30:00Z',
            isProtected: true,
            executionCount: 89,
            successRate: 95.5
          }
        }
      };

      if (systemWorkflows[id]) {
        const response = NextResponse.json({
          success: true,
          data: systemWorkflows[id],
          meta: {
            timestamp: new Date().toISOString(),
            correlationId,
            version: '1.0.0'
          }
        });

        logger.info('System workflow retrieved successfully', { workflowId: id });
        logApiResponse(request.method, request.url, 200, correlationId, Date.now() - startTime);
        return response;
      }

      // Workflow not found
      const response = NextResponse.json(
        {
          success: false,
          error: 'Workflow not found',
          meta: {
            timestamp: new Date().toISOString(),
            correlationId,
            version: '1.0.0'
          }
        },
        { status: 404 }
      );

      logApiResponse(request.method, request.url, 404, correlationId, Date.now() - startTime);
      return response;
    }

    // Convert database format to API format
    const responseData = {
      id: workflowData.workflow.id,
      name: workflowData.workflow.name,
      description: workflowData.workflow.description,
      type: workflowData.workflow.isTemplate ? 'template' : 'user',
      category: workflowData.workflow.category,
      reactflowDefinition: {
        nodes: workflowData.nodes,
        edges: workflowData.edges,
        viewport: { x: 0, y: 0, zoom: 1 }
      },
      metadata: {
        version: workflowData.workflow.version.toString(),
        createdBy: workflowData.workflow.createdBy,
        lastModified: workflowData.workflow.updatedAt,
        isProtected: workflowData.workflow.status === 'active',
        status: workflowData.workflow.status,
        tags: workflowData.workflow.tags
      }
    };

    const response = NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        timestamp: new Date().toISOString(),
        correlationId,
        version: '1.0.0'
      }
    });

    logger.info('Workflow retrieved successfully');
    logApiResponse(request.method, request.url, 200, correlationId, Date.now() - startTime);
    return response;

  } catch (error) {
    logger.error({ err: error, workflowId: id }, 'Error retrieving workflow');

    const response = NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        meta: {
          timestamp: new Date().toISOString(),
          correlationId,
          version: '1.0.0'
        }
      },
      { status: 500 }
    );

    logApiResponse(request.method, request.url, 500, correlationId, Date.now() - startTime);
    return response;
  }
}

/**
 * @openapi
 * /api/v1/workflows/{id}:
 *   put:
 *     summary: Update specific workflow by ID
 *     description: Update a workflow definition with ReactFlow nodes and edges
 *     tags:
 *       - Workflows
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Workflow ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               nodes:
 *                 type: array
 *               edges:
 *                 type: array
 *     responses:
 *       200:
 *         description: Workflow updated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = uuidv4();
  const startTime = Date.now();
  const { id } = await params;

  logApiRequest(request.method, request.url, correlationId);

  try {
    // Authentication
    const session = await auth();
    if (!session?.user) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          meta: {
            timestamp: new Date().toISOString(),
            correlationId,
            version: '1.0.0'
          }
        },
        { status: 401 }
      );

      logApiResponse(request.method, request.url, 401, correlationId, Date.now() - startTime);
      return response;
    }

    // Get tenant ID (for development, using default)
    const tenantId = (session.user as any).tenantId || '00000000-0000-0000-0000-000000000000';
    const userId = session.user.id || 'unknown';

    // Parse request body
    const body = await request.json();
    const { name, description, category, tags, nodes, edges } = body;

    // Check if workflow exists
    const existingWorkflow = await WorkflowService.loadWorkflow(id, tenantId);
    if (!existingWorkflow) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Workflow not found',
          meta: {
            timestamp: new Date().toISOString(),
            correlationId,
            version: '1.0.0'
          }
        },
        { status: 404 }
      );

      logApiResponse(request.method, request.url, 404, correlationId, Date.now() - startTime);
      return response;
    }

    // Update workflow using service
    await WorkflowService.updateWorkflow(id, tenantId, {
      name,
      description,
      category,
      tags,
      nodes,
      edges,
      updatedBy: userId
    });

    const response = NextResponse.json({
      success: true,
      data: { id, message: 'Workflow updated successfully' },
      meta: {
        timestamp: new Date().toISOString(),
        correlationId,
        version: '1.0.0'
      }
    });

    logger.info('Workflow updated successfully');
    logApiResponse(request.method, request.url, 200, correlationId, Date.now() - startTime);
    return response;

  } catch (error) {
    logger.error({ err: error, workflowId: id }, 'Error updating workflow');

    const response = NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        meta: {
          timestamp: new Date().toISOString(),
          correlationId,
          version: '1.0.0'
        }
      },
      { status: 500 }
    );

    logApiResponse(request.method, request.url, 500, correlationId, Date.now() - startTime);
    return response;
  }
} 