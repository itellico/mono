
import { Suspense } from 'react';
import { BundlesClientPage } from './BundlesClientPage';
import { Skeleton } from '@/components/ui/skeleton';

export default function BundlerPanel() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <BundlesClientPage />
    </Suspense>
  );
}
