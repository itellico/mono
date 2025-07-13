'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Workflow, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Square,
  Search,
  Filter,
  Download,
  Upload,
  Zap,
  GitBranch,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  MoreHorizontal,
  Eye,
  Star,
  Copy,
  Settings,
  Mail,
  Database,
  Globe,
  ArrowRight,
  ArrowDown,
  Diamond,
  Circle,
  Pause,
  RotateCcw,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  workflowType: 'approval' | 'automation' | 'integration' | 'notification';
  status: 'draft' | 'active' | 'deprecated';
  version: number;
  definition: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  triggers: WorkflowTrigger[];
  statistics: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
  };
  createdBy: string;
  createdAt: string;
  lastModified: string;
  isTemplate: boolean;
}

interface WorkflowNode {
  id: string;
  type: 'start' | 'decision' | 'approval' | 'email' | 'wait' | 'update' | 'webhook' | 'end';
  position: { x: number; y: number };
  data: {
    label: string;
    config: any;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type: 'default' | 'conditional';
  data?: {
    condition?: string;
    label?: string;
  };
}

interface WorkflowTrigger {
  id: string;
  type: 'manual' | 'scheduled' | 'event' | 'webhook';
  config: any;
  isActive: boolean;
}

interface WorkflowExecution {
  id: string;
  workflowDefinitionId: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  inputData: any;
  outputData?: any;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  currentStep?: string;
  progress: number;
}

// Mock data
const mockWorkflowDefinitions: WorkflowDefinition[] = [
  {
    id: '1',
    name: 'Application Approval Workflow',
    description: 'Automated approval process for model applications',
    workflowType: 'approval',
    status: 'active',
    version: 2,
    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 100, y: 100 },
          data: { label: 'Application Submitted', config: {} }
        },
        {
          id: 'review',
          type: 'approval',
          position: { x: 300, y: 100 },
          data: { label: 'Manager Review', config: { approvers: ['manager'], timeout: 48 } }
        },
        {
          id: 'notify',
          type: 'email',
          position: { x: 500, y: 100 },
          data: { label: 'Send Notification', config: { template: 'application-status' } }
        },
        {
          id: 'end',
          type: 'end',
          position: { x: 700, y: 100 },
          data: { label: 'Complete', config: {} }
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'review', type: 'default' },
        { id: 'e2', source: 'review', target: 'notify', type: 'default' },
        { id: 'e3', source: 'notify', target: 'end', type: 'default' }
      ]
    },
    triggers: [
      {
        id: 't1',
        type: 'event',
        config: { event: 'application.submitted' },
        isActive: true
      }
    ],
    statistics: {
      totalExecutions: 156,
      successfulExecutions: 142,
      failedExecutions: 14,
      averageExecutionTime: 3600000 // 1 hour in ms
    },
    createdBy: 'John Doe',
    createdAt: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-15T10:30:00Z',
    isTemplate: false
  },
  {
    id: '2',
    name: 'New User Onboarding',
    description: 'Welcome sequence for new users',
    workflowType: 'automation',
    status: 'active',
    version: 1,
    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 100, y: 100 },
          data: { label: 'User Registered', config: {} }
        },
        {
          id: 'welcome',
          type: 'email',
          position: { x: 300, y: 100 },
          data: { label: 'Send Welcome Email', config: { template: 'welcome' } }
        },
        {
          id: 'wait',
          type: 'wait',
          position: { x: 500, y: 100 },
          data: { label: 'Wait 1 Day', config: { duration: 86400000 } }
        },
        {
          id: 'follow-up',
          type: 'email',
          position: { x: 700, y: 100 },
          data: { label: 'Follow-up Email', config: { template: 'onboarding-tips' } }
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'welcome', type: 'default' },
        { id: 'e2', source: 'welcome', target: 'wait', type: 'default' },
        { id: 'e3', source: 'wait', target: 'follow-up', type: 'default' }
      ]
    },
    triggers: [
      {
        id: 't1',
        type: 'event',
        config: { event: 'user.created' },
        isActive: true
      }
    ],
    statistics: {
      totalExecutions: 89,
      successfulExecutions: 85,
      failedExecutions: 4,
      averageExecutionTime: 172800000 // 2 days
    },
    createdBy: 'Sarah Wilson',
    createdAt: '2024-01-10T00:00:00Z',
    lastModified: '2024-01-18T14:20:00Z',
    isTemplate: false
  },
  {
    id: '3',
    name: 'Weekly Report Generation',
    description: 'Automated weekly analytics reports',
    workflowType: 'automation',
    status: 'draft',
    version: 1,
    definition: {
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 100, y: 100 },
          data: { label: 'Weekly Trigger', config: {} }
        },
        {
          id: 'generate',
          type: 'update',
          position: { x: 300, y: 100 },
          data: { label: 'Generate Report', config: { action: 'generateReport' } }
        },
        {
          id: 'email',
          type: 'email',
          position: { x: 500, y: 100 },
          data: { label: 'Email Report', config: { template: 'weekly-report' } }
        }
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'generate', type: 'default' },
        { id: 'e2', source: 'generate', target: 'email', type: 'default' }
      ]
    },
    triggers: [
      {
        id: 't1',
        type: 'scheduled',
        config: { cron: '0 9 * * 1' }, // Every Monday at 9 AM
        isActive: false
      }
    ],
    statistics: {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0
    },
    createdBy: 'Mike Johnson',
    createdAt: '2024-01-20T00:00:00Z',
    lastModified: '2024-01-20T00:00:00Z',
    isTemplate: false
  }
];

const mockWorkflowExecutions: WorkflowExecution[] = [
  {
    id: 'exec-1',
    workflowDefinitionId: '1',
    workflowId: 'wf-abc123',
    status: 'running',
    inputData: { applicationId: 'app-456', userId: 'user-789' },
    startedAt: '2024-01-20T10:00:00Z',
    currentStep: 'review',
    progress: 50
  },
  {
    id: 'exec-2',
    workflowDefinitionId: '1',
    workflowId: 'wf-def456',
    status: 'completed',
    inputData: { applicationId: 'app-123', userId: 'user-456' },
    outputData: { status: 'approved', notificationSent: true },
    startedAt: '2024-01-20T08:00:00Z',
    completedAt: '2024-01-20T09:30:00Z',
    progress: 100
  },
  {
    id: 'exec-3',
    workflowDefinitionId: '2',
    workflowId: 'wf-ghi789',
    status: 'failed',
    inputData: { userId: 'user-999' },
    startedAt: '2024-01-19T15:00:00Z',
    completedAt: '2024-01-19T15:05:00Z',
    errorMessage: 'Email delivery failed',
    progress: 25
  }
];

// API Functions
async function fetchWorkflowDefinitions(): Promise<WorkflowDefinition[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockWorkflowDefinitions), 500);
  });
}

async function fetchWorkflowExecutions(): Promise<WorkflowExecution[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockWorkflowExecutions), 500);
  });
}

async function createWorkflow(workflow: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      ...workflow,
      id: Date.now().toString(),
      version: 1,
      statistics: { totalExecutions: 0, successfulExecutions: 0, failedExecutions: 0, averageExecutionTime: 0 },
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      createdBy: 'Current User'
    } as WorkflowDefinition), 500);
  });
}

async function executeWorkflow(workflowId: string, inputData: any): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 1000);
  });
}

function getNodeIcon(type: string) {
  switch (type) {
    case 'start': return <Circle className="h-4 w-4 text-green-500" />;
    case 'decision': return <Diamond className="h-4 w-4 text-blue-500" />;
    case 'approval': return <Users className="h-4 w-4 text-purple-500" />;
    case 'email': return <Mail className="h-4 w-4 text-orange-500" />;
    case 'wait': return <Clock className="h-4 w-4 text-gray-500" />;
    case 'update': return <Database className="h-4 w-4 text-indigo-500" />;
    case 'webhook': return <Globe className="h-4 w-4 text-teal-500" />;
    case 'end': return <CheckCircle className="h-4 w-4 text-red-500" />;
    default: return <Circle className="h-4 w-4" />;
  }
}

function getWorkflowTypeIcon(type: string) {
  switch (type) {
    case 'approval': return <Users className="h-4 w-4 text-purple-500" />;
    case 'automation': return <Zap className="h-4 w-4 text-blue-500" />;
    case 'integration': return <Globe className="h-4 w-4 text-green-500" />;
    case 'notification': return <Mail className="h-4 w-4 text-orange-500" />;
    default: return <Workflow className="h-4 w-4" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge variant="default">Active</Badge>;
    case 'draft':
      return <Badge variant="secondary">Draft</Badge>;
    case 'deprecated':
      return <Badge variant="destructive">Deprecated</Badge>;
    case 'running':
      return <Badge variant="default" className="bg-blue-500">Running</Badge>;
    case 'completed':
      return <Badge variant="default" className="bg-green-500">Completed</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    case 'cancelled':
      return <Badge variant="secondary">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function WorkflowsClientPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('workflows');
  const [previewWorkflow, setPreviewWorkflow] = useState<WorkflowDefinition | null>(null);

  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    workflowType: 'approval' as const,
    status: 'draft' as const
  });

  // Queries
  const { data: workflows, isLoading: loadingWorkflows } = useQuery({
    queryKey: ['workflow-definitions'],
    queryFn: fetchWorkflowDefinitions,
  });

  const { data: executions, isLoading: loadingExecutions } = useQuery({
    queryKey: ['workflow-executions'],
    queryFn: fetchWorkflowExecutions,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-definitions'] });
      setCreateDialogOpen(false);
      setNewWorkflow({
        name: '',
        description: '',
        workflowType: 'approval',
        status: 'draft'
      });
      toast.success('Workflow created successfully');
    },
    onError: () => {
      toast.error('Failed to create workflow');
    },
  });

  const executeMutation = useMutation({
    mutationFn: ({ workflowId, inputData }: { workflowId: string; inputData: any }) =>
      executeWorkflow(workflowId, inputData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-executions'] });
      toast.success('Workflow execution started');
    },
    onError: () => {
      toast.error('Failed to execute workflow');
    },
  });

  const handleCreateWorkflow = () => {
    createMutation.mutate(newWorkflow);
  };

  const handleExecuteWorkflow = (workflowId: string) => {
    executeMutation.mutate({ workflowId, inputData: {} });
  };

  const filteredWorkflows = workflows?.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || workflow.workflowType === selectedType;
    const matchesStatus = !selectedStatus || workflow.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const totalExecutions = workflows?.reduce((sum, w) => sum + w.statistics.totalExecutions, 0) || 0;
  const successRate = workflows?.reduce((sum, w) => sum + w.statistics.successfulExecutions, 0) / Math.max(totalExecutions, 1) * 100 || 0;
  const activeWorkflows = workflows?.filter(w => w.status === 'active').length || 0;

  if (loadingWorkflows) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">
            Automate business processes with visual workflow builder
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Workflow</DialogTitle>
                <DialogDescription>
                  Start building a new automated workflow
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Workflow Name</Label>
                  <Input
                    id="name"
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                    placeholder="Application Approval Process"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                    placeholder="Describe what this workflow does"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Workflow Type</Label>
                  <Select
                    value={newWorkflow.workflowType}
                    onValueChange={(value: any) => setNewWorkflow({ ...newWorkflow, workflowType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approval">Approval Process</SelectItem>
                      <SelectItem value="automation">Automation</SelectItem>
                      <SelectItem value="integration">Integration</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateWorkflow} disabled={createMutation.isPending}>
                    Create & Edit
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              {workflows?.length || 0} total workflows
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExecutions}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(successRate)}%</div>
            <p className="text-xs text-muted-foreground">
              Average success rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Now</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executions?.filter(e => e.status === 'running').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently executing
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="approval">Approval</SelectItem>
                <SelectItem value="automation">Automation</SelectItem>
                <SelectItem value="integration">Integration</SelectItem>
                <SelectItem value="notification">Notification</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Workflows Grid */}
          {filteredWorkflows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getWorkflowTypeIcon(workflow.workflowType)}
                        <div>
                          <CardTitle className="text-lg">{workflow.name}</CardTitle>
                          <CardDescription>{workflow.description}</CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Workflow
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPreviewWorkflow(workflow)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleExecuteWorkflow(workflow.id)}>
                            <Play className="h-4 w-4 mr-2" />
                            Execute Now
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(workflow.status)}
                      <Badge variant="outline" className="capitalize">
                        v{workflow.version}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Workflow Steps</h4>
                      <div className="flex items-center gap-1">
                        {workflow.definition.nodes.slice(0, 4).map((node, index) => (
                          <React.Fragment key={node.id}>
                            <div className="flex items-center gap-1" title={node.data.label}>
                              {getNodeIcon(node.type)}
                            </div>
                            {index < Math.min(workflow.definition.nodes.length - 1, 3) && (
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            )}
                          </React.Fragment>
                        ))}
                        {workflow.definition.nodes.length > 4 && (
                          <span className="text-xs text-muted-foreground">
                            +{workflow.definition.nodes.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium">{workflow.statistics.totalExecutions}</div>
                        <div className="text-muted-foreground">Executions</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">
                          {Math.round((workflow.statistics.successfulExecutions / Math.max(workflow.statistics.totalExecutions, 1)) * 100)}%
                        </div>
                        <div className="text-muted-foreground">Success</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">
                          {Math.round(workflow.statistics.averageExecutionTime / 60000)}m
                        </div>
                        <div className="text-muted-foreground">Avg Time</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => handleExecuteWorkflow(workflow.id)}>
                        <Play className="h-4 w-4 mr-1" />
                        Run
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No workflows found"
              description="Create your first workflow to automate business processes"
              action={
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>
                Monitor workflow execution status and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {executions && executions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workflow</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executions.map((execution) => {
                      const workflow = workflows?.find(w => w.id === execution.workflowDefinitionId);
                      const duration = execution.completedAt ? 
                        new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime() :
                        Date.now() - new Date(execution.startedAt).getTime();
                      
                      return (
                        <TableRow key={execution.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{workflow?.name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">
                                {execution.workflowId}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(execution.status)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>{execution.progress}%</span>
                                {execution.currentStep && (
                                  <span className="text-muted-foreground">
                                    {execution.currentStep}
                                  </span>
                                )}
                              </div>
                              <div className="w-full bg-muted rounded-full h-1">
                                <div 
                                  className="bg-primary h-1 rounded-full transition-all"
                                  style={{ width: `${execution.progress}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(execution.startedAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {Math.round(duration / 60000)}m
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {execution.status === 'running' && (
                                  <DropdownMenuItem>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Cancel
                                  </DropdownMenuItem>
                                )}
                                {execution.status === 'failed' && (
                                  <DropdownMenuItem>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Retry
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  title="No executions found"
                  description="Workflow executions will appear here"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Templates</CardTitle>
              <CardDescription>
                Get started quickly with pre-built workflow templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: 'Application Review Process',
                    description: 'Multi-stage approval workflow for applications',
                    type: 'approval',
                    complexity: 'Medium'
                  },
                  {
                    name: 'New User Onboarding',
                    description: 'Welcome email sequence for new users',
                    type: 'automation',
                    complexity: 'Simple'
                  },
                  {
                    name: 'Payment Processing',
                    description: 'Handle payment confirmations and failures',
                    type: 'integration',
                    complexity: 'Advanced'
                  },
                  {
                    name: 'Content Moderation',
                    description: 'Automated content review and approval',
                    type: 'approval',
                    complexity: 'Medium'
                  }
                ].map((template, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          {getWorkflowTypeIcon(template.type)}
                          <Badge variant="outline" className="text-xs">
                            {template.complexity}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                        <Button size="sm" className="w-full">
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Workflow Preview Dialog */}
      {previewWorkflow && (
        <Dialog open={!!previewWorkflow} onOpenChange={() => setPreviewWorkflow(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{previewWorkflow.name}</DialogTitle>
              <DialogDescription>
                {previewWorkflow.description}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <Workflow className="h-4 w-4" />
                <AlertDescription>
                  This is a simplified preview. Use the workflow editor for detailed visualization and editing.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Workflow Steps</h4>
                  <div className="space-y-2">
                    {previewWorkflow.definition.nodes.map((node, index) => (
                      <div key={node.id} className="flex items-center gap-2 p-2 border rounded">
                        {getNodeIcon(node.type)}
                        <span className="text-sm">{node.data.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Executions:</span>
                      <span>{previewWorkflow.statistics.totalExecutions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span>
                        {Math.round((previewWorkflow.statistics.successfulExecutions / Math.max(previewWorkflow.statistics.totalExecutions, 1)) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Duration:</span>
                      <span>{Math.round(previewWorkflow.statistics.averageExecutionTime / 60000)}m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}