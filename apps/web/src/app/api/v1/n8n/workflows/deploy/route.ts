import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { unifiedN8NService } from '@/lib/services/n8n.service';

/**
 * @openapi
 * /api/v1/n8n/workflows/deploy:
 *   post:
 *     summary: Deploy N8N workflow template
 *     description: Deploy a workflow template for tenant with custom configuration
 *     tags:
 *       - N8N Integration
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateId
 *               - name
 *             properties:
 *               templateId:
 *                 type: number
 *                 description: ID of the workflow template to deploy
 *               name:
 *                 type: string
 *                 description: Custom name for this workflow instance
 *               customConfig:
 *                 type: object
 *                 description: Custom configuration overrides for the workflow
 *               isTest:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this is a test deployment
 *     responses:
 *       200:
 *         description: Workflow deployed successfully
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
 *                       type: number
 *                     uuid:
 *                       type: string
 *                     tenantId:
 *                       type: number
 *                     templateId:
 *                       type: number
 *                     name:
 *                       type: string
 *                     n8nWorkflowId:
 *                       type: string
 *                     webhookPath:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     isTest:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 meta:
 *                   $ref: '#/components/schemas/ResponseMeta'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions or template not accessible
 *       404:
 *         description: Template not found
 *       500:
 *         description: Internal server error
 */

const DeploymentRequestSchema = z.object({
  templateId: z.number().int().positive('Template ID must be a positive integer'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  customConfig: z.record(z.any()).optional(),
  isTest: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    // Get session and validate authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant and user info
    const tenantId = (session.user as any).tenantId || 1;
    const userId = parseInt(session.user.id as string);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = DeploymentRequestSchema.parse(body);

    logger.info('N8N workflow deployment started', {
      tenantId,
      userId,
      templateId: validatedData.templateId,
      name: validatedData.name,
      isTest: validatedData.isTest,
    });

    // Deploy workflow
    const instance = await unifiedN8NService.deployWorkflow(
      tenantId,
      userId,
      validatedData
    );

    logger.info('N8N workflow deployed successfully', {
      tenantId,
      userId,
      templateId: validatedData.templateId,
      instanceId: instance.id,
      n8nWorkflowId: instance.n8nWorkflowId,
      webhookPath: instance.webhookPath,
    });

    return NextResponse.json({
      success: true,
      data: instance,
      meta: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: 'Template not found' },
          { status: 404 }
        );
      }

      if (error.message.includes('Access denied')) {
        return NextResponse.json(
          { success: false, error: 'Access denied to template' },
          { status: 403 }
        );
      }
    }

    logger.error('N8N workflow deployment failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 