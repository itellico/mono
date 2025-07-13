'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useAuditTracking, usePageTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';
import { QuickActionsData } from '@/lib/services/admin-dashboard.service';

interface AdminDashboardClientWrapperProps {
  initialQuickActionsData: QuickActionsData;
  userContext: any;
}

function QuickActionsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border border-border rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminDashboardClientWrapper({ 
  initialQuickActionsData, 
  userContext 
}: AdminDashboardClientWrapperProps) {
  const t = useTranslations('admin-common');
  
  // Enterprise audit tracking integration
  const { trackClick } = useAuditTracking();
  usePageTracking('admin_dashboard');

  // TanStack Query with initial data
  const { data: quickActionsData, isLoading, error } = useQuery({
    queryKey: ['admin', 'quickActions', userContext.tenantId],
    queryFn: async () => {
      const response = await fetch('/api/v1/admin/dashboard/quick-actions');
      if (!response.ok) throw new Error('Failed to fetch quick actions');
      return response.json();
    },
    initialData: initialQuickActionsData,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleQuickAction = (action: string, target: string) => {
    trackClick('admin_quick_action', { action, target });
    browserLogger.userAction('admin_quick_action', `${action} on ${target}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('sections.quickActions')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <QuickActionsSkeleton />
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 text-sm">Failed to load quick actions</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-foreground">
                    {t('quickActions.reviewApplications.title')}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {quickActionsData?.pendingApplications} {t('quickActions.reviewApplications.description')}
                  </p>
                </div>
                <Button 
                  size="sm"
                  onClick={() => handleQuickAction('review', 'applications')}
                >
                  {t('actions.review')}
                </Button>
              </div>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-foreground">
                    {t('quickActions.userManagement.title')}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('quickActions.userManagement.description')}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleQuickAction('moderate', 'users')}
                >
                  {t('actions.moderate')}
                </Button>
              </div>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-foreground">
                    {t('quickActions.mediaReview.title')}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('quickActions.mediaReview.description')}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleQuickAction('review', 'media')}
                >
                  {t('actions.review')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
