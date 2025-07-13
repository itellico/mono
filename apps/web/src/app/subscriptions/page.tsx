
'use client';

import { useSubscriptionPlans } from '@/lib/hooks/useSubscriptionPlans';
import SubscriptionPlanComponent from '@/components/SubscriptionPlan';

export default function SubscriptionsPage() {
  const { data: plans, isLoading, error } = useSubscriptionPlans();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="bg-gray-900">
      <div className="relative overflow-hidden pt-16 pb-96 lg:pt-24">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Pricing Plans
            </h1>
            <p className="mt-4 text-xl text-gray-300">
              Choose the plan that's right for you.
            </p>
          </div>
        </div>
      </div>
      <div className="flow-root bg-gray-900 pb-16 sm:pb-24">
        <div className="-mt-80">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {plans?.map((plan) => (
                  <SubscriptionPlanComponent key={plan.id} plan={plan} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
