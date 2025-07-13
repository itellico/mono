import { db } from '@/lib/db';
import { workflows, workflowNodes, workflowEdges, type NewWorkflow, type NewWorkflowNode, type NewWorkflowEdge } from '@/lib/schemas/workflows';
import { type Node, type Edge } from '@xyflow/react';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

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

export interface UpdateWorkflowData {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  nodes?: Node[];
  edges?: Edge[];
  updatedBy: string;
}

export class WorkflowService {
  /**
   * Save a workflow with its nodes and edges
   */
  static async saveWorkflow(data: SaveWorkflowData): Promise<string> {
    try {
      // Start a transaction to ensure data consistency
      const result = await db.transaction(async (tx) => {
        // 1. Insert the workflow
        const [workflow] = await tx.insert(workflows).values({
          tenantId: data.tenantId,
          name: data.name,
          description: data.description,
          status: 'draft',
          category: data.category || 'general',
          tags: data.tags || [],
          createdBy: data.createdBy,
          updatedBy: data.createdBy,
        }).returning({ id: workflows.id });

        const workflowId = workflow.id;

        // 2. Insert workflow nodes
        if (data.nodes.length > 0) {
          const nodeInserts: NewWorkflowNode[] = data.nodes.map(node => ({
            workflowId,
            nodeId: node.id,
            type: node.type || 'default',
            label: String(node.data?.label || 'Untitled Node'),
            description: node.data?.description ? String(node.data.description) : undefined,
            positionX: Math.round(node.position.x),
            positionY: Math.round(node.position.y),
            data: node.data || {},
            config: node.data?.config || {},
            conditions: Array.isArray(node.data?.conditions) ? node.data.conditions : [],
            actions: Array.isArray(node.data?.actions) ? node.data.actions : [],
            permissions: Array.isArray(node.data?.permissions) ? node.data.permissions : [],
            subscriptionTierRequired: node.data?.subscriptionTierRequired ? String(node.data.subscriptionTierRequired) : undefined,
            status: node.data?.status ? String(node.data.status) : 'pending',
          }));

          await tx.insert(workflowNodes).values(nodeInserts);
        }

        // 3. Insert workflow edges
        if (data.edges.length > 0) {
          const edgeInserts: NewWorkflowEdge[] = data.edges.map(edge => ({
            workflowId,
            edgeId: edge.id,
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
            sourceHandle: edge.sourceHandle || undefined,
            targetHandle: edge.targetHandle || undefined,
            type: edge.type || 'default',
            animated: edge.animated || false,
            label: edge.label ? String(edge.label) : undefined,
            style: edge.style || {},
            data: edge.data || {},
          }));

          await tx.insert(workflowEdges).values(edgeInserts);
        }

        return workflowId;
      });

      return result;
    } catch (error) {
      logger.error({ err: error, data }, 'Error saving workflow');
      throw new Error('Failed to save workflow');
    }
  }

  /**
   * Load a workflow with its nodes and edges
   */
  static async loadWorkflow(workflowId: string, tenantId: string): Promise<{
    workflow: any;
    nodes: Node[];
    edges: Edge[];
  } | null> {
    try {
      // Get workflow
      const [workflow] = await db
        .select()
        .from(workflows)
        .where(and(eq(workflows.id, workflowId), eq(workflows.tenantId, tenantId)))
        .limit(1);

      if (!workflow) {
        return null;
      }

      // Get nodes
      const dbNodes = await db
        .select()
        .from(workflowNodes)
        .where(eq(workflowNodes.workflowId, workflowId));

      // Get edges
      const dbEdges = await db
        .select()
        .from(workflowEdges)
        .where(eq(workflowEdges.workflowId, workflowId));

      // Convert to ReactFlow format
      const nodes: Node[] = dbNodes.map(node => ({
        id: node.nodeId,
        type: node.type,
        position: { x: node.positionX, y: node.positionY },
        data: {
          label: node.label,
          description: node.description,
          conditions: node.conditions,
          actions: node.actions,
          config: node.config,
          permissions: node.permissions,
          subscriptionTierRequired: node.subscriptionTierRequired,
          status: node.status,
          ...node.data,
        },
      }));

      const edges: Edge[] = dbEdges.map(edge => ({
        id: edge.edgeId,
        source: edge.sourceNodeId,
        target: edge.targetNodeId,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type || 'default',
        animated: edge.animated || false,
        label: edge.label,
        style: edge.style,
        data: edge.data,
      }));

      return {
        workflow,
        nodes,
        edges,
      };
    } catch (error) {
      logger.error({ err: error, workflowId, tenantId }, 'Error loading workflow');
      throw new Error('Failed to load workflow');
    }
  }

  /**
   * List workflows for a tenant
   */
  static async listWorkflows(tenantId: string, limit = 50, offset = 0) {
    try {
      const workflowList = await db
        .select({
          id: workflows.id,
          name: workflows.name,
          description: workflows.description,
          status: workflows.status,
          category: workflows.category,
          tags: workflows.tags,
          createdAt: workflows.createdAt,
          updatedAt: workflows.updatedAt,
        })
        .from(workflows)
        .where(eq(workflows.tenantId, tenantId))
        .limit(limit)
        .offset(offset)
        .orderBy(workflows.updatedAt);

      return workflowList;
    } catch (error) {
      logger.error({ err: error, tenantId }, 'Error listing workflows');
      throw new Error('Failed to list workflows');
    }
  }

  /**
   * Update workflow status
   */
  static async updateWorkflowStatus(workflowId: string, tenantId: string, status: string, updatedBy: string) {
    try {
      await db
        .update(workflows)
        .set({ 
          status, 
          updatedBy,
          updatedAt: new Date(),
        })
        .where(and(eq(workflows.id, workflowId), eq(workflows.tenantId, tenantId)));
    } catch (error) {
      logger.error({ err: error, workflowId, tenantId, status }, 'Error updating workflow status');
      throw new Error('Failed to update workflow status');
    }
  }

  /**
   * Delete a workflow and all its nodes/edges
   */
  static async deleteWorkflow(workflowId: string, tenantId: string) {
    try {
      await db
        .delete(workflows)
        .where(and(eq(workflows.id, workflowId), eq(workflows.tenantId, tenantId)));

      // Nodes and edges will be deleted automatically due to cascade
    } catch (error) {
      logger.error({ err: error, workflowId, tenantId }, 'Error deleting workflow');
      throw new Error('Failed to delete workflow');
    }
  }

  /**
   * Update a workflow with its nodes and edges
   */
  static async updateWorkflow(workflowId: string, tenantId: string, data: {
    name?: string;
    description?: string;
    category?: string;
    tags?: string[];
    nodes?: Node[];
    edges?: Edge[];
    updatedBy: string;
  }) {
    try {
      // Start a transaction to ensure data consistency
      await db.transaction(async (tx) => {
        // 1. Update the workflow metadata
        const updateData: any = {
          updatedBy: data.updatedBy,
          updatedAt: new Date(),
        };

        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.tags !== undefined) updateData.tags = data.tags;

        await tx
          .update(workflows)
          .set(updateData)
          .where(and(eq(workflows.id, workflowId), eq(workflows.tenantId, tenantId)));

        // 2. Update nodes if provided
        if (data.nodes !== undefined) {
          // Delete existing nodes
          await tx.delete(workflowNodes).where(eq(workflowNodes.workflowId, workflowId));

          // Insert new nodes
          if (data.nodes.length > 0) {
            const nodeInserts: NewWorkflowNode[] = data.nodes.map(node => ({
              workflowId,
              nodeId: node.id,
              type: node.type || 'default',
              label: String(node.data?.label || 'Untitled Node'),
              description: node.data?.description ? String(node.data.description) : undefined,
              positionX: Math.round(node.position.x),
              positionY: Math.round(node.position.y),
              data: node.data || {},
              config: node.data?.config || {},
              conditions: Array.isArray(node.data?.conditions) ? node.data.conditions : [],
              actions: Array.isArray(node.data?.actions) ? node.data.actions : [],
              permissions: Array.isArray(node.data?.permissions) ? node.data.permissions : [],
              subscriptionTierRequired: node.data?.subscriptionTierRequired ? String(node.data.subscriptionTierRequired) : undefined,
              status: node.data?.status ? String(node.data.status) : 'pending',
            }));

            await tx.insert(workflowNodes).values(nodeInserts);
          }
        }

        // 3. Update edges if provided
        if (data.edges !== undefined) {
          // Delete existing edges
          await tx.delete(workflowEdges).where(eq(workflowEdges.workflowId, workflowId));

          // Insert new edges
          if (data.edges.length > 0) {
            const edgeInserts: NewWorkflowEdge[] = data.edges.map(edge => ({
              workflowId,
              edgeId: edge.id,
              sourceNodeId: edge.source,
              targetNodeId: edge.target,
              sourceHandle: edge.sourceHandle || undefined,
              targetHandle: edge.targetHandle || undefined,
              type: edge.type || 'default',
              animated: edge.animated || false,
              label: edge.label ? String(edge.label) : undefined,
              style: edge.style || {},
              data: edge.data || {},
            }));

            await tx.insert(workflowEdges).values(edgeInserts);
          }
        }
      });
    } catch (error) {
      logger.error({ err: error, workflowId, tenantId, data }, 'Error updating workflow');
      throw new Error('Failed to update workflow');
    }
  }
} 