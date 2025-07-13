'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Tag,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Hash,
  Star,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Eye,
  MousePointer,
  Target,
  Zap,
  Award,
  Layers,
  GitBranch,
  Search,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagData {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  usageCount: number;
  isActive: boolean;
  isSystem: boolean;
  isFeatured?: boolean;
  parentId?: number;
  children?: TagData[];
  createdAt: string;
  metadata?: {
    color?: string;
    icon?: string;
    aliases?: string[];
  };
  analytics?: {
    viewCount: number;
    clickCount: number;
    searchCount: number;
    weeklyUsage: number[];
    monthlyUsage: number[];
    peakUsageDay: string;
    averageUsagePerDay: number;
    growthRate: number;
    entityTypes: Record<string, number>;
    recentUsers: string[];
  };
}

interface TagAnalyticsProps {
  /**
   * Tags data with analytics information
   */
  tags: TagData[];
  /**
   * Time period for analytics
   * @default "30d"
   */
  timePeriod?: '7d' | '30d' | '90d' | '1y';
  /**
   * Whether to show comparison with previous period
   * @default true
   */
  showComparison?: boolean;
  /**
   * Whether to show real-time updates
   * @default false
   */
  realTimeUpdates?: boolean;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Callback when time period changes
   */
  onTimePeriodChange?: (period: string) => void;
  /**
   * Callback when tag is selected for detailed view
   */
  onTagSelect?: (tag: TagData) => void;
  /**
   * Callback for exporting analytics data
   */
  onExportData?: (format: 'csv' | 'json' | 'pdf') => void;
}

// Mock analytics data
const mockTagsWithAnalytics: TagData[] = [
  {
    id: 1,
    uuid: '1',
    name: 'Photography',
    slug: 'photography',
    category: 'content-type',
    usageCount: 1245,
    isActive: true,
    isSystem: false,
    isFeatured: true,
    createdAt: '2024-01-01T00:00:00Z',
    metadata: { color: '#3B82F6' },
    analytics: {
      viewCount: 8934,
      clickCount: 2341,
      searchCount: 567,
      weeklyUsage: [45, 67, 89, 123, 98, 156, 134],
      monthlyUsage: [1100, 1150, 1200, 1245],
      peakUsageDay: 'Friday',
      averageUsagePerDay: 41.5,
      growthRate: 12.5,
      entityTypes: {
        'user-profiles': 456,
        'gig-offerings': 334,
        'portfolios': 234,
        'blog-posts': 221
      },
      recentUsers: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5']
    }
  },
  {
    id: 2,
    uuid: '2',
    name: 'Design',
    slug: 'design',
    category: 'content-type',
    usageCount: 987,
    isActive: true,
    isSystem: false,
    isFeatured: true,
    createdAt: '2024-01-02T00:00:00Z',
    metadata: { color: '#10B981' },
    analytics: {
      viewCount: 6721,
      clickCount: 1876,
      searchCount: 423,
      weeklyUsage: [34, 56, 78, 98, 87, 123, 109],
      monthlyUsage: [890, 920, 950, 987],
      peakUsageDay: 'Wednesday',
      averageUsagePerDay: 32.9,
      growthRate: 8.7,
      entityTypes: {
        'user-profiles': 387,
        'gig-offerings': 298,
        'portfolios': 189,
        'blog-posts': 113
      },
      recentUsers: ['user-2', 'user-3', 'user-6', 'user-7']
    }
  },
  {
    id: 3,
    uuid: '3',
    name: 'Marketing',
    slug: 'marketing',
    category: 'industry',
    usageCount: 756,
    isActive: true,
    isSystem: false,
    createdAt: '2024-01-03T00:00:00Z',
    metadata: { color: '#F59E0B' },
    analytics: {
      viewCount: 4532,
      clickCount: 1234,
      searchCount: 289,
      weeklyUsage: [23, 45, 67, 78, 69, 89, 87],
      monthlyUsage: [680, 710, 730, 756],
      peakUsageDay: 'Tuesday',
      averageUsagePerDay: 25.2,
      growthRate: -2.1,
      entityTypes: {
        'gig-offerings': 312,
        'user-profiles': 234,
        'blog-posts': 134,
        'portfolios': 76
      },
      recentUsers: ['user-1', 'user-4', 'user-8']
    }
  },
  {
    id: 4,
    uuid: '4',
    name: 'Fashion',
    slug: 'fashion',
    category: 'industry',
    usageCount: 543,
    isActive: true,
    isSystem: false,
    createdAt: '2024-01-04T00:00:00Z',
    metadata: { color: '#EC4899' },
    analytics: {
      viewCount: 3421,
      clickCount: 876,
      searchCount: 198,
      weeklyUsage: [18, 34, 45, 56, 49, 67, 61],
      monthlyUsage: [480, 510, 525, 543],
      peakUsageDay: 'Saturday',
      averageUsagePerDay: 18.1,
      growthRate: 15.2,
      entityTypes: {
        'portfolios': 198,
        'user-profiles': 167,
        'gig-offerings': 123,
        'blog-posts': 55
      },
      recentUsers: ['user-5', 'user-9', 'user-10']
    }
  },
  {
    id: 5,
    uuid: '5',
    name: 'Technology',
    slug: 'technology',
    category: 'industry',
    usageCount: 432,
    isActive: true,
    isSystem: false,
    createdAt: '2024-01-05T00:00:00Z',
    metadata: { color: '#8B5CF6' },
    analytics: {
      viewCount: 2876,
      clickCount: 654,
      searchCount: 143,
      weeklyUsage: [12, 23, 34, 45, 38, 54, 49],
      monthlyUsage: [380, 400, 415, 432],
      peakUsageDay: 'Thursday',
      averageUsagePerDay: 14.4,
      growthRate: 6.8,
      entityTypes: {
        'gig-offerings': 178,
        'blog-posts': 134,
        'user-profiles': 98,
        'portfolios': 22
      },
      recentUsers: ['user-2', 'user-6', 'user-11']
    }
  }
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

function MetricCard({ 
  title, 
  value, 
  previousValue, 
  icon: Icon, 
  color = 'blue',
  showComparison = true,
  formatter = (v) => v.toString()
}: {
  title: string;
  value: number;
  previousValue?: number;
  icon: React.ComponentType<any>;
  color?: string;
  showComparison?: boolean;
  formatter?: (value: number) => string;
}) {
  const percentChange = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
  const isPositive = percentChange > 0;
  const isNeutral = percentChange === 0;

  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-red-600 bg-red-50'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{formatter(value)}</p>
            {showComparison && previousValue !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {isNeutral ? (
                  <Minus className="h-3 w-3 text-muted-foreground" />
                ) : isPositive ? (
                  <ArrowUp className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-600" />
                )}
                <span className={cn(
                  'text-xs font-medium',
                  isNeutral ? 'text-muted-foreground' : isPositive ? 'text-green-600' : 'text-red-600'
                )}>
                  {isNeutral ? '0%' : `${Math.abs(percentChange).toFixed(1)}%`}
                </span>
                <span className="text-xs text-muted-foreground">vs last period</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-full', colorClasses[color as keyof typeof colorClasses] || colorClasses.blue)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TopTagsList({ tags, title, limit = 5 }: { tags: TagData[], title: string, limit?: number }) {
  const sortedTags = [...tags]
    .sort((a, b) => (b.analytics?.viewCount || 0) - (a.analytics?.viewCount || 0))
    .slice(0, limit);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedTags.map((tag, index) => (
          <div key={tag.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                {index + 1}
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  style={{ borderColor: tag.metadata?.color, color: tag.metadata?.color }}
                >
                  {tag.name}
                </Badge>
                {tag.isFeatured && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{tag.analytics?.viewCount?.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">views</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function TagAnalytics({
  tags = mockTagsWithAnalytics,
  timePeriod = '30d',
  showComparison = true,
  realTimeUpdates = false,
  className,
  onTimePeriodChange,
  onTagSelect,
  onExportData
}: TagAnalyticsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');

  // Calculate aggregate metrics
  const metrics = useMemo(() => {
    const totalUsage = tags.reduce((sum, tag) => sum + tag.usageCount, 0);
    const totalViews = tags.reduce((sum, tag) => sum + (tag.analytics?.viewCount || 0), 0);
    const totalClicks = tags.reduce((sum, tag) => sum + (tag.analytics?.clickCount || 0), 0);
    const totalSearches = tags.reduce((sum, tag) => sum + (tag.analytics?.searchCount || 0), 0);
    const activeTags = tags.filter(tag => tag.isActive).length;
    const averageGrowth = tags.reduce((sum, tag) => sum + (tag.analytics?.growthRate || 0), 0) / tags.length;

    // Mock previous period data for comparison
    const previousUsage = Math.round(totalUsage * 0.92);
    const previousViews = Math.round(totalViews * 0.88);
    const previousClicks = Math.round(totalClicks * 0.85);

    return {
      totalUsage,
      totalViews,
      totalClicks,
      totalSearches,
      activeTags,
      averageGrowth,
      previousUsage,
      previousViews,
      previousClicks,
      clickThroughRate: totalViews > 0 ? (totalClicks / totalViews) * 100 : 0
    };
  }, [tags]);

  // Filter tags by category
  const filteredTags = useMemo(() => {
    if (!selectedCategory) return tags;
    return tags.filter(tag => tag.category === selectedCategory);
  }, [tags, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(tags.map(tag => tag.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [tags]);

  // Prepare chart data
  const usageChartData = useMemo(() => {
    return filteredTags
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map(tag => ({
        name: tag.name,
        usage: tag.usageCount,
        views: tag.analytics?.viewCount || 0,
        clicks: tag.analytics?.clickCount || 0,
        color: tag.metadata?.color || COLORS[Math.floor(Math.random() * COLORS.length)]
      }));
  }, [filteredTags]);

  const categoryDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    tags.forEach(tag => {
      const category = tag.category || 'Uncategorized';
      distribution[category] = (distribution[category] || 0) + tag.usageCount;
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
      color: COLORS[Object.keys(distribution).indexOf(name) % COLORS.length]
    }));
  }, [tags]);

  const weeklyTrendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, index) => {
      const totalUsage = tags.reduce((sum, tag) => 
        sum + (tag.analytics?.weeklyUsage?.[index] || 0), 0
      );
      return { day, usage: totalUsage };
    });
  }, [tags]);

  const renderChart = () => {
    const chartProps = {
      data: usageChartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="usage" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="usage" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
          </AreaChart>
        );
      default:
        return (
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="usage" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Tag Analytics
          </h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive usage statistics and insights for your tag system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timePeriod} onValueChange={onTimePeriodChange}>
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
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExportData?.('csv')}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Usage"
          value={metrics.totalUsage}
          previousValue={showComparison ? metrics.previousUsage : undefined}
          icon={Hash}
          color="blue"
          showComparison={showComparison}
          formatter={(v) => v.toLocaleString()}
        />
        <MetricCard
          title="Total Views"
          value={metrics.totalViews}
          previousValue={showComparison ? metrics.previousViews : undefined}
          icon={Eye}
          color="green"
          showComparison={showComparison}
          formatter={(v) => v.toLocaleString()}
        />
        <MetricCard
          title="Total Clicks"
          value={metrics.totalClicks}
          previousValue={showComparison ? metrics.previousClicks : undefined}
          icon={MousePointer}
          color="orange"
          showComparison={showComparison}
          formatter={(v) => v.toLocaleString()}
        />
        <MetricCard
          title="Click Rate"
          value={metrics.clickThroughRate}
          icon={Target}
          color="purple"
          showComparison={false}
          formatter={(v) => `${v.toFixed(1)}%`}
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Active Tags"
          value={metrics.activeTags}
          icon={Tag}
          color="green"
          showComparison={false}
        />
        <MetricCard
          title="Avg Growth Rate"
          value={metrics.averageGrowth}
          icon={TrendingUp}
          color="blue"
          showComparison={false}
          formatter={(v) => `${v.toFixed(1)}%`}
        />
        <MetricCard
          title="Total Searches"
          value={metrics.totalSearches}
          icon={Search}
          color="orange"
          showComparison={false}
          formatter={(v) => v.toLocaleString()}
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="usage" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category?.charAt(0).toUpperCase() + category?.slice(1).replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Tag Usage Overview</CardTitle>
                    <CardDescription>Most used tags in your platform</CardDescription>
                  </div>
                  <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="line">Line</SelectItem>
                      <SelectItem value="area">Area</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    {renderChart()}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <TopTagsList tags={filteredTags} title="Top Performing Tags" />
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Usage Trend</CardTitle>
                <CardDescription>Tag usage across days of the week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={weeklyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="usage" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.3} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Growth Leaders</CardTitle>
                <CardDescription>Tags with highest growth rates</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {[...filteredTags]
                      .sort((a, b) => (b.analytics?.growthRate || 0) - (a.analytics?.growthRate || 0))
                      .slice(0, 8)
                      .map((tag) => (
                        <div key={tag.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{tag.name}</Badge>
                            {tag.analytics?.growthRate && tag.analytics.growthRate > 0 && (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {tag.analytics?.growthRate?.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">growth</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Usage breakdown by tag categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Detailed metrics by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {categoryDistribution.map((category) => {
                      const categoryTags = tags.filter(tag => 
                        (tag.category || 'Uncategorized') === category.name
                      );
                      const avgGrowth = categoryTags.reduce((sum, tag) => 
                        sum + (tag.analytics?.growthRate || 0), 0
                      ) / categoryTags.length;

                      return (
                        <div key={category.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{category.name}</span>
                            <div className="text-right text-sm">
                              <div>{category.value.toLocaleString()} uses</div>
                              <div className="text-muted-foreground">
                                {avgGrowth.toFixed(1)}% growth
                              </div>
                            </div>
                          </div>
                          <Progress 
                            value={(category.value / Math.max(...categoryDistribution.map(c => c.value))) * 100} 
                            className="h-2"
                          />
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>Click-through and engagement rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTags
                    .slice(0, 5)
                    .map((tag) => {
                      const ctr = tag.analytics?.viewCount && tag.analytics.viewCount > 0
                        ? (tag.analytics.clickCount / tag.analytics.viewCount) * 100
                        : 0;
                      return (
                        <div key={tag.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{tag.name}</Badge>
                            <span className="text-sm font-medium">{ctr.toFixed(1)}%</span>
                          </div>
                          <Progress value={Math.min(ctr, 100)} className="h-2" />
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Search Performance</CardTitle>
                <CardDescription>Most searched tags</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {[...filteredTags]
                      .sort((a, b) => (b.analytics?.searchCount || 0) - (a.analytics?.searchCount || 0))
                      .slice(0, 8)
                      .map((tag) => (
                        <div key={tag.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <Badge variant="outline">{tag.name}</Badge>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {tag.analytics?.searchCount?.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">searches</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Example usage component
export function TagAnalyticsExample() {
  const [timePeriod, setTimePeriod] = useState('30d');

  const handleExportData = (format: 'csv' | 'json' | 'pdf') => {
    console.log(`Exporting data as ${format}`);
    // Implementation would handle data export
  };

  const handleTagSelect = (tag: TagData) => {
    console.log('Selected tag:', tag);
    // Implementation would show detailed tag view
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Tag Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          Comprehensive analytics and insights for your tag system performance.
        </p>
      </div>

      <TagAnalytics
        tags={mockTagsWithAnalytics}
        timePeriod={timePeriod as any}
        showComparison={true}
        realTimeUpdates={false}
        onTimePeriodChange={setTimePeriod}
        onTagSelect={handleTagSelect}
        onExportData={handleExportData}
      />
    </div>
  );
}

export default TagAnalytics;