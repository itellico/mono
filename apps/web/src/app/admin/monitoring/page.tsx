'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle,
  RefreshCw,
  Eye,
  ExternalLink,
  BarChart3,
  Clock,
  Globe,
  Cpu,
  HardDrive,
  Database,
  Network,
  TrendingUp,
  Server,
  Users
} from 'lucide-react';
import { MetricCard } from '@/components/monitoring/MetricCard';
import { ServiceStatusCard } from '@/components/monitoring/ServiceStatusCard';
import { MetricChart } from '@/components/monitoring/MetricChart';
import { MultiMetricChart } from '@/components/monitoring/MultiMetricChart';

// Define service configurations
const SERVICES = [
  {
    name: 'fastify',
    displayName: '🚀 Fastify API Server',
    icon: 'Server',
    url: 'http://localhost:3001',
    metric: 'ms'
  },
  {
    name: 'postgres',
    displayName: '🐘 PostgreSQL Database',
    icon: 'Database',
    url: null,
    metric: ' conn'
  },
  {
    name: 'redis',
    displayName: '⚡ Redis Cache',
    icon: 'Activity',
    url: 'http://localhost:5540',
    metric: '% hit'
  },
  {
    name: 'mailpit',
    displayName: '📧 Mailpit Email',
    icon: 'Mail',
    url: 'http://localhost:8025',
    metric: ' pending'
  },
  {
    name: 'n8n',
    displayName: '🔄 N8N Workflows',
    icon: 'Workflow',
    url: 'http://localhost:5678',
    metric: ' active'
  },
  {
    name: 'temporal',
    displayName: '⏰ Temporal Server',
    icon: 'Clock',
    url: 'http://localhost:8080',
    metric: ' workflows'
  },
  {
    name: 'grafana',
    displayName: '📊 Grafana Dashboard',
    icon: 'BarChart3',
    url: 'http://localhost:3005',
    metric: ''
  },
  {
    name: 'prometheus',
    displayName: '📈 Prometheus Metrics',
    icon: 'Eye',
    url: 'http://localhost:9090',
    metric: ''
  }
];

// Grafana dashboard configurations
const GRAFANA_DASHBOARDS = [
  {
    id: 'overview',
    name: 'Platform Overview',
    description: 'System health, API performance, and business metrics',
    url: 'http://localhost:3005/d/mono-overview/mono-platform-overview?orgId=1&refresh=5s&kiosk'
  },
  {
    id: 'fastify',
    name: 'API Performance',
    description: 'Request rates, response times, and error tracking',
    url: 'http://localhost:3005/d/fastify/fastify-api-metrics?orgId=1&refresh=5s&kiosk'
  },
  {
    id: 'database',
    name: 'Database Metrics',
    description: 'Query performance, connections, and resource usage',
    url: 'http://localhost:3005/d/postgres/postgresql-metrics?orgId=1&refresh=10s&kiosk'
  },
  {
    id: 'redis',
    name: 'Cache Analytics',
    description: 'Hit rates, memory usage, and key statistics',
    url: 'http://localhost:3005/d/redis/redis-metrics?orgId=1&refresh=5s&kiosk'
  }
];

// Define the structure for historical data points
interface HistoricalDataPoint {
  timestamp: string;
  value: number;
}

interface MetricHistory {
  [key: string]: HistoricalDataPoint[];
}

// Chart data interfaces
interface ChartDataPoint {
  time: string;
  value: number;
  timestamp: number;
}

interface MetricHistory {
  responseTime: ChartDataPoint[];
  requestRate: ChartDataPoint[];
  errorRate: ChartDataPoint[];
  cpuUsage: ChartDataPoint[];
  memoryUsage: ChartDataPoint[];
  redisHitRate: ChartDataPoint[];
  dbConnections: ChartDataPoint[];
  throughput: ChartDataPoint[];
}

const MAX_DATA_POINTS = 20;

export default function MonitoringPage() {
  const [loading, setLoading] = React.useState(true);
  const [metrics, setMetrics] = React.useState<any[]>([]);
  const [services, setServices] = React.useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [selectedDashboard, setSelectedDashboard] = React.useState('overview');
  
  // Chart data state
  const [metricHistory, setMetricHistory] = React.useState<MetricHistory>({
    responseTime: [],
    requestRate: [],
    errorRate: [],
    cpuUsage: [],
    memoryUsage: [],
    redisHitRate: [],
    dbConnections: [],
    throughput: []
  });

  // Fetch metrics from API
  React.useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/v1/admin/monitoring/metrics');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMetrics(data.data.metrics);
            
            // Update historical data for key metrics
            const timestamp = Date.now();
            const timeStr = new Date(timestamp).toLocaleTimeString();
            
            // Update metric history with new data points
            setMetricHistory(prev => {
              const newHistory = { ...prev };
              
              // Helper to add data point and trim to MAX_DATA_POINTS
              const addDataPoint = (key: keyof MetricHistory, value: number) => {
                const newPoint: ChartDataPoint = { time: timeStr, value, timestamp };
                newHistory[key] = [...prev[key], newPoint].slice(-MAX_DATA_POINTS);
              };
              
              // Map metrics to history keys
              data.data.metrics.forEach((metric: any) => {
                switch (metric.title) {
                  case 'Fastify Response Time':
                    addDataPoint('responseTime', metric.value);
                    break;
                  case 'Requests/sec':
                    addDataPoint('requestRate', metric.value);
                    break;
                  case 'Error Rate':
                    addDataPoint('errorRate', metric.value);
                    break;
                  case 'CPU Load':
                    addDataPoint('cpuUsage', metric.value);
                    break;
                  case 'Memory Usage':
                    addDataPoint('memoryUsage', metric.value);
                    break;
                  case 'DB Connections':
                    addDataPoint('dbConnections', metric.value);
                    break;
                  case 'Redis Hit Rate':
                    addDataPoint('redisHitRate', metric.value);
                    break;
                  case 'Throughput':
                    addDataPoint('throughput', metric.value);
                    break;
                }
              });
              
              return newHistory;
            });
            
            // Map metrics to services
            const serviceStatus = SERVICES.map(service => {
              let metricValue = 0;
              let status: 'online' | 'offline' | 'degraded' = 'online';
              
              switch (service.name) {
                case 'fastify':
                  metricValue = data.data.metrics.find((m: any) => m.title === 'Fastify Response Time')?.value || 0;
                  status = metricValue < 200 ? 'online' : metricValue < 500 ? 'degraded' : 'offline';
                  break;
                case 'postgres':
                  metricValue = data.data.metrics.find((m: any) => m.title === 'DB Connections')?.value || 0;
                  status = metricValue < 80 ? 'online' : metricValue < 95 ? 'degraded' : 'offline';
                  break;
                case 'redis':
                  metricValue = data.data.metrics.find((m: any) => m.title === 'Redis Hit Rate')?.value || 0;
                  status = metricValue > 80 ? 'online' : metricValue > 60 ? 'degraded' : 'offline';
                  break;
                case 'mailpit':
                  metricValue = data.data.metrics.find((m: any) => m.title === 'Email Queue')?.value || 0;
                  status = metricValue < 50 ? 'online' : metricValue < 100 ? 'degraded' : 'offline';
                  break;
                default:
                  status = 'online';
              }
              
              return {
                ...service,
                status,
                metricValue
              };
            });
            
            setServices(serviceStatus);
            setLastUpdate(new Date(data.data.lastUpdated));
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = autoRefresh ? setInterval(fetchMetrics, 10000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      'Clock': Clock,
      'Globe': Globe,
      'AlertTriangle': AlertTriangle,
      'Cpu': Cpu,
      'HardDrive': HardDrive,
      'Activity': Activity,
      'Database': Database,
      'Network': Network,
      'TrendingUp': TrendingUp,
      'Server': Server,
      'Users': Users
    };
    
    return iconMap[iconName] || Activity;
  };

  const handleServiceClick = (service: any) => {
    if (service.url) {
      window.open(service.url, '_blank');
    }
  };

  const handleDashboardClick = (dashboardId: string) => {
    setSelectedDashboard(dashboardId);
  };

  // Show only key metrics in cards
  const keyMetrics = metrics.slice(0, 8);

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Real-time system performance and health metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 text-green-500" />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 text-green-600' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('http://localhost:3005', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Grafana
          </Button>
        </div>
      </div>

      {/* Alert if services are degraded */}
      {services.some(s => s.status === 'degraded' || s.status === 'offline') && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Service Issues Detected:</strong> Some services are experiencing degraded performance.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {keyMetrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            unit={metric.unit}
            trend={metric.trend}
            status={metric.status}
            icon={getIconComponent(metric.icon)}
          />
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="dashboards">Detailed Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Status */}
            <ServiceStatusCard 
              services={services}
              onServiceClick={handleServiceClick}
            />

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  System Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Platform Health</span>
                      <Badge variant="default" className="bg-green-500">Healthy</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      All critical services operational
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Active Users</span>
                      <span className="font-bold">1,247</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">API Requests (24h)</span>
                      <span className="font-bold">523K</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Cache Hit Rate</span>
                      <span className="font-bold text-green-600">94.7%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Uptime (30d)</span>
                      <span className="font-bold text-green-600">99.97%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MetricChart
              title="API Response Time"
              data={metricHistory.responseTime}
              unit="ms"
              color="#3b82f6"
              type="line"
              height={250}
              domain={[0, 'dataMax']}
            />
            <MetricChart
              title="Request Rate"
              data={metricHistory.requestRate}
              unit="/s"
              color="#10b981"
              type="area"
              height={250}
            />
            <MetricChart
              title="Error Rate"
              data={metricHistory.errorRate}
              unit="%"
              color="#ef4444"
              type="line"
              height={250}
              domain={[0, Math.max(5, 'dataMax' as any)]}
            />
            <MultiMetricChart
              title="System Resources"
              data={metricHistory.cpuUsage.map((cpu, idx) => ({
                time: cpu.time,
                cpu: cpu.value,
                memory: metricHistory.memoryUsage[idx]?.value || 0
              }))}
              metrics={[
                { key: 'cpu', name: 'CPU Usage', color: '#8b5cf6', unit: '%' },
                { key: 'memory', name: 'Memory Usage', color: '#f59e0b', unit: '%' }
              ]}
              height={250}
            />
          </div>

          {/* Additional Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <MetricChart
              title="Redis Cache Hit Rate"
              data={metricHistory.redisHitRate}
              unit="%"
              color="#22c55e"
              type="area"
              height={200}
              domain={[0, 100]}
            />
            <MetricChart
              title="Database Connections"
              data={metricHistory.dbConnections}
              unit=""
              color="#0ea5e9"
              type="line"
              height={200}
              domain={[0, 100]}
            />
            <MetricChart
              title="Network Throughput"
              data={metricHistory.throughput}
              unit=" MB/s"
              color="#a855f7"
              type="area"
              height={200}
            />
          </div>

          {/* Embedded Grafana Overview Dashboard */}
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle>Live Performance Dashboard</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real-time metrics from Grafana
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                src={GRAFANA_DASHBOARDS[0].url}
                width="100%"
                height="540"
                frameBorder="0"
                className="rounded-b-lg"
                title="Platform Overview Dashboard"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <Card key={service.name} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">{service.displayName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <Badge 
                      variant="default" 
                      className={
                        service.status === 'online' ? 'bg-green-500' :
                        service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                      }
                    >
                      {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                    </Badge>
                    {service.metricValue !== undefined && (
                      <span className="text-sm font-medium">
                        {service.metricValue}{service.metric}
                      </span>
                    )}
                  </div>
                  {service.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(service.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Dashboard
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Detailed Analytics Tab */}
        <TabsContent value="dashboards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {GRAFANA_DASHBOARDS.map((dashboard) => (
              <Card
                key={dashboard.id}
                className={`cursor-pointer transition-all ${
                  selectedDashboard === dashboard.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
                }`}
                onClick={() => handleDashboardClick(dashboard.id)}
              >
                <CardHeader>
                  <CardTitle className="text-sm">{dashboard.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {dashboard.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="h-[700px]">
            <CardContent className="p-0">
              <iframe
                src={GRAFANA_DASHBOARDS.find(d => d.id === selectedDashboard)?.url}
                width="100%"
                height="700"
                frameBorder="0"
                className="rounded-lg"
                title="Grafana Dashboard"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}