'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lock, 
  Crown, 
  Sparkles, 
  ArrowRight,
  Star,
  Shield,
  Zap,
  Users,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { browserLogger } from '@/lib/browser-logger';

/**
 * FeatureAccessGate Component
 * 
 * Conditional content rendering based on subscription features,
 * permissions, and usage limits with upgrade prompts.
 * 
 * @component FeatureAccessGate
 * @param {FeatureAccessGateProps} props - Component props
 * @returns {JSX.Element} Feature gated content or upgrade prompt
 * 
 * @example
 * ```tsx
 * <FeatureAccessGate
 *   feature="multiple_accounts"
 *   requiredPlan="pro"
 *   fallback={<UpgradePrompt />}
 * >
 *   <MultipleAccountManager />
 * </FeatureAccessGate>
 * ```
 */

export interface FeatureRequirement {
  /** Feature identifier */
  feature: string;
  /** Minimum required plan */
  requiredPlan: 'free' | 'pro' | 'enterprise';
  /** Required permission (optional) */
  permission?: string;
  /** Usage limit check */
  usageCheck?: {
    resource: string;
    current: number;
    limit: number;
  };
}

export interface UpgradePromptConfig {
  /** Prompt title */
  title: string;
  /** Prompt description */
  description: string;
  /** Features unlocked by upgrade */
  features: string[];
  /** Call to action text */
  ctaText: string;
  /** Visual style variant */
  variant: 'card' | 'inline' | 'modal' | 'banner';
  /** Show feature comparison */
  showComparison?: boolean;
}

export interface FeatureAccessGateProps {
  /** Feature requirements to check */
  requirement: FeatureRequirement;
  /** Current user subscription data */
  userSubscription?: {
    plan: 'free' | 'pro' | 'enterprise';
    features: string[];
    permissions: string[];
    usage: Record<string, { current: number; limit: number }>;
  };
  /** Content to render when access is granted */
  children: React.ReactNode;
  /** Fallback content when access is denied */
  fallback?: React.ReactNode;
  /** Upgrade prompt configuration */
  upgradePrompt?: UpgradePromptConfig;
  /** Upgrade action handler */
  onUpgrade?: () => void;
  /** Contact sales handler for enterprise features */
  onContactSales?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Silent mode - don't render anything if access denied */
  silent?: boolean;
  /** Show loading state */
  loading?: boolean;
}

// Plan hierarchy for upgrade logic
const PLAN_HIERARCHY = {
  free: 0,
  pro: 1,
  enterprise: 2
};

// Default upgrade prompts for common features
const DEFAULT_UPGRADE_PROMPTS: Record<string, UpgradePromptConfig> = {
  multiple_accounts: {
    title: 'Multiple Accounts',
    description: 'Manage multiple talent accounts from a single dashboard',
    features: ['Up to 10 accounts', 'Centralized management', 'Bulk operations'],
    ctaText: 'Upgrade to Pro',
    variant: 'card'
  },
  unlimited_profiles: {
    title: 'Unlimited Profiles',
    description: 'Create unlimited talent profiles without restrictions',
    features: ['Unlimited profiles', 'Advanced analytics', 'Priority support'],
    ctaText: 'Upgrade to Pro',
    variant: 'card'
  },
  api_access: {
    title: 'API Access',
    description: 'Integrate with external systems using our powerful API',
    features: ['5,000 API calls/month', 'Webhook support', 'Documentation access'],
    ctaText: 'Upgrade to Pro',
    variant: 'card'
  },
  custom_branding: {
    title: 'Custom Branding',
    description: 'White-label the platform with your company branding',
    features: ['Custom logo & colors', 'Remove mono branding', 'Custom domain'],
    ctaText: 'Contact Sales',
    variant: 'card'
  },
  advanced_analytics: {
    title: 'Advanced Analytics',
    description: 'Deep insights into your talent and performance metrics',
    features: ['Detailed reports', 'Export capabilities', 'Custom dashboards'],
    ctaText: 'Upgrade to Pro',
    variant: 'inline'
  }
};

export function FeatureAccessGate({
  requirement,
  userSubscription,
  children,
  fallback,
  upgradePrompt,
  onUpgrade,
  onContactSales,
  className,
  silent = false,
  loading = false
}: FeatureAccessGateProps) {

  // Check if feature access is granted
  const checkAccess = (): { 
    granted: boolean; 
    reason?: 'plan' | 'permission' | 'usage' | 'unknown' 
  } => {
    if (!userSubscription) {
      return { granted: false, reason: 'unknown' };
    }

    // Check plan requirement
    const currentPlanLevel = PLAN_HIERARCHY[userSubscription.plan];
    const requiredPlanLevel = PLAN_HIERARCHY[requirement.requiredPlan];
    
    if (currentPlanLevel < requiredPlanLevel) {
      return { granted: false, reason: 'plan' };
    }

    // Check specific feature availability
    if (!userSubscription.features.includes(requirement.feature)) {
      return { granted: false, reason: 'plan' };
    }

    // Check permission requirement
    if (requirement.permission && !userSubscription.permissions.includes(requirement.permission)) {
      return { granted: false, reason: 'permission' };
    }

    // Check usage limits
    if (requirement.usageCheck) {
      const { resource, current, limit } = requirement.usageCheck;
      const usage = userSubscription.usage[resource];
      
      if (usage && usage.current >= usage.limit) {
        return { granted: false, reason: 'usage' };
      }
    }

    return { granted: true };
  };

  // Handle upgrade action
  const handleUpgrade = () => {
    browserLogger.userAction('feature_gate_upgrade_click', 'FeatureAccessGate', {
      feature: requirement.feature,
      requiredPlan: requirement.requiredPlan,
      currentPlan: userSubscription?.plan
    });

    if (requirement.requiredPlan === 'enterprise') {
      onContactSales?.();
    } else {
      onUpgrade?.();
    }
  };

  // Get upgrade prompt configuration
  const getUpgradePrompt = (): UpgradePromptConfig => {
    if (upgradePrompt) return upgradePrompt;
    return DEFAULT_UPGRADE_PROMPTS[requirement.feature] || {
      title: 'Premium Feature',
      description: 'This feature requires a higher subscription plan',
      features: ['Enhanced functionality', 'Premium support'],
      ctaText: requirement.requiredPlan === 'enterprise' ? 'Contact Sales' : 'Upgrade Plan',
      variant: 'card'
    };
  };

  // Get plan badge styling
  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return { icon: Crown, class: 'bg-purple-100 text-purple-700' };
      case 'pro':
        return { icon: Star, class: 'bg-blue-100 text-blue-700' };
      default:
        return { icon: Users, class: 'bg-gray-100 text-gray-700' };
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn('animate-pulse space-y-4', className)}>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  const access = checkAccess();

  // Grant access - render children
  if (access.granted) {
    return <div className={className}>{children}</div>;
  }

  // Silent mode - render nothing if access denied
  if (silent) {
    return null;
  }

  // Custom fallback provided
  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  // Render upgrade prompt
  const prompt = getUpgradePrompt();
  const planBadge = getPlanBadge(requirement.requiredPlan);
  const PlanIcon = planBadge.icon;

  // Inline variant
  if (prompt.variant === 'inline') {
    return (
      <div className={cn('p-4 border border-gray-200 rounded-lg bg-gray-50', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Lock className="h-5 w-5 text-gray-400" />
            <div>
              <span className="text-sm font-medium text-gray-900">{prompt.title}</span>
              <p className="text-xs text-gray-600">{prompt.description}</p>
            </div>
          </div>
          <Button size="sm" onClick={handleUpgrade}>
            {prompt.ctaText}
          </Button>
        </div>
      </div>
    );
  }

  // Banner variant
  if (prompt.variant === 'banner') {
    return (
      <Alert className={cn('border-blue-200 bg-blue-50', className)}>
        <Lock className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <div className="flex items-center justify-between">
            <span>{prompt.description}</span>
            <Button variant="link" onClick={handleUpgrade} className="text-blue-700 underline">
              {prompt.ctaText}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Card variant (default)
  return (
    <Card className={cn('border-dashed border-2 border-gray-300', className)}>
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-gray-100 rounded-full">
            <Lock className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        
        <div className="flex items-center justify-center space-x-2 mb-2">
          <CardTitle className="text-xl">{prompt.title}</CardTitle>
          <Badge className={planBadge.class}>
            <PlanIcon className="h-3 w-3 mr-1" />
            {requirement.requiredPlan.charAt(0).toUpperCase() + requirement.requiredPlan.slice(1)}
          </Badge>
        </div>
        
        <CardDescription className="text-gray-600">
          {prompt.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Feature List */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900">What you&apos;ll get:</h4>
          <ul className="space-y-2">
            {prompt.features.map((feature, index) => (
              <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Usage Warning (if applicable) */}
        {access.reason === 'usage' && requirement.usageCheck && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-700 text-sm">
              You&apos;ve reached your {requirement.usageCheck.resource} limit. 
              Upgrade to continue using this feature.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          <Button onClick={handleUpgrade} className="w-full">
            {requirement.requiredPlan === 'enterprise' ? (
              <>
                <Shield className="h-4 w-4 mr-2" />
                {prompt.ctaText}
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                {prompt.ctaText}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
          
          {prompt.showComparison && (
            <Button variant="outline" className="w-full">
              Compare Plans
            </Button>
          )}
        </div>

        {/* Additional Info */}
        <div className="text-center text-xs text-gray-500">
          {requirement.requiredPlan === 'enterprise' ? 
            'Custom pricing • Dedicated support • SLA included' :
            '14-day free trial • No setup fees • Cancel anytime'
          }
        </div>
      </CardContent>
    </Card>
  );
} 