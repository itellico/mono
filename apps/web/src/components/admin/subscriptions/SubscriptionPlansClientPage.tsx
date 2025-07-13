'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminListPage, type ColumnConfig } from '@/components/admin/AdminListPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus, DollarSign, Users, TrendingUp, Package } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/hooks/usePermissions';
import type { StatCardProps } from '@/components/admin/StatCard';

// Schema definitions
const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  currency: z.string().length(3).default('USD'),
  billingCycle: z.enum(['monthly', 'yearly', 'lifetime']),
  isPublic: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface SubscriptionPlan {
  uuid: string;
  name: string;
  description?: string | null;
  price: string | number;
  currency: string;
  billingCycle: string;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  features?: any[];
  _count?: {
    tenants: number;
  };
}

interface PaginatedResponse {
  success: boolean;
  data: SubscriptionPlan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AnalyticsData {
  overview: {
    totalPlans: number;
    activePlans: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
  };
  revenue: Array<{
    planName: string;
    subscriptions: number;
    monthlyRevenue: number;
  }>;
}

export function SubscriptionPlansClientPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan | null>(null);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [filters, setFilters] = React.useState({
    search: '',
    isActive: undefined as boolean | undefined,
    isPublic: undefined as boolean | undefined,
  });

  const { hasPermission } = usePermissions();

  // Fetch plans
  const { data: plansData, isLoading, error } = useQuery({
    queryKey: ['subscription-plans', page, limit, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString());

      const response = await fetch(`/api/v1/admin/subscriptions/plans?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }
      return response.json() as Promise<PaginatedResponse>;
    },
  });

  // Fetch analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['subscription-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/v1/admin/subscriptions/analytics', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      return response.json() as Promise<{ success: boolean; data: AnalyticsData }>;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/v1/admin/subscriptions/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create subscription plan');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-analytics'] });
      setOpen(false);
      toast.success('Subscription plan created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ uuid, ...data }: { uuid: string } & FormData) => {
      const response = await fetch(`/api/v1/admin/subscriptions/plans/${uuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update subscription plan');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-analytics'] });
      setOpen(false);
      setSelectedPlan(null);
      toast.success('Subscription plan updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => {
      const response = await fetch(`/api/v1/admin/subscriptions/plans/${uuid}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete subscription plan');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-analytics'] });
      toast.success('Subscription plan deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      billingCycle: 'monthly',
      isPublic: true,
      isActive: true,
    },
  });

  const onSubmit = (values: FormData) => {
    if (selectedPlan) {
      updateMutation.mutate({ uuid: selectedPlan.uuid, ...values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    form.reset({
      name: plan.name,
      description: plan.description || '',
      price: typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price,
      currency: plan.currency,
      billingCycle: plan.billingCycle as any,
      isPublic: plan.isPublic,
      isActive: plan.isActive,
    });
    setOpen(true);
  };

  const handleDelete = (uuid: string) => {
    if (confirm('Are you sure you want to delete this subscription plan?')) {
      deleteMutation.mutate(uuid);
    }
  };

  const handleCreateNew = () => {
    setSelectedPlan(null);
    form.reset();
    setOpen(true);
  };

  // Column configuration
  const columns: ColumnConfig<SubscriptionPlan>[] = [
    {
      key: 'name',
      title: 'Plan Name',
      render: (_, row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          {row.description && (
            <div className="text-sm text-muted-foreground">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'billingCycle',
      title: 'Billing',
      render: (value) => (
        <Badge variant="outline" className="capitalize">
          {value}
        </Badge>
      ),
    },
    {
      key: 'price',
      title: 'Price',
      render: (value, row) => (
        <div className="font-medium">
          {row.currency} {typeof value === 'string' ? parseFloat(value).toFixed(2) : value.toFixed(2)}
          {row.billingCycle !== 'lifetime' && (
            <span className="text-muted-foreground">/{row.billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
          )}
        </div>
      ),
    },
    {
      key: '_count',
      title: 'Subscribers',
      render: (value) => (
        <div className="text-center">
          {value?.tenants || 0}
        </div>
      ),
    },
    {
      key: 'isPublic',
      title: 'Visibility',
      render: (value) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Public' : 'Private'}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      title: 'Status',
      render: (value) => (
        <Badge variant={value ? 'success' : 'destructive'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  // Row actions
  const renderRowActions = (plan: SubscriptionPlan) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleEdit(plan)}>
          Edit Plan
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.location.href = `/admin/subscriptions/plans/${plan.uuid}/features`}
        >
          Manage Features
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => handleDelete(plan.uuid)}
          disabled={!hasPermission('subscriptions.delete.platform')}
        >
          Delete Plan
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Statistics cards
  const statsCards: StatCardProps[] = analyticsData?.data ? [
    {
      title: 'Total Plans',
      value: analyticsData.data.overview.totalPlans.toString(),
      description: `${analyticsData.data.overview.activePlans} active`,
      icon: Package,
      trend: { value: 12, isPositive: true },
    },
    {
      title: 'Active Subscriptions',
      value: analyticsData.data.overview.activeSubscriptions.toString(),
      description: `of ${analyticsData.data.overview.totalSubscriptions} total`,
      icon: Users,
      trend: { value: 8, isPositive: true },
    },
    {
      title: 'Monthly Revenue',
      value: `$${analyticsData.data.revenue.reduce((sum, r) => sum + r.monthlyRevenue, 0).toLocaleString()}`,
      description: 'Recurring revenue',
      icon: DollarSign,
      trend: { value: 15, isPositive: true },
    },
    {
      title: 'Growth Rate',
      value: '23%',
      description: 'Month over month',
      icon: TrendingUp,
      trend: { value: 23, isPositive: true },
    },
  ] : [];

  // Filter configuration
  const filterConfigs = [
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
    {
      id: 'visibility',
      label: 'Visibility',
      options: [
        { value: 'public', label: 'Public' },
        { value: 'private', label: 'Private' },
      ],
    },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}</DialogTitle>
            <DialogDescription>
              {selectedPlan
                ? 'Update the subscription plan details below.'
                : 'Create a new subscription plan for your platform.'}
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
                        <Input placeholder="Professional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billingCycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Cycle</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select billing cycle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="lifetime">Lifetime</SelectItem>
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
                        placeholder="Perfect for growing businesses..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Brief description of what this plan offers.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="99.00" {...field} />
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
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Public Plan</FormLabel>
                        <FormDescription>
                          Make this plan visible to all users
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Allow new subscriptions to this plan
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : selectedPlan
                    ? 'Update Plan'
                    : 'Create Plan'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AdminListPage<SubscriptionPlan>
        title="Subscription Plans"
        description="Manage subscription plans and pricing for your platform"
        statsCards={statsCards}
        addConfig={{
          label: 'Create Plan',
          onClick: handleCreateNew,
          icon: Plus,
          permission: { action: 'create', resource: 'subscriptions' },
        }}
        searchConfig={{
          placeholder: 'Search plans...',
          value: filters.search,
          onChange: (value) => setFilters({ ...filters, search: value }),
        }}
        filters={filterConfigs}
        columns={columns}
        data={plansData?.data || []}
        isLoading={isLoading}
        error={error?.message || null}
        renderRowActions={renderRowActions}
        pagination={{
          page,
          limit,
          total: plansData?.pagination.total || 0,
          totalPages: plansData?.pagination.totalPages || 1,
        }}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </>
  );
}