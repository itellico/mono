"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Zap, 
  Plus, 
  Edit, 
  Trash2, 
  Image, 
  MessageSquare, 
  Search,
  Camera,
  BarChart3,
  Users,
  Shield,
  Globe,
  Smartphone,
  HelpCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlatformFeature, featureTypeEnum, featureCategoryEnum } from '@/lib/subscription-schema';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface FeatureFormData {
  id?: number;
  name: string;
  featureKey: string;
  description: string;
  featureType: 'core' | 'optional' | 'add_on';
  category: 'modeling' | 'discovery' | 'communication' | 'analytics' | 'agency' | 'account';
  icon: string;
  isActive: boolean;
  sortOrder: number;
  defaultEnabled: boolean;
}

function FeaturesSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PlatformFeaturesPanel() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<PlatformFeature | null>(null);

  const initialFormData: FeatureFormData = {
    name: '',
    featureKey: '',
    description: '',
    featureType: 'optional',
    category: 'modeling',
    icon: 'Component',
    isActive: true,
    sortOrder: 0,
    defaultEnabled: false,
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: features = [], isLoading: featuresLoading } = useQuery<PlatformFeature[]>({
    queryKey: ['platform-features'],
    queryFn: async () => {
      const response = await fetch('/api/v1/admin/subscriptions/features');
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching platform features:', errorData);
        throw new Error(errorData.message || 'Failed to fetch platform features');
      }
      return response.json();
    },
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-features'] });
      setIsDialogOpen(false);
      setEditingFeature(null);
    },
    onError: (error: any) => {
      toast({
        title: "An error occurred",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const createFeatureMutation = useMutation({
    mutationFn: async (data: FeatureFormData) => {
      const response = await fetch('/api/v1/admin/subscriptions/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to create feature');
      return response.json();
    },
    ...mutationOptions,
    onSuccess: () => {
      mutationOptions.onSuccess();
      toast({ title: "Success", description: "Platform feature created." });
    }
  });

  const updateFeatureMutation = useMutation({
    mutationFn: async (data: FeatureFormData) => {
      const response = await fetch(`/api/v1/admin/subscriptions/features/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to update feature');
      return response.json();
    },
    ...mutationOptions,
    onSuccess: () => {
        mutationOptions.onSuccess();
        toast({ title: "Success", description: "Platform feature updated." });
    }
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/v1/admin/subscriptions/features/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Failed to delete feature');
      return response.json();
    },
    ...mutationOptions,
    onSuccess: () => {
        mutationOptions.onSuccess();
        toast({ title: "Success", description: "Platform feature deleted." });
    }
  });

  const handleOpenDialog = (feature: PlatformFeature | null = null) => {
    if (feature) {
      setEditingFeature(feature);
    } else {
      setEditingFeature(null);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (formData: FeatureFormData) => {
    if (editingFeature) {
      updateFeatureMutation.mutate({ ...formData, id: editingFeature.id });
    } else {
      createFeatureMutation.mutate(formData);
    }
  };

  if (featuresLoading) return <FeaturesSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Features</h2>
          <p className="text-muted-foreground">Manage core and optional features available in subscription plans.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Feature
        </Button>
      </div>

      {features.length > 0 ? (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-2">
                {features.sort((a,b) => a.sortOrder - b.sortOrder).map(feature => (
                    <div key={feature.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                        <p className="font-semibold">{feature.name} <span className="text-sm font-normal text-muted-foreground">({feature.featureKey})</span></p>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(feature)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteFeatureMutation.mutate(feature.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    </div>
                ))}
                </div>
            </CardContent>
        </Card>
      ) : (
          <Card>
            <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">No features defined yet. Click &quot;Add Feature&quot; to create one.</div>
            </CardContent>
          </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>{editingFeature ? 'Edit Platform Feature' : 'Create New Platform Feature'}</DialogTitle>
                <DialogDescription>Fill in the details for the platform feature below.</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data: FeatureFormData = {
                    name: formData.get('name') as string,
                    featureKey: formData.get('featureKey') as string,
                    description: formData.get('description') as string,
                    featureType: formData.get('featureType') as 'core' | 'optional' | 'add_on',
                    category: formData.get('category') as 'modeling' | 'discovery' | 'communication' | 'analytics' | 'agency' | 'account',
                    icon: formData.get('icon') as string,
                    sortOrder: Number(formData.get('sortOrder')),
                    isActive: formData.get('isActive') === 'on',
                    defaultEnabled: formData.get('defaultEnabled') === 'on',
                };
                handleSubmit(data);
            }} className="grid grid-cols-2 gap-x-4 gap-y-6 py-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="name">Feature Name</Label>
                    <Input id="name" name="name" defaultValue={editingFeature?.name} placeholder="e.g., Advanced Analytics" required />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="featureKey">Feature Key</Label>
                    <Input id="featureKey" name="featureKey" defaultValue={editingFeature?.featureKey} placeholder="e.g., advanced_analytics" required />
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" defaultValue={editingFeature?.description} placeholder="Describe what this feature provides" />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="featureType">Feature Type</Label>
                    <Select name="featureType" defaultValue={editingFeature?.featureType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {featureTypeEnum.enumValues.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" defaultValue={editingFeature?.category}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {featureCategoryEnum.enumValues.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="icon">Icon</Label>
                    <Input id="icon" name="icon" defaultValue={editingFeature?.icon || 'Component'} placeholder="e.g., BarChart2" />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="sortOrder">Sort Order</Label>
                    <Input id="sortOrder" name="sortOrder" type="number" defaultValue={editingFeature?.sortOrder} />
                </div>
                <div className="flex items-center space-x-2 pt-4">
                    <Switch id="isActive" name="isActive" defaultChecked={editingFeature?.isActive ?? true} />
                    <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex items-center space-x-2 pt-4">
                    <Switch id="defaultEnabled" name="defaultEnabled" defaultChecked={editingFeature?.defaultEnabled ?? false} />
                    <Label htmlFor="defaultEnabled">Enabled by Default</Label>
                      <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>If checked, this feature will be enabled for all new tenants.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <DialogFooter className="col-span-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createFeatureMutation.isPending || updateFeatureMutation.isPending}>
                        {editingFeature ? 'Save Changes' : 'Create Feature'}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 