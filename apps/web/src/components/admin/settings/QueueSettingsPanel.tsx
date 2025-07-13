'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Timer, 
  Trash2, 
  Brush, 
  Layers,
  Save,
  RotateCcw,
  AlertTriangle,
  Info
} from 'lucide-react';

export function QueueSettingsPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Worker Settings State
  const [workerSettings, setWorkerSettings] = useState({
    maxConcurrentJobs: 10,
    pollingIntervalMs: 2000,
    heartbeatIntervalMs: 30000,
    autoRefreshInterval: 5000,
    enableDetailedLogging: true,
    enableMetrics: true
  });

  // Global Defaults State
  const [globalDefaults, setGlobalDefaults] = useState({
    retryLimit: 3,
    retryDelayMs: 5000,
    jobTimeoutMs: 300000,
    exponentialBackoff: true,
    alertOnFailureThreshold: 5,
    batchSize: 5
  });

  // Delete Media Settings State
  const [deleteMediaSettings, setDeleteMediaSettings] = useState({
    gracePeriodHours: 0,
    retryLimit: 3,
    retryDelayMs: 60000,
    jobTimeoutMs: 120000,
    enableTwoPhaseDeletion: true,
    enableDirectoryCleanup: true
  });

  // Housekeeping Settings State
  const [housekeepingSettings, setHousekeepingSettings] = useState({
    intervalHours: 24,
    archiveCleanupDays: 30,
    logCleanupDays: 7,
    tempFileCleanupHours: 2,
    orphanedMediaCleanupDays: 3,
    enableDatabaseVacuum: true,
    enableStatCleanup: true
  });

  // Queue Overrides State
  const [queueOverrides, setQueueOverrides] = useState({
    'process-image': { enabled: true, maxRetries: 3, timeoutMs: 300000, priority: 1, batchSize: 5 },
    'process-video': { enabled: false, maxRetries: 3, timeoutMs: 600000, priority: 2, batchSize: 1 },
    'process-document': { enabled: false, maxRetries: 3, timeoutMs: 180000, priority: 3, batchSize: 3 },
    'delete-media': { enabled: true, maxRetries: 3, timeoutMs: 120000, priority: 4, batchSize: 1, gracePeriodHours: 0 },
    'cleanup-orphaned-media': { enabled: true, maxRetries: 1, timeoutMs: 300000, priority: 5, batchSize: 1 },
    'send-email': { enabled: false, maxRetries: 3, timeoutMs: 30000, priority: 6, batchSize: 10 },
    'housekeeping': { enabled: true, maxRetries: 1, timeoutMs: 600000, priority: 7, intervalHours: 24, cleanupTypes: ['archive', 'logs', 'temp'] }
  });

  const handleSaveWorkerSettings = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation

      toast({
        title: "Worker settings saved",
        description: "Global worker configuration has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to save worker settings",
        description: "There was an error updating the worker configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGlobalDefaults = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation

      toast({
        title: "Global defaults saved",
        description: "Default retry and timeout policies have been updated.",
      });
    } catch (error) {
      toast({
        title: "Failed to save global defaults",
        description: "There was an error updating the default policies.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDeleteMediaSettings = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation

      toast({
        title: "Delete media settings saved",
        description: "Media deletion configuration has been updated.",
      });
    } catch (error) {
      toast({
        title: "Failed to save delete media settings",
        description: "There was an error updating the deletion configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHousekeepingSettings = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation

      toast({
        title: "Housekeeping settings saved",
        description: "System maintenance configuration has been updated.",
      });
    } catch (error) {
      toast({
        title: "Failed to save housekeeping settings",
        description: "There was an error updating the maintenance configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQueueOverrides = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation

      toast({
        title: "Queue overrides saved",
        description: "Per-queue configurations have been updated.",
      });
    } catch (error) {
      toast({
        title: "Failed to save queue overrides",
        description: "There was an error updating the queue configurations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Queue System Configuration
        </CardTitle>
        <CardDescription>
          Configure worker behavior, retry policies, and queue-specific settings for the background job system.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="worker" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="worker" className="flex items-center gap-1">
              <Settings className="w-4 h-4" />
              Worker Settings
            </TabsTrigger>
            <TabsTrigger value="defaults" className="flex items-center gap-1">
              <Timer className="w-4 h-4" />
              Global Defaults
            </TabsTrigger>
            <TabsTrigger value="delete" className="flex items-center gap-1">
              <Trash2 className="w-4 h-4" />
              Delete Media
            </TabsTrigger>
            <TabsTrigger value="housekeeping" className="flex items-center gap-1">
              <Brush className="w-4 h-4" />
              Housekeeping
            </TabsTrigger>
            <TabsTrigger value="queues" className="flex items-center gap-1">
              <Layers className="w-4 h-4" />
              Queue Overrides
            </TabsTrigger>
          </TabsList>

          {/* Worker Settings Tab */}
          <TabsContent value="worker" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Global Worker Configuration</h3>
                <Badge variant="secondary">Environment → Database → Runtime</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxConcurrentJobs">Max Concurrent Jobs</Label>
                    <Input
                      id="maxConcurrentJobs"
                      type="number"
                      value={workerSettings.maxConcurrentJobs}
                      onChange={(e) => setWorkerSettings(prev => ({ ...prev, maxConcurrentJobs: parseInt(e.target.value) }))}
                      min="1"
                      max="100"
                    />
                    <p className="text-sm text-muted-foreground">Maximum number of jobs that can run simultaneously</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pollingInterval">Polling Interval (ms)</Label>
                    <Input
                      id="pollingInterval"
                      type="number"
                      value={workerSettings.pollingIntervalMs}
                      onChange={(e) => setWorkerSettings(prev => ({ ...prev, pollingIntervalMs: parseInt(e.target.value) }))}
                      min="1000"
                      max="30000"
                    />
                    <p className="text-sm text-muted-foreground">How often workers check for new jobs</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="heartbeatInterval">Heartbeat Interval (ms)</Label>
                    <Input
                      id="heartbeatInterval"
                      type="number"
                      value={workerSettings.heartbeatIntervalMs}
                      onChange={(e) => setWorkerSettings(prev => ({ ...prev, heartbeatIntervalMs: parseInt(e.target.value) }))}
                      min="10000"
                      max="120000"
                    />
                    <p className="text-sm text-muted-foreground">Worker heartbeat frequency for health monitoring</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="autoRefreshInterval">Auto Refresh Interval (ms)</Label>
                    <Input
                      id="autoRefreshInterval"
                      type="number"
                      value={workerSettings.autoRefreshInterval}
                      onChange={(e) => setWorkerSettings(prev => ({ ...prev, autoRefreshInterval: parseInt(e.target.value) }))}
                      min="1000"
                      max="60000"
                    />
                    <p className="text-sm text-muted-foreground">UI refresh rate for queue monitoring</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableDetailedLogging"
                      checked={workerSettings.enableDetailedLogging}
                      onCheckedChange={(checked) => setWorkerSettings(prev => ({ ...prev, enableDetailedLogging: checked }))}
                    />
                    <Label htmlFor="enableDetailedLogging">Enable Detailed Logging</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableMetrics"
                      checked={workerSettings.enableMetrics}
                      onCheckedChange={(checked) => setWorkerSettings(prev => ({ ...prev, enableMetrics: checked }))}
                    />
                    <Label htmlFor="enableMetrics">Enable Performance Metrics</Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setWorkerSettings({
                  maxConcurrentJobs: 10,
                  pollingIntervalMs: 2000,
                  heartbeatIntervalMs: 30000,
                  autoRefreshInterval: 5000,
                  enableDetailedLogging: true,
                  enableMetrics: true
                })}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button onClick={handleSaveWorkerSettings} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Worker Settings
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Global Defaults Tab */}
          <TabsContent value="defaults" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Default Retry & Timeout Policies</h3>
                <Badge variant="secondary">Applied to all queues unless overridden</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="retryLimit">Default Retry Limit</Label>
                    <Input
                      id="retryLimit"
                      type="number"
                      value={globalDefaults.retryLimit}
                      onChange={(e) => setGlobalDefaults(prev => ({ ...prev, retryLimit: parseInt(e.target.value) }))}
                      min="0"
                      max="10"
                    />
                    <p className="text-sm text-muted-foreground">Number of retry attempts for failed jobs</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retryDelayMs">Retry Delay (ms)</Label>
                    <Input
                      id="retryDelayMs"
                      type="number"
                      value={globalDefaults.retryDelayMs}
                      onChange={(e) => setGlobalDefaults(prev => ({ ...prev, retryDelayMs: parseInt(e.target.value) }))}
                      min="1000"
                      max="300000"
                    />
                    <p className="text-sm text-muted-foreground">Base delay between retry attempts</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobTimeoutMs">Job Timeout (ms)</Label>
                    <Input
                      id="jobTimeoutMs"
                      type="number"
                      value={globalDefaults.jobTimeoutMs}
                      onChange={(e) => setGlobalDefaults(prev => ({ ...prev, jobTimeoutMs: parseInt(e.target.value) }))}
                      min="30000"
                      max="3600000"
                    />
                    <p className="text-sm text-muted-foreground">Maximum time a job can run before timeout</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="batchSize">Default Batch Size</Label>
                    <Input
                      id="batchSize"
                      type="number"
                      value={globalDefaults.batchSize}
                      onChange={(e) => setGlobalDefaults(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                      min="1"
                      max="50"
                    />
                    <p className="text-sm text-muted-foreground">Number of jobs processed in each batch</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alertThreshold">Alert on Failure Threshold</Label>
                    <Input
                      id="alertThreshold"
                      type="number"
                      value={globalDefaults.alertOnFailureThreshold}
                      onChange={(e) => setGlobalDefaults(prev => ({ ...prev, alertOnFailureThreshold: parseInt(e.target.value) }))}
                      min="1"
                      max="100"
                    />
                    <p className="text-sm text-muted-foreground">Send alerts when failure count exceeds this threshold</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="exponentialBackoff"
                      checked={globalDefaults.exponentialBackoff}
                      onCheckedChange={(checked) => setGlobalDefaults(prev => ({ ...prev, exponentialBackoff: checked }))}
                    />
                    <Label htmlFor="exponentialBackoff">Exponential Backoff</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Increase delay exponentially for each retry attempt</p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setGlobalDefaults({
                  retryLimit: 3,
                  retryDelayMs: 5000,
                  jobTimeoutMs: 300000,
                  exponentialBackoff: true,
                  alertOnFailureThreshold: 5,
                  batchSize: 5
                })}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button onClick={handleSaveGlobalDefaults} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Global Defaults
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Delete Media Tab */}
          <TabsContent value="delete" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Media Deletion Configuration</h3>
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Irreversible Operations
                </Badge>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Safety Warning</p>
                    <p>Media deletion operations are permanent and cannot be undone. Configure grace periods and safety mechanisms carefully.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gracePeriodHours">Grace Period (hours)</Label>
                    <Input
                      id="gracePeriodHours"
                      type="number"
                      value={deleteMediaSettings.gracePeriodHours}
                      onChange={(e) => setDeleteMediaSettings(prev => ({ ...prev, gracePeriodHours: parseInt(e.target.value) }))}
                      min="0"
                      max="168"
                    />
                    <p className="text-sm text-muted-foreground">Delay before actual deletion occurs (0 = immediate)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deleteRetryLimit">Retry Limit</Label>
                    <Input
                      id="deleteRetryLimit"
                      type="number"
                      value={deleteMediaSettings.retryLimit}
                      onChange={(e) => setDeleteMediaSettings(prev => ({ ...prev, retryLimit: parseInt(e.target.value) }))}
                      min="1"
                      max="5"
                    />
                    <p className="text-sm text-muted-foreground">Number of retry attempts for failed deletions</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deleteTimeoutMs">Job Timeout (ms)</Label>
                    <Input
                      id="deleteTimeoutMs"
                      type="number"
                      value={deleteMediaSettings.jobTimeoutMs}
                      onChange={(e) => setDeleteMediaSettings(prev => ({ ...prev, jobTimeoutMs: parseInt(e.target.value) }))}
                      min="30000"
                      max="600000"
                    />
                    <p className="text-sm text-muted-foreground">Maximum time for deletion job to complete</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableTwoPhaseDeletion"
                      checked={deleteMediaSettings.enableTwoPhaseDeletion}
                      onCheckedChange={(checked) => setDeleteMediaSettings(prev => ({ ...prev, enableTwoPhaseDeletion: checked }))}
                    />
                    <Label htmlFor="enableTwoPhaseDeletion">Two-Phase Deletion</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Mark as deleted first, then remove files in second phase</p>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableDirectoryCleanup"
                      checked={deleteMediaSettings.enableDirectoryCleanup}
                      onCheckedChange={(checked) => setDeleteMediaSettings(prev => ({ ...prev, enableDirectoryCleanup: checked }))}
                    />
                    <Label htmlFor="enableDirectoryCleanup">Directory Cleanup</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Remove empty directories after file deletion</p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDeleteMediaSettings({
                  gracePeriodHours: 0,
                  retryLimit: 3,
                  retryDelayMs: 60000,
                  jobTimeoutMs: 120000,
                  enableTwoPhaseDeletion: true,
                  enableDirectoryCleanup: true
                })}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button onClick={handleSaveDeleteMediaSettings} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Delete Settings
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Housekeeping Tab */}
          <TabsContent value="housekeeping" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">System Maintenance Configuration</h3>
                <Badge variant="outline">Automated Cleanup Tasks</Badge>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Housekeeping Information</p>
                    <p>These tasks run automatically to maintain system performance and clean up old data. Configure schedules carefully to avoid impact during peak hours.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="housekeepingInterval">Interval (hours)</Label>
                    <Input
                      id="housekeepingInterval"
                      type="number"
                      value={housekeepingSettings.intervalHours}
                      onChange={(e) => setHousekeepingSettings(prev => ({ ...prev, intervalHours: parseInt(e.target.value) }))}
                      min="1"
                      max="168"
                    />
                    <p className="text-sm text-muted-foreground">How often housekeeping tasks run</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="archiveCleanupDays">Archive Cleanup (days)</Label>
                    <Input
                      id="archiveCleanupDays"
                      type="number"
                      value={housekeepingSettings.archiveCleanupDays}
                      onChange={(e) => setHousekeepingSettings(prev => ({ ...prev, archiveCleanupDays: parseInt(e.target.value) }))}
                      min="7"
                      max="365"
                    />
                    <p className="text-sm text-muted-foreground">Remove archived jobs older than this many days</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logCleanupDays">Log Cleanup (days)</Label>
                    <Input
                      id="logCleanupDays"
                      type="number"
                      value={housekeepingSettings.logCleanupDays}
                      onChange={(e) => setHousekeepingSettings(prev => ({ ...prev, logCleanupDays: parseInt(e.target.value) }))}
                      min="1"
                      max="90"
                    />
                    <p className="text-sm text-muted-foreground">Remove log files older than this many days</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tempFileCleanupHours">Temp File Cleanup (hours)</Label>
                    <Input
                      id="tempFileCleanupHours"
                      type="number"
                      value={housekeepingSettings.tempFileCleanupHours}
                      onChange={(e) => setHousekeepingSettings(prev => ({ ...prev, tempFileCleanupHours: parseInt(e.target.value) }))}
                      min="1"
                      max="72"
                    />
                    <p className="text-sm text-muted-foreground">Remove temporary files older than this many hours</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orphanedMediaCleanupDays">Orphaned Media Cleanup (days)</Label>
                    <Input
                      id="orphanedMediaCleanupDays"
                      type="number"
                      value={housekeepingSettings.orphanedMediaCleanupDays}
                      onChange={(e) => setHousekeepingSettings(prev => ({ ...prev, orphanedMediaCleanupDays: parseInt(e.target.value) }))}
                      min="1"
                      max="30"
                    />
                    <p className="text-sm text-muted-foreground">Remove orphaned media files older than this many days</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableDatabaseVacuum"
                      checked={housekeepingSettings.enableDatabaseVacuum}
                      onCheckedChange={(checked) => setHousekeepingSettings(prev => ({ ...prev, enableDatabaseVacuum: checked }))}
                    />
                    <Label htmlFor="enableDatabaseVacuum">Database Vacuum</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Optimize database performance through vacuuming</p>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableStatCleanup"
                      checked={housekeepingSettings.enableStatCleanup}
                      onCheckedChange={(checked) => setHousekeepingSettings(prev => ({ ...prev, enableStatCleanup: checked }))}
                    />
                    <Label htmlFor="enableStatCleanup">Statistics Cleanup</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Clean up old performance statistics and metrics</p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setHousekeepingSettings({
                  intervalHours: 24,
                  archiveCleanupDays: 30,
                  logCleanupDays: 7,
                  tempFileCleanupHours: 2,
                  orphanedMediaCleanupDays: 3,
                  enableDatabaseVacuum: true,
                  enableStatCleanup: true
                })}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button onClick={handleSaveHousekeepingSettings} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Housekeeping Settings
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Queue Overrides Tab */}
          <TabsContent value="queues" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Per-Queue Configuration Overrides</h3>
                <Badge variant="outline">Override global defaults</Badge>
              </div>

              <div className="space-y-4">
                {Object.entries(queueOverrides).map(([queueName, config]) => (
                  <Card key={queueName}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{queueName}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={config.enabled}
                            onCheckedChange={(checked) => 
                              setQueueOverrides(prev => ({
                                ...prev,
                                [queueName]: { ...prev[queueName], enabled: checked }
                              }))
                            }
                          />
                          <Badge variant={config.enabled ? "default" : "secondary"}>
                            {config.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Max Retries</Label>
                        <Input
                          type="number"
                          value={config.maxRetries}
                          onChange={(e) => 
                            setQueueOverrides(prev => ({
                              ...prev,
                              [queueName]: { ...prev[queueName], maxRetries: parseInt(e.target.value) }
                            }))
                          }
                          min="0"
                          max="10"
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Timeout (ms)</Label>
                        <Input
                          type="number"
                          value={config.timeoutMs}
                          onChange={(e) => 
                            setQueueOverrides(prev => ({
                              ...prev,
                              [queueName]: { ...prev[queueName], timeoutMs: parseInt(e.target.value) }
                            }))
                          }
                          min="10000"
                          max="3600000"
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Priority</Label>
                        <Input
                          type="number"
                          value={config.priority}
                          onChange={(e) => 
                            setQueueOverrides(prev => ({
                              ...prev,
                              [queueName]: { ...prev[queueName], priority: parseInt(e.target.value) }
                            }))
                          }
                          min="1"
                          max="10"
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Batch Size</Label>
                        <Input
                          type="number"
                          value={(config as any).batchSize || 1}
                          onChange={(e) => 
                            setQueueOverrides(prev => ({
                              ...prev,
                              [queueName]: { ...prev[queueName], batchSize: parseInt(e.target.value) }
                            }))
                          }
                          min="1"
                          max="50"
                          className="h-8"
                          disabled={!('batchSize' in config)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setQueueOverrides({
                  'process-image': { enabled: true, maxRetries: 3, timeoutMs: 300000, priority: 1, batchSize: 5 },
                  'process-video': { enabled: false, maxRetries: 3, timeoutMs: 600000, priority: 2, batchSize: 1 },
                  'process-document': { enabled: false, maxRetries: 3, timeoutMs: 180000, priority: 3, batchSize: 3 },
                  'delete-media': { enabled: true, maxRetries: 3, timeoutMs: 120000, priority: 4, batchSize: 1, gracePeriodHours: 0 },
                  'cleanup-orphaned-media': { enabled: true, maxRetries: 1, timeoutMs: 300000, priority: 5, batchSize: 1 },
                  'send-email': { enabled: false, maxRetries: 3, timeoutMs: 30000, priority: 6, batchSize: 10 },
                  'housekeeping': { enabled: true, maxRetries: 1, timeoutMs: 600000, priority: 7, intervalHours: 24, cleanupTypes: ['archive', 'logs', 'temp'] }
                })}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset All to Defaults
                </Button>
                <Button onClick={handleSaveQueueOverrides} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Queue Overrides
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 