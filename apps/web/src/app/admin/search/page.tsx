'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Database, 
  Settings, 
  Users,
  Eye,
  Edit,
  Plus,
  Filter,
  BarChart3,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useAuditTracking, usePageTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';
import { SearchPageLayout } from '@/components/search/SearchPageLayout';

/**
 * 🔍 Search Management Page - Admin Interface
 * 
 * This page demonstrates how to integrate search functionality within your itellico Mono:
 * - Lives within your standard AdminLayout (topbar + sidebar + content)
 * - Uses your existing ShadCN components and styling
 * - Integrates with your audit tracking system
 * - Follows your cursor rules and patterns
 */

// Mock data for demonstration - in real implementation, this would come from your APIs
const SEARCH_CONFIGURATIONS = [
  {
    id: 'modeling_search',
    name: 'Model Search',
    industry: 'Modeling',
    schemaId: 'modeling_profile_schema',
    status: 'active',
    totalResults: 1247,
    avgResponseTime: '120ms',
    searchesPerDay: 89,
    lastUpdated: '2 hours ago'
  },
  {
    id: 'fitness_search',
    name: 'Trainer Search',
    industry: 'Fitness',
    schemaId: 'fitness_trainer_schema',
    status: 'active',
    totalResults: 892,
    avgResponseTime: '95ms',
    searchesPerDay: 156,
    lastUpdated: '1 day ago'
  },
  {
    id: 'photography_search',
    name: 'Photographer Search',
    industry: 'Photography',
    schemaId: 'photographer_profile_schema',
    status: 'draft',
    totalResults: 634,
    avgResponseTime: '140ms',
    searchesPerDay: 67,
    lastUpdated: '3 days ago'
  }
];

const MODELING_SEARCH_CONFIG = {
  schemaId: 'modeling_profile_schema',
  industryType: 'Modeling',
  title: 'Find Models',
  description: 'Search through our database of professional models',
  searchFields: [
    {
      id: 'name',
      label: 'Name',
      type: 'text' as const,
      placeholder: 'Search by name...',
    },
    {
      id: 'location',
      label: 'Location',
      type: 'select' as const,
      placeholder: 'Select location',
      options: [
        { value: 'new-york', label: 'New York' },
        { value: 'los-angeles', label: 'Los Angeles' },
        { value: 'miami', label: 'Miami' },
        { value: 'chicago', label: 'Chicago' },
      ],
    },
    {
      id: 'category',
      label: 'Category',
      type: 'select' as const,
      placeholder: 'Select category',
      options: [
        { value: 'fashion', label: 'Fashion' },
        { value: 'commercial', label: 'Commercial' },
        { value: 'fitness', label: 'Fitness' },
        { value: 'glamour', label: 'Glamour' },
      ],
    },
    {
      id: 'height_min',
      label: 'Min Height (cm)',
      type: 'number' as const,
      placeholder: '160',
    },
    {
      id: 'height_max',
      label: 'Max Height (cm)',
      type: 'number' as const,
      placeholder: '200',
    },
    {
      id: 'experience',
      label: 'Experience Level',
      type: 'select' as const,
      placeholder: 'Select experience',
      options: [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'professional', label: 'Professional' },
      ],
    },
  ],
  resultFields: [
    {
      id: 'name',
      label: 'Name',
      type: 'text' as const,
      primary: true,
    },
    {
      id: 'profile_image',
      label: 'Photo',
      type: 'image' as const,
    },
    {
      id: 'location',
      label: 'Location',
      type: 'text' as const,
    },
    {
      id: 'category',
      label: 'Category',
      type: 'badge' as const,
    },
    {
      id: 'height',
      label: 'Height',
      type: 'text' as const,
    },
    {
      id: 'experience',
      label: 'Experience',
      type: 'badge' as const,
    },
  ],
};

export default function SearchManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const { trackPageView } = useAuditTracking();

  // Track page view for audit
  usePageTracking('admin_search_management');

  React.useEffect(() => {
    trackPageView('admin_search_management', {
      section: 'search_management',
      userRole: 'admin'
    });
  }, [trackPageView]);

  // Mock search function for demonstration
  const handleSearch = async (filters: Record<string, any>, page = 1) => {
    browserLogger.userAction('admin_search_test', {
      filters,
      page,
      configId: selectedConfig
    });

    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock results
    const mockResults = [
      {
        id: '1',
        name: 'Sarah Johnson',
        profile_image: '/api/placeholder/150/200',
        location: 'New York',
        category: 'Fashion',
        height: '175 cm',
        experience: 'Professional',
      },
      {
        id: '2',
        name: 'Mike Chen',
        profile_image: '/api/placeholder/150/200',
        location: 'Los Angeles',
        category: 'Commercial',
        height: '182 cm',
        experience: 'Intermediate',
      },
    ];

    return {
      results: mockResults,
      pagination: {
        page,
        limit: 12,
        total: mockResults.length,
        totalPages: 1,
      },
    };
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Search Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">118ms</div>
            <p className="text-xs text-muted-foreground">-8ms from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Configs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">2 active, 1 draft</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.7%</div>
            <p className="text-xs text-muted-foreground">+0.3% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Configurations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Search Configurations</CardTitle>
              <CardDescription>
                Manage search interfaces for different industries and use cases
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Search Config
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {SEARCH_CONFIGURATIONS.map((config) => (
              <div
                key={config.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{config.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{config.industry}</span>
                      <span>•</span>
                      <span>{config.totalResults} results</span>
                      <span>•</span>
                      <span>{config.avgResponseTime}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={config.status === 'active' ? 'default' : 'secondary'}>
                    {config.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTestSearchTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Search Interface</CardTitle>
          <CardDescription>
            Test your search configurations in a live environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Select value={selectedConfig || ''} onValueChange={setSelectedConfig}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select search configuration" />
                </SelectTrigger>
                <SelectContent>
                  {SEARCH_CONFIGURATIONS.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name} ({config.industry})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>

            {selectedConfig === 'modeling_search' && (
              <div className="border rounded-lg p-6 bg-muted/20">
                <SearchPageLayout
                  config={MODELING_SEARCH_CONFIG}
                  onSearch={handleSearch}
                  onViewResult={(id) => {
                    browserLogger.userAction('admin_search_result_view', { resultId: id });
                    console.log('View result:', id);
                  }}
                  onEditResult={(id) => {
                    browserLogger.userAction('admin_search_result_edit', { resultId: id });
                    console.log('Edit result:', id);
                  }}
                  onDeleteResult={(id) => {
                    browserLogger.userAction('admin_search_result_delete', { resultId: id });
                    console.log('Delete result:', id);
                  }}
                  onBulkAction={(action, ids) => {
                    browserLogger.userAction('admin_search_bulk_action', { action, itemCount: ids.length });
                    console.log('Bulk action:', action, 'on:', ids);
                  }}
                  defaultViewMode="grid"
                  allowBulkActions={true}
                  showFiltersInSidebar={false}
                />
              </div>
            )}

            {selectedConfig && selectedConfig !== 'modeling_search' && (
              <div className="border rounded-lg p-6 bg-muted/20 text-center">
                <p className="text-muted-foreground">
                  Search interface for {SEARCH_CONFIGURATIONS.find(c => c.id === selectedConfig)?.name} 
                  would be displayed here.
                </p>
              </div>
            )}

            {!selectedConfig && (
              <div className="border rounded-lg p-6 bg-muted/20 text-center">
                <p className="text-muted-foreground">
                  Select a search configuration to test the interface
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Analytics</CardTitle>
          <CardDescription>
            Monitor search performance and user behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Period</label>
                <Select defaultValue="7d">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Industry</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    <SelectItem value="modeling">Modeling</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="photography">Photography</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Metric</label>
                <Select defaultValue="searches">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="searches">Total Searches</SelectItem>
                    <SelectItem value="response_time">Response Time</SelectItem>
                    <SelectItem value="success_rate">Success Rate</SelectItem>
                    <SelectItem value="results_clicked">Results Clicked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="h-64 border rounded-lg bg-muted/20 flex items-center justify-center">
              <div className="text-center space-y-2">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">Analytics chart would be displayed here</p>
                <p className="text-sm text-muted-foreground">
                  Integration with your existing analytics system
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Settings</CardTitle>
          <CardDescription>
            Configure global search behavior and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h4 className="font-medium">Performance Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Cache Duration (minutes)</label>
                    <Input type="number" defaultValue="5" className="w-20" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Max Results Per Page</label>
                    <Input type="number" defaultValue="12" className="w-20" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Search Timeout (ms)</label>
                    <Input type="number" defaultValue="5000" className="w-20" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Search Behavior</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Enable Autocomplete</label>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Enable Fuzzy Search</label>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Log Search Queries</label>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button>Save Settings</Button>
              <Button variant="outline">Reset to Defaults</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search Management</h1>
        <p className="text-muted-foreground mt-2">
          Configure and manage search interfaces across your itellico Mono
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="test">Test Search</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          {renderTestSearchTab()}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {renderAnalyticsTab()}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {renderSettingsTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
} 