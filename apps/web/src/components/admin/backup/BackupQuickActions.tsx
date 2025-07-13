'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  FolderOpen, 
  Settings, 
  Package, 
  User, 
  Users, 
  Building2, 
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';

/**
 * Backup Quick Actions Component
 * Displays all backup types with functional PostgreSQL database backups
 * Other backup types show demo interface but are not yet functional
 * 
 * @component
 * @example
 * <BackupQuickActions />
 */
export function BackupQuickActions() {
  const { trackClick } = useAuditTracking();
  const [isCreatingBackup, setIsCreatingBackup] = useState<string | null>(null);

  const handleBackupAction = async (backupType: string, isImplemented: boolean = false) => {
    setIsCreatingBackup(backupType);
    trackClick('backup_initiated', { backupType });

    if (isImplemented) {
      // Only PostgreSQL database backup is implemented
      browserLogger.userAction('backup_started', 'BackupQuickActions', { backupType });

      try {
        // TODO: Call the actual backup API endpoint
        const response = await fetch('/api/v1/backup/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backupType })
        });

        if (response.ok) {
          browserLogger.userAction('backup_success', 'BackupQuickActions', { backupType });
        } else {
          browserLogger.userAction('backup_error', 'BackupQuickActions', { backupType, error: 'API call failed' });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        browserLogger.userAction('backup_error', 'BackupQuickActions', { backupType, error: errorMessage });
      }
    } else {
      // Demo action for unimplemented features
      browserLogger.userAction('backup_demo_action', 'BackupQuickActions', { backupType });
      // Simulate delay for demo
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setIsCreatingBackup(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Start backup operations and GDPR exports instantly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* System Backups Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-muted-foreground">SYSTEM BACKUPS</h4>
              <Badge variant="outline" className="text-xs">
                Database backup functional
              </Badge>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Database Backup - FUNCTIONAL */}
              <Button 
                variant="outline" 
                className="h-24 flex-col relative"
                onClick={() => handleBackupAction('database', true)}
                disabled={isCreatingBackup === 'database'}
              >
                <Database className="h-6 w-6 mb-2" />
                <span>Database</span>
                <CheckCircle className="h-3 w-3 absolute top-2 right-2 text-green-500" />
                {isCreatingBackup === 'database' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 animate-spin" />
                      <span className="text-xs">Creating...</span>
                    </div>
                  </div>
                )}
              </Button>

              {/* Media Files Backup - DEMO */}
              <Button 
                variant="outline" 
                className="h-24 flex-col relative opacity-75"
                onClick={() => handleBackupAction('media')}
                disabled={isCreatingBackup === 'media'}
              >
                <FolderOpen className="h-6 w-6 mb-2" />
                <span>Media Files</span>
                <AlertTriangle className="h-3 w-3 absolute top-2 right-2 text-yellow-500" />
                {isCreatingBackup === 'media' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 animate-spin" />
                      <span className="text-xs">Demo...</span>
                    </div>
                  </div>
                )}
              </Button>

              {/* Configuration Backup - DEMO */}
              <Button 
                variant="outline" 
                className="h-24 flex-col relative opacity-75"
                onClick={() => handleBackupAction('configuration')}
                disabled={isCreatingBackup === 'configuration'}
              >
                <Settings className="h-6 w-6 mb-2" />
                <span>Configuration</span>
                <AlertTriangle className="h-3 w-3 absolute top-2 right-2 text-yellow-500" />
                {isCreatingBackup === 'configuration' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 animate-spin" />
                      <span className="text-xs">Demo...</span>
                    </div>
                  </div>
                )}
              </Button>

              {/* Full System Backup - DEMO */}
              <Button 
                variant="outline" 
                className="h-24 flex-col relative opacity-75"
                onClick={() => handleBackupAction('full_system')}
                disabled={isCreatingBackup === 'full_system'}
              >
                <Package className="h-6 w-6 mb-2" />
                <span>Full System</span>
                <AlertTriangle className="h-3 w-3 absolute top-2 right-2 text-yellow-500" />
                {isCreatingBackup === 'full_system' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 animate-spin" />
                      <span className="text-xs">Demo...</span>
                    </div>
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* GDPR Exports Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-muted-foreground">GDPR DATA EXPORTS</h4>
              <Badge variant="outline" className="text-xs">
                Demo interface
              </Badge>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* User Export - DEMO */}
              <Button 
                variant="outline" 
                className="h-24 flex-col relative opacity-75"
                onClick={() => handleBackupAction('user_export')}
                disabled={isCreatingBackup === 'user_export'}
              >
                <User className="h-6 w-6 mb-2" />
                <span>User Export</span>
                <AlertTriangle className="h-3 w-3 absolute top-2 right-2 text-yellow-500" />
                {isCreatingBackup === 'user_export' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 animate-spin" />
                      <span className="text-xs">Demo...</span>
                    </div>
                  </div>
                )}
              </Button>

              {/* Account Export - DEMO */}
              <Button 
                variant="outline" 
                className="h-24 flex-col relative opacity-75"
                onClick={() => handleBackupAction('account_export')}
                disabled={isCreatingBackup === 'account_export'}
              >
                <Users className="h-6 w-6 mb-2" />
                <span>Account Export</span>
                <AlertTriangle className="h-3 w-3 absolute top-2 right-2 text-yellow-500" />
                {isCreatingBackup === 'account_export' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 animate-spin" />
                      <span className="text-xs">Demo...</span>
                    </div>
                  </div>
                )}
              </Button>

              {/* Tenant Export - DEMO */}
              <Button 
                variant="outline" 
                className="h-24 flex-col relative opacity-75"
                onClick={() => handleBackupAction('tenant_export')}
                disabled={isCreatingBackup === 'tenant_export'}
              >
                <Building2 className="h-6 w-6 mb-2" />
                <span>Tenant Export</span>
                <AlertTriangle className="h-3 w-3 absolute top-2 right-2 text-yellow-500" />
                {isCreatingBackup === 'tenant_export' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 animate-spin" />
                      <span className="text-xs">Demo...</span>
                    </div>
                  </div>
                )}
              </Button>

              {/* Custom Export - DEMO */}
              <Button 
                variant="outline" 
                className="h-24 flex-col relative opacity-75"
                onClick={() => handleBackupAction('custom_export')}
                disabled={isCreatingBackup === 'custom_export'}
              >
                <Filter className="h-6 w-6 mb-2" />
                <span>Custom Export</span>
                <AlertTriangle className="h-3 w-3 absolute top-2 right-2 text-yellow-500" />
                {isCreatingBackup === 'custom_export' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 animate-spin" />
                      <span className="text-xs">Demo...</span>
                    </div>
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 pt-4 border-t">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Functional</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span>Demo Interface</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 