import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/loading-state';
import { CategoriesClientPage } from '@/components/tenant/categories/CategoriesClientPage';

export default function CategoriesPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingState />}>
        <CategoriesClientPage />
      </Suspense>
    </div>
  );
}