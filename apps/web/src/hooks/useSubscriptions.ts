'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// Get all available subscription plans
export function useSubscriptionPlans(params?: {
  isActive?: boolean;
  category?: string;
  currency?: string;
}) {
  return useQuery({
    queryKey: ['subscription-plans', params],
    queryFn: async () => {
      const response = await apiClient.getSubscriptionPlans(params);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch subscription plans');
      }
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - plans don't change often
  });
}

// Get current subscription
export function useCurrentSubscription() {
  return useQuery({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const response = await apiClient.getCurrentSubscription();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch current subscription');
      }
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds to keep usage stats current
  });
}

// Subscribe to a plan
export function useSubscribeToPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      planId: number;
      paymentMethodId?: string;
      billingAddress?: {
        name: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
      };
      couponCode?: string;
      metadata?: any;
    }) => {
      const response = await apiClient.subscribeToPlan(data.planId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to subscribe to plan');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-history'] });
      
      if (data.requiresPayment && data.paymentUrl) {
        toast.success('Subscription created! Redirecting to payment...');
        // Redirect to payment page
        window.location.href = data.paymentUrl;
      } else {
        toast.success('Successfully subscribed to plan!');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to subscribe to plan');
    },
  });
}

// Cancel subscription
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      reason?: string;
      feedback?: string;
      cancelImmediately?: boolean;
    }) => {
      const response = await apiClient.cancelSubscription();
      if (!response.success) {
        throw new Error(response.error || 'Failed to cancel subscription');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-history'] });
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel subscription');
    },
  });
}

// Reactivate cancelled subscription
export function useReactivateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // This would be implemented in your API client
      // const response = await apiClient.reactivateSubscription();
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { message: 'Subscription reactivated successfully' };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reactivate subscription');
    },
  });
}

// Get subscription history
export function useSubscriptionHistory(params?: {
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['subscription-history', params],
    queryFn: async () => {
      // This would be implemented in your API client
      // const response = await apiClient.getSubscriptionHistory(params);
      // For now, we'll return mock data
      return {
        subscriptions: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      };
    },
  });
}

// Get usage statistics
export function useSubscriptionUsage(params?: {
  period?: 'current' | 'last_month' | 'last_3_months';
}) {
  return useQuery({
    queryKey: ['subscription-usage', params],
    queryFn: async () => {
      // This would be implemented in your API client
      // const response = await apiClient.getSubscriptionUsage(params);
      // For now, we'll return mock data
      return {
        usage: {
          period: params?.period || 'current',
          periodStart: new Date().toISOString(),
          periodEnd: new Date().toISOString(),
          metrics: {},
          trends: {},
          limits: {},
        },
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

// Hook for subscription status checks
export function useSubscriptionStatus() {
  const { data: subscription } = useCurrentSubscription();

  const status = {
    isActive: subscription?.subscription?.status === 'active',
    isTrialing: subscription?.subscription?.status === 'trialing',
    isCancelled: subscription?.subscription?.status === 'cancelled',
    isPendingCancellation: subscription?.subscription?.status === 'cancel_at_period_end',
    isPendingPayment: subscription?.subscription?.status === 'pending_payment',
    hasSubscription: !!subscription?.subscription,
    planName: subscription?.subscription?.plan?.name,
    planPrice: subscription?.subscription?.plan?.price,
    currency: subscription?.subscription?.plan?.currency,
    billingCycle: subscription?.subscription?.plan?.billingCycle,
    nextBillingDate: subscription?.subscription?.usage?.currentPeriodEnd,
    daysUntilRenewal: subscription?.subscription?.usage?.currentPeriodEnd
      ? Math.ceil((new Date(subscription.subscription.usage.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null,
  };

  return status;
}

// Hook for usage limit warnings
export function useUsageLimitWarnings() {
  const { data: subscription } = useCurrentSubscription();

  if (!subscription?.subscription?.usage?.limitsUsage) {
    return { warnings: [], hasWarnings: false };
  }

  const warnings = [];
  const limitsUsage = subscription.subscription.usage.limitsUsage;

  for (const [limitName, usage] of Object.entries(limitsUsage)) {
    const usageData = usage as { limit: number; used: number; percentage: number };
    
    if (usageData.percentage >= 90) {
      warnings.push({
        type: 'critical',
        limitName,
        usage: usageData,
        message: `You've used ${usageData.percentage}% of your ${limitName} limit (${usageData.used}/${usageData.limit})`,
      });
    } else if (usageData.percentage >= 75) {
      warnings.push({
        type: 'warning',
        limitName,
        usage: usageData,
        message: `You've used ${usageData.percentage}% of your ${limitName} limit (${usageData.used}/${usageData.limit})`,
      });
    }
  }

  return {
    warnings,
    hasWarnings: warnings.length > 0,
    criticalWarnings: warnings.filter(w => w.type === 'critical'),
    normalWarnings: warnings.filter(w => w.type === 'warning'),
  };
}

// Hook for plan recommendations
export function usePlanRecommendations() {
  const { data: plans } = useSubscriptionPlans();
  const { data: subscription } = useCurrentSubscription();
  const { warnings } = useUsageLimitWarnings();

  if (!plans?.plans || !subscription?.subscription) {
    return { recommendations: [], hasRecommendations: false };
  }

  const currentPlan = subscription.subscription.plan;
  const recommendations = [];

  // If user is hitting limits, recommend upgrade
  if (warnings.length > 0) {
    const higherPlans = plans.plans.filter(plan => 
      plan.price > currentPlan.price && 
      plan.currency === currentPlan.currency &&
      plan.billingCycle === currentPlan.billingCycle
    );

    if (higherPlans.length > 0) {
      recommendations.push({
        type: 'upgrade',
        reason: 'Usage limits exceeded',
        plan: higherPlans[0], // Recommend the next tier up
        benefits: ['Higher usage limits', 'Better performance', 'Priority support'],
      });
    }
  }

  // If user has low usage, recommend downgrade
  const totalUsagePercentage = subscription.subscription.usage?.limitsUsage 
    ? Object.values(subscription.subscription.usage.limitsUsage).reduce(
        (avg: number, usage: any) => avg + usage.percentage, 0
      ) / Object.keys(subscription.subscription.usage.limitsUsage).length
    : 0;

  if (totalUsagePercentage < 30) {
    const lowerPlans = plans.plans.filter(plan => 
      plan.price < currentPlan.price && 
      plan.currency === currentPlan.currency &&
      plan.billingCycle === currentPlan.billingCycle
    );

    if (lowerPlans.length > 0) {
      recommendations.push({
        type: 'downgrade',
        reason: 'Low usage detected',
        plan: lowerPlans[lowerPlans.length - 1], // Recommend the highest of lower tiers
        benefits: ['Cost savings', 'Right-sized for your usage'],
        savings: currentPlan.price - lowerPlans[lowerPlans.length - 1].price,
      });
    }
  }

  return {
    recommendations,
    hasRecommendations: recommendations.length > 0,
    upgradeRecommendations: recommendations.filter(r => r.type === 'upgrade'),
    downgradeRecommendations: recommendations.filter(r => r.type === 'downgrade'),
  };
}

// Hook for billing cycle management
export function useBillingCycle() {
  const { data: subscription } = useCurrentSubscription();

  const billingInfo = {
    currentCycle: subscription?.subscription?.plan?.billingCycle,
    nextBillingDate: subscription?.subscription?.usage?.currentPeriodEnd,
    amount: subscription?.subscription?.plan?.price,
    currency: subscription?.subscription?.plan?.currency,
    isAutoRenew: subscription?.subscription?.autoRenew,
  };

  return billingInfo;
}