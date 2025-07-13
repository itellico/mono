'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  Tag,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  TrendingUp,
  Users,
  Calendar,
  Hash,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Move,
  Link,
  Unlink,
  Star,
  Archive,
  RefreshCw,
  Download,
  Upload,
  Merge,
  Split
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { toast } from 'sonner';

interface TagData {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  usageCount: number;
  isActive: boolean;
  isSystem: boolean;
  isFeatured?: boolean;
  parentId?: number;
  children?: TagData[];
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: number;
    name: string;
  };
  metadata?: {
    color?: string;
    icon?: string;
    aliases?: string[];
    relatedTags?: number[];
  };
}

interface TagManagerProps {
  /**
   * Whether to show the hierarchy view
   * @default true
   */
  showHierarchy?: boolean;
  /**
   * Whether to allow tag creation
   * @default true
   */
  allowCreate?: boolean;
  /**
   * Whether to allow tag editing
   * @default true
   */
  allowEdit?: boolean;
  /**
   * Whether to allow tag deletion
   * @default true
   */
  allowDelete?: boolean;
  /**
   * Whether to show analytics
   * @default true
   */
  showAnalytics?: boolean;
  /**
   * Maximum tags to display per page
   * @default 50
   */
  pageSize?: number;
  /**
   * Callback when tags are updated
   */
  onTagsChange?: (tags: TagData[]) => void;
  /**
   * Custom className
   */
  className?: string;
}

// Mock data for demonstration
const mockTags: TagData[] = [
  {
    id: 1,
    uuid: 'tag-1-uuid',
    name: 'Photography',
    slug: 'photography',
    description: 'All photography related content',
    category: 'content-type',
    usageCount: 156,
    isActive: true,
    isSystem: false,
    isFeatured: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    createdBy: { id: 1, name: 'Admin User' },
    children: [
      {
        id: 11,
        uuid: 'tag-11-uuid',
        name: 'Portrait',
        slug: 'portrait',
        parentId: 1,
        usageCount: 89,
        isActive: true,
        isSystem: false,
        createdAt: '2024-01-16T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z'
      },
      {
        id: 12,
        uuid: 'tag-12-uuid',
        name: 'Fashion',
        slug: 'fashion',
        parentId: 1,
        usageCount: 67,
        isActive: true,
        isSystem: false,
        createdAt: '2024-01-16T11:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z'
      }
    ],
    metadata: {
      color: '#3B82F6',
      icon: 'camera',
      aliases: ['photo', 'pics', 'images'],
      relatedTags: [2, 3]
    }
  },
  {
    id: 2,
    uuid: 'tag-2-uuid',
    name: 'Modeling',
    slug: 'modeling',
    description: 'Modeling and talent related content',
    category: 'industry',
    usageCount: 134,
    isActive: true,
    isSystem: false,
    isFeatured: true,
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-20T16:00:00Z',
    children: [
      {
        id: 21,
        uuid: 'tag-21-uuid',
        name: 'Runway',
        slug: 'runway',
        parentId: 2,
        usageCount: 45,
        isActive: true,
        isSystem: false,
        createdAt: '2024-01-17T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z'
      }
    ],
    metadata: {
      color: '#10B981',
      icon: 'user'
    }
  },
  {
    id: 3,
    uuid: 'tag-3-uuid',
    name: 'Commercial',
    slug: 'commercial',
    description: 'Commercial and business related projects',
    category: 'project-type',
    usageCount: 98,
    isActive: true,
    isSystem: false,
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: '2024-01-20T14:15:00Z',
    metadata: {
      color: '#F59E0B',
      icon: 'briefcase'
    }
  },
  {
    id: 4,
    uuid: 'tag-4-uuid',
    name: 'Editorial',
    slug: 'editorial',
    description: 'Editorial and artistic content',
    category: 'project-type',
    usageCount: 76,
    isActive: true,
    isSystem: false,
    createdAt: '2024-01-15T13:00:00Z',
    updatedAt: '2024-01-20T13:45:00Z',
    metadata: {
      color: '#8B5CF6',
      icon: 'book'
    }
  },
  {
    id: 5,
    uuid: 'tag-5-uuid',
    name: 'Beauty',
    slug: 'beauty',
    description: 'Beauty and cosmetics related content',
    category: 'style',
    usageCount: 62,
    isActive: true,
    isSystem: false,
    createdAt: '2024-01-15T14:00:00Z',
    updatedAt: '2024-01-20T12:30:00Z',
    metadata: {
      color: '#EC4899',
      icon: 'sparkles'
    }
  }
];

interface TagFormData {
  name: string;
  slug: string;
  description: string;
  category: string;
  isActive: boolean;
  isFeatured: boolean;
  parentId?: number;
  color: string;
  icon: string;
  aliases: string[];
}

interface TagEditDialogProps {
  tag: TagData | null;
  parentTags: TagData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (tagData: TagFormData) => void;
}

function TagEditDialog({ tag, parentTags, open, onOpenChange, onSave }: TagEditDialogProps) {
  const [formData, setFormData] = useState<TagFormData>({
    name: '',
    slug: '',
    description: '',
    category: '',
    isActive: true,
    isFeatured: false,
    color: '#3B82F6',
    icon: 'tag',
    aliases: []
  });

  const [aliasInput, setAliasInput] = useState('');

  useEffect(() => {
    if (tag) {
      setFormData({
        name: tag.name,
        slug: tag.slug,
        description: tag.description || '',
        category: tag.category || '',
        isActive: tag.isActive,
        isFeatured: tag.isFeatured || false,
        parentId: tag.parentId,
        color: tag.metadata?.color || '#3B82F6',
        icon: tag.metadata?.icon || 'tag',
        aliases: tag.metadata?.aliases || []
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        category: '',
        isActive: true,
        isFeatured: false,
        color: '#3B82F6',
        icon: 'tag',
        aliases: []
      });
    }
  }, [tag]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug === generateSlug(prev.name) ? generateSlug(name) : prev.slug
    }));
  };

  const addAlias = () => {
    if (aliasInput.trim() && !formData.aliases.includes(aliasInput.trim())) {
      setFormData(prev => ({
        ...prev,
        aliases: [...prev.aliases, aliasInput.trim()]
      }));
      setAliasInput('');
    }
  };

  const removeAlias = (alias: string) => {
    setFormData(prev => ({
      ...prev,
      aliases: prev.aliases.filter(a => a !== alias)
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Tag name is required');
      return;
    }
    
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tag ? 'Edit Tag' : 'Create New Tag'}</DialogTitle>
          <DialogDescription>
            {tag ? 'Update tag information and settings' : 'Create a new tag for organizing content'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Fashion Photography"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="fashion-photography"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this tag represents..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="content-type">Content Type</SelectItem>
                      <SelectItem value="industry">Industry</SelectItem>
                      <SelectItem value="project-type">Project Type</SelectItem>
                      <SelectItem value="style">Style</SelectItem>
                      <SelectItem value="location">Location</SelectItem>
                      <SelectItem value="skill">Skill</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent">Parent Tag</Label>
                  <Select
                    value={formData.parentId?.toString() || ''}
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      parentId: value ? parseInt(value) : undefined 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (Root Level)</SelectItem>
                      {parentTags.map((parentTag) => (
                        <SelectItem key={parentTag.id} value={parentTag.id.toString()}>
                          {parentTag.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                  />
                  <Label htmlFor="featured">Featured</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-8 p-0 border-none"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tag">Tag</SelectItem>
                      <SelectItem value="camera">Camera</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="briefcase">Briefcase</SelectItem>
                      <SelectItem value="book">Book</SelectItem>
                      <SelectItem value="sparkles">Sparkles</SelectItem>
                      <SelectItem value="star">Star</SelectItem>
                      <SelectItem value="heart">Heart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="text-sm font-medium mb-2">Preview</h4>
                <Badge 
                  style={{ backgroundColor: formData.color + '20', borderColor: formData.color, color: formData.color }}
                  className="text-sm"
                >
                  {formData.name || 'Tag Name'}
                </Badge>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-2">
                <Label>Aliases</Label>
                <div className="flex gap-2">
                  <Input
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    placeholder="Add alias..."
                    onKeyPress={(e) => e.key === 'Enter' && addAlias()}
                  />
                  <Button onClick={addAlias} disabled={!aliasInput.trim()}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.aliases.map((alias, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer">
                      {alias}
                      <button
                        onClick={() => removeAlias(alias)}
                        className="ml-2 text-xs hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {tag ? 'Update Tag' : 'Create Tag'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TagTreeItemProps {
  tag: TagData;
  level: number;
  onEdit: (tag: TagData) => void;
  onDelete: (tag: TagData) => void;
  onToggleExpand: (tagId: number) => void;
  expanded: Set<number>;
}

function TagTreeItem({ tag, level, onEdit, onDelete, onToggleExpand, expanded }: TagTreeItemProps) {
  const hasChildren = tag.children && tag.children.length > 0;
  const isExpanded = expanded.has(tag.id);

  return (
    <div className="space-y-1">
      <div 
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors',
          level > 0 && 'ml-6'
        )}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onToggleExpand(tag.id)}
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

        <div className="flex items-center gap-2 flex-1">
          <Badge
            style={{
              backgroundColor: tag.metadata?.color + '20',
              borderColor: tag.metadata?.color,
              color: tag.metadata?.color
            }}
            className="text-xs"
          >
            {tag.name}
          </Badge>
          
          {tag.isFeatured && <Star className="h-3 w-3 text-yellow-500" />}
          {tag.isSystem && <Badge variant="outline" className="text-xs">System</Badge>}
          {!tag.isActive && <EyeOff className="h-3 w-3 text-muted-foreground" />}
          
          <span className="text-xs text-muted-foreground">
            {tag.usageCount} uses
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(tag)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(tag)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {tag.children!.map((child) => (
            <TagTreeItem
              key={child.id}
              tag={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleExpand={onToggleExpand}
              expanded={expanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TagManager({
  showHierarchy = true,
  allowCreate = true,
  allowEdit = true,
  allowDelete = true,
  showAnalytics = true,
  pageSize = 50,
  onTagsChange,
  className
}: TagManagerProps) {
  const { trackUserAction } = useAuditTracking();
  
  const [tags, setTags] = useState<TagData[]>(mockTags);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy'>('hierarchy');
  const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set());
  const [expandedTags, setExpandedTags] = useState<Set<number>>(new Set([1, 2]));
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filter and search
  const filteredTags = tags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tag.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tag.slug.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || tag.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleCreateTag = () => {
    setEditingTag(null);
    setEditDialogOpen(true);
  };

  const handleEditTag = (tag: TagData) => {
    setEditingTag(tag);
    setEditDialogOpen(true);
  };

  const handleSaveTag = (tagData: TagFormData) => {
    if (editingTag) {
      // Update existing tag
      setTags(prev => prev.map(tag => 
        tag.id === editingTag.id 
          ? { ...tag, ...tagData, updatedAt: new Date().toISOString() }
          : tag
      ));
      trackUserAction('tag_updated', 'Tag updated', { tagId: editingTag.id, name: tagData.name });
      toast.success('Tag updated successfully');
    } else {
      // Create new tag
      const newTag: TagData = {
        id: Date.now(),
        uuid: `tag-${Date.now()}-uuid`,
        ...tagData,
        usageCount: 0,
        isSystem: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: { id: 1, name: 'Current User' },
        metadata: {
          color: tagData.color,
          icon: tagData.icon,
          aliases: tagData.aliases
        }
      };
      setTags(prev => [...prev, newTag]);
      trackUserAction('tag_created', 'Tag created', { name: tagData.name });
      toast.success('Tag created successfully');
    }
    
    onTagsChange?.(tags);
  };

  const handleDeleteTag = (tag: TagData) => {
    if (tag.usageCount > 0) {
      toast.error(`Cannot delete tag "${tag.name}" as it has ${tag.usageCount} uses`);
      return;
    }
    
    setTags(prev => prev.filter(t => t.id !== tag.id));
    trackUserAction('tag_deleted', 'Tag deleted', { tagId: tag.id, name: tag.name });
    toast.success('Tag deleted successfully');
    onTagsChange?.(tags);
  };

  const handleToggleExpand = (tagId: number) => {
    setExpandedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  };

  const handleBulkAction = (action: string) => {
    if (selectedTags.size === 0) {
      toast.error('No tags selected');
      return;
    }

    switch (action) {
      case 'activate':
        setTags(prev => prev.map(tag => 
          selectedTags.has(tag.id) ? { ...tag, isActive: true } : tag
        ));
        toast.success(`Activated ${selectedTags.size} tags`);
        break;
      case 'deactivate':
        setTags(prev => prev.map(tag => 
          selectedTags.has(tag.id) ? { ...tag, isActive: false } : tag
        ));
        toast.success(`Deactivated ${selectedTags.size} tags`);
        break;
      case 'delete':
        const tagsWithUsage = tags.filter(tag => selectedTags.has(tag.id) && tag.usageCount > 0);
        if (tagsWithUsage.length > 0) {
          toast.error(`Cannot delete ${tagsWithUsage.length} tags with usage`);
          return;
        }
        setTags(prev => prev.filter(tag => !selectedTags.has(tag.id)));
        toast.success(`Deleted ${selectedTags.size} tags`);
        break;
    }
    
    setSelectedTags(new Set());
    onTagsChange?.(tags);
  };

  const categories = ['all', ...Array.from(new Set(tags.map(tag => tag.category).filter(Boolean)))];
  const parentTags = tags.filter(tag => !tag.parentId);

  const stats = {
    total: tags.length,
    active: tags.filter(tag => tag.isActive).length,
    featured: tags.filter(tag => tag.isFeatured).length,
    totalUsage: tags.reduce((sum, tag) => sum + tag.usageCount, 0)
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Tag className="h-6 w-6 text-blue-600" />
            Tag Manager
          </h2>
          <p className="text-muted-foreground">
            Organize and manage content tags with hierarchical relationships
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsLoading(true)}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          {allowCreate && (
            <Button onClick={handleCreateTag}>
              <Plus className="h-4 w-4 mr-2" />
              Create Tag
            </Button>
          )}
        </div>
      </div>

      {/* Statistics */}
      {showAnalytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Featured</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.featured}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalUsage}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category.replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {showHierarchy && (
                <Select value={viewMode} onValueChange={(value: 'list' | 'hierarchy') => setViewMode(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hierarchy">Tree View</SelectItem>
                    <SelectItem value="list">List View</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {selectedTags.size > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Bulk Actions ({selectedTags.size})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                      <Eye className="mr-2 h-4 w-4" />
                      Activate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Deactivate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleBulkAction('delete')}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tags Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tags ({filteredTags.length})</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'hierarchy' ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredTags.filter(tag => !tag.parentId).map((tag) => (
                <TagTreeItem
                  key={tag.id}
                  tag={tag}
                  level={0}
                  onEdit={handleEditTag}
                  onDelete={handleDeleteTag}
                  onToggleExpand={handleToggleExpand}
                  expanded={expandedTags}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className={cn(
                    'flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors',
                    selectedTags.has(tag.id) && 'bg-blue-50 border-blue-200'
                  )}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedTags.has(tag.id)}
                      onChange={(e) => {
                        setSelectedTags(prev => {
                          const newSet = new Set(prev);
                          if (e.target.checked) {
                            newSet.add(tag.id);
                          } else {
                            newSet.delete(tag.id);
                          }
                          return newSet;
                        });
                      }}
                      className="rounded"
                    />
                    
                    <Badge
                      style={{
                        backgroundColor: tag.metadata?.color + '20',
                        borderColor: tag.metadata?.color,
                        color: tag.metadata?.color
                      }}
                    >
                      {tag.name}
                    </Badge>
                    
                    <span className="text-xs text-muted-foreground">
                      {tag.usageCount}
                    </span>
                    
                    {tag.isFeatured && <Star className="h-3 w-3 text-yellow-500" />}
                    {!tag.isActive && <EyeOff className="h-3 w-3 text-muted-foreground" />}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditTag(tag)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteTag(tag)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}

          {filteredTags.length === 0 && (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No tags found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Create your first tag to get started.'}
              </p>
              {allowCreate && (
                <Button onClick={handleCreateTag} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tag
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <TagEditDialog
        tag={editingTag}
        parentTags={parentTags}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveTag}
      />
    </div>
  );
}

export default TagManager;