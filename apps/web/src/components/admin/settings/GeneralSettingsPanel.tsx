'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  SettingsIcon, 
  InfoIcon,
  CheckCircleIcon,
  ServerIcon,
  DatabaseIcon,
  GlobeIcon
} from 'lucide-react';

export function GeneralSettingsPanel() {
  return (
    <div className="space-y-6">
      {/* Platform Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <InfoIcon className="h-5 w-5" />
            Platform Information
          </CardTitle>
          <CardDescription>
            Basic information about the mono platform instance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Platform Name</label>
                <p className="text-base">itellico Mono</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Environment</label>
                <div className="flex items-center gap-2">
                  <Badge variant={process.env.NODE_ENV === 'production' ? 'default' : 'secondary'}>
                    {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Version</label>
                <p className="text-base">3.2.0</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Primary Domain</label>
                <p className="text-base">itellico.com</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Database</label>
                <div className="flex items-center gap-2">
                  <DatabaseIcon className="h-4 w-4 text-green-500" />
                  <span className="text-base">PostgreSQL (Connected)</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Default Timezone</label>
                <p className="text-base">{process.env.DEFAULT_TIMEZONE || 'Europe/Vienna'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServerIcon className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Current status of platform services and integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">Database</p>
                <p className="text-sm text-muted-foreground">PostgreSQL</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <Badge variant="outline" className="text-green-600">Healthy</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">Authentication</p>
                <p className="text-sm text-muted-foreground">NextAuth.js</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <Badge variant="outline" className="text-green-600">Active</Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">File Storage</p>
                <p className="text-sm text-muted-foreground">Local Storage</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <Badge variant="outline" className="text-green-600">Available</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Configuration Overview
          </CardTitle>
          <CardDescription>
            Current platform configuration summary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              To modify specific settings, use the dedicated tabs above. General platform settings 
              are managed through environment variables and require deployment to change.
            </AlertDescription>
          </Alert>
          
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Multi-tenancy</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tenant Support:</span>
                    <Badge variant="outline">Enabled</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Default Tenant:</span>
                    <span>mono</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Localization</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Default Locale:</span>
                    <Badge variant="outline">en-US</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supported Locales:</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">en-US</Badge>
                      <Badge variant="outline" className="text-xs">en-GB</Badge>
                      <Badge variant="outline" className="text-xs">de-DE</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Development Information */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Development Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <strong>Current Phase:</strong> 3.2 - User Management
            </div>
            <div>
              <strong>Admin System:</strong> Fully operational
            </div>
            <div>
              <strong>Site Settings:</strong> Database-driven configuration
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 