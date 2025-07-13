"use client";

import React, { Suspense, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PermissionGate } from '@/components/reusable/PermissionGate';
import { AdminOnly } from '@/components/admin/AdminOnly';
import { InfoIcon, SettingsIcon, UploadIcon, GlobeIcon, ShieldIcon, MailIcon, PaletteIcon, BuildingIcon, Activity, TrendingUpIcon, Building2, Crown, DatabaseIcon, Cog } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ContentManagementPanel } from '@/components/admin/settings/ContentManagementPanel';
import { QueueSettingsPanel } from '@/components/admin/settings/QueueSettingsPanel';
import { SuperAdminHierarchicalSettings } from '@/components/admin/settings/SuperAdminHierarchicalSettings';
import { AdminSettingsOverview } from '@/components/admin/settings/AdminSettingsOverview';

// Import individual setting panels
import { GeneralSettingsPanel } from '@/components/admin/settings/GeneralSettingsPanel';
import { UploadSettingsPanel } from '@/components/admin/settings/UploadSettingsPanel';
import { LocalizationSettingsPanel } from '@/components/admin/settings/LocalizationSettingsPanel';
import { SecuritySettingsPanel } from '@/components/admin/settings/SecuritySettingsPanel';
import { EmailSettingsPanel } from '@/components/admin/settings/EmailSettingsPanel';
import { UISettingsPanel } from '@/components/admin/settings/UISettingsPanel';
import { BusinessSettingsPanel } from '@/components/admin/settings/BusinessSettingsPanel';
import { SuperAdminSettings } from '@/components/admin/settings/SuperAdminSettings';
import { AllSettingsListPanel } from '@/components/admin/settings/AllSettingsListPanel';

// Import platform configuration
import { getPlatformConfig } from '@/lib/platform-config';
const platformConfig = getPlatformConfig();

// Loading skeleton for settings panels
function SettingsPanelSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const handleNavigateToTab = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <AdminOnly requiredRole="super_admin">
      <div className="container max-w-7xl mx-auto py-6 px-4">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage platform configuration, administrative settings, and system behavior
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <SettingsIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>

        {/* Important Notice */}
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Super Admin Access:</strong> These settings affect the entire platform. 
            Changes are applied immediately unless otherwise noted. Some settings may require 
            application restart to take effect.
          </AlertDescription>
        </Alert>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-14">
            <TabsTrigger value="overview" className="flex items-center gap-2 border-l-2 border-l-blue-500">
              <TrendingUpIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>

            <PermissionGate action="read" resource="settings" context={{ scope: 'tenant' }} showFallback={false}>
              <TabsTrigger value="all-settings" className="flex items-center gap-2 border-l-2 border-l-green-500">
                <DatabaseIcon className="h-4 w-4" />
                <span className="hidden sm:inline">All Settings</span>
              </TabsTrigger>
            </PermissionGate>

            <PermissionGate action="manage" resource="settings" context={{ scope: 'global' }} showFallback={false}>
              <TabsTrigger value="hierarchical" className="flex items-center gap-2 border-l-2 border-l-red-500">
                <ShieldIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Platform</span>
              </TabsTrigger>
            </PermissionGate>

            <PermissionGate action="manage" resource="settings" context={{ scope: 'global' }} showFallback={false}>
              <TabsTrigger value="platform-config" className="flex items-center gap-2 border-l-2 border-l-purple-500">
                <Cog className="h-4 w-4" />
                <span className="hidden sm:inline">Config JSON</span>
              </TabsTrigger>
            </PermissionGate>

            <PermissionGate action="manage" resource="admin" context={{ scope: 'global' }} showFallback={false}>
              <TabsTrigger value="super-admin" className="flex items-center gap-2 border-l-2 border-l-amber-500">
                <Crown className="h-4 w-4" />
                <span className="hidden sm:inline">Super Admin</span>
              </TabsTrigger>
            </PermissionGate>

            <PermissionGate action="manage" resource="settings" context={{ scope: 'tenant' }} showFallback={false}>
              <TabsTrigger value="general" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
            </PermissionGate>

            <PermissionGate action="manage" resource="media" context={{ scope: 'tenant' }} showFallback={false}>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <UploadIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </TabsTrigger>
            </PermissionGate>

            <PermissionGate action="manage" resource="media" context={{ scope: 'tenant' }} showFallback={false}>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <BuildingIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Content</span>
              </TabsTrigger>
            </PermissionGate>

            <PermissionGate action="manage" resource="queue" context={{ scope: 'global' }} showFallback={false}>
              <TabsTrigger value="queue-config" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Queue Config</span>
              </TabsTrigger>
            </PermissionGate>

            <PermissionGate action="manage" resource="settings" context={{ scope: 'tenant' }} showFallback={false}>
              <TabsTrigger value="localization" className="flex items-center gap-2">
                <GlobeIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Localization</span>
              </TabsTrigger>
            </PermissionGate>

            <PermissionGate action="manage" resource="admin" context={{ scope: 'global' }} showFallback={false}>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <ShieldIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
            </PermissionGate>

            <PermissionGate action="manage" resource="settings" context={{ scope: 'tenant' }} showFallback={false}>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <MailIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Email</span>
              </TabsTrigger>
            </PermissionGate>

            <PermissionGate action="manage" resource="settings" context={{ scope: 'tenant' }} showFallback={false}>
              <TabsTrigger value="ui" className="flex items-center gap-2">
                <PaletteIcon className="h-4 w-4" />
                <span className="hidden sm:inline">UI/UX</span>
              </TabsTrigger>
            </PermissionGate>

            <PermissionGate action="manage" resource="settings" context={{ scope: 'tenant' }} showFallback={false}>
              <TabsTrigger value="business" className="flex items-center gap-2">
                <BuildingIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Business</span>
              </TabsTrigger>
            </PermissionGate>

            <PermissionGate action="manage" resource="admin" context={{ scope: 'global' }} showFallback={false}>
              <TabsTrigger value="tenants" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Tenants</span>
              </TabsTrigger>
            </PermissionGate>
          </TabsList>

          {/* Overview Dashboard */}
          <TabsContent value="overview">
            <Suspense fallback={<SettingsPanelSkeleton />}>
              <AdminSettingsOverview onNavigateToTab={handleNavigateToTab} />
            </Suspense>
          </TabsContent>

          {/* All Settings List */}
          <TabsContent value="all-settings">
            <PermissionGate action="read" resource="settings" context={{ scope: 'tenant' }} fallback={
              <Alert>
                <DatabaseIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Settings Read Access Required:</strong> You need permission to view settings.
                </AlertDescription>
              </Alert>
            }>
              <Suspense fallback={<SettingsPanelSkeleton />}>
                <AllSettingsListPanel />
              </Suspense>
            </PermissionGate>
          </TabsContent>

          {/* Hierarchical Platform Constraints (Super Admin Only) */}
          <TabsContent value="hierarchical">
            <PermissionGate action="manage" resource="settings" context={{ scope: 'global' }} fallback={
              <Alert>
                <ShieldIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Platform Management Required:</strong> You need super admin permissions to access platform-level settings.
                </AlertDescription>
              </Alert>
            }>
              <Suspense fallback={<SettingsPanelSkeleton />}>
                <SuperAdminHierarchicalSettings />
              </Suspense>
            </PermissionGate>
          </TabsContent>

          {/* Platform Configuration JSON */}
          <TabsContent value="platform-config">
            <PermissionGate action="manage" resource="settings" context={{ scope: 'global' }} fallback={
              <Alert>
                <Cog className="h-4 w-4" />
                <AlertDescription>
                  <strong>Platform Configuration Access Required:</strong> You need super admin permissions to view platform configuration.
                </AlertDescription>
              </Alert>
            }>
              <div className="space-y-6">
                <Alert>
                  <Cog className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Platform Configuration:</strong> This shows the current platform.config.js settings that control core system behavior.
                    These settings are read-only and can only be modified by super administrators in the config file.
                  </AlertDescription>
                </Alert>
                
                {/* Platform Information */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium">Platform Information</h3>
                    <p className="text-sm text-muted-foreground">Core platform metadata and environment configuration</p>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform Name:</span>
                        <span className="font-medium">{platformConfig.platform.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Version:</span>
                        <span className="font-medium">{platformConfig.platform.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Environment:</span>
                        <span className="font-medium">{platformConfig.platform.environment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">API Version:</span>
                        <span className="font-medium">{platformConfig.platform.apiVersion}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Default Locale:</span>
                        <span className="font-medium">{platformConfig.i18n.defaultLocale}</span>
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
                        <span className="text-muted-foreground">Tenancy Level:</span>
                        <span className="font-medium">{platformConfig.tenancy.isolationLevel}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Feature Flags */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium">Feature Flags</h3>
                    <p className="text-sm text-muted-foreground">Platform features and capabilities</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-3">
                      {Object.entries(platformConfig.features).map(([feature, enabled]: [string, any]) => (
                        <div key={feature} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm font-medium">
                            {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Translation Scopes Summary */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium">Translation Scopes</h3>
                    <p className="text-sm text-muted-foreground">Configured translation organization</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      {Object.entries(platformConfig.i18n.translationScopes).map(([scope, config]: [string, any]) => (
                        <div key={scope} className="p-3 bg-muted/50 rounded-lg">
                          <div className="font-medium text-sm">{config.adminGrouping}</div>
                          <div className="text-xs text-muted-foreground mt-1">{config.description}</div>
                          <div className="text-xs text-muted-foreground mt-2">
                            <strong>Scope:</strong> {config.scope} | <strong>Fields:</strong> {config.fields.length}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </PermissionGate>
          </TabsContent>

          {/* Super Admin Settings */}
          <TabsContent value="super-admin">
            <PermissionGate action="manage" resource="admin" context={{ scope: 'global' }} fallback={
              <Alert>
                <Crown className="h-4 w-4" />
                <AlertDescription>
                  <strong>Super Admin Required:</strong> You need super admin permissions to access these dangerous settings.
                </AlertDescription>
              </Alert>
            }>
              <Suspense fallback={<SettingsPanelSkeleton />}>
                <SuperAdminSettings />
              </Suspense>
            </PermissionGate>
          </TabsContent>

          {/* General Settings */}
          <TabsContent value="general">
            <PermissionGate action="manage" resource="settings" context={{ scope: 'tenant' }} fallback={
              <Alert>
                <SettingsIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Settings Management Required:</strong> You need permission to manage general settings.
                </AlertDescription>
              </Alert>
            }>
              <Suspense fallback={<SettingsPanelSkeleton />}>
                <GeneralSettingsPanel />
              </Suspense>
            </PermissionGate>
          </TabsContent>

          {/* Upload Settings */}
          <TabsContent value="upload">
            <PermissionGate action="manage" resource="media" context={{ scope: 'tenant' }} fallback={
              <Alert>
                <UploadIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Media Management Required:</strong> You need permission to manage upload settings.
                </AlertDescription>
              </Alert>
            }>
              <Suspense fallback={<SettingsPanelSkeleton />}>
                <UploadSettingsPanel />
              </Suspense>
            </PermissionGate>
          </TabsContent>

          {/* Localization Settings */}
          <TabsContent value="localization">
            <PermissionGate action="manage" resource="settings" context={{ scope: 'tenant' }} fallback={
              <Alert>
                <GlobeIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Settings Management Required:</strong> You need permission to manage localization settings.
                </AlertDescription>
              </Alert>
            }>
              <Suspense fallback={<SettingsPanelSkeleton />}>
                <LocalizationSettingsPanel />
              </Suspense>
            </PermissionGate>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <PermissionGate action="manage" resource="admin" context={{ scope: 'global' }} fallback={
              <Alert>
                <ShieldIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Platform Security Required:</strong> You need super admin permissions to manage security settings.
                </AlertDescription>
              </Alert>
            }>
              <Suspense fallback={<SettingsPanelSkeleton />}>
                <SecuritySettingsPanel />
              </Suspense>
            </PermissionGate>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email">
            <PermissionGate action="manage" resource="settings" context={{ scope: 'tenant' }} fallback={
              <Alert>
                <MailIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Settings Management Required:</strong> You need permission to manage email settings.
                </AlertDescription>
              </Alert>
            }>
              <Suspense fallback={<SettingsPanelSkeleton />}>
                <EmailSettingsPanel />
              </Suspense>
            </PermissionGate>
          </TabsContent>

          {/* UI Settings */}
          <TabsContent value="ui">
            <PermissionGate action="manage" resource="settings" context={{ scope: 'tenant' }} fallback={
              <Alert>
                <PaletteIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Settings Management Required:</strong> You need permission to manage UI/UX settings.
                </AlertDescription>
              </Alert>
            }>
              <Suspense fallback={<SettingsPanelSkeleton />}>
                <UISettingsPanel />
              </Suspense>
            </PermissionGate>
          </TabsContent>

          {/* Business Settings */}
          <TabsContent value="business">
            <PermissionGate action="manage" resource="settings" context={{ scope: 'tenant' }} fallback={
              <Alert>
                <BuildingIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Settings Management Required:</strong> You need permission to manage business settings.
                </AlertDescription>
              </Alert>
            }>
              <Suspense fallback={<SettingsPanelSkeleton />}>
                <BusinessSettingsPanel />
              </Suspense>
            </PermissionGate>
          </TabsContent>

          {/* Content Management */}
          <TabsContent value="content">
            <PermissionGate action="manage" resource="media" context={{ scope: 'tenant' }} fallback={
              <Alert>
                <BuildingIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Media Management Required:</strong> You need permission to manage content settings.
                </AlertDescription>
              </Alert>
            }>
              <Suspense fallback={<SettingsPanelSkeleton />}>
                <ContentManagementPanel />
              </Suspense>
            </PermissionGate>
          </TabsContent>

          {/* Queue Configuration */}
          <TabsContent value="queue-config">
            <PermissionGate action="manage" resource="queue" context={{ scope: 'global' }} fallback={
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  <strong>Platform Management Required:</strong> You need super admin permissions to manage queue configuration.
                </AlertDescription>
              </Alert>
            }>
              <Suspense fallback={<SettingsPanelSkeleton />}>
                <QueueSettingsPanel />
              </Suspense>
            </PermissionGate>
          </TabsContent>
        </Tabs>
      </div>
    </AdminOnly>
  );
} 