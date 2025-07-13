import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/loading-state';
import { SubscriptionPlansClientPage } from '@/components/tenant/subscriptions/SubscriptionPlansClientPage';

export default function SubscriptionPlansPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingState />}>
        <SubscriptionPlansClientPage />
      </Suspense>
    </div>
  );
}