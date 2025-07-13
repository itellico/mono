'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap, 
  Play, 
  Square, 
  RefreshCw, 
  Settings, 
  History, 
  Monitor, 
  FileCode, 
  Rocket,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Trash2,
  Target,
  Gauge,
  Server,
  Code2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { browserLogger } from '@/lib/browser-logger';
import { BuildMetrics } from '@/components/admin/build-system/BuildMetrics';
import { BuildMonitor } from '@/components/admin/build-system/BuildMonitor';

interface BuildTemplate {
  id: string;
  name: string;
  industryType: string;
  version: string;
  lastBuilt?: Date;
  status: 'draft' | 'building' | 'built' | 'error';
  componentsCount: number;
  size?: string;
  performance?: {
    formLoading: string;
    searchExecution: string;
    pageRendering: string;
  };
}

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
  metrics?: {
    componentsGenerated: number;
    totalSize: string;
    optimizationSavings: string;
  };
  artifacts?: {
    forms: number;
    searches: number;
    pages: number;
    totalSize?: string;
  };
}

interface BuildConfig {
  optimization: 'standard' | 'aggressive' | 'minimal';
  caching: boolean;
  minification: boolean;
  treeShaking: boolean;
  sourceMaps: boolean;
  analytics: boolean;
  seo: boolean;
}

/**
 * Build System Admin Interface Component
 * 
 * Provides comprehensive build management capabilities including:
 * - Template selection and configuration
 * - Real-time build monitoring
 * - Build history and analytics
 * - Performance metrics tracking
 * 
 * @component
 * @example
 * ```tsx
 * <BuildSystemPage />
 * ```
 */
export default function BuildSystemPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<BuildTemplate[]>([]);
  const [buildJobs, setBuildJobs] = useState<BuildJob[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('templates');
  const [buildConfig, setBuildConfig] = useState<BuildConfig>({
    optimization: 'standard',
    caching: true,
    minification: true,
    treeShaking: true,
    sourceMaps: false,
    analytics: true,
    seo: true
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    setTemplates([
      {
        id: '1',
        name: 'Modeling Platform',
        industryType: 'modeling',
        version: '1.0.0',
        lastBuilt: new Date(Date.now() - 86400000),
        status: 'built',
        componentsCount: 24,
        size: '156 KB',
        performance: {
          formLoading: '150ms (-85%)',
          searchExecution: '80ms (-78%)',
          pageRendering: '120ms (-82%)'
        }
      },
      {
        id: '2',
        name: 'Photography Studio',
        industryType: 'photography',
        version: '0.9.2',
        status: 'draft',
        componentsCount: 18,
        performance: {
          formLoading: '200ms (-75%)',
          searchExecution: '100ms (-70%)',
          pageRendering: '180ms (-73%)'
        }
      },
      {
        id: '3',
        name: 'Fitness Training',
        industryType: 'fitness',
        version: '1.1.0',
        status: 'building',
        componentsCount: 31,
        size: '203 KB'
      }
    ]);

    setBuildJobs([
      {
        id: 'build-1',
        templateId: '3',
        templateName: 'Fitness Training',
        status: 'running',
        progress: 65,
        startTime: new Date(Date.now() - 180000),
        currentStep: 'Generating form components',
        steps: [
          { id: 'step-1', name: 'Analyze Configuration', status: 'completed', duration: 850 },
          { id: 'step-2', name: 'Generate Forms', status: 'running' },
          { id: 'step-3', name: 'Optimize Components', status: 'pending' },
          { id: 'step-4', name: 'Build Assets', status: 'pending' },
        ],
        logs: [
          {
            timestamp: new Date(Date.now() - 180000),
            level: 'info',
            message: 'Analyzing template configuration...'
          },
          {
            timestamp: new Date(Date.now() - 120000),
            level: 'info',
            message: 'Generating form components (8/12)'
          },
          {
            timestamp: new Date(Date.now() - 60000),
            level: 'info',
            message: 'Optimizing search interfaces...'
          },
          {
            timestamp: new Date(Date.now() - 30000),
            level: 'info',
            message: 'Processing page templates...'
          }
        ],
        artifacts: {
          forms: 8,
          searches: 4,
          pages: 6,
          totalSize: '128 KB'
        }
      },
      {
        id: 'build-2',
        templateId: '1',
        templateName: 'Modeling Platform',
        status: 'completed',
        progress: 100,
        startTime: new Date(Date.now() - 86400000),
        endTime: new Date(Date.now() - 86400000 + 45000),
        duration: '45s',
        steps: [
          { id: 'step-1', name: 'Analyze Configuration', status: 'completed', duration: 1200, artifacts: { generated: 24, optimized: 22, errors: 0 } },
          { id: 'step-2', name: 'Generate Forms', status: 'completed', duration: 15000, artifacts: { generated: 12, optimized: 12, errors: 0 } },
          { id: 'step-3', name: 'Optimize Components', status: 'completed', duration: 8000, artifacts: { generated: 6, optimized: 6, errors: 0 } },
          { id: 'step-4', name: 'Build Assets', status: 'completed', duration: 20800, artifacts: { generated: 8, optimized: 8, errors: 0 } },
        ],
        metrics: {
          componentsGenerated: 24,
          totalSize: '156 KB',
          optimizationSavings: '78%'
        },
        logs: [
          {
            timestamp: new Date(Date.now() - 86400000),
            level: 'success',
            message: 'Build completed successfully'
          },
          {
            timestamp: new Date(Date.now() - 86400000 + 30000),
            level: 'success',
            message: 'Generated 24 optimized components'
          },
          {
            timestamp: new Date(Date.now() - 86400000 + 45000),
            level: 'success',
            message: 'Performance improvement: 5.2x faster'
          }
        ],
        artifacts: {
          forms: 12,
          searches: 6,
          pages: 8,
          totalSize: '156 KB'
        }
      }
    ]);
  }, []);

  const handleBuildTemplate = async (templateId: string) => {
    try {
      browserLogger.userAction('build_system_action', `Starting build for template ${templateId}`);
      
      const response = await fetch(`/api/v1/admin/industry-templates/${templateId}/build`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config: buildConfig }),
      });

      if (!response.ok) {
        throw new Error('Failed to start build');
      }

      const result = await response.json();
      
      toast({
        title: 'Build Started',
        description: `Build job ${result.buildId} has been queued for template.`,
      });

      // Update template status
      setTemplates(prev => prev.map(t => 
        t.id === templateId ? { ...t, status: 'building' } : t
      ));

      // Add new build job
      const newJob: BuildJob = {
        id: result.buildId,
        templateId,
        templateName: templates.find(t => t.id === templateId)?.name || 'Unknown',
        status: 'queued',
        progress: 0,
        startTime: new Date(),
        steps: [],
        logs: [{
          timestamp: new Date(),
          level: 'info',
          message: 'Build queued...'
        }],
      };
      
      setBuildJobs(prev => [newJob, ...prev]);
      
    } catch (error) {
      browserLogger.apiRequest('build_template_error', `Failed to build template ${templateId}: ${error}`);
      toast({
        title: 'Build Failed',
        description: 'Failed to start build. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'built': case 'completed': return 'bg-green-500';
      case 'building': case 'running': return 'bg-blue-500';
      case 'queued': return 'bg-yellow-500';
      case 'error': case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'built': case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'building': case 'running': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'queued': return <Clock className="h-4 w-4" />;
      case 'error': case 'failed': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-8 w-8 text-blue-500" />
            Build System
          </h1>
          <p className="text-muted-foreground">
            High-performance component generation for industry templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600">
            <Gauge className="h-3 w-3 mr-1" />
            3-7x Faster
          </Badge>
          <Badge variant="outline" className="text-blue-600">
            <Server className="h-3 w-3 mr-1" />
            Production Ready
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Monitor
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Config
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Available Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card key={template.id} className="relative">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(template.status)} text-white`}
                        >
                          {getStatusIcon(template.status)}
                          <span className="ml-1 capitalize">{template.status}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Code2 className="h-4 w-4" />
                        <span>{template.industryType} • v{template.version}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Components:</span>
                          <div className="font-medium">{template.componentsCount}</div>
                        </div>
                        {template.size && (
                          <div>
                            <span className="text-muted-foreground">Size:</span>
                            <div className="font-medium">{template.size}</div>
                          </div>
                        )}
                      </div>

                      {template.performance && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-green-600">Performance Gains</Label>
                          <div className="grid gap-1 text-xs">
                            <div className="flex justify-between">
                              <span>Form Loading:</span>
                              <span className="font-medium text-green-600">{template.performance.formLoading}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Search Execution:</span>
                              <span className="font-medium text-green-600">{template.performance.searchExecution}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Page Rendering:</span>
                              <span className="font-medium text-green-600">{template.performance.pageRendering}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <Separator />

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleBuildTemplate(template.id)}
                          disabled={template.status === 'building'}
                          className="flex-1"
                          size="sm"
                        >
                          {template.status === 'building' ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Rocket className="h-4 w-4 mr-2" />
                          )}
                          {template.status === 'building' ? 'Building...' : 'Build'}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitor Tab */}
        <TabsContent value="monitor" className="space-y-6">
          <BuildMonitor 
            buildJobs={buildJobs}
            onCancelBuild={(buildId) => {
              setBuildJobs(prev => prev.map(job => 
                job.id === buildId ? { ...job, status: 'failed' } : job
              ));
              toast({
                title: 'Build Cancelled',
                description: `Build ${buildId} has been cancelled.`,
                variant: 'destructive',
              });
            }}
            onRetryBuild={(buildId) => {
              setBuildJobs(prev => prev.map(job => 
                job.id === buildId ? { ...job, status: 'queued', progress: 0 } : job
              ));
              toast({
                title: 'Build Retrying',
                description: `Build ${buildId} has been queued for retry.`,
              });
            }}
            onViewArtifacts={(buildId) => {
              toast({
                title: 'View Artifacts',
                description: `Opening artifacts for build ${buildId}...`,
              });
            }}
          />
          
          <BuildMetrics 
            metrics={{
              totalBuilds: buildJobs.length,
              successfulBuilds: buildJobs.filter(job => job.status === 'completed').length,
              failedBuilds: buildJobs.filter(job => job.status === 'failed').length,
              averageBuildTime: '2m 15s',
              totalComponentsGenerated: 147,
              averageOptimizationSavings: 76,
              performanceGains: {
                formLoading: 5.2,
                searchExecution: 4.8,
                pageRendering: 6.1,
              },
              resourceUsage: {
                cpu: 35,
                memory: 58,
                storage: '342 MB'
              }
            }}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Build History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {buildJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                        <span className="sr-only">{job.status}</span>
                      </div>
                      <div>
                        <div className="font-medium">{job.templateName}</div>
                        <div className="text-sm text-muted-foreground">{job.id}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm">
                        {job.endTime ? new Date(job.endTime).toLocaleString() : 'In Progress'}
                      </div>
                      {job.duration && (
                        <div className="text-xs text-muted-foreground">Duration: {job.duration}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {job.metrics && (
                        <Badge variant="outline" className="text-green-600">
                          {job.metrics.optimizationSavings} saved
                        </Badge>
                      )}
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Build Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Optimization Level */}
                <div className="space-y-2">
                  <Label htmlFor="optimization">Optimization Level</Label>
                  <Select
                    value={buildConfig.optimization}
                    onValueChange={(value: 'standard' | 'aggressive' | 'minimal') => 
                      setBuildConfig(prev => ({ ...prev, optimization: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal - Fast builds</SelectItem>
                      <SelectItem value="standard">Standard - Balanced</SelectItem>
                      <SelectItem value="aggressive">Aggressive - Max performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Feature Toggles */}
                <div className="space-y-4">
                  <Label>Build Features</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="caching" className="text-sm">Redis Caching</Label>
                      <Switch
                        id="caching"
                        checked={buildConfig.caching}
                        onCheckedChange={(checked) => 
                          setBuildConfig(prev => ({ ...prev, caching: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="minification" className="text-sm">Code Minification</Label>
                      <Switch
                        id="minification"
                        checked={buildConfig.minification}
                        onCheckedChange={(checked) => 
                          setBuildConfig(prev => ({ ...prev, minification: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="treeshaking" className="text-sm">Tree Shaking</Label>
                      <Switch
                        id="treeshaking"
                        checked={buildConfig.treeShaking}
                        onCheckedChange={(checked) => 
                          setBuildConfig(prev => ({ ...prev, treeShaking: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sourcemaps" className="text-sm">Source Maps</Label>
                      <Switch
                        id="sourcemaps"
                        checked={buildConfig.sourceMaps}
                        onCheckedChange={(checked) => 
                          setBuildConfig(prev => ({ ...prev, sourceMaps: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="analytics" className="text-sm">Performance Analytics</Label>
                      <Switch
                        id="analytics"
                        checked={buildConfig.analytics}
                        onCheckedChange={(checked) => 
                          setBuildConfig(prev => ({ ...prev, analytics: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="seo" className="text-sm">SEO Optimization</Label>
                      <Switch
                        id="seo"
                        checked={buildConfig.seo}
                        onCheckedChange={(checked) => 
                          setBuildConfig(prev => ({ ...prev, seo: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Configuration changes will apply to all new builds. Existing builds are not affected.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button>Save Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}