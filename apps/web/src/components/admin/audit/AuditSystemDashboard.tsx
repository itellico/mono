'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuditLogViewer } from './AuditLogViewer';
import { LockManager } from './LockManager';
import { VersionHistoryBrowser } from './VersionHistoryBrowser';
import { UserActivityAnalytics } from './UserActivityAnalytics';
import { 
  Shield, 
  History, 
  Lock, 
  Activity, 
  BarChart3, 
  FileText, 
  Users, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditSystemDashboardProps {
  tenantId?: number;
  className?: string;
}

export function AuditSystemDashboard({ tenantId, className }: AuditSystemDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Audit System Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive monitoring and management of system auditing, versioning, and user activity
            </p>
          </div>
        </div>
        {tenantId && (
          <Badge variant="outline" className="text-sm">
            Tenant ID: {tenantId}
          </Badge>
        )}
      </div>

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="audit-logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Audit Logs</span>
          </TabsTrigger>
          <TabsTrigger value="versions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Versions</span>
          </TabsTrigger>
          <TabsTrigger value="locks" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Locks</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => setActiveTab('audit-logs')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Track Changes</div>
                <p className="text-xs text-muted-foreground">
                  Monitor all system modifications and user actions
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => setActiveTab('versions')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Version History</CardTitle>
                <History className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Browse & Restore</div>
                <p className="text-xs text-muted-foreground">
                  View entity history and restore previous versions
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => setActiveTab('locks')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Locks</CardTitle>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Manage Conflicts</div>
                <p className="text-xs text-muted-foreground">
                  Monitor and resolve record locks
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => setActiveTab('analytics')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Analytics</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Analyze Behavior</div>
                <p className="text-xs text-muted-foreground">
                  Understand user patterns and system usage
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Status
              </CardTitle>
              <CardDescription>
                Current status of audit system components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Audit Logging</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Version Tracking</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Lock Management</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">User Activity Tracking</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Redis Cache</span>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Connection</span>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Background Tasks</span>
                    <Badge variant="default">Running</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cleanup Jobs</span>
                    <Badge variant="default">Scheduled</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div 
                  className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setActiveTab('audit-logs')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium text-sm">View Recent Logs</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Check latest system activities
                  </p>
                </div>

                <div 
                  className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setActiveTab('locks')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4" />
                    <span className="font-medium text-sm">Active Locks</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Monitor current record locks
                  </p>
                </div>

                <div 
                  className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setActiveTab('analytics')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium text-sm">User Activity</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Analyze user engagement
                  </p>
                </div>

                <div 
                  className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setActiveTab('versions')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <History className="h-4 w-4" />
                    <span className="font-medium text-sm">Browse Versions</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    View entity change history
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit-logs">
          <AuditLogViewer tenantId={tenantId} />
        </TabsContent>

        {/* Version History Tab */}
        <TabsContent value="versions">
          <VersionHistoryBrowser tenantId={tenantId} />
        </TabsContent>

        {/* Lock Management Tab */}
        <TabsContent value="locks">
          <LockManager tenantId={tenantId} />
        </TabsContent>

        {/* User Analytics Tab */}
        <TabsContent value="analytics">
          <UserActivityAnalytics tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 