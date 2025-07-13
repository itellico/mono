/**
 * Tenant Model Applications Management Page
 * 
 * Main interface for managing model applications and profiles.
 */

import { Suspense } from 'react';
import { ModelApplicationsClientPage } from '@/components/tenant/applications/ModelApplicationsClientPage';
import { LoadingState } from '@/components/ui/loading-state';

export default function ModelApplicationsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Model Applications</h1>
        <p className="text-muted-foreground">
          Manage model profiles, applications, and talent database.
        </p>
      </div>

      <Suspense fallback={<LoadingState />}>
        <ModelApplicationsClientPage />
      </Suspense>
    </div>
  );
}