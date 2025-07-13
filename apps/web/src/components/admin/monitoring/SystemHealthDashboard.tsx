'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Server, 
  Database,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Zap,
  Globe
} from 'lucide-react';

interface SystemHealthMetrics {
  overallHealth: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastUpdated: string;
  services: ServiceHealth[];
  performance: PerformanceMetrics;
  resources: ResourceUsage;
  errors: ErrorMetrics;
}

interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  uptime: number;
  lastCheck: string;
  endpoint: string;
  dependsOn: string[];
  criticalIssues: number;
}

interface PerformanceMetrics {
  apiResponseTime: {
    avg: number;
    p95: number;
    p99: number;
    trend: 'up' | 'down' | 'stable';
  };
  throughput: {
    requestsPerSecond: number;
    peakRps: number;
    trend: 'up' | 'down' | 'stable';
  };
  errorRate: {
    current: number;
    average: number;
    trend: 'up' | 'down' | 'stable';
  };
}

interface ResourceUsage {
  cpu: {
    usage: number;
    cores: number;
    load: number[];
  };
  memory: {
    used: number;
    total: number;
    cached: number;
  };
  disk: {
    used: number;
    total: number;
    inodes: number;
  };
  network: {
    inbound: number;
    outbound: number;
    connections: number;
  };
}

interface ErrorMetrics {
  total24h: number;
  critical: number;
  warnings: number;
  recentErrors: RecentError[];
}

interface RecentError {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'critical';
  service: string;
  message: string;
  count: number;
  resolved: boolean;
}

/**
 * SystemHealthDashboard - Comprehensive system monitoring dashboard providing
 * real-time health metrics, performance insights, and operational monitoring
 * 
 * @component
 * @example
 * ```tsx
 * <SystemHealthDashboard />
 * ```
 */
export function SystemHealthDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch system health metrics
  const { data: healthMetrics, isLoading: healthLoading } = useQuery<SystemHealthMetrics>({
    queryKey: ['system-health', selectedTimeRange],
    queryFn: async () => {
      // Mock data for demonstration
      return {
        overallHealth: 'healthy' as const,
        uptime: 99.97,
        lastUpdated: new Date().toISOString(),
        services: [
          {
            name: 'API Gateway',
            status: 'up' as const,
            responseTime: 245,
            uptime: 99.98,
            lastCheck: new Date().toISOString(),
            endpoint: '/api/v1/public/health',
            dependsOn: ['Database', 'Redis'],
            criticalIssues: 0
          },
          {
            name: 'Database',
            status: 'up' as const,
            responseTime: 12,
            uptime: 99.99,
            lastCheck: new Date().toISOString(),
            endpoint: 'postgresql://localhost:5432',
            dependsOn: [],
            criticalIssues: 0
          },
          {
            name: 'Redis Cache',
            status: 'up' as const,
            responseTime: 3,
            uptime: 99.95,
            lastCheck: new Date().toISOString(),
            endpoint: 'redis://localhost:6379',
            dependsOn: [],
            criticalIssues: 0
          },
          {
            name: 'File Storage',
            status: 'degraded' as const,
            responseTime: 890,
            uptime: 99.85,
            lastCheck: new Date().toISOString(),
            endpoint: '/storage/health',
            dependsOn: [],
            criticalIssues: 1
          },
          {
            name: 'Email Service',
            status: 'up' as const,
            responseTime: 156,
            uptime: 99.92,
            lastCheck: new Date().toISOString(),
            endpoint: 'smtp://localhost:587',
            dependsOn: [],
            criticalIssues: 0
          }
        ],
        performance: {
          apiResponseTime: {
            avg: 245,
            p95: 450,
            p99: 890,
            trend: 'stable' as const
          },
          throughput: {
            requestsPerSecond: 125,
            peakRps: 234,
            trend: 'up' as const
          },
          errorRate: {
            current: 0.02,
            average: 0.015,
            trend: 'up' as const
          }
        },
        resources: {
          cpu: {
            usage: 42,
            cores: 8,
            load: [0.85, 1.2, 0.95]
          },
          memory: {
            used: 6.2,
            total: 16,
            cached: 2.1
          },
          disk: {
            used: 125,
            total: 500,
            inodes: 85
          },
          network: {
            inbound: 1.2,
            outbound: 2.8,
            connections: 145
          }
        },
        errors: {
          total24h: 23,
          critical: 1,
          warnings: 6,
          recentErrors: [
            {
              id: 'err_001',
              timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              level: 'warning' as const,
              service: 'File Storage',
              message: 'High response time detected',
              count: 1,
              resolved: false
            },
            {
              id: 'err_002',
              timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
              level: 'error' as const,
              service: 'API Gateway',
              message: 'Rate limit exceeded for IP 192.168.1.100',
              count: 3,
              resolved: true
            },
            {
              id: 'err_003',
              timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              level: 'warning' as const,
              service: 'Database',
              message: 'Slow query detected: SELECT * FROM large_table',
              count: 1,
              resolved: true
            }
          ]
        }
      };
    },
    staleTime: autoRefresh ? 30 * 1000 : 5 * 60 * 1000,
    refetchInterval: autoRefresh ? 30 * 1000 : false,
  });

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical': return XCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'down': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <Activity className="h-4 w-4 text-blue-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getErrorLevelIcon = (level: string) => {
    switch (level) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (healthLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">System Health</h1>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const degradedServices = healthMetrics?.services.filter(s => s.status === 'degraded' || s.status === 'down').length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time system monitoring and performance insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 text-green-600' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5m">Last 5 minutes</SelectItem>
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* System Status Alert */}
      {degradedServices > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Service Degradation Detected:</strong> {degradedServices} service(s) are experiencing issues.
          </AlertDescription>
        </Alert>
      )}

      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(getHealthIcon(healthMetrics?.overallHealth || 'healthy'), {
              className: `h-6 w-6 ${getHealthColor(healthMetrics?.overallHealth || 'healthy')}`
            })}
            System Status: {healthMetrics?.overallHealth || 'Loading...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground">System Uptime</div>
              <div className="text-2xl font-bold">{healthMetrics?.uptime}%</div>
              <Progress value={healthMetrics?.uptime} className="mt-2" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Services Online</div>
              <div className="text-2xl font-bold">
                {healthMetrics?.services.filter(s => s.status === 'up').length || 0}/
                {healthMetrics?.services.length || 0}
              </div>
              <Progress 
                value={((healthMetrics?.services.filter(s => s.status === 'up').length || 0) / (healthMetrics?.services.length || 1)) * 100} 
                className="mt-2" 
              />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Last Updated</div>
              <div className="text-lg font-bold">
                {healthMetrics?.lastUpdated && 
                  new Date(healthMetrics.lastUpdated).toLocaleTimeString()
                }
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Auto-refresh {autoRefresh ? 'enabled' : 'disabled'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="services" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {healthMetrics?.services.map((service) => (
              <Card key={service.name}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Server className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">{service.endpoint}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(service.status)}>
                        {service.status}
                      </Badge>
                      {service.criticalIssues > 0 && (
                        <Badge variant="destructive">
                          {service.criticalIssues} issue(s)
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Response Time</div>
                      <div className="text-xl font-bold">{service.responseTime}ms</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Uptime</div>
                      <div className="text-xl font-bold">{service.uptime}%</div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm text-muted-foreground mb-2">Service Health</div>
                    <Progress value={service.uptime} className="h-2" />
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Last check: {new Date(service.lastCheck).toLocaleTimeString()}
                  </div>
                  
                  {service.dependsOn.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm text-muted-foreground mb-1">Dependencies</div>
                      <div className="flex flex-wrap gap-1">
                        {service.dependsOn.map((dep) => (
                          <Badge key={dep} variant="outline" className="text-xs">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  API Response Time
                  {getTrendIcon(healthMetrics?.performance.apiResponseTime.trend || 'stable')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Average</div>
                  <div className="text-2xl font-bold">{healthMetrics?.performance.apiResponseTime.avg}ms</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">95th percentile</div>
                    <div className="text-lg font-bold">{healthMetrics?.performance.apiResponseTime.p95}ms</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">99th percentile</div>
                    <div className="text-lg font-bold">{healthMetrics?.performance.apiResponseTime.p99}ms</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Throughput
                  {getTrendIcon(healthMetrics?.performance.throughput.trend || 'stable')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Current RPS</div>
                  <div className="text-2xl font-bold">{healthMetrics?.performance.throughput.requestsPerSecond}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Peak RPS (24h)</div>
                  <div className="text-lg font-bold">{healthMetrics?.performance.throughput.peakRps}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Error Rate
                  {getTrendIcon(healthMetrics?.performance.errorRate.trend || 'stable')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Current</div>
                  <div className="text-2xl font-bold">{(healthMetrics?.performance.errorRate.current || 0) * 100}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">24h Average</div>
                  <div className="text-lg font-bold">{(healthMetrics?.performance.errorRate.average || 0) * 100}%</div>
                </div>
                <Progress value={(healthMetrics?.performance.errorRate.current || 0) * 100} className="h-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Current Usage</span>
                    <span className="font-bold">{healthMetrics?.resources.cpu.usage}%</span>
                  </div>
                  <Progress value={healthMetrics?.resources.cpu.usage} className="h-3" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Cores</div>
                    <div className="text-lg font-bold">{healthMetrics?.resources.cpu.cores}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Load Average</div>
                    <div className="text-lg font-bold">
                      {healthMetrics?.resources.cpu.load.join(', ')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Memory Used</span>
                    <span className="font-bold">
                      {healthMetrics?.resources.memory.used}GB / {healthMetrics?.resources.memory.total}GB
                    </span>
                  </div>
                  <Progress 
                    value={((healthMetrics?.resources.memory.used || 0) / (healthMetrics?.resources.memory.total || 1)) * 100} 
                    className="h-3" 
                  />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Cached</div>
                  <div className="text-lg font-bold">{healthMetrics?.resources.memory.cached}GB</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Disk Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Disk Used</span>
                    <span className="font-bold">
                      {healthMetrics?.resources.disk.used}GB / {healthMetrics?.resources.disk.total}GB
                    </span>
                  </div>
                  <Progress 
                    value={((healthMetrics?.resources.disk.used || 0) / (healthMetrics?.resources.disk.total || 1)) * 100} 
                    className="h-3" 
                  />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Inodes Used</div>
                  <div className="text-lg font-bold">{healthMetrics?.resources.disk.inodes}%</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Network Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Inbound</div>
                    <div className="text-lg font-bold">{healthMetrics?.resources.network.inbound} MB/s</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Outbound</div>
                    <div className="text-lg font-bold">{healthMetrics?.resources.network.outbound} MB/s</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Active Connections</div>
                  <div className="text-lg font-bold">{healthMetrics?.resources.network.connections}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Errors (24h)</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthMetrics?.errors.total24h}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{healthMetrics?.errors.critical}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warnings</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{healthMetrics?.errors.warnings}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {healthMetrics?.errors.recentErrors.filter(e => e.resolved).length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthMetrics?.errors.recentErrors.map((error) => (
                  <div key={error.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getErrorLevelIcon(error.level)}
                      <div>
                        <div className="font-medium">{error.service}</div>
                        <div className="text-sm text-muted-foreground">{error.message}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(error.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {error.count > 1 && (
                        <Badge variant="outline">
                          {error.count}x
                        </Badge>
                      )}
                      {error.resolved ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          Open
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 