'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Trash2, 
  Play, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  FileX, 
  Clock, 
  HardDrive,
  Eye
} from 'lucide-react';
interface CleanupResult {
  type: string;
  processedCount: number;
  cleanedCount: number;
  errors: string[];
  totalSizeFreed: number;
  details: Array<{
    fileName: string;
    filePath: string;
    reason: string;
    sizeBytes: number;
  }>;
}
interface HousekeepingAnalysis {
  success: boolean;
  dryRun: boolean;
  totalProcessed: number;
  totalCleaned: number;
  totalSizeFreed: number;
  results: CleanupResult[];
  errors: string[];
  duration: number;
}
interface HousekeepingConfig {
  dryRun: boolean;
  maxFiles: number;
  gracePeriodHours: number;
  detectionTypes: string[];
  logDetails: boolean;
}
const DETECTION_TYPES = [
  { id: 'pending_deletion_files', label: 'Pending Deletion Files', description: 'Files marked for deletion past grace period' },
  { id: 'deleted_status_files', label: 'Deleted Status Files', description: 'Files marked as deleted in database' },
  { id: 'failed_processing_files', label: 'Failed Processing Files', description: 'Files that failed optimization processing' },
  { id: 'abandoned_uploads', label: 'Abandoned Uploads', description: 'Uploads that never completed processing' },
  { id: 'physical_orphans', label: 'Physical Orphans', description: 'Files on disk without database records' }
];
export default function HousekeepingPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<HousekeepingConfig>({
    dryRun: true,
    maxFiles: 50,
    gracePeriodHours: 24,
    detectionTypes: ['pending_deletion_files', 'deleted_status_files', 'failed_processing_files', 'abandoned_uploads'],
    logDetails: true
  });
  // Fetch housekeeping analysis
  const { data: analysis, isLoading: isAnalyzing, error: analysisError } = useQuery({
    queryKey: ['housekeeping-analysis'],
    queryFn: async (): Promise<HousekeepingAnalysis> => {
      const response = await fetch('/api/admin/housekeeping?operation=analyze');
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result.analysis;
    },
    staleTime: 30000, // Refresh every 30 seconds
    refetchInterval: 30000
  });
  // Run housekeeping mutation
  const runHousekeeping = useMutation({
    mutationFn: async ({ operation, config: runConfig }: { operation: string; config: HousekeepingConfig }) => {
      const response = await fetch('/api/admin/housekeeping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, config: runConfig })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: data.result?.dryRun ? 'Dry Run Completed' : 'Housekeeping Completed',
        description: data.message,
        variant: 'default'
      });
      queryClient.invalidateQueries({ queryKey: ['housekeeping-analysis'] });
    },
    onError: (error) => {
      toast({
        title: 'Housekeeping Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pending_deletion_files': return <Clock className="h-4 w-4" />;
      case 'deleted_status_files': return <Trash2 className="h-4 w-4" />;
      case 'failed_processing_files': return <AlertTriangle className="h-4 w-4" />;
      case 'abandoned_uploads': return <FileX className="h-4 w-4" />;
      case 'physical_orphans': return <HardDrive className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pending_deletion_files': return 'text-yellow-600';
      case 'deleted_status_files': return 'text-red-600';
      case 'failed_processing_files': return 'text-orange-600';
      case 'abandoned_uploads': return 'text-purple-600';
      case 'physical_orphans': return 'text-blue-600';
      default: return 'text-green-600';
    }
  };
  const handleRunDryRun = () => {
    runHousekeeping.mutate({
      operation: 'immediate',
      config: { ...config, dryRun: true }
    });
  };
  const handleRunHousekeeping = () => {
    runHousekeeping.mutate({
      operation: 'immediate',
      config: { ...config, dryRun: false }
    });
  };
  const handleQueueHousekeeping = () => {
    runHousekeeping.mutate({
      operation: 'queue',
      config
    });
  };
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Housekeeping
        </CardTitle>
        <CardDescription>
          Manage file cleanup and system maintenance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="dry-run">Dry Run</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
          </TabsList>
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {isAnalyzing ? (
                // Loading skeletons
                Array(4).fill(0).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </CardContent>
                  </Card>
                ))
              ) : analysis ? (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Files to Clean</CardTitle>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analysis.totalCleaned}</div>
                      <p className="text-xs text-muted-foreground">
                        from {analysis.totalProcessed} processed
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Space to Free</CardTitle>
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatFileSize(analysis.totalSizeFreed)}</div>
                      <p className="text-xs text-muted-foreground">
                        disk space
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Cleanup Types</CardTitle>
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analysis.results.length}</div>
                      <p className="text-xs text-muted-foreground">
                        active detection types
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Status</CardTitle>
                      {analysis.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analysis.success ? 'Ready' : 'Issues'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {analysis.errors.length} errors
                      </p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">
                        Failed to load housekeeping analysis
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
            {/* Cleanup Results Details */}
            {analysis && analysis.results.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Cleanup Categories</h3>
                {analysis.results.map((result, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={getTypeColor(result.type)}>
                            {getTypeIcon(result.type)}
                          </div>
                          <CardTitle className="text-base">
                            {DETECTION_TYPES.find(t => t.id === result.type)?.label || result.type}
                          </CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary">
                            {result.cleanedCount} files
                          </Badge>
                          <Badge variant="outline">
                            {formatFileSize(result.totalSizeFreed)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    {result.details.length > 0 && (
                      <CardContent className="pt-0">
                        <div className="text-sm text-muted-foreground mb-2">
                          Sample files to be cleaned:
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {result.details.slice(0, 5).map((detail, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span className="truncate mr-2">{detail.fileName}</span>
                              <span className="text-muted-foreground">
                                {formatFileSize(detail.sizeBytes)}
                              </span>
                            </div>
                          ))}
                          {result.details.length > 5 && (
                            <div className="text-xs text-muted-foreground">
                              ... and {result.details.length - 5} more files
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleRunDryRun}
                disabled={runHousekeeping.isPending || isAnalyzing}
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                Run Dry Run
              </Button>
              <Button 
                onClick={handleRunHousekeeping}
                disabled={runHousekeeping.isPending || isAnalyzing || !analysis?.totalCleaned}
                variant="default"
              >
                <Play className="h-4 w-4 mr-2" />
                Run Cleanup
              </Button>
              <Button 
                onClick={handleQueueHousekeeping}
                disabled={runHousekeeping.isPending || isAnalyzing}
                variant="secondary"
              >
                <Clock className="h-4 w-4 mr-2" />
                Queue Job
              </Button>
            </div>
          </TabsContent>
          {/* Dry Run Tab */}
          <TabsContent value="dry-run" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Test Cleanup (Dry Run)
                </CardTitle>
                <CardDescription>
                  Preview what files would be cleaned without actually deleting them
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="dry-run-max-files">Max Files to Process</Label>
                    <Input
                      id="dry-run-max-files"
                      type="number"
                      value={config.maxFiles}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxFiles: parseInt(e.target.value) || 50 }))}
                      min={1}
                      max={500}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dry-run-grace-period">Grace Period (Hours)</Label>
                    <Input
                      id="dry-run-grace-period"
                      type="number"
                      value={config.gracePeriodHours}
                      onChange={(e) => setConfig(prev => ({ ...prev, gracePeriodHours: parseInt(e.target.value) || 24 }))}
                      min={0}
                      max={168}
                    />
                  </div>
                </div>
                <div>
                  <Label>Detection Types</Label>
                  <div className="grid gap-2 mt-2">
                    {DETECTION_TYPES.map((type) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={type.id}
                          checked={config.detectionTypes.includes(type.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setConfig(prev => ({ 
                                ...prev, 
                                detectionTypes: [...prev.detectionTypes, type.id] 
                              }));
                            } else {
                              setConfig(prev => ({ 
                                ...prev, 
                                detectionTypes: prev.detectionTypes.filter(t => t !== type.id) 
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={type.id} className="text-sm font-normal">
                          {type.label}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {type.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button 
                  onClick={handleRunDryRun}
                  disabled={runHousekeeping.isPending}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {runHousekeeping.isPending ? 'Running...' : 'Run Dry Run'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Configuration Tab */}
          <TabsContent value="configuration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Housekeeping Configuration
                </CardTitle>
                <CardDescription>
                  Configure automatic housekeeping settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="log-details"
                    checked={config.logDetails}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, logDetails: checked }))}
                  />
                  <Label htmlFor="log-details">Enable detailed logging</Label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="config-max-files">Default Max Files</Label>
                    <Input
                      id="config-max-files"
                      type="number"
                      value={config.maxFiles}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxFiles: parseInt(e.target.value) || 50 }))}
                      min={1}
                      max={500}
                    />
                  </div>
                  <div>
                    <Label htmlFor="config-grace-period">Default Grace Period (Hours)</Label>
                    <Input
                      id="config-grace-period"
                      type="number"
                      value={config.gracePeriodHours}
                      onChange={(e) => setConfig(prev => ({ ...prev, gracePeriodHours: parseInt(e.target.value) || 24 }))}
                      min={0}
                      max={168}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-4">
                    These settings will be used for scheduled housekeeping jobs. Manual runs can override these values.
                  </p>
                  <Button 
                    onClick={handleQueueHousekeeping}
                    disabled={runHousekeeping.isPending}
                    className="w-full"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Queue Housekeeping Job
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 