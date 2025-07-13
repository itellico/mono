'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Crown, 
  Users, 
  Star,
  Check,
  ArrowRight,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { browserLogger } from '@/lib/browser-logger';

/**
 * PlanSelector Component
 * 
 * Interactive subscription plan comparison and selection interface
 * with feature comparisons, pricing toggles, and upgrade paths.
 * 
 * @component PlanSelector
 * @param {PlanSelectorProps} props - Component props
 * @returns {JSX.Element} Plan selection interface
 * 
 * @example
 * ```tsx
 * <PlanSelector
 *   currentPlan="pro"
 *   onSelectPlan={(planId) => handleUpgrade(planId)}
 *   onContactSales={() => navigate('/contact')}
 * />
 * ```
 */

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
  highlight?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  popular?: boolean;
  features: PlanFeature[];
  limits: {
    accounts: number;
    profiles: number;
    photos: number;
    storage: string;
    apiCalls: string;
  };
  cta: string;
}

export interface PlanSelectorProps {
  /** Currently active plan */
  currentPlan?: string;
  /** Plan selection handler */
  onSelectPlan?: (planId: string, billing: 'monthly' | 'yearly') => void;
  /** Contact sales handler for enterprise */
  onContactSales?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Show current plan badge */
  showCurrentPlan?: boolean;
  /** Allow plan downgrades */
  allowDowngrade?: boolean;
}

// Plan definitions
const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Starter',
    tier: 'free',
    description: 'Perfect for individual creators getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { name: 'Basic Profile Management', included: true },
      { name: 'Photo Uploads', included: true, limit: '10 photos' },
      { name: 'Search & Discovery', included: true },
      { name: 'Email Support', included: true },
      { name: 'Multiple Accounts', included: false },
      { name: 'Advanced Analytics', included: false },
      { name: 'API Access', included: false },
      { name: 'Priority Support', included: false }
    ],
    limits: {
      accounts: 1,
      profiles: 1,
      photos: 10,
      storage: '100 MB',
      apiCalls: 'None'
    },
    cta: 'Get Started'
  },
  {
    id: 'pro',
    name: 'Professional',
    tier: 'pro',
    description: 'Best for agencies and growing businesses',
    monthlyPrice: 29,
    yearlyPrice: 299,
    popular: true,
    features: [
      { name: 'Everything in Starter', included: true },
      { name: 'Multiple Accounts', included: true, highlight: true },
      { name: 'Unlimited Profiles', included: true, highlight: true },
      { name: 'Photo Uploads', included: true, limit: '1,000 photos' },
      { name: 'Advanced Analytics', included: true },
      { name: 'API Access', included: true },
      { name: 'Priority Support', included: true },
      { name: 'Custom Branding', included: false }
    ],
    limits: {
      accounts: 10,
      profiles: 100,
      photos: 1000,
      storage: '10 GB',
      apiCalls: '5,000/month'
    },
    cta: 'Start Free Trial'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    description: 'For large organizations with advanced needs',
    monthlyPrice: 99,
    yearlyPrice: 999,
    features: [
      { name: 'Everything in Professional', included: true },
      { name: 'Unlimited Everything', included: true, highlight: true },
      { name: 'Custom Branding', included: true },
      { name: 'Advanced Security', included: true },
      { name: 'Dedicated Support', included: true },
      { name: 'SLA Guarantee', included: true },
      { name: 'Custom Integrations', included: true },
      { name: 'Onboarding Support', included: true }
    ],
    limits: {
      accounts: Infinity,
      profiles: Infinity,
      photos: Infinity,
      storage: 'Unlimited',
      apiCalls: 'Unlimited'
    },
    cta: 'Contact Sales'
  }
];

export function PlanSelector({
  currentPlan,
  onSelectPlan,
  onContactSales,
  className,
  showCurrentPlan = true,
  allowDowngrade = false
}: PlanSelectorProps) {
  const [isYearly, setIsYearly] = useState(false);

  // Handle plan selection
  const handleSelectPlan = (planId: string) => {
    const billing = isYearly ? 'yearly' : 'monthly';
    
    browserLogger.userAction('plan_select_click', 'PlanSelector', {
      planId,
      billing,
      currentPlan
    });

    if (planId === 'enterprise') {
      onContactSales?.();
    } else {
      onSelectPlan?.(planId, billing);
    }
  };

  // Handle billing toggle
  const handleBillingToggle = (yearly: boolean) => {
    setIsYearly(yearly);
    browserLogger.userAction('billing_toggle', 'PlanSelector', {
      billing: yearly ? 'yearly' : 'monthly'
    });
  };

  // Get plan styling
  const getPlanStyling = (plan: Plan) => {
    if (plan.popular) {
      return {
        icon: Star,
        cardClass: 'ring-2 ring-blue-500 relative',
        headerClass: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white',
        buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white'
      };
    }
    
    if (plan.tier === 'enterprise') {
      return {
        icon: Crown,
        cardClass: 'border-purple-200',
        headerClass: 'bg-purple-50',
        buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white'
      };
    }
    
    return {
      icon: Users,
      cardClass: 'border-gray-200',
      headerClass: 'bg-gray-50',
      buttonClass: 'bg-gray-600 hover:bg-gray-700 text-white'
    };
  };

  // Check if plan is downgradable
  const isDowngrade = (planId: string): boolean => {
    if (!currentPlan) return false;
    
    const currentIndex = PLANS.findIndex(p => p.id === currentPlan);
    const targetIndex = PLANS.findIndex(p => p.id === planId);
    
    return targetIndex < currentIndex;
  };

  // Calculate yearly savings
  const getYearlySavings = (plan: Plan): number => {
    if (plan.monthlyPrice === 0) return 0;
    const monthlyTotal = plan.monthlyPrice * 12;
    return monthlyTotal - plan.yearlyPrice;
  };

  return (
    <div className={cn('space-y-8', className)}>
      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4 bg-gray-100 rounded-lg p-1">
          <span className={cn('px-3 py-2 text-sm font-medium', !isYearly && 'text-blue-600')}>
            Monthly
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={handleBillingToggle}
            className="data-[state=checked]:bg-blue-600"
          />
          <span className={cn('px-3 py-2 text-sm font-medium flex items-center space-x-2', isYearly && 'text-blue-600')}>
            <span>Yearly</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Save up to 17%
            </Badge>
          </span>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const styling = getPlanStyling(plan);
          const PlanIcon = styling.icon;
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
          const yearlySavings = getYearlySavings(plan);
          const isCurrentPlan = currentPlan === plan.id;
          const isDowngradeAction = isDowngrade(plan.id);
          const canSelect = !isCurrentPlan && (allowDowngrade || !isDowngradeAction);

          return (
            <Card key={plan.id} className={cn('relative', styling.cardClass)}>
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && showCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="default" className="bg-green-600 text-white">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className={styling.headerClass}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <PlanIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className={plan.popular ? 'text-blue-100' : 'text-gray-600'}>
                      {plan.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Pricing */}
                <div className="text-center">
                  <div className="flex items-baseline justify-center space-x-2">
                    <span className="text-4xl font-bold">
                      ${price === 0 ? '0' : price}
                    </span>
                    {price > 0 && (
                      <span className="text-gray-600">
                        /{isYearly ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                  
                  {isYearly && yearlySavings > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      Save ${yearlySavings}/year
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <div className="h-5 w-5 border-2 border-gray-300 rounded mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <span className={cn(
                          'text-sm',
                          feature.included ? 'text-gray-900' : 'text-gray-400',
                          feature.highlight && 'font-medium text-blue-600'
                        )}>
                          {feature.name}
                        </span>
                        {feature.limit && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({feature.limit})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Limits Summary */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Usage Limits</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Accounts: {plan.limits.accounts === Infinity ? 'Unlimited' : plan.limits.accounts}</div>
                    <div>Profiles: {plan.limits.profiles === Infinity ? 'Unlimited' : plan.limits.profiles}</div>
                    <div>Photos: {plan.limits.photos === Infinity ? 'Unlimited' : plan.limits.photos}</div>
                    <div>Storage: {plan.limits.storage}</div>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className={cn('w-full', styling.buttonClass)}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={!canSelect}
                  variant={isCurrentPlan ? 'outline' : 'default'}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {plan.tier === 'enterprise' ? (
                      <>
                        <Shield className="h-4 w-4" />
                        <span>{plan.cta}</span>
                      </>
                    ) : isCurrentPlan ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Current Plan</span>
                      </>
                    ) : isDowngradeAction ? (
                      <>
                        <span>Downgrade to {plan.name}</span>
                      </>
                    ) : (
                      <>
                        <span>{plan.cta}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </div>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Information */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          All plans include 14-day free trial • No setup fees • Cancel anytime
        </p>
        <div className="flex justify-center items-center space-x-6 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>SSL Security</span>
          </div>
          <div className="flex items-center space-x-1">
            <Zap className="h-3 w-3" />
            <span>99.9% Uptime</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  );
} 