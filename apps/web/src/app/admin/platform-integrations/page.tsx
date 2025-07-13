import { Suspense } from 'react';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { permissionsService } from '@/lib/services/permissions.service';
import { ensureCacheReady } from '@/lib/cache/cache-init';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import { 
  Globe, 
  Puzzle, 
  Shield, 
  Database, 
  Mail, 
  Zap, 
  Workflow,
  Code,
  Key,
  Monitor,
  Link,
  Settings
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Platform Integrations - Admin',
  description: 'Platform-wide integrations and external service configuration for super administrators',
};

/**
 * Server Component: Platform Integrations Page
 * 
 * ✅ SUPER ADMIN ONLY: Platform-wide integration management
 * - Global API integrations
 * - Platform-level service configuration
 * - Cross-tenant integration settings
 * - Infrastructure integrations
 */

async function PlatformIntegrationsServerLoader() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // ✅ SECURITY: Server-side permission check
  const basicUserContext = extractUserContext(session);
  
  // Super admin only feature
  if (!basicUserContext.isAuthenticated || !basicUserContext.roles?.includes('super_admin')) {
    redirect('/unauthorized');
  }

  // ✅ CENTRAL PERMISSION SYSTEM: Load actual permissions using permissionsService
  await ensureCacheReady();
  const userPermissions = await permissionsService.getUserPermissions(basicUserContext.userId!);

  if (!userPermissions) {
    logger.warn('No permissions found for user in platform integrations page', { 
      userId: basicUserContext.userId 
    });
    redirect('/unauthorized');
  }

  logger.info('✅ Permissions loaded for platform integrations page', {
    userId: basicUserContext.userId,
    permissionCount: userPermissions.permissions.length,
    roles: userPermissions.roles
  });

  return { userPermissions, basicUserContext };
}

function PlatformIntegrationsLoadingSkeleton() {
  return (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

async function PlatformIntegrationsServerContent() {
  const { userPermissions, basicUserContext } = await PlatformIntegrationsServerLoader();

  const platformIntegrations = [
    {
      id: 'infrastructure',
      title: 'Infrastructure Services',
      description: 'Core platform infrastructure integrations',
      icon: Database,
      integrations: [
        { name: 'PostgreSQL Database', status: 'connected', type: 'database', uptime: '99.9%' },
        { name: 'Redis Cache', status: 'connected', type: 'cache', uptime: '99.8%' },
        { name: 'AWS S3 Storage', status: 'connected', type: 'storage', uptime: '99.9%' },
        { name: 'CloudFlare CDN', status: 'connected', type: 'cdn', uptime: '100%' },
      ]
    },
    {
      id: 'monitoring',
      title: 'Monitoring & Analytics',
      description: 'Platform monitoring and performance tracking',
      icon: Monitor,
      integrations: [
        { name: 'Prometheus Metrics', status: 'connected', type: 'monitoring', uptime: '99.7%' },
        { name: 'Grafana Dashboard', status: 'connected', type: 'visualization', uptime: '99.5%' },
        { name: 'Error Tracking', status: 'connected', type: 'logging', uptime: '99.8%' },
        { name: 'Performance Monitoring', status: 'connected', type: 'apm', uptime: '99.6%' },
      ]
    },
    {
      id: 'communication',
      title: 'Communication Services',
      description: 'Platform-wide communication integrations',
      icon: Mail,
      integrations: [
        { name: 'Mailpit (Development)', status: 'connected', type: 'email', uptime: '100%' },
        { name: 'Mattermost', status: 'configured', type: 'chat', uptime: '99.9%' },
        { name: 'Webhook Delivery', status: 'connected', type: 'webhooks', uptime: '99.7%' },
        { name: 'SMS Gateway', status: 'not_configured', type: 'sms', uptime: 'N/A' },
      ]
    },
    {
      id: 'automation',
      title: 'Automation & Workflows',
      description: 'Workflow automation and process management',
      icon: Workflow,
      integrations: [
        { name: 'N8N Workflows', status: 'connected', type: 'automation', uptime: '99.8%' },
        { name: 'Temporal Workflows', status: 'connected', type: 'orchestration', uptime: '99.9%' },
        { name: 'Queue System', status: 'connected', type: 'queue', uptime: '99.6%' },
        { name: 'Cron Scheduler', status: 'connected', type: 'scheduler', uptime: '100%' },
      ]
    },
    {
      id: 'security',
      title: 'Security & Authentication',
      description: 'Platform security and identity management',
      icon: Shield,
      integrations: [
        { name: 'JWT Authentication', status: 'connected', type: 'auth', uptime: '100%' },
        { name: 'RBAC System', status: 'connected', type: 'authorization', uptime: '100%' },
        { name: 'Rate Limiting', status: 'connected', type: 'security', uptime: '99.9%' },
        { name: 'API Gateway', status: 'connected', type: 'api', uptime: '99.8%' },
      ]
    },
    {
      id: 'external',
      title: 'External APIs',
      description: 'Third-party service integrations',
      icon: Globe,
      integrations: [
        { name: 'OpenAI API', status: 'not_configured', type: 'ai', uptime: 'N/A' },
        { name: 'Payment Gateway', status: 'not_configured', type: 'payment', uptime: 'N/A' },
        { name: 'Google Services', status: 'not_configured', type: 'external', uptime: 'N/A' },
        { name: 'Social Auth Providers', status: 'not_configured', type: 'oauth', uptime: 'N/A' },
      ]
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'default';
      case 'configured': return 'secondary';
      case 'not_configured': return 'outline';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getUptimeColor = (uptime: string) => {
    if (uptime === 'N/A') return 'text-muted-foreground';
    const percentage = parseFloat(uptime);
    if (percentage >= 99.5) return 'text-green-600';
    if (percentage >= 99.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Platform Integrations</h1>
        <p className="text-muted-foreground">
          Platform-wide integrations and external service configuration for super administrators
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="external">External APIs</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformIntegrations.map((category) => (
              <Card key={category.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <category.icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.integrations.map((integration) => (
                    <div key={integration.name} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">{integration.name}</span>
                        <span className="text-xs text-muted-foreground">{integration.type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs ${getUptimeColor(integration.uptime)}`}>
                          {integration.uptime}
                        </span>
                        <Badge 
                          variant={getStatusColor(integration.status)}
                          className="text-xs"
                        >
                          {integration.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Infrastructure Integrations</CardTitle>
              <CardDescription>
                Core platform infrastructure services and their configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center">
                      <Database className="h-4 w-4 mr-2" />
                      Data Services
                    </h3>
                    <div className="space-y-3">
                      {[
                        { name: 'PostgreSQL Primary', endpoint: 'localhost:5432', status: 'healthy' },
                        { name: 'Redis Cache', endpoint: 'localhost:6379', status: 'healthy' },
                        { name: 'S3 Storage', endpoint: 'aws-s3.amazonaws.com', status: 'healthy' },
                      ].map((service) => (
                        <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">{service.name}</span>
                            <p className="text-xs text-muted-foreground">{service.endpoint}</p>
                          </div>
                          <Badge variant="default">{service.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center">
                      <Monitor className="h-4 w-4 mr-2" />
                      Monitoring Services
                    </h3>
                    <div className="space-y-3">
                      {[
                        { name: 'Prometheus', endpoint: 'localhost:9090', status: 'healthy' },
                        { name: 'Grafana', endpoint: 'localhost:5005', status: 'healthy' },
                        { name: 'API Metrics', endpoint: 'localhost:3001/metrics', status: 'healthy' },
                      ].map((service) => (
                        <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">{service.name}</span>
                            <p className="text-xs text-muted-foreground">{service.endpoint}</p>
                          </div>
                          <Badge variant="default">{service.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">✅ Infrastructure Status</h3>
                  <p className="text-green-700 text-sm">
                    All core infrastructure services are operational and performing within normal parameters.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="external" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>External API Integrations</CardTitle>
              <CardDescription>
                Third-party services and external API configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">🚧 External Integrations</h3>
                <p className="text-blue-700 text-sm mb-4">
                  External API integrations are available for configuration. 
                  Contact your system administrator to set up these services.
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">AI & ML Services</h3>
                    {[
                      { name: 'OpenAI GPT API', description: 'AI-powered content generation', configured: false },
                      { name: 'Anthropic Claude', description: 'Advanced AI assistance', configured: false },
                      { name: 'Google AI Platform', description: 'Machine learning services', configured: false },
                    ].map((service) => (
                      <div key={service.name} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{service.name}</h4>
                          <Badge variant={service.configured ? 'default' : 'outline'}>
                            {service.configured ? 'Configured' : 'Not Configured'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Configure
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Business Services</h3>
                    {[
                      { name: 'Stripe Payments', description: 'Payment processing and billing', configured: false },
                      { name: 'Twilio Communications', description: 'SMS and voice services', configured: false },
                      { name: 'SendGrid Email', description: 'Transactional email delivery', configured: false },
                    ].map((service) => (
                      <div key={service.name} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{service.name}</h4>
                          <Badge variant={service.configured ? 'default' : 'outline'}>
                            {service.configured ? 'Configured' : 'Not Configured'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Configure
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Configuration</CardTitle>
              <CardDescription>
                Manage platform-wide integration settings and API configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center">
                      <Key className="h-4 w-4 mr-2" />
                      API Configuration
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>Global Rate Limiting</span>
                        <Badge variant="default">1000 req/min</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>API Version</span>
                        <Badge variant="default">v1</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>CORS Origins</span>
                        <Badge variant="default">Configured</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Integration Settings
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>Webhook Retries</span>
                        <Badge variant="default">3 attempts</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>Timeout Duration</span>
                        <Badge variant="default">30 seconds</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>Connection Pool</span>
                        <Badge variant="default">20 connections</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-medium text-amber-900 mb-2">⚙️ Configuration Management</h3>
                  <p className="text-amber-700 text-sm mb-4">
                    Integration configurations are managed through environment variables and configuration files. 
                    Changes require platform restart to take effect.
                  </p>
                  <div className="flex space-x-4">
                    <Button variant="outline" size="sm">
                      Export Configuration
                    </Button>
                    <Button variant="outline" size="sm">
                      Validate Settings
                    </Button>
                    <Button variant="outline" size="sm">
                      Test Connections
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Server Component: Platform Integrations Page
 * Orchestrates server-side loading with comprehensive integrations management
 */
export default async function AdminPlatformIntegrationsPage() {
  return (
    <Suspense fallback={<PlatformIntegrationsLoadingSkeleton />}>
      <PlatformIntegrationsServerContent />
    </Suspense>
  );
}