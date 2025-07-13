/**
 * Casting Applications Page
 * 
 * Manage applications for a specific casting call.
 */

import { Suspense } from 'react';
import { CastingApplicationsClientPage } from '@/components/tenant/castings/CastingApplicationsClientPage';
import { LoadingState } from '@/components/ui/loading-state';

interface CastingApplicationsPageProps {
  params: {
    id: string;
  };
}

export default function CastingApplicationsPage({ params }: CastingApplicationsPageProps) {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingState />}>
        <CastingApplicationsClientPage castingId={params.id} />
      </Suspense>
    </div>
  );
}