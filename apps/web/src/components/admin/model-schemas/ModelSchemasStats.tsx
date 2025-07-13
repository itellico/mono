'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Database,
  FileText,
  User,
  Building,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

/**
 * Model Schemas Statistics Component
 * 
 * Features:
 * - ✅ Translation integration with t() function
 * - ✅ Responsive design with proper breakpoints
 * - ✅ Loading states with Skeleton components
 * - ✅ Type-safe props interface
 * - ✅ Accessible design
 * 
 * @component ModelSchemasStats
 * @param {ModelSchemaStats} stats - Statistics data
 * @example
 * ```tsx
 * <ModelSchemasStats stats={statsData} />
 * ```
 */

interface ModelSchemaStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  recent: number;
}

interface ModelSchemasStatsProps {
  stats?: ModelSchemaStats;
  isLoading?: boolean;
}

export function ModelSchemasStats({ stats, isLoading = false }: ModelSchemasStatsProps) {
  const t = useTranslations('admin.model-schemas');

  // Loading state with proper skeleton structure
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Get type counts for display
  const humanModels = stats.byType['human_model'] || 0;
  const profiles = stats.byType['profile'] || 0;
  const freelancers = stats.byType['freelancer'] || 0;
  const businesses = stats.byType['business'] || 0;

  // Get status counts
  const activeCount = stats.byStatus.active || 0;
  const inactiveCount = stats.byStatus.inactive || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Schemas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('stats.total_schemas')}</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {t('stats.total_schemas_description')}
          </p>
        </CardContent>
      </Card>

      {/* Active vs Inactive */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('stats.schema_status')}</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <div className="text-sm text-muted-foreground">/</div>
            <div className="text-lg font-medium text-red-500">{inactiveCount}</div>
          </div>
          <div className="flex space-x-2 mt-1">
            <Badge variant="default" className="text-xs">
              {t('stats.active')}: {activeCount}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {t('stats.inactive')}: {inactiveCount}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Recent Schemas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('stats.recent_schemas')}</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.recent}</div>
          <p className="text-xs text-muted-foreground">
            {t('stats.recent_schemas_description')}
          </p>
        </CardContent>
      </Card>

      {/* Schema Types Breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('stats.schema_types')}</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {humanModels > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{t('stats.human_models')}</span>
                <Badge variant="outline" className="text-xs">{humanModels}</Badge>
              </div>
            )}
            {profiles > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{t('stats.profiles')}</span>
                <Badge variant="outline" className="text-xs">{profiles}</Badge>
              </div>
            )}
            {freelancers > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{t('stats.freelancers')}</span>
                <Badge variant="outline" className="text-xs">{freelancers}</Badge>
              </div>
            )}
            {businesses > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{t('stats.businesses')}</span>
                <Badge variant="outline" className="text-xs">{businesses}</Badge>
              </div>
            )}
            {stats.total === 0 && (
              <p className="text-xs text-muted-foreground italic">
                {t('stats.no_schemas_yet')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 