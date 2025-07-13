'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Edit, Loader2, AlertTriangle } from 'lucide-react';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { LockStatus } from '@/components/audit/LockStatus';
import type { ModelSchema } from '@/lib/schemas/model-schemas';

/**
 * Edit Model Schema Modal Component
 * 
 * Features:
 * - ✅ Translation integration with t() function
 * - ✅ Form validation with Zod schema
 * - ✅ Audit tracking integration
 * - ✅ Lock status integration
 * - ✅ Loading states with proper UX
 * - ✅ Error handling and display
 * - ✅ Accessible form design
 * - ✅ TypeScript interfaces
 * 
 * @component EditModelSchemaModal
 * @param {boolean} isOpen - Modal open state
 * @param {Function} onClose - Close callback function
 * @param {Function} onSubmit - Submit callback function
 * @param {ModelSchema} schema - Schema to edit
 * @param {boolean} isLoading - Loading state
 * @example
 * ```tsx
 * <EditModelSchemaModal 
 *   isOpen={isOpen} 
 *   onClose={handleClose} 
 *   onSubmit={handleSubmit}
 *   schema={selectedSchema}
 *   isLoading={isSubmitting}
 * />
 * ```
 */

// Schema validation using Zod
const editSchemaSchema = z.object({
  displayName: z.string()
    .min(2, 'Display name is required')
    .max(100, 'Display name must be under 100 characters'),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type EditSchemaFormData = z.infer<typeof editSchemaSchema>;

interface EditModelSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  schema: ModelSchema | null;
  isLoading?: boolean;
}

export function EditModelSchemaModal({
  isOpen,
  onClose,
  onSubmit,
  schema,
  isLoading = false
}: EditModelSchemaModalProps) {
  const t = useTranslations('admin.model-schemas');
  const { trackFormSubmit } = useAuditTracking();

  const form = useForm<EditSchemaFormData>({
    resolver: zodResolver(editSchemaSchema),
    defaultValues: {
      displayName: '',
      description: '',
      isActive: true,
    },
  });

  // Populate form when schema changes
  useEffect(() => {
    if (schema) {
      form.reset({
        displayName: schema.displayName?.['en-US'] || '',
        description: schema.description?.['en-US'] || '',
        isActive: schema.isActive ?? true,
      });
    }
  }, [schema, form]);

  // Handle form submission with audit tracking
  const handleSubmit = (data: EditSchemaFormData) => {
    if (!schema) return;

    try {
      // Transform data for API
      const updateData = {
        id: schema.id,
        displayName: {
          'en-US': data.displayName
        },
        description: data.description ? {
          'en-US': data.description
        } : {},
        isActive: data.isActive,
      };

      // Track form submission start
      trackFormSubmit('edit-model-schema', 'initiated', {
        schemaId: schema.id,
        type: schema.type,
        subType: schema.subType
      });

      onSubmit(updateData);
    } catch (error) {
      trackFormSubmit('edit-model-schema', 'error', {
        error: error.message,
        schemaId: schema?.id
      });
    }
  };

  // Handle modal close with form reset
  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!schema) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            {t('edit.modal_title')}
          </DialogTitle>
          <DialogDescription>
            {t('edit.modal_description')}
          </DialogDescription>
        </DialogHeader>

        {/* Lock Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t('edit.lock_status_label')}</span>
          </div>
          <LockStatus entityType="model_schema" entityId={schema.id} />
        </div>

        {/* Schema Info */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
                {t('edit.info_type')}
            </label>
            <p className="text-sm">{schema.type}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
                {t('edit.info_subtype')}
            </label>
            <p className="text-sm font-mono">{schema.subType}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Display Name */}
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                                      <FormLabel>{t('edit.field_display_name')}</FormLabel>
                  <FormControl>
                    <Input
                        placeholder={t('edit.field_display_name_placeholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                      {t('edit.field_display_name_description')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                                      <FormLabel>{t('edit.field_description')}</FormLabel>
                  <FormControl>
                    <Textarea
                        placeholder={t('edit.field_description_placeholder')}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                      {t('edit.field_description_description')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Toggle */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                        {t('edit.field_status')}
                    </FormLabel>
                    <FormDescription>
                        {t('edit.field_status_description')}
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

            {/* Fields Info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('edit.fields_info')}</span>
                <span className="text-sm text-muted-foreground">
                  {schema.schema?.fields?.length || 0} {t('edit.fields_count')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('edit.fields_info_description')}
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                  {t('edit.button_cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !form.formState.isValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('edit.button_saving')}
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                      {t('edit.button_save')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 