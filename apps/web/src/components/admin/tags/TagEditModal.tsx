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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TagData {
  id?: number;
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  categories: { category: { id: number; name: string; slug: string } }[];
}

interface CategoryData {
  id: number;
  name: string;
}

interface TagEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tag: TagData | null;
  onSave: (data: Partial<TagData>) => void;
  allCategories: CategoryData[];
  isLoadingCategories: boolean;
}

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  slug: z.string().min(1, { message: "Slug is required." }).regex(/^[a-z0-9-]+$/, { message: "Slug must be lowercase, alphanumeric, and use hyphens." }),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  categoryIds: z.array(z.number()).optional(),
});

export function TagEditModal({
  isOpen,
  onOpenChange,
  tag,
  onSave,
  allCategories,
  isLoadingCategories,
}: TagEditModalProps) {
  const t = useTranslations('admin-tags');
  const tCommon = useTranslations('common');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: tag?.name || '',
      slug: tag?.slug || '',
      description: tag?.description || '',
      isActive: tag?.isActive ?? true,
      categoryIds: tag?.categories.map(cat => cat.category.id) || [],
    },
  });

  React.useEffect(() => {
    form.reset({
      name: tag?.name || '',
      slug: tag?.slug || '',
      description: tag?.description || '',
      isActive: tag?.isActive ?? true,
      categoryIds: tag?.categories.map(cat => cat.category.id) || [],
    });
  }, [tag, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    onSave(values);
  };

  const title = tag ? t('editModal.title') : t('createModal.title');
  const description = tag ? t('editModal.description') : t('createModal.description');

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
              name="categoryIds"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('fields.categories')}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value?.length && "text-muted-foreground"
                          )}
                        >
                          {field.value && field.value.length > 0
                            ? allCategories
                                .filter((category) => field.value?.includes(category.id))
                                .map((category) => category.name)
                                .join(", ")
                            : t('fields.selectCategories')}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder={t('fields.searchCategories')} />
                        <CommandEmpty>{t('fields.noCategoryFound')}</CommandEmpty>
                        <CommandGroup>
                          {isLoadingCategories ? (
                            <CommandItem>Loading categories...</CommandItem>
                          ) : (
                            allCategories.map((category) => (
                              <CommandItem
                                value={category.name}
                                key={category.id}
                                onSelect={() => {
                                  const currentCategoryIds = new Set(field.value);
                                  if (currentCategoryIds.has(category.id)) {
                                    currentCategoryIds.delete(category.id);
                                  } else {
                                    currentCategoryIds.add(category.id);
                                  }
                                  field.onChange(Array.from(currentCategoryIds));
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value?.includes(category.id)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {category.name}
                              </CommandItem>
                            ))
                          )}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    {t('fields.categoriesDescription')}
                  </FormDescription>
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
