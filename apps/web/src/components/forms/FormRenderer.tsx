'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, RotateCcw, Send, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FieldRenderer } from './FieldRenderer';
import { 
  useGenerateFormFromSchema, 
  useSubmitForm,
  useValidateFormSubmission,
  type FormDefinition, 
  type FormSubmissionData 
} from '@/lib/hooks/useFormGeneration';
import { useToast } from '@/hooks/use-toast';
import { browserLogger } from '@/lib/browser-logger';

/**
 * Helper function to safely render text that might be a translation object
 */
function safeText(text: any): string {
  if (typeof text === 'string') return text;
  if (typeof text === 'object' && text !== null) {
    // Try common language codes first
    if (text['en-US']) return text['en-US'];
    if (text['en']) return text['en'];
    if (text['default']) return text['default'];
    
    // Get first available value if none of the above
    const values = Object.values(text);
    if (values.length > 0 && typeof values[0] === 'string') {
      return values[0];
  }
  }
  
  // Fallback to empty string instead of showing [object Object]
  return '';
}

/**
 * FormRenderer Component
 * 
 * Dynamically renders forms based on model schemas with real-time validation,
 * multi-column layouts, and comprehensive error handling.
 * 
 * @component FormRenderer
 * @param {FormRendererProps} props - Component props
 * @returns {JSX.Element} Rendered form component
 * 
 * @example
 * ```tsx
 * <FormRenderer
 *   schemaId="human-profile"
 *   tenantId={1}
 *   context="create"
 *   onSubmit={handleSubmit}
 *   onChange={handleChange}
 * />
 * ```
 */

export interface FormRendererProps {
  /** Schema ID to generate form from */
  schemaId: string;
  /** Optional tenant ID for multi-tenant support */
  tenantId?: number;
  /** Form context (create, edit, search) */
  context?: 'create' | 'edit' | 'search';
  /** Initial form data */
  initialData?: Record<string, any>;
  /** Form submission handler */
  onSubmit?: (data: FormSubmissionData) => Promise<void> | void;
  /** Form data change handler */
  onChange?: (data: Record<string, any>) => void;
  /** Whether form is in loading state */
  loading?: boolean;
  /** Whether form is disabled */
  disabled?: boolean;
  /** Whether form is readonly */
  readonly?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show form validation summary */
  showValidationSummary?: boolean;
  /** Custom submit button text */
  submitButtonText?: string;
  /** Hide form actions (submit, reset) */
  hideActions?: boolean;
}

export function FormRenderer({
  schemaId,
  tenantId,
  context = 'create',
  initialData = {},
  onSubmit,
  onChange,
  loading: externalLoading = false,
  disabled = false,
  readonly = false,
  className,
  showValidationSummary = true,
  submitButtonText,
  hideActions = false
}: FormRendererProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Load form definition using hook
  const { 
    data: formDefinition, 
    isLoading, 
    error: loadError 
  } = useGenerateFormFromSchema(schemaId, tenantId, context);

  // Form submission mutation
  const submitForm = useSubmitForm();

  // Form validation mutation
  const validateForm = useValidateFormSubmission();

  // Handle field value changes
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    const newData = { ...formData, [fieldName]: value };
    setFormData(newData);
    
    // Clear field error when value changes
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
    
    // Notify parent of changes
    onChange?.(newData);
  }, [formData, errors, onChange]);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formDefinition || submitForm.isPending || externalLoading) {
      return;
    }

    try {
      browserLogger.userAction('form_submit_attempt', 'FormRenderer', { 
        schemaId, 
        dataKeys: Object.keys(formData) 
      });

      // Validate form data first
      const validationResult = await validateForm.mutateAsync({
        formId: formDefinition.id,
        data: formData,
        tenantId
      });

      if (!validationResult.isValid) {
        setErrors(validationResult.errors);
        browserLogger.userAction('form_validation_failed', 'FormRenderer', { 
          errors: validationResult.errors 
        });
        toast({
          title: 'Validation Error',
          description: 'Please correct the errors and try again.',
          variant: 'destructive'
        });
        return;
      }

      // Clear any existing errors
      setErrors({});

      // Create submission data
      const submission: FormSubmissionData = {
        formId: formDefinition.id,
        tenantId,
        data: formData,
        metadata: {
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        }
      };

      // Submit form
      if (onSubmit) {
        await onSubmit(submission);
      } else {
        // Use default submission
        await submitForm.mutateAsync({ ...submission, userId: 0 }); // Would need actual user ID
      }

      browserLogger.userAction('form_submit_success', 'FormRenderer', { 
        formId: formDefinition.id 
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit form';
      browserLogger.userAction('form_submit_error', 'FormRenderer', { 
        error: errorMessage 
      });
      toast({
        title: 'Submission Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  // Handle form reset
  const handleReset = () => {
    if (!formDefinition) return;
    
    const resetData = { ...initialData };
    formDefinition.fields.forEach((field: any) => {
      if (field.defaultValue !== undefined) {
        resetData[field.name] = field.defaultValue;
      }
    });
    
    setFormData(resetData);
    setErrors({});
    onChange?.(resetData);
    
    browserLogger.userAction('form_reset', 'FormRenderer', { schemaId });
    toast({
      title: 'Form Reset',
      description: 'Form has been reset to default values.',
      variant: 'default'
    });
  };

  // Get layout classes based on form definition
  const getLayoutClasses = () => {
    if (!formDefinition?.layout) return '';
    
    switch (formDefinition.layout) {
      case 'two-column':
        return 'grid grid-cols-1 md:grid-cols-2 gap-6';
      case 'grid':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
      default:
        return 'space-y-6';
    }
  };

  // Calculate validation summary
  const validationSummary = React.useMemo(() => {
    const errorCount = Object.keys(errors).length;
    const fieldCount = formDefinition?.fields.length || 0;
    const validCount = fieldCount - errorCount;
    
    return { errorCount, fieldCount, validCount };
  }, [errors, formDefinition]);

  // Show loading state
  if (isLoading || externalLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading form...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (loadError || !formDefinition) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-semibold mb-1">Failed to Load Form</p>
            <p className="text-sm">
              {loadError instanceof Error ? loadError.message : 'Unable to generate form from schema'}
              </p>
            {schemaId && (
              <p className="text-xs mt-2 text-muted-foreground">
                Schema ID: {schemaId}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('w-full', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{safeText(formDefinition.name)}</span>
            {showValidationSummary && (
              <div className="flex items-center space-x-2">
                {validationSummary.errorCount > 0 && (
                  <Badge variant="destructive" className="flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{validationSummary.errorCount} errors</span>
                  </Badge>
                )}
                {validationSummary.errorCount === 0 && validationSummary.fieldCount > 0 && (
                  <Badge variant="default" className="flex items-center space-x-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Valid</span>
                  </Badge>
                )}
              </div>
            )}
          </CardTitle>
          {formDefinition.description && (
            <CardDescription>{safeText(formDefinition.description)}</CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Form Fields */}
          <div className={getLayoutClasses()}>
            {formDefinition.fields.map((field: any) => (
                             <FieldRenderer
                 key={field.id}
                 field={field}
                 value={formData[field.name]}
                 onChange={(value) => handleFieldChange(field.name, value)}
                 error={errors[field.name]?.[0]}
                 disabled={disabled}
                 readonly={readonly}
               />
            ))}
          </div>

          {/* Form Actions */}
          {!hideActions && (
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={disabled || readonly || submitForm.isPending}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset</span>
              </Button>

              <Button
                type="submit"
                disabled={disabled || readonly || submitForm.isPending || validationSummary.errorCount > 0}
                className="flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>
                  {submitForm.isPending 
                    ? 'Submitting...' 
                    : submitButtonText || 'Submit'
                  }
                </span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  );
} 