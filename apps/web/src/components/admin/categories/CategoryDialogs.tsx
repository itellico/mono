'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { AlertTriangle, RotateCcw, Info } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { LucideIconPicker } from '@/components/ui/lucide-icon-picker';
import type { Category } from '@/lib/types/categories';
import { getCategoryTypeOptions } from '@/lib/constants/category-types';

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  parentId: string;
  color: string;
  icon: string;
  categoryType: string;
  isSystem?: boolean;
  isSibling?: boolean;
  siblingName?: string;
  isChild?: boolean;
  parentName?: string;
}

interface CategoryDialogsProps {
  // Dialog states
  isAddCategoryOpen: boolean;
  setIsAddCategoryOpen: (open: boolean) => void;
  isEditCategoryOpen: boolean;
  setIsEditCategoryOpen: (open: boolean) => void;
  isDeleteCategoryOpen: boolean;
  setIsDeleteCategoryOpen: (open: boolean) => void;
  
  // Form states
  categoryForm: CategoryForm;
  setCategoryForm: (form: CategoryForm | ((prev: CategoryForm) => CategoryForm)) => void;
  
  // Data
  categories: Category[];
  currentCategory: Category | null;
  error: string | null;
  setError: (error: string | null) => void;
  
  // Actions
  submitCreateCategory: () => void;
  submitUpdateCategory: () => void;
  submitDeleteCategory: () => void;
  
  // Auto-slug generation
  handleNameChange?: (name: string) => void;
  generateSlug?: (name: string) => string;
}

export function CategoryDialogs({
  isAddCategoryOpen,
  setIsAddCategoryOpen,
  isEditCategoryOpen,
  setIsEditCategoryOpen,
  isDeleteCategoryOpen,
  setIsDeleteCategoryOpen,
  categoryForm,
  setCategoryForm,
  categories,
  currentCategory,
  error,
  setError,
  submitCreateCategory,
  submitUpdateCategory,
  submitDeleteCategory,
  handleNameChange,
  generateSlug
}: CategoryDialogsProps) {
  const { user } = useAuth();
  
  // Track if slug was manually edited to control auto-generation
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  
  // Extended delete protection for system items
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  
  // Extract user role from user
  const userRole = (user as any)?.enhancedRole?.roleName;
  const isSuperAdmin = userRole === 'super_admin';
  
  // Enhanced slug generation
  const generateSlugFromName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };
  
  // Auto-generate slug from name for categories
  const handleCategoryNameChange = (name: string) => {
    const newSlug = !slugManuallyEdited ? generateSlugFromName(name) : categoryForm.slug;
    
      setCategoryForm({ 
        ...categoryForm, 
        name,
        slug: newSlug
      });
    
    // Also call the optional prop function if provided
    if (handleNameChange) {
      handleNameChange(name);
    }
  };

  // Handle manual slug editing for categories
  const handleCategorySlugChange = (slug: string) => {
    setSlugManuallyEdited(true);
    setCategoryForm({ ...categoryForm, slug });
  };

  // Regenerate slug from name
  const regenerateCategorySlug = () => {
    const newSlug = generateSlugFromName(categoryForm.name);
    setCategoryForm({ ...categoryForm, slug: newSlug });
    setSlugManuallyEdited(false);
  };

  // Reset manual edit tracking when dialogs open
  React.useEffect(() => {
    if (isAddCategoryOpen || isEditCategoryOpen) {
      setSlugManuallyEdited(false);
    }
  }, [isAddCategoryOpen, isEditCategoryOpen]);

  // Category type inheritance logic
  const getInheritedCategoryType = () => {
    if (categoryForm.parentId && categoryForm.parentId !== '__root__') {
      const parentCategory = categories.find(cat => cat.id.toString() === categoryForm.parentId);
      return parentCategory?.categoryType;
    }
    return null;
  };

  const inheritedCategoryType = getInheritedCategoryType();
  const shouldInheritCategoryType = categoryForm.parentId && categoryForm.parentId !== '__root__';
  const isRootCategory = !categoryForm.parentId || categoryForm.parentId === '__root__';

  // Update category type when parent changes (for child/sibling categories)
  useEffect(() => {
    if (shouldInheritCategoryType && inheritedCategoryType) {
      setCategoryForm(prev => ({ ...prev, categoryType: inheritedCategoryType }));
    }
  }, [categoryForm.parentId, inheritedCategoryType, shouldInheritCategoryType, setCategoryForm]);

  // Filter categories for parent selection (exclude same category and its children)
  const getAvailableParentCategories = () => {
    let availableCategories;
    
    if (!currentCategory) {
      availableCategories = categories.filter(cat => cat.level < 2); // Only allow up to level 2 as parents
    } else {
      // For editing, exclude the category itself and its descendants
      availableCategories = categories.filter(cat => 
        cat.level < 2 && 
        cat.id !== currentCategory.id && 
        !cat.path.startsWith(currentCategory.path)
      );
    }
    
    // Sort by path for proper hierarchy display
    return availableCategories.sort((a, b) => a.path.localeCompare(b.path));
  };

  // Validation helper
  const validateCategoryForm = () => {
    if (!categoryForm.name.trim()) {
      return 'Category name is required';
    }
    if (!categoryForm.slug.trim()) {
      return 'Category slug is required';
    }
    if (categoryForm.slug.includes(' ')) {
      return 'Slug cannot contain spaces';
    }
    if (!/^[a-z0-9-]+$/.test(categoryForm.slug)) {
      return 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    return null;
  };

  return (
    <>
      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {categoryForm.isSibling 
                ? `Add Sibling to "${categoryForm.siblingName}"` 
                : categoryForm.isChild
                ? `Add Child to "${categoryForm.parentName}"`
                : "Add New Category"
              }
            </DialogTitle>
            {categoryForm.isSibling && (
              <DialogDescription>
                Creating a sibling category at the same level as &quot;{categoryForm.siblingName}&quot;
              </DialogDescription>
            )}
            {categoryForm.isChild && (
              <DialogDescription>
                Creating a child category under &quot;{categoryForm.parentName}&quot;. This will create a level {categories.find(c => c.id.toString() === categoryForm.parentId)?.level !== undefined ? (categories.find(c => c.id.toString() === categoryForm.parentId)!.level + 1) : 1} category (maximum 3 levels allowed).
              </DialogDescription>
            )}
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); submitCreateCategory(); }}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Name *</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => handleCategoryNameChange(e.target.value)}
                placeholder="Category name"
                className={!categoryForm.name.trim() ? 'border-red-300' : ''}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="category-slug">Slug *</Label>
                {slugManuallyEdited && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={regenerateCategorySlug}
                    className="h-auto p-1 text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                )}
              </div>
              <Input
                id="category-slug"
                value={categoryForm.slug}
                onChange={(e) => handleCategorySlugChange(e.target.value)}
                placeholder="category-slug"
                className={!categoryForm.slug.trim() ? 'border-red-300' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated from name. Edit manually if needed.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Category description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-parent">Parent Category</Label>
              {categoryForm.isSibling || categoryForm.isChild ? (
                // Show selected parent as read-only for child/sibling relationships
                <div className="p-3 bg-muted border rounded-md">
                  {categoryForm.parentId === '' || categoryForm.parentId === '__root__' ? (
                    <span className="text-sm text-muted-foreground">None (Root Category)</span>
                  ) : (
                    (() => {
                      console.log('🔧 Debug parent category lookup:', {
                        formParentId: categoryForm.parentId,
                        formParentIdType: typeof categoryForm.parentId,
                        categoriesCount: categories.length,
                        isChild: categoryForm.isChild,
                        isSibling: categoryForm.isSibling,
                        parentName: categoryForm.parentName,
                        siblingName: categoryForm.siblingName,
                        allCategoryIds: categories.map(c => ({ id: c.id, name: c.name, idType: typeof c.id })),
                        fullCategoriesData: categories.map(c => ({ 
                          id: c.id, 
                          name: c.name, 
                          level: c.level, 
                          parentId: c.parentId,
                          path: c.path 
                        }))
                      });
                      
                      // More robust parent category lookup
                      const parentCategory = categories.find(cat => {
                        // Try exact match first
                        if (cat.id === categoryForm.parentId) return true;
                        // Try string comparison
                        if (cat.id.toString() === categoryForm.parentId) return true;
                        // Try UUID comparison (handle case where one might have dashes, other might not)
                        if (typeof cat.id === 'string' && typeof categoryForm.parentId === 'string') {
                          const normalizedCatId = cat.id.replace(/-/g, '');
                          const normalizedFormId = categoryForm.parentId.replace(/-/g, '');
                          if (normalizedCatId === normalizedFormId) return true;
                        }
                        // Try number parsing if applicable
                        if (typeof cat.id === 'number' && !isNaN(parseInt(categoryForm.parentId, 10))) {
                          if (cat.id === parseInt(categoryForm.parentId, 10)) return true;
                        }
                        return false;
                      });
                      
                      console.log('🔧 Parent category lookup result:', {
                        found: !!parentCategory,
                        parentCategory: parentCategory ? {
                          id: parentCategory.id,
                          name: parentCategory.name,
                          level: parentCategory.level
                        } : null
                      });
                      
                      return parentCategory ? (
                        <span className="text-sm">
                          {'  '.repeat(parentCategory.level)}└─ {parentCategory.name} (Level {parentCategory.level})
                        </span>
                      ) : (
                        <div className="text-sm text-red-600">
                          <div>Parent category not found (ID: {categoryForm.parentId})</div>
                          <div className="text-xs mt-1">
                            Available categories: {categories.length} total
                          </div>
                          {categories.length > 0 && (
                            <div className="text-xs mt-1">
                              Sample IDs: {categories.slice(0, 3).map(c => c.id).join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                  {categoryForm.isSibling && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Parent is preset for sibling relationship
                    </p>
                  )}
                  {categoryForm.isChild && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Parent is preset for child relationship
                    </p>
                  )}
                </div>
              ) : (
                <Select
                  value={categoryForm.parentId}
                  onValueChange={(value) => setCategoryForm({ ...categoryForm, parentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__root__">None (Root Category)</SelectItem>
                    {categories
                      .filter(cat => cat.level < 2) // Only show categories that can have children
                      .sort((a, b) => a.path.localeCompare(b.path)) // Sort by path for proper hierarchy
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {'  '.repeat(category.level)}└─ {category.name} (Level {category.level})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-color">Color</Label>
              <Input
                id="category-color"
                type="color"
                value={categoryForm.color}
                onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-icon">Icon</Label>
              <LucideIconPicker
                value={categoryForm.icon}
                onChange={(value) => setCategoryForm({ ...categoryForm, icon: value })}
                placeholder="Select an icon..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-type">Category Type *</Label>
              {shouldInheritCategoryType && inheritedCategoryType ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <Info className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">
                        Category type inherited from parent
                      </p>
                      <p className="text-xs text-blue-700">
                        Child categories automatically inherit their parent&apos;s category type
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {inheritedCategoryType}
                    </Badge>
                  </div>
                </div>
              ) : (
                <Select
                  value={categoryForm.categoryType}
                  onValueChange={(value) => setCategoryForm({ ...categoryForm, categoryType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategoryTypeOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* System Flag - Only for Super Admin */}
            {isSuperAdmin && (
              <div className="grid gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="category-system"
                    checked={(categoryForm as any).isSystem || false}
                    onCheckedChange={(checked) => 
                      setCategoryForm({ ...categoryForm, isSystem: checked } as CategoryForm)
                    }
                  />
                  <Label htmlFor="category-system">System Category</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  System categories cannot be deleted and may have restricted editing
                </p>
              </div>
            )}
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddCategoryOpen(false);
              setError(null); // Clear error when canceling
            }}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!categoryForm.name.trim() || !categoryForm.slug.trim() || !categoryForm.categoryType.trim()}
            >
              Create Category
            </Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Make changes to the category. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-category-name">Name *</Label>
              <Input
                id="edit-category-name"
                value={categoryForm.name}
                onChange={(e) => handleCategoryNameChange(e.target.value)}
                placeholder="Category name"
                className={!categoryForm.name.trim() ? 'border-red-300' : ''}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-category-slug">Slug *</Label>
                {slugManuallyEdited && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={regenerateCategorySlug}
                    className="h-auto p-1 text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                )}
              </div>
              <Input
                id="edit-category-slug"
                value={categoryForm.slug}
                onChange={(e) => handleCategorySlugChange(e.target.value)}
                placeholder="category-slug"
                className={!categoryForm.slug.trim() ? 'border-red-300' : ''}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category-description">Description</Label>
              <Textarea
                id="edit-category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Category description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category-parent">Parent Category</Label>
              <Select
                value={categoryForm.parentId}
                onValueChange={(value) => setCategoryForm({ ...categoryForm, parentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__root__">None (Root Category)</SelectItem>
                  {getAvailableParentCategories().map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {'  '.repeat(category.level)}└─ {category.name} (Level {category.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category-color">Color</Label>
              <Input
                id="edit-category-color"
                type="color"
                value={categoryForm.color}
                onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category-icon">Icon</Label>
              <LucideIconPicker
                value={categoryForm.icon}
                onChange={(value) => setCategoryForm({ ...categoryForm, icon: value })}
                placeholder="Select an icon..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category-type">Category Type *</Label>
              {shouldInheritCategoryType && inheritedCategoryType ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <Info className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">
                        Category type inherited from parent
                      </p>
                      <p className="text-xs text-blue-700">
                        Child categories automatically inherit their parent&apos;s category type
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {inheritedCategoryType}
                    </Badge>
                  </div>
                </div>
              ) : (
                <Select
                  value={categoryForm.categoryType}
                  onValueChange={(value) => setCategoryForm({ ...categoryForm, categoryType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategoryTypeOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* System Flag - Only for Super Admin */}
            {isSuperAdmin && (
              <div className="grid gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-category-system"
                    checked={(currentCategory?.isSystem || (categoryForm as any).isSystem) || false}
                    onCheckedChange={(checked) => 
                      setCategoryForm({ ...categoryForm, isSystem: checked } as CategoryForm)
                    }
                  />
                  <Label htmlFor="edit-category-system">System Category</Label>
                </div>
                {currentCategory?.isEffectiveSystem && currentCategory?.systemInheritanceSource && (
                  <p className="text-xs text-amber-600">
                    Inherited from parent category
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  System categories cannot be deleted and may have restricted editing
                </p>
              </div>
            )}
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditCategoryOpen(false);
              setError(null); // Clear error when canceling
            }}>
              Cancel
            </Button>
            <Button 
              onClick={submitUpdateCategory}
              disabled={!categoryForm.name.trim() || !categoryForm.slug.trim() || !categoryForm.categoryType.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={isDeleteCategoryOpen} onOpenChange={(open) => {
        setIsDeleteCategoryOpen(open);
        if (!open) setDeleteConfirmationText(''); // Reset confirmation text when closing
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{currentCategory?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentCategory?.children && currentCategory.children.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded p-3">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                    <p className="text-sm text-amber-800">
                      This category has {currentCategory.children.length} child categories: {currentCategory.children.map(c => c.name).join(', ')}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm font-medium">What should happen to the child categories?</p>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="deleteOption"
                        value="cascade"
                        defaultChecked
                        className="h-4 w-4 text-red-600"
                      />
                      <div>
                        <div className="text-sm font-medium">Delete all children (Cascade Delete)</div>
                        <div className="text-xs text-muted-foreground">Permanently delete this category and all {currentCategory.children.length} child categories</div>
                      </div>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="deleteOption"
                        value="move"
                        className="h-4 w-4 text-blue-600"
                      />
                      <div>
                        <div className="text-sm font-medium">Move children to parent category</div>
                        <div className="text-xs text-muted-foreground">
                          Move child categories to {currentCategory.parentId ? 'the parent category' : 'root level'}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Any entities associated with this category will lose their categorization.
              </p>
            )}
            
            {/* Extended Protection for System Categories */}
            {currentCategory?.isSystem && (
              <div className="bg-red-50 border border-red-200 rounded p-4 space-y-3 mt-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-sm font-medium text-red-800">
                    System Category - Extended Protection Required
                  </p>
                </div>
                <p className="text-sm text-red-700">
                  This is a system category that is critical to platform functionality. 
                  To confirm deletion, please type <strong>delete</strong> below:
                </p>
                <Input
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="Type 'delete' to confirm"
                  className="border-red-300 focus:border-red-500"
                />
              </div>
            )}
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteCategoryOpen(false);
              setDeleteConfirmationText('');
              setError(null); // Clear error when canceling
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                console.log('🗑️ Delete button clicked!');
                console.log('Current category:', currentCategory);
                console.log('submitDeleteCategory function:', submitDeleteCategory);
                try {
                  submitDeleteCategory();
                  console.log('✅ submitDeleteCategory called successfully');
                } catch (error) {
                  console.error('❌ Error calling submitDeleteCategory:', error);
                }
              }}
              disabled={
                currentCategory?.isSystem && 
                deleteConfirmationText.toLowerCase() !== 'delete'
              }
            >
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 