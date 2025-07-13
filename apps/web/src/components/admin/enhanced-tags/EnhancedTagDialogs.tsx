'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  Save, 
  X, 
  Trash2, 
  AlertCircle,
  Globe,
  Building2,
  Users,
  User,
  Settings
} from 'lucide-react';
import { LucideIconPicker } from '@/components/ui/lucide-icon-picker';
import { HierarchicalCategorySelect } from './HierarchicalCategorySelect';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';
import type { EnhancedTagWithCategory } from './EnhancedTagsDataTable';

interface CategoryHierarchy {
  id: string;
  name: string;
  slug: string;
  path: string;
  level: number;
  parentId: string | null;
  icon?: string;
  children: CategoryHierarchy[];
}

// Scope icons mapping
const scopeIcons = {
  platform: Globe,
  tenant: Building2,
  account: Users,
  user: User,
  configuration: Settings
};

// Form validation schema
const tagFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be less than 100 characters'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  icon: z.string().optional(),
  categoryId: z.string().optional(),
  scopeLevel: z.enum(['platform', 'tenant', 'account', 'user', 'configuration']),
  isSystem: z.boolean(),
  isActive: z.boolean(),
});

type TagFormData = z.infer<typeof tagFormSchema>;

interface CreateTagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryHierarchy[];
  onSave: (data: TagFormData) => Promise<void>;
  userRole?: string;
}

interface EditTagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tag: EnhancedTagWithCategory | null;
  categories: CategoryHierarchy[];
  onSave: (data: TagFormData) => Promise<void>;
  userRole?: string;
}

interface DeleteTagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tag: EnhancedTagWithCategory | null;
  onConfirm: () => Promise<void>;
}

/**
 * Create Enhanced Tag Dialog
 * 
 * @component
 * @param {CreateTagDialogProps} props - Component props
 */
export function CreateTagDialog({
  isOpen,
  onClose,
  categories,
  onSave,
  userRole = 'user'
}: CreateTagDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trackClick } = useAuditTracking();

  const form = useForm<TagFormData>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      color: '#3B82F6',
      icon: '',
      categoryId: '',
      scopeLevel: 'tenant',
      isSystem: false,
      isActive: true,
    },
  });

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const watchName = form.watch('name');
  useEffect(() => {
    if (watchName) {
      form.setValue('slug', generateSlug(watchName));
    }
  }, [watchName, form]);

  const onSubmit = async (data: TagFormData) => {
    try {
      setIsSubmitting(true);
      trackClick('enhanced_tags_create_submit');

      await onSave({
        ...data,
        categoryId: data.categoryId || undefined,
      });

      form.reset();
      onClose();

      browserLogger.userAction('Enhanced tag created', 'EnhancedTagDialogs', {
        tagName: data.name,
        scopeLevel: data.scopeLevel
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create tag';
      browserLogger.error('Enhanced tag creation failed', { 
        error: errorMessage,
        errorType: typeof error,
        errorObject: error,
        formData: data
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Determine available scopes based on user role
  const availableScopes = userRole === 'super_admin' 
    ? ['platform', 'configuration', 'tenant', 'account', 'user']
    : ['tenant', 'account', 'user'];

  // Debug logging
  React.useEffect(() => {
    browserLogger.info('CreateTagDialog role check', {
      component: 'EnhancedTagDialogs',
      userRole,
      availableScopes,
      isOpen
    });
  }, [userRole, availableScopes, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Enhanced Tag</DialogTitle>
          <DialogDescription>
            Create a new enhanced tag with category assignment and scope configuration.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter tag name" {...field} />
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
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="Auto-generated from name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter tag description" 
                      className="resize-none" 
                      rows={3} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category and Scope */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <HierarchicalCategorySelect
                        categories={categories}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Select a category"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scopeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope Level</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scope level" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableScopes.map((scope) => {
                            const Icon = scopeIcons[scope as keyof typeof scopeIcons];
                            return (
                              <SelectItem key={scope} value={scope}>
                                <div className="flex items-center space-x-2">
                                  <Icon className="h-4 w-4" />
                                  <span className="capitalize">{scope}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Visual Properties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="color"
                          {...field}
                          className="w-12 h-10 p-1 border rounded"
                        />
                        <Input
                          type="text"
                          {...field}
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <LucideIconPicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select an icon"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status Toggles */}
            <div className="flex items-center space-x-6 pt-4">
              <FormField
                control={form.control}
                name="isSystem"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={userRole !== 'super_admin'}
                      />
                    </FormControl>
                    <FormLabel className="text-sm">System Tag</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm">Active</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex justify-end space-x-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Tag
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Edit Enhanced Tag Dialog
 * 
 * @component
 * @param {EditTagDialogProps} props - Component props
 */
export function EditTagDialog({
  isOpen,
  onClose,
  tag,
  categories,
  onSave,
  userRole = 'user'
}: EditTagDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trackClick } = useAuditTracking();

  const form = useForm<TagFormData>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      color: '#3B82F6',
      icon: '',
      categoryId: '',
      scopeLevel: 'tenant',
      isSystem: false,
      isActive: true,
    },
  });

  // Update form when tag changes
  useEffect(() => {
    if (tag) {
      form.reset({
        name: tag.name,
        slug: tag.slug,
        description: tag.description || '',
        color: tag.color || '#3B82F6',
        icon: tag.icon || '',
        categoryId: tag.categoryId || '',
        scopeLevel: tag.scopeLevel,
        isSystem: tag.isSystem,
        isActive: tag.isActive,
      });
    }
  }, [tag, form]);

  const onSubmit = async (data: TagFormData) => {
    if (!tag) return;

    try {
      setIsSubmitting(true);
      trackClick('enhanced_tags_edit_submit', { tagId: tag.id });

      await onSave({
        ...data,
        categoryId: data.categoryId || undefined,
      });

      onClose();

      browserLogger.userAction('Enhanced tag updated', 'EnhancedTagDialogs', {
        tagId: tag.id,
        tagName: data.name
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update tag';
      browserLogger.error('Enhanced tag update failed', { error: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const availableScopes = userRole === 'super_admin' 
    ? ['platform', 'configuration', 'tenant', 'account', 'user']
    : ['tenant', 'account', 'user'];

  // Debug logging
  React.useEffect(() => {
    browserLogger.info('EditTagDialog role check', {
      component: 'EnhancedTagDialogs',
      userRole,
      availableScopes,
      isOpen
    });
  }, [userRole, availableScopes, isOpen]);

  const canEditSystem = userRole === 'super_admin' || !tag?.isSystem;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Enhanced Tag</DialogTitle>
          <DialogDescription>
            Update the enhanced tag configuration and properties.
          </DialogDescription>
        </DialogHeader>

        {tag && (
          <div className="flex items-center space-x-2 mb-4">
            <Badge variant={tag.isSystem ? "destructive" : "secondary"}>
              {tag.isSystem ? "System Tag" : "Custom Tag"}
            </Badge>
            <Badge variant={tag.isActive ? "default" : "outline"}>
              {tag.isActive ? "Active" : "Inactive"}
            </Badge>
            {tag.usageCount > 0 && (
              <Badge variant="outline">
                {tag.usageCount} usage{tag.usageCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter tag name" 
                        disabled={!canEditSystem}
                        {...field} 
                      />
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
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Tag slug" 
                        disabled={!canEditSystem}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter tag description" 
                      className="resize-none" 
                      rows={3} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category and Scope */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <HierarchicalCategorySelect
                        categories={categories}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Select a category"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scopeLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope Level</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                        disabled={!canEditSystem}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select scope level" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableScopes.map((scope) => {
                            const Icon = scopeIcons[scope as keyof typeof scopeIcons];
                            return (
                              <SelectItem key={scope} value={scope}>
                                <div className="flex items-center space-x-2">
                                  <Icon className="h-4 w-4" />
                                  <span className="capitalize">{scope}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Visual Properties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="color"
                          {...field}
                          className="w-12 h-10 p-1 border rounded"
                        />
                        <Input
                          type="text"
                          {...field}
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <LucideIconPicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select an icon"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status Toggles */}
            <div className="flex items-center space-x-6 pt-4">
              <FormField
                control={form.control}
                name="isSystem"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={userRole !== 'super_admin'}
                      />
                    </FormControl>
                    <FormLabel className="text-sm">System Tag</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm">Active</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex justify-end space-x-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Tag
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Delete Enhanced Tag Dialog
 * 
 * @component
 * @param {DeleteTagDialogProps} props - Component props
 */
export function DeleteTagDialog({
  isOpen,
  onClose,
  tag,
  onConfirm
}: DeleteTagDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { trackClick } = useAuditTracking();

  const handleConfirm = async () => {
    if (!tag) return;

    try {
      setIsDeleting(true);
      trackClick('enhanced_tags_delete_confirm', { tagId: tag.id });

      await onConfirm();
      onClose();

      browserLogger.userAction('Enhanced tag deleted', 'EnhancedTagDialogs', {
        tagId: tag.id,
        tagName: tag.name
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete tag';
      browserLogger.error('Enhanced tag deletion failed', { error: errorMessage });
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = tag && !tag.isSystem && tag.usageCount === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span>Delete Enhanced Tag</span>
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the enhanced tag.
          </DialogDescription>
        </DialogHeader>

        {tag && (
          <div className="py-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="font-medium">{tag.name}</div>
              <div className="text-sm text-muted-foreground">{tag.slug}</div>
              {tag.description && (
                <div className="text-sm text-muted-foreground mt-1">{tag.description}</div>
              )}
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={tag.isSystem ? "destructive" : "secondary"}>
                  {tag.isSystem ? "System Tag" : "Custom Tag"}
                </Badge>
                {tag.usageCount > 0 && (
                  <Badge variant="outline">
                    {tag.usageCount} usage{tag.usageCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>

            {!canDelete && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <div className="text-sm text-yellow-800">
                    {tag.isSystem 
                      ? "System tags cannot be deleted."
                      : "Tags with active usage cannot be deleted."
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting || !canDelete}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Tag
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 