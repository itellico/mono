import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/loading-state';
import { TenantSettingsClientPage } from '@/components/tenant/settings/TenantSettingsClientPage';

export default function TenantSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingState />}>
        <TenantSettingsClientPage />
      </Suspense>
    </div>
  );
}