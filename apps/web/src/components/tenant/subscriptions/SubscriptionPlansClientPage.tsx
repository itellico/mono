'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  DollarSign,
  Star,
  Check,
  Crown,
  Zap,
  Shield,
  TrendingUp,
  Calendar,
  Tag,
  MoreHorizontal,
  Copy,
  Eye,
  BarChart3
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: 'monthly' | 'yearly' | 'one-time';
  trialDays: number;
  isActive: boolean;
  isFeatured: boolean;
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  features: string[];
  limits: {
    users: number;
    storage: number; // GB
    apiCalls: number;
    customFields: number;
    [key: string]: any;
  };
  customizations: {
    buttonColor: string;
    showPricing: boolean;
    allowDowngrade: boolean;
    requirePaymentMethod: boolean;
  };
  statistics: {
    subscribers: number;
    revenue: number;
    conversionRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

const planFormSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  currency: z.string().default('USD'),
  billingInterval: z.enum(['monthly', 'yearly', 'one-time']),
  trialDays: z.number().min(0).default(0),
  tier: z.enum(['free', 'basic', 'pro', 'enterprise']),
  features: z.array(z.string()).default([]),
  maxUsers: z.number().min(1).default(10),
  maxStorage: z.number().min(1).default(5),
  maxApiCalls: z.number().min(100).default(1000),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

type PlanFormData = z.infer<typeof planFormSchema>;

// Mock data
const mockPlans: SubscriptionPlan[] = [
  {
    id: '1',
    name: 'Starter',
    description: 'Perfect for individuals getting started',
    price: 0,
    currency: 'USD',
    billingInterval: 'monthly',
    trialDays: 0,
    isActive: true,
    isFeatured: false,
    tier: 'free',
    features: ['5 projects', 'Basic support', '1GB storage'],
    limits: {
      users: 1,
      storage: 1,
      apiCalls: 100,
      customFields: 5,
    },
    customizations: {
      buttonColor: '#6366F1',
      showPricing: true,
      allowDowngrade: true,
      requirePaymentMethod: false,
    },
    statistics: {
      subscribers: 156,
      revenue: 0,
      conversionRate: 12.5,
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    name: 'Professional',
    description: 'For growing businesses and teams',
    price: 29,
    currency: 'USD',
    billingInterval: 'monthly',
    trialDays: 14,
    isActive: true,
    isFeatured: true,
    tier: 'pro',
    features: ['Unlimited projects', 'Priority support', '50GB storage', 'Advanced analytics'],
    limits: {
      users: 10,
      storage: 50,
      apiCalls: 10000,
      customFields: 50,
    },
    customizations: {
      buttonColor: '#8B5CF6',
      showPricing: true,
      allowDowngrade: true,
      requirePaymentMethod: true,
    },
    statistics: {
      subscribers: 89,
      revenue: 2581,
      conversionRate: 8.2,
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '3',
    name: 'Enterprise',
    description: 'For large organizations with advanced needs',
    price: 99,
    currency: 'USD',
    billingInterval: 'monthly',
    trialDays: 30,
    isActive: true,
    isFeatured: false,
    tier: 'enterprise',
    features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'SSO'],
    limits: {
      users: 100,
      storage: 500,
      apiCalls: 100000,
      customFields: 100,
    },
    customizations: {
      buttonColor: '#F59E0B',
      showPricing: true,
      allowDowngrade: false,
      requirePaymentMethod: true,
    },
    statistics: {
      subscribers: 23,
      revenue: 2277,
      conversionRate: 15.8,
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
];

// API Functions
async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockPlans), 500);
  });
}

async function createSubscriptionPlan(plan: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      ...plan,
      id: Date.now().toString(),
      statistics: { subscribers: 0, revenue: 0, conversionRate: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as SubscriptionPlan), 500);
  });
}

async function updateSubscriptionPlan(id: string, plan: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      ...mockPlans.find(p => p.id === id),
      ...plan,
      updatedAt: new Date().toISOString(),
    } as SubscriptionPlan), 500);
  });
}

async function deleteSubscriptionPlan(id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 500);
  });
}

function getTierIcon(tier: string) {
  switch (tier) {
    case 'free': return <Tag className="h-4 w-4 text-gray-500" />;
    case 'basic': return <Zap className="h-4 w-4 text-blue-500" />;
    case 'pro': return <Star className="h-4 w-4 text-purple-500" />;
    case 'enterprise': return <Crown className="h-4 w-4 text-yellow-500" />;
    default: return <Tag className="h-4 w-4" />;
  }
}

function formatPrice(price: number, currency: string, interval: string) {
  if (price === 0) return 'Free';
  
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(price);
  
  if (interval === 'one-time') return formatted;
  return `${formatted}/${interval === 'yearly' ? 'year' : 'month'}`;
}

export function SubscriptionPlansClientPage() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      billingInterval: 'monthly',
      trialDays: 0,
      tier: 'basic',
      features: [],
      maxUsers: 10,
      maxStorage: 5,
      maxApiCalls: 1000,
      isActive: true,
      isFeatured: false,
    },
  });

  // Queries
  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: fetchSubscriptionPlans,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createSubscriptionPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setCreateDialogOpen(false);
      form.reset();
      toast.success('Plan created successfully');
    },
    onError: () => {
      toast.error('Failed to create plan');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: Partial<SubscriptionPlan> }) =>
      updateSubscriptionPlan(id, plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setEditingPlan(null);
      form.reset();
      toast.success('Plan updated successfully');
    },
    onError: () => {
      toast.error('Failed to update plan');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubscriptionPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plan deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete plan');
    },
  });

  const onSubmit = (data: PlanFormData) => {
    const planData = {
      name: data.name,
      description: data.description || '',
      price: data.price,
      currency: data.currency,
      billingInterval: data.billingInterval,
      trialDays: data.trialDays,
      tier: data.tier,
      features: data.features,
      limits: {
        users: data.maxUsers,
        storage: data.maxStorage,
        apiCalls: data.maxApiCalls,
        customFields: 10,
      },
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      customizations: {
        buttonColor: '#6366F1',
        showPricing: true,
        allowDowngrade: true,
        requirePaymentMethod: data.price > 0,
      },
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, plan: planData });
    } else {
      createMutation.mutate(planData);
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    form.reset({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      billingInterval: plan.billingInterval,
      trialDays: plan.trialDays,
      tier: plan.tier,
      features: plan.features,
      maxUsers: plan.limits.users,
      maxStorage: plan.limits.storage,
      maxApiCalls: plan.limits.apiCalls,
      isActive: plan.isActive,
      isFeatured: plan.isFeatured,
    });
    setCreateDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const totalRevenue = plans?.reduce((sum, plan) => sum + plan.statistics.revenue, 0) || 0;
  const totalSubscribers = plans?.reduce((sum, plan) => sum + plan.statistics.subscribers, 0) || 0;
  const avgConversionRate = plans?.reduce((sum, plan) => sum + plan.statistics.conversionRate, 0) / (plans?.length || 1) || 0;

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-muted-foreground">
            Create and manage subscription plans for your customers
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingPlan(null); form.reset(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Edit Plan' : 'Create Subscription Plan'}
              </DialogTitle>
              <DialogDescription>
                Configure your subscription plan details and pricing
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Professional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tier</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this plan includes..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="billingInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                            <SelectItem value="one-time">One-time</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="trialDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trial Days</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of free trial days (0 for no trial)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Plan Limits</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="maxUsers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Users</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxStorage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Storage (GB)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxApiCalls"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Calls/month</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="100"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 100)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center space-x-6">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Active</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Featured</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubscribers}</div>
            <p className="text-xs text-muted-foreground">
              +8 new this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans?.filter(p => p.isActive).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {plans?.length || 0} total plans
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgConversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all plans
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {plans && plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className={`relative ${plan.isFeatured ? 'ring-2 ring-primary' : ''}`}>
                  {plan.isFeatured && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTierIcon(plan.tier)}
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                      </div>
                      <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {formatPrice(plan.price, plan.currency, plan.billingInterval)}
                      </div>
                      {plan.trialDays > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {plan.trialDays} day free trial
                        </p>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Features</h4>
                      <ul className="space-y-1">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <Check className="h-3 w-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                        {plan.features.length > 3 && (
                          <li className="text-sm text-muted-foreground">
                            +{plan.features.length - 3} more features
                          </li>
                        )}
                      </ul>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium">{plan.statistics.subscribers}</div>
                        <div className="text-muted-foreground">Subscribers</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">${plan.statistics.revenue}</div>
                        <div className="text-muted-foreground">Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{plan.statistics.conversionRate}%</div>
                        <div className="text-muted-foreground">Conversion</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleEdit(plan)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(plan.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDelete(plan.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No subscription plans"
              description="Create your first subscription plan to start monetizing your marketplace"
              action={
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plan
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan Performance</CardTitle>
              <CardDescription>
                Analytics and metrics for your subscription plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <BarChart3 className="h-4 w-4" />
                <AlertDescription>
                  Detailed analytics charts and reports would be implemented here, 
                  including revenue trends, subscriber growth, churn rates, and conversion funnels.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Settings</CardTitle>
              <CardDescription>
                Configure global subscription settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Plan Downgrades</Label>
                    <p className="text-sm text-muted-foreground">
                      Let customers downgrade to lower-tier plans
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Prorate Billing Changes</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically calculate prorated amounts
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Trial Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send trial expiration reminders
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Payment Retry Logic</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically retry failed payments
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Plan ID copied to clipboard');
  }
}