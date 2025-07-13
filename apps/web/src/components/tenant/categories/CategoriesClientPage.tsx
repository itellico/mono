'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  FolderTree, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  EyeOff,
  Image,
  Hash,
  Users,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreHorizontal,
  Move,
  Copy,
  Settings,
  ArrowRight,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Tag,
  Palette,
  Globe,
  Star,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId?: string;
  children?: Category[];
  isActive: boolean;
  isVisible: boolean;
  color: string;
  icon?: string;
  image?: string;
  sortOrder: number;
  metadata: {
    totalItems: number;
    activeItems: number;
    totalRevenue: number;
    conversionRate: number;
  };
  seo: {
    title?: string;
    description?: string;
    keywords: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  parentId?: string;
  isActive: boolean;
  isVisible: boolean;
  color: string;
  icon?: string;
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
}

// Mock data
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Fashion & Beauty',
    slug: 'fashion-beauty',
    description: 'Fashion models, beauty shots, and lifestyle photography',
    isActive: true,
    isVisible: true,
    color: '#e91e63',
    icon: '👗',
    sortOrder: 1,
    metadata: {
      totalItems: 156,
      activeItems: 142,
      totalRevenue: 45600,
      conversionRate: 12.5
    },
    seo: {
      title: 'Fashion & Beauty Models | ClickDami',
      description: 'Discover talented fashion and beauty models for your next campaign',
      keywords: ['fashion', 'beauty', 'models', 'photography']
    },
    children: [
      {
        id: '1-1',
        name: 'Editorial Fashion',
        slug: 'editorial-fashion',
        description: 'High-fashion editorial models',
        parentId: '1',
        isActive: true,
        isVisible: true,
        color: '#e91e63',
        sortOrder: 1,
        metadata: {
          totalItems: 45,
          activeItems: 42,
          totalRevenue: 18500,
          conversionRate: 15.2
        },
        seo: {
          keywords: ['editorial', 'fashion', 'high-fashion']
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z'
      },
      {
        id: '1-2',
        name: 'Commercial Beauty',
        slug: 'commercial-beauty',
        description: 'Beauty and cosmetics modeling',
        parentId: '1',
        isActive: true,
        isVisible: true,
        color: '#e91e63',
        sortOrder: 2,
        metadata: {
          totalItems: 67,
          activeItems: 61,
          totalRevenue: 22100,
          conversionRate: 11.8
        },
        seo: {
          keywords: ['beauty', 'cosmetics', 'commercial']
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z'
      }
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  },
  {
    id: '2',
    name: 'Commercial & Corporate',
    slug: 'commercial-corporate',
    description: 'Business headshots, corporate events, and commercial work',
    isActive: true,
    isVisible: true,
    color: '#2196f3',
    icon: '💼',
    sortOrder: 2,
    metadata: {
      totalItems: 89,
      activeItems: 84,
      totalRevenue: 32400,
      conversionRate: 9.8
    },
    seo: {
      title: 'Commercial & Corporate Models | ClickDami',
      description: 'Professional models for business and corporate needs',
      keywords: ['commercial', 'corporate', 'business', 'headshots']
    },
    children: [],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  },
  {
    id: '3',
    name: 'Fitness & Sports',
    slug: 'fitness-sports',
    description: 'Athletic models, fitness photography, and sports campaigns',
    isActive: true,
    isVisible: true,
    color: '#4caf50',
    icon: '💪',
    sortOrder: 3,
    metadata: {
      totalItems: 78,
      activeItems: 71,
      totalRevenue: 28900,
      conversionRate: 14.2
    },
    seo: {
      title: 'Fitness & Sports Models | ClickDami',
      description: 'Athletic and fitness models for sports campaigns and activewear',
      keywords: ['fitness', 'sports', 'athletic', 'activewear']
    },
    children: [],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  },
  {
    id: '4',
    name: 'Alternative & Creative',
    slug: 'alternative-creative',
    description: 'Alternative looks, creative concepts, and artistic modeling',
    isActive: false,
    isVisible: true,
    color: '#9c27b0',
    icon: '🎨',
    sortOrder: 4,
    metadata: {
      totalItems: 34,
      activeItems: 0,
      totalRevenue: 0,
      conversionRate: 0
    },
    seo: {
      title: 'Alternative & Creative Models | ClickDami',
      description: 'Unique and creative models for artistic projects',
      keywords: ['alternative', 'creative', 'artistic', 'unique']
    },
    children: [],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  }
];

// API Functions
async function fetchCategories(): Promise<Category[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockCategories), 500);
  });
}

async function createCategory(data: CategoryFormData): Promise<Category> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      metadata: {
        totalItems: 0,
        activeItems: 0,
        totalRevenue: 0,
        conversionRate: 0
      },
      seo: {
        title: data.seoTitle,
        description: data.seoDescription,
        keywords: data.seoKeywords
      },
      children: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }), 1000);
  });
}

async function updateCategory(id: string, data: Partial<CategoryFormData>): Promise<Category> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      id,
      name: data.name || 'Updated Category',
      slug: data.slug || 'updated-category',
      description: data.description || '',
      isActive: data.isActive ?? true,
      isVisible: data.isVisible ?? true,
      color: data.color || '#2196f3',
      icon: data.icon,
      image: data.image,
      sortOrder: 1,
      metadata: {
        totalItems: 0,
        activeItems: 0,
        totalRevenue: 0,
        conversionRate: 0
      },
      seo: {
        title: data.seoTitle,
        description: data.seoDescription,
        keywords: data.seoKeywords || []
      },
      children: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }), 1000);
  });
}

async function deleteCategory(id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 1000);
  });
}

async function reorderCategories(categoryIds: string[]): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 1000);
  });
}

function CategoryItem({ category, level = 0, onEdit, onDelete, onToggleVisibility }: {
  category: Category;
  level?: number;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <>
      <TableRow className={level > 0 ? 'bg-muted/30' : ''}>
        <TableCell>
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            ) : (
              <div className="w-6" />
            )}
            
            <div className="flex items-center gap-2">
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-blue-500" />
                ) : (
                  <Folder className="h-4 w-4 text-blue-500" />
                )
              ) : (
                <Tag className="h-4 w-4 text-gray-400" />
              )}
              
              {category.icon && (
                <span className="text-sm">{category.icon}</span>
              )}
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{category.name}</span>
                  {!category.isActive && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{category.slug}</p>
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="max-w-md">
            <p className="text-sm truncate">{category.description}</p>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-sm font-mono">{category.color}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            <div className="font-medium">{category.metadata.totalItems} items</div>
            <div className="text-muted-foreground">
              {category.metadata.activeItems} active
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            <div className="font-medium">
              ${category.metadata.totalRevenue.toLocaleString()}
            </div>
            <div className="text-muted-foreground">
              {category.metadata.conversionRate}% conversion
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleVisibility(category.id, !category.isVisible)}
            >
              {category.isVisible ? (
                <Eye className="h-4 w-4 text-green-500" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-400" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(category)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Category
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Move className="h-4 w-4 mr-2" />
                  Move
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Category Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => onDelete(category.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Category
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
      
      {isExpanded && hasChildren && category.children?.map((child) => (
        <CategoryItem
          key={child.id}
          category={child}
          level={level + 1}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleVisibility={onToggleVisibility}
        />
      ))}
    </>
  );
}

function CategoryForm({ category, onSubmit, onCancel }: {
  category?: Category;
  onSubmit: (data: CategoryFormData) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    parentId: category?.parentId,
    isActive: category?.isActive ?? true,
    isVisible: category?.isVisible ?? true,
    color: category?.color || '#2196f3',
    icon: category?.icon,
    image: category?.image,
    seoTitle: category?.seo?.title,
    seoDescription: category?.seo?.description,
    seoKeywords: category?.seo?.keywords || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Category Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Fashion & Beauty"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">URL Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            placeholder="fashion-beauty"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe this category..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="color">Category Color</Label>
          <div className="flex gap-2">
            <Input
              id="color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              className="w-16 h-10 p-1"
            />
            <Input
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              placeholder="#2196f3"
              className="flex-1"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="icon">Icon (Emoji)</Label>
          <Input
            id="icon"
            value={formData.icon || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
            placeholder="👗"
            maxLength={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parent">Parent Category</Label>
          <Select
            value={formData.parentId || ''}
            onValueChange={(value) => setFormData(prev => ({ ...prev, parentId: value || undefined }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="None (Top Level)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None (Top Level)</SelectItem>
              <SelectItem value="1">Fashion & Beauty</SelectItem>
              <SelectItem value="2">Commercial & Corporate</SelectItem>
              <SelectItem value="3">Fitness & Sports</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isVisible"
            checked={formData.isVisible}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVisible: checked }))}
          />
          <Label htmlFor="isVisible">Visible in Navigation</Label>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="font-medium">SEO Settings</h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input
              id="seoTitle"
              value={formData.seoTitle || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
              placeholder="Fashion & Beauty Models | ClickDami"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seoDescription">SEO Description</Label>
            <Textarea
              id="seoDescription"
              value={formData.seoDescription || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
              placeholder="Discover talented fashion and beauty models..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seoKeywords">SEO Keywords (comma-separated)</Label>
            <Input
              id="seoKeywords"
              value={formData.seoKeywords.join(', ')}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                seoKeywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
              }))}
              placeholder="fashion, beauty, models, photography"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {category ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}

export function CategoriesClientPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Queries
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully');
      setCreateDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to create category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryFormData> }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated successfully');
      setEditDialogOpen(false);
      setEditingCategory(null);
    },
    onError: () => {
      toast.error('Failed to update category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete category');
    },
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleVisibility = (id: string, visible: boolean) => {
    updateMutation.mutate({
      id,
      data: { isVisible: visible }
    });
  };

  const filteredCategories = categories?.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = showInactive ? true : category.isActive;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const totalCategories = categories?.length || 0;
  const activeCategories = categories?.filter(c => c.isActive).length || 0;
  const totalItems = categories?.reduce((sum, c) => sum + c.metadata.totalItems, 0) || 0;
  const totalRevenue = categories?.reduce((sum, c) => sum + c.metadata.totalRevenue, 0) || 0;

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Organize your marketplace content with categories and subcategories
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
                <DialogDescription>
                  Add a new category to organize your marketplace content
                </DialogDescription>
              </DialogHeader>
              <CategoryForm
                onSubmit={(data) => createMutation.mutate(data)}
                onCancel={() => setCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              {activeCategories} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From categorized items
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Conversion</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories?.length ? 
                Math.round(categories.reduce((sum, c) => sum + c.metadata.conversionRate, 0) / categories.length) : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Across categories
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Category List</TabsTrigger>
          <TabsTrigger value="tree">Tree View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="showInactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="showInactive">Show Inactive</Label>
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>

          {/* Categories Table */}
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <CategoryItem
                        key={category.id}
                        category={category}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleVisibility={handleToggleVisibility}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <EmptyState
                          icon={FolderTree}
                          title="No categories found"
                          description="Create your first category to organize your marketplace content"
                          action={
                            <Button onClick={() => setCreateDialogOpen(true)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Create Category
                            </Button>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tree" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Hierarchy</CardTitle>
              <CardDescription>
                Drag and drop to reorganize your category structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FolderOpen className="h-5 w-5 text-blue-500" />
                        {category.icon && <span>{category.icon}</span>}
                        <div>
                          <h4 className="font-medium">{category.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {category.metadata.totalItems} items
                          </p>
                        </div>
                      </div>
                      <Badge variant={category.isActive ? 'default' : 'secondary'}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    {category.children && category.children.length > 0 && (
                      <div className="ml-8 mt-3 space-y-2">
                        {category.children.map((child) => (
                          <div key={child.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                            <Tag className="h-4 w-4 text-gray-400" />
                            <div className="flex-1">
                              <span className="text-sm font-medium">{child.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({child.metadata.totalItems} items)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCategories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {category.icon && <span>{category.icon}</span>}
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </div>
                    <Badge variant={category.isActive ? 'default' : 'secondary'}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Items</div>
                      <div className="text-xl font-bold">{category.metadata.totalItems}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Active Items</div>
                      <div className="text-xl font-bold">{category.metadata.activeItems}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Revenue</div>
                      <div className="text-xl font-bold">${category.metadata.totalRevenue.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Conversion</div>
                      <div className="text-xl font-bold">{category.metadata.conversionRate}%</div>
                    </div>
                  </div>
                  
                  {category.children && category.children.length > 0 && (
                    <div>
                      <h5 className="font-medium mb-2">Subcategories</h5>
                      <div className="space-y-1">
                        {category.children.map((child) => (
                          <div key={child.id} className="flex justify-between text-sm">
                            <span>{child.name}</span>
                            <span className="text-muted-foreground">
                              {child.metadata.totalItems} items
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category information and settings
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              category={editingCategory}
              onSubmit={(data) => updateMutation.mutate({ id: editingCategory.id, data })}
              onCancel={() => {
                setEditDialogOpen(false);
                setEditingCategory(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}