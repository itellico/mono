'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Camera, 
  HardDrive, 
  Zap,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  XCircle,
  ArrowUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { browserLogger } from '@/lib/browser-logger';

/**
 * UsageLimitsDisplay Component
 * 
 * Real-time subscription usage monitoring with progress indicators,
 * warning states, and upgrade prompts for limit management.
 * 
 * @component UsageLimitsDisplay
 * @param {UsageLimitsDisplayProps} props - Component props
 * @returns {JSX.Element} Usage limits interface
 * 
 * @example
 * ```tsx
 * <UsageLimitsDisplay
 *   subscriptionData={subscriptionData}
 *   onUpgrade={() => navigate('/billing/upgrade')}
 *   showUpgradePrompts={true}
 * />
 * ```
 */

export interface UsageLimit {
  resource: string;
  icon: React.ElementType;
  current: number;
  limit: number;
  unlimited?: boolean;
  unit: string;
  description: string;
  warningThreshold: number; // Percentage at which to show warning
  criticalThreshold: number; // Percentage at which to show critical state
}

export interface SubscriptionUsageData {
  planName: string;
  planTier: 'free' | 'pro' | 'enterprise';
  limits: UsageLimit[];
  billingCycle: 'monthly' | 'yearly';
  renewalDate: string;
  upgradeAvailable: boolean;
}

export interface UsageLimitsDisplayProps {
  /** Subscription and usage data */
  subscriptionData: SubscriptionUsageData;
  /** Upgrade action handler */
  onUpgrade?: () => void;
  /** View detailed usage handler */
  onViewDetails?: () => void;
  /** Show upgrade prompts */
  showUpgradePrompts?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Compact display mode */
  compact?: boolean;
}

export function UsageLimitsDisplay({
  subscriptionData,
  onUpgrade,
  onViewDetails,
  showUpgradePrompts = true,
  className,
  compact = false
}: UsageLimitsDisplayProps) {
  
  // Calculate usage percentage
  const getUsagePercentage = (current: number, limit: number, unlimited: boolean = false): number => {
    if (unlimited) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  // Get usage status
  const getUsageStatus = (percentage: number, warningThreshold: number, criticalThreshold: number) => {
    if (percentage >= criticalThreshold) return 'critical';
    if (percentage >= warningThreshold) return 'warning';
    return 'normal';
  };

  // Get status styling
  const getStatusStyling = (status: string) => {
    switch (status) {
      case 'critical':
        return {
          progressClass: 'bg-red-500',
          badgeClass: 'bg-red-100 text-red-700',
          iconClass: 'text-red-500',
          icon: XCircle
        };
      case 'warning':
        return {
          progressClass: 'bg-yellow-500',
          badgeClass: 'bg-yellow-100 text-yellow-700',
          iconClass: 'text-yellow-500',
          icon: AlertTriangle
        };
      default:
        return {
          progressClass: 'bg-green-500',
          badgeClass: 'bg-green-100 text-green-700',
          iconClass: 'text-green-500',
          icon: CheckCircle
        };
    }
  };

  // Handle upgrade click
  const handleUpgradeClick = () => {
    browserLogger.userAction('usage_upgrade_click', 'UsageLimitsDisplay', {
      currentPlan: subscriptionData.planName,
      planTier: subscriptionData.planTier
    });
    onUpgrade?.();
  };

  // Handle details click
  const handleDetailsClick = () => {
    browserLogger.userAction('usage_details_click', 'UsageLimitsDisplay', {
      currentPlan: subscriptionData.planName
    });
    onViewDetails?.();
  };

  // Check if any limits are near critical
  const hasWarnings = subscriptionData.limits.some(limit => {
    const percentage = getUsagePercentage(limit.current, limit.limit, limit.unlimited);
    return percentage >= limit.warningThreshold;
  });

  const hasCritical = subscriptionData.limits.some(limit => {
    const percentage = getUsagePercentage(limit.current, limit.limit, limit.unlimited);
    return percentage >= limit.criticalThreshold;
  });

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Usage & Limits</h3>
          <p className="text-sm text-gray-600">
            {subscriptionData.planName} Plan • Renews {subscriptionData.renewalDate}
          </p>
        </div>
        {!compact && (
          <Button variant="outline" onClick={handleDetailsClick}>
            View Details
          </Button>
        )}
      </div>

      {/* Critical Alerts */}
      {hasCritical && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            You&apos;ve reached critical usage limits. Upgrade now to avoid service interruption.
            <Button 
              variant="link" 
              className="p-0 h-auto text-red-700 underline ml-2"
              onClick={handleUpgradeClick}
            >
              Upgrade Plan
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Warning Alerts */}
      {hasWarnings && !hasCritical && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-700">
            You&apos;re approaching your usage limits. Consider upgrading to avoid interruption.
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Limits Grid */}
      <div className={cn(
        'grid gap-4',
        compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
      )}>
        {subscriptionData.limits.map((limit) => {
          const percentage = getUsagePercentage(limit.current, limit.limit, limit.unlimited);
          const status = getUsageStatus(percentage, limit.warningThreshold, limit.criticalThreshold);
          const styling = getStatusStyling(status);
          const StatusIcon = styling.icon;
          const ResourceIcon = limit.icon;

          return (
            <Card key={limit.resource} className="relative">
              <CardHeader className={compact ? 'pb-3' : 'pb-4'}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <ResourceIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{limit.resource}</CardTitle>
                      {!compact && (
                        <CardDescription className="text-sm">
                          {limit.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={cn('h-4 w-4', styling.iconClass)} />
                    {!limit.unlimited && (
                      <Badge variant="outline" className={styling.badgeClass}>
                        {Math.round(percentage)}%
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Usage Stats */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {limit.current.toLocaleString()} {limit.unit}
                  </span>
                  <span className="text-gray-600">
                    {limit.unlimited ? 'Unlimited' : `${limit.limit.toLocaleString()} ${limit.unit}`}
                  </span>
                </div>

                {/* Progress Bar */}
                {!limit.unlimited && (
                  <div className="space-y-2">
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Used</span>
                      <span>
                        {limit.limit - limit.current > 0 ? 
                          `${(limit.limit - limit.current).toLocaleString()} remaining` : 
                          'Limit reached'
                        }
                      </span>
                    </div>
                  </div>
                )}

                {/* Unlimited Badge */}
                {limit.unlimited && (
                  <div className="flex items-center justify-center py-2">
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Unlimited
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upgrade Prompt */}
      {showUpgradePrompts && subscriptionData.upgradeAvailable && (hasWarnings || compact) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">
                    Need more resources?
                  </h4>
                  <p className="text-sm text-blue-700">
                    Upgrade your plan to get higher limits and premium features.
                  </p>
                </div>
              </div>
              <Button onClick={handleUpgradeClick} className="bg-blue-600 hover:bg-blue-700">
                <ArrowUp className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Insights */}
      {!compact && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Usage Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold text-lg text-gray-900">
                {subscriptionData.limits.reduce((sum, limit) => sum + limit.current, 0).toLocaleString()}
              </div>
              <div className="text-gray-600">Total Usage</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold text-lg text-gray-900">
                {Math.round(
                  subscriptionData.limits
                    .filter(l => !l.unlimited)
                    .reduce((sum, limit) => sum + getUsagePercentage(limit.current, limit.limit), 0) /
                  subscriptionData.limits.filter(l => !l.unlimited).length
                )}%
              </div>
              <div className="text-gray-600">Avg. Usage</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold text-lg text-gray-900 capitalize">
                {subscriptionData.billingCycle}
              </div>
              <div className="text-gray-600">Billing Cycle</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 