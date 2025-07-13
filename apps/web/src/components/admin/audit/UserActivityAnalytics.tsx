'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TrendingUp, Users, Activity, Clock, MousePointer, Eye, Search, RefreshCw, Download } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { browserLogger } from '@/lib/browser-logger';

interface ActivitySummary {
  totalUsers: number;
  totalActivities: number;
  topActions: { action: string; count: number }[];
  topComponents: { component: string; count: number }[];
  dailyActivity: { date: string; count: number }[];
  hourlyActivity: { hour: number; count: number }[];
}

interface UserActivity {
  userId: number;
  totalActivities: number;
  lastActivity: string;
  topActions: string[];
  sessionDuration: number;
}

interface ActivityEntry {
  id: number;
  userId: number;
  action: string;
  component?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

interface UserActivityAnalyticsProps {
  tenantId?: number;
  className?: string;
}

export function UserActivityAnalytics({ tenantId, className }: UserActivityAnalyticsProps) {
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 7),
    endDate: new Date()
  });

  const [filters, setFilters] = useState({
    action: '',
    component: '',
    userId: '',
    timeRange: '7d'
  });

  const timeRanges = [
    { value: '1d', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: 'custom', label: 'Custom range' }
  ];

  /**
   * Fetch activity analytics data
   */
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        startDate: startOfDay(dateRange.startDate).toISOString(),
        endDate: endOfDay(dateRange.endDate).toISOString(),
        ...(filters.action && { action: filters.action }),
        ...(filters.component && { component: filters.component }),
        ...(filters.userId && { userId: filters.userId }),
        ...(tenantId && { tenantId: tenantId.toString() })
      });

      // Fetch summary data
      const summaryResponse = await fetch(`/api/v1/admin/analytics/activity/summary?${queryParams}`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSummary(summaryData);
      }

      // Fetch user activities
      const usersResponse = await fetch(`/api/v1/admin/analytics/activity/users?${queryParams}`);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUserActivities(usersData.users || []);
      }

      // Fetch recent activities
      const recentResponse = await fetch(`/api/v1/admin/analytics/activity/recent?${queryParams}&limit=50`);
      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        setRecentActivities(recentData.activities || []);
      }

      browserLogger.info('Activity analytics fetched', {
        dateRange,
        filters,
        summaryLoaded: !!summary,
        userCount: userActivities.length,
        recentCount: recentActivities.length
      });

    } catch (error) {
      browserLogger.error('Error fetching activity analytics', {
        error: (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update time range
   */
  const updateTimeRange = (range: string) => {
    setFilters(prev => ({ ...prev, timeRange: range }));

    if (range !== 'custom') {
      const days = parseInt(range.replace('d', ''));
      setDateRange({
        startDate: subDays(new Date(), days),
        endDate: new Date()
      });
    }
  };

  /**
   * Export analytics data
   */
  const exportAnalytics = async () => {
    try {
      const queryParams = new URLSearchParams({
        startDate: startOfDay(dateRange.startDate).toISOString(),
        endDate: endOfDay(dateRange.endDate).toISOString(),
        export: 'true',
        ...(tenantId && { tenantId: tenantId.toString() })
      });

      const response = await fetch(`/api/v1/admin/analytics/activity/export?${queryParams}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-activity-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        browserLogger.info('User activity analytics exported');
      }
    } catch (error) {
      browserLogger.error('Failed to export analytics', {
        error: (error as Error).message
      });
    }
  };

  /**
   * Get action badge variant
   */
  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'click': return 'default';
      case 'view': return 'secondary';
      case 'search': return 'outline';
      case 'form_submit': return 'default';
      case 'page_view': return 'secondary';
      default: return 'outline';
    }
  };

  /**
   * Format duration
   */
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, filters]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Activity Analytics</h2>
          <p className="text-muted-foreground">
            Analyze user behavior patterns and system usage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Summary</CardTitle>
          <CardDescription>
            User activity analytics are not yet implemented. This component provides the UI framework for when the backend analytics endpoints are created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
            <p className="text-sm">
              The user activity analytics dashboard will be available once the following API endpoints are implemented:
            </p>
            <ul className="text-sm mt-4 space-y-1">
              <li>• <code>/api/v1/admin/analytics/activity/summary</code></li>
              <li>• <code>/api/v1/admin/analytics/activity/users</code></li>
              <li>• <code>/api/v1/admin/analytics/activity/recent</code></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 