import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/loading-state';
import { TagsClientPage } from '@/components/tenant/tags/TagsClientPage';

export default function TagsPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingState />}>
        <TagsClientPage />
      </Suspense>
    </div>
  );
}