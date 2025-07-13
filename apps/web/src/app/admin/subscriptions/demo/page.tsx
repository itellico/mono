import React from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Camera, 
  HardDrive, 
  Zap,
  CreditCard,
  Shield,
  Activity,
  Lock
} from 'lucide-react';
import { PlanSelector } from '@/components/subscriptions/PlanSelector';
import { UsageLimitsDisplay } from '@/components/subscriptions/UsageLimitsDisplay';
import { FeatureAccessGate } from '@/components/subscriptions/FeatureAccessGate';
import type { SubscriptionUsageData } from '@/components/subscriptions/UsageLimitsDisplay';

export const metadata: Metadata = {
  title: 'Subscription Components Demo - itellico Mono',
  description: 'Comprehensive showcase of subscription management components',
};

/**
 * Subscription Components Demo Page
 * 
 * Comprehensive showcase of all subscription-related components
 * including plan selection, usage monitoring, and feature gating.
 */

// Mock subscription data for demo
const MOCK_SUBSCRIPTION_DATA: SubscriptionUsageData = {
  planName: 'Professional',
  planTier: 'pro',
  billingCycle: 'monthly',
  renewalDate: 'March 15, 2025',
  upgradeAvailable: true,
  limits: [
    {
      resource: 'Accounts',
      icon: Users,
      current: 7,
      limit: 10,
      unit: 'accounts',
      description: 'Talent accounts you can manage',
      warningThreshold: 80,
      criticalThreshold: 95
    },
    {
      resource: 'Profiles',
      icon: Users,
      current: 85,
      limit: 100,
      unit: 'profiles',
      description: 'Individual talent profiles',
      warningThreshold: 80,
      criticalThreshold: 95
    },
    {
      resource: 'Photos',
      icon: Camera,
      current: 750,
      limit: 1000,
      unit: 'photos',
      description: 'Photo uploads per month',
      warningThreshold: 75,
      criticalThreshold: 90
    },
    {
      resource: 'Storage',
      icon: HardDrive,
      current: 8.5,
      limit: 10,
      unit: 'GB',
      description: 'File storage space',
      warningThreshold: 80,
      criticalThreshold: 95
    },
    {
      resource: 'API Calls',
      icon: Zap,
      current: 4200,
      limit: 5000,
      unit: 'calls',
      description: 'API requests per month',
      warningThreshold: 80,
      criticalThreshold: 95
    }
  ]
};

// Mock user subscription for feature gates
const MOCK_USER_SUBSCRIPTION = {
  plan: 'pro' as const,
  features: ['multiple_accounts', 'unlimited_profiles', 'api_access', 'advanced_analytics'],
  permissions: ['accounts.create', 'profiles.manage', 'api.access'],
  usage: {
    accounts: { current: 7, limit: 10 },
    profiles: { current: 85, limit: 100 },
    photos: { current: 750, limit: 1000 },
    storage: { current: 8.5, limit: 10 },
    api_calls: { current: 4200, limit: 5000 }
  }
};

export default function SubscriptionDemoPage() {
  
  // Mock handlers
  const handlePlanSelect = (planId: string, billing: 'monthly' | 'yearly') => {
    console.log('Plan selected:', { planId, billing });
  };

  const handleContactSales = () => {
    console.log('Contact sales clicked');
  };

  const handleUpgrade = () => {
    console.log('Upgrade clicked');
  };

  const handleViewDetails = () => {
    console.log('View details clicked');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Components Demo</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive showcase of subscription management components for the itellico Mono
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          Phase 3 Demo
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-gray-600">+8.2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <Activity className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <p className="text-xs text-gray-600">+12.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upgrade Rate</CardTitle>
            <Shield className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18.5%</div>
            <p className="text-xs text-gray-600">+2.3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <Lock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1%</div>
            <p className="text-xs text-gray-600">-0.5% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Component Showcase */}
      <Tabs defaultValue="plan-selector" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="plan-selector">Plan Selector</TabsTrigger>
          <TabsTrigger value="usage-limits">Usage Limits</TabsTrigger>
          <TabsTrigger value="feature-gates">Feature Gates</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        {/* Plan Selector Tab */}
        <TabsContent value="plan-selector" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>PlanSelector Component</CardTitle>
              <CardDescription>
                Interactive subscription plan comparison and selection interface with 
                feature comparisons, pricing toggles, and upgrade paths.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlanSelector
                currentPlan="pro"
                onSelectPlan={handlePlanSelect}
                onContactSales={handleContactSales}
                showCurrentPlan={true}
                allowDowngrade={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Limits Tab */}
        <TabsContent value="usage-limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>UsageLimitsDisplay Component</CardTitle>
              <CardDescription>
                Real-time subscription usage monitoring with progress indicators,
                warning states, and upgrade prompts for limit management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsageLimitsDisplay
                subscriptionData={MOCK_SUBSCRIPTION_DATA}
                onUpgrade={handleUpgrade}
                onViewDetails={handleViewDetails}
                showUpgradePrompts={true}
              />
            </CardContent>
          </Card>

          {/* Compact Version */}
          <Card>
            <CardHeader>
              <CardTitle>Compact Usage Display</CardTitle>
              <CardDescription>
                Condensed version for dashboards and sidebar widgets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsageLimitsDisplay
                subscriptionData={MOCK_SUBSCRIPTION_DATA}
                onUpgrade={handleUpgrade}
                onViewDetails={handleViewDetails}
                compact={true}
                showUpgradePrompts={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Gates Tab */}
        <TabsContent value="feature-gates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Multiple Accounts Feature */}
            <Card>
              <CardHeader>
                <CardTitle>Multiple Accounts (Pro Feature)</CardTitle>
                <CardDescription>User has access - content renders normally</CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureAccessGate
                  requirement={{
                    feature: 'multiple_accounts',
                    requiredPlan: 'pro'
                  }}
                  userSubscription={MOCK_USER_SUBSCRIPTION}
                  onUpgrade={handleUpgrade}
                  onContactSales={handleContactSales}
                >
                  <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900">Multiple Accounts Manager</h4>
                    <p className="text-sm text-green-700 mt-1">
                      This feature is available! Manage up to 10 talent accounts from here.
                    </p>
                  </div>
                </FeatureAccessGate>
              </CardContent>
            </Card>

            {/* Custom Branding Feature (Enterprise) */}
            <Card>
              <CardHeader>
                <CardTitle>Custom Branding (Enterprise Feature)</CardTitle>
                <CardDescription>User needs upgrade - shows promotion</CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureAccessGate
                  requirement={{
                    feature: 'custom_branding',
                    requiredPlan: 'enterprise'
                  }}
                  userSubscription={MOCK_USER_SUBSCRIPTION}
                  onUpgrade={handleUpgrade}
                  onContactSales={handleContactSales}
                >
                  <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900">Custom Branding Panel</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Upload your logo and customize platform colors.
                    </p>
                  </div>
                </FeatureAccessGate>
              </CardContent>
            </Card>

            {/* Inline Feature Gate */}
            <Card>
              <CardHeader>
                <CardTitle>Inline Feature Gate</CardTitle>
                <CardDescription>Compact upgrade prompt for smaller spaces</CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureAccessGate
                  requirement={{
                    feature: 'advanced_analytics',
                    requiredPlan: 'enterprise'
                  }}
                  userSubscription={MOCK_USER_SUBSCRIPTION}
                  upgradePrompt={{
                    title: 'Advanced Analytics',
                    description: 'Get detailed insights and reports',
                    features: ['Custom dashboards', 'Export capabilities', 'API access'],
                    ctaText: 'Contact Sales',
                    variant: 'inline'
                  }}
                  onUpgrade={handleUpgrade}
                  onContactSales={handleContactSales}
                >
                  <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900">Analytics Dashboard</h4>
                  </div>
                </FeatureAccessGate>
              </CardContent>
            </Card>

            {/* Usage Limit Gate */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Limit Gate</CardTitle>
                <CardDescription>Feature blocked by usage limits</CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureAccessGate
                  requirement={{
                    feature: 'photo_upload',
                    requiredPlan: 'free',
                    usageCheck: {
                      resource: 'photos',
                      current: 1000,
                      limit: 1000
                    }
                  }}
                  userSubscription={{
                    ...MOCK_USER_SUBSCRIPTION,
                    usage: {
                      ...MOCK_USER_SUBSCRIPTION.usage,
                      photos: { current: 1000, limit: 1000 }
                    }
                  }}
                  onUpgrade={handleUpgrade}
                >
                  <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900">Photo Upload</h4>
                  </div>
                </FeatureAccessGate>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Integration Tab */}
        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Component Integration Example</CardTitle>
              <CardDescription>
                Real-world example combining multiple subscription components in a dashboard layout.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Usage Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <UsageLimitsDisplay
                    subscriptionData={MOCK_SUBSCRIPTION_DATA}
                    onUpgrade={handleUpgrade}
                    onViewDetails={handleViewDetails}
                    compact={false}
                  />
                </div>
                
                <div className="space-y-4">
                  <FeatureAccessGate
                    requirement={{
                      feature: 'api_access',
                      requiredPlan: 'pro'
                    }}
                    userSubscription={MOCK_USER_SUBSCRIPTION}
                    upgradePrompt={{
                      title: 'API Access',
                      description: 'Integrate with external systems',
                      features: ['5,000 calls/month', 'Webhook support'],
                      ctaText: 'Available in Pro',
                      variant: 'card'
                    }}
                    onUpgrade={handleUpgrade}
                  >
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-green-900">API Access</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-green-700">
                          API integration is active. 4,200 of 5,000 calls used this month.
                        </p>
                      </CardContent>
                    </Card>
                  </FeatureAccessGate>

                  <FeatureAccessGate
                    requirement={{
                      feature: 'custom_branding',
                      requiredPlan: 'enterprise'
                    }}
                    userSubscription={MOCK_USER_SUBSCRIPTION}
                    upgradePrompt={{
                      title: 'Custom Branding',
                      description: 'White-label the platform',
                      features: ['Custom logo', 'Remove MONO branding', 'Custom domain'],
                      ctaText: 'Contact Sales',
                      variant: 'card'
                    }}
                    onContactSales={handleContactSales}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Custom Branding</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">Configure platform branding</p>
                      </CardContent>
                    </Card>
                  </FeatureAccessGate>
                </div>
              </div>

              <Separator />

              {/* Plan Comparison */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Upgrade Options</h3>
                <PlanSelector
                  currentPlan="pro"
                  onSelectPlan={handlePlanSelect}
                  onContactSales={handleContactSales}
                  showCurrentPlan={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Implementation Notes */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p className="text-sm">
            <strong>Components:</strong> All subscription components follow itellico Mono design patterns 
            with proper TypeScript interfaces, JSDoc documentation, and browser logging integration.
          </p>
          <p className="text-sm">
            <strong>Integration:</strong> These components can be used individually or combined in 
            dashboards, settings pages, and feature restriction scenarios.
          </p>
          <p className="text-sm">
            <strong>Data:</strong> Components accept subscription data from the itellico Mono API 
            and integrate with the unified permission system for feature gating.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 