"use client";

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CreditCard, 
  Package, 
  Zap, 
  Settings2, 
  Plus,
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionOverviewPanelProps {
  onNavigateToTab: (tab: string) => void;
}

interface SubscriptionStats {
  totalPlans: number;
  activePlans: number;
  totalFeatures: number;
  activeFeatures: number;
  totalLimits: number;
  totalRevenue: number;
  monthlyRevenue: number;
  tenantSubscriptions: number;
  agencySubscriptions: number;
  accountSubscriptions: number;
}

interface PlatformConfiguration {
  configurationProgress: number;
  totalSettings: number;
  configuredSettings: number;
}

// Mock data - will be replaced with real API calls
const mockSubscriptionStats: SubscriptionStats = {
  totalPlans: 12,
  activePlans: 8,
  totalFeatures: 25,
  activeFeatures: 20,
  totalLimits: 45,
  totalRevenue: 125000,
  monthlyRevenue: 15000,
  tenantSubscriptions: 5,
  agencySubscriptions: 23,
  accountSubscriptions: 156
};

const mockPlatformConfig: PlatformConfiguration = {
  configurationProgress: 85,
  totalSettings: 45,
  configuredSettings: 38
};

// Skeleton for overview metrics
function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SubscriptionOverviewPanel({ onNavigateToTab }: SubscriptionOverviewPanelProps) {
  const { toast } = useToast();

  // Fetch subscription statistics
  const { 
    data: subscriptionStats = mockSubscriptionStats, 
    isLoading: isStatsLoading,
    error: statsError 
  } = useQuery({
    queryKey: ['subscription-stats'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/v1/admin/subscriptions/stats');
      // if (!response.ok) throw new Error('Failed to fetch subscription stats');
      // return response.json();
      return mockSubscriptionStats;
    },
  });

  // Fetch platform configuration progress
  const { 
    data: platformConfig = mockPlatformConfig, 
    isLoading: isConfigLoading 
  } = useQuery({
    queryKey: ['platform-configuration'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return mockPlatformConfig;
    },
  });

  if (isStatsLoading || isConfigLoading) {
    return <OverviewSkeleton />;
  }

  if (statsError) {
    toast({
      title: "Error loading subscription data",
      description: "Failed to load subscription statistics. Please try again.",
      variant: "destructive",
    });
  }

  return (
    <div className="space-y-6">
      {/* Subscription Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{subscriptionStats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              €{subscriptionStats.monthlyRevenue.toLocaleString()}/month current
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription Plans</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionStats.activePlans}</div>
            <p className="text-xs text-muted-foreground">
              {subscriptionStats.totalPlans} total plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Features</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionStats.activeFeatures}</div>
            <p className="text-xs text-muted-foreground">
              {subscriptionStats.totalFeatures} features configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscriptionStats.tenantSubscriptions + subscriptionStats.agencySubscriptions + subscriptionStats.accountSubscriptions}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all subscription types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Subscription Breakdown
            </CardTitle>
            <CardDescription>
              Active subscriptions by type and tier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50">Tenant</Badge>
                <span className="text-sm">€999-9999/month</span>
              </div>
              <span className="font-medium">{subscriptionStats.tenantSubscriptions}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50">Agency</Badge>
                <span className="text-sm">€199-2999/month</span>
              </div>
              <span className="font-medium">{subscriptionStats.agencySubscriptions}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-purple-50">Account</Badge>
                <span className="text-sm">€0-199/month</span>
              </div>
              <span className="font-medium">{subscriptionStats.accountSubscriptions}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Platform Configuration
            </CardTitle>
            <CardDescription>
              Subscription management setup progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Configuration Progress</span>
                <span>{platformConfig.configurationProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${platformConfig.configurationProgress}%` }}
                />
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {platformConfig.configuredSettings} of {platformConfig.totalSettings} settings configured
            </div>

            <div className="pt-2">
              <Badge variant={platformConfig.configurationProgress >= 90 ? "default" : "secondary"}>
                {platformConfig.configurationProgress >= 90 ? "Complete" : "In Progress"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage subscription settings and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => onNavigateToTab('subscription-builder')}
            >
              <div className="flex items-center gap-2 w-full">
                <Package className="h-4 w-4" />
                <span className="font-medium">Subscription Builder</span>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Create and edit subscription plans
              </span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => onNavigateToTab('features')}
            >
              <div className="flex items-center gap-2 w-full">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Platform Features</span>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Manage available platform features
              </span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => onNavigateToTab('limits')}
            >
              <div className="flex items-center gap-2 w-full">
                <Settings2 className="h-4 w-4" />
                <span className="font-medium">Feature Limits</span>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Configure limits for features
              </span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => onNavigateToTab('bundler')}
            >
              <div className="flex items-center gap-2 w-full">
                <Plus className="h-4 w-4" />
                <span className="font-medium">Subscription Bundler</span>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Create custom subscription bundles
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 