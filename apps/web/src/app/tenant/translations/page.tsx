import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/loading-state';
import { TranslationsClientPage } from '@/components/tenant/translations/TranslationsClientPage';

export default function TranslationsPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingState />}>
        <TranslationsClientPage />
      </Suspense>
    </div>
  );
}