
import { Suspense } from 'react';
import { FeaturesClientPage } from './FeaturesClientPage';
import { Skeleton } from '@/components/ui/skeleton';

export default function FeaturesPanel() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <FeaturesClientPage />
    </Suspense>
  );
}
