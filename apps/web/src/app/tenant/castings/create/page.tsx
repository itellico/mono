/**
 * Create Casting Page
 * 
 * Interface for creating new casting calls.
 */

import { Suspense } from 'react';
import { CreateCastingClientPage } from '@/components/tenant/castings/CreateCastingClientPage';
import { LoadingState } from '@/components/ui/loading-state';

export default function CreateCastingPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create New Casting</h1>
        <p className="text-muted-foreground">
          Set up a new casting call and define requirements.
        </p>
      </div>

      <Suspense fallback={<LoadingState />}>
        <CreateCastingClientPage />
      </Suspense>
    </div>
  );
}