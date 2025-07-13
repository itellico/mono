
import { Suspense } from 'react';
import { SubscriptionPlansClientPage } from './SubscriptionPlansClientPage';
import { Skeleton } from '@/components/ui/skeleton';

export default function SubscriptionPlansPanel() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <SubscriptionPlansClientPage />
    </Suspense>
  );
}
