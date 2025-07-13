'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Save, Settings, Package, Zap, Shield, Users, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: 'platform' | 'tenant' | 'account' | 'user' | 'public';
  enabled: boolean;
  limits?: {
    [key: string]: number | boolean;
  };
}

interface FeatureSet {
  id?: string;
  name: string;
  description: string;
  features: Feature[];
  isDefault: boolean;
  tier: 'platform' | 'tenant' | 'account' | 'user' | 'public';
}

const featureCategories = [
  { id: 'core', name: 'Core Features', icon: Package },
  { id: 'advanced', name: 'Advanced Features', icon: Zap },
  { id: 'security', name: 'Security & Compliance', icon: Shield },
  { id: 'collaboration', name: 'Collaboration', icon: Users },
];

export default function FeatureSetBuilderPage() {
  const [featureSet, setFeatureSet] = useState<FeatureSet>({
    name: '',
    description: '',
    features: [],
    isDefault: false,
    tier: 'tenant',
  });

  const [selectedCategory, setSelectedCategory] = useState('core');

  const { data: availableFeatures, isLoading: loadingFeatures } = useQuery({
    queryKey: ['platform-features'],
    queryFn: async () => {
      const response = await fetch('/api/v1/platform/features');
      if (!response.ok) throw new Error('Failed to fetch features');
      const data = await response.json();
      return data.data;
    },
  });

  const { data: existingFeatureSets } = useQuery({
    queryKey: ['platform-feature-sets'],
    queryFn: async () => {
      const response = await fetch('/api/v1/platform/feature-sets');
      if (!response.ok) throw new Error('Failed to fetch feature sets');
      const data = await response.json();
      return data.data;
    },
  });

  const saveFeatureSet = useMutation({
    mutationFn: async (data: FeatureSet) => {
      const response = await fetch('/api/v1/platform/feature-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save feature set');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Feature Set Saved',
        description: 'The feature set has been saved successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save feature set. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const toggleFeature = (featureId: string) => {
    setFeatureSet(prev => {
      const existingFeature = prev.features.find(f => f.id === featureId);
      if (existingFeature) {
        return {
          ...prev,
          features: prev.features.map(f =>
            f.id === featureId ? { ...f, enabled: !f.enabled } : f
          ),
        };
      } else {
        const feature = availableFeatures?.find((f: Feature) => f.id === featureId);
        if (feature) {
          return {
            ...prev,
            features: [...prev.features, { ...feature, enabled: true }],
          };
        }
      }
      return prev;
    });
  };

  const updateFeatureLimit = (featureId: string, limitKey: string, value: string | number | boolean) => {
    setFeatureSet(prev => ({
      ...prev,
      features: prev.features.map(f =>
        f.id === featureId
          ? {
              ...f,
              limits: {
                ...f.limits,
                [limitKey]: value,
              },
            }
          : f
      ),
    }));
  };

  const removeFeature = (featureId: string) => {
    setFeatureSet(prev => ({
      ...prev,
      features: prev.features.filter(f => f.id !== featureId),
    }));
  };

  const handleSave = () => {
    if (!featureSet.name) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a name for the feature set.',
        variant: 'destructive',
      });
      return;
    }
    saveFeatureSet.mutate(featureSet);
  };

  const loadQuickSet = (templateId: string) => {
    const templates: { [key: string]: Partial<FeatureSet> } = {
      starter: {
        name: 'Starter Plan',
        description: 'Essential features for small teams',
        features: availableFeatures?.filter((f: Feature) => 
          ['basic-auth', 'basic-storage', 'basic-api'].includes(f.id)
        ) || [],
      },
      professional: {
        name: 'Professional Plan',
        description: 'Advanced features for growing businesses',
        features: availableFeatures?.filter((f: Feature) => 
          f.category === 'core' || f.category === 'advanced'
        ) || [],
      },
      enterprise: {
        name: 'Enterprise Plan',
        description: 'Complete feature set with unlimited access',
        features: availableFeatures || [],
      },
    };

    const template = templates[templateId];
    if (template) {
      setFeatureSet(prev => ({
        ...prev,
        ...template,
        features: template.features?.map(f => ({ ...f, enabled: true })) || [],
      }));
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/platform">Platform</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/platform/plans">Plans</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Feature Set Builder</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Feature Set Builder</h1>
          <p className="text-muted-foreground">Create and customize feature sets for subscription plans</p>
        </div>
        <Button onClick={handleSave} disabled={saveFeatureSet.isPending}>
          <Save className="mr-2 h-4 w-4" />
          Save Feature Set
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Sets</CardTitle>
              <CardDescription>Start with a pre-configured template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => loadQuickSet('starter')}
              >
                Starter Plan Template
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => loadQuickSet('professional')}
              >
                Professional Plan Template
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => loadQuickSet('enterprise')}
              >
                Enterprise Plan Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Features</p>
                <p className="text-2xl font-bold">{featureSet.features.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enabled Features</p>
                <p className="text-2xl font-bold">
                  {featureSet.features.filter(f => f.enabled).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Feature Sets</p>
                <p className="text-2xl font-bold">{existingFeatureSets?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Set Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Feature Set Name</Label>
                  <Input
                    id="name"
                    value={featureSet.name}
                    onChange={(e) => setFeatureSet({ ...featureSet, name: e.target.value })}
                    placeholder="e.g., Professional Plan Features"
                  />
                </div>
                <div>
                  <Label htmlFor="tier">Target Tier</Label>
                  <Select
                    value={featureSet.tier}
                    onValueChange={(value: any) => setFeatureSet({ ...featureSet, tier: value })}
                  >
                    <SelectTrigger id="tier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platform">Platform</SelectItem>
                      <SelectItem value="tenant">Tenant</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={featureSet.description}
                  onChange={(e) => setFeatureSet({ ...featureSet, description: e.target.value })}
                  placeholder="Describe what this feature set includes..."
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="default"
                  checked={featureSet.isDefault}
                  onCheckedChange={(checked) => setFeatureSet({ ...featureSet, isDefault: checked })}
                />
                <Label htmlFor="default">Set as default for new plans</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Features</CardTitle>
              <CardDescription>Select and configure features for this set</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="grid grid-cols-4 w-full">
                  {featureCategories.map((category) => (
                    <TabsTrigger key={category.id} value={category.id}>
                      <category.icon className="mr-2 h-4 w-4" />
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {featureCategories.map((category) => (
                  <TabsContent key={category.id} value={category.id} className="space-y-4">
                    {loadingFeatures ? (
                      <p>Loading features...</p>
                    ) : (
                      availableFeatures
                        ?.filter((feature: Feature) => feature.category === category.id)
                        .map((feature: Feature) => {
                          const isSelected = featureSet.features.some(f => f.id === feature.id);
                          const selectedFeature = featureSet.features.find(f => f.id === feature.id);

                          return (
                            <div
                              key={feature.id}
                              className={`border rounded-lg p-4 space-y-3 ${
                                isSelected ? 'border-primary bg-primary/5' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium">{feature.name}</h4>
                                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                                  <Badge variant="outline" className="mt-2">
                                    {feature.tier}
                                  </Badge>
                                </div>
                                <Switch
                                  checked={selectedFeature?.enabled || false}
                                  onCheckedChange={() => toggleFeature(feature.id)}
                                />
                              </div>

                              {isSelected && feature.limits && (
                                <div className="pl-4 space-y-2 border-l-2">
                                  <p className="text-sm font-medium">Feature Limits</p>
                                  {Object.entries(feature.limits).map(([key, defaultValue]) => (
                                    <div key={key} className="flex items-center gap-2">
                                      <Label className="text-sm capitalize">{key.replace(/_/g, ' ')}</Label>
                                      {typeof defaultValue === 'boolean' ? (
                                        <Switch
                                          checked={selectedFeature?.limits?.[key] as boolean || defaultValue}
                                          onCheckedChange={(checked) =>
                                            updateFeatureLimit(feature.id, key, checked)
                                          }
                                        />
                                      ) : (
                                        <Input
                                          type="number"
                                          className="w-24"
                                          value={selectedFeature?.limits?.[key] || defaultValue}
                                          onChange={(e) =>
                                            updateFeatureLimit(feature.id, key, parseInt(e.target.value))
                                          }
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {featureSet.features.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Features Summary</CardTitle>
                <CardDescription>
                  {featureSet.features.filter(f => f.enabled).length} of {featureSet.features.length} features enabled
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {featureSet.features.map((feature) => (
                    <div
                      key={feature.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={feature.enabled}
                          onCheckedChange={() => toggleFeature(feature.id)}
                        />
                        <span className={feature.enabled ? '' : 'text-muted-foreground line-through'}>
                          {feature.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {feature.category}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(feature.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}