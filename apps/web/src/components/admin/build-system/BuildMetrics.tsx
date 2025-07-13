'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  Zap, 
  Target,
  FileCode,
  Server,
  Database,
  Cpu
} from 'lucide-react';

interface BuildMetricsProps {
  metrics: {
    totalBuilds: number;
    successfulBuilds: number;
    failedBuilds: number;
    averageBuildTime: string;
    totalComponentsGenerated: number;
    averageOptimizationSavings: number;
    performanceGains: {
      formLoading: number;
      searchExecution: number;
      pageRendering: number;
    };
    resourceUsage: {
      cpu: number;
      memory: number;
      storage: string;
    };
  };
}

/**
 * Build Metrics Component
 * 
 * Displays comprehensive build system metrics and performance analytics
 * 
 * @component
 * @param {BuildMetricsProps} props - Component properties
 * @example
 * ```tsx
 * <BuildMetrics metrics={buildMetrics} />
 * ```
 */
export function BuildMetrics({ metrics }: BuildMetricsProps) {
  const successRate = (metrics.successfulBuilds / metrics.totalBuilds) * 100;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Build Success Rate */}
      <Card className="col-span-full lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Build Success Rate</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{successRate.toFixed(1)}%</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
            <span>{metrics.successfulBuilds} successful</span>
            <span>•</span>
            <span>{metrics.failedBuilds} failed</span>
          </div>
          <Progress value={successRate} className="mt-3 h-2" />
        </CardContent>
      </Card>

      {/* Average Build Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Build Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.averageBuildTime}</div>
          <div className="flex items-center space-x-1 text-xs text-green-600 mt-2">
            <TrendingDown className="h-3 w-3" />
            <span>12% faster than last month</span>
          </div>
        </CardContent>
      </Card>

      {/* Components Generated */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Components Generated</CardTitle>
          <FileCode className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalComponentsGenerated}</div>
          <div className="flex items-center space-x-1 text-xs text-blue-600 mt-2">
            <TrendingUp className="h-3 w-3" />
            <span>Based on {metrics.totalBuilds} builds</span>
          </div>
        </CardContent>
      </Card>

      {/* Performance Gains Card */}
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Performance Improvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {metrics.performanceGains.formLoading}x
              </div>
              <div className="text-sm text-green-700 font-medium">Form Loading</div>
              <div className="text-xs text-green-600 mt-1">vs Dynamic Rendering</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.performanceGains.searchExecution}x
              </div>
              <div className="text-sm text-blue-700 font-medium">Search Execution</div>
              <div className="text-xs text-blue-600 mt-1">Pre-compiled Queries</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {metrics.performanceGains.pageRendering}x
              </div>
              <div className="text-sm text-purple-700 font-medium">Page Rendering</div>
              <div className="text-xs text-purple-600 mt-1">Static Generation</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Resource Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-orange-500" />
                <span>CPU Usage</span>
              </div>
              <span className="font-medium">{metrics.resourceUsage.cpu}%</span>
            </div>
            <Progress value={metrics.resourceUsage.cpu} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                <span>Memory Usage</span>
              </div>
              <span className="font-medium">{metrics.resourceUsage.memory}%</span>
            </div>
            <Progress value={metrics.resourceUsage.memory} className="h-2" />
          </div>

          <Separator />

          <div className="flex items-center justify-between text-sm">
            <span>Storage Used</span>
            <Badge variant="outline">{metrics.resourceUsage.storage}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Savings */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Optimization Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {metrics.averageOptimizationSavings}%
              </div>
              <div className="text-sm text-muted-foreground">Bundle Size Reduction</div>
              <div className="text-xs text-green-600 mt-1">
                Average across all templates
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                3-7x
              </div>
              <div className="text-sm text-muted-foreground">Performance Boost</div>
              <div className="text-xs text-blue-600 mt-1">
                Compared to dynamic systems
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                ~2min
              </div>
              <div className="text-sm text-muted-foreground">Build Time</div>
              <div className="text-xs text-purple-600 mt-1">
                From template to deployment
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                98%
              </div>
              <div className="text-sm text-muted-foreground">Code Coverage</div>
              <div className="text-xs text-orange-600 mt-1">
                Automated component generation
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 