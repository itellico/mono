import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/loading-state';
import { IndustryTemplatesClientPage } from '@/components/tenant/industry-templates/IndustryTemplatesClientPage';

export default function IndustryTemplatesPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingState />}>
        <IndustryTemplatesClientPage />
      </Suspense>
    </div>
  );
}