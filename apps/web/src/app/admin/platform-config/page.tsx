'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Cog, 
  Languages, 
  Database, 
  Shield, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Globe,
  Lock,
  Gauge,
  Flag
} from 'lucide-react';

// Import platform configuration via wrapper for client compatibility
import { getPlatformConfig } from '@/lib/platform-config';
const platformConfig = getPlatformConfig();

interface ConfigSectionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  badge?: string;
}

function ConfigSection({ title, description, icon: Icon, children, badge }: ConfigSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
          {badge && <Badge variant="secondary">{badge}</Badge>}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

interface TranslationScopeCardProps {
  scope: string;
  config: any;
}

function TranslationScopeCard({ scope, config }: TranslationScopeCardProps) {
  const icons = {
    categories: Database,
    tags: Settings,
    models: Database,
    ui: Globe,
    workflows: Zap,
    emails: Languages,
    legal: Shield,
    help: Languages
  };

  const Icon = icons[scope as keyof typeof icons] || Settings;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" />
          {config.adminGrouping}
        </CardTitle>
        <CardDescription className="text-sm">
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Scope:</span>
            <Badge variant="outline">{config.scope}</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Group By:</span>
            <Badge variant="outline">{config.groupBy}</Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fields:</span>
            <span className="text-xs text-right">{config.fields.length} fields</span>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Translatable Fields:</div>
          <div className="flex flex-wrap gap-1">
            {config.fields.slice(0, 3).map((field: string) => (
              <Badge key={field} variant="secondary" className="text-xs">
                {field}
              </Badge>
            ))}
            {config.fields.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{config.fields.length - 3} more
              </Badge>
            )}
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <strong>Key Pattern:</strong> {config.translationKey}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlatformConfigPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Platform Configuration</h1>
        <p className="text-muted-foreground">
          Super administrator platform settings that control core system behavior, translation scopes, and model definitions.
        </p>
        
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            <strong>Super Admin Only:</strong> These settings affect the entire platform and can only be modified by super administrators.
            Changes to these configurations may require system restart.
          </AlertDescription>
        </Alert>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="i18n">Translations</TabsTrigger>
          <TabsTrigger value="models">Data Models</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ConfigSection
              title="Platform Information"
              description="Core platform metadata and environment configuration"
              icon={Cog}
            >
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Name:</span>
                  <span className="font-medium">{platformConfig.platform.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version:</span>
                  <Badge variant="outline">{platformConfig.platform.version}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Environment:</span>
                  <Badge variant={platformConfig.platform.environment === 'production' ? 'default' : 'secondary'}>
                    {platformConfig.platform.environment}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API Version:</span>
                  <Badge variant="outline">{platformConfig.platform.apiVersion}</Badge>
                </div>
              </div>
            </ConfigSection>

            <ConfigSection
              title="Internationalization"
              description="Global translation and localization settings"
              icon={Languages}
            >
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Default Locale:</span>
                  <Badge variant="default">{platformConfig.i18n.defaultLocale}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supported Locales:</span>
                  <span className="font-medium">{platformConfig.i18n.locales.length} languages</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Translation Scopes:</span>
                  <span className="font-medium">{Object.keys(platformConfig.i18n.translationScopes).length} scopes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fallback Locale:</span>
                  <Badge variant="outline">{platformConfig.i18n.fallbackLocale}</Badge>
                </div>
              </div>
            </ConfigSection>

            <ConfigSection
              title="Multi-Tenancy"
              description="Tenant isolation and data separation configuration"
              icon={Database}
            >
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Isolation Level:</span>
                  <Badge variant="default">{platformConfig.tenancy.isolationLevel}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custom Translations:</span>
                  <Badge variant={platformConfig.tenancy.allowCustomTranslations ? 'default' : 'secondary'}>
                    {platformConfig.tenancy.allowCustomTranslations ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenant Switching:</span>
                  <Badge variant={platformConfig.tenancy.tenantSwitching.enabled ? 'default' : 'secondary'}>
                    {platformConfig.tenancy.tenantSwitching.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </ConfigSection>

            <ConfigSection
              title="Performance"
              description="Caching, pagination, and performance optimization settings"
              icon={Gauge}
            >
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Translation Cache TTL:</span>
                  <span className="font-medium">{platformConfig.performance.caching.translationTTL}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Default Page Size:</span>
                  <span className="font-medium">{platformConfig.performance.pagination.defaultPageSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full-Text Search:</span>
                  <Badge variant={platformConfig.performance.search.enableFullText ? 'default' : 'secondary'}>
                    {platformConfig.performance.search.enableFullText ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </ConfigSection>
          </div>
        </TabsContent>

        {/* I18n Tab */}
        <TabsContent value="i18n" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Translation Scopes</h3>
                <p className="text-sm text-muted-foreground">
                  Configure how translations are organized and grouped in the admin interface
                </p>
              </div>
              <Badge variant="outline">
                {Object.keys(platformConfig.i18n.translationScopes).length} scopes configured
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(platformConfig.i18n.translationScopes).map(([scope, config]) => (
                <TranslationScopeCard key={scope} scope={scope} config={config} />
              ))}
            </div>

            <Separator />

            <ConfigSection
              title="Supported Languages"
              description="Locales available for translation across the platform"
              icon={Globe}
            >
              <div className="flex flex-wrap gap-2">
                {platformConfig.i18n.locales.map((locale: string) => (
                  <Badge 
                    key={locale} 
                    variant={locale === platformConfig.i18n.defaultLocale ? 'default' : 'secondary'}
                  >
                    {locale}
                    {locale === platformConfig.i18n.defaultLocale && ' (default)'}
                  </Badge>
                ))}
              </div>
            </ConfigSection>
          </div>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(platformConfig.models).map(([modelName, config]: [string, any]) => (
              <ConfigSection
                key={modelName}
                title={`${modelName.charAt(0).toUpperCase() + modelName.slice(1)} Model`}
                description={`Configuration for ${modelName} data model and validation rules`}
                icon={Database}
              >
                <div className="space-y-3">
                  {config.translatable && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Translatable Fields:</div>
                      <div className="flex flex-wrap gap-1">
                        {config.translatable.map((field: string) => (
                          <Badge key={field} variant="secondary" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {config.scopes && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Scopes:</div>
                      <div className="flex gap-1">
                        {config.scopes.map((scope: string) => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {config.validation && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Validation Rules:</div>
                      <div className="text-xs text-muted-foreground">
                        {Object.keys(config.validation).length} field(s) with validation
                      </div>
                    </div>
                  )}
                </div>
              </ConfigSection>
            ))}
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <ConfigSection
            title="Permission Configuration"
            description="Access control and permission settings for platform features"
            icon={Shield}
          >
            <div className="space-y-4">
              {Object.entries(platformConfig.security.permissions).map(([permission, config]: [string, any]) => (
                <div key={permission} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                    <div className="text-xs text-muted-foreground">{config.description}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Read: {config.read.join(', ')}</div>
                    <div className="text-xs text-muted-foreground">Write: {config.write.join(', ')}</div>
                  </div>
                </div>
              ))}
            </div>
          </ConfigSection>

          <ConfigSection
            title="Audit Trail"
            description="Security auditing and compliance settings"
            icon={Shield}
          >
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Audit Enabled:</span>
                <Badge variant={platformConfig.security.auditTrail.enabled ? 'default' : 'secondary'}>
                  {platformConfig.security.auditTrail.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Retention Period:</span>
                <span className="font-medium">{platformConfig.security.auditTrail.retentionPeriod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Include IP Address:</span>
                <Badge variant={platformConfig.security.auditTrail.includeIpAddress ? 'default' : 'secondary'}>
                  {platformConfig.security.auditTrail.includeIpAddress ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </ConfigSection>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <ConfigSection
            title="Feature Flags"
            description="Enable or disable platform features and capabilities"
            icon={Flag}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(platformConfig.features).map(([feature, enabled]: [string, any]) => (
                <div key={feature} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                  </div>
                  <Badge variant={enabled ? 'default' : 'secondary'}>
                    {enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              ))}
            </div>
          </ConfigSection>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 pt-6 border-t">
        <Button variant="outline">
          Export Configuration
        </Button>
        <Button>
          Save Changes
        </Button>
      </div>
    </div>
  );
}