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
  BarChart3, 
  TrendingUp, 
  Clock,
  Users,
  Database,
  Eye,
  Download,
  Filter,
  Calendar,
  Zap
} from 'lucide-react';

interface SchemaUsageData {
  id: number;
  name: string;
  type: string;
  subType: string;
  industry: string;
  totalUsage: number;
  activeProfiles: number;
  avgCompletionTime: number;
  satisfactionScore: number;
  createdAt: string;
  lastUsed: string;
  performanceScore: number;
  subscriptionTier: 'free' | 'professional' | 'enterprise';
}

interface FieldAnalytics {
  fieldType: string;
  usage: number;
  skipRate: number;
  avgTimeSpent: number;
  errorRate: number;
  popularInIndustries: string[];
}

interface IndustryInsights {
  industry: string;
  totalSchemas: number;
  activeSchemas: number;
  totalProfiles: number;
  avgCompletionRate: number;
  topPerformingSchemas: string[];
  growthRate: number;
}

/**
 * SchemaAnalytics - Comprehensive analytics dashboard for schema usage patterns,
 * performance insights, and industry-specific metrics
 * 
 * @component
 * @example
 * ```tsx
 * <SchemaAnalytics />
 * ```
 */
export function SchemaAnalytics() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('usage');

  // Fetch schema usage data
  const { data: schemaData, isLoading: schemaLoading } = useQuery<SchemaUsageData[]>({
    queryKey: ['schema-analytics', selectedTimeRange, selectedIndustry],
    queryFn: async () => {
      // Mock data for demonstration
      return [
        {
          id: 1,
          name: 'Professional Model Profile',
          type: 'profile',
          subType: 'human_model',
          industry: 'Human Modeling',
          totalUsage: 1247,
          activeProfiles: 892,
          avgCompletionTime: 8.5,
          satisfactionScore: 4.6,
          createdAt: '2024-12-01',
          lastUsed: '2025-01-19',
          performanceScore: 94,
          subscriptionTier: 'professional'
        },
        {
          id: 2,
          name: 'Pet Talent Registration',
          type: 'profile',
          subType: 'animal_talent',
          industry: 'Animal Talent',
          totalUsage: 634,
          activeProfiles: 456,
          avgCompletionTime: 6.2,
          satisfactionScore: 4.8,
          createdAt: '2024-11-15',
          lastUsed: '2025-01-19',
          performanceScore: 97,
          subscriptionTier: 'professional'
        },
        {
          id: 3,
          name: 'Agency Profile Setup',
          type: 'profile',
          subType: 'agency',
          industry: 'Talent Agency',
          totalUsage: 289,
          activeProfiles: 198,
          avgCompletionTime: 12.4,
          satisfactionScore: 4.3,
          createdAt: '2024-10-20',
          lastUsed: '2025-01-18',
          performanceScore: 89,
          subscriptionTier: 'enterprise'
        },
        {
          id: 4,
          name: 'Photographer Portfolio',
          type: 'profile',
          subType: 'photographer',
          industry: 'Photography Services',
          totalUsage: 512,
          activeProfiles: 367,
          avgCompletionTime: 10.1,
          satisfactionScore: 4.5,
          createdAt: '2024-09-10',
          lastUsed: '2025-01-19',
          performanceScore: 91,
          subscriptionTier: 'professional'
        },
        {
          id: 5,
          name: 'Basic Model Profile',
          type: 'profile',
          subType: 'human_model_basic',
          industry: 'Human Modeling',
          totalUsage: 1856,
          activeProfiles: 1234,
          avgCompletionTime: 5.8,
          satisfactionScore: 4.2,
          createdAt: '2024-08-01',
          lastUsed: '2025-01-19',
          performanceScore: 85,
          subscriptionTier: 'free'
        }
      ];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch field analytics
  const { data: fieldAnalytics, isLoading: fieldsLoading } = useQuery<FieldAnalytics[]>({
    queryKey: ['field-analytics', selectedTimeRange],
    queryFn: async () => {
      // Mock data for demonstration
      return [
        {
          fieldType: 'media_upload',
          usage: 15674,
          skipRate: 8.2,
          avgTimeSpent: 3.4,
          errorRate: 2.1,
          popularInIndustries: ['Human Modeling', 'Animal Talent', 'Photography Services']
        },
        {
          fieldType: 'experience_level',
          usage: 12890,
          skipRate: 5.1,
          avgTimeSpent: 1.2,
          errorRate: 0.8,
          popularInIndustries: ['Human Modeling', 'Talent Agency']
        },
        {
          fieldType: 'availability_calendar',
          usage: 9823,
          skipRate: 12.5,
          avgTimeSpent: 4.8,
          errorRate: 3.2,
          popularInIndustries: ['Human Modeling', 'Photography Services']
        },
        {
          fieldType: 'pricing_rates',
          usage: 8934,
          skipRate: 15.3,
          avgTimeSpent: 6.1,
          errorRate: 4.5,
          popularInIndustries: ['Photography Services', 'Talent Agency']
        },
        {
          fieldType: 'location_preferences',
          usage: 11456,
          skipRate: 6.8,
          avgTimeSpent: 2.1,
          errorRate: 1.3,
          popularInIndustries: ['Human Modeling', 'Animal Talent', 'Photography Services']
        }
      ];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch industry insights
  const { data: industryInsights, isLoading: industryLoading } = useQuery<IndustryInsights[]>({
    queryKey: ['industry-insights', selectedTimeRange],
    queryFn: async () => {
      // Mock data for demonstration
      return [
        {
          industry: 'Human Modeling',
          totalSchemas: 12,
          activeSchemas: 9,
          totalProfiles: 3102,
          avgCompletionRate: 87.3,
          topPerformingSchemas: ['Professional Model Profile', 'Basic Model Profile', 'Child Model Profile'],
          growthRate: 15.2
        },
        {
          industry: 'Animal Talent',
          totalSchemas: 8,
          activeSchemas: 6,
          totalProfiles: 1456,
          avgCompletionRate: 92.1,
          topPerformingSchemas: ['Pet Talent Registration', 'Dog Actor Profile', 'Horse Performer Profile'],
          growthRate: 23.8
        },
        {
          industry: 'Photography Services',
          totalSchemas: 6,
          activeSchemas: 5,
          totalProfiles: 789,
          avgCompletionRate: 84.6,
          topPerformingSchemas: ['Photographer Portfolio', 'Wedding Photographer', 'Fashion Photographer'],
          growthRate: 8.9
        },
        {
          industry: 'Talent Agency',
          totalSchemas: 4,
          activeSchemas: 3,
          totalProfiles: 234,
          avgCompletionRate: 78.9,
          topPerformingSchemas: ['Agency Profile Setup', 'Casting Director Profile'],
          growthRate: 12.4
        }
      ];
    },
    staleTime: 5 * 60 * 1000,
  });

  const getPerformanceColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-blue-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSubscriptionBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'default';
      case 'professional': return 'secondary';
      case 'free': return 'outline';
      default: return 'outline';
    }
  };

  if (schemaLoading || fieldsLoading || industryLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Schema Analytics</h1>
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

  const totalSchemas = schemaData?.length || 0;
  const totalUsage = schemaData?.reduce((sum, schema) => sum + schema.totalUsage, 0) || 0;
  const avgSatisfaction = schemaData?.reduce((sum, schema) => sum + schema.satisfactionScore, 0) / totalSchemas || 0;
  const avgPerformance = schemaData?.reduce((sum, schema) => sum + schema.performanceScore, 0) / totalSchemas || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schema Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Schema usage patterns, performance insights, and industry analytics
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schemas</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSchemas}</div>
            <p className="text-xs text-muted-foreground">
              +3 new this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSatisfaction.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Out of 5.0 stars
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPerformance.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Performance score
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schemas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schemas">Schema Performance</TabsTrigger>
          <TabsTrigger value="fields">Field Analytics</TabsTrigger>
          <TabsTrigger value="industries">Industry Insights</TabsTrigger>
          <TabsTrigger value="trends">Usage Trends</TabsTrigger>
        </TabsList>

        {/* Schema Performance Tab */}
        <TabsContent value="schemas" className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="human_modeling">Human Modeling</SelectItem>
                <SelectItem value="animal_talent">Animal Talent</SelectItem>
                <SelectItem value="photography">Photography Services</SelectItem>
                <SelectItem value="talent_agency">Talent Agency</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usage">Usage Count</SelectItem>
                <SelectItem value="performance">Performance Score</SelectItem>
                <SelectItem value="satisfaction">Satisfaction Score</SelectItem>
                <SelectItem value="completion">Completion Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {schemaData?.map((schema) => (
              <Card key={schema.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{schema.name}</h3>
                      <p className="text-sm text-muted-foreground">{schema.industry}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSubscriptionBadgeVariant(schema.subscriptionTier)}>
                        {schema.subscriptionTier}
                      </Badge>
                      <div className={`text-2xl font-bold ${getPerformanceColor(schema.performanceScore)}`}>
                        {schema.performanceScore}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Usage</div>
                      <div className="text-xl font-bold">{schema.totalUsage.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Active Profiles</div>
                      <div className="text-xl font-bold">{schema.activeProfiles.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Avg Completion Time</div>
                      <div className="text-xl font-bold">{schema.avgCompletionTime}min</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Satisfaction</div>
                      <div className="text-xl font-bold">{schema.satisfactionScore}/5</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground mb-2">Performance Score</div>
                    <Progress value={schema.performanceScore} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Field Analytics Tab */}
        <TabsContent value="fields" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {fieldAnalytics?.map((field) => (
              <Card key={field.fieldType}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">{field.fieldType.replace('_', ' ')}</span>
                    <Badge variant="secondary">{field.usage.toLocaleString()} uses</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Skip Rate</div>
                      <div className="text-lg font-bold">{field.skipRate}%</div>
                      <Progress value={field.skipRate} className="h-2 mt-1" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Error Rate</div>
                      <div className="text-lg font-bold">{field.errorRate}%</div>
                      <Progress value={field.errorRate} className="h-2 mt-1" />
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Avg Time Spent</div>
                    <div className="text-lg font-bold">{field.avgTimeSpent} minutes</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Popular in Industries</div>
                    <div className="flex flex-wrap gap-1">
                      {field.popularInIndustries.map((industry) => (
                        <Badge key={industry} variant="outline" className="text-xs">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Industry Insights Tab */}
        <TabsContent value="industries" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {industryInsights?.map((industry) => (
              <Card key={industry.industry}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {industry.industry}
                    <Badge variant={industry.growthRate > 15 ? 'default' : 'secondary'}>
                      +{industry.growthRate}% growth
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Schemas</div>
                      <div className="text-2xl font-bold">{industry.totalSchemas}</div>
                      <div className="text-xs text-muted-foreground">
                        {industry.activeSchemas} active
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Profiles</div>
                      <div className="text-2xl font-bold">{industry.totalProfiles.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {industry.avgCompletionRate}% completion rate
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Top Performing Schemas</div>
                    <div className="space-y-1">
                      {industry.topPerformingSchemas.map((schema, index) => (
                        <div key={schema} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <span>{schema}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Completion Rate</div>
                    <Progress value={industry.avgCompletionRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Usage Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schema Usage Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Interactive charts and trend analysis coming soon</p>
                <p className="text-sm">Integration with charting library in development</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 