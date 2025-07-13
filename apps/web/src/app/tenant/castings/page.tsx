/**
 * Tenant Castings Management Page
 * 
 * Main castings management interface for the clickdami tenant.
 * Provides full CRUD operations for casting calls and applications.
 */

import { Suspense } from 'react';
import { CastingsClientPage } from '@/components/tenant/castings/CastingsClientPage';
import { LoadingState } from '@/components/ui/loading-state';

export default function CastingsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Casting Management</h1>
        <p className="text-muted-foreground">
          Manage casting calls, review applications, and track talent.
        </p>
      </div>

      <Suspense fallback={<LoadingState />}>
        <CastingsClientPage />
      </Suspense>
    </div>
  );
}