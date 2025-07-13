import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/loading-state';
import { TenantFeaturesClientPage } from '@/components/tenant/features/TenantFeaturesClientPage';

export default function TenantFeaturesPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingState />}>
        <TenantFeaturesClientPage />
      </Suspense>
    </div>
  );
}