'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  HardDrive, 
  Cloud, 
  Server, 
  Shield,
  Settings,
  Plus,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

/**
 * Backup Storage Configuration Component
 * Manages storage locations and settings with demo data
 * 
 * @component
 * @example
 * <BackupStorageConfig />
 */
export function BackupStorageConfig() {
  const [storageLocations] = useState([
    {
      id: '1',
      name: 'Local Storage',
      type: 'local',
      path: '/app/backups',
      isActive: true,
      isDefault: true,
      usage: 847, // GB
      capacity: 1000, // GB
      status: 'healthy'
    },
    {
      id: '2',
      name: 'AWS S3 Bucket',
      type: 's3',
      path: 's3://mono-backups',
      isActive: false,
      isDefault: false,
      usage: 0,
      capacity: null, // Unlimited
      status: 'not_configured'
    },
    {
      id: '3',
      name: 'Google Cloud Storage',
      type: 'gcs',
      path: 'gs://mono-backup-bucket',
      isActive: false,
      isDefault: false,
      usage: 0,
      capacity: null,
      status: 'not_configured'
    }
  ]);

  const getStorageIcon = (type: string) => {
    switch (type) {
      case 'local':
        return <HardDrive className="h-5 w-5" />;
      case 's3':
      case 'gcs':
        return <Cloud className="h-5 w-5" />;
      default:
        return <Server className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>;
      case 'not_configured':
        return <Badge variant="outline" className="text-yellow-600"><AlertTriangle className="w-3 h-3 mr-1" />Not Configured</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatStorage = (usage: number, capacity: number | null) => {
    if (capacity === null) return `${usage} GB used`;
    const percentage = (usage / capacity) * 100;
    return { usage, capacity, percentage };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Storage Locations</h3>
          <p className="text-sm text-muted-foreground">
            Configure backup storage destinations and retention policies
          </p>
        </div>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Storage</span>
        </Button>
      </div>

      {/* Storage Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {storageLocations.map((location) => (
          <Card key={location.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStorageIcon(location.type)}
                  <CardTitle className="text-sm">{location.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {location.isDefault && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                  <Switch checked={location.isActive} />
                </div>
              </div>
              <CardDescription className="text-xs font-mono">
                {location.path}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {location.capacity && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Storage Usage</span>
                      <span>{location.usage} GB / {location.capacity} GB</span>
                    </div>
                    <Progress value={(location.usage / location.capacity) * 100} />
                  </>
                )}

                {location.capacity === null && (
                  <div className="text-sm text-muted-foreground">
                    {location.usage} GB used (unlimited)
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                {getStatusBadge(location.status)}

                <Button variant="ghost" size="sm">
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Retention Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Retention Policies</span>
          </CardTitle>
          <CardDescription>
            Configure automatic cleanup and archival policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Database Backups</h4>
                  <p className="text-sm text-muted-foreground">
                    Keep for 30 days, then archive
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Media Backups</h4>
                  <p className="text-sm text-muted-foreground">
                    Keep for 90 days, then delete
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">GDPR Exports</h4>
                  <p className="text-sm text-muted-foreground">
                    Keep for 30 days, then delete
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">System Configs</h4>
                  <p className="text-sm text-muted-foreground">
                    Keep for 1 year, then archive
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Notice */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground">
          🚧 Demo interface - Storage configuration will be functional after implementation
        </p>
      </div>
    </div>
  );
} 