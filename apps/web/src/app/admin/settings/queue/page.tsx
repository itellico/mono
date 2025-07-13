'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  Server,
  Image as ImageIcon,
  Video,
  FileText,
  RefreshCw
} from 'lucide-react';
import { browserLogger } from '@/lib/browser-logger';

interface QueueStats {
  overview: {
    totalJobs: number;
    pendingJobs: number;
    processingJobs: number;
    completedJobs: number;
    failedJobs: number;
    successRate: number;
  };
  jobTypes: Array<{
    type: string;
    count: number;
  }>;
  performance: {
    averageProcessingTime: number;
    recentJobsCount: number;
  };
  status: string;
}

interface QueueJob {
  id: number;
  mediaAssetId: number;
  jobId: string;
  type: string;
  status: string;
  parameters: any;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
}

interface QueueHealth {
  status: string;
  metrics: {
    jobsLast24h: number;
    completedLast24h: number;
    failedLast24h: number;
    failureRate: number;
    throughputPerHour: number;
  };
  timestamp: string;
}

const fetchQueueStats = async (): Promise<QueueStats> => {
  const response = await fetch('/api/admin/queue?action=stats');
  if (!response.ok) {
    throw new Error('Failed to fetch queue stats');
  }
  const result = await response.json();
  return result.data;
};

const fetchQueueJobs = async (page = 1, status?: string, jobType?: string): Promise<{ jobs: QueueJob[]; pagination: any }> => {
  const params = new URLSearchParams({
    action: 'jobs',
    page: page.toString(),
    limit: '20'
  });

  if (status) params.append('status', status);
  if (jobType) params.append('jobType', jobType);

  const response = await fetch(`/api/admin/queue?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch queue jobs');
  }
  const result = await response.json();
  return result.data;
};

const fetchQueueHealth = async (): Promise<QueueHealth> => {
  const response = await fetch('/api/admin/queue?action=health');
  if (!response.ok) {
    throw new Error('Failed to fetch queue health');
  }
  const result = await response.json();
  return result.data;
};

const manageJob = async (action: string, jobId: string, jobType?: string) => {
  const response = await fetch('/api/admin/queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, jobId, jobType })
  });

  if (!response.ok) {
    throw new Error(`Failed to ${action} job`);
  }

  return response.json();
};

export default function QueueMonitoring() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch queue statistics
  const { 
    data: stats, 
    isLoading: isLoadingStats,
    error: statsError 
  } = useQuery({
    queryKey: ['queue-stats'],
    queryFn: fetchQueueStats,
    refetchInterval: autoRefresh ? 5000 : false, // Refresh every 5 seconds
  });

  // Fetch queue jobs
  const { 
    data: jobsData, 
    isLoading: isLoadingJobs,
    error: jobsError 
  } = useQuery({
    queryKey: ['queue-jobs', currentPage, statusFilter, typeFilter],
    queryFn: () => fetchQueueJobs(
      currentPage, 
      statusFilter === 'all' ? undefined : statusFilter, 
      typeFilter === 'all' ? undefined : typeFilter
    ),
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds
  });

  // Fetch queue health
  const { 
    data: health, 
    isLoading: isLoadingHealth,
    error: healthError 
  } = useQuery({
    queryKey: ['queue-health'],
    queryFn: fetchQueueHealth,
    refetchInterval: autoRefresh ? 15000 : false, // Refresh every 15 seconds
  });

  // Job management mutations
  const retryJobMutation = useMutation({
    mutationFn: (jobId: string) => manageJob('retry', jobId),
    onSuccess: () => {
      toast({
        title: "Job Retry Scheduled",
        description: "The job has been scheduled for retry.",
      });
      queryClient.invalidateQueries({ queryKey: ['queue-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
    onError: (error) => {
      toast({
        title: "Retry Failed",
        description: "Failed to schedule job for retry.",
        variant: "destructive",
      });
      browserLogger.error('Job retry failed', { error });
    },
  });

  const cancelJobMutation = useMutation({
    mutationFn: (jobId: string) => manageJob('cancel', jobId),
    onSuccess: () => {
      toast({
        title: "Job Cancelled",
        description: "The job has been cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ['queue-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
    onError: (error) => {
      toast({
        title: "Cancel Failed",
        description: "Failed to cancel job.",
        variant: "destructive",
      });
      browserLogger.error('Job cancel failed', { error });
    },
  });

  // Manual refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    queryClient.invalidateQueries({ queryKey: ['queue-jobs'] });
    queryClient.invalidateQueries({ queryKey: ['queue-health'] });
    toast({
      title: "Refreshed",
      description: "Queue data has been refreshed.",
    });
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', icon: Clock, text: 'Pending' },
      processing: { color: 'bg-blue-500', icon: Activity, text: 'Processing' },
      completed: { color: 'bg-green-500', icon: CheckCircle, text: 'Completed' },
      failed: { color: 'bg-red-500', icon: XCircle, text: 'Failed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  // Job type icon component
  const JobTypeIcon = ({ type }: { type: string }) => {
    const typeIcons = {
      'optimize-image': ImageIcon,
      'optimize-video': Video,
      'optimize-document': FileText
    };

    const Icon = typeIcons[type as keyof typeof typeIcons] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Queue Monitoring</h1>
          <p className="text-muted-foreground">Real-time monitoring of background processing jobs</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Queue Health Alert */}
      {health && health.status !== 'healthy' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="font-medium text-orange-800">Queue Health Warning</h3>
                <p className="text-sm text-orange-600">
                  Failure rate: {health.metrics.failureRate}% over the last 24 hours
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {isLoadingStats ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : statsError ? (
          <Card className="col-span-6">
            <CardContent className="pt-6 text-center text-muted-foreground">
              Failed to load statistics
            </CardContent>
          </Card>
        ) : stats ? (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.overview.totalJobs}</div>
                <p className="text-xs text-muted-foreground">Total Jobs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">{stats.overview.pendingJobs}</div>
                <p className="text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{stats.overview.processingJobs}</div>
                <p className="text-xs text-muted-foreground">Processing</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{stats.overview.completedJobs}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{stats.overview.failedJobs}</div>
                <p className="text-xs text-muted-foreground">Failed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">{stats.overview.successRate}%</div>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Performance & Health Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : stats ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Average Processing Time</p>
                  <p className="text-2xl font-bold">{formatDuration(stats.performance.averageProcessingTime)}</p>
                </div>
                {health && (
                  <div>
                    <p className="text-sm text-muted-foreground">Throughput (last 24h)</p>
                    <p className="text-2xl font-bold">{health.metrics.throughputPerHour.toFixed(1)} jobs/hour</p>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Job Types Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Job Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ) : stats ? (
              <div className="space-y-3">
                {stats.jobTypes.map((jobType, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <JobTypeIcon type={jobType.type.toLowerCase().replace(' ', '-')} />
                      <span className="text-sm">{jobType.type}</span>
                    </div>
                    <Badge variant="secondary">{jobType.count}</Badge>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Jobs</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="optimize-image">Image Optimization</SelectItem>
                  <SelectItem value="optimize-video">Video Processing</SelectItem>
                  <SelectItem value="optimize-document">Document Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingJobs ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : jobsError ? (
            <div className="text-center text-muted-foreground py-8">
              Failed to load jobs
            </div>
          ) : jobsData && jobsData.jobs.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Retries</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobsData.jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs">
                        {job.jobId.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <JobTypeIcon type={job.type} />
                          <span className="text-sm">{job.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={job.status} />
                      </TableCell>
                      <TableCell>
                        {job.duration ? formatDuration(job.duration) : '-'}
                      </TableCell>
                      <TableCell>
                        {job.retryCount > 0 ? (
                          <Badge variant="outline">{job.retryCount}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(job.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {job.status === 'failed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryJobMutation.mutate(job.jobId)}
                              disabled={retryJobMutation.isPending}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          )}
                          {(job.status === 'pending' || job.status === 'processing') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelJobMutation.mutate(job.jobId)}
                              disabled={cancelJobMutation.isPending}
                            >
                              <XCircle className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {jobsData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {jobsData.pagination.page} of {jobsData.pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!jobsData.pagination.hasPrev}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!jobsData.pagination.hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No jobs found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 