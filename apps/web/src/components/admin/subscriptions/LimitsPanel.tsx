
import { Suspense } from 'react';
import { LimitsClientPage } from './LimitsClientPage';
import { Skeleton } from '@/components/ui/skeleton';

export default function LimitsPanel() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <LimitsClientPage />
    </Suspense>
  );
}
