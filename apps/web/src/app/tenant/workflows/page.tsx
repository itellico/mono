import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/loading-state';
import { WorkflowsClientPage } from '@/components/tenant/workflows/WorkflowsClientPage';

export default function WorkflowsPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingState />}>
        <WorkflowsClientPage />
      </Suspense>
    </div>
  );
}