'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  Settings,
  Plus
} from 'lucide-react';

/**
 * Backup Schedule Manager Component
 * Manages automated backup schedules with demo data
 * 
 * @component
 * @example
 * <BackupScheduleManager />
 */
export function BackupScheduleManager() {
  const [schedules] = useState([
    {
      id: '1',
      name: 'Daily Database Backup',
      type: 'database',
      schedule: '0 2 * * *', // Daily at 2 AM
      isActive: true,
      nextRun: '2024-01-16T02:00:00Z',
      lastRun: '2024-01-15T02:00:00Z'
    },
    {
      id: '2',
      name: 'Weekly Media Backup',
      type: 'media',
      schedule: '0 3 * * 0', // Weekly on Sunday at 3 AM
      isActive: false,
      nextRun: '2024-01-21T03:00:00Z',
      lastRun: '2024-01-14T03:00:00Z'
    },
    {
      id: '3',
      name: 'Monthly Configuration Backup',
      type: 'configuration',
      schedule: '0 4 1 * *', // Monthly on 1st at 4 AM
      isActive: true,
      nextRun: '2024-02-01T04:00:00Z',
      lastRun: '2024-01-01T04:00:00Z'
    }
  ]);

  const formatSchedule = (cron: string) => {
    // Simple cron to human readable conversion
    if (cron === '0 2 * * *') return 'Daily at 2:00 AM';
    if (cron === '0 3 * * 0') return 'Weekly on Sunday at 3:00 AM';
    if (cron === '0 4 1 * *') return 'Monthly on 1st at 4:00 AM';
    return cron;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Active Schedules</h3>
          <p className="text-sm text-muted-foreground">
            Manage automated backup schedules
          </p>
        </div>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Schedule</span>
        </Button>
      </div>

      {/* Schedules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedules.map((schedule) => (
          <Card key={schedule.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <CardTitle className="text-sm">{schedule.name}</CardTitle>
                </div>
                <Switch checked={schedule.isActive} />
              </div>
              <CardDescription>
                {schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1)} backup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>{formatSchedule(schedule.schedule)}</span>
                </div>

                <div className="text-xs text-muted-foreground">
                  <div>Next run: {formatDateTime(schedule.nextRun)}</div>
                  <div>Last run: {formatDateTime(schedule.lastRun)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Badge variant={schedule.isActive ? "default" : "secondary"}>
                  {schedule.isActive ? 'Active' : 'Inactive'}
                </Badge>

                <div className="flex items-center space-x-1">
                  {schedule.isActive ? (
                    <Button variant="ghost" size="sm">
                      <Pause className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm">
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Demo Notice */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground">
          🚧 Demo interface - Schedule management will be functional after Temporal integration
        </p>
      </div>
    </div>
  );
} 