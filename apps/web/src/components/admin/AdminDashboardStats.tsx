'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, FileText, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { browserLogger } from '@/lib/browser-logger';
import { DashboardStats } from '@/lib/services/admin-dashboard.service';

interface AdminDashboardStatsProps {
  initialData?: DashboardStats;
}

export function AdminDashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4 rounded-sm" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AdminDashboardStats({ initialData }: AdminDashboardStatsProps) {
  const t = useTranslations('admin-common');

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/v1/admin/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    },
    initialData,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  if (error) {
    browserLogger.error('Failed to load admin stats', { error });
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <p className="text-red-600 text-sm">Failed to load statistics</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading && !initialData) {
    return <AdminDashboardStatsSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('stats.totalUsers')}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          <p className="text-xs text-muted-foreground">
            +{stats?.newUsersToday || 0} {t('stats.newToday')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('stats.pendingApplications')}</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.pendingApplications || 0}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.approvedToday || 0} {t('stats.approvedToday')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('stats.activeJobs')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.activeJobs || 0}</div>
          <p className="text-xs text-muted-foreground">
            {t('stats.jobsPosted')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('stats.revenue')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${(stats?.monthlyRevenue || 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('stats.monthlyRevenue')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

AdminDashboardStats.Skeleton = AdminDashboardStatsSkeleton;
