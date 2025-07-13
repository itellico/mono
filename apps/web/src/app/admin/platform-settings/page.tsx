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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { logger } from '@/lib/logger';
import { getPlatformConfig } from '@/lib/platform-config';
import { 
  Settings, 
  Globe, 
  Shield, 
  Database, 
  Mail, 
  Cpu, 
  Layers, 
  Key,
  Monitor,
  Code,
  Zap,
  Languages,
  Upload,
  Palette,
  Workflow,
  GitBranch,
  FileJson,
  Download,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Platform Settings - Admin',
  description: 'Global platform configuration and system settings for super administrators',
};

/**
 * Server Component: Platform Settings Page
 * 
 * ✅ SUPER ADMIN ONLY: Global platform configuration
 * - System-wide settings management
 * - Platform-level feature toggles
 * - Global configuration options
 * - Infrastructure settings
 */

async function PlatformSettingsServerLoader() {
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
    logger.warn('No permissions found for user in platform settings page', { 
      userId: basicUserContext.userId 
    });
    redirect('/unauthorized');
  }

  logger.info('✅ Permissions loaded for platform settings page', {
    userId: basicUserContext.userId,
    permissionCount: userPermissions.permissions.length,
    roles: userPermissions.roles
  });

  return { userPermissions, basicUserContext };
}

function PlatformSettingsLoadingSkeleton() {
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

async function PlatformSettingsServerContent() {
  const { userPermissions, basicUserContext } = await PlatformSettingsServerLoader();
  
  // Load platform configuration
  const platformConfig = getPlatformConfig();

  // Extract key metrics from platform config
  const platformMetrics = {
    totalLocales: platformConfig.i18n.locales.length,
    translationScopes: Object.keys(platformConfig.i18n.translationScopes).length,
    enabledFeatures: Object.entries(platformConfig.features).filter(([_, enabled]) => enabled).length,
    totalFeatures: Object.keys(platformConfig.features).length,
    cacheSettings: platformConfig.performance.caching,
    storageCategories: Object.keys(platformConfig.storage.artworkCategories).length,
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">
          Global platform configuration and system settings for super administrators
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-5 lg:grid-cols-10 gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="localization">Localization</TabsTrigger>
          <TabsTrigger value="models">Data Models</TabsTrigger>
          <TabsTrigger value="tenancy">Multi-Tenancy</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Platform Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Platform Info</CardTitle>
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformConfig.platform.name}</div>
                <p className="text-xs text-muted-foreground">Version {platformConfig.platform.version}</p>
                <Badge variant="outline" className="mt-2">{platformConfig.platform.environment}</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Localization</CardTitle>
                  <Languages className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformMetrics.totalLocales}</div>
                <p className="text-xs text-muted-foreground">Supported locales</p>
                <Badge variant="outline" className="mt-2">{platformMetrics.translationScopes} scopes</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Features</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{platformMetrics.enabledFeatures}/{platformMetrics.totalFeatures}</div>
                <p className="text-xs text-muted-foreground">Features enabled</p>
                <Badge variant="default" className="mt-2">Active</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Multi-Tenancy</CardTitle>
                  <Layers className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{platformConfig.tenancy.isolationLevel}</div>
                <p className="text-xs text-muted-foreground">Isolation level</p>
                <Badge variant="outline" className="mt-2">Configured</Badge>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Settings Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Configuration Overview</CardTitle>
              <CardDescription>Key platform settings at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Core Settings</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API Version</span>
                      <Badge variant="outline">{platformConfig.platform.apiVersion}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Default Locale</span>
                      <Badge variant="outline">{platformConfig.i18n.defaultLocale}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tenant Switching</span>
                      <Badge variant={platformConfig.tenancy.tenantSwitching.enabled ? 'default' : 'secondary'}>
                        {platformConfig.tenancy.tenantSwitching.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Performance Settings</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Translation Cache</span>
                      <Badge variant="outline">{platformMetrics.cacheSettings.translationTTL}s TTL</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Default Page Size</span>
                      <Badge variant="outline">{platformConfig.performance.pagination.defaultPageSize}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Full-Text Search</span>
                      <Badge variant={platformConfig.performance.search.enableFullText ? 'default' : 'secondary'}>
                        {platformConfig.performance.search.enableFullText ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Configuration Tab */}
        <TabsContent value="platform" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Configuration</CardTitle>
              <CardDescription>
                Core platform settings loaded from platform.config.js
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Platform Name</Label>
                  <Input value={platformConfig.platform.name} readOnly />
                </div>
                <div className="space-y-4">
                  <Label>Version</Label>
                  <Input value={platformConfig.platform.version} readOnly />
                </div>
                <div className="space-y-4">
                  <Label>Environment</Label>
                  <Select value={platformConfig.platform.environment} disabled>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <Label>API Version</Label>
                  <Input value={platformConfig.platform.apiVersion} readOnly />
                </div>
              </div>
              
              <Separator />
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-900">Configuration Notice</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      These settings are loaded from platform.config.js and can only be modified by super administrators
                      through the configuration file. Changes require a server restart.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Localization Tab */}
        <TabsContent value="localization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Internationalization & Localization</CardTitle>
              <CardDescription>
                Configure supported languages and translation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Supported Locales</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {platformConfig.i18n.locales.map((locale) => (
                    <div key={locale} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{locale}</span>
                      {locale === platformConfig.i18n.defaultLocale && (
                        <Badge variant="default" className="text-xs">Default</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Translation Scopes</h3>
                <div className="space-y-4">
                  {Object.entries(platformConfig.i18n.translationScopes).map(([key, scope]) => (
                    <Card key={key}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{scope.adminGrouping}</CardTitle>
                          <Badge variant="outline">{key}</Badge>
                        </div>
                        <CardDescription>{scope.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {scope.fields.map((field: string) => (
                            <Badge key={field} variant="secondary">{field}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Data Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Model Configuration</CardTitle>
              <CardDescription>
                Configure categories, tags, and language string settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="categories" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="categories">Categories</TabsTrigger>
                  <TabsTrigger value="tags">Tags</TabsTrigger>
                  <TabsTrigger value="language">Language Strings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="categories" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Maximum Depth</Label>
                      <Input value={platformConfig.models.categories.maxDepth} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Allow Empty Parent</Label>
                      <div className="flex items-center space-x-2">
                        <Switch checked={platformConfig.models.categories.allowEmptyParent} disabled />
                        <span className="text-sm text-muted-foreground">
                          {platformConfig.models.categories.allowEmptyParent ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Translatable Fields</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {platformConfig.models.categories.translatable.map((field: string) => (
                        <Badge key={field} variant="outline">{field}</Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="tags" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Maximum Length</Label>
                      <Input value={platformConfig.models.tags.maxLength} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Allow Spaces</Label>
                      <div className="flex items-center space-x-2">
                        <Switch checked={platformConfig.models.tags.allowSpaces} disabled />
                        <span className="text-sm text-muted-foreground">
                          {platformConfig.models.tags.allowSpaces ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Tag Types</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      {Object.entries(platformConfig.models.tags.types).map(([type, config]: [string, any]) => (
                        <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-medium capitalize">{type}</span>
                            <p className="text-xs text-muted-foreground">{config.description}</p>
                          </div>
                          <div className="w-6 h-6 rounded" style={{ backgroundColor: config.color }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="language" className="space-y-4 mt-6">
                  <div>
                    <Label>Namespaces</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {platformConfig.models.languageStrings.namespaces.map((ns: string) => (
                        <Badge key={ns} variant="secondary">{ns}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pluralization</Label>
                      <div className="flex items-center space-x-2">
                        <Switch checked={platformConfig.models.languageStrings.pluralization.enabled} disabled />
                        <span className="text-sm text-muted-foreground">
                          {platformConfig.models.languageStrings.pluralization.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Contexts</Label>
                      <div className="flex items-center space-x-2">
                        <Switch checked={platformConfig.models.languageStrings.contexts.enabled} disabled />
                        <span className="text-sm text-muted-foreground">
                          {platformConfig.models.languageStrings.contexts.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Multi-Tenancy Tab */}
        <TabsContent value="tenancy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Tenant Configuration</CardTitle>
              <CardDescription>
                Configure tenant isolation and data access policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Isolation Level</Label>
                  <Select value={platformConfig.tenancy.isolationLevel} disabled>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="schema">Schema</SelectItem>
                      <SelectItem value="row">Row</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Currently using {platformConfig.tenancy.isolationLevel}-level isolation
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Scope Priority</Label>
                  <div className="space-y-2">
                    {platformConfig.tenancy.scopePriority.map((scope: string, index: number) => (
                      <div key={scope} className="flex items-center space-x-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="capitalize">{scope}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Tenant Switching</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enabled</Label>
                      <p className="text-sm text-muted-foreground">Allow users to switch between tenants</p>
                    </div>
                    <Switch checked={platformConfig.tenancy.tenantSwitching.enabled} disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Audit Trail</Label>
                      <p className="text-sm text-muted-foreground">Log all tenant switching events</p>
                    </div>
                    <Switch checked={platformConfig.tenancy.tenantSwitching.auditTrail} disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Session Timeout</Label>
                      <p className="text-sm text-muted-foreground">Automatic logout after inactivity</p>
                    </div>
                    <Badge variant="outline">
                      {platformConfig.tenancy.tenantSwitching.sessionTimeout / 1000 / 60} minutes
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Data Isolation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(platformConfig.tenancy.dataIsolation).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Badge variant={value ? 'default' : 'secondary'}>
                        {value ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Enable or disable platform features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(platformConfig.features).map(([key, enabled]) => {
                  const featureName = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^enable/, '')
                    .trim();
                  
                  return (
                    <div key={key} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <Label htmlFor={key} className="text-base font-medium cursor-pointer">
                          {featureName}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {getFeatureDescription(key)}
                        </p>
                      </div>
                      <Switch 
                        id={key}
                        checked={enabled as boolean} 
                        disabled 
                      />
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900">Feature Configuration</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Feature flags can be modified in platform.config.js. Changes require a server restart to take effect.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Storage Tab */}
        <TabsContent value="storage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Storage Configuration</CardTitle>
              <CardDescription>
                Configure file upload paths and artwork categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Upload Paths</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(platformConfig.storage.uploadPaths).map(([key, path]) => (
                    <div key={key} className="space-y-2">
                      <Label>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                      <Input value={path as string} readOnly />
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Artwork Categories</h3>
                <div className="space-y-4">
                  {Object.entries(platformConfig.storage.artworkCategories).map(([key, config]: [string, any]) => (
                    <Card key={key}>
                      <CardHeader>
                        <CardTitle className="text-base capitalize">{key}</CardTitle>
                        <CardDescription>{config.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm">Max Size</Label>
                            <p className="text-sm font-medium">{(config.maxSize / 1024 / 1024).toFixed(0)} MB</p>
                          </div>
                          <div>
                            <Label className="text-sm">Path</Label>
                            <p className="text-sm font-medium">{config.path}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Label className="text-sm">Allowed Types</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {config.allowedTypes.map((type: string) => (
                              <Badge key={type} variant="outline">{type}</Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
                <div className="space-y-4">
                  {Object.entries(platformConfig.storage.security).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {getStorageSecurityDescription(key)}
                        </p>
                      </div>
                      {typeof value === 'boolean' ? (
                        <Switch checked={value} disabled />
                      ) : Array.isArray(value) ? (
                        <Badge variant="outline">{value.length} items</Badge>
                      ) : (
                        <Badge variant="outline">{value}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
              <CardDescription>
                Platform security settings and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Permission Configuration</h3>
                <div className="space-y-4">
                  {Object.entries(platformConfig.security.permissions).map(([key, config]: [string, any]) => (
                    <Card key={key}>
                      <CardHeader>
                        <CardTitle className="text-base">{config.description}</CardTitle>
                        <CardDescription>Permission: {key}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm">Read Access</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {config.read.map((role: string) => (
                                <Badge key={role} variant="secondary">{role}</Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm">Write Access</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {config.write.map((role: string) => (
                                <Badge key={role} variant="secondary">{role}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Audit Trail</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enabled</Label>
                      <p className="text-sm text-muted-foreground">Track all security-related events</p>
                    </div>
                    <Switch checked={platformConfig.security.auditTrail.enabled} disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Retention Period</Label>
                      <p className="text-sm text-muted-foreground">How long to keep audit logs</p>
                    </div>
                    <Badge variant="outline">{platformConfig.security.auditTrail.retentionPeriod}</Badge>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Data Validation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(platformConfig.security.dataValidation).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Switch checked={value as boolean} disabled />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Configuration</CardTitle>
              <CardDescription>
                Caching, pagination, and search settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Caching Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(platformConfig.performance.caching).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label>{key.replace(/TTL$/, ' TTL').replace(/([A-Z])/g, ' $1').trim()}</Label>
                      <div className="flex items-center space-x-2">
                        <Input value={value as number} readOnly className="w-24" />
                        <span className="text-sm text-muted-foreground">seconds</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {((value as number) / 60).toFixed(0)} minutes
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Pagination Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Default Page Size</Label>
                    <Input value={platformConfig.performance.pagination.defaultPageSize} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Page Size</Label>
                    <Input value={platformConfig.performance.pagination.maxPageSize} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Infinite Scroll</Label>
                    <div className="flex items-center space-x-2">
                      <Switch checked={platformConfig.performance.pagination.enableInfiniteScroll} disabled />
                      <span className="text-sm text-muted-foreground">
                        {platformConfig.performance.pagination.enableInfiniteScroll ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Search Configuration</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Full-Text Search</Label>
                      <p className="text-sm text-muted-foreground">Enable database full-text search capabilities</p>
                    </div>
                    <Switch checked={platformConfig.performance.search.enableFullText} disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Faceted Search</Label>
                      <p className="text-sm text-muted-foreground">Enable faceted filtering in search results</p>
                    </div>
                    <Switch checked={platformConfig.performance.search.enableFaceting} disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Max Results</Label>
                      <p className="text-sm text-muted-foreground">Maximum number of search results to return</p>
                    </div>
                    <Badge variant="outline">{platformConfig.performance.search.maxResults}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>External Integrations</CardTitle>
              <CardDescription>
                Configure third-party services and API integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Translation Services</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Translation Services</Label>
                      <p className="text-sm text-muted-foreground">Enable automatic translation services</p>
                    </div>
                    <Switch checked={platformConfig.integrations.translationServices.enabled} disabled />
                  </div>
                  
                  {Object.entries(platformConfig.integrations.translationServices.providers).map(([provider, config]: [string, any]) => (
                    <Card key={provider}>
                      <CardHeader>
                        <CardTitle className="text-base capitalize">{provider} Translate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span>Status</span>
                          <Badge variant={config.enabled ? 'default' : 'secondary'}>
                            {config.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Analytics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Analytics</Label>
                      <p className="text-sm text-muted-foreground">Track platform usage and performance</p>
                    </div>
                    <Switch checked={platformConfig.integrations.analytics.enabled} disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Provider</Label>
                      <p className="text-sm text-muted-foreground">Analytics service provider</p>
                    </div>
                    <Badge variant="outline">{platformConfig.integrations.analytics.provider}</Badge>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Rate Limits (requests per hour)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {Object.entries(platformConfig.api.rateLimit).map(([key, limit]) => (
                        <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="text-sm font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <Badge variant="outline">{limit}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
      
      {/* Export/Import Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Management</CardTitle>
          <CardDescription>
            Export or import platform configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Configuration
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import Configuration
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileJson className="h-4 w-4" />
              View Raw JSON
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-900">Configuration Status</h3>
                <p className="text-sm text-green-700 mt-1">
                  Platform configuration is loaded from platform.config.js. All settings are read-only in this interface.
                  To modify settings, update the configuration file and restart the server.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get feature descriptions
function getFeatureDescription(key: string): string {
  const descriptions: Record<string, string> = {
    enableAutoTranslation: 'Automatically translate content using configured translation services',
    enableTranslationSuggestions: 'Show translation suggestions while editing content',
    enableBulkTranslation: 'Allow bulk translation operations for multiple items',
    enableTranslationExport: 'Export translations to various file formats',
    enableTranslationImport: 'Import translations from external files',
    enableRealTimeCollaboration: 'Enable real-time collaboration features for content editing',
    enableAdvancedFiltering: 'Advanced filtering options in data tables and search',
    enableVersionControl: 'Track version history for content and configuration changes',
    enableAPIAccess: 'Enable programmatic access through REST API',
    enableWebhooks: 'Send webhooks for system events to external services',
  };
  
  return descriptions[key] || 'No description available';
}

// Helper function to get storage security descriptions
function getStorageSecurityDescription(key: string): string {
  const descriptions: Record<string, string> = {
    enforcePermissions: 'Check user permissions before allowing file access',
    requireAuthentication: 'Require authentication for all file operations',
    allowedExtensions: 'List of allowed file extensions for uploads',
    virusScanning: 'Scan uploaded files for viruses and malware',
    contentTypeValidation: 'Validate file content matches the declared type',
  };
  
  return descriptions[key] || 'Security setting for file operations';
}

/**
 * Server Component: Platform Settings Page
 * Orchestrates server-side loading with comprehensive settings management
 */
export default async function AdminPlatformSettingsPage() {
  return (
    <Suspense fallback={<PlatformSettingsLoadingSkeleton />}>
      <PlatformSettingsServerContent />
    </Suspense>
  );
}