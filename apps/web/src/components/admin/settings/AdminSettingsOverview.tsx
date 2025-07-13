'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  SettingsIcon, 
  ShieldIcon, 
  ActivityIcon, 
  ImageIcon, 
  DatabaseIcon,
  GlobeIcon,
  MailIcon,
  PaletteIcon,
  BuildingIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  UsersIcon,
  UploadIcon,
  ClockIcon,
  FileTextIcon,
  StarIcon,
  ZapIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { browserLogger } from '@/lib/browser-logger';
interface SettingsStats {
  totalSettings: number;
  activeSettings: number;
  hierarchicalSettings: number;
  lastUpdated: string;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}
interface CategoryStats {
  category: string;
  icon: any;
  displayName: string;
  count: number;
  configured: number;
  status: 'complete' | 'partial' | 'minimal';
  lastModified: string;
  description: string;
  color: string;
}
const CATEGORY_CONFIGS = [
  {
    category: 'general',
    icon: SettingsIcon,
    displayName: 'General Platform',
    description: 'Core platform settings and configuration',
    color: 'bg-blue-50 border-blue-200 text-blue-900'
  },
  {
    category: 'upload',
    icon: UploadIcon,
    displayName: 'Upload & Media',
    description: 'File upload limits, formats, and processing',
    color: 'bg-green-50 border-green-200 text-green-900'
  },
  {
    category: 'hierarchical',
    icon: ShieldIcon,
    displayName: 'Platform Constraints',
    description: 'Super admin hierarchical settings',
    color: 'bg-red-50 border-red-200 text-red-900'
  },
  {
    category: 'queue-config',
    icon: ActivityIcon,
    displayName: 'Queue & Workers',
    description: 'Background job processing configuration',
    color: 'bg-purple-50 border-purple-200 text-purple-900'
  },
  {
    category: 'security',
    icon: ShieldIcon,
    displayName: 'Security',
    description: 'Authentication and security policies',
    color: 'bg-orange-50 border-orange-200 text-orange-900'
  },
  {
    category: 'email',
    icon: MailIcon,
    displayName: 'Email & Notifications',
    description: 'Email delivery and notification settings',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-900'
  },
  {
    category: 'localization',
    icon: GlobeIcon,
    displayName: 'Localization',
    description: 'Language, region, and internationalization',
    color: 'bg-cyan-50 border-cyan-200 text-cyan-900'
  },
  {
    category: 'ui',
    icon: PaletteIcon,
    displayName: 'UI & Experience',
    description: 'User interface and experience customization',
    color: 'bg-pink-50 border-pink-200 text-pink-900'
  },
  {
    category: 'business',
    icon: BuildingIcon,
    displayName: 'Business Rules',
    description: 'Business logic and operational constraints',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-900'
  },
  {
    category: 'content',
    icon: FileTextIcon,
    displayName: 'Content Management',
    description: 'Content policies and moderation settings',
    color: 'bg-gray-50 border-gray-200 text-gray-900'
  }
];
export function AdminSettingsOverview({ onNavigateToTab }: { onNavigateToTab: (tab: string) => void }) {
  const [stats, setStats] = useState<SettingsStats>({
    totalSettings: 0,
    activeSettings: 0,
    hierarchicalSettings: 0,
    lastUpdated: new Date().toISOString(),
    systemHealth: 'good'
  });
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  useEffect(() => {
    // Simulate loading stats - in real app, fetch from API
    const loadStats = async () => {
      try {
        // Mock data for demonstration
        const mockStats: SettingsStats = {
          totalSettings: 142,
          activeSettings: 128,
          hierarchicalSettings: 22,
          lastUpdated: new Date().toISOString(),
          systemHealth: 'excellent'
        };
        const mockCategoryStats: CategoryStats[] = CATEGORY_CONFIGS.map((config, index) => ({
          category: config.category,
          icon: config.icon,
          displayName: config.displayName,
          count: Math.floor(Math.random() * 20) + 5,
          configured: Math.floor(Math.random() * 15) + 3,
          status: ['complete', 'partial', 'minimal'][Math.floor(Math.random() * 3)] as any,
          lastModified: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: config.description,
          color: config.color
        }));
        setStats(mockStats);
        setCategoryStats(mockCategoryStats);
      } catch (error) {
        browserLogger.error('Failed to load settings stats', { error: error.message });
        toast({
          title: 'Error loading statistics',
          description: 'Failed to load settings overview data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [toast]);
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'minimal': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const getProgressColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-500';
      case 'partial': return 'bg-yellow-500';
      case 'minimal': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-100 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="h-20 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* System Health Alert */}
      <Alert className={
        stats.systemHealth === 'excellent' ? 'border-green-200 bg-green-50' :
        stats.systemHealth === 'good' ? 'border-blue-200 bg-blue-50' :
        stats.systemHealth === 'warning' ? 'border-yellow-200 bg-yellow-50' :
        'border-red-200 bg-red-50'
      }>
        <CheckCircleIcon className={`h-4 w-4 ${getHealthColor(stats.systemHealth)}`} />
        <AlertDescription className={getHealthColor(stats.systemHealth)}>
          <strong>System Health: {stats.systemHealth.charAt(0).toUpperCase() + stats.systemHealth.slice(1)}</strong>
          {' '}- All settings are properly configured and the platform is operating smoothly.
        </AlertDescription>
      </Alert>
      {/* Platform Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5" />
            Platform Configuration Overview
          </CardTitle>
          <CardDescription>
            Real-time statistics about your platform configuration and settings management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalSettings}</div>
              <div className="text-sm text-muted-foreground">Total Settings</div>
              <div className="text-xs text-green-600 mt-1">All categories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{stats.activeSettings}</div>
              <div className="text-sm text-muted-foreground">Active Settings</div>
              <div className="text-xs text-blue-600 mt-1">
                {Math.round((stats.activeSettings / stats.totalSettings) * 100)}% configured
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">{stats.hierarchicalSettings}</div>
              <div className="text-sm text-muted-foreground">Hierarchical</div>
              <div className="text-xs text-red-600 mt-1">Super admin only</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {new Date(stats.lastUpdated).toLocaleDateString()}
              </div>
              <div className="text-sm text-muted-foreground">Last Updated</div>
              <div className="text-xs text-gray-600 mt-1">
                {new Date(stats.lastUpdated).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Settings Categories Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Settings Categories
          </CardTitle>
          <CardDescription>
            Manage different aspects of your platform configuration. Click on any category to jump to its settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryStats.map((category) => {
              const Icon = category.icon;
              const completionPercentage = Math.round((category.configured / category.count) * 100);
              return (
                <Card 
                  key={category.category} 
                  className={`transition-all hover:shadow-md cursor-pointer border ${category.color}`}
                  onClick={() => onNavigateToTab(category.category)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${category.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{category.displayName}</h4>
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(category.status)} variant="outline">
                        {category.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Configuration Progress</span>
                        <span className="font-medium">{completionPercentage}%</span>
                      </div>
                      <Progress 
                        value={completionPercentage} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{category.configured} of {category.count} configured</span>
                        <span>{new Date(category.lastModified).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ZapIcon className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common administrative tasks and frequently accessed settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 text-center"
              onClick={() => onNavigateToTab('all-settings')}
            >
              <DatabaseIcon className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium">All Settings</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 text-center"
              onClick={() => onNavigateToTab('hierarchical')}
            >
              <ShieldIcon className="h-6 w-6 text-red-600" />
              <span className="text-sm font-medium">Platform Constraints</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 text-center"
              onClick={() => onNavigateToTab('upload')}
            >
              <UploadIcon className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium">Upload Settings</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 text-center"
              onClick={() => onNavigateToTab('queue-config')}
            >
              <ActivityIcon className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium">Queue Management</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 text-center"
              onClick={() => onNavigateToTab('security')}
            >
              <ShieldIcon className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium">Security Policies</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Recent Activity & Help */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Recent Configuration Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { setting: 'Max File Size', category: 'Upload', time: '2 hours ago', user: 'Super Admin' },
                { setting: 'Queue Workers', category: 'Queue Config', time: '1 day ago', user: 'Admin' },
                { setting: 'Email Templates', category: 'Email', time: '3 days ago', user: 'Admin' },
                { setting: 'Security Policy', category: 'Security', time: '1 week ago', user: 'Super Admin' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <div className="font-medium text-sm">{activity.setting}</div>
                    <div className="text-xs text-muted-foreground">{activity.category} • {activity.time}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">{activity.user}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <InfoIcon className="h-5 w-5" />
              Configuration Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-2">
                  <StarIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm text-blue-900">Platform Constraints</div>
                    <div className="text-xs text-blue-700">Set global maximums that tenants cannot exceed</div>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-start gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm text-green-900">Upload Optimization</div>
                    <div className="text-xs text-green-700">Configure file size limits and format restrictions</div>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                <div className="flex items-start gap-2">
                  <ActivityIcon className="h-4 w-4 text-purple-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-sm text-purple-900">Queue Performance</div>
                    <div className="text-xs text-purple-700">Monitor and adjust worker configurations</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 