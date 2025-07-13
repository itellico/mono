/**
 * Model Application Details Page
 * 
 * View and manage individual model applications.
 */

import { Suspense } from 'react';
import { ModelApplicationDetailsClientPage } from '@/components/tenant/applications/ModelApplicationDetailsClientPage';
import { LoadingState } from '@/components/ui/loading-state';

interface ModelApplicationDetailsPageProps {
  params: {
    id: string;
  };
}

export default function ModelApplicationDetailsPage({ params }: ModelApplicationDetailsPageProps) {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingState />}>
        <ModelApplicationDetailsClientPage applicationId={params.id} />
      </Suspense>
    </div>
  );
}