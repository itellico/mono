'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Settings, 
  Zap, 
  Shield, 
  Star, 
  CheckCircle, 
  XCircle,
  Info,
  AlertCircle,
  Cpu,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface FeatureSet {
  id: number;
  name: string;
  slug: string;
  description?: string;
  category: string;
  complexity: 'simple' | 'medium' | 'advanced';
  resourceUsage: 'low' | 'medium' | 'high';
  minimumTier: string;
  availableInTiers: string[];
  isActive: boolean;
  version: string;
  _count?: {
    tenantFeatures: number;
  };
}

interface TenantFeature {
  id: number;
  featureSetId: number;
  tenantId: number;
  config: any;
  isActive: boolean;
  enabledAt: string;
  featureSet: FeatureSet;
}

interface SubscriptionInfo {
  id: number;
  status: string;
  tier: string;
  startDate: string;
  endDate?: string;
  plan: {
    id: number;
    name: string;
    tier: string;
    industryTemplate?: {
      id: number;
      name: string;
      category: string;
    };
  };
}

interface FeatureUsage {
  totalFeatures: number;
  enabledFeatures: number;
  utilizationRate: number;
  categoryBreakdown: Record<string, number>;
  recentActivity: Array<{
    featureId: number;
    featureName: string;
    action: string;
    timestamp: string;
  }>;
}

// API Functions
async function fetchTenantFeatures(): Promise<TenantFeature[]> {
  const response = await fetch('/api/v1/tenant/features');
  if (!response.ok) {
    throw new Error('Failed to fetch tenant features');
  }
  const result = await response.json();
  return result.data.features;
}

async function fetchAvailableFeatures(params?: any): Promise<{ featureSets: FeatureSet[]; total: number; hasMore: boolean }> {
  const searchParams = new URLSearchParams(params);
  const response = await fetch(`/api/v1/tenant/features/available?${searchParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch available features');
  }
  const result = await response.json();
  return result.data;
}

async function fetchSubscriptionFeatures(): Promise<{
  subscription: SubscriptionInfo;
  includedFeatures: any[];
  availableFeatures: any[];
}> {
  const response = await fetch('/api/v1/tenant/subscriptions/features');
  if (!response.ok) {
    throw new Error('Failed to fetch subscription features');
  }
  const result = await response.json();
  return result.data;
}

async function fetchFeatureUsage(): Promise<FeatureUsage> {
  const response = await fetch('/api/v1/tenant/subscriptions/features/usage');
  if (!response.ok) {
    throw new Error('Failed to fetch feature usage');
  }
  const result = await response.json();
  return result.data;
}

async function enableFeature(featureSetId: number, config?: any): Promise<void> {
  const response = await fetch('/api/v1/tenant/features/enable', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ featureSetId, config }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to enable feature');
  }
}

async function disableFeature(featureSetId: number): Promise<void> {
  const response = await fetch('/api/v1/tenant/features/disable', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ featureSetId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to disable feature');
  }
}

function getComplexityIcon(complexity: string) {
  switch (complexity) {
    case 'simple': return <Zap className="h-4 w-4 text-green-500" />;
    case 'medium': return <Settings className="h-4 w-4 text-yellow-500" />;
    case 'advanced': return <Cpu className="h-4 w-4 text-red-500" />;
    default: return <Info className="h-4 w-4" />;
  }
}

function getResourceIcon(usage: string) {
  switch (usage) {
    case 'low': return <Activity className="h-4 w-4 text-green-500" />;
    case 'medium': return <Activity className="h-4 w-4 text-yellow-500" />;
    case 'high': return <Activity className="h-4 w-4 text-red-500" />;
    default: return <Activity className="h-4 w-4" />;
  }
}

export function TenantFeaturesClientPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('');
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureSet | null>(null);

  // Queries
  const { data: tenantFeatures, isLoading: loadingTenantFeatures } = useQuery({
    queryKey: ['tenant-features'],
    queryFn: fetchTenantFeatures,
  });

  const { data: availableFeatures, isLoading: loadingAvailable } = useQuery({
    queryKey: ['available-features', searchQuery, selectedCategory, selectedComplexity],
    queryFn: () => fetchAvailableFeatures({
      search: searchQuery || undefined,
      category: selectedCategory || undefined,
      complexity: selectedComplexity || undefined,
      limit: 50,
    }),
  });

  const { data: subscriptionData, isLoading: loadingSubscription } = useQuery({
    queryKey: ['subscription-features'],
    queryFn: fetchSubscriptionFeatures,
  });

  const { data: usageData, isLoading: loadingUsage } = useQuery({
    queryKey: ['feature-usage'],
    queryFn: fetchFeatureUsage,
  });

  // Mutations
  const enableMutation = useMutation({
    mutationFn: ({ featureSetId, config }: { featureSetId: number; config?: any }) =>
      enableFeature(featureSetId, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-features'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-features'] });
      queryClient.invalidateQueries({ queryKey: ['feature-usage'] });
      toast.success('Feature enabled successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const disableMutation = useMutation({
    mutationFn: disableFeature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-features'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-features'] });
      queryClient.invalidateQueries({ queryKey: ['feature-usage'] });
      toast.success('Feature disabled successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleEnableFeature = (featureSetId: number) => {
    enableMutation.mutate({ featureSetId });
  };

  const handleDisableFeature = (featureSetId: number) => {
    disableMutation.mutate(featureSetId);
  };

  const handleConfigureFeature = (feature: FeatureSet) => {
    setSelectedFeature(feature);
    setConfigDialogOpen(true);
  };

  const isFeatureEnabled = (featureSetId: number) => {
    return tenantFeatures?.some(tf => tf.featureSetId === featureSetId && tf.isActive);
  };

  const getEnabledFeatureConfig = (featureSetId: number) => {
    return tenantFeatures?.find(tf => tf.featureSetId === featureSetId && tf.isActive)?.config;
  };

  if (loadingTenantFeatures || loadingSubscription) {
    return <LoadingState />;
  }

  const enabledFeaturesSet = new Set(tenantFeatures?.map(tf => tf.featureSetId) || []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Features Management</h1>
        <p className="text-muted-foreground">
          Manage and configure features for your tenant workspace
        </p>
      </div>

      {/* Subscription Info */}
      {subscriptionData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Subscription Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Plan</Label>
                <p className="text-lg font-semibold">{subscriptionData.subscription.plan.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Tier</Label>
                <Badge variant="secondary" className="uppercase">
                  {subscriptionData.subscription.tier}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge variant={subscriptionData.subscription.status === 'active' ? 'default' : 'destructive'}>
                  {subscriptionData.subscription.status}
                </Badge>
              </div>
              {subscriptionData.subscription.plan.industryTemplate && (
                <div>
                  <Label className="text-sm font-medium">Industry Template</Label>
                  <p className="text-sm">{subscriptionData.subscription.plan.industryTemplate.name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Statistics */}
      {usageData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Features</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageData.totalFeatures}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enabled Features</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageData.enabledFeatures}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageData.utilizationRate}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(usageData.categoryBreakdown).length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="enabled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="enabled">Enabled Features</TabsTrigger>
          <TabsTrigger value="available">Available Features</TabsTrigger>
        </TabsList>

        <TabsContent value="enabled" className="space-y-4">
          {tenantFeatures && tenantFeatures.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenantFeatures.map((tenantFeature) => (
                <Card key={tenantFeature.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{tenantFeature.featureSet.name}</CardTitle>
                        <CardDescription>{tenantFeature.featureSet.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getComplexityIcon(tenantFeature.featureSet.complexity)}
                        {getResourceIcon(tenantFeature.featureSet.resourceUsage)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{tenantFeature.featureSet.category}</Badge>
                        <Badge variant="default" className="text-xs">v{tenantFeature.featureSet.version}</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Enabled</span>
                        </div>
                      </div>

                      <Separator />
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConfigureFeature(tenantFeature.featureSet)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Configure
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDisableFeature(tenantFeature.featureSetId)}
                          disabled={disableMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Disable
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Features Enabled"
              description="You haven't enabled any features yet. Browse available features to get started."
              action={
                <Button onClick={() => setSearchQuery('')}>
                  Browse Features
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="commerce">Commerce</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="integration">Integration</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Complexity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Complexity</SelectItem>
                <SelectItem value="simple">Simple</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Available Features */}
          {loadingAvailable ? (
            <LoadingState />
          ) : availableFeatures && availableFeatures.featureSets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableFeatures.featureSets.map((feature) => {
                const isEnabled = isFeatureEnabled(feature.id);
                
                return (
                  <Card key={feature.id} className={`relative ${isEnabled ? 'ring-2 ring-green-500' : ''}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{feature.name}</CardTitle>
                          <CardDescription>{feature.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getComplexityIcon(feature.complexity)}
                          {getResourceIcon(feature.resourceUsage)}
                          {isEnabled && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{feature.category}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            Min: {feature.minimumTier}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Usage Count</span>
                          <span className="text-sm font-medium">
                            {feature._count?.tenantFeatures || 0}
                          </span>
                        </div>

                        <Separator />
                        
                        <div className="flex gap-2">
                          {isEnabled ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleConfigureFeature(feature)}
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Configure
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDisableFeature(feature.id)}
                                disabled={disableMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Disable
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleEnableFeature(feature.id)}
                              disabled={enableMutation.isPending}
                              className="w-full"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Enable Feature
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No Features Found"
              description="No features match your current search criteria."
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure {selectedFeature?.name}</DialogTitle>
            <DialogDescription>
              Customize the settings for this feature
            </DialogDescription>
          </DialogHeader>
          {selectedFeature && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Feature configuration interface would be implemented here based on the specific feature's configuration schema.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Category</Label>
                  <p className="text-muted-foreground">{selectedFeature.category}</p>
                </div>
                <div>
                  <Label>Complexity</Label>
                  <p className="text-muted-foreground capitalize">{selectedFeature.complexity}</p>
                </div>
                <div>
                  <Label>Resource Usage</Label>
                  <p className="text-muted-foreground capitalize">{selectedFeature.resourceUsage}</p>
                </div>
                <div>
                  <Label>Version</Label>
                  <p className="text-muted-foreground">v{selectedFeature.version}</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                  Cancel
                </Button>
                <Button>Save Configuration</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}