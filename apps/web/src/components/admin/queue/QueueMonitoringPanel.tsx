'use client';
import React, { useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCircuitBreaker } from '@/hooks/useCircuitBreaker';
// TODO: Create these components
// import { QueueStatsCard } from './components/QueueStatsCard';
// import { WorkerControlPanel } from './components/WorkerControlPanel';
import HousekeepingPanel from './HousekeepingPanel';

// Temporary type definitions
type QueueData = {
  queues: Array<{
    name: string;
    active: number;
    waiting: number;
    completed: number;
    failed: number;
  }>;
};

type WorkerConfiguration = {
  enabled: boolean;
  concurrency: number;
};
/**
 * Optimized Queue Monitoring Panel
 * 
 * Provides real-time queue monitoring and worker management for itellico Mono
 * 
 * @component
 * @example
 * <QueueMonitoringPanel />
 */
export const QueueMonitoringPanel = function QueueMonitoringPanel() {
  const [controlLoading, setControlLoading] = useState<string | null>(null);
  const [reprocessing, setReprocessing] = useState<string | null>(null);
  const [emptyingQueue, setEmptyingQueue] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Circuit Breaker for API failures
  const circuitBreaker = useCircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 30000,
    redirectOnFailure: true,
    redirectUrl: '/admin/maintenance'
  });
  // Enhanced React Query for queue stats with circuit breaker
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
    retry: (failureCount) => failureCount < 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: (query) => {
      const hasError = query?.state?.error;
      return (hasError || circuitBreaker.state === 'OPEN') ? false : 5000;
    },
    staleTime: 1000 });
  // React Query for worker configurations
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
    refetchInterval: 5000 });
  // Worker control mutation
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
  // Memoized event handlers
  const handleWorkerControl = useCallback(async (action: 'start' | 'stop' | 'restart') => {
    setControlLoading(action);
    try {
      await workerControlMutation.mutateAsync(action);
    } finally {
      setControlLoading(null);
    }
  }, [workerControlMutation]);
  const handleReprocess = useCallback(async (queueName: string) => {
    setReprocessing(queueName);
    try {
      const response = await fetch(`/api/admin/queue/${queueName}/reprocess`, {
        method: 'POST'
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Reprocessing Started',
          description: `Failed jobs in ${queueName} are being reprocessed` });
        refetchStats();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Reprocess Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setReprocessing(null);
    }
  }, [toast, refetchStats]);
  const handleEmptyQueue = useCallback(async (queueName: string) => {
    setEmptyingQueue(queueName);
    try {
      const response = await fetch(`/api/admin/queue/${queueName}/empty`, {
        method: 'POST'
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: 'Queue Emptied',
          description: `All jobs removed from ${queueName}` });
        refetchStats();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Empty Queue Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setEmptyingQueue(null);
    }
  }, [toast, refetchStats]);
  const handleRefresh = useCallback(() => {
    refetchStats();
    refetchWorkerConfigs();
  }, [refetchStats, refetchWorkerConfigs]);
  // Loading skeleton
  if (isLoading && !queueData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }
  // Error state
  if (statsError && !queueData) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load queue data: {statsError instanceof Error ? statsError.message : 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }
  if (!queueData) {
    return (
      <Alert>
        <AlertDescription>
          No queue data available. Please check your queue configuration.
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Queue Monitoring</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage background job processing queues
          </p>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="housekeeping">Housekeeping</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          {/* Queue Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queueData.queues.map((queue) => (
              <div key={queue.name} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{queue.name}</h3>
                <p>Active: {queue.active}</p>
                <p>Waiting: {queue.waiting}</p>
                <p>Completed: {queue.completed}</p>
                <p>Failed: {queue.failed}</p>
                {/* TODO: Replace with QueueStatsCard component */}
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="workers" className="space-y-6">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-4">Worker Control Panel</h3>
            <p className="text-gray-600">Worker management functionality will be available here.</p>
            {/* TODO: Replace with WorkerControlPanel component */}
          </div>
        </TabsContent>
        <TabsContent value="housekeeping" className="space-y-6">
          <HousekeepingPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
} 