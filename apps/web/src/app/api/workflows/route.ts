/**
 * @swagger
 * /api/workflows:
 *   post:
 *     summary: Save a workflow
 *     description: Saves a complete workflow definition, including its nodes and edges.
 *     tags: [Workflows]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SaveWorkflowData'
 *     responses:
 *       200:
 *         description: Workflow saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 workflowId:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Failed to save workflow
 *   get:
 *     summary: List workflows for a tenant
 *     description: Retrieves a paginated list of workflows for a specific tenant.
 *     tags: [Workflows]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the tenant to retrieve workflows for.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: The maximum number of workflows to return.
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: The number of workflows to skip before starting to collect the result set.
 *     responses:
 *       200:
 *         description: Workflows retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 workflows:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Workflow'
 *       400:
 *         description: tenantId is required
 *       500:
 *         description: Failed to list workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowService } from '@/lib/services/workflow.service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, nodes, edges, tenantId, createdBy, category, tags } = body;

    if (!name || !nodes || !edges || !tenantId || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const workflowId = await WorkflowService.saveWorkflow({
      name,
      description,
      nodes,
      edges,
      tenantId,
      createdBy,
      category,
      tags,
    });

    return NextResponse.json({ 
      success: true, 
      workflowId,
      message: 'Workflow saved successfully' 
    });
  } catch (error) {
    logger.error({ err: error, body: await request.json().catch(() => 'invalid json') }, 'Error saving workflow');
    return NextResponse.json(
      { error: 'Failed to save workflow' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const workflows = await WorkflowService.listWorkflows(tenantId, limit, offset);

    return NextResponse.json({ 
      success: true, 
      workflows 
    });
  } catch (error) {
    const tenantId = new URL(request.url).searchParams.get('tenantId');
    logger.error({ err: error, tenantId }, 'Error listing workflows');
    return NextResponse.json(
      { error: 'Failed to list workflows' },
      { status: 500 }
    );
  }
} 