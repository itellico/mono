'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createPlan, updatePlan } from '../actions';
import { type Feature, type SubscriptionPlan } from '@prisma/client';
import { useEffect, useState } from 'react';
import { MultiSelect } from '@/components/ui/multi-select';

const planSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  currency: z.string().min(1, 'Currency is required'),
  billingCycle: z.string().min(1, 'Billing cycle is required'),
  features: z.array(z.object({ featureId: z.number(), limit: z.coerce.number() }))
});

interface PlanFormProps {
  plan?: SubscriptionPlan & { features: { featureId: number; limit: number }[] };
  onClose: () => void;
}

export function PlanForm({ plan, onClose }: PlanFormProps) {
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    async function getFeatures() {
      const res = await fetch('/api/features');
      const features = await res.json();
      setFeatures(features);
    }
    getFeatures();
  }, []);

  const form = useForm<z.infer<typeof planSchema>>({
    resolver: zodResolver(planSchema),
    defaultValues: plan || {
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      billingCycle: 'monthly',
      features: []
    }
  });

  const onSubmit = async (values: z.infer<typeof planSchema>) => {
    if (plan) {
      await updatePlan(plan.id, values);
    } else {
      await createPlan(values);
    }
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Plan name" {...field} />
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
                <Textarea placeholder="Plan description" {...field} />
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
                <Input type="number" placeholder="Plan price" {...field} />
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
              <FormControl>
                <Input placeholder="USD" {...field} />
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
                    <SelectValue placeholder="Select a billing cycle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Features</FormLabel>
              <FormControl>
                <MultiSelect
                  options={features.map(feature => ({ value: feature.id, label: feature.name }))}
                  selected={field.value.map(f => f.featureId)}
                  onChange={selected => {
                    const newFeatures = selected.map(featureId => {
                      const existing = field.value.find(f => f.featureId === featureId);
                      return existing || { featureId, limit: 0 };
                    });
                    field.onChange(newFeatures);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.watch('features').map((feature, index) => (
          <FormField
            key={feature.featureId}
            control={form.control}
            name={`features.${index}.limit`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{features.find(f => f.id === feature.featureId)?.name} Limit</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Limit" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button type="submit">{plan ? 'Update' : 'Create'}</Button>
      </form>
    </Form>
  );
}
