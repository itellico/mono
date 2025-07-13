'use client';

import React from 'react';
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
import { Plus, Loader2 } from 'lucide-react';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';

/**
 * Create Model Schema Modal Component
 * 
 * Features:
 * - ✅ Translation integration with t() function
 * - ✅ Form validation with Zod schema
 * - ✅ Audit tracking integration
 * - ✅ Loading states with proper UX
 * - ✅ Error handling and display
 * - ✅ Accessible form design
 * - ✅ TypeScript interfaces
 * 
 * @component CreateModelSchemaModal
 * @param {boolean} isOpen - Modal open state
 * @param {Function} onClose - Close callback function
 * @param {Function} onSubmit - Submit callback function
 * @param {boolean} isLoading - Loading state
 * @example
 * ```tsx
 * <CreateModelSchemaModal 
 *   isOpen={isOpen} 
 *   onClose={handleClose} 
 *   onSubmit={handleSubmit}
 *   isLoading={isSubmitting}
 * />
 * ```
 */

// Schema validation using Zod
const createSchemaSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  subType: z.string()
    .min(2, 'Sub-type must be at least 2 characters')
    .max(50, 'Sub-type must be under 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Sub-type can only contain letters, numbers, underscores, and hyphens'),
  displayName: z.string()
    .min(2, 'Display name is required')
    .max(100, 'Display name must be under 100 characters'),
  description: z.string().optional(),
});

type CreateSchemaFormData = z.infer<typeof createSchemaSchema>;

interface CreateModelSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

const SCHEMA_TYPES = [
  { value: 'human_model', label: 'Human Model' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'profile', label: 'Profile' },
  { value: 'business', label: 'Business' },
];

export function CreateModelSchemaModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}: CreateModelSchemaModalProps) {
  const t = useTranslations('admin-common');
  const { trackFormSubmit } = useAuditTracking();

  const form = useForm<CreateSchemaFormData>({
    resolver: zodResolver(createSchemaSchema),
    defaultValues: {
      type: '',
      subType: '',
      displayName: '',
      description: '',
    },
  });

  // Handle form submission with audit tracking
  const handleSubmit = (data: CreateSchemaFormData) => {
    try {
      // Transform data for API
      const schemaData = {
        type: data.type,
        subType: data.subType,
        displayName: {
          'en-US': data.displayName
        },
        description: data.description ? {
          'en-US': data.description
        } : {},
        schema: {
          fields: [],
          version: '1.0.0'
        },
        isActive: true,
      };

      // Track form submission start
      trackFormSubmit('create-model-schema', 'initiated', {
        type: data.type,
        subType: data.subType
      });

      onSubmit(schemaData);
    } catch (error) {
      trackFormSubmit('create-model-schema', 'error', {
        error: error.message
      });
    }
  };

  // Handle modal close with form reset
  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Generate sub-type from display name
  const generateSubType = (displayName: string) => {
    return displayName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length
  };

  // Auto-generate sub-type when display name changes
  const handleDisplayNameChange = (value: string, onChange: (value: string) => void) => {
    onChange(value);
    
    // Auto-generate sub-type if it&apos;s empty
    const currentSubType = form.getValues('subType');
    if (!currentSubType && value) {
      const generatedSubType = generateSubType(value);
      form.setValue('subType', generatedSubType);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t('model-schemas.create.modal_title')}
          </DialogTitle>
          <DialogDescription>
            {t('model-schemas.create.modal_description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Schema Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('create.field_type')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('create.field_type_placeholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SCHEMA_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('create.field_type_description')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display Name */}
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('create.field_display_name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('create.field_display_name_placeholder')}
                      {...field}
                      onChange={(e) => handleDisplayNameChange(e.target.value, field.onChange)}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('create.field_display_name_description')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sub-Type */}
            <FormField
              control={form.control}
              name="subType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('create.field_subtype')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('create.field_subtype_placeholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('create.field_subtype_description')}
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
                  <FormLabel>{t('create.field_description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('create.field_description_placeholder')}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('create.field_description_description')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                {t('create.button_cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !form.formState.isValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('create.button_creating')}
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('create.button_create')}
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