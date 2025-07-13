'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminListPage, type ColumnConfig } from '@/components/admin/AdminListPage';
import { Feature } from '@/lib/schemas/feature';
import { Checkbox } from '@/components/ui/checkbox';
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

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  isEnabled: z.boolean(),
});

async function fetchFeatures(): Promise<Feature[]> {
  const response = await fetch('/api/v1/admin/features');
  if (!response.ok) {
    throw new Error('Failed to fetch features');
  }
  return response.json();
}

async function createFeature(feature: z.infer<typeof formSchema>): Promise<Feature> {
  const response = await fetch('/api/v1/admin/features', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(feature),
  });
  if (!response.ok) {
    throw new Error('Failed to create feature');
  }
  return response.json();
}

async function updateFeature({ id, ...feature }: { id: string } & z.infer<typeof formSchema>): Promise<Feature> {
  const response = await fetch(`/api/v1/admin/features/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(feature),
  });
  if (!response.ok) {
    throw new Error('Failed to update feature');
  }
  return response.json();
}

async function deleteFeature(id: string): Promise<void> {
  const response = await fetch(`/api/v1/admin/features/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete feature');
  }
}

export function FeaturesClientPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [selectedFeature, setSelectedFeature] = React.useState<Feature | null>(null);

  const { data: features, isLoading, error } = useQuery({
    queryKey: ['features'],
    queryFn: fetchFeatures,
  });

  const createMutation = useMutation({
    mutationFn: createFeature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      setOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateFeature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      setOpen(false);
      setSelectedFeature(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFeature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      isEnabled: true,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (selectedFeature) {
      updateMutation.mutate({ id: selectedFeature.id, ...values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (feature: Feature) => {
    setSelectedFeature(feature);
    form.reset(feature);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const columns: ColumnConfig<Feature>[] = [
    {
      key: 'name',
      title: 'Feature Name',
    },
    {
      key: 'description',
      title: 'Description',
    },
    {
      key: 'isEnabled',
      title: 'Enabled',
      render: (value) => <Checkbox checked={value} disabled />,
    },
  ];

  const renderRowActions = (feature: Feature) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleEdit(feature)}>Edit</DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => handleDelete(feature.id)}
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
          <Button>Add Feature</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedFeature ? 'Edit Feature' : 'Add Feature'}</DialogTitle>
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
                name="isEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Enabled
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {selectedFeature ? 'Update Feature' : 'Create Feature'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <AdminListPage<Feature>
        title="Features"
        description="Manage your platform features"
        columns={columns}
        data={features || []}
        loading={isLoading}
        error={error?.message || null}
        renderRowActions={renderRowActions}
      />
    </>
  );
}