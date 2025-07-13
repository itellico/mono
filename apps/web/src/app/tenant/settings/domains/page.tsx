import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/loading-state';
import { DomainSettingsClientPage } from '@/components/tenant/settings/DomainSettingsClientPage';

export default function DomainSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingState />}>
        <DomainSettingsClientPage />
      </Suspense>
    </div>
  );
}