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
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Download,
  Upload,
  Hash,
  TrendingUp,
  Eye,
  BarChart3,
  Clock,
  MoreHorizontal,
  Copy,
  Settings,
  Merge,
  Star,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  Palette,
  Globe,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface TagData {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  isActive: boolean;
  usage: {
    totalItems: number;
    recentUses: number;
    popularity: number;
  };
  analytics: {
    clickRate: number;
    conversionRate: number;
    revenue: number;
  };
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

interface TagFormData {
  name: string;
  slug: string;
  description: string;
  color: string;
  isActive: boolean;
  categories: string[];
}

// Mock data
const mockTags: TagData[] = [
  {
    id: '1',
    name: 'High Fashion',
    slug: 'high-fashion',
    description: 'Luxury and haute couture fashion projects',
    color: '#e91e63',
    isActive: true,
    usage: {
      totalItems: 89,
      recentUses: 12,
      popularity: 95
    },
    analytics: {
      clickRate: 8.5,
      conversionRate: 12.3,
      revenue: 45600
    },
    categories: ['Fashion & Beauty', 'Editorial Fashion'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-22T14:30:00Z'
  },
  {
    id: '2',
    name: 'Beauty Campaigns',
    slug: 'beauty-campaigns',
    description: 'Commercial beauty and cosmetics work',
    color: '#9c27b0',
    isActive: true,
    usage: {
      totalItems: 67,
      recentUses: 8,
      popularity: 87
    },
    analytics: {
      clickRate: 7.2,
      conversionRate: 15.1,
      revenue: 32400
    },
    categories: ['Fashion & Beauty', 'Commercial Beauty'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-21T09:15:00Z'
  },
  {
    id: '3',
    name: 'Street Style',
    slug: 'street-style',
    description: 'Urban fashion and lifestyle photography',
    color: '#ff9800',
    isActive: true,
    usage: {
      totalItems: 45,
      recentUses: 15,
      popularity: 78
    },
    analytics: {
      clickRate: 6.8,
      conversionRate: 9.7,
      revenue: 18900
    },
    categories: ['Fashion & Beauty'],
    createdAt: '2024-01-16T12:00:00Z',
    updatedAt: '2024-01-22T16:45:00Z'
  },
  {
    id: '4',
    name: 'Corporate Headshots',
    slug: 'corporate-headshots',
    description: 'Professional business portraits',
    color: '#2196f3',
    isActive: true,
    usage: {
      totalItems: 123,
      recentUses: 6,
      popularity: 92
    },
    analytics: {
      clickRate: 5.4,
      conversionRate: 18.9,
      revenue: 56700
    },
    categories: ['Commercial & Corporate'],
    createdAt: '2024-01-14T08:30:00Z',
    updatedAt: '2024-01-20T11:20:00Z'
  },
  {
    id: '5',
    name: 'Fitness Wear',
    slug: 'fitness-wear',
    description: 'Athletic and activewear modeling',
    color: '#4caf50',
    isActive: true,
    usage: {
      totalItems: 56,
      recentUses: 9,
      popularity: 83
    },
    analytics: {
      clickRate: 7.9,
      conversionRate: 14.2,
      revenue: 28400
    },
    categories: ['Fitness & Sports'],
    createdAt: '2024-01-17T14:00:00Z',
    updatedAt: '2024-01-22T10:30:00Z'
  },
  {
    id: '6',
    name: 'Vintage Style',
    slug: 'vintage-style',
    description: 'Retro and vintage-inspired fashion',
    color: '#795548',
    isActive: false,
    usage: {
      totalItems: 23,
      recentUses: 1,
      popularity: 34
    },
    analytics: {
      clickRate: 3.1,
      conversionRate: 6.8,
      revenue: 8900
    },
    categories: ['Alternative & Creative'],
    createdAt: '2024-01-12T16:45:00Z',
    updatedAt: '2024-01-18T13:15:00Z'
  },
  {
    id: '7',
    name: 'Luxury Brands',
    slug: 'luxury-brands',
    description: 'High-end brand collaborations',
    color: '#ffc107',
    isActive: true,
    usage: {
      totalItems: 34,
      recentUses: 4,
      popularity: 91
    },
    analytics: {
      clickRate: 9.2,
      conversionRate: 22.5,
      revenue: 78300
    },
    categories: ['Fashion & Beauty', 'Commercial & Corporate'],
    createdAt: '2024-01-13T11:30:00Z',
    updatedAt: '2024-01-21T15:00:00Z'
  },
  {
    id: '8',
    name: 'Plus Size',
    slug: 'plus-size',
    description: 'Plus size and body positive modeling',
    color: '#e91e63',
    isActive: true,
    usage: {
      totalItems: 41,
      recentUses: 7,
      popularity: 76
    },
    analytics: {
      clickRate: 6.3,
      conversionRate: 11.4,
      revenue: 19600
    },
    categories: ['Fashion & Beauty'],
    createdAt: '2024-01-15T13:20:00Z',
    updatedAt: '2024-01-22T08:45:00Z'
  }
];

const mockCategories = [
  'Fashion & Beauty',
  'Commercial & Corporate', 
  'Fitness & Sports',
  'Alternative & Creative',
  'Editorial Fashion',
  'Commercial Beauty'
];

// API Functions
async function fetchTags(): Promise<TagData[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockTags), 500);
  });
}

async function createTag(data: TagFormData): Promise<TagData> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      usage: {
        totalItems: 0,
        recentUses: 0,
        popularity: 0
      },
      analytics: {
        clickRate: 0,
        conversionRate: 0,
        revenue: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }), 1000);
  });
}

async function updateTag(id: string, data: Partial<TagFormData>): Promise<TagData> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      id,
      name: data.name || 'Updated Tag',
      slug: data.slug || 'updated-tag',
      description: data.description || '',
      color: data.color || '#2196f3',
      isActive: data.isActive ?? true,
      categories: data.categories || [],
      usage: {
        totalItems: 0,
        recentUses: 0,
        popularity: 0
      },
      analytics: {
        clickRate: 0,
        conversionRate: 0,
        revenue: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }), 1000);
  });
}

async function deleteTag(id: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 1000);
  });
}

async function mergeTags(sourceId: string, targetId: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 1000);
  });
}

function TagForm({ tag, onSubmit, onCancel }: {
  tag?: TagData;
  onSubmit: (data: TagFormData) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<TagFormData>({
    name: tag?.name || '',
    slug: tag?.slug || '',
    description: tag?.description || '',
    color: tag?.color || '#2196f3',
    isActive: tag?.isActive ?? true,
    categories: tag?.categories || []
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
          <Label htmlFor="name">Tag Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="High Fashion"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">URL Slug</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            placeholder="high-fashion"
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
          placeholder="Describe this tag..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="color">Tag Color</Label>
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
          <Label>Status</Label>
          <div className="flex items-center space-x-2 mt-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Associated Categories</Label>
        <div className="grid grid-cols-2 gap-2">
          {mockCategories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={category}
                checked={formData.categories.includes(category)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      categories: [...prev.categories, category]
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      categories: prev.categories.filter(c => c !== category)
                    }));
                  }
                }}
                className="rounded border-gray-300"
              />
              <Label htmlFor={category} className="text-sm">{category}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {tag ? 'Update Tag' : 'Create Tag'}
        </Button>
      </div>
    </form>
  );
}

export function TagsClientPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'popularity' | 'usage' | 'revenue'>('popularity');
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Queries
  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag created successfully');
      setCreateDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to create tag');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TagFormData> }) =>
      updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag updated successfully');
      setEditDialogOpen(false);
      setEditingTag(null);
    },
    onError: () => {
      toast.error('Failed to update tag');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete tag');
    },
  });

  const mergeMutation = useMutation({
    mutationFn: ({ sourceId, targetId }: { sourceId: string; targetId: string }) =>
      mergeTags(sourceId, targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tags merged successfully');
      setMergeDialogOpen(false);
      setSelectedTags([]);
    },
    onError: () => {
      toast.error('Failed to merge tags');
    },
  });

  const handleEdit = (tag: TagData) => {
    setEditingTag(tag);
    setEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this tag? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    updateMutation.mutate({
      id,
      data: { isActive }
    });
  };

  const filteredAndSortedTags = tags?.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tag.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || tag.categories.includes(selectedCategory);
    const matchesStatus = showInactive ? true : tag.isActive;
    
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'popularity':
        return b.usage.popularity - a.usage.popularity;
      case 'usage':
        return b.usage.totalItems - a.usage.totalItems;
      case 'revenue':
        return b.analytics.revenue - a.analytics.revenue;
      default:
        return 0;
    }
  }) || [];

  const totalTags = tags?.length || 0;
  const activeTags = tags?.filter(t => t.isActive).length || 0;
  const totalUsage = tags?.reduce((sum, t) => sum + t.usage.totalItems, 0) || 0;
  const totalRevenue = tags?.reduce((sum, t) => sum + t.analytics.revenue, 0) || 0;

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground">
            Manage tags to help users discover and categorize content
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {selectedTags.length === 2 && (
            <Button variant="outline" onClick={() => setMergeDialogOpen(true)}>
              <Merge className="h-4 w-4 mr-2" />
              Merge Tags
            </Button>
          )}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Tag
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Tag</DialogTitle>
                <DialogDescription>
                  Add a new tag to help categorize and organize content
                </DialogDescription>
              </DialogHeader>
              <TagForm
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
            <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTags}</div>
            <p className="text-xs text-muted-foreground">
              {activeTags} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Items tagged
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From tagged content
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Popularity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tags?.length ? 
                Math.round(tags.reduce((sum, t) => sum + t.usage.popularity, 0) / tags.length) : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all tags
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Tag List</TabsTrigger>
          <TabsTrigger value="cloud">Tag Cloud</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {mockCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="usage">Usage</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Switch
                id="showInactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="showInactive">Show Inactive</Label>
            </div>
          </div>

          {/* Tags Table */}
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTags(filteredAndSortedTags.map(t => t.id));
                          } else {
                            setSelectedTags([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTags.length > 0 ? (
                    filteredAndSortedTags.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTags(prev => [...prev, tag.id]);
                              } else {
                                setSelectedTags(prev => prev.filter(id => id !== tag.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{tag.name}</span>
                                {!tag.isActive && (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{tag.slug}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {tag.categories.slice(0, 2).map((category) => (
                              <Badge key={category} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                            {tag.categories.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{tag.categories.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{tag.usage.totalItems} items</div>
                            <div className="text-muted-foreground">
                              {tag.usage.popularity}% popularity
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              ${tag.analytics.revenue.toLocaleString()}
                            </div>
                            <div className="text-muted-foreground">
                              {tag.analytics.conversionRate}% conversion
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(tag.id, !tag.isActive)}
                            >
                              {tag.isActive ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(tag)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Tag
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  View Analytics
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Usage
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDelete(tag.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Tag
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <EmptyState
                          icon={Tag}
                          title="No tags found"
                          description="Create your first tag to help organize and categorize content"
                          action={
                            <Button onClick={() => setCreateDialogOpen(true)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Create Tag
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

        <TabsContent value="cloud" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tag Cloud</CardTitle>
              <CardDescription>
                Visual representation of tag popularity and usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 justify-center">
                {filteredAndSortedTags.map((tag) => {
                  const size = Math.max(12, Math.min(28, tag.usage.popularity * 0.3 + 12));
                  return (
                    <button
                      key={tag.id}
                      className="transition-all hover:scale-110"
                      style={{
                        fontSize: `${size}px`,
                        color: tag.color,
                        opacity: tag.isActive ? 1 : 0.5
                      }}
                      onClick={() => handleEdit(tag)}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAndSortedTags.slice(0, 8).map((tag) => (
              <Card key={tag.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <CardTitle className="text-lg">{tag.name}</CardTitle>
                    </div>
                    <Badge variant={tag.isActive ? 'default' : 'secondary'}>
                      {tag.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Usage</div>
                      <div className="text-xl font-bold">{tag.usage.totalItems}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Recent Uses</div>
                      <div className="text-xl font-bold">{tag.usage.recentUses}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Click Rate</div>
                      <div className="text-xl font-bold">{tag.analytics.clickRate}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Conversion</div>
                      <div className="text-xl font-bold">{tag.analytics.conversionRate}%</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-muted-foreground text-sm mb-1">Revenue Generated</div>
                    <div className="text-2xl font-bold">${tag.analytics.revenue.toLocaleString()}</div>
                  </div>

                  <div>
                    <div className="text-muted-foreground text-sm mb-2">Associated Categories</div>
                    <div className="flex flex-wrap gap-1">
                      {tag.categories.map((category) => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
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
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Update the tag information and settings
            </DialogDescription>
          </DialogHeader>
          {editingTag && (
            <TagForm
              tag={editingTag}
              onSubmit={(data) => updateMutation.mutate({ id: editingTag.id, data })}
              onCancel={() => {
                setEditDialogOpen(false);
                setEditingTag(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Tags</DialogTitle>
            <DialogDescription>
              Merge two tags together. All items tagged with the source tag will be re-tagged with the target tag.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. The source tag will be permanently deleted.
              </AlertDescription>
            </Alert>
            
            {selectedTags.length === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Source Tag (will be deleted)</Label>
                    <div className="p-3 border rounded">
                      {tags?.find(t => t.id === selectedTags[0])?.name}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Tag (will keep items)</Label>
                    <div className="p-3 border rounded">
                      {tags?.find(t => t.id === selectedTags[1])?.name}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => mergeMutation.mutate({ 
                      sourceId: selectedTags[0], 
                      targetId: selectedTags[1] 
                    })}
                    disabled={mergeMutation.isPending}
                  >
                    Merge Tags
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}