/**
 * Tenant Analytics Dashboard Page (Funeralytics)
 * 
 * Analytics dashboard for tenant performance metrics and insights.
 */

import { Suspense } from 'react';
import { AnalyticsClientPage } from '@/components/tenant/analytics/AnalyticsClientPage';
import { LoadingState } from '@/components/ui/loading-state';

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Track performance metrics, insights, and business analytics.
        </p>
      </div>

      <Suspense fallback={<LoadingState />}>
        <AnalyticsClientPage />
      </Suspense>
    </div>
  );
}