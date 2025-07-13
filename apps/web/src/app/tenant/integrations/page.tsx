import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/loading-state';
import { IntegrationsClientPage } from '@/components/tenant/integrations/IntegrationsClientPage';

export default function IntegrationsPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingState />}>
        <IntegrationsClientPage />
      </Suspense>
    </div>
  );
}