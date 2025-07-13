'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Move,
  Link,
  Unlink,
  Folder,
  FolderOpen,
  Tag,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Users,
  TrendingUp,
  Hash,
  AlertTriangle,
  Info,
  Search,
  Filter,
  RefreshCw,
  GitBranch,
  TreePine,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  level?: number;
  path?: string[];
  createdAt: string;
  metadata?: {
    color?: string;
    icon?: string;
    aliases?: string[];
  };
}

interface TagHierarchyManagerProps {
  /**
   * Available tags to manage
   */
  tags: TagData[];
  /**
   * Whether to allow creating new tags
   * @default true
   */
  allowCreate?: boolean;
  /**
   * Whether to allow editing existing tags
   * @default true
   */
  allowEdit?: boolean;
  /**
   * Whether to allow deleting tags
   * @default true
   */
  allowDelete?: boolean;
  /**
   * Whether to allow moving tags (changing hierarchy)
   * @default true
   */
  allowMove?: boolean;
  /**
   * Maximum nesting level allowed
   * @default 5
   */
  maxLevel?: number;
  /**
   * Show usage statistics
   * @default true
   */
  showUsageStats?: boolean;
  /**
   * Show drag handles for reordering
   * @default true
   */
  showDragHandles?: boolean;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Callback when tags are modified
   */
  onTagsChange?: (tags: TagData[]) => void;
  /**
   * Callback when a tag is created
   */
  onCreateTag?: (tag: Omit<TagData, 'id' | 'uuid' | 'createdAt'>) => Promise<TagData>;
  /**
   * Callback when a tag is updated
   */
  onUpdateTag?: (id: number, updates: Partial<TagData>) => Promise<TagData>;
  /**
   * Callback when a tag is deleted
   */
  onDeleteTag?: (id: number) => Promise<void>;
  /**
   * Callback when hierarchy is changed
   */
  onMoveTag?: (tagId: number, newParentId: number | null, newPosition?: number) => Promise<void>;
}

// Mock data for demonstration
const mockTags: TagData[] = [
  {
    id: 1,
    uuid: '1',
    name: 'Creative Arts',
    slug: 'creative-arts',
    description: 'All creative disciplines',
    category: 'industry',
    usageCount: 245,
    isActive: true,
    isSystem: false,
    isFeatured: true,
    level: 0,
    path: ['Creative Arts'],
    createdAt: '2024-01-01T00:00:00Z',
    children: [
      {
        id: 2,
        uuid: '2',
        name: 'Photography',
        slug: 'photography',
        description: 'All types of photography',
        category: 'content-type',
        usageCount: 156,
        isActive: true,
        isSystem: false,
        parentId: 1,
        level: 1,
        path: ['Creative Arts', 'Photography'],
        createdAt: '2024-01-02T00:00:00Z',
        children: [
          {
            id: 3,
            uuid: '3',
            name: 'Portrait',
            slug: 'portrait',
            category: 'style',
            usageCount: 98,
            isActive: true,
            isSystem: false,
            parentId: 2,
            level: 2,
            path: ['Creative Arts', 'Photography', 'Portrait'],
            createdAt: '2024-01-03T00:00:00Z',
            metadata: { color: '#F59E0B' }
          },
          {
            id: 4,
            uuid: '4',
            name: 'Landscape',
            slug: 'landscape',
            category: 'style',
            usageCount: 67,
            isActive: true,
            isSystem: false,
            parentId: 2,
            level: 2,
            path: ['Creative Arts', 'Photography', 'Landscape'],
            createdAt: '2024-01-04T00:00:00Z',
            metadata: { color: '#84CC16' }
          }
        ]
      },
      {
        id: 5,
        uuid: '5',
        name: 'Design',
        slug: 'design',
        description: 'All design disciplines',
        category: 'content-type',
        usageCount: 134,
        isActive: true,
        isSystem: false,
        parentId: 1,
        level: 1,
        path: ['Creative Arts', 'Design'],
        createdAt: '2024-01-05T00:00:00Z',
        children: [
          {
            id: 6,
            uuid: '6',
            name: 'UI/UX',
            slug: 'ui-ux',
            category: 'specialization',
            usageCount: 89,
            isActive: true,
            isSystem: false,
            parentId: 5,
            level: 2,
            path: ['Creative Arts', 'Design', 'UI/UX'],
            createdAt: '2024-01-06T00:00:00Z',
            metadata: { color: '#8B5CF6' }
          }
        ]
      }
    ]
  },
  {
    id: 7,
    uuid: '7',
    name: 'Business',
    slug: 'business',
    description: 'Business-related tags',
    category: 'industry',
    usageCount: 187,
    isActive: true,
    isSystem: false,
    level: 0,
    path: ['Business'],
    createdAt: '2024-01-07T00:00:00Z',
    children: [
      {
        id: 8,
        uuid: '8',
        name: 'Marketing',
        slug: 'marketing',
        category: 'department',
        usageCount: 78,
        isActive: true,
        isSystem: false,
        parentId: 7,
        level: 1,
        path: ['Business', 'Marketing'],
        createdAt: '2024-01-08T00:00:00Z',
        metadata: { color: '#EC4899' }
      }
    ]
  }
];

function TagHierarchyNode({
  tag,
  level = 0,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onMove,
  allowEdit,
  allowDelete,
  allowMove,
  showUsageStats,
  showDragHandles,
  maxLevel,
  index,
  isDragging = false
}: {
  tag: TagData;
  level?: number;
  expanded: boolean;
  onToggleExpand: (tagId: number) => void;
  onEdit: (tag: TagData) => void;
  onDelete: (tag: TagData) => void;
  onMove: (tag: TagData) => void;
  allowEdit: boolean;
  allowDelete: boolean;
  allowMove: boolean;
  showUsageStats: boolean;
  showDragHandles: boolean;
  maxLevel: number;
  index: number;
  isDragging?: boolean;
}) {
  const hasChildren = tag.children && tag.children.length > 0;
  const indentWidth = level * 24;

  const canAddChildren = level < maxLevel - 1;
  const isAtMaxLevel = level >= maxLevel - 1;

  return (
    <Draggable
      draggableId={`tag-${tag.id}`}
      index={index}
      isDragDisabled={!allowMove || !showDragHandles}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            'group transition-colors duration-200',
            snapshot.isDragging && 'opacity-50'
          )}
        >
          {/* Tag Row */}
          <div
            className={cn(
              'flex items-center gap-2 py-2 px-3 rounded-md hover:bg-accent/50 transition-colors',
              level > 0 && 'border-l border-border/30',
              isAtMaxLevel && 'opacity-75'
            )}
            style={{ paddingLeft: `${indentWidth + 12}px` }}
          >
            {/* Drag Handle */}
            {showDragHandles && allowMove && (
              <div
                {...provided.dragHandleProps}
                className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
              >
                <Move className="h-4 w-4 text-muted-foreground" />
              </div>
            )}

            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-6 w-6 p-0 flex-shrink-0',
                !hasChildren && 'invisible'
              )}
              onClick={() => onToggleExpand(tag.id)}
            >
              {hasChildren && (
                expanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )
              )}
            </Button>

            {/* Tag Icon */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {hasChildren ? (
                expanded ? (
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                ) : (
                  <Folder className="h-4 w-4 text-blue-600" />
                )
              ) : (
                <Tag className="h-4 w-4 text-muted-foreground" />
              )}
              {level > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>L{level}</span>
                </div>
              )}
            </div>

            {/* Tag Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{tag.name}</span>
                {tag.isFeatured && (
                  <Badge variant="secondary" className="text-xs">
                    Featured
                  </Badge>
                )}
                {!tag.isActive && (
                  <Badge variant="outline" className="text-xs opacity-60">
                    Inactive
                  </Badge>
                )}
                {tag.isSystem && (
                  <Badge variant="outline" className="text-xs">
                    System
                  </Badge>
                )}
              </div>
              {tag.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {tag.description}
                </p>
              )}
            </div>

            {/* Usage Stats */}
            {showUsageStats && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{tag.usageCount}</span>
              </div>
            )}

            {/* Category Badge */}
            {tag.category && (
              <Badge variant="outline" className="text-xs">
                {tag.category}
              </Badge>
            )}

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {allowEdit && (
                  <DropdownMenuItem onClick={() => onEdit(tag)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Tag
                  </DropdownMenuItem>
                )}
                {allowMove && (
                  <DropdownMenuItem onClick={() => onMove(tag)}>
                    <Move className="mr-2 h-4 w-4" />
                    Move Tag
                  </DropdownMenuItem>
                )}
                {canAddChildren && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit({ ...tag, parentId: tag.id, id: 0 } as TagData)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Child Tag
                    </DropdownMenuItem>
                  </>
                )}
                {allowDelete && !tag.isSystem && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(tag)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Tag
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Children */}
          {hasChildren && expanded && (
            <Droppable droppableId={`children-${tag.id}`} type="tag">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {tag.children!.map((child, index) => (
                    <TagHierarchyNode
                      key={child.id}
                      tag={child}
                      level={level + 1}
                      expanded={expanded}
                      onToggleExpand={onToggleExpand}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onMove={onMove}
                      allowEdit={allowEdit}
                      allowDelete={allowDelete}
                      allowMove={allowMove}
                      showUsageStats={showUsageStats}
                      showDragHandles={showDragHandles}
                      maxLevel={maxLevel}
                      index={index}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </div>
      )}
    </Draggable>
  );
}

export function TagHierarchyManager({
  tags = mockTags,
  allowCreate = true,
  allowEdit = true,
  allowDelete = true,
  allowMove = true,
  maxLevel = 5,
  showUsageStats = true,
  showDragHandles = true,
  className,
  onTagsChange,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  onMoveTag
}: TagHierarchyManagerProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([1, 2, 5, 7]));
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagData | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Build hierarchical tree with levels and paths
  const hierarchicalTags = useMemo(() => {
    const buildHierarchy = (tags: TagData[], parentId: number | null = null, level = 0, path: string[] = []): TagData[] => {
      return tags
        .filter(tag => tag.parentId === parentId)
        .map(tag => {
          const tagPath = [...path, tag.name];
          const children = buildHierarchy(tags, tag.id, level + 1, tagPath);
          return {
            ...tag,
            level,
            path: tagPath,
            children: children.length > 0 ? children : undefined
          };
        });
    };

    const flatTags = tags.flat(); // Flatten any nested structure
    return buildHierarchy(flatTags);
  }, [tags]);

  // Filter tags based on search and filters
  const filteredTags = useMemo(() => {
    let filtered = hierarchicalTags;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (tag: TagData): boolean => {
        if (tag.name.toLowerCase().includes(query) ||
            tag.slug.toLowerCase().includes(query) ||
            tag.description?.toLowerCase().includes(query)) {
          return true;
        }
        return tag.children?.some(matchesSearch) || false;
      };
      filtered = filtered.filter(matchesSearch);
    }

    if (filterCategory) {
      filtered = filtered.filter(tag => tag.category === filterCategory);
    }

    if (!showInactive) {
      filtered = filtered.filter(tag => tag.isActive);
    }

    return filtered;
  }, [hierarchicalTags, searchQuery, filterCategory, showInactive]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set<string>();
    const extractCategories = (tags: TagData[]) => {
      tags.forEach(tag => {
        if (tag.category) cats.add(tag.category);
        if (tag.children) extractCategories(tag.children);
      });
    };
    extractCategories(hierarchicalTags);
    return Array.from(cats).sort();
  }, [hierarchicalTags]);

  const handleToggleExpand = useCallback((tagId: number) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  }, []);

  const handleEditTag = (tag: TagData) => {
    setSelectedTag(tag);
    setIsCreating(tag.id === 0);
    setEditModalOpen(true);
  };

  const handleMoveTag = (tag: TagData) => {
    setSelectedTag(tag);
    setMoveModalOpen(true);
  };

  const handleDeleteTag = async (tag: TagData) => {
    if (tag.children && tag.children.length > 0) {
      toast.error('Cannot delete tag with children. Please move or delete child tags first.');
      return;
    }

    try {
      await onDeleteTag?.(tag.id);
      toast.success(`Tag "${tag.name}" deleted successfully`);
    } catch (error) {
      toast.error('Failed to delete tag');
      console.error('Delete tag error:', error);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !allowMove) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const tagId = parseInt(draggableId.replace('tag-', ''));
    const newParentId = destination.droppableId === 'root' 
      ? null 
      : parseInt(destination.droppableId.replace('children-', ''));

    try {
      await onMoveTag?.(tagId, newParentId, destination.index);
      toast.success('Tag moved successfully');
    } catch (error) {
      toast.error('Failed to move tag');
      console.error('Move tag error:', error);
    }
  };

  const expandAll = () => {
    const allIds = new Set<number>();
    const collectIds = (tags: TagData[]) => {
      tags.forEach(tag => {
        allIds.add(tag.id);
        if (tag.children) collectIds(tag.children);
      });
    };
    collectIds(hierarchicalTags);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const getTotalUsage = (tag: TagData): number => {
    let total = tag.usageCount;
    if (tag.children) {
      total += tag.children.reduce((sum, child) => sum + getTotalUsage(child), 0);
    }
    return total;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TreePine className="h-5 w-5" />
            Tag Hierarchy Manager
          </h3>
          <p className="text-sm text-muted-foreground">
            Organize tags in a hierarchical structure with drag-and-drop support
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ChevronDown className="h-4 w-4 mr-1" />
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <ChevronRight className="h-4 w-4 mr-1" />
            Collapse All
          </Button>
          {allowCreate && (
            <Button size="sm" onClick={() => handleEditTag({ id: 0 } as TagData)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Root Tag
            </Button>
          )}
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Search */}
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

            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Show Inactive Toggle */}
            <Button
              variant={showInactive ? "default" : "outline"}
              size="sm"
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span className="ml-1">Inactive</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchy Tree */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Tag Hierarchy
            </CardTitle>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Folder className="h-3 w-3" />
                <span>Parent</span>
              </div>
              <div className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                <span>Tag</span>
              </div>
              {showUsageStats && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>Usage</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="root" type="tag">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="p-4">
                    {filteredTags.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <TreePine className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No tags found matching your criteria</p>
                        {allowCreate && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleEditTag({ id: 0 } as TagData)}
                          >
                            Create your first tag
                          </Button>
                        )}
                      </div>
                    ) : (
                      filteredTags.map((tag, index) => (
                        <TagHierarchyNode
                          key={tag.id}
                          tag={tag}
                          level={0}
                          expanded={expandedNodes.has(tag.id)}
                          onToggleExpand={handleToggleExpand}
                          onEdit={handleEditTag}
                          onDelete={handleDeleteTag}
                          onMove={handleMoveTag}
                          allowEdit={allowEdit}
                          allowDelete={allowDelete}
                          allowMove={allowMove}
                          showUsageStats={showUsageStats}
                          showDragHandles={showDragHandles}
                          maxLevel={maxLevel}
                          index={index}
                        />
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Statistics */}
      {showUsageStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TreePine className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total Tags</p>
                  <p className="text-lg font-bold">{hierarchicalTags.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Max Depth</p>
                  <p className="text-lg font-bold">
                    {Math.max(...hierarchicalTags.map(tag => tag.level || 0), 0) + 1}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">With Children</p>
                  <p className="text-lg font-bold">
                    {hierarchicalTags.filter(tag => tag.children && tag.children.length > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total Usage</p>
                  <p className="text-lg font-bold">
                    {hierarchicalTags.reduce((sum, tag) => sum + getTotalUsage(tag), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Create New Tag' : 'Edit Tag'}
            </DialogTitle>
            <DialogDescription>
              {isCreating ? 'Add a new tag to the hierarchy' : 'Update tag information'}
              {selectedTag?.parentId && (
                <span className="block mt-1 text-xs">
                  Parent: {tags.find(t => t.id === selectedTag.parentId)?.name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tag-name">Name</Label>
              <Input
                id="tag-name"
                placeholder="Enter tag name"
                defaultValue={selectedTag?.name || ''}
              />
            </div>
            <div>
              <Label htmlFor="tag-description">Description</Label>
              <Input
                id="tag-description"
                placeholder="Optional description"
                defaultValue={selectedTag?.description || ''}
              />
            </div>
            <div>
              <Label htmlFor="tag-category">Category</Label>
              <Select defaultValue={selectedTag?.category || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Category</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setEditModalOpen(false)}>
              {isCreating ? 'Create Tag' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Modal */}
      <Dialog open={moveModalOpen} onOpenChange={setMoveModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move Tag</DialogTitle>
            <DialogDescription>
              Move "{selectedTag?.name}" to a new location in the hierarchy
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Parent</Label>
              <Select defaultValue={selectedTag?.parentId?.toString() || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Root Level</SelectItem>
                  {hierarchicalTags.map(tag => (
                    <SelectItem key={tag.id} value={tag.id.toString()}>
                      {tag.path?.join(' > ') || tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
              <div className="flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Moving considerations:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Tag and all children will be moved</li>
                    <li>• Maximum nesting level is {maxLevel}</li>
                    <li>• Cannot move to own descendant</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setMoveModalOpen(false)}>
              Move Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Example usage component
export function TagHierarchyManagerExample() {
  const [tags, setTags] = useState<TagData[]>(mockTags);

  const handleCreateTag = async (tagData: Omit<TagData, 'id' | 'uuid' | 'createdAt'>): Promise<TagData> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newTag: TagData = {
      ...tagData,
      id: Date.now(),
      uuid: `tag-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setTags(prev => [...prev, newTag]);
    return newTag;
  };

  const handleUpdateTag = async (id: number, updates: Partial<TagData>): Promise<TagData> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setTags(prev => prev.map(tag => 
      tag.id === id ? { ...tag, ...updates } : tag
    ));
    
    return { ...tags.find(t => t.id === id)!, ...updates };
  };

  const handleDeleteTag = async (id: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setTags(prev => prev.filter(tag => tag.id !== id));
  };

  const handleMoveTag = async (tagId: number, newParentId: number | null, newPosition?: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Implementation would handle moving tag in hierarchy
    console.log('Move tag:', { tagId, newParentId, newPosition });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Tag Hierarchy Manager</h2>
        <p className="text-muted-foreground">
          Manage tags in a hierarchical structure with full CRUD operations and drag-and-drop support.
        </p>
      </div>

      <TagHierarchyManager
        tags={tags}
        onTagsChange={setTags}
        onCreateTag={handleCreateTag}
        onUpdateTag={handleUpdateTag}
        onDeleteTag={handleDeleteTag}
        onMoveTag={handleMoveTag}
        maxLevel={4}
        showUsageStats={true}
        showDragHandles={true}
      />
    </div>
  );
}

export default TagHierarchyManager;