import { Node, Edge } from '@xyflow/react';
import { Client } from '@temporalio/client';

// ReactFlow node types that map to Temporal activities
export interface ReactFlowWorkflowDefinition {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  nodes: Node[];
  edges: Edge[];
  variables?: Record<string, any>;
}

// Temporal workflow execution context
export interface TemporalWorkflowContext {
  workflowId: string;
  tenantId: string;
  namespace: string;
  taskQueue: string;
  input: Record<string, any>;
}

export class ReactFlowTemporalBridge {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Convert ReactFlow workflow definition to Temporal workflow execution
   */
  async executeReactFlowWorkflow(
    workflowDefinition: ReactFlowWorkflowDefinition,
    context: TemporalWorkflowContext
  ): Promise<string> {
    // Validate workflow definition
    this.validateWorkflowDefinition(workflowDefinition);

    // Convert ReactFlow nodes to Temporal activities
    const workflowSteps = this.convertNodesToActivities(workflowDefinition.nodes, workflowDefinition.edges);

    // Start Temporal workflow
    const handle = await this.client.workflow.start('reactFlowDynamicWorkflow', {
      workflowId: context.workflowId,
      taskQueue: context.taskQueue,
      args: [{
        steps: workflowSteps,
        tenantId: context.tenantId,
        input: context.input,
        metadata: {
          originalWorkflowId: workflowDefinition.id,
          workflowName: workflowDefinition.name
        }
      }]
    });

    return handle.workflowId;
  }

  /**
   * Convert ReactFlow nodes to Temporal activity steps
   */
  private convertNodesToActivities(nodes: Node[], edges: Edge[]): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const edgeMap = this.buildEdgeMap(edges);

    // Find start node
    const startNode = nodes.find(node => node.type === 'start');
    if (!startNode) {
      throw new Error('Workflow must have a start node');
    }

    // Traverse workflow from start node
    const visited = new Set<string>();
    this.traverseWorkflow(startNode, nodeMap, edgeMap, steps, visited);

    return steps;
  }

  /**
   * Recursively traverse workflow nodes and convert to steps
   */
  private traverseWorkflow(
    currentNode: Node,
    nodeMap: Map<string, Node>,
    edgeMap: Map<string, Edge[]>,
    steps: WorkflowStep[],
    visited: Set<string>
  ): void {
    if (visited.has(currentNode.id)) {
      return; // Avoid infinite loops
    }
    visited.add(currentNode.id);

    // Convert current node to workflow step
    const step = this.nodeToWorkflowStep(currentNode);
    if (step) {
      steps.push(step);
    }

    // Get outgoing edges
    const outgoingEdges = edgeMap.get(currentNode.id) || [];

    // Process next nodes based on node type
    switch (currentNode.type) {
      case 'decision':
        // Handle conditional branching
        this.handleDecisionNode(currentNode, outgoingEdges, nodeMap, edgeMap, steps, visited);
        break;

      case 'approval':
        // Handle approval nodes
        this.handleApprovalNode(currentNode, outgoingEdges, nodeMap, edgeMap, steps, visited);
        break;

      default:
        // Handle linear flow
        outgoingEdges.forEach(edge => {
          const nextNode = nodeMap.get(edge.target);
          if (nextNode) {
            this.traverseWorkflow(nextNode, nodeMap, edgeMap, steps, visited);
          }
        });
    }
  }

  /**
   * Convert ReactFlow node to Temporal workflow step
   */
  private nodeToWorkflowStep(node: Node): WorkflowStep | null {
    switch (node.type) {
      case 'start':
        return {
          id: node.id,
          type: 'start',
          activity: 'initializeWorkflow',
          input: node.data || {}
        };

      case 'approval':
        return {
          id: node.id,
          type: 'approval',
          activity: 'requestApproval',
          input: {
            approver: node.data?.approver,
            message: node.data?.message,
            timeout: node.data?.timeout || '24h'
          }
        };

             case 'action':
         return {
           id: node.id,
           type: 'action',
           activity: this.getActivityForActionType(node.data?.actionType as string),
           input: node.data || {}
         };

      case 'decision':
        return {
          id: node.id,
          type: 'decision',
          activity: 'evaluateCondition',
          input: {
            condition: node.data?.condition,
            field: node.data?.field,
            operator: node.data?.operator,
            value: node.data?.value
          }
        };

      case 'end':
        return {
          id: node.id,
          type: 'end',
          activity: 'completeWorkflow',
          input: node.data || {}
        };

      default:
        console.warn(`Unknown node type: ${node.type}`);
        return null;
    }
  }

  /**
   * Map ReactFlow action types to Temporal activities
   */
  private getActivityForActionType(actionType: string): string {
    const activityMap: Record<string, string> = {
      'email': 'sendEmail',
      'webhook': 'callWebhook',
      'database': 'updateDatabase',
      'notification': 'sendNotification',
      'sms': 'sendSMS',
      'slack': 'sendSlackMessage',
      'backup': 'executeBackup'
    };

    return activityMap[actionType] || 'executeGenericAction';
  }

  /**
   * Handle decision node branching
   */
  private handleDecisionNode(
    decisionNode: Node,
    outgoingEdges: Edge[],
    nodeMap: Map<string, Node>,
    edgeMap: Map<string, Edge[]>,
    steps: WorkflowStep[],
    visited: Set<string>
  ): void {
    // Add conditional branches
    outgoingEdges.forEach(edge => {
      const nextNode = nodeMap.get(edge.target);
      if (nextNode) {
        // Add branch condition to the step
        const branchStep: WorkflowStep = {
          id: `${decisionNode.id}_branch_${edge.sourceHandle}`,
          type: 'branch',
          activity: 'executeBranch',
          input: {
            condition: edge.sourceHandle, // 'yes', 'no', etc.
            parentDecision: decisionNode.id
          }
        };
        steps.push(branchStep);

        // Continue traversal for this branch
        this.traverseWorkflow(nextNode, nodeMap, edgeMap, steps, visited);
      }
    });
  }

  /**
   * Handle approval node with multiple outcomes
   */
  private handleApprovalNode(
    approvalNode: Node,
    outgoingEdges: Edge[],
    nodeMap: Map<string, Node>,
    edgeMap: Map<string, Edge[]>,
    steps: WorkflowStep[],
    visited: Set<string>
  ): void {
    // Similar to decision node but for approval outcomes
    outgoingEdges.forEach(edge => {
      const nextNode = nodeMap.get(edge.target);
      if (nextNode && edge.sourceHandle) {
        // Add approval outcome branch
        const outcomeStep: WorkflowStep = {
          id: `${approvalNode.id}_outcome_${edge.sourceHandle}`,
          type: 'approval_outcome',
          activity: 'handleApprovalOutcome',
          input: {
            outcome: edge.sourceHandle, // 'approved', 'rejected', etc.
            parentApproval: approvalNode.id
          }
        };
        steps.push(outcomeStep);

        this.traverseWorkflow(nextNode, nodeMap, edgeMap, steps, visited);
      }
    });
  }

  /**
   * Build edge map for efficient lookup
   */
  private buildEdgeMap(edges: Edge[]): Map<string, Edge[]> {
    const edgeMap = new Map<string, Edge[]>();

    edges.forEach(edge => {
      const sourceEdges = edgeMap.get(edge.source) || [];
      sourceEdges.push(edge);
      edgeMap.set(edge.source, sourceEdges);
    });

    return edgeMap;
  }

  /**
   * Validate ReactFlow workflow definition
   */
  private validateWorkflowDefinition(definition: ReactFlowWorkflowDefinition): void {
    if (!definition.nodes || definition.nodes.length === 0) {
      throw new Error('Workflow must have at least one node');
    }

    const hasStartNode = definition.nodes.some(node => node.type === 'start');
    if (!hasStartNode) {
      throw new Error('Workflow must have a start node');
    }

    const hasEndNode = definition.nodes.some(node => node.type === 'end');
    if (!hasEndNode) {
      throw new Error('Workflow must have an end node');
    }

    // Validate tenant context
    if (!definition.tenantId) {
      throw new Error('Workflow must have a tenantId for proper isolation');
    }
  }

  /**
   * Get workflow execution status
   */
  async getWorkflowStatus(workflowId: string): Promise<WorkflowStatus> {
    try {
      const handle = this.client.workflow.getHandle(workflowId);
      const description = await handle.describe();

      return {
        workflowId,
        status: description.status.name,
        startTime: description.startTime,
        closeTime: description.closeTime,
        historyLength: description.historyLength
      };
    } catch (error) {
      throw new Error(`Failed to get workflow status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Type definitions
export interface WorkflowStep {
  id: string;
  type: 'start' | 'approval' | 'action' | 'decision' | 'branch' | 'approval_outcome' | 'end';
  activity: string;
  input: Record<string, any>;
}

export interface WorkflowStatus {
  workflowId: string;
  status: string;
  startTime?: Date;
  closeTime?: Date;
  historyLength?: number;
} 