'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  Users, 
  Database, 
  Shield, 
  TrendingUp, 
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Settings,
  Eye
} from 'lucide-react';
import Link from 'next/link';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalProfiles: number;
  totalSchemas: number;
  activeSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  apiResponseTime: number;
  errorRate: number;
}

interface SubscriptionMetrics {
  planDistribution: { plan: string; count: number; revenue: number }[];
  usageByTier: { tier: string; profiles: number; schemas: number; uploads: number }[];
  recentActivity: { date: string; upgrades: number; downgrades: number; new: number }[];
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

/**
 * UnifiedAdminDashboard - Main administrative dashboard providing comprehensive 
 * system overview, subscription analytics, and quick access to admin tools
 * 
 * @component
 * @example
 * ```tsx
 * <UnifiedAdminDashboard />
 * ```
 */
export function UnifiedAdminDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  // Fetch system metrics
  const { data: systemMetrics, isLoading: metricsLoading } = useQuery<SystemMetrics>({
    queryKey: ['admin-dashboard-metrics', selectedTimeRange],
    queryFn: async () => {
      // Mock data for demonstration
      return {
        totalUsers: 2847,
        activeUsers: 1923,
        totalProfiles: 5681,
        totalSchemas: 47,
        activeSubscriptions: 1654,
        totalRevenue: 127500,
        monthlyRevenue: 18750,
        systemHealth: 'healthy' as const,
        apiResponseTime: 245,
        errorRate: 0.02
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch subscription analytics
  const { data: subscriptionMetrics, isLoading: subscriptionLoading } = useQuery<SubscriptionMetrics>({
    queryKey: ['admin-dashboard-subscriptions', selectedTimeRange],
    queryFn: async () => {
      // Mock data for demonstration
      return {
        planDistribution: [
          { plan: 'Free', count: 847, revenue: 0 },
          { plan: 'Professional', count: 654, revenue: 98100 },
          { plan: 'Enterprise', count: 153, revenue: 29400 }
        ],
        usageByTier: [
          { tier: 'Free', profiles: 1205, schemas: 8, uploads: 3421 },
          { tier: 'Professional', profiles: 2891, schemas: 23, uploads: 15672 },
          { tier: 'Enterprise', profiles: 1585, schemas: 16, uploads: 8934 }
        ],
        recentActivity: [
          { date: '2025-01-19', upgrades: 12, downgrades: 3, new: 45 },
          { date: '2025-01-18', upgrades: 8, downgrades: 1, new: 38 },
          { date: '2025-01-17', upgrades: 15, downgrades: 2, new: 52 }
        ]
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const quickActions: QuickAction[] = [
    {
      title: 'Schema Analytics',
      description: 'View schema usage patterns and performance insights',
      href: '/admin/analytics/schemas',
      icon: BarChart3,
      badge: 'New'
    },
    {
      title: 'Subscription Analytics',
      description: 'Revenue tracking and subscription insights',
      href: '/admin/analytics/subscriptions',
      icon: DollarSign
    },
    {
      title: 'Permission Auditor',
      description: 'Security monitoring and permission analysis',
      href: '/admin/monitoring/permissions',
      icon: Shield,
      badge: 'Security'
    },
    {
      title: 'System Health',
      description: 'Monitor system performance and health metrics',
      href: '/admin/monitoring/system-health',
      icon: Activity
    },
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      href: '/admin/users',
      icon: Users
    },
    {
      title: 'Schema Management',
      description: 'Create and manage dynamic schemas',
      href: '/admin/model-schemas',
      icon: Database
    }
  ];

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      default: return Clock;
    }
  };

  if (metricsLoading || subscriptionLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive platform overview and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            Live Data
          </Badge>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(getHealthIcon(systemMetrics?.systemHealth || 'healthy'), {
              className: `h-5 w-5 ${getHealthColor(systemMetrics?.systemHealth || 'healthy')}`
            })}
            System Status: {systemMetrics?.systemHealth || 'Loading...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground">API Response Time</div>
              <div className="text-2xl font-bold">{systemMetrics?.apiResponseTime}ms</div>
              <Progress value={85} className="mt-2" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Error Rate</div>
              <div className="text-2xl font-bold">{(systemMetrics?.errorRate || 0) * 100}%</div>
              <Progress value={2} className="mt-2" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Active Users</div>
              <div className="text-2xl font-bold">{systemMetrics?.activeUsers.toLocaleString()}</div>
              <Progress value={67} className="mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="tools">Admin Tools</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics?.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics?.totalProfiles.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +8% from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Schemas</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics?.totalSchemas}</div>
                <p className="text-xs text-muted-foreground">
                  +3 new this month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${systemMetrics?.monthlyRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +15% from last month
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptionMetrics?.planDistribution.map((plan) => (
                  <div key={plan.plan} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        plan.plan === 'Free' ? 'bg-gray-400' :
                        plan.plan === 'Professional' ? 'bg-blue-500' : 'bg-purple-500'
                      }`} />
                      <span className="font-medium">{plan.plan}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{plan.count} users</div>
                      <div className="text-sm text-muted-foreground">
                        ${plan.revenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage by Tier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptionMetrics?.usageByTier.map((usage) => (
                  <div key={usage.tier} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{usage.tier}</span>
                      <span className="text-sm text-muted-foreground">
                        {usage.profiles} profiles
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>Schemas: {usage.schemas}</div>
                      <div>Uploads: {usage.uploads.toLocaleString()}</div>
                      <div>Avg: {Math.round(usage.uploads / usage.profiles)}</div>
                    </div>
                    <Separator />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Subscription Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subscriptionMetrics?.recentActivity.map((activity) => (
                    <div key={activity.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">{activity.date}</div>
                      <div className="flex gap-6 text-sm">
                        <span className="text-green-600">+{activity.upgrades} upgrades</span>
                        <span className="text-blue-600">+{activity.new} new</span>
                        <span className="text-red-600">-{activity.downgrades} downgrades</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Conversion Rate</span>
                  <Badge variant="secondary">12.4%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Churn Rate</span>
                  <Badge variant="outline">2.1%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Revenue per User</span>
                  <Badge variant="secondary">$77</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Customer Lifetime Value</span>
                  <Badge variant="secondary">$892</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Admin Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <Card key={action.href} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <action.icon className="h-5 w-5" />
                      {action.title}
                    </div>
                    {action.badge && (
                      <Badge variant={action.badge === 'Security' ? 'destructive' : 'secondary'}>
                        {action.badge}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {action.description}
                  </p>
                  <Button asChild className="w-full">
                    <Link href={action.href}>
                      <Eye className="h-4 w-4 mr-2" />
                      Open Tool
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 