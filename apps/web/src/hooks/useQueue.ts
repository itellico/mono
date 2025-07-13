'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

// Types
interface QueueStats {
  queues: Array<{
    name: string;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
  }>;
  workers: {
    active: number;
    total: number;
    healthy: number;
    status: string;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
  };
  processing: {
    totalJobs: number;
    completedToday: number;
    failedToday: number;
    averageProcessingTime: number;
  };
}

interface QueueJob {
  id: string;
  queueName: string;
  jobType: string;
  status: string;
  priority: number;
  attempts: number;
  maxAttempts: number;
  progress: number;
  data: any;
  result?: any;
  error?: string;
  processingTimeMs?: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface JobFilters {
  page?: number;
  limit?: number;
  queue?: string;
  status?: string;
  jobType?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

// Hook for getting queue statistics
export function useQueueStats() {
  return useQuery({
    queryKey: ['queue-stats'],
    queryFn: async () => {
      const response = await apiClient.getQueueStats();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch queue stats');
      }
      return response.data;
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });
}

// Hook for listing queue jobs
export function useQueueJobs(filters: JobFilters = {}) {
  return useQuery({
    queryKey: ['queue-jobs', filters],
    queryFn: async () => {
      const response = await apiClient.getQueueJobs(filters);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch queue jobs');
      }
      return response.data;
    },
    refetchInterval: (data) => {
      // Auto-refresh if there are active jobs
      const hasActiveJobs = data?.jobs.some(
        job => job.status === 'active' || job.status === 'waiting'
      );
      return hasActiveJobs ? 3000 : 10000; // 3s if active, 10s otherwise
    },
  });
}

// Hook for retrying a failed job
export function useRetryJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiClient.retryJob(jobId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to retry job');
      }
      return response.data;
    },
    onSuccess: (data, jobId) => {
      toast.success('Job queued for retry');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['queue-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
    onError: (error) => {
      toast.error(`Retry failed: ${error.message}`);
    },
  });
}

// Hook for cancelling a job
export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiClient.cancelJob(jobId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to cancel job');
      }
      return response.data;
    },
    onSuccess: (data, jobId) => {
      toast.success('Job cancelled successfully');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['queue-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
    onError: (error) => {
      toast.error(`Cancel failed: ${error.message}`);
    },
  });
}

// Hook for pausing workers
export function usePauseWorkers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (queueName?: string) => {
      const response = await apiClient.pauseWorkers(queueName);
      if (!response.success) {
        throw new Error(response.error || 'Failed to pause workers');
      }
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
    onError: (error) => {
      toast.error(`Pause failed: ${error.message}`);
    },
  });
}

// Hook for resuming workers
export function useResumeWorkers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (queueName?: string) => {
      const response = await apiClient.resumeWorkers(queueName);
      if (!response.success) {
        throw new Error(response.error || 'Failed to resume workers');
      }
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
    onError: (error) => {
      toast.error(`Resume failed: ${error.message}`);
    },
  });
}

// Hook for cleaning up old jobs
export function useCleanupQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      olderThanDays = 30,
      status = ['completed', 'failed'],
      dryRun = false,
    }: {
      olderThanDays?: number;
      status?: string[];
      dryRun?: boolean;
    }) => {
      const response = await apiClient.cleanupQueue({
        olderThanDays,
        status,
        dryRun,
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to cleanup queue');
      }
      return response.data;
    },
    onSuccess: (data) => {
      if (data.dryRun) {
        toast.info(
          `Dry run: ${data.deletedCount} jobs would be deleted from ${data.affectedQueues.length} queue(s)`
        );
      } else {
        toast.success(
          `Cleanup completed: ${data.deletedCount} jobs deleted from ${data.affectedQueues.length} queue(s)`
        );
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['queue-jobs'] });
        queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      }
    },
    onError: (error) => {
      toast.error(`Cleanup failed: ${error.message}`);
    },
  });
}

// Utility functions
export const QueueUtils = {
  getStatusColor: (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'active':
        return 'text-blue-600';
      case 'waiting':
        return 'text-yellow-600';
      case 'delayed':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  },

  getStatusIcon: (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'active':
        return '🔄';
      case 'waiting':
        return '⏳';
      case 'delayed':
        return '⏰';
      default:
        return '❓';
    }
  },

  formatDuration: (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  },

  formatMemory: (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  },

  getProgressWidth: (progress: number) => {
    return Math.min(Math.max(progress, 0), 100);
  },

  getQueueHealth: (queue: QueueStats['queues'][0]) => {
    const total = queue.waiting + queue.active + queue.completed + queue.failed;
    if (total === 0) return 'idle';
    
    const failureRate = queue.failed / total;
    if (failureRate > 0.1) return 'unhealthy';
    if (queue.failed > 0) return 'warning';
    return 'healthy';
  },
};