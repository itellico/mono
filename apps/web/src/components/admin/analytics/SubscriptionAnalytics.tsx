'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  Users,
  CreditCard,
  Target,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  PieChart
} from 'lucide-react';

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
  monthlyGrowthRate: number;
  churnRate: number;
  conversionRate: number;
  refundRate: number;
}

interface SubscriptionBreakdown {
  plan: string;
  activeSubscriptions: number;
  revenue: number;
  avgMonthlyValue: number;
  growthRate: number;
  retentionRate: number;
  upgradeRate: number;
  features: string[];
}

interface FeatureUsage {
  featureName: string;
  totalUsers: number;
  bySubscriptionTier: { tier: string; users: number; usageRate: number }[];
  usageFrequency: number;
  satisfactionScore: number;
  isPopular: boolean;
}

interface RevenueTrend {
  date: string;
  revenue: number;
  subscriptions: number;
  upgrades: number;
  downgrades: number;
  churn: number;
}

/**
 * SubscriptionAnalytics - Comprehensive revenue tracking and subscription insights
 * providing detailed analytics for subscription management and optimization
 * 
 * @component
 * @example
 * ```tsx
 * <SubscriptionAnalytics />
 * ```
 */
export function SubscriptionAnalytics() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Fetch revenue metrics
  const { data: revenueMetrics, isLoading: revenueLoading } = useQuery<RevenueMetrics>({
    queryKey: ['revenue-metrics', selectedTimeRange],
    queryFn: async () => {
      // Mock data for demonstration
      return {
        totalRevenue: 127500,
        monthlyRevenue: 18750,
        averageRevenuePerUser: 77,
        customerLifetimeValue: 892,
        monthlyGrowthRate: 15.2,
        churnRate: 2.1,
        conversionRate: 12.4,
        refundRate: 0.8
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch subscription breakdown
  const { data: subscriptionBreakdown, isLoading: subscriptionLoading } = useQuery<SubscriptionBreakdown[]>({
    queryKey: ['subscription-breakdown', selectedTimeRange],
    queryFn: async () => {
      // Mock data for demonstration
      return [
        {
          plan: 'Free',
          activeSubscriptions: 847,
          revenue: 0,
          avgMonthlyValue: 0,
          growthRate: 8.3,
          retentionRate: 45.2,
          upgradeRate: 12.4,
          features: ['Basic Profile', 'Limited Uploads', 'Community Access']
        },
        {
          plan: 'Professional',
          activeSubscriptions: 654,
          revenue: 98100,
          avgMonthlyValue: 150,
          growthRate: 18.7,
          retentionRate: 89.3,
          upgradeRate: 8.9,
          features: ['Advanced Profiles', 'Unlimited Uploads', 'Analytics', 'Priority Support']
        },
        {
          plan: 'Enterprise',
          activeSubscriptions: 153,
          revenue: 29400,
          avgMonthlyValue: 192,
          growthRate: 23.1,
          retentionRate: 94.7,
          upgradeRate: 0,
          features: ['Everything in Pro', 'API Access', 'Custom Branding', 'Dedicated Support']
        }
      ];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch feature usage data
  const { data: featureUsage, isLoading: featureLoading } = useQuery<FeatureUsage[]>({
    queryKey: ['feature-usage', selectedTimeRange],
    queryFn: async () => {
      // Mock data for demonstration
      return [
        {
          featureName: 'Advanced Analytics',
          totalUsers: 807,
          bySubscriptionTier: [
            { tier: 'Professional', users: 654, usageRate: 89.2 },
            { tier: 'Enterprise', users: 153, usageRate: 100 }
          ],
          usageFrequency: 4.2,
          satisfactionScore: 4.6,
          isPopular: true
        },
        {
          featureName: 'API Access',
          totalUsers: 127,
          bySubscriptionTier: [
            { tier: 'Enterprise', users: 127, usageRate: 83.0 }
          ],
          usageFrequency: 12.8,
          satisfactionScore: 4.8,
          isPopular: true
        },
        {
          featureName: 'Unlimited Uploads',
          totalUsers: 751,
          bySubscriptionTier: [
            { tier: 'Professional', users: 598, usageRate: 91.4 },
            { tier: 'Enterprise', users: 153, usageRate: 100 }
          ],
          usageFrequency: 8.7,
          satisfactionScore: 4.7,
          isPopular: true
        },
        {
          featureName: 'Custom Branding',
          totalUsers: 89,
          bySubscriptionTier: [
            { tier: 'Enterprise', users: 89, usageRate: 58.2 }
          ],
          usageFrequency: 2.1,
          satisfactionScore: 4.3,
          isPopular: false
        },
        {
          featureName: 'Priority Support',
          totalUsers: 623,
          bySubscriptionTier: [
            { tier: 'Professional', users: 470, usageRate: 71.9 },
            { tier: 'Enterprise', users: 153, usageRate: 100 }
          ],
          usageFrequency: 1.8,
          satisfactionScore: 4.9,
          isPopular: true
        }
      ];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch revenue trends
  const { data: revenueTrends, isLoading: trendsLoading } = useQuery<RevenueTrend[]>({
    queryKey: ['revenue-trends', selectedTimeRange],
    queryFn: async () => {
      // Mock data for demonstration
      return [
        { date: '2025-01-15', revenue: 18750, subscriptions: 1654, upgrades: 23, downgrades: 5, churn: 12 },
        { date: '2025-01-14', revenue: 18200, subscriptions: 1648, upgrades: 19, downgrades: 3, churn: 8 },
        { date: '2025-01-13', revenue: 17890, subscriptions: 1632, upgrades: 15, downgrades: 7, churn: 14 },
        { date: '2025-01-12', revenue: 17650, subscriptions: 1639, upgrades: 12, downgrades: 4, churn: 9 },
        { date: '2025-01-11', revenue: 17420, subscriptions: 1631, upgrades: 18, downgrades: 6, churn: 11 }
      ];
    },
    staleTime: 5 * 60 * 1000,
  });

  const getGrowthIcon = (rate: number) => {
    return rate > 0 ? <ArrowUpRight className="h-4 w-4 text-green-600" /> : <ArrowDownRight className="h-4 w-4 text-red-600" />;
  };

  const getGrowthColor = (rate: number) => {
    return rate > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (revenueLoading || subscriptionLoading || featureLoading || trendsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Subscription Analytics</h1>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const totalSubscriptions = subscriptionBreakdown?.reduce((sum, plan) => sum + plan.activeSubscriptions, 0) || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Revenue tracking, subscription insights, and feature analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueMetrics?.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600 flex items-center">
              {getGrowthIcon(revenueMetrics?.monthlyGrowthRate || 0)}
              +{revenueMetrics?.monthlyGrowthRate}% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueMetrics?.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Average per user: ${revenueMetrics?.averageRevenuePerUser}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubscriptions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Churn rate: {revenueMetrics?.churnRate}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer LTV</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueMetrics?.customerLifetimeValue}</div>
            <p className="text-xs text-muted-foreground">
              Conversion rate: {revenueMetrics?.conversionRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Revenue Overview</TabsTrigger>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="features">Feature Usage</TabsTrigger>
          <TabsTrigger value="trends">Revenue Trends</TabsTrigger>
        </TabsList>

        {/* Revenue Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Growth Rate</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getGrowthColor(revenueMetrics?.monthlyGrowthRate || 0)}`}>
                      {revenueMetrics?.monthlyGrowthRate}%
                    </span>
                    {getGrowthIcon(revenueMetrics?.monthlyGrowthRate || 0)}
                  </div>
                </div>
                <Progress value={revenueMetrics?.monthlyGrowthRate} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Conversion Rate</span>
                  <span className="font-bold">{revenueMetrics?.conversionRate}%</span>
                </div>
                <Progress value={revenueMetrics?.conversionRate} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Customer Retention</span>
                  <span className="font-bold">{100 - (revenueMetrics?.churnRate || 0)}%</span>
                </div>
                <Progress value={100 - (revenueMetrics?.churnRate || 0)} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptionBreakdown?.map((plan) => {
                  const percentage = (plan.revenue / (revenueMetrics?.totalRevenue || 1)) * 100;
                  return (
                    <div key={plan.plan} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{plan.plan}</span>
                        <span className="text-sm text-muted-foreground">
                          ${plan.revenue.toLocaleString()} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscription Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {subscriptionBreakdown?.map((plan) => (
              <Card key={plan.plan}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.plan}
                    <Badge variant={plan.plan === 'Enterprise' ? 'default' : plan.plan === 'Professional' ? 'secondary' : 'outline'}>
                      ${plan.avgMonthlyValue}/mo
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Active Subscriptions</div>
                      <div className="text-2xl font-bold">{plan.activeSubscriptions}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Revenue</div>
                      <div className="text-2xl font-bold">${plan.revenue.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Growth Rate</span>
                      <span className={`font-bold ${getGrowthColor(plan.growthRate)}`}>
                        +{plan.growthRate}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Retention Rate</span>
                      <span className="font-bold">{plan.retentionRate}%</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Upgrade Rate</span>
                      <span className="font-bold">{plan.upgradeRate}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-2">Features</div>
                    <div className="space-y-1">
                      {plan.features.map((feature) => (
                        <Badge key={feature} variant="outline" className="mr-1 mb-1 text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Feature Usage Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featureUsage?.map((feature) => (
              <Card key={feature.featureName}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {feature.featureName}
                    <div className="flex items-center gap-2">
                      {feature.isPopular && (
                        <Badge variant="secondary">Popular</Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {feature.totalUsers} users
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Usage Frequency</div>
                      <div className="text-lg font-bold">{feature.usageFrequency}x/month</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Satisfaction</div>
                      <div className="text-lg font-bold">{feature.satisfactionScore}/5</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Usage by Subscription Tier</div>
                    {feature.bySubscriptionTier.map((tier) => (
                      <div key={tier.tier} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{tier.tier}</span>
                          <span>{tier.users} users ({tier.usageRate}%)</span>
                        </div>
                        <Progress value={tier.usageRate} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Revenue Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Revenue Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueTrends?.map((trend) => (
                  <div key={trend.date} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{trend.date}</span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-bold">${trend.revenue.toLocaleString()}</div>
                        <div className="text-muted-foreground">Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold">{trend.subscriptions}</div>
                        <div className="text-muted-foreground">Active</div>
                      </div>
                      <div className="text-center text-green-600">
                        <div className="font-bold">+{trend.upgrades}</div>
                        <div className="text-muted-foreground">Upgrades</div>
                      </div>
                      <div className="text-center text-red-600">
                        <div className="font-bold">-{trend.churn}</div>
                        <div className="text-muted-foreground">Churn</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Revenue Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Interactive revenue charts and trend analysis coming soon</p>
                <p className="text-sm">Integration with charting library in development</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 