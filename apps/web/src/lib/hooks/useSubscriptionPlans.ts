
import { useQuery } from '@tanstack/react-query';
import { SubscriptionPlan } from '@/lib/subscription-schema';

async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const response = await fetch('/api/v1/subscriptions/plans');
  if (!response.ok) {
    throw new Error('Failed to fetch subscription plans');
  }
  return response.json();
}

export function useSubscriptionPlans() {
  return useQuery<SubscriptionPlan[], Error>({
    queryKey: ['subscriptionPlans'],
    queryFn: fetchSubscriptionPlans,
  });
}
