'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Users, 
  Camera, 
  HardDrive, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  Settings,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscriptionFeatures } from '@/lib/hooks/useSubscriptionFeatures';
import { browserLogger } from '@/lib/browser-logger';

/**
 * SubscriptionDashboard Component
 * 
 * Displays comprehensive subscription information including current plan,
 * feature access, usage limits, and billing status with real-time updates.
 * 
 * @component SubscriptionDashboard
 * @param {SubscriptionDashboardProps} props - Component props
 * @returns {JSX.Element} Subscription dashboard interface
 * 
 * @example
 * ```tsx
 * <SubscriptionDashboard
 *   tenantId={1}
 *   userId={123}
 *   onUpgrade={() => navigate('/billing')}
 *   onManageSubscription={() => navigate('/billing/manage')}
 * />
 * ```
 */

export interface SubscriptionDashboardProps {
  /** Tenant ID for subscription context */
  tenantId: number;
  /** User ID for user-specific data */
  userId?: number;
  /** Upgrade handler */
  onUpgrade?: () => void;
  /** Manage subscription handler */
  onManageSubscription?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Compact view mode */
  compact?: boolean;
}

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

export function SubscriptionDashboard({
  tenantId,
  userId,
  onUpgrade,
  onManageSubscription,
  className,
  compact = false
}: SubscriptionDashboardProps) {
  // Use subscription features hook
  const {
    currentPlan,
    usage,
    hasFeature,
    isNearLimit,
    isLoading,
    error
  } = useSubscriptionFeatures(tenantId, userId);

  React.useEffect(() => {
    browserLogger.userAction('subscription_dashboard_view', 'SubscriptionDashboard', {
      tenantId,
      userId,
      planTier: currentPlan?.tier
    });
  }, [tenantId, userId, currentPlan]);

  // Handle upgrade button click
  const handleUpgrade = () => {
    browserLogger.userAction('subscription_upgrade_click', 'SubscriptionDashboard', {
      currentTier: currentPlan?.tier,
      tenantId
    });
    onUpgrade?.();
  };

  // Handle manage subscription click
  const handleManageSubscription = () => {
    browserLogger.userAction('subscription_manage_click', 'SubscriptionDashboard', {
      tenantId,
      planId: currentPlan?.id
    });
    onManageSubscription?.();
  };

  // Get plan tier styling
  const getPlanTierStyling = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return { 
          icon: Crown, 
          color: 'text-purple-600', 
          bg: 'bg-purple-50', 
          badge: 'bg-purple-100 text-purple-700'
        };
      case 'pro':
        return { 
          icon: ArrowUpRight, 
          color: 'text-blue-600', 
          bg: 'bg-blue-50', 
          badge: 'bg-blue-100 text-blue-700'
        };
      default:
        return { 
          icon: Users, 
          color: 'text-gray-600', 
          bg: 'bg-gray-50', 
          badge: 'bg-gray-100 text-gray-700'
        };
    }
  };

  // Get usage progress styling
  const getUsageProgress = (current: number, limit: number) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return { color: 'bg-red-500', warning: true };
    if (percentage >= 75) return { color: 'bg-yellow-500', warning: false };
    return { color: 'bg-green-500', warning: false };
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading subscription...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !currentPlan) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
              <p className="mt-2 text-red-600">Failed to load subscription</p>
              <p className="text-sm text-gray-600">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const planStyling = getPlanTierStyling(currentPlan.tier);
  const PlanIcon = planStyling.icon;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn('p-2 rounded-lg', planStyling.bg)}>
                <PlanIcon className={cn('h-6 w-6', planStyling.color)} />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>{currentPlan.name}</span>
                  <Badge className={planStyling.badge}>
                    {currentPlan.tier.toUpperCase()}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  ${currentPlan.price}/{currentPlan.billing} • 
                  Renews {new Date(currentPlan.currentPeriodEnd).toLocaleDateString()}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {currentPlan.status === 'active' && (
                <Badge variant="default" className="flex items-center space-x-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Active</span>
                </Badge>
              )}
              
              <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                <Settings className="h-4 w-4 mr-1" />
                Manage
              </Button>
              
              {currentPlan.tier !== 'enterprise' && (
                <Button size="sm" onClick={handleUpgrade}>
                  <Crown className="h-4 w-4 mr-1" />
                  Upgrade
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>
            Monitor your current usage against plan limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn(
            'grid gap-4',
            compact ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          )}>
            {/* Accounts Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Accounts</span>
                </div>
                <span className="text-sm text-gray-600">
                  {usage?.accounts.current || 0} / {usage?.accounts.limit || 0}
                </span>
              </div>
              <Progress 
                value={((usage?.accounts.current || 0) / (usage?.accounts.limit || 1)) * 100}
                className="h-2"
              />
              {isNearLimit('accounts') && (
                <p className="text-xs text-yellow-600 flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Approaching limit</span>
                </p>
              )}
            </div>

            {/* Profiles Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Profiles</span>
                </div>
                <span className="text-sm text-gray-600">
                  {usage?.profiles.current || 0} / {usage?.profiles.limit || 0}
                </span>
              </div>
              <Progress 
                value={((usage?.profiles.current || 0) / (usage?.profiles.limit || 1)) * 100}
                className="h-2"
              />
              {isNearLimit('profiles') && (
                <p className="text-xs text-yellow-600 flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Approaching limit</span>
                </p>
              )}
            </div>

            {/* Photos Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Camera className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Photos</span>
                </div>
                <span className="text-sm text-gray-600">
                  {usage?.photos.current || 0} / {usage?.photos.limit || 0}
                </span>
              </div>
              <Progress 
                value={((usage?.photos.current || 0) / (usage?.photos.limit || 1)) * 100}
                className="h-2"
              />
              {isNearLimit('photos') && (
                <p className="text-xs text-yellow-600 flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Approaching limit</span>
                </p>
              )}
            </div>

            {/* Storage Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Storage</span>
                </div>
                <span className="text-sm text-gray-600">
                  {usage?.storage.current || 0} / {usage?.storage.limit || 0} {usage?.storage.unit || 'GB'}
                </span>
              </div>
              <Progress 
                value={((usage?.storage.current || 0) / (usage?.storage.limit || 1)) * 100}
                className="h-2"
              />
              {isNearLimit('storage') && (
                <p className="text-xs text-yellow-600 flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Approaching limit</span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features & Access */}
      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Features</CardTitle>
            <CardDescription>
              Features included in your current subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
               {currentPlan.features.map((feature: string, index: number) => (
                 <div key={index} className="flex items-center space-x-2">
                   <CheckCircle2 className="h-4 w-4 text-green-500" />
                   <span className="text-sm">{feature}</span>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Information */}
      {!compact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Billing Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Current Period</span>
                <span className="text-sm text-gray-600">
                  Until {new Date(currentPlan.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Next Billing</span>
                <span className="text-sm text-gray-600">
                  ${currentPlan.price} on {new Date(currentPlan.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={currentPlan.status === 'active' ? 'default' : 'destructive'}>
                  {currentPlan.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 