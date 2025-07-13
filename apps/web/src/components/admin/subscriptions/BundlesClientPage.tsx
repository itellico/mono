'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminListPage, type ColumnConfig } from '@/components/admin/AdminListPage';
import { Bundle } from '@/lib/schemas/bundle';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Checkbox } from '@/components/ui/checkbox';
import { Feature } from '@/lib/schemas/feature';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  featureIds: z.array(z.string()),
});

async function fetchBundles(): Promise<Bundle[]> {
  const response = await fetch('/api/v1/admin/bundles');
  if (!response.ok) {
    throw new Error('Failed to fetch bundles');
  }
  return response.json();
}

async function fetchFeatures(): Promise<Feature[]> {
  const response = await fetch('/api/v1/admin/features');
  if (!response.ok) {
    throw new Error('Failed to fetch features');
  }
  return response.json();
}

async function createBundle(bundle: z.infer<typeof formSchema>): Promise<Bundle> {
  const response = await fetch('/api/v1/admin/bundles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bundle),
  });
  if (!response.ok) {
    throw new Error('Failed to create bundle');
  }
  return response.json();
}

async function updateBundle({ id, ...bundle }: { id: string } & z.infer<typeof formSchema>): Promise<Bundle> {
  const response = await fetch(`/api/v1/admin/bundles/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bundle),
  });
  if (!response.ok) {
    throw new Error('Failed to update bundle');
  }
  return response.json();
}

async function deleteBundle(id: string): Promise<void> {
  const response = await fetch(`/api/v1/admin/bundles/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete bundle');
  }
}

export function BundlesClientPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [selectedBundle, setSelectedBundle] = React.useState<Bundle | null>(null);

  const { data: bundles, isLoading: isLoadingBundles, error: errorBundles } = useQuery({
    queryKey: ['bundles'],
    queryFn: fetchBundles,
  });

  const { data: features, isLoading: isLoadingFeatures, error: errorFeatures } = useQuery({
    queryKey: ['features'],
    queryFn: fetchFeatures,
  });

  const createMutation = useMutation({
    mutationFn: createBundle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
      setOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateBundle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
      setOpen(false);
      setSelectedBundle(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBundle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      featureIds: [],
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (selectedBundle) {
      updateMutation.mutate({ id: selectedBundle.id, ...values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (bundle: Bundle) => {
    setSelectedBundle(bundle);
    form.reset(bundle);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const columns: ColumnConfig<Bundle>[] = [
    {
      key: 'name',
      title: 'Bundle Name',
    },
    {
      key: 'description',
      title: 'Description',
    },
    {
      key: 'price',
      title: 'Price',
      render: (value) => `$${value}`,
    },
  ];

  const renderRowActions = (bundle: Bundle) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleEdit(bundle)}>Edit</DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => handleDelete(bundle.id)}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Add Bundle</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedBundle ? 'Edit Bundle' : 'Add Bundle'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="featureIds"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Features</FormLabel>
                    </div>
                    {features?.map((feature) => (
                      <FormField
                        key={feature.id}
                        control={form.control}
                        name="featureIds"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={feature.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(feature.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, feature.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== feature.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {feature.name}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {selectedBundle ? 'Update Bundle' : 'Create Bundle'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <AdminListPage<Bundle>
        title="Bundles"
        description="Manage your subscription bundles"
        columns={columns}
        data={bundles || []}
        loading={isLoadingBundles || isLoadingFeatures}
        error={errorBundles?.message || errorFeatures?.message || null}
        renderRowActions={renderRowActions}
      />
    </>
  );
}