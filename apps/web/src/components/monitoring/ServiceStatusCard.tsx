'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Server, 
  Database, 
  Activity, 
  Mail, 
  Workflow, 
  Clock,
  BarChart3,
  Eye,
  ExternalLink
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  displayName: string;
  status: 'online' | 'offline' | 'degraded';
  metric?: string;
  metricValue?: string | number;
  url?: string;
  icon: string;
}

interface ServiceStatusCardProps {
  services: ServiceStatus[];
  onServiceClick?: (service: ServiceStatus) => void;
}

export function ServiceStatusCard({ services, onServiceClick }: ServiceStatusCardProps) {
  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      'Server': Server,
      'Database': Database,
      'Activity': Activity,
      'Mail': Mail,
      'Workflow': Workflow,
      'Clock': Clock,
      'BarChart3': BarChart3,
      'Eye': Eye
    };
    return icons[iconName] || Server;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      online: { label: 'Online', className: 'bg-green-500' },
      offline: { label: 'Offline', className: 'bg-red-500' },
      degraded: { label: 'Degraded', className: 'bg-yellow-500' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;
    
    return (
      <Badge variant="default" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Docker Services Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((service) => {
            const Icon = getIcon(service.icon);
            
            return (
              <div 
                key={service.name}
                className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{service.displayName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {service.metricValue && (
                    <span className="text-xs text-muted-foreground">
                      {service.metricValue}{service.metric}
                    </span>
                  )}
                  {getStatusBadge(service.status)}
                  {service.url && onServiceClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onServiceClick(service)}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}