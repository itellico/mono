import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/loading-state';
import { BrandingSettingsClientPage } from '@/components/tenant/settings/BrandingSettingsClientPage';

export default function BrandingSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingState />}>
        <BrandingSettingsClientPage />
      </Suspense>
    </div>
  );
}