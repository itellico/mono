'use client';

import React, { useState, useEffect } from 'react';
import { useAuditTracking, usePageTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Play, 
  Edit, 
  Plus, 
  Search, 
  Activity, 
  Shield,
  BarChart3,
  Monitor,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
  Copy,
  Pause,
  Square
} from 'lucide-react';

// Types
interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  type: 'system' | 'user';
  category: string;
  status: 'active' | 'inactive' | 'draft';
  lastModified: string;
  createdBy: string;
  executionCount: number;
  successRate: number;
  isProtected: boolean;
  temporalWorkflowId?: string;
  currentStatus?: 'running' | 'completed' | 'failed' | 'cancelled';
}

/**
 * Workflow Management Dashboard
 * 
 * Comprehensive dashboard for managing system and user workflows with:
 * - Overview statistics and health monitoring
 * - Workflow listing with filtering and search
 * - Real-time status monitoring via Temporal integration
 * - Administrative controls with protection for system workflows
 * 
 * @component
 * @example
 * <WorkflowManagementPage />
 */
export default function WorkflowManagementPage() {
  const { trackView } = useAuditTracking();
  usePageTracking('workflow_management_dashboard');

  const [activeTab, setActiveTab] = useState('overview');
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'system' | 'user'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'draft'>('all');

  const { toast } = useToast();

  // Track page view
  useEffect(() => {
    trackView('workflow_management_dashboard');
    browserLogger.userAction('view_workflow_management', JSON.stringify({
      timestamp: new Date().toISOString(),
      page: 'workflow_management_dashboard'
    }));
  }, [trackView]);

  // Load workflows on mount
  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setIsLoading(true);
    try {
      // Call the API to get actual workflow data
      const response = await fetch('/api/v1/workflows/manage', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load workflows');
      }

      const workflowData = result.data.workflows as WorkflowSummary[];
      setWorkflows(workflowData);

      browserLogger.userAction('workflow_data_loaded', JSON.stringify({
        workflowCount: workflowData.length,
        systemWorkflows: workflowData.filter(w => w.type === 'system').length,
        userWorkflows: workflowData.filter(w => w.type === 'user').length
      }));

    } catch (error) {
      browserLogger.error('Failed to load workflows', { error });
      toast({
        title: "Error",
        description: "Failed to load workflows. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter workflows based on search and filters
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || workflow.type === filterType;
    const matchesStatus = filterStatus === 'all' || workflow.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreateWorkflow = async (type: 'system' | 'user') => {
    browserLogger.userAction('create_workflow_initiated', JSON.stringify({ type }));

    // Redirect to workflow editor for creation
    window.open('/admin/workflows', '_blank');
  };

  const handleExecuteWorkflow = async (workflow: WorkflowSummary) => {
    try {
      browserLogger.userAction('workflow_execution_started', JSON.stringify({
        workflowId: workflow.id,
        workflowName: workflow.name,
        type: workflow.type
      }));

      // In production, this would call the ReactFlowTemporalBridge
      toast({
        title: "Workflow Started",
        description: `"${workflow.name}" has been started successfully.`,
      });

      // Update workflow status
      setWorkflows(prev => prev.map(w => 
        w.id === workflow.id 
          ? { ...w, currentStatus: 'running' as const }
          : w
      ));

    } catch (error) {
      browserLogger.error('Failed to execute workflow', { 
        workflowId: workflow.id, 
        error 
      });

      toast({
        title: "Error",
        description: `Failed to start workflow "${workflow.name}".`,
        variant: "destructive",
      });
    }
  };

  const handleEditWorkflow = async (workflow: WorkflowSummary) => {
    try {
      browserLogger.userAction('workflow_edit_requested', JSON.stringify({
        workflowId: workflow.id,
        workflowName: workflow.name,
        type: workflow.type
      }));

      // Navigate to workflow editor with the workflow ID (same page)
      window.location.href = `/admin/workflows?id=${workflow.id}`;

    } catch (error) {
      browserLogger.error('Failed to open workflow editor', { 
        workflowId: workflow.id, 
        error 
      });

      toast({
        title: "Error",
        description: `Failed to open workflow editor for "${workflow.name}".`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteWorkflow = async (workflow: WorkflowSummary) => {
    if (workflow.isProtected) {
      toast({
        title: "Protected Workflow",
        description: "This system workflow cannot be deleted.",
        variant: "destructive",
      });
      return;
    }

    try {
      browserLogger.userAction('workflow_deleted', JSON.stringify({
        workflowId: workflow.id,
        workflowName: workflow.name,
        type: workflow.type
      }));

      setWorkflows(prev => prev.filter(w => w.id !== workflow.id));

      toast({
        title: "Workflow Deleted",
        description: `"${workflow.name}" has been deleted.`,
      });

    } catch (error) {
      browserLogger.error('Failed to delete workflow', { 
        workflowId: workflow.id, 
        error 
      });

      toast({
        title: "Error",
        description: `Failed to delete workflow "${workflow.name}".`,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const systemWorkflows = workflows.filter(w => w.type === 'system');
  const userWorkflows = workflows.filter(w => w.type === 'user');
  const runningWorkflows = workflows.filter(w => w.currentStatus === 'running');
  const avgSuccessRate = workflows.length > 0 
    ? workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Management</h1>
          <p className="text-muted-foreground">
            Manage system and user workflows with real-time monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => handleCreateWorkflow('user')}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
          <Button variant="outline" onClick={() => window.open('/admin/workflows', '_blank')}>
            <Edit className="mr-2 h-4 w-4" />
            Workflow Editor
          </Button>
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Workflows</span>
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center space-x-2">
            <Monitor className="h-4 w-4" />
            <span>Status</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>System</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workflows.length}</div>
                <p className="text-xs text-muted-foreground">
                  {systemWorkflows.length} system, {userWorkflows.length} user
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Currently Running</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{runningWorkflows.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active executions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Average across all workflows
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Protected Workflows</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {workflows.filter(w => w.isProtected).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  System-critical workflows
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Latest workflow executions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.slice(0, 5).map((workflow) => (
                  <div key={workflow.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                    {getStatusIcon(workflow.currentStatus)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{workflow.name}</span>
                        <Badge variant={workflow.type === 'system' ? 'default' : 'secondary'}>
                          {workflow.type}
                        </Badge>
                        {workflow.isProtected && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            <Shield className="h-3 w-3 mr-1" />
                            Protected
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {workflow.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {workflow.successRate}% success
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {workflow.executionCount} runs
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Management</CardTitle>
              <CardDescription>
                Search, filter, and manage all workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search workflows..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Workflow List */}
              <div className="space-y-4">
                {filteredWorkflows.map((workflow) => (
                  <div key={workflow.id} className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                    {getStatusIcon(workflow.currentStatus)}

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{workflow.name}</span>
                        <Badge variant={workflow.type === 'system' ? 'default' : 'secondary'}>
                          {workflow.type}
                        </Badge>
                        <Badge variant="outline" className={
                          workflow.status === 'active' ? 'text-green-600 border-green-600' :
                          workflow.status === 'inactive' ? 'text-red-600 border-red-600' :
                          'text-yellow-600 border-yellow-600'
                        }>
                          {workflow.status}
                        </Badge>
                        {workflow.isProtected && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            <Shield className="h-3 w-3 mr-1" />
                            Protected
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {workflow.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Category: {workflow.category}</span>
                        <span>Created by: {workflow.createdBy}</span>
                        <span>Executions: {workflow.executionCount}</span>
                        <span>Success Rate: {workflow.successRate}%</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleExecuteWorkflow(workflow)}
                        disabled={workflow.status !== 'active'}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Run
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditWorkflow(workflow)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Clone
                      </Button>

                      {!workflow.isProtected && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteWorkflow(workflow)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {filteredWorkflows.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No workflows found matching your criteria.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="h-5 w-5" />
                <span>Real-Time Workflow Status</span>
              </CardTitle>
              <CardDescription>
                Monitor active workflow executions via Temporal integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {runningWorkflows.length > 0 ? (
                  runningWorkflows.map((workflow) => (
                    <div key={workflow.id} className="flex items-center space-x-4 p-3 rounded-lg border border-blue-200 bg-blue-50">
                      <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{workflow.name}</span>
                          <Badge className="bg-blue-100 text-blue-800">Running</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Temporal Workflow ID: {workflow.temporalWorkflowId || 'Generated at runtime'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Square className="h-4 w-4 mr-1" />
                          Stop
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No workflows are currently running.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>System Workflow Protection</span>
              </CardTitle>
              <CardDescription>
                Critical system workflows with deletion protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemWorkflows.map((workflow) => (
                  <div key={workflow.id} className="flex items-center space-x-4 p-4 rounded-lg border border-orange-200 bg-orange-50">
                    <Shield className="h-5 w-5 text-orange-600" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{workflow.name}</span>
                        <Badge className="bg-orange-100 text-orange-800">System Protected</Badge>
                        <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                          {workflow.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {workflow.description}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Category: {workflow.category} • Success Rate: {workflow.successRate}% • Executions: {workflow.executionCount}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        disabled={workflow.status !== 'active'}
                        onClick={() => handleExecuteWorkflow(workflow)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Execute
                      </Button>
                      <Button size="sm" variant="outline" disabled>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Protected
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">System Workflow Protection</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      System workflows are protected from deletion and unauthorized modifications. 
                      These workflows are essential for platform operations including backups, 
                      user onboarding, and content moderation. Changes require super admin privileges.
                    </p>
                  </div>
                </div>
              </div>

              {/* System Workflow Creation for Backup */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Create System Workflow</CardTitle>
                  <CardDescription>
                    Set up critical system workflows like the backup workflow
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      onClick={() => handleCreateWorkflow('system')}
                      className="w-full"
                      variant="outline"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Create Backup Workflow
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Creates a protected system workflow for automated database backups with Temporal integration.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 