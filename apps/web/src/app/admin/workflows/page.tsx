'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  ReactFlow, 
  ReactFlowProvider,
  Background, 
  Controls, 
  MiniMap, 
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type OnConnect,
  type NodeTypes,
  MarkerType,
  ConnectionLineType,
  useOnSelectionChange
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Components
import { NodePalette } from './components/NodePalette';
import { NodeEditor } from './components/NodeEditor';
import { TemplateLibrary } from './components/TemplateLibrary';
import { WorkflowHeader } from './components/WorkflowHeader';

// Node Components
import { StartNode } from './nodes/StartNode';
import { ApprovalNode } from './nodes/ApprovalNode';
import { WaitNode } from './nodes/WaitNode';
import { DecisionNode } from './nodes/DecisionNode';
import { EmailNode } from './nodes/EmailNode';
import { UpdateRecordNode } from './nodes/UpdateRecordNode';
import { WebhookNode } from './nodes/WebhookNode';
import { EndNode } from './nodes/EndNode';

// Types
import { WorkflowNodeData } from './types/workflow';
import { WorkflowClientService } from '@/lib/services/workflow-client.service';
import { useToast } from '@/hooks/use-toast';

const nodeTypes: NodeTypes = {
  start: StartNode,
  approval: ApprovalNode,
  wait: WaitNode,
  decision: DecisionNode,
  email: EmailNode,
  updateRecord: UpdateRecordNode,
  webhook: WebhookNode,
  end: EndNode,
};

const initialNodes: Node[] = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 400, y: 100 },
    data: {
      label: 'Start Workflow',
      description: 'Triggered when a new model registers',
      config: {
        triggerType: 'registration',
        triggerSource: 'models.created_at',
        filters: []
      }
    }
  }
];

const initialEdges: Edge[] = [];

function WorkflowBuilderInner() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('id');

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowType, setWorkflowType] = useState<'system' | 'user'>('user');
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  // Load workflow if ID is provided in URL
  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    }
  }, [workflowId]);

  // Warn user about unsaved changes when leaving the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadWorkflow = async (id: string) => {
    setIsLoading(true);
    try {
      const workflowData = await WorkflowClientService.loadWorkflow(id);

      // Set workflow metadata
      setWorkflowName(workflowData.name);
      setWorkflowDescription(workflowData.description);
      setWorkflowType(workflowData.type);
      setCurrentWorkflowId(workflowData.id);

      // Set ReactFlow nodes and edges
      setNodes(workflowData.reactflowDefinition.nodes);
      setEdges(workflowData.reactflowDefinition.edges);

      toast({
        title: "Workflow Loaded",
        description: `"${workflowData.name}" loaded successfully for editing.`,
      });

      // Clear unsaved changes flag since we just loaded
      setHasUnsavedChanges(false);

    } catch (error) {
      console.error('Error loading workflow:', error);
      toast({
        title: "Error",
        description: "Failed to load workflow. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToWorkflows = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = confirm(
        "You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
      );
      if (!confirmLeave) {
        return;
      }
    }
    // Navigate back to workflow management dashboard
    window.location.href = '/admin/workflows/manage';
  };

  const onConnect: OnConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge({
        ...params,
        type: 'bezier',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' }
      }, eds));
      setHasUnsavedChanges(true);
    },
    [setEdges]
  );

  // Enhanced node change handler with unsaved changes tracking
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    // Only mark as unsaved if it's a position change or content change
    const hasContentChanges = changes.some((change: any) => 
      change.type === 'position' || 
      change.type === 'add' || 
      change.type === 'remove' ||
      change.type === 'replace'
    );
    if (hasContentChanges) {
      setHasUnsavedChanges(true);
    }
  }, [onNodesChange]);

  // Enhanced edge change handler with unsaved changes tracking
  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
    const hasContentChanges = changes.some((change: any) => 
      change.type === 'add' || 
      change.type === 'remove' ||
      change.type === 'replace'
    );
    if (hasContentChanges) {
      setHasUnsavedChanges(true);
    }
  }, [onEdgesChange]);

  useOnSelectionChange({
    onChange: ({ nodes: selectedNodes }) => {
      if (selectedNodes.length === 1) {
        setSelectedNode(selectedNodes[0]);
      } else {
        setSelectedNode(null);
      }
    },
  });

  const addNode = useCallback((nodeType: string, position?: { x: number; y: number }) => {
    const newNode: Node = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position: position || { x: Math.random() * 400 + 200, y: Math.random() * 300 + 200 },
      data: getDefaultNodeData(nodeType)
    };
    setNodes((nds) => [...nds, newNode]);
    setHasUnsavedChanges(true);
  }, [setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = (event.target as Element).closest('.react-flow')?.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');

    if (typeof type === 'undefined' || !type || !reactFlowBounds) {
      return;
    }

    const position = {
      x: event.clientX - reactFlowBounds.left - 90, // Center the node
      y: event.clientY - reactFlowBounds.top - 30,
    };

    addNode(type, position);
  }, [addNode]);

  const updateNode = useCallback((nodeId: string, data: Partial<WorkflowNodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      )
    );
    setHasUnsavedChanges(true);
  }, [setNodes]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
    setHasUnsavedChanges(true);
  }, [setNodes, setEdges]);

  const duplicateNode = useCallback((nodeId: string) => {
    const nodeToDuplicate = nodes.find(node => node.id === nodeId);
    if (nodeToDuplicate) {
      const newNode: Node = {
        ...nodeToDuplicate,
        id: `${nodeToDuplicate.type}-${Date.now()}`,
        position: {
          x: nodeToDuplicate.position.x + 50,
          y: nodeToDuplicate.position.y + 50
        }
      };
      setNodes((nds) => [...nds, newNode]);
    }
  }, [nodes, setNodes]);

  const saveWorkflow = useCallback(async () => {
    if (!workflowName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a workflow name",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (currentWorkflowId) {
        // Update existing workflow
        await WorkflowClientService.updateWorkflow(currentWorkflowId, {
          name: workflowName,
          description: workflowDescription || `Workflow with ${nodes.length} nodes and ${edges.length} connections`,
          nodes,
          edges,
          category: 'general',
          tags: [],
        });

        toast({
          title: "Success",
          description: `Workflow "${workflowName}" updated successfully`,
        });
      } else {
        // Create new workflow - this would need a create endpoint
        // For now, we'll show a message that this needs to be implemented
        toast({
          title: "Info",
          description: "Creating new workflows is not yet implemented. Please edit existing workflows for now.",
          variant: "default",
        });
        return;
      }

      // Clear unsaved changes flag
      setHasUnsavedChanges(false);
      console.log('Workflow saved:', currentWorkflowId);
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast({
        title: "Error",
        description: "Failed to save workflow. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [workflowName, workflowDescription, nodes, edges, currentWorkflowId, toast]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
                <WorkflowHeader
            workflowName={workflowName}
            onWorkflowNameChange={setWorkflowName}
            onShowTemplates={() => setShowTemplates(true)}
            onSaveWorkflow={saveWorkflow}
            nodeCount={nodes.length}
            isSaving={isSaving}
            isLoading={isLoading}
            workflowType={workflowType}
            workflowDescription={workflowDescription}
            currentWorkflowId={currentWorkflowId}
            onBack={handleBackToWorkflows}
            hasUnsavedChanges={hasUnsavedChanges}
          />

      <div className="flex-1 flex">
        {/* Node Palette */}
        <NodePalette onAddNode={addNode} />

        {/* Main Canvas */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-sm text-gray-600">Loading workflow...</p>
              </div>
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.Bezier}
            fitView
            fitViewOptions={{
              padding: 0.3,
              maxZoom: 0.8,
              minZoom: 0.3
            }}
            className="bg-gray-100"
            defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
            minZoom={0.1}
            maxZoom={1.5}
            snapToGrid
            snapGrid={[20, 20]}
          >
            <Background color="#e5e7eb" gap={15} />
            <Controls className="!bg-white !border !border-gray-200 !shadow-lg" />
            <MiniMap 
              className="!bg-white !border !border-gray-200 !shadow-lg"
              nodeColor={(node) => {
                switch (node.type) {
                  case 'start': return '#10b981';
                  case 'approval': return '#3b82f6';
                  case 'decision': return '#f59e0b';
                  case 'email': return '#8b5cf6';
                  case 'wait': return '#06b6d4';
                  case 'webhook': return '#ef4444';
                  case 'updateRecord': return '#84cc16';
                  case 'end': return '#6b7280';
                  default: return '#6b7280';
                }
              }}
            />
          </ReactFlow>
        </div>

        {/* Node Editor Sidebar */}
        {selectedNode && (
          <NodeEditor
            node={selectedNode}
            onUpdateNode={updateNode}
            onDeleteNode={deleteNode}
            onDuplicateNode={duplicateNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>

      {/* Template Library Modal */}
      {showTemplates && (
        <TemplateLibrary
          onClose={() => setShowTemplates(false)}
          onSelectTemplate={(template) => {
            setNodes(template.nodes);
            setEdges(template.edges);
            setWorkflowName(template.name);
            setShowTemplates(false);
          }}
        />
      )}
    </div>
  );
}

function getDefaultNodeData(nodeType: string): WorkflowNodeData {
  const baseData = {
    label: '',
    description: '',
    conditions: [],
    actions: [],
    config: {}
  };

  switch (nodeType) {
    case 'start':
      return {
        ...baseData,
        label: 'Start Workflow',
        description: 'Workflow trigger point',
        config: {
          triggerType: 'manual',
          triggerSource: '',
          filters: []
        }
      };
    case 'approval':
      return {
        ...baseData,
        label: 'Approval Required',
        description: 'Manual review and approval',
        config: {
          assignedRoles: [],
          taskMessage: 'Please review and approve',
          timeoutDuration: 24,
          timeoutUnit: 'hours',
          autoDecision: 'none'
        }
      };
    case 'wait':
      return {
        ...baseData,
        label: 'Wait',
        description: 'Pause workflow execution',
        config: {
          waitType: 'duration',
          duration: 1,
          durationUnit: 'days',
          condition: null
        }
      };
    case 'decision':
      return {
        ...baseData,
        label: 'Decision',
        description: 'Conditional branching',
        config: {
          branches: [
            { label: 'Yes', conditions: [] },
            { label: 'No', conditions: [] }
          ]
        }
      };
    case 'email':
      return {
        ...baseData,
        label: 'Send Email',
        description: 'Send notification email',
        config: {
          template: '',
          recipientField: 'email',
          subject: '',
          dynamicData: {}
        }
      };
    case 'updateRecord':
      return {
        ...baseData,
        label: 'Update Record',
        description: 'Modify database record',
        config: {
          table: '',
          field: '',
          value: '',
          valueType: 'static'
        }
      };
    case 'webhook':
      return {
        ...baseData,
        label: 'Webhook',
        description: 'Call external API',
        config: {
          url: '',
          method: 'POST',
          headers: {},
          payload: {},
          authentication: 'none'
        }
      };
    case 'end':
      return {
        ...baseData,
        label: 'End Workflow',
        description: 'Workflow completion',
        config: {
          status: 'completed',
          message: 'Workflow completed successfully'
        }
      };
    default:
      return baseData;
  }
}

export default function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner />
    </ReactFlowProvider>
  );
}