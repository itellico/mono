'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminListPage, type ColumnConfig } from '@/components/admin/AdminListPage';
import { Limit } from '@/lib/schemas/limit';
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
  planId: z.string().min(1, 'Plan ID is required'),
  featureId: z.string().min(1, 'Feature ID is required'),
  limit: z.coerce.number(),
});

async function fetchLimits(): Promise<Limit[]> {
  const response = await fetch('/api/v1/admin/limits');
  if (!response.ok) {
    throw new Error('Failed to fetch limits');
  }
  return response.json();
}

async function createLimit(limit: z.infer<typeof formSchema>): Promise<Limit> {
  const response = await fetch('/api/v1/admin/limits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(limit),
  });
  if (!response.ok) {
    throw new Error('Failed to create limit');
  }
  return response.json();
}

async function updateLimit({ id, ...limit }: { id: string } & z.infer<typeof formSchema>): Promise<Limit> {
  const response = await fetch(`/api/v1/admin/limits/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(limit),
  });
  if (!response.ok) {
    throw new Error('Failed to update limit');
  }
  return response.json();
}

async function deleteLimit(id: string): Promise<void> {
  const response = await fetch(`/api/v1/admin/limits/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete limit');
  }
}

export function LimitsClientPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [selectedLimit, setSelectedLimit] = React.useState<Limit | null>(null);

  const { data: limits, isLoading, error } = useQuery({
    queryKey: ['limits'],
    queryFn: fetchLimits,
  });

  const createMutation = useMutation({
    mutationFn: createLimit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['limits'] });
      setOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateLimit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['limits'] });
      setOpen(false);
      setSelectedLimit(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLimit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['limits'] });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      planId: '',
      featureId: '',
      limit: 0,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (selectedLimit) {
      updateMutation.mutate({ id: selectedLimit.id, ...values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (limit: Limit) => {
    setSelectedLimit(limit);
    form.reset(limit);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const columns: ColumnConfig<Limit>[] = [
    {
      key: 'planId',
      title: 'Plan ID',
    },
    {
      key: 'featureId',
      title: 'Feature ID',
    },
    {
      key: 'limit',
      title: 'Limit',
      render: (value) => (value === -1 ? 'Unlimited' : value),
    },
  ];

  const renderRowActions = (limit: Limit) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleEdit(limit)}>Edit</DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => handleDelete(limit.id)}
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
          <Button>Add Limit</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedLimit ? 'Edit Limit' : 'Add Limit'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="planId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="featureId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feature ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limit</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {selectedLimit ? 'Update Limit' : 'Create Limit'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <AdminListPage<Limit>
        title="Limits"
        description="Manage your feature limits"
        columns={columns}
        data={limits || []}
        loading={isLoading}
        error={error?.message || null}
        renderRowActions={renderRowActions}
      />
    </>
  );
}