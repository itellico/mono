/**
 * Tenant Models Database Page
 * 
 * Browse and manage the talent database.
 */

import { Suspense } from 'react';
import { ModelsClientPage } from '@/components/tenant/models/ModelsClientPage';
import { LoadingState } from '@/components/ui/loading-state';

export default function ModelsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Models Database</h1>
        <p className="text-muted-foreground">
          Browse and manage your talent database.
        </p>
      </div>

      <Suspense fallback={<LoadingState />}>
        <ModelsClientPage />
      </Suspense>
    </div>
  );
}