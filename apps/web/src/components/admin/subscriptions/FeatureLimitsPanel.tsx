"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Settings2, 
  Plus, 
  Edit, 
  Trash2, 
  HelpCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlatformFeature, FeatureLimit, limitTypeEnum, limitUnitEnum } from '@/lib/subscription-schema';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Mock Data (will be replaced by API calls)
const mockPlatformFeatures: PlatformFeature[] = [
  { id: 1, featureKey: 'model_portfolio', name: 'Model Portfolio', description: '', featureType: 'core', category: 'modeling', icon: 'Image', isActive: true, sortOrder: 1, defaultEnabled: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, featureKey: 'global_search', name: 'Global Search', description: '', featureType: 'core', category: 'discovery', icon: 'Search', isActive: true, sortOrder: 2, defaultEnabled: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, featureKey: 'messaging_system', name: 'Messaging & Chat', description: '', featureType: 'core', category: 'communication', icon: 'MessageSquare', isActive: true, sortOrder: 3, defaultEnabled: false, createdAt: new Date(), updatedAt: new Date() },
];

const mockFeatureLimits: FeatureLimit[] = [
    { id: 1, featureId: 1, limitKey: 'max_photos', name: 'Maximum Photos', description: 'Total number of photos allowed in a portfolio.', limitType: 'count', limitUnit: 'count', defaultValue: '50', minValue: '10', maxValue: '1000', isRequired: true, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
    { id: 2, featureId: 1, limitKey: 'storage_gb', name: 'Storage Space (GB)', description: 'Total storage space for media uploads.', limitType: 'storage', limitUnit: 'gb', defaultValue: '5', minValue: '1', maxValue: '100', isRequired: true, sortOrder: 2, createdAt: new Date(), updatedAt: new Date() },
    { id: 3, featureId: 2, limitKey: 'searches_per_day', name: 'Daily Searches', description: 'Number of searches a user can perform per day.', limitType: 'count', limitUnit: 'requests_per_day', defaultValue: '100', minValue: '20', maxValue: '5000', isRequired: true, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
];

interface LimitFormData {
  featureId: number;
  limitKey: string;
  name: string;
  description: string;
  limitType: 'count' | 'storage' | 'bandwidth' | 'boolean' | 'percentage';
  limitUnit: 'count' | 'bytes' | 'mb' | 'gb' | 'tb' | 'percent' | 'requests_per_hour' | 'requests_per_day' | 'requests_per_month';
  defaultValue: string;
  minValue?: string;
  maxValue?: string;
  isRequired: boolean;
  sortOrder: number;
}

function LimitsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FeatureLimitsPanel() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<FeatureLimit | null>(null);

  const initialFormData: LimitFormData = {
    featureId: 0,
    limitKey: '',
    name: '',
    description: '',
    limitType: 'count',
    limitUnit: 'count',
    defaultValue: '',
    minValue: '',
    maxValue: '',
    isRequired: true,
    sortOrder: 0
  };
  const [formData, setFormData] = useState<LimitFormData>(initialFormData);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch platform features for the dropdown
  const { data: features = [], isLoading: featuresLoading } = useQuery<PlatformFeature[]>({
    queryKey: ['platform-features'],
    queryFn: async () => {
      const response = await fetch('/api/v1/admin/subscriptions/features');
      if (!response.ok) throw new Error('Failed to fetch platform features');
      return response.json();
    },
  });

  // Fetch feature limits
  const { data: limits = [], isLoading: limitsLoading } = useQuery<FeatureLimit[]>({
    queryKey: ['feature-limits'],
    queryFn: async () => {
        const response = await fetch('/api/v1/admin/subscriptions/limits');
        if (!response.ok) throw new Error('Failed to fetch feature limits');
        return response.json();
    },
  });

  const isLoading = featuresLoading || limitsLoading;

  // Group limits by feature
  const groupedLimits = limits.reduce((acc, limit) => {
    const featureName = features.find(f => f.id === limit.featureId)?.name || 'Unknown Feature';
    if (!acc[featureName]) {
      acc[featureName] = [];
    }
    acc[featureName].push(limit);
    return acc;
  }, {} as Record<string, FeatureLimit[]>);

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-limits'] });
      setIsDialogOpen(false);
      setEditingLimit(null);
      setFormData(initialFormData);
    },
    onError: (error: any) => {
      toast({
        title: "An error occurred",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const createLimitMutation = useMutation({
    mutationFn: async (data: LimitFormData) => {
      toast({ title: "Creating Limit...", description: "Please wait." });
      const response = await fetch('/api/v1/admin/subscriptions/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create limit');
      return response.json();
    },
    ...mutationOptions,
    onSuccess: (...args) => {
      mutationOptions.onSuccess();
      toast({ title: "Success", description: "Feature limit created." });
    }
  });

  const updateLimitMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LimitFormData> }) => {
      toast({ title: "Updating Limit...", description: "Please wait." });
      const response = await fetch(`/api/v1/admin/subscriptions/limits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update limit');
      return response.json();
    },
    ...mutationOptions,
    onSuccess: (...args) => {
        mutationOptions.onSuccess();
        toast({ title: "Success", description: "Feature limit updated." });
    }
  });

  const deleteLimitMutation = useMutation({
    mutationFn: async (id: number) => {
      toast({ title: "Deleting Limit...", description: "Please wait." });
      const response = await fetch(`/api/v1/admin/subscriptions/limits/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete limit');
      return response.json();
    },
    ...mutationOptions,
    onSuccess: (...args) => {
        mutationOptions.onSuccess();
        toast({ title: "Success", description: "Feature limit deleted." });
    }
  });

  const handleOpenDialog = (limit: FeatureLimit | null = null) => {
    if (limit) {
      setEditingLimit(limit);
      setFormData({
          featureId: limit.featureId,
          limitKey: limit.limitKey,
          name: limit.name,
          description: limit.description,
          limitType: limit.limitType,
          limitUnit: limit.limitUnit,
          defaultValue: limit.defaultValue || '',
          minValue: limit.minValue || '',
          maxValue: limit.maxValue || '',
          isRequired: limit.isRequired,
          sortOrder: limit.sortOrder,
      });
    } else {
      setEditingLimit(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLimit) {
      updateLimitMutation.mutate({ id: editingLimit.id, data: formData });
    } else {
      createLimitMutation.mutate(formData);
    }
  };

  if (isLoading) return <LimitsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feature Limits</h2>
          <p className="text-muted-foreground">Define and manage all feature-specific limits for your platform.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Limit
        </Button>
      </div>

      {Object.keys(groupedLimits).length > 0 ? Object.entries(groupedLimits).map(([featureName, limits]) => (
        <Card key={featureName}>
          <CardHeader>
            <CardTitle>{featureName}</CardTitle>
            <CardDescription>{limits.length} limit(s) defined for this feature.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {limits.sort((a,b) => a.sortOrder - b.sortOrder).map(limit => (
                <div key={limit.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-semibold">{limit.name} <span className="text-sm font-normal text-muted-foreground">({limit.limitKey})</span></p>
                    <p className="text-sm text-muted-foreground">{limit.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Default: {limit.defaultValue} {limit.limitUnit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(limit)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteLimitMutation.mutate(limit.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )) : (
          <Card>
            <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">No limits defined yet. Click &quot;Add Limit&quot; to create one.</div>
            </CardContent>
          </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLimit ? 'Edit Feature Limit' : 'Create New Feature Limit'}</DialogTitle>
            <DialogDescription>Fill in the details for the feature limit below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-6 py-4">
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="featureId">Platform Feature</Label>
                <Select value={String(formData.featureId)} onValueChange={(val) => setFormData(f => ({...f, featureId: Number(val)}))} required>
                  <SelectTrigger><SelectValue placeholder="Select a feature..." /></SelectTrigger>
                  <SelectContent>
                    {features.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Limit Name</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData(f => ({...f, name: e.target.value}))} placeholder="e.g., Maximum Photos" required/>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="limitKey">Limit Key</Label>
                <Input id="limitKey" value={formData.limitKey} onChange={e => setFormData(f => ({...f, limitKey: e.target.value}))} placeholder="e.g., max_photos" required/>
              </div>

              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={e => setFormData(f => ({...f, description: e.target.value}))} placeholder="Describe what this limit controls"/>
              </div>

              <div className="flex flex-col gap-2">
                  <Label htmlFor="limitType">Limit Type</Label>
                  <Select value={formData.limitType} onValueChange={(v: any) => setFormData(f => ({...f, limitType: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {limitTypeEnum.enumValues.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
              </div>

              <div className="flex flex-col gap-2">
                  <Label htmlFor="limitUnit">Limit Unit</Label>
                  <Select value={formData.limitUnit} onValueChange={(v: any) => setFormData(f => ({...f, limitUnit: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {limitUnitEnum.enumValues.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="defaultValue">Default Value</Label>
                <Input id="defaultValue" value={formData.defaultValue} onChange={e => setFormData(f => ({...f, defaultValue: e.target.value}))} placeholder="e.g., 50" required/>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input id="sortOrder" type="number" value={formData.sortOrder} onChange={e => setFormData(f => ({...f, sortOrder: Number(e.target.value)}))}/>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                  <Switch id="isRequired" checked={formData.isRequired} onCheckedChange={c => setFormData(f => ({...f, isRequired: c}))}/>
                  <Label htmlFor="isRequired">Required</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>If checked, this limit must be defined in all subscription plans.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
              </div>

            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createLimitMutation.isPending || updateLimitMutation.isPending}>
                {editingLimit ? 'Save Changes' : 'Create Limit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 