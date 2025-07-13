'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Database,
  Settings,
  Shield,
  Calendar,
  HardDrive,
  Play,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuditTracking, usePageTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';
import { BackupQuickActions } from '@/components/admin/backup/BackupQuickActions';
import { BackupHistoryTable } from '@/components/admin/backup/BackupHistoryTable';
import { BackupScheduleManager } from '@/components/admin/backup/BackupScheduleManager';
import { GDPRExportInterface } from '@/components/admin/backup/GDPRExportInterface';
import { BackupStorageConfig } from '@/components/admin/backup/BackupStorageConfig';

/**
 * Comprehensive Backup Management Dashboard
 * Displays all backup types (system + GDPR) with demo data
 * Only PostgreSQL database backups are functional initially
 * 
 * @component
 * @example
 * <BackupManagementPage />
 */
export default function BackupManagementPage() {
  const { trackView } = useAuditTracking();
  usePageTracking('backup_management_dashboard');

  
  const [activeTab, setActiveTab] = useState('quick-actions');

  // Demo statistics data
  const [stats] = useState({
    systemBackups: 1234,
    systemBackupsChange: '+20.1%',
    gdprExports: 89,
    gdprExportsChange: 'This month',
    storageUsed: 847, // GB
    storageTotal: 1000, // GB
    storagePercent: 84.7,
    successRate: 99.2,
    successRateChange: 'Last 30 days',
    lastActivity: '2h ago',
    lastActivityType: 'Database backup'
  });

  useEffect(() => {
    browserLogger.userAction('backup_dashboard_viewed', 'BackupManagementPage');
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    trackView(`backup_${value}_tab`);
    browserLogger.userAction('backup_tab_changed', 'BackupManagementPage', { tab: value });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backup Management</h1>
          <p className="text-muted-foreground">
            Manage system backups and GDPR data exports with automated scheduling
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Activity className="h-3 w-3" />
            <span>Real-time monitoring</span>
          </Badge>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.systemBackups.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.systemBackupsChange} from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GDPR Exports</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.gdprExports}</div>
            <p className="text-xs text-muted-foreground">{stats.gdprExportsChange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.storageUsed} GB</div>
            <Progress value={stats.storagePercent} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.storagePercent}% of {stats.storageTotal} GB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">{stats.successRateChange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lastActivity}</div>
            <p className="text-xs text-muted-foreground">{stats.lastActivityType}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Interface */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="quick-actions" className="flex items-center space-x-2">
            <Play className="h-4 w-4" />
            <span>Quick Actions</span>
          </TabsTrigger>
          <TabsTrigger value="gdpr-exports" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>GDPR Exports</span>
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Schedules</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>History</span>
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center space-x-2">
            <HardDrive className="h-4 w-4" />
            <span>Storage</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Quick Actions Tab */}
        <TabsContent value="quick-actions">
          <BackupQuickActions />
        </TabsContent>

        {/* GDPR Exports Tab */}
        <TabsContent value="gdpr-exports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>GDPR Data Export Interface</span>
              </CardTitle>
              <CardDescription>
                Generate compliant data exports for users, accounts, or tenants in accordance with GDPR Articles 15 & 20
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GDPRExportInterface />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Backup Schedules</span>
              </CardTitle>
              <CardDescription>
                Manage automated backup schedules and GDPR export automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BackupScheduleManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Backup & Export History</span>
              </CardTitle>
              <CardDescription>
                View past backup executions, GDPR exports, and system activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BackupHistoryTable />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Configuration Tab */}
        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HardDrive className="h-5 w-5" />
                <span>Storage Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure backup storage locations and manage retention policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BackupStorageConfig />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Backup System Settings</span>
                </CardTitle>
                <CardDescription>
                  Configure global backup settings and notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive email alerts for backup failures and GDPR requests
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Encryption Settings</h4>
                      <p className="text-sm text-muted-foreground">
                        Manage backup encryption and key rotation
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Retention Policies</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure automatic backup cleanup and archival
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">GDPR Compliance</h4>
                      <p className="text-sm text-muted-foreground">
                        Manage data controller information and legal basis templates
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Current status of backup infrastructure components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">PostgreSQL Connection</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Temporal Workflows</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      Running
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Cloud Storage</span>
                    </div>
                    <Badge variant="outline" className="text-yellow-600">
                      Configuration Required
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Audit Logging</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 