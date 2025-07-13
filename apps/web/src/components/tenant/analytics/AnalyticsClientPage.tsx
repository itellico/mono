/**
 * Analytics Client Page Component (Funeralytics)
 * 
 * Comprehensive analytics dashboard for tenant performance metrics.
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, TrendingDown, Users, Eye, Heart, MessageCircle, 
  DollarSign, Calendar, Target, Star, Download, Filter,
  BarChart3, PieChart, LineChart, Activity
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';

interface AnalyticsData {
  overview: {
    totalCastings: number;
    totalApplications: number;
    totalModels: number;
    totalRevenue: number;
    activeJobs: number;
    conversionRate: number;
    avgResponseTime: number;
    customerSatisfaction: number;
  };
  trends: {
    castings: Array<{ month: string; count: number; applications: number }>;
    revenue: Array<{ month: string; amount: number; bookings: number }>;
    models: Array<{ month: string; active: number; new: number }>;
  };
  topMetrics: {
    mostPopularCastings: Array<{ name: string; applications: number; views: number }>;
    topPerformingModels: Array<{ name: string; bookings: number; rating: number; revenue: number }>;
    categoryPerformance: Array<{ category: string; count: number; percentage: number }>;
  };
  geographical: {
    countries: Array<{ country: string; models: number; castings: number }>;
    cities: Array<{ city: string; activity: number; revenue: number }>;
  };
  realTime: {
    activeUsers: number;
    liveApplications: number;
    hourlyActivity: Array<{ hour: number; activity: number }>;
  };
}

export function AnalyticsClientPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['tenant-analytics', timeRange],
    queryFn: async () => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockAnalytics: AnalyticsData = {
        overview: {
          totalCastings: 127,
          totalApplications: 2845,
          totalModels: 342,
          totalRevenue: 125400,
          activeJobs: 23,
          conversionRate: 18.5,
          avgResponseTime: 2.3,
          customerSatisfaction: 4.7
        },
        trends: {
          castings: [
            { month: 'Jan', count: 8, applications: 156 },
            { month: 'Feb', count: 12, applications: 234 },
            { month: 'Mar', count: 15, applications: 289 },
            { month: 'Apr', count: 18, applications: 342 },
            { month: 'May', count: 22, applications: 445 },
            { month: 'Jun', count: 19, applications: 398 },
            { month: 'Jul', count: 25, applications: 512 },
            { month: 'Aug', count: 21, applications: 423 },
            { month: 'Sep', count: 17, applications: 356 },
            { month: 'Oct', count: 14, applications: 298 },
            { month: 'Nov', count: 11, applications: 267 },
            { month: 'Dec', count: 9, applications: 201 }
          ],
          revenue: [
            { month: 'Jan', amount: 8500, bookings: 12 },
            { month: 'Feb', amount: 12300, bookings: 18 },
            { month: 'Mar', amount: 15600, bookings: 24 },
            { month: 'Apr', amount: 18900, bookings: 29 },
            { month: 'May', amount: 22100, bookings: 34 },
            { month: 'Jun', amount: 19800, bookings: 31 },
            { month: 'Jul', amount: 25400, bookings: 39 },
            { month: 'Aug', amount: 21700, bookings: 33 },
            { month: 'Sep', amount: 17500, bookings: 27 },
            { month: 'Oct', amount: 14200, bookings: 22 },
            { month: 'Nov', amount: 11900, bookings: 18 },
            { month: 'Dec', amount: 9100, bookings: 14 }
          ],
          models: [
            { month: 'Jan', active: 45, new: 8 },
            { month: 'Feb', active: 52, new: 12 },
            { month: 'Mar', active: 61, new: 15 },
            { month: 'Apr', active: 73, new: 18 },
            { month: 'May', active: 89, new: 22 },
            { month: 'Jun', active: 98, new: 19 },
            { month: 'Jul', active: 112, new: 25 },
            { month: 'Aug', active: 123, new: 21 },
            { month: 'Sep', active: 134, new: 17 },
            { month: 'Oct', active: 142, new: 14 },
            { month: 'Nov', active: 156, new: 11 },
            { month: 'Dec', active: 167, new: 9 }
          ]
        },
        topMetrics: {
          mostPopularCastings: [
            { name: 'Fashion Week Runway Models', applications: 89, views: 1247 },
            { name: 'Commercial Photography Campaign', applications: 67, views: 892 },
            { name: 'Music Video Background Dancers', applications: 134, views: 1856 },
            { name: 'Luxury Watch Advertisement', applications: 45, views: 623 },
            { name: 'Editorial Fashion Shoot', applications: 78, views: 1034 }
          ],
          topPerformingModels: [
            { name: 'Sophie Martin', bookings: 12, rating: 4.9, revenue: 18500 },
            { name: 'Emma Johnson', bookings: 10, rating: 4.7, revenue: 15200 },
            { name: 'Isabella Rodriguez', bookings: 8, rating: 4.8, revenue: 12800 },
            { name: 'Lucas Chen', bookings: 7, rating: 4.6, revenue: 11400 },
            { name: 'Maria Garcia', bookings: 9, rating: 4.8, revenue: 14600 }
          ],
          categoryPerformance: [
            { category: 'Fashion', count: 45, percentage: 35.4 },
            { category: 'Commercial', count: 32, percentage: 25.2 },
            { category: 'Editorial', count: 28, percentage: 22.0 },
            { category: 'Fitness', count: 15, percentage: 11.8 },
            { category: 'Alternative', count: 7, percentage: 5.5 }
          ]
        },
        geographical: {
          countries: [
            { country: 'France', models: 89, castings: 34 },
            { country: 'United Kingdom', models: 67, castings: 28 },
            { country: 'Germany', models: 52, castings: 19 },
            { country: 'Italy', models: 45, castings: 17 },
            { country: 'Spain', models: 38, castings: 14 },
            { country: 'Netherlands', models: 23, castings: 9 }
          ],
          cities: [
            { city: 'Paris', activity: 245, revenue: 45600 },
            { city: 'London', activity: 189, revenue: 34200 },
            { city: 'Milan', activity: 156, revenue: 28900 },
            { city: 'Madrid', activity: 134, revenue: 24100 },
            { city: 'Berlin', activity: 112, revenue: 19800 }
          ]
        },
        realTime: {
          activeUsers: 127,
          liveApplications: 23,
          hourlyActivity: [
            { hour: 0, activity: 12 },
            { hour: 1, activity: 8 },
            { hour: 2, activity: 5 },
            { hour: 3, activity: 3 },
            { hour: 4, activity: 4 },
            { hour: 5, activity: 7 },
            { hour: 6, activity: 15 },
            { hour: 7, activity: 28 },
            { hour: 8, activity: 45 },
            { hour: 9, activity: 67 },
            { hour: 10, activity: 89 },
            { hour: 11, activity: 98 },
            { hour: 12, activity: 112 },
            { hour: 13, activity: 105 },
            { hour: 14, activity: 94 },
            { hour: 15, activity: 87 },
            { hour: 16, activity: 76 },
            { hour: 17, activity: 68 },
            { hour: 18, activity: 54 },
            { hour: 19, activity: 42 },
            { hour: 20, activity: 35 },
            { hour: 21, activity: 28 },
            { hour: 22, activity: 21 },
            { hour: 23, activity: 16 }
          ]
        }
      };
      
      return mockAnalytics;
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time data
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-EU').format(num);
  };

  const getChangeIndicator = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    const isPositive = change > 0;
    
    return (
      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        <span>{Math.abs(change).toFixed(1)}%</span>
      </div>
    );
  };

  const renderOverviewCards = () => {
    if (!analytics) return null;

    const cards = [
      {
        title: 'Total Castings',
        value: analytics.overview.totalCastings,
        icon: <Target className="h-4 w-4 text-muted-foreground" />,
        change: getChangeIndicator(analytics.overview.totalCastings, 98),
        description: 'All time castings'
      },
      {
        title: 'Total Applications',
        value: analytics.overview.totalApplications,
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
        change: getChangeIndicator(analytics.overview.totalApplications, 2234),
        description: 'Model applications'
      },
      {
        title: 'Active Models',
        value: analytics.overview.totalModels,
        icon: <Star className="h-4 w-4 text-muted-foreground" />,
        change: getChangeIndicator(analytics.overview.totalModels, 298),
        description: 'Approved talent'
      },
      {
        title: 'Total Revenue',
        value: formatCurrency(analytics.overview.totalRevenue),
        icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
        change: getChangeIndicator(analytics.overview.totalRevenue, 98750),
        description: 'Generated revenue'
      },
      {
        title: 'Active Jobs',
        value: analytics.overview.activeJobs,
        icon: <Activity className="h-4 w-4 text-muted-foreground" />,
        change: getChangeIndicator(analytics.overview.activeJobs, 18),
        description: 'Currently open'
      },
      {
        title: 'Conversion Rate',
        value: `${analytics.overview.conversionRate}%`,
        icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
        change: getChangeIndicator(analytics.overview.conversionRate, 16.2),
        description: 'Application to booking'
      },
      {
        title: 'Avg Response Time',
        value: `${analytics.overview.avgResponseTime}h`,
        icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
        change: getChangeIndicator(analytics.overview.avgResponseTime, 3.1),
        description: 'Application response'
      },
      {
        title: 'Satisfaction',
        value: `${analytics.overview.customerSatisfaction}/5`,
        icon: <Heart className="h-4 w-4 text-muted-foreground" />,
        change: getChangeIndicator(analytics.overview.customerSatisfaction, 4.5),
        description: 'Customer rating'
      }
    ];

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">{card.description}</p>
                {card.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Live Data
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {renderOverviewCards()}

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="castings">Castings</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Castings & Applications Trend</CardTitle>
                <CardDescription>Monthly casting activity and application volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={analytics?.trends.castings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} name="Castings" />
                    <Line type="monotone" dataKey="applications" stroke="#8b5cf6" strokeWidth={2} name="Applications" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Casting distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analytics?.topMetrics.categoryPerformance}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ category, percentage }) => `${category}: ${percentage}%`}
                    >
                      {analytics?.topMetrics.categoryPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Most Popular Castings</CardTitle>
                <CardDescription>Top performing casting calls by applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topMetrics.mostPopularCastings.map((casting, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">{casting.name}</h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {casting.applications} applications
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {casting.views} views
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Models</CardTitle>
                <CardDescription>Highest earning and most booked talent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topMetrics.topPerformingModels.map((model, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-sm">{model.name}</h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>{model.bookings} bookings</span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {model.rating}
                          </span>
                          <span>{formatCurrency(model.revenue)}</span>
                        </div>
                      </div>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue and booking performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics?.trends.revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'amount' ? formatCurrency(value as number) : value,
                    name === 'amount' ? 'Revenue' : 'Bookings'
                  ]} />
                  <Bar dataKey="amount" fill="#6366f1" name="amount" />
                  <Bar dataKey="bookings" fill="#8b5cf6" name="bookings" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Countries Performance</CardTitle>
                <CardDescription>Model distribution by country</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.geographical.countries.map((country, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{country.country}</h4>
                        <p className="text-sm text-muted-foreground">
                          {country.models} models • {country.castings} castings
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{country.models}</div>
                        <div className="text-xs text-muted-foreground">models</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cities Performance</CardTitle>
                <CardDescription>Activity and revenue by city</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.geographical.cities.map((city, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{city.city}</h4>
                        <p className="text-sm text-muted-foreground">
                          {city.activity} activities
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(city.revenue)}</div>
                        <div className="text-xs text-muted-foreground">revenue</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analytics?.realTime.activeUsers}</div>
                <p className="text-xs text-muted-foreground">Currently online</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Live Applications</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{analytics?.realTime.liveApplications}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {analytics?.realTime.hourlyActivity.reduce((max, current) => 
                    current.activity > max.activity ? current : max
                  ).hour}:00
                </div>
                <p className="text-xs text-muted-foreground">Highest activity</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>24-Hour Activity</CardTitle>
              <CardDescription>Hourly platform activity</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={analytics?.realTime.hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(value) => `${value}:00`}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => `${value}:00`}
                    formatter={(value) => [value, 'Activity']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="activity" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}