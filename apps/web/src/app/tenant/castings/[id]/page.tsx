/**
 * Casting Details Page
 * 
 * View and manage individual casting calls.
 */

import { Suspense } from 'react';
import { CastingDetailsClientPage } from '@/components/tenant/castings/CastingDetailsClientPage';
import { LoadingState } from '@/components/ui/loading-state';

interface CastingDetailsPageProps {
  params: {
    id: string;
  };
}

export default function CastingDetailsPage({ params }: CastingDetailsPageProps) {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingState />}>
        <CastingDetailsClientPage castingId={params.id} />
      </Suspense>
    </div>
  );
}