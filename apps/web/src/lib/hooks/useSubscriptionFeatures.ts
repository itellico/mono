'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

/**
 * Subscription Features Hook
 * 
 * Provides client-side access to subscription data, feature checking,
 * and usage limit monitoring.
 */

export interface SubscriptionUsage {
  accounts: { current: number; limit: number };
  profiles: { current: number; limit: number };
  photos: { current: number; limit: number };
  storage: { current: number; limit: number; unit: 'GB' | 'MB' };
  apiCalls: { current: number; limit: number; period: 'monthly' };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  price: number;
  currency: string;
  billing: 'monthly' | 'yearly';
  features: string[];
  limits: SubscriptionUsage;
  status: 'active' | 'cancelled' | 'past_due' | 'expired';
  currentPeriodEnd: string;
}

export interface SubscriptionFeatures {
  currentPlan: SubscriptionPlan | null;
  usage: SubscriptionUsage | null;
  hasFeature: (feature: string) => boolean;
  isNearLimit: (resource: keyof SubscriptionUsage) => boolean;
  canUseFeature: (feature: string) => boolean;
  upgradeRequired: (feature: string) => boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for managing subscription features and limits
 */
export function useSubscriptionFeatures(tenantId: number, userId?: number): SubscriptionFeatures {
  const { toast } = useToast();

  // Query current subscription plan
  const {
    data: subscriptionData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['subscription', 'features', tenantId, userId],
    queryFn: async () => {
      const params = new URLSearchParams({
        tenantId: tenantId.toString(),
        ...(userId && { userId: userId.toString() })
      });

      const response = await fetch(`/api/v1/subscriptions/features?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subscription data');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    retry: 3
  });

  const currentPlan = subscriptionData?.plan || null;
  const usage = subscriptionData?.usage || null;

  // Check if user has a specific feature
  const hasFeature = (feature: string): boolean => {
    if (!currentPlan) return false;
    return currentPlan.features.includes(feature);
  };

  // Check if user is near a usage limit (>80%)
  const isNearLimit = (resource: keyof SubscriptionUsage): boolean => {
    if (!usage || !usage[resource]) return false;
    
    const { current, limit } = usage[resource] as { current: number; limit: number };
    return (current / limit) > 0.8;
  };

  // Check if user can use a feature (has feature + not at limit)
  const canUseFeature = (feature: string): boolean => {
    if (!hasFeature(feature)) return false;
    
    // Check relevant limits based on feature
    switch (feature) {
      case 'multiple_accounts':
        return !isNearLimit('accounts');
      case 'unlimited_profiles':
        return !isNearLimit('profiles');
      case 'photo_uploads':
        return !isNearLimit('photos') && !isNearLimit('storage');
      case 'api_access':
        return !isNearLimit('apiCalls');
      default:
        return true;
    }
  };

  // Check if upgrade is required for a feature
  const upgradeRequired = (feature: string): boolean => {
    return !hasFeature(feature);
  };

  return {
    currentPlan,
    usage,
    hasFeature,
    isNearLimit,
    canUseFeature,
    upgradeRequired,
    isLoading,
    error: error as Error | null
  };
}

/**
 * Hook for checking specific subscription limits
 */
export function useSubscriptionLimits(tenantId: number, userId?: number) {
  const { usage, isLoading, error } = useSubscriptionFeatures(tenantId, userId);

  const checkLimit = (resource: keyof SubscriptionUsage, requested: number = 1): boolean => {
    if (!usage || !usage[resource]) return false;
    
    const { current, limit } = usage[resource] as { current: number; limit: number };
    return (current + requested) <= limit;
  };

  const getRemainingLimit = (resource: keyof SubscriptionUsage): number => {
    if (!usage || !usage[resource]) return 0;
    
    const { current, limit } = usage[resource] as { current: number; limit: number };
    return Math.max(0, limit - current);
  };

  const getUsagePercentage = (resource: keyof SubscriptionUsage): number => {
    if (!usage || !usage[resource]) return 0;
    
    const { current, limit } = usage[resource] as { current: number; limit: number };
    return Math.min(100, (current / limit) * 100);
  };

  return {
    usage,
    checkLimit,
    getRemainingLimit,
    getUsagePercentage,
    isLoading,
    error
  };
}

/**
 * Hook for feature access gating
 */
export function useFeatureAccess(feature: string, tenantId: number, userId?: number) {
  const { hasFeature, canUseFeature, upgradeRequired, isLoading } = useSubscriptionFeatures(tenantId, userId);

  const isEnabled = hasFeature(feature);
  const canUse = canUseFeature(feature);
  const needsUpgrade = upgradeRequired(feature);

  return {
    isEnabled,
    canUse,
    needsUpgrade,
    isLoading,
    // Convenience methods
    showUpgradePrompt: needsUpgrade,
    showLimitWarning: isEnabled && !canUse
  };
} 