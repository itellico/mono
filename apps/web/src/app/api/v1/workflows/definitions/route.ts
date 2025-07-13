import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Temporary interface until we have the proper schema
interface WorkflowDefinition {
  id?: string;
  tenantId: string;
  accountId?: string;
  createdBy: string;
  name: string;
  description?: string;
  category: string;
  version: number;
  reactflowDefinition: {
    nodes: any[];
    edges: any[];
    viewport?: { x: number; y: number; zoom: number };
  };
  temporalNamespace: string;
  temporalTaskQueue: string;
  visibility: 'private' | 'tenant' | 'public';
  permissions: Record<string, any>;
  subscriptionTierRequired?: string;
  isActive: boolean;
  isTemplate: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Mock data store (replace with actual database when schema is ready)
const mockWorkflowDefinitions: WorkflowDefinition[] = [];

/**
 * GET /api/v1/workflows/definitions
 * List workflow definitions with tenant filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isTemplate = searchParams.get('template') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Filter workflows based on user permissions
    const user = session.user as any; // TODO: Fix user type to include role, tenantId, accountId
    let filteredWorkflows = mockWorkflowDefinitions.filter(workflow => {
      // Super admin can see all
      if (user.role === 'super_admin') {
        return true;
      }

      // Tenant admin can see tenant workflows
      if (user.role === 'tenant_admin') {
        return workflow.tenantId === user.tenantId;
      }

      // Account admin can see account workflows
      if (user.role === 'account_admin') {
        return workflow.tenantId === user.tenantId && 
               workflow.accountId === user.accountId;
      }

      return false;
    });

    // Apply filters
    if (category) {
      filteredWorkflows = filteredWorkflows.filter(w => w.category === category);
    }

    if (isTemplate !== null) {
      filteredWorkflows = filteredWorkflows.filter(w => w.isTemplate === isTemplate);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedWorkflows = filteredWorkflows.slice(startIndex, endIndex);

    logger.info('Workflow definitions retrieved', {
      userId: user.id,
      tenantId: user.tenantId,
      count: paginatedWorkflows.length,
      filters: { category, isTemplate, page, limit }
    });

    return NextResponse.json({
      success: true,
      data: paginatedWorkflows,
      pagination: {
        page,
        limit,
        total: filteredWorkflows.length,
        totalPages: Math.ceil(filteredWorkflows.length / limit)
      }
    });

  } catch (error) {
    logger.error('Error retrieving workflow definitions', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/workflows/definitions
 * Create a new workflow definition
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user as any; // TODO: Fix user type to include role, tenantId, accountId

    const body = await request.json();
    const {
      name,
      description,
      category,
      reactflowDefinition,
      temporalNamespace,
      temporalTaskQueue,
      visibility = 'private',
      permissions = {},
      subscriptionTierRequired,
      isTemplate = false
    } = body;

    // Validation
    if (!name || !category || !reactflowDefinition) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, category, reactflowDefinition' },
        { status: 400 }
      );
    }

    if (!reactflowDefinition.nodes || !Array.isArray(reactflowDefinition.nodes)) {
      return NextResponse.json(
        { success: false, error: 'Invalid reactflowDefinition: nodes must be an array' },
        { status: 400 }
      );
    }

    // Check permissions
    const canCreate = checkCreatePermission(user, isTemplate);
    if (!canCreate) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create workflow' },
        { status: 403 }
      );
    }

    // Create workflow definition
    const workflowDefinition: WorkflowDefinition = {
      id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantId: user.tenantId,
      accountId: user.accountId,
      createdBy: user.id,
      name,
      description,
      category,
      version: 1,
      reactflowDefinition,
      temporalNamespace: temporalNamespace || 'mono-tenant-go-models',
      temporalTaskQueue: temporalTaskQueue || 'workflow-task-queue',
      visibility,
      permissions,
      subscriptionTierRequired,
      isActive: true,
      isTemplate,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to mock store (replace with database)
    mockWorkflowDefinitions.push(workflowDefinition);

    logger.info('Workflow definition created', {
      workflowId: workflowDefinition.id,
      userId: user.id,
      tenantId: user.tenantId,
      name,
      category,
      isTemplate
    });

    return NextResponse.json({
      success: true,
      data: workflowDefinition
    }, { status: 201 });

  } catch (error) {
    logger.error('Error creating workflow definition', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if user can create workflows
 */
function checkCreatePermission(user: any, isTemplate: boolean): boolean {
  // Super admin can create anything
  if (user.role === 'super_admin') {
    return true;
  }

  // Tenant admin can create tenant workflows and templates
  if (user.role === 'tenant_admin') {
    return true;
  }

  // Account admin can create account workflows (not templates)
  if (user.role === 'account_admin') {
    return !isTemplate;
  }

  return false;
} 