import { type Node, type Edge } from '@xyflow/react';
import { browserLogger } from '@/lib/browser-logger';

export interface SaveWorkflowData {
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  tenantId: string;
  createdBy: string;
  category?: string;
  tags?: string[];
}

interface SaveWorkflowResponse {
  success: boolean;
  workflowId: string;
  message: string;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  // Add other workflow properties as needed
}

interface ListWorkflowsResponse {
  success: boolean;
  workflows: Workflow[];
}

interface LoadWorkflowResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    description: string;
    type: 'system' | 'user';
    category: string;
    reactflowDefinition: {
      nodes: Node[];
      edges: Edge[];
      viewport: { x: number; y: number; zoom: number };
    };
    metadata: {
      version: string;
      createdBy: string;
      lastModified: string;
      isProtected: boolean;
      executionCount: number;
      successRate: number;
    };
  };
}

export class WorkflowClientService {
  /**
   * Save a workflow via API
   */
  static async saveWorkflow(data: SaveWorkflowData): Promise<string> {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save workflow');
      }

      const result: SaveWorkflowResponse = await response.json();
      return result.workflowId;
    } catch (error) {
      browserLogger.error('Error saving workflow', { error, data });
      throw error;
    }
  }

  /**
   * Load a specific workflow by ID
   */
  static async loadWorkflow(workflowId: string): Promise<LoadWorkflowResponse['data']> {
    try {
      browserLogger.userAction('workflow_load_requested', JSON.stringify({ workflowId }));

      const response = await fetch(`/api/v1/workflows/${workflowId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load workflow');
      }

      const result: LoadWorkflowResponse = await response.json();

      browserLogger.userAction('workflow_loaded_successfully', JSON.stringify({
        workflowId: result.data.id,
        workflowName: result.data.name,
        nodeCount: result.data.reactflowDefinition.nodes.length,
        edgeCount: result.data.reactflowDefinition.edges.length
      }));

      return result.data;
    } catch (error) {
      browserLogger.error('Error loading workflow', { error, workflowId });
      throw error;
    }
  }

  /**
   * Update an existing workflow by ID
   */
  static async updateWorkflow(workflowId: string, data: {
    name?: string;
    description?: string;
    category?: string;
    tags?: string[];
    nodes?: Node[];
    edges?: Edge[];
  }): Promise<void> {
    try {
      browserLogger.userAction('workflow_update_requested', JSON.stringify({ workflowId, hasNodes: !!data.nodes, hasEdges: !!data.edges }));

      const response = await fetch(`/api/v1/workflows/${workflowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update workflow');
      }

      const result = await response.json();

      browserLogger.userAction('workflow_updated_successfully', JSON.stringify({
        workflowId,
        message: result.data?.message || 'Workflow updated'
      }));

    } catch (error) {
      browserLogger.error('Error updating workflow', { error, workflowId, data });
      throw error;
    }
  }

  /**
   * List workflows via API
   */
  static async listWorkflows(tenantId: string, limit = 50, offset = 0): Promise<Workflow[]> {
    try {
      const params = new URLSearchParams({
        tenantId,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`/api/workflows?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to list workflows');
      }

      const result: ListWorkflowsResponse = await response.json();
      return result.workflows;
    } catch (error) {
      browserLogger.error('Error listing workflows', { error, tenantId });
      throw error;
    }
  }
} 