'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { browserLogger } from '@/lib/browser-logger';
import { RecentActivityItem } from '@/lib/services/admin-dashboard.service';

interface AdminRecentActivityProps {
  initialData?: RecentActivityItem[];
}

function AdminRecentActivitySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Skeleton className="w-4 h-4 rounded-full mt-1" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminRecentActivity({ initialData }: AdminRecentActivityProps) {
  const t = useTranslations('admin-common');

  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard', 'recent-activity'],
    queryFn: async () => {
      const response = await fetch('/api/v1/admin/dashboard/recent-activity');
      if (!response.ok) throw new Error('Failed to fetch recent activity');
      return response.json();
    },
    initialData,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  if (error) {
    browserLogger.error('Failed to load recent activity', { error });
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('sections.recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 text-sm">Failed to load recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !initialData) {
    return <AdminRecentActivitySkeleton />;
  }

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>;
      case 'application_submitted':
        return <Clock className="w-4 h-4 text-yellow-500 mt-1" />;
      case 'admin_action':
        return <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />;
      case 'content_flagged':
        return <AlertTriangle className="w-4 h-4 text-orange-500 mt-1" />;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>;
    }
  };

  const getStatusBadge = (type: string) => {
    switch (type) {
      case 'user_registration':
        return 'new';
      case 'application_submitted':
        return 'pending';
      case 'admin_action':
        return 'approved';
      case 'content_flagged':
        return 'review';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('sections.recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities?.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {getStatusIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
              <Badge 
                variant={
                  getStatusBadge(activity.type) === 'approved' ? 'default' : 
                  getStatusBadge(activity.type) === 'pending' ? 'secondary' : 
                  'outline'
                }
                className="text-xs"
              >
                {getStatusBadge(activity.type)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

AdminRecentActivity.Skeleton = AdminRecentActivitySkeleton;
