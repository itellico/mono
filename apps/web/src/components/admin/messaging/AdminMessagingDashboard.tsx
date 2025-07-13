'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare,
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
  Eye,
  Settings,
  RefreshCw,
  Calendar,
  Activity,
  Shield,
  Zap
} from 'lucide-react';
import { AdminOnly } from '@/components/admin/AdminOnly';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface MessagingMetrics {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  messagesLast24h: number;
  averageResponseTime: number;
  moderationQueue: number;
  reportedMessages: number;
  blockedUsers: number;
  conversationsByType: {
    direct: number;
    group: number;
    support: number;
    business: number;
  };
  messagesByHour: Array<{
    hour: string;
    count: number;
  }>;
  topActiveUsers: Array<{
    id: number;
    name: string;
    messageCount: number;
    avatar?: string;
  }>;
  responseTimeMetrics: {
    under1min: number;
    under5min: number;
    under1hour: number;
    over1hour: number;
  };
}

// Mock data for demonstration
const mockMetrics: MessagingMetrics = {
  totalConversations: 1247,
  activeConversations: 89,
  totalMessages: 15632,
  messagesLast24h: 342,
  averageResponseTime: 4.2, // minutes
  moderationQueue: 12,
  reportedMessages: 3,
  blockedUsers: 7,
  conversationsByType: {
    direct: 856,
    group: 234,
    support: 98,
    business: 59
  },
  messagesByHour: [
    { hour: '00:00', count: 12 },
    { hour: '01:00', count: 8 },
    { hour: '02:00', count: 6 },
    { hour: '03:00', count: 4 },
    { hour: '04:00', count: 5 },
    { hour: '05:00', count: 8 },
    { hour: '06:00', count: 15 },
    { hour: '07:00', count: 28 },
    { hour: '08:00', count: 45 },
    { hour: '09:00', count: 52 },
    { hour: '10:00', count: 48 },
    { hour: '11:00', count: 41 },
    { hour: '12:00', count: 38 },
    { hour: '13:00', count: 44 },
    { hour: '14:00', count: 49 },
    { hour: '15:00', count: 46 },
    { hour: '16:00', count: 42 },
    { hour: '17:00', count: 38 },
    { hour: '18:00', count: 32 },
    { hour: '19:00', count: 28 },
    { hour: '20:00', count: 25 },
    { hour: '21:00', count: 22 },
    { hour: '22:00', count: 18 },
    { hour: '23:00', count: 15 }
  ],
  topActiveUsers: [
    { id: 1, name: 'Sarah Johnson', messageCount: 156 },
    { id: 2, name: 'Mike Chen', messageCount: 142 },
    { id: 3, name: 'Emily Davis', messageCount: 128 },
    { id: 4, name: 'Alex Rodriguez', messageCount: 119 },
    { id: 5, name: 'Jessica Wu', messageCount: 98 }
  ],
  responseTimeMetrics: {
    under1min: 45,
    under5min: 30,
    under1hour: 20,
    over1hour: 5
  }
};

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    period: string;
  };
  className?: string;
}

function MetricCard({ title, value, description, icon, trend, className }: MetricCardProps) {
  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp 
              className={cn(
                "h-3 w-3 mr-1",
                trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
              )} 
            />
            <span className={cn(
              "text-xs font-medium",
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            )}>
              {trend.direction === 'up' ? '+' : '-'}{Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">vs {trend.period}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MessageVolumeChartProps {
  data: Array<{ hour: string; count: number }>;
}

function MessageVolumeChart({ data }: MessageVolumeChartProps) {
  const maxCount = Math.max(...data.map(d => d.count));
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Message Volume (24h)</h3>
        <Badge variant="outline">{data.reduce((sum, d) => sum + d.count, 0)} total</Badge>
      </div>
      <div className="grid grid-cols-12 gap-1 h-32">
        {data.map((item, index) => (
          <div key={item.hour} className="flex flex-col items-center">
            <div className="flex-1 flex items-end w-full">
              <div 
                className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                style={{ 
                  height: `${(item.count / maxCount) * 100}%`,
                  minHeight: item.count > 0 ? '4px' : '0px'
                }}
                title={`${item.hour}: ${item.count} messages`}
              />
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {index % 4 === 0 ? item.hour.split(':')[0] : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminMessagingDashboard() {
  const t = useTranslations('admin-common');
  const [timeRange, setTimeRange] = useState('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<MessagingMetrics>(mockMetrics);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const conversationTypeData = [
    { type: 'Direct', count: metrics.conversationsByType.direct, color: 'bg-blue-500' },
    { type: 'Group', count: metrics.conversationsByType.group, color: 'bg-green-500' },
    { type: 'Support', count: metrics.conversationsByType.support, color: 'bg-yellow-500' },
    { type: 'Business', count: metrics.conversationsByType.business, color: 'bg-purple-500' }
  ];

  const responseTimeData = [
    { range: '< 1 min', percentage: metrics.responseTimeMetrics.under1min, color: 'bg-green-500' },
    { range: '< 5 min', percentage: metrics.responseTimeMetrics.under5min, color: 'bg-blue-500' },
    { range: '< 1 hour', percentage: metrics.responseTimeMetrics.under1hour, color: 'bg-yellow-500' },
    { range: '> 1 hour', percentage: metrics.responseTimeMetrics.over1hour, color: 'bg-red-500' }
  ];

  return (
    <AdminOnly fallback={
      <div className="text-center py-12">
        <p className="text-gray-600">Access denied. Admin permissions required.</p>
      </div>
    }>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              Messaging Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage platform messaging activity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Conversations"
            value={metrics.totalConversations.toLocaleString()}
            description="All conversations on platform"
            icon={<MessageSquare className="h-4 w-4 text-blue-600" />}
            trend={{ value: 12, direction: 'up', period: 'last week' }}
          />
          <MetricCard
            title="Active Now"
            value={metrics.activeConversations}
            description="Conversations with recent activity"
            icon={<Activity className="h-4 w-4 text-green-600" />}
            trend={{ value: 8, direction: 'up', period: 'last hour' }}
          />
          <MetricCard
            title="Messages (24h)"
            value={metrics.messagesLast24h.toLocaleString()}
            description="Messages sent in last 24 hours"
            icon={<Zap className="h-4 w-4 text-yellow-600" />}
            trend={{ value: 5, direction: 'down', period: 'yesterday' }}
          />
          <MetricCard
            title="Avg Response Time"
            value={`${metrics.averageResponseTime}m`}
            description="Average time to first response"
            icon={<Clock className="h-4 w-4 text-purple-600" />}
            trend={{ value: 15, direction: 'down', period: 'last week' }}
          />
        </div>

        {/* Alert Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Moderation Queue"
            value={metrics.moderationQueue}
            description="Messages awaiting review"
            icon={<Shield className="h-4 w-4 text-orange-600" />}
            className={metrics.moderationQueue > 10 ? "border-orange-200 bg-orange-50" : ""}
          />
          <MetricCard
            title="Reported Messages"
            value={metrics.reportedMessages}
            description="User-reported content"
            icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
            className={metrics.reportedMessages > 0 ? "border-red-200 bg-red-50" : ""}
          />
          <MetricCard
            title="Blocked Users"
            value={metrics.blockedUsers}
            description="Currently blocked accounts"
            icon={<Users className="h-4 w-4 text-gray-600" />}
          />
        </div>

        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Message Volume Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Message Activity</CardTitle>
                  <CardDescription>Messages sent by hour over the last 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <MessageVolumeChart data={metrics.messagesByHour} />
                </CardContent>
              </Card>

              {/* Conversation Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversation Types</CardTitle>
                  <CardDescription>Distribution of conversation types</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {conversationTypeData.map((item) => (
                    <div key={item.type} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.type}</span>
                        <span className="text-sm text-muted-foreground">{item.count}</span>
                      </div>
                      <Progress 
                        value={(item.count / metrics.totalConversations) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="conversations" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Conversations */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Conversations</CardTitle>
                  <CardDescription>Latest conversation activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200" />
                          <div>
                            <p className="text-sm font-medium">Conversation #{1000 + i}</p>
                            <p className="text-xs text-muted-foreground">2 participants • 5 messages</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Active</Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Conversation Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversation Status</CardTitle>
                  <CardDescription>Status distribution of all conversations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { status: 'Active', count: 856, color: 'bg-green-500' },
                    { status: 'Archived', count: 234, color: 'bg-gray-500' },
                    { status: 'Closed', count: 98, color: 'bg-blue-500' },
                    { status: 'Blocked', count: 59, color: 'bg-red-500' }
                  ].map((item) => (
                    <div key={item.status} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.status}</span>
                        <span className="text-sm text-muted-foreground">{item.count}</span>
                      </div>
                      <Progress 
                        value={(item.count / metrics.totalConversations) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Response Time Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Response Time Distribution</CardTitle>
                  <CardDescription>How quickly users respond to messages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {responseTimeData.map((item) => (
                    <div key={item.range} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.range}</span>
                        <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                      </div>
                      <Progress 
                        value={item.percentage} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* System Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                  <CardDescription>Messaging system health metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Message Delivery Rate</span>
                      <span className="text-sm font-medium text-green-600">99.8%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Latency</span>
                      <span className="text-sm font-medium">142ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Connection Uptime</span>
                      <span className="text-sm font-medium text-green-600">99.99%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Queue Processing Time</span>
                      <span className="text-sm font-medium">0.8s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Active Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Active Users</CardTitle>
                  <CardDescription>Users with highest message count ({timeRange})</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.topActiveUsers.map((user, index) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium">{user.name}</span>
                        </div>
                        <Badge variant="outline">{user.messageCount} messages</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* User Engagement */}
              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                  <CardDescription>User activity and engagement metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">68%</div>
                      <div className="text-xs text-muted-foreground">Daily Active</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">84%</div>
                      <div className="text-xs text-muted-foreground">Weekly Active</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">4.2</div>
                      <div className="text-xs text-muted-foreground">Avg Messages/Day</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">92%</div>
                      <div className="text-xs text-muted-foreground">Retention Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminOnly>
  );
}

export default AdminMessagingDashboard;