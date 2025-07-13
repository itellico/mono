'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Monitor, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  PlayCircle,
  Square,
  Terminal,
  FileCode,
  Search,
  FileText,
  Zap,
  Eye,
  Download,
  Trash2
} from 'lucide-react';

interface BuildStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  artifacts?: {
    generated: number;
    optimized: number;
    errors: number;
  };
}

interface BuildJob {
  id: string;
  templateId: string;
  templateName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  duration?: string;
  currentStep?: string;
  steps: BuildStep[];
  logs: Array<{
    timestamp: Date;
    level: 'info' | 'warning' | 'error' | 'success';
    message: string;
  }>;
  artifacts?: {
    forms: number;
    searches: number;
    pages: number;
    totalSize: string;
  };
}

interface BuildMonitorProps {
  buildJobs: BuildJob[];
  onCancelBuild?: (buildId: string) => void;
  onRetryBuild?: (buildId: string) => void;
  onViewArtifacts?: (buildId: string) => void;
}

/**
 * Real-time Build Monitor Component
 * 
 * Provides live monitoring of build processes with:
 * - Real-time progress tracking
 * - Live log streaming
 * - Step-by-step build visualization
 * - Build artifact management
 * 
 * @component
 * @param {BuildMonitorProps} props - Component properties
 * @example
 * ```tsx
 * <BuildMonitor buildJobs={jobs} onCancelBuild={handleCancel} />
 * ```
 */
export function BuildMonitor({ 
  buildJobs, 
  onCancelBuild, 
  onRetryBuild, 
  onViewArtifacts 
}: BuildMonitorProps) {
  const [selectedBuild, setSelectedBuild] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // In a real implementation, this would fetch updates from the server
      console.log('Refreshing build status...');
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const activeBuildJobs = buildJobs.filter(job => 
    job.status === 'running' || job.status === 'queued'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'running': return 'text-blue-600 bg-blue-50';
      case 'queued': return 'text-yellow-600 bg-yellow-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'queued': return <Clock className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'success': return 'text-green-500';
      default: return 'text-blue-500';
    }
  };

  const selectedBuildJob = selectedBuild ? buildJobs.find(job => job.id === selectedBuild) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Build Queue */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Active Builds
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-green-50 text-green-600' : ''}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Live' : 'Paused'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeBuildJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Monitor className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No active builds</p>
                </div>
              ) : (
                activeBuildJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedBuild === job.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedBuild(job.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium truncate">{job.templateName}</div>
                      <Badge 
                        className={`${getStatusColor(job.status)} border-0`}
                      >
                        {getStatusIcon(job.status)}
                        <span className="ml-1 capitalize">{job.status}</span>
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-2">
                      Build ID: {job.id}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} className="h-1" />
                    </div>

                    {job.currentStep && (
                      <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>{job.currentStep}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>
                        Started {new Date(job.startTime).toLocaleTimeString()}
                      </span>
                      {job.status === 'running' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelBuild?.(job.id);
                          }}
                          className="h-6 px-2"
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Build Details */}
      <div className="lg:col-span-2">
        {selectedBuildJob ? (
          <div className="space-y-6">
            {/* Build Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-blue-500" />
                      {selectedBuildJob.templateName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Build ID: {selectedBuildJob.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusColor(selectedBuildJob.status)} border-0`}>
                      {getStatusIcon(selectedBuildJob.status)}
                      <span className="ml-1 capitalize">{selectedBuildJob.status}</span>
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => onViewArtifacts?.(selectedBuildJob.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      {selectedBuildJob.status === 'failed' && (
                        <Button variant="outline" size="sm" onClick={() => onRetryBuild?.(selectedBuildJob.id)}>
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Progress</div>
                    <Progress value={selectedBuildJob.progress} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {selectedBuildJob.progress}% complete
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Duration</div>
                    <div className="text-lg font-mono">
                      {selectedBuildJob.duration || 'In progress...'}
                    </div>
                  </div>
                </div>

                {selectedBuildJob.artifacts && (
                  <>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-blue-50 rounded">
                        <FileCode className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                        <div className="font-medium">{selectedBuildJob.artifacts.forms}</div>
                        <div className="text-xs text-muted-foreground">Forms</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded">
                        <Search className="h-6 w-6 mx-auto mb-1 text-green-600" />
                        <div className="font-medium">{selectedBuildJob.artifacts.searches}</div>
                        <div className="text-xs text-muted-foreground">Searches</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded">
                        <FileText className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                        <div className="font-medium">{selectedBuildJob.artifacts.pages}</div>
                        <div className="text-xs text-muted-foreground">Pages</div>
                      </div>
                      <div className="p-3 bg-orange-50 rounded">
                        <Monitor className="h-6 w-6 mx-auto mb-1 text-orange-600" />
                        <div className="font-medium">{selectedBuildJob.artifacts.totalSize}</div>
                        <div className="text-xs text-muted-foreground">Total Size</div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Build Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" />
                  Build Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedBuildJob.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.status === 'completed' ? 'bg-green-100 text-green-600' :
                          step.status === 'running' ? 'bg-blue-100 text-blue-600' :
                          step.status === 'failed' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-400'
                        }`}>
                          {step.status === 'completed' ? <CheckCircle className="h-4 w-4" /> :
                           step.status === 'running' ? <RefreshCw className="h-4 w-4 animate-spin" /> :
                           step.status === 'failed' ? <XCircle className="h-4 w-4" /> :
                           <div className="w-2 h-2 rounded-full bg-current" />}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{step.name}</div>
                          {step.duration && (
                            <div className="text-xs text-muted-foreground">
                              {step.duration}ms
                            </div>
                          )}
                        </div>
                        
                        {step.artifacts && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Generated: {step.artifacts.generated} • Optimized: {step.artifacts.optimized}
                            {step.artifacts.errors > 0 && (
                              <span className="text-red-500"> • Errors: {step.artifacts.errors}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Build Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Build Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 w-full border rounded-md p-4 bg-gray-900 text-gray-100">
                  <div className="space-y-1 font-mono text-sm">
                    {selectedBuildJob.logs.map((log, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-gray-500 text-xs">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <span className={`text-xs ${getLogLevelColor(log.level)}`}>
                          [{log.level.toUpperCase()}]
                        </span>
                        <span className="flex-1">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center text-muted-foreground">
                <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Select a build to view details</p>
                <p className="text-sm">Choose from the active builds on the left</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}