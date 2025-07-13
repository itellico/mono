/**
 * Client-side form generation hooks
 * 
 * These hooks provide client-safe access to form generation functionality
 * by calling API endpoints instead of directly accessing the database.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Types re-exported from the service (without the service class)
export interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  description?: string;
  validation?: ValidationRule[];
  options?: FormFieldOption[];
  defaultValue?: any;
  metadata?: Record<string, any>;
}

export interface FormFieldOption {
  value: string;
  label: string;
  metadata?: Record<string, any>;
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max' | 'email' | 'phone';
  value?: any;
  message: string;
}

export interface FormDefinition {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  validation: ValidationRule[];
  layout?: 'single-column' | 'two-column' | 'grid';
  metadata?: Record<string, any>;
}

export interface FormSubmissionData {
  formId: string;
  tenantId?: number;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Hook to generate form definition from schema
 */
export function useGenerateFormFromSchema(
  schemaId: string | null,
  tenantId?: number,
  context: 'create' | 'edit' | 'search' = 'create'
) {
  return useQuery({
    queryKey: ['form-generation', 'schema', schemaId, tenantId, context],
    queryFn: async (): Promise<FormDefinition> => {
      if (!schemaId) {
        throw new Error('Schema ID is required');
      }

      const response = await fetch('/api/v1/forms/generate-from-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemaId, tenantId, context })
      });

      if (!response.ok) {
        throw new Error('Failed to generate form from schema');
      }

      return response.json();
    },
    enabled: !!schemaId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get available schemas for form generation
 */
export function useAvailableSchemas(tenantId?: number) {
  return useQuery({
    queryKey: ['form-generation', 'available-schemas', tenantId],
    queryFn: async () => {
      const url = new URL('/api/v1/forms/available-schemas', window.location.origin);
      if (tenantId) {
        url.searchParams.set('tenantId', tenantId.toString());
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch available schemas');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to validate form submission
 */
export function useValidateFormSubmission() {
  return useMutation({
    mutationFn: async ({
      formId,
      data,
      tenantId
    }: {
      formId: string;
      data: Record<string, any>;
      tenantId?: number;
    }) => {
      const response = await fetch('/api/v1/forms/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId, data, tenantId })
      });

      if (!response.ok) {
        throw new Error('Failed to validate form submission');
      }

      return response.json();
    }
  });
}

/**
 * Hook to submit form data
 */
export function useSubmitForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submission: FormSubmissionData & { userId: number }) => {
      const response = await fetch('/api/v1/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Form submitted successfully",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit form",
        variant: "destructive",
      });
    }
  });
} 