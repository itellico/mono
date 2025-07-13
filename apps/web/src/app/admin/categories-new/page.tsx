'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  FolderTree, 
  Shield, 
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Folder,
  FolderOpen,
  Hash,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';
import { LucideIconPicker } from '@/components/ui/lucide-icon-picker';

// Types based on the actual schema
interface Category {
  id: string;
  tenantId: number;
  name: string;
  slug: string;
  description?: string;
  categoryType?: string;
  parentId?: string;
  level: number;
  path: string;
  sortOrder: number;
  color?: string;
  icon?: string;
  isSystem: boolean;
  isActive: boolean;
  metadata: Record<string, any>;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
}

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  categoryType: string;
  parentId: string;
  color: string;
  icon: string;
  isSystem: boolean;
  sortOrder: number;
}

interface CategoriesData {
  categories: Category[];
  stats: {
    totalCategories: number;
    systemCategories: number;
    activeCategories: number;
    maxLevel: number;
  };
}

// Category types from schema
const CATEGORY_TYPES = [
  { value: 'user', label: 'User', description: 'User-related categories' },
  { value: 'content', label: 'Content', description: 'Content management categories' },
  { value: 'transaction', label: 'Transaction', description: 'Transaction and payment categories' },
  { value: 'communication', label: 'Communication', description: 'Communication and messaging' },
  { value: 'system', label: 'System', description: 'System and platform categories' },
  { value: 'resource', label: 'Resource', description: 'Resource management categories' },
  { value: 'event', label: 'Event', description: 'Event and scheduling categories' },
  { value: 'workflow', label: 'Workflow', description: 'Workflow and process categories' },
  { value: 'analytics', label: 'Analytics', description: 'Analytics and reporting categories' },
  { value: 'moderation', label: 'Moderation', description: 'Content moderation categories' },
  { value: 'tenant', label: 'Tenant', description: 'Tenant-specific categories' },
  { value: 'platform', label: 'Platform', description: 'Platform-wide categories' }
];

function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  color = "default"
}: { 
  title: string;
  value: number;
  description: string;
  icon: any;
  color?: "default" | "success" | "warning" | "destructive";
}) {
  const colorClasses = {
    default: "border-blue-200 bg-blue-50",
    success: "border-green-200 bg-green-50",
    warning: "border-yellow-200 bg-yellow-50",
    destructive: "border-red-200 bg-red-50"
  };

  const iconColorClasses = {
    default: "text-blue-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    destructive: "text-red-600"
  };

  return (
    <Card className={colorClasses[color]}>
      <CardContent className="p-6">
        <div className="flex items-center">
          <Icon className={`h-8 w-8 ${iconColorClasses[color]}`} />
          <div className="ml-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CategoriesNewPage() {
  const { user, loading: isLoading } = useAuth();
  const t = useTranslations('admin-common');
  const { trackClick, trackView } = useAuditTracking();
  const { toast } = useToast();
  
  // State management
  const [data, setData] = useState<CategoriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [showSystem, setShowSystem] = useState(true);
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Form and selection states
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Form state
  const [form, setForm] = useState<CategoryForm>({
    name: '',
    slug: '',
    description: '',
    categoryType: 'system',
    parentId: '',
    color: '#6366f1',
    icon: 'folder',
    isSystem: false,
    sortOrder: 0
  });

  // Check permissions - with reduced logging
  const userRole = user?.roles?.[0] || '';
  const canManage = true; // userRole === 'super_admin';

  // Track page view only once
  useEffect(() => {
    trackView('admin_categories_new_page');
  }, [trackView]);

  // Fetch data - simplified to prevent refresh issues
  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        includeInactive: showInactive.toString(),
        includeSystem: showSystem.toString()
      });

      const response = await fetch(`/api/v1/admin/categories?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          browserLogger.error('Authentication error', { status: response.status });
          return;
        }
        throw new Error(result.error || `HTTP ${response.status}: Failed to fetch categories`);
      }

      if (result.success && result.data) {
        setData(result.data);
        // Reduced logging frequency
        if (result.data.categories?.length) {
          browserLogger.userAction('categories_data_loaded', `Loaded ${result.data.categories.length} categories`);
        }
      } else {
        throw new Error(result.error || 'Failed to fetch categories');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      browserLogger.error('Failed to fetch categories', { error: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [user?.email, showInactive, showSystem]);

  // Load data only when necessary - prevent excessive refreshes
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user?.email]); // Only re-fetch when user email changes, not when filters change

  // Auto-expand categories with children when data loads
  useEffect(() => {
    if (data?.categories) {
      const categoriesWithChildren = data.categories.filter(cat => 
        data.categories.some(child => child.parentId === cat.id)
      );
      setExpandedCategories(new Set(categoriesWithChildren.map(cat => cat.id)));
    }
  }, [data?.categories]);

  // Separate effect for filter changes that doesn't re-fetch from server
  useEffect(() => {
    // Don't re-fetch, just update local state when filters change
  }, [showInactive, showSystem]);

  // Auto-generate slug from name - optimized
  const generateSlug = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, []);

  // Handle form changes - optimized to prevent performance issues
  const handleNameChange = useCallback((name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  }, [generateSlug]);

  // Optimized slug change handler
  const handleSlugChange = useCallback((slug: string) => {
    setForm(prev => ({ ...prev, slug }));
  }, []);

  // Optimized description change handler
  const handleDescriptionChange = useCallback((description: string) => {
    setForm(prev => ({ ...prev, description }));
  }, []);

  // Optimized form field handlers
  const handleCategoryTypeChange = useCallback((categoryType: string) => {
    setForm(prev => ({ ...prev, categoryType }));
  }, []);

  const handleParentIdChange = useCallback((parentId: string) => {
    setForm(prev => ({ ...prev, parentId }));
  }, []);

  const handleColorChange = useCallback((color: string) => {
    setForm(prev => ({ ...prev, color }));
  }, []);

  const handleIconChange = useCallback((icon: string) => {
    setForm(prev => ({ ...prev, icon }));
  }, []);

  const handleSortOrderChange = useCallback((sortOrder: number) => {
    setForm(prev => ({ ...prev, sortOrder }));
  }, []);

  const handleSystemChange = useCallback((isSystem: boolean) => {
    setForm(prev => ({ ...prev, isSystem }));
  }, []);

  // Reset form
  const resetForm = () => {
    setForm({
      name: '',
      slug: '',
      description: '',
      categoryType: 'system',
      parentId: '',
      color: '#6366f1',
      icon: 'folder',
      isSystem: false,
      sortOrder: 0
    });
  };

  // Handle create
  const handleCreate = () => {
    resetForm();
    setIsCreateOpen(true);
    trackClick('create_category_dialog_open');
  };

  // Handle add child
  const handleAddChild = (parentCategory: Category) => {
    resetForm();
    setForm(prev => ({
      ...prev,
      parentId: parentCategory.id,
      categoryType: parentCategory.categoryType || 'system',
      color: parentCategory.color || '#6366f1'
    }));
    setIsCreateOpen(true);
    trackClick('add_child_category_dialog_open', { parentId: parentCategory.id });
  };

  // Handle add sibling
  const handleAddSibling = (siblingCategory: Category) => {
    resetForm();
    setForm(prev => ({
      ...prev,
      parentId: siblingCategory.parentId || '',
      categoryType: siblingCategory.categoryType || 'system',
      color: siblingCategory.color || '#6366f1'
    }));
    setIsCreateOpen(true);
    trackClick('add_sibling_category_dialog_open', { siblingId: siblingCategory.id });
  };

  // Handle edit
  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      categoryType: category.categoryType || 'system',
      parentId: category.parentId || '',
      color: category.color || '#6366f1',
      icon: category.icon || 'folder',
      isSystem: category.isSystem,
      sortOrder: category.sortOrder
    });
    setIsEditOpen(true);
    trackClick('edit_category_dialog_open', { categoryId: category.id });
  };

  // Handle delete
  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
    trackClick('delete_category_dialog_open', { categoryId: category.id });
  };

  // Submit create
  const submitCreate = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      setError('Name and slug are required');
      return;
    }

    try {
      setError(null);
      
      const requestPayload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description || '',
        categoryType: form.categoryType,
        parentId: form.parentId === '__root__' || !form.parentId ? null : form.parentId,
        color: form.color || '#6366f1',
        icon: form.icon || 'folder',
        isSystem: form.isSystem,
        sortOrder: form.sortOrder,
        isActive: true
      };

      const response = await fetch('/api/v1/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: Failed to create category`);
      }

      if (result.success && result.data) {
        // Update local state immediately
        if (data) {
          const newCategory = result.data;
          setData(prev => prev ? {
            ...prev,
            categories: [...prev.categories, newCategory],
            stats: {
              ...prev.stats,
              totalCategories: prev.stats.totalCategories + 1,
              activeCategories: newCategory.isActive ? prev.stats.activeCategories + 1 : prev.stats.activeCategories,
              systemCategories: newCategory.isSystem ? prev.stats.systemCategories + 1 : prev.stats.systemCategories
            }
          } : null);
        }

        toast({
          title: "Success",
          description: `Category "${form.name}" created successfully.`
        });

        resetForm();
        setIsCreateOpen(false);
        browserLogger.userAction('category_created', `Created category: ${form.name}`);
      } else {
        throw new Error(result.error || 'Failed to create category');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create category';
      setError(errorMessage);
      browserLogger.error('Failed to create category', { error: errorMessage, formData: form });
    }
  };

  // Submit update
  const submitUpdate = async () => {
    if (!selectedCategory || !form.name.trim() || !form.slug.trim()) {
      setError('Name and slug are required');
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/v1/admin/categories/${selectedCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          parentId: form.parentId === '__root__' ? null : form.parentId || null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update category');
      }

      if (result.success) {
        // Update local state
        if (data && result.data) {
          setData({
            ...data,
            categories: data.categories.map(cat => 
              cat.id === selectedCategory.id ? result.data : cat
            )
          });
        }

        toast({
          title: "Success",
          description: `Category "${form.name}" updated successfully.`
        });

        resetForm();
        setIsEditOpen(false);
        setSelectedCategory(null);
        browserLogger.userAction('category_updated', `Updated category: ${form.name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
      setError(errorMessage);
      browserLogger.error('Failed to update category', { error: errorMessage });
    }
  };

  // Submit delete
  const submitDelete = async () => {
    if (!selectedCategory) return;

    try {
      setError(null);
      const response = await fetch('/api/v1/admin/categories/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCategory.id })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete category');
      }

      if (result.success) {
        // Update local state
        if (data) {
          setData({
            ...data,
            categories: data.categories.filter(cat => cat.id !== selectedCategory.id),
            stats: {
              ...data.stats,
              totalCategories: data.stats.totalCategories - 1,
              activeCategories: selectedCategory.isActive ? data.stats.activeCategories - 1 : data.stats.activeCategories,
              systemCategories: selectedCategory.isSystem ? data.stats.systemCategories - 1 : data.stats.systemCategories
            }
          });
        }

        toast({
          title: "Success",
          description: `Category "${selectedCategory.name}" deleted successfully.`
        });

        setIsDeleteOpen(false);
        setSelectedCategory(null);
        browserLogger.userAction('category_deleted', `Deleted category: ${selectedCategory.name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
      setError(errorMessage);
      browserLogger.error('Failed to delete category', { error: errorMessage });
    }
  };

  // Filter categories
  const filteredCategories = React.useMemo(() => {
    if (!data?.categories) return [];

    return data.categories.filter(category => {
      // Search filter
      const matchesSearch = !searchTerm || 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Type filter
      const matchesType = categoryTypeFilter === 'all' || category.categoryType === categoryTypeFilter;

      // Active filter
      const matchesActive = showInactive || category.isActive;

      // System filter
      const matchesSystem = showSystem || !category.isSystem;

      return matchesSearch && matchesType && matchesActive && matchesSystem;
    }).sort((a, b) => {
      // Sort by level first, then by sort order, then by name
      if (a.level !== b.level) return a.level - b.level;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
  }, [data?.categories, searchTerm, categoryTypeFilter, showInactive, showSystem]);

  // Build hierarchy with proper parent inclusion
  const buildHierarchy = (categories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // Create map and ensure all parent categories are included
    const ensureParentsIncluded = (cats: Category[]): Category[] => {
      const allCategories = new Set(cats);
      const result = [...cats];
      
      // For each category, ensure its parents are included
      cats.forEach(cat => {
        let currentParentId = cat.parentId;
        while (currentParentId) {
          const parent = data?.categories.find(c => c.id === currentParentId);
          if (parent && !allCategories.has(parent)) {
            allCategories.add(parent);
            result.push(parent);
          }
          currentParentId = parent?.parentId;
        }
      });
      
      return result;
    };

    const categoriesWithParents = ensureParentsIncluded(categories);

    // Create map
    categoriesWithParents.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Build hierarchy
    categoriesWithParents.forEach(cat => {
      const categoryWithChildren = categoryMap.get(cat.id)!;
      
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children!.push(categoryWithChildren);
        } else {
          rootCategories.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    // Sort by sortOrder
    const sortCategories = (cats: Category[]): Category[] => {
      return cats.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(cat => ({
        ...cat,
        children: cat.children ? sortCategories(cat.children) : []
      }));
    };

    return sortCategories(rootCategories);
  };

  // Compute hierarchical categories with filtering - optimized with useMemo
  const hierarchicalCategories = useMemo(() => {
    if (!data?.categories) return [];
    
    // Apply filters
    const filteredCategories = data.categories.filter(category => {
      const matchesSearch = !searchTerm || 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = categoryTypeFilter === 'all' || category.categoryType === categoryTypeFilter;
      const matchesActive = showInactive || category.isActive;
      const matchesSystem = showSystem || !category.isSystem;
      
      return matchesSearch && matchesType && matchesActive && matchesSystem;
    });

    return buildHierarchy(filteredCategories);
  }, [data?.categories, searchTerm, categoryTypeFilter, showInactive, showSystem]);

  // Toggle expand/collapse
  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Render category tree - using database level for proper indentation
  const renderCategory = (category: Category): React.ReactNode => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const indentLevel = category.level * 32; // Increased indentation for better visibility

    return (
      <div key={category.id} className="category-item">
        <div 
          className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors border-l-4 relative"
          style={{ 
            marginLeft: `${indentLevel}px`,
            borderLeftColor: category.color || '#6366f1'
          }}
        >
          {/* Hierarchy connector lines */}
          {category.level > 0 && (
            <div 
              className="absolute left-0 top-0 w-px bg-border"
              style={{ 
                height: '50%',
                left: `${indentLevel - 16}px`
              }}
            />
          )}
          {category.level > 0 && (
            <div 
              className="absolute left-0 top-1/2 h-px bg-border"
              style={{ 
                width: '16px',
                left: `${indentLevel - 16}px`
              }}
            />
          )}

          {/* Expand/Collapse */}
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(category.id)}
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
            </div>
          )}

          {/* Icon */}
          <div 
            className="flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0"
            style={{ backgroundColor: `${category.color || '#6366f1'}20` }}
          >
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4" style={{ color: category.color || '#6366f1' }} />
              ) : (
                <Folder className="h-4 w-4" style={{ color: category.color || '#6366f1' }} />
              )
            ) : (
              <Hash className="h-3 w-3" style={{ color: category.color || '#6366f1' }} />
            )}
          </div>

          {/* Name and details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-sm truncate">{category.name}</h4>
              <Badge variant="outline" className="text-xs">
                L{category.level}
              </Badge>
              {category.categoryType && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {category.categoryType}
                </Badge>
              )}
              {category.isSystem && (
                <Badge variant="destructive" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  System
                </Badge>
              )}
              {!category.isActive && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
              {hasChildren && (
                <Badge variant="outline" className="text-xs text-blue-600">
                  {category.children!.length} child{category.children!.length !== 1 ? 'ren' : ''}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              /{category.slug}
              {category.description && ` • ${category.description}`}
            </p>
          </div>

          {/* Actions */}
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(category)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {category.level < 2 && (
                  <DropdownMenuItem onClick={() => handleAddChild(category)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Child
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleAddSibling(category)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sibling
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleDelete(category)}
                  className="text-destructive"
                  disabled={category.isSystem}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {category.children!.map(child => renderCategory(child))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading || loading) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You must be authenticated to access this page.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories Management</h1>
          <p className="text-muted-foreground">
            Manage hierarchical categories with proper scope and ordering
          </p>
        </div>
        {canManage && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Category
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      {data?.stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Categories"
            value={data.stats.totalCategories}
            description="All categories in hierarchy"
            icon={FolderTree}
          />
          <StatCard
            title="System Protected"
            value={data.stats.systemCategories}
            description="Protected from deletion"
            icon={Shield}
            color="warning"
          />
          <StatCard
            title="Active Categories"
            value={data.stats.activeCategories}
            description="Currently active categories"
            icon={CheckCircle}
            color="success"
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={categoryTypeFilter} onValueChange={setCategoryTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {CATEGORY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={showInactive ? "default" : "outline"}
                onClick={() => setShowInactive(!showInactive)}
                size="sm"
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Show Inactive
              </Button>
              <Button
                variant={showSystem ? "default" : "outline"}
                onClick={() => setShowSystem(!showSystem)}
                size="sm"
              >
                <Shield className="h-4 w-4 mr-2" />
                Show System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle>Category Hierarchy</CardTitle>
          <p className="text-sm text-muted-foreground">
            Hierarchical structure with category types and proper ordering. System categories cannot be deleted.
          </p>
        </CardHeader>
        <CardContent>
          {hierarchicalCategories.length > 0 ? (
            <div className="space-y-1">
              {hierarchicalCategories.map(category => renderCategory(category))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No categories found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
            <DialogDescription>
              Create a new category with proper hierarchy and scope.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Category name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="category-slug"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Category description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="categoryType">Category Type *</Label>
              <Select 
                value={form.categoryType} 
                onValueChange={(value) => handleCategoryTypeChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category type" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span>{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="parent">Parent Category</Label>
              <Select 
                value={form.parentId} 
                onValueChange={(value) => handleParentIdChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__root__">None (Root Category)</SelectItem>
                  {data?.categories
                    .filter(cat => cat.level < 2) // Max 3 levels
                    .map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {'  '.repeat(category.level)}└─ {category.name} (Level {category.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={form.color}
                  onChange={(e) => handleColorChange(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => handleSortOrderChange(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="icon">Icon</Label>
              <LucideIconPicker
                value={form.icon}
                onChange={(value) => handleIconChange(value)}
                placeholder="Select an icon..."
              />
            </div>
            {canManage && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isSystem"
                  checked={form.isSystem}
                  onCheckedChange={(checked) => handleSystemChange(checked as boolean)}
                />
                <Label htmlFor="isSystem">System Category</Label>
              </div>
            )}
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitCreate} disabled={!form.name.trim() || !form.slug.trim()}>
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Make changes to the category. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Category name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-slug">Slug *</Label>
              <Input
                id="edit-slug"
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="category-slug"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={form.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Category description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-categoryType">Category Type *</Label>
              <Select 
                value={form.categoryType} 
                onValueChange={(value) => handleCategoryTypeChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category type" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span>{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-parent">Parent Category</Label>
              <Select 
                value={form.parentId} 
                onValueChange={(value) => handleParentIdChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__root__">None (Root Category)</SelectItem>
                  {data?.categories
                    .filter(cat => cat.level < 2 && cat.id !== selectedCategory?.id) // Exclude self
                    .map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {'  '.repeat(category.level)}└─ {category.name} (Level {category.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-color">Color</Label>
                <Input
                  id="edit-color"
                  type="color"
                  value={form.color}
                  onChange={(e) => handleColorChange(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-sortOrder">Sort Order</Label>
                <Input
                  id="edit-sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => handleSortOrderChange(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-icon">Icon</Label>
              <LucideIconPicker
                value={form.icon}
                onChange={(value) => handleIconChange(value)}
                placeholder="Select an icon..."
              />
            </div>
            {canManage && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isSystem"
                  checked={form.isSystem}
                  onCheckedChange={(checked) => handleSystemChange(checked as boolean)}
                />
                <Label htmlFor="edit-isSystem">System Category</Label>
              </div>
            )}
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitUpdate} disabled={!form.name.trim() || !form.slug.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedCategory?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Any child categories and entities associated with this category will lose their association.
            </p>
            {selectedCategory?.isSystem && (
              <Alert variant="destructive" className="mt-4">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  This is a system category and cannot be deleted.
                </AlertDescription>
              </Alert>
            )}
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={submitDelete}
              disabled={selectedCategory?.isSystem}
            >
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 