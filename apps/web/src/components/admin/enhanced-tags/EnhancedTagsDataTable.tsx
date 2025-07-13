'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Globe,
  Building2,
  Users,
  User,
  Settings,
  Tag as TagIcon
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';

export interface EnhancedTagWithCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  categoryId?: string;
  scopeLevel: 'platform' | 'tenant' | 'account' | 'user' | 'configuration';
  isSystem: boolean;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    path: string;
    icon?: string;
  } | null;
}

interface EnhancedTagsDataTableProps {
  tags: EnhancedTagWithCategory[];
  onEdit: (tag: EnhancedTagWithCategory) => void;
  onDelete: (tag: EnhancedTagWithCategory) => void;
  isLoading?: boolean;
  userRole?: string;
}

type SortField = 'name' | 'scopeLevel' | 'category' | 'usageCount' | 'createdAt' | 'isActive';
type SortDirection = 'asc' | 'desc';

const scopeColors = {
  platform: 'bg-purple-100 text-purple-800 border-purple-200',
  tenant: 'bg-blue-100 text-blue-800 border-blue-200',
  account: 'bg-green-100 text-green-800 border-green-200',
  user: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  configuration: 'bg-red-100 text-red-800 border-red-200'
};

const scopeIcons = {
  platform: Globe,
  tenant: Building2,
  account: Users,
  user: User,
  configuration: Settings
};

// Helper function to get Lucide icon component by name
const getLucideIcon = (iconName: string) => {
  if (!iconName) return TagIcon;
  
  // Convert icon name to PascalCase if needed
  const pascalName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
  
  // Try to get the icon from LucideIcons
  const IconComponent = (LucideIcons as any)[pascalName] || (LucideIcons as any)[iconName] || TagIcon;
  
  return IconComponent;
};

/**
 * Sortable data table for enhanced tags with edit/delete functionality
 * 
 * @component
 * @param {EnhancedTagsDataTableProps} props - Component props
 * @param {EnhancedTagWithCategory[]} props.tags - Array of enhanced tags to display
 * @param {Function} props.onEdit - Callback function when edit button is clicked
 * @param {Function} props.onDelete - Callback function when delete button is clicked
 * @param {boolean} props.isLoading - Loading state indicator
 * @param {string} props.userRole - Current user's role for permission checks
 * 
 * @example
 * ```tsx
 * <EnhancedTagsDataTable
 *   tags={enhancedTags}
 *   onEdit={(tag) => setEditingTag(tag)}
 *   onDelete={(tag) => handleDeleteTag(tag)}
 *   isLoading={loading}
 *   userRole="super_admin"
 * />
 * ```
 */
export function EnhancedTagsDataTable({
  tags,
  onEdit,
  onDelete,
  isLoading = false,
  userRole = 'user'
}: EnhancedTagsDataTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const { trackClick } = useAuditTracking();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }

    trackClick('enhanced_tags_table_sort', {
      field,
      direction: sortField === field ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc'
    });
  };

  const sortedTags = useMemo(() => {
    return [...tags].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'scopeLevel':
          aValue = a.scopeLevel;
          bValue = b.scopeLevel;
          break;
        case 'category':
          aValue = a.category?.name?.toLowerCase() || '';
          bValue = b.category?.name?.toLowerCase() || '';
          break;
        case 'usageCount':
          aValue = a.usageCount;
          bValue = b.usageCount;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'isActive':
          aValue = a.isActive ? 1 : 0;
          bValue = b.isActive ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tags, sortField, sortDirection]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  const canEdit = (tag: EnhancedTagWithCategory) => {
    if (userRole === 'super_admin') return true;
    if (tag.isSystem) return false;
    return true;
  };

  const canDelete = (tag: EnhancedTagWithCategory) => {
    if (userRole === 'super_admin') return true;
    if (tag.isSystem) return false;
    if (tag.usageCount > 0) return false;
    return true;
  };

  const handleEdit = (tag: EnhancedTagWithCategory) => {
    trackClick('enhanced_tags_edit', { tagId: tag.id, tagName: tag.name });
    onEdit(tag);
  };

  const handleDelete = (tag: EnhancedTagWithCategory) => {
    trackClick('enhanced_tags_delete', { tagId: tag.id, tagName: tag.name });
    onDelete(tag);
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
              <div className="flex items-center space-x-2">
                <span>Tag</span>
                {getSortIcon('name')}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('category')}>
              <div className="flex items-center space-x-2">
                <span>Category</span>
                {getSortIcon('category')}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('scopeLevel')}>
              <div className="flex items-center space-x-2">
                <span>Scope</span>
                {getSortIcon('scopeLevel')}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('isActive')}>
              <div className="flex items-center space-x-2">
                <span>Status</span>
                {getSortIcon('isActive')}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('usageCount')}>
              <div className="flex items-center space-x-2">
                <span>Usage</span>
                {getSortIcon('usageCount')}
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
              <div className="flex items-center space-x-2">
                <span>Created</span>
                {getSortIcon('createdAt')}
              </div>
            </TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTags.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No enhanced tags found. Create your first tag to get started.
              </TableCell>
            </TableRow>
          ) : (
            sortedTags.map((tag) => {
              const TagIconComponent = getLucideIcon(tag.icon || 'Tag');
              const ScopeIcon = scopeIcons[tag.scopeLevel];
              const CategoryIconComponent = tag.category?.icon ? getLucideIcon(tag.category.icon) : null;
              
              return (
                <TableRow key={tag.id} className="hover:bg-muted/50">
                  <TableCell className="max-w-[300px]">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
                          style={{ backgroundColor: tag.color || '#6b7280' }}
                        >
                          <TagIconComponent className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{tag.name}</div>
                        {tag.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {tag.description}
                          </div>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            {tag.slug}
                          </code>
                          {tag.isSystem && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                              System
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="w-[280px]">
                    {tag.category ? (
                      <div className="flex items-center space-x-2">
                        {CategoryIconComponent && (
                          <CategoryIconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {tag.category.name}
                            {tag.category.path && tag.category.path !== tag.category.name && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({tag.category.path})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <ScopeIcon className="h-4 w-4 text-muted-foreground" />
                      <Badge 
                        variant="outline" 
                        className={cn("text-[10px] h-5", scopeColors[tag.scopeLevel])}
                      >
                        {tag.scopeLevel}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {tag.isActive ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={cn(
                        "text-sm",
                        tag.isActive ? "text-green-600" : "text-gray-500"
                      )}>
                        {tag.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] h-4">
                      {tag.usageCount}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(tag.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEdit(tag)}
                          disabled={!canEdit(tag)}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(tag)}
                          disabled={!canDelete(tag)}
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
} 