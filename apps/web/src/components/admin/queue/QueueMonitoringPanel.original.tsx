'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger} from '@/components/ui/dialog';
import { 
  RefreshCw, 
  Clock, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Trash2,
  Settings,
  Timer,
  Archive,
  List,
  Activity,
  Power,
  RotateCcw,
  Square,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCircuitBreaker } from '@/hooks/useCircuitBreaker';
import HousekeepingPanel from './HousekeepingPanel';
interface QueueStats {
  name: string;
  displayName: string;
  description: string;
  totalJobs: number;
  pending: number;
  active: number;
  completed: number;
  failed: number;
}
interface RecentJob {
  id: string;
  name: string;
  state: string;
  priority: number;
  createdOn: Date;
  startedOn?: Date;
  completedOn?: Date;
  duration?: number;
  data?: any;
  output?: any;
}
interface QueueData {
  queues: QueueStats[];
  recentJobs: RecentJob[];
  workerStatus: {
    isRunning: boolean;
    lastHeartbeat: Date;
    totalWorkers: number;
    activeWorkers: number;
  };
  lastUpdated: Date;
}
interface WorkerConfiguration {
  enabled: boolean;
  maxRetries: number;
  // Add other worker config properties as needed
}
export function QueueMonitoringPanel() {
  const [controlLoading, setControlLoading] = useState<string | null>(null);
  const [reprocessing, setReprocessing] = useState<string | null>(null);
  const [emptyingQueue, setEmptyingQueue] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedJob, setSelectedJob] = useState<RecentJob | null>(null);
  const [jobsPage, setJobsPage] = useState(1);
    const [archivePage, setArchivePage] = useState(1);
  const [workerToggleLoading, setWorkerToggleLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const jobsPerPage = 10;
  // ✅ Circuit Breaker for API failures - prevents cascade failures
  const circuitBreaker = useCircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 30000,
    redirectOnFailure: true,
    redirectUrl: '/admin/maintenance'
  });
  // ✅ FIX: Enhanced React Query for queue stats with circuit breaker
  const { 
    data: queueData, 
    isLoading, 
    error: statsError,
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['queue-stats'],
    queryFn: async (): Promise<QueueData> => {
      return circuitBreaker.executeWithCircuitBreaker(async () => {
        const response = await fetch('/api/admin/queue/stats');
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch queue statistics');
        }
        return result.data;
      });
    },
    retry: (failureCount, error) => {
      // Stop retrying after 3 failures to prevent overwhelming the server
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: (query) => {
      // Stop auto-refetch if there are errors or circuit is open
      const hasError = query?.state?.error;
      return (hasError || circuitBreaker.state === 'OPEN') ? false : 5000;
    },
    staleTime: 1000,
  });
  // ✅ FIX: Use React Query for worker configurations
  const { 
    data: workerConfigurations = {},
    refetch: refetchWorkerConfigs 
  } = useQuery({
    queryKey: ['worker-configurations'],
    queryFn: async (): Promise<Record<string, WorkerConfiguration>> => {
      const response = await fetch('/api/admin/queue/worker-control');
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch worker configurations');
      }
      return result.data.workers;
    },
    refetchInterval: 5000, // Auto-refresh with stats
  });
  // ✅ FIX: Use React Query mutations for worker control
  const workerControlMutation = useMutation({
    mutationFn: async (action: 'start' | 'stop' | 'restart') => {
      const response = await fetch('/api/admin/queue/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || `Failed to ${action} workers`);
      }
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: 'Worker Control',
        description: data.data.message,
        variant: 'default'
      });
      // Refresh data after control action
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
        queryClient.invalidateQueries({ queryKey: ['worker-configurations'] });
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: 'Worker Control Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  });
  // ✅ FIX: Use React Query mutation for reprocess
  const reprocessMutation = useMutation({
    mutationFn: async (queueName: string) => {
      const response = await fetch('/api/admin/queue/reprocess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ queueName })
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Reprocessing failed');
      }
      return { queueName, result };
    },
    onSuccess: ({ queueName }) => {
      toast({
        title: 'Reprocessing Started',
        description: `Reprocessing started for ${queueName} queue.`,
        variant: 'default'
      });
      // Refresh stats after reprocessing
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: 'Reprocessing Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  });
  // ✅ FIX: Use React Query mutation for empty queue
  const emptyQueueMutation = useMutation({
    mutationFn: async (queueName: string) => {
      const response = await fetch('/api/admin/queue/empty', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ queue: queueName })
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to empty queue');
      }
      return { queueName, result };
    },
    onSuccess: ({ queueName }) => {
      toast({
        title: 'Queue Emptied',
        description: `Jobs removed from ${queueName} queue.`,
        variant: 'default'
      });
      // Refresh stats after emptying
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: 'Empty Queue Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  });
  // ✅ FIX: Use React Query mutation for worker toggle
  const workerToggleMutation = useMutation({
    mutationFn: async ({ workerId, enabled }: { workerId: string; enabled: boolean }) => {
      const response = await fetch('/api/admin/queue/worker-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workerId, enabled })
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || `Failed to ${enabled ? 'enable' : 'disable'} worker`);
      }
      return { workerId, enabled, result };
    },
    onSuccess: ({ workerId, enabled, result }) => {
      toast({
        title: 'Worker Updated',
        description: result.data.message,
        variant: 'default'
      });
      // Invalidate worker configurations to refresh data
      queryClient.invalidateQueries({ queryKey: ['worker-configurations'] });
    },
    onError: (error) => {
      toast({
        title: 'Worker Control Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  });
  // ✅ CRITICAL: Early return for maintenance mode to prevent cascade failures
  if (circuitBreaker.isMaintenanceMode) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-600" />
        <h3 className="text-lg font-semibold mb-2 text-orange-800">System Redirecting to Maintenance</h3>
        <p className="text-orange-700">Queue system is experiencing issues. Redirecting to maintenance page...</p>
      </div>
    );
  }
  const handleWorkerControl = async (action: 'start' | 'stop' | 'restart') => {
    setControlLoading(action);
    try {
      await workerControlMutation.mutateAsync(action);
    } finally {
      setControlLoading(null);
    }
  };
  const handleReprocess = async (queueName: string) => {
    setReprocessing(queueName);
    try {
      await reprocessMutation.mutateAsync(queueName);
    } finally {
      setReprocessing(null);
    }
  };
  const handleEmptyQueue = async (queueName: string) => {
    setEmptyingQueue(queueName);
    try {
      await emptyQueueMutation.mutateAsync(queueName);
    } finally {
      setEmptyingQueue(null);
    }
  };
  const handleWorkerToggle = async (workerId: string, enabled: boolean) => {
    setWorkerToggleLoading(workerId);
    try {
      await workerToggleMutation.mutateAsync({ workerId, enabled });
    } finally {
      setWorkerToggleLoading(null);
    }
  };
  const handleRefresh = () => {
    refetchStats();
    refetchWorkerConfigs();
  };
  // Handle query errors
  if (statsError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load queue statistics. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };
  const getStateColor = (state: string) => {
    switch (state) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'active': return 'text-blue-600 bg-blue-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'retry': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  const renderJobDetails = (job: RecentJob) => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold text-sm">Basic Information</h4>
          <div className="space-y-2 mt-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Queue:</span>
              <span className="text-sm font-medium">{job.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">State:</span>
              <Badge className={getStateColor(job.state)}>{job.state}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Priority:</span>
              <span className="text-sm">{job.priority}</span>
            </div>
            {job.duration && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Duration:</span>
                <span className="text-sm">{formatDuration(job.duration)}</span>
              </div>
            )}
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-sm">Timestamps</h4>
          <div className="space-y-2 mt-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Created:</span>
              <span className="text-sm">{new Date(job.createdOn).toLocaleString()}</span>
            </div>
            {job.startedOn && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Started:</span>
                <span className="text-sm">{new Date(job.startedOn).toLocaleString()}</span>
              </div>
            )}
            {job.completedOn && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Completed:</span>
                <span className="text-sm">{new Date(job.completedOn).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {job.data && (
        <div>
          <h4 className="font-semibold text-sm">Job Data</h4>
          <div className="bg-muted p-3 rounded text-xs overflow-auto max-h-60 mt-2 break-all">
            <pre className="whitespace-pre-wrap break-words">
              {JSON.stringify(job.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
      {job.output && (
        <div>
          <h4 className="font-semibold text-sm">Job Output</h4>
          <div className="bg-muted p-3 rounded text-xs overflow-auto max-h-60 mt-2 break-all">
            <pre className="whitespace-pre-wrap break-words">
              {JSON.stringify(job.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
  const renderJobList = (jobs: RecentJob[], page: number, setPage: (page: number) => void) => {
    const startIndex = (page - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    const totalPages = Math.ceil(jobs.length / jobsPerPage);
    return (
      <div className="space-y-3">
        {paginatedJobs.map((job) => (
          <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{job.name}</span>
                <Badge className={getStateColor(job.state)}>{job.state}</Badge>
                {job.priority > 0 && (
                  <Badge variant="outline" className="text-xs">Priority: {job.priority}</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Created: {new Date(job.createdOn).toLocaleString()}
                {job.duration && (
                  <span className="ml-4">Duration: {formatDuration(job.duration)}</span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-xs text-muted-foreground">
                ID: {job.id.slice(0, 8)}...
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedJob(job)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Job Details - {job.id}</DialogTitle>
                  </DialogHeader>
                  {renderJobDetails(job)}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ))}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, jobs.length)} of {jobs.length} jobs
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };
  if (isLoading && !queueData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            System Status: {queueData?.workerStatus?.isRunning ? 'Running' : 'Stopped'} • 
            Last updated: {queueData?.lastUpdated ? new Date(queueData.lastUpdated).toLocaleTimeString() : '--:--:--'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      {/* Worker Status Alert with Controls */}
      {queueData?.workerStatus && (
        <Alert className={queueData.workerStatus.isRunning ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div>
                  <strong>Status:</strong> {queueData.workerStatus.isRunning ? 'Running' : 'Stopped'}
                </div>
                <div className="text-sm">
                  Workers: {queueData.workerStatus.activeWorkers} active, {queueData.workerStatus.totalWorkers - queueData.workerStatus.activeWorkers} inactive of {queueData.workerStatus.totalWorkers} total
                </div>
              </div>
              <div className="flex items-center space-x-3 ml-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWorkerControl('start')}
                  disabled={!!controlLoading || queueData.workerStatus.isRunning}
                  className="h-8"
                >
                  {controlLoading === 'start' ? (
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Power className="h-3 w-3 mr-1" />
                  )}
                  Start
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWorkerControl('stop')}
                  disabled={!!controlLoading || !queueData.workerStatus.isRunning}
                  className="h-8"
                >
                  {controlLoading === 'stop' ? (
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Square className="h-3 w-3 mr-1" />
                  )}
                  Stop
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWorkerControl('restart')}
                  disabled={!!controlLoading}
                  className="h-8"
                >
                  {controlLoading === 'restart' ? (
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <RotateCcw className="h-3 w-3 mr-1" />
                  )}
                  Restart
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
      {/* Main Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="process" className="flex items-center space-x-2">
            <Timer className="h-4 w-4" />
            <span>Process</span>
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center space-x-2">
            <List className="h-4 w-4" />
            <span>Jobs</span>
          </TabsTrigger>
          <TabsTrigger value="archive" className="flex items-center space-x-2">
            <Archive className="h-4 w-4" />
            <span>Archive</span>
          </TabsTrigger>
          <TabsTrigger value="housekeeping" className="flex items-center space-x-2">
            <Trash2 className="h-4 w-4" />
            <span>Housekeeping</span>
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Configuration</span>
          </TabsTrigger>
        </TabsList>
        {/* Queue Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {queueData?.queues.map((queue) => (
              <Card key={queue.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{queue.displayName}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{queue.description}</p>
                  {/* ✅ Action buttons under the title */}
                  <div className="flex items-center space-x-2">
                    {/* ✅ Reprocess: Only enabled when there are failed jobs */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReprocess(queue.name)}
                      disabled={reprocessing === queue.name || queue.failed === 0}
                      className="text-xs"
                      title={queue.failed === 0 ? "No failed jobs to reprocess" : `Reprocess ${queue.failed} failed jobs`}
                    >
                      {reprocessing === queue.name ? (
                        <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          {queue.failed > 0 ? `Reprocess (${queue.failed})` : 'Reprocess'}
                        </>
                      )}
                    </Button>
                    {/* ✅ Empty: Only enabled when there are failed jobs (keep completed = success stories!) */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEmptyQueue(queue.name)}
                      disabled={emptyingQueue === queue.name || queue.failed === 0}
                      className="text-xs text-red-600 hover:text-red-700"
                      title={
                        queue.failed === 0 
                          ? "No failed jobs to clear (keeping completed jobs as success stories)" 
                          : `Clear ${queue.failed} failed jobs (keeping ${queue.completed} completed jobs)`
                      }
                    >
                      {emptyingQueue === queue.name ? (
                        <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <>
                          <Trash2 className="h-3 w-3 mr-1" />
                          {queue.failed > 0 
                            ? `Empty (${queue.failed} failed)` 
                            : 'Empty'
                          }
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold">{queue.totalJobs}</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-gray-500" />
                          Pending
                        </span>
                        <Badge variant="secondary">{queue.pending}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center">
                          <Zap className="h-3 w-3 mr-1 text-blue-500" />
                          Active
                        </span>
                        <Badge variant="secondary">{queue.active}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                          Completed
                        </span>
                        <Badge className="bg-green-600 text-white">{queue.completed}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
                          Failed
                        </span>
                        <Badge className="bg-red-500 text-white">{queue.failed}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        {/* Process Tab */}
        <TabsContent value="process" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Processing Jobs</CardTitle>
              <p className="text-sm text-muted-foreground">Currently running and pending jobs</p>
            </CardHeader>
            <CardContent>
              {queueData?.recentJobs.filter(job => ['active', 'pending'].includes(job.state)).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No active processing jobs</p>
              ) : (
                renderJobList(
                  queueData?.recentJobs.filter(job => ['active', 'pending'].includes(job.state)) || [],
                  1,
                  () => {}
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Jobs</CardTitle>
              <p className="text-sm text-muted-foreground">Latest job activity across all queues</p>
            </CardHeader>
            <CardContent>
              {queueData?.recentJobs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recent jobs found</p>
              ) : (
                renderJobList(queueData?.recentJobs || [], jobsPage, setJobsPage)
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Archive Tab */}
        <TabsContent value="archive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Archived Jobs</CardTitle>
              <p className="text-sm text-muted-foreground">Completed and failed jobs history</p>
            </CardHeader>
            <CardContent>
              {queueData?.recentJobs.filter(job => ['completed', 'failed'].includes(job.state)).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No archived jobs found</p>
              ) : (
                renderJobList(
                  queueData?.recentJobs.filter(job => ['completed', 'failed'].includes(job.state)) || [],
                  archivePage,
                  setArchivePage
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Housekeeping Tab */}
        <TabsContent value="housekeeping" className="space-y-6">
          <HousekeepingPanel />
        </TabsContent>
        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">System configuration and worker settings</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Worker System Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Worker System Status</h4>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${queueData?.workerStatus?.isRunning ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm">{queueData?.workerStatus?.isRunning ? 'Running' : 'Stopped'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Queue Engine</h4>
                  <div className="text-sm text-muted-foreground">PG Boss</div>
                </div>
              </div>
              <Separator />
              {/* Worker Configuration */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Worker Configuration</h4>
                <div className="grid gap-4">
                  {/* Image Processing Worker */}
                  <Card className="bg-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">Image Processing Worker</h5>
                          <p className="text-sm text-muted-foreground">
                            Queue: process-image, Concurrency: 1, Retry: {workerConfigurations['image-processing']?.maxRetries || 3}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Label htmlFor="image-worker-toggle" className="text-sm">Enable</Label>
                          <Switch
                            id="image-worker-toggle"
                            checked={workerConfigurations['image-processing']?.enabled || false}
                            disabled={workerToggleLoading === 'image-processing'}
                            onCheckedChange={(checked) => {
                              handleWorkerToggle('image-processing', checked);
                            }}
                            className="data-[state=checked]:bg-green-600"
                          />
                          {workerToggleLoading === 'image-processing' && (
                            <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Video Processing Worker */}
                  <Card className="bg-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">Video Processing Worker</h5>
                          <p className="text-sm text-muted-foreground">
                            Queue: process-video, Concurrency: 1, Retry: {workerConfigurations['video-processing']?.maxRetries || 3}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Label htmlFor="video-worker-toggle" className="text-sm">Enable</Label>
                          <Switch
                            id="video-worker-toggle"
                            checked={workerConfigurations['video-processing']?.enabled || false}
                            disabled={workerToggleLoading === 'video-processing'}
                            onCheckedChange={(checked) => {
                              handleWorkerToggle('video-processing', checked);
                            }}
                            className="data-[state=checked]:bg-green-600"
                          />
                          {workerToggleLoading === 'video-processing' && (
                            <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Email Worker */}
                  <Card className="bg-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">Email Worker</h5>
                          <p className="text-sm text-muted-foreground">
                            Queue: send-email, Concurrency: 1, Retry: {workerConfigurations['email']?.maxRetries || 3}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Label htmlFor="email-worker-toggle" className="text-sm">Enable</Label>
                          <Switch
                            id="email-worker-toggle"
                            checked={workerConfigurations['email']?.enabled || false}
                            disabled={workerToggleLoading === 'email'}
                            onCheckedChange={(checked) => {
                              handleWorkerToggle('email', checked);
                            }}
                            className="data-[state=checked]:bg-green-600"
                          />
                          {workerToggleLoading === 'email' && (
                            <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Housekeeping Worker */}
                  <Card className="bg-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">Housekeeping Worker</h5>
                          <p className="text-sm text-muted-foreground">
                            Queue: housekeeping, Concurrency: 1, Retry: {workerConfigurations['cleanup']?.maxRetries || 2}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Label htmlFor="housekeeping-worker-toggle" className="text-sm">Enable</Label>
                          <Switch
                            id="housekeeping-worker-toggle"
                            checked={workerConfigurations['cleanup']?.enabled || false}
                            disabled={workerToggleLoading === 'cleanup'}
                            onCheckedChange={(checked) => {
                              handleWorkerToggle('cleanup', checked);
                            }}
                            className="data-[state=checked]:bg-green-600"
                          />
                          {workerToggleLoading === 'cleanup' && (
                            <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Delete Media Worker */}
                  <Card className="bg-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">Delete Media Worker</h5>
                          <p className="text-sm text-muted-foreground">
                            Queue: delete-media, Concurrency: 1, Retry: {workerConfigurations['delete-media']?.maxRetries || 2}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Label htmlFor="delete-media-worker-toggle" className="text-sm">Enable</Label>
                          <Switch
                            id="delete-media-worker-toggle"
                            checked={workerConfigurations['delete-media']?.enabled || false}
                            disabled={workerToggleLoading === 'delete-media'}
                            onCheckedChange={(checked) => {
                              handleWorkerToggle('delete-media', checked);
                            }}
                            className="data-[state=checked]:bg-green-600"
                          />
                          {workerToggleLoading === 'delete-media' && (
                            <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              <Separator />
              <div className="text-sm text-muted-foreground">
                <p>🛠️ <strong>Database:</strong> PostgreSQL</p>
                <p>⚙️ <strong>Environment:</strong> Development</p>
                <p>🔄 <strong>Auto-Start:</strong> Disabled (manual control)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}