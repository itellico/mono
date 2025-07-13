'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { browserLogger } from '@/lib/browser-logger';
import { TestForm, testFormSchema } from '@/types/forms/test-form.types';

/**
 * 🎯 TestFormForm - Generated React Hook Form Component
 * 
 * Form: Test Form
 * Generated: 2025-06-20T18:53:13.761Z
 * 
 * @param onSubmit - Form submission handler
 * @param defaultValues - Default form values
 * @param loading - Loading state
 * @example
 * <TestFormForm 
 *   onSubmit={(data) => console.log(data)}
 *   defaultValues={{}}
 * />
 */

interface TestFormFormProps {
  onSubmit: (data: TestForm) => void | Promise<void>;
  defaultValues?: Partial<TestForm>;
  loading?: boolean;
  className?: string;
}

export function TestFormForm({ 
  onSubmit, 
  defaultValues = {}, 
  loading = false,
  className 
}: TestFormFormProps) {
  const form = useForm<TestForm>({
    resolver: zodResolver(testFormSchema),
    defaultValues,
  });

  const handleSubmit = async (data: TestForm) => {
    try {
      browserLogger.formSubmit('Test Form', {
        formData: data,
        timestamp: new Date().toISOString(),
      });
      
      await onSubmit(data);
      
      browserLogger.userAction('form_submitted', {
        form: 'Test Form',
        success: true,
      });
    } catch (error) {
      browserLogger.error('Form submission failed', {
        form: 'Test Form',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="test1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Test Field</FormLabel>
                <FormControl>
                  <Input 
                    type="text"
                    placeholder="Enter test value"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => form.reset()}
              disabled={loading}
            >
              Reset
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default TestFormForm; 