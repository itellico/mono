/**
 * Model Profile Details Page
 * 
 * View detailed model profile and portfolio.
 */

import { Suspense } from 'react';
import { ModelProfileClientPage } from '@/components/tenant/models/ModelProfileClientPage';
import { LoadingState } from '@/components/ui/loading-state';

interface ModelProfilePageProps {
  params: {
    id: string;
  };
}

export default function ModelProfilePage({ params }: ModelProfilePageProps) {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingState />}>
        <ModelProfileClientPage modelId={params.id} />
      </Suspense>
    </div>
  );
}