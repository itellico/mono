'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { SearchableMultiSelect } from '@/components/ui/searchable-multi-select';

interface CategoryData {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number | null;
  isActive?: boolean;
  tagIds?: number[];
}

interface CategoryEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryData | null;
  onSave: (data: Partial<CategoryData>) => void;
  allCategories: CategoryData[]; // For parent selection
  allTags?: Array<{ id: number; name: string; slug: string }>; // For tag selection
  isLoadingTags?: boolean;
}

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  slug: z.string().min(1, { message: "Slug is required." }).regex(/^[a-z0-9-]+$/, { message: "Slug must be lowercase, alphanumeric, and use hyphens." }),
  description: z.string().optional(),
  parentId: z.union([z.number().int().positive(), z.literal(0), z.null()]).optional().transform(e => e === 0 ? null : e), // 0 for no parent
  isActive: z.boolean().optional(),
  tagIds: z.array(z.number()).optional(),
});

export function CategoryEditModal({
  isOpen,
  onOpenChange,
  category,
  onSave,
  allCategories,
  allTags = [],
  isLoadingTags = false,
}: CategoryEditModalProps) {
  const t = useTranslations('admin-common');
  const tCommon = useTranslations('common');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name || '',
      slug: category?.slug || '',
      description: category?.description || '',
      parentId: category?.parentId === undefined ? null : category.parentId,
      isActive: category?.isActive ?? true,
      tagIds: category?.tagIds || [],
    },
  });

  React.useEffect(() => {
    form.reset({
      name: category?.name || '',
      slug: category?.slug || '',
      description: category?.description || '',
      parentId: category?.parentId === undefined ? null : category.parentId,
      isActive: category?.isActive ?? true,
      tagIds: category?.tagIds || [],
    });
  }, [category, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    onSave(values);
  };

  const title = category ? t('editModal.title') : t('createModal.title');
  const description = category ? t('editModal.description') : t('createModal.description');

  const parentCategories = allCategories.filter(cat => cat.id !== category?.id);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon('fields.name')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon('fields.slug')}</FormLabel>
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
                  <FormLabel>{tCommon('fields.description')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.parentCategory')}</FormLabel>
                  <Select onValueChange={value => field.onChange(parseInt(value))}
                          value={field.value === null ? '0' : field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('fields.selectParentCategory')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">{t('fields.noParent')}</SelectItem>
                      {parentCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tagIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tCommon('fields.tags')}</FormLabel>
                  <FormControl>
                    <SearchableMultiSelect
                      options={allTags.map(tag => ({
                        value: tag.id.toString(),
                        label: tag.name
                      }))}
                      value={field.value?.map(id => id.toString()) || []}
                      onChange={(values) => field.onChange(values.map(v => parseInt(v)))}
                      placeholder="Select tags..."
                      isLoading={isLoadingTags}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>{tCommon('fields.active')}</FormLabel>
                    <FormDescription>
                      {t('fields.activeDescription')}
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
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {tCommon('actions.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
