/**
 * Save Search Dialog Component
 * 
 * Allows users to save their current filter state as a named search
 * following mono platform UI patterns with ShadCN components.
 */

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { browserLogger } from '@/lib/browser-logger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Input,
} from '@/components/ui/input';
import {
  Textarea,
} from '@/components/ui/textarea';
import {
  Button,
} from '@/components/ui/button';
import {
  Switch,
} from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Save,
  Shield,
  Building,
  User,
} from 'lucide-react';

// ============================================================================
// SCHEMA & TYPES
// ============================================================================

const saveSearchSchema = z.object({
  name: z.string()
    .min(1, 'Search name is required')
    .max(100, 'Search name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_()]+$/, 'Search name contains invalid characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  scope: z.enum(['user', 'TENANT', 'SYSTEM']).default('user'),
  canOverride: z.boolean().default(true),
  isTemplate: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  isPublic: z.boolean().default(false),
});

type SaveSearchForm = z.infer<typeof saveSearchSchema>;

interface SaveSearchDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Function to call when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** The entity type being searched (e.g., 'tenants', 'users') */
  entityType: string;
  /** Current filter state to save */
  currentFilters: Record<string, unknown>;
  /** Current sort configuration */
  currentSort?: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  /** Current search value */
  currentSearch?: string;
  /** Current column visibility configuration */
  currentColumnConfig?: Record<string, boolean>;
  /** Current pagination configuration */
  currentPagination?: {
    limit: number;
  };
  /** Parent search ID for creating overrides */
  parentSearchId?: number;
  /** Whether this is an override creation */
  isOverride?: boolean;
  /** Parent search name for context */
  parentSearchName?: string;
  /** User's role for determining available scopes */
  userRole?: 'super_admin' | 'tenant_admin' | 'user';
  /** Callback when search is successfully saved */
  onSaved?: (savedSearch: unknown) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * SaveSearchDialog Component
 * 
 * ✅ mono BEST PRACTICES:
 * - Uses central browserLogger for client-side logging
 * - TanStack Query integration with proper cache invalidation
 * - Comprehensive form validation with Zod
 * - Proper error handling and user feedback
 * - Account-level sharing (isPublic) vs user-level (private)
 * 
 * @component
 * @example
 * <SaveSearchDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   entityType="tenants"
 *   currentFilters={filters}
 *   currentSort={sortConfig}
 *   currentColumnConfig={columnVisibility}
 *   onSaved={(search) => console.log('Saved:', search)}
 * />
 */
export function SaveSearchDialog(props: SaveSearchDialogProps) {
  const {
    open,
    onOpenChange,
    entityType,
    currentFilters,
    currentSort,
    currentSearch,
    currentColumnConfig,
    currentPagination,
    parentSearchId,
    isOverride,
    parentSearchName,
    userRole = 'user',
    onSaved
  } = props;
  const [isLoading, setIsLoading] = React.useState(false);
  const queryClient = useQueryClient();

  const form = useForm<SaveSearchForm>({
    resolver: zodResolver(saveSearchSchema),
    defaultValues: {
      name: props.isOverride && props.parentSearchName ? `${props.parentSearchName} (Custom)` : '',
      description: '',
      scope: 'user',
      canOverride: true,
      isTemplate: false,
      isDefault: false,
      isPublic: false,
    },
  });

  const saveSearchMutation = useMutation({
    mutationFn: async (data: SaveSearchForm) => {
      browserLogger.userAction('saved_search_creation_started', `Starting save for ${entityType} search: ${data.name}`);
      
      // Determine API endpoint based on whether this is an override
      const isOverrideCreation = props.isOverride && props.parentSearchId;
      const endpoint = isOverrideCreation 
        ? `/api/v1/saved-searches/${props.parentSearchId}/override`
        : '/api/v1/saved-searches';
      
      const payload = isOverrideCreation 
        ? {
            modifications: {
              name: data.name,
              description: data.description || null,
              filters: currentFilters,
              sortBy: currentSort?.sortBy || null,
              sortOrder: currentSort?.sortOrder || null,
              columnConfig: currentColumnConfig || null,
              searchValue: currentSearch || null,
              paginationLimit: currentPagination?.limit || null,
              isDefault: data.isDefault,
              isPublic: data.isPublic,
            }
          }
        : {
            name: data.name,
            description: data.description || null,
            entityType,
            scope: data.scope,
            canOverride: data.canOverride,
            isTemplate: data.isTemplate,
            filters: currentFilters,
            sortBy: currentSort?.sortBy || null,
            sortOrder: currentSort?.sortOrder || null,
            columnConfig: currentColumnConfig || null,
            searchValue: currentSearch || null,
            paginationLimit: currentPagination?.limit || null,
            isDefault: data.isDefault,
            isPublic: data.isPublic,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to save search');
      }

      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['saved-searches', entityType]
      });
      queryClient.invalidateQueries({
        queryKey: ['saved-searches']
      });

      toast.success('Search saved successfully!', {
        description: `"${form.getValues('name')}" has been saved.`
      });

      const actionType = isOverrideCreation ? 'saved_search_override_created' : 'saved_search_created';
      browserLogger.userAction(actionType, `${isOverrideCreation ? 'Overrode' : 'Created'} ${entityType} search: ${form.getValues('name')} (scope: ${form.getValues('scope')}, default: ${form.getValues('isDefault')}, public: ${form.getValues('isPublic')})`);

      form.reset();
      onOpenChange(false);

      onSaved?.(result.data);
    },
    onError: (error) => {
      toast.error('Failed to save search', {
        description: error.message
      });

      browserLogger.error('saved_search_creation_failed', `Failed to save ${entityType} search: ${error.message}`);
    },
  });

  const handleSubmit = async (data: SaveSearchForm) => {
    setIsLoading(true);
    try {
      await saveSearchMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const hasFilters = Object.keys(currentFilters).length > 0 || currentSearch;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Current Search
          </DialogTitle>
          <DialogDescription>
            Save your current filters and sorting as a named search that you can reuse later.
          </DialogDescription>
        </DialogHeader>

        {!hasFilters && (
          <div className="rounded-md bg-amber-50 p-4">
            <div className="flex">
              <div className="text-sm text-amber-700">
                <p className="font-medium">No filters applied</p>
                <p>Apply some filters first, then save your search.</p>
              </div>
            </div>
          </div>
        )}

        {hasFilters && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Search Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Active USD Tenants"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Give your search a descriptive name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this search is used for..."
                        {...field}
                        disabled={isLoading}
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Set as Default</FormLabel>
                        <FormDescription>
                          Load this search automatically when viewing {entityType}.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Share with Account</FormLabel>
                        <FormDescription>
                          Allow other users in your account to use this search.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="min-w-[100px]"
                >
                  {isLoading ? 'Saving...' : 'Save Search'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {!hasFilters && (
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
} 