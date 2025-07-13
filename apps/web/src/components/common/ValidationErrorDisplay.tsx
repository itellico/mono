'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ValidationError {
  field: string;
  message: string;
}

interface ValidationErrorDisplayProps {
  errors: ValidationError[];
  className?: string;
  showWhenEmpty?: boolean;
  emptyMessage?: string;
  title?: string;
  variant?: 'default' | 'compact' | 'inline';
  onDismiss?: () => void;
  showFieldNames?: boolean;
}

/**
 * Reusable ValidationErrorDisplay Component
 * 
 * Displays validation errors in a clear, user-friendly format.
 * Can be used in any form across the mono platform.
 * 
 * @component
 * @example
 * <ValidationErrorDisplay 
 *   errors={validationErrors} 
 *   title="Please fix the following issues:"
 *   variant="default"
 * />
 */
export function ValidationErrorDisplay({
  errors,
  className,
  showWhenEmpty = false,
  emptyMessage = "All fields are valid",
  title = "Please fix the following issues:",
  variant = 'default',
  onDismiss,
  showFieldNames = true,
}: ValidationErrorDisplayProps) {
  
  // Don't render if no errors and not configured to show when empty
  if (errors.length === 0 && !showWhenEmpty) {
    return null;
  }

  // Success state when no errors and showWhenEmpty is true
  if (errors.length === 0 && showWhenEmpty) {
    return (
      <Alert className={cn("border-green-200 bg-green-50", className)}>
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Valid</AlertTitle>
        <AlertDescription className="text-green-700">
          {emptyMessage}
        </AlertDescription>
      </Alert>
    );
  }

  // Compact variant - just shows error count
  if (variant === 'compact') {
    return (
      <Badge variant="destructive" className={cn("gap-1", className)}>
        <AlertCircle className="h-3 w-3" />
        {errors.length} error{errors.length !== 1 ? 's' : ''}
      </Badge>
    );
  }

  // Inline variant - shows errors in a simple list
  if (variant === 'inline') {
    return (
      <div className={cn("space-y-1", className)}>
        {errors.map((error, index) => (
          <div key={index} className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>
              {showFieldNames && (
                <span className="font-medium capitalize">
                  {error.field.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
              )}{' '}
              {error.message}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Default variant - full alert with all details
  return (
    <Alert variant="destructive" className={cn(className)}>
      <AlertCircle className="h-4 w-4" />
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <AlertTitle className="flex items-center gap-2">
            {title}
            <Badge variant="secondary" className="text-xs">
              {errors.length} issue{errors.length !== 1 ? 's' : ''}
            </Badge>
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-1">
            {errors.map((error, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-xs opacity-60">•</span>
                <span>
                  {showFieldNames && (
                    <span className="font-medium capitalize">
                      {error.field.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                  )}{' '}
                  {error.message}
                </span>
              </div>
            ))}
          </AlertDescription>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </Alert>
  );
}

/**
 * Hook for managing validation errors state
 * 
 * @example
 * const { errors, addError, removeError, clearErrors, hasErrors } = useValidationErrors();
 */
export function useValidationErrors() {
  const [errors, setErrors] = React.useState<ValidationError[]>([]);

  const addError = React.useCallback((field: string, message: string) => {
    setErrors(prev => [
      ...prev.filter(error => error.field !== field),
      { field, message }
    ]);
  }, []);

  const removeError = React.useCallback((field: string) => {
    setErrors(prev => prev.filter(error => error.field !== field));
  }, []);

  const clearErrors = React.useCallback(() => {
    setErrors([]);
  }, []);

  const hasErrors = errors.length > 0;

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    hasErrors,
    setErrors
  };
} 