
import { useQuery } from '@tanstack/react-query';
import { SubscriptionLimits } from '@/lib/schemas/limits';

async function fetchSubscriptionLimits(planId: string): Promise<SubscriptionLimits> {
  const response = await fetch(`/api/v1/subscriptions/limits?planId=${planId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch subscription limits');
  }
  return response.json();
}

export function useSubscriptionLimits(planId: string) {
  return useQuery<SubscriptionLimits, Error>({
    queryKey: ['subscriptionLimits', planId],
    queryFn: () => fetchSubscriptionLimits(planId),
    enabled: !!planId,
  });
}
