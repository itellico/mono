'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  Tag, 
  FolderTree, 
  Hash, 
  Loader2, 
  Plus,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { EntityType, ENTITY_TYPES, getEntityMetadata } from '@/lib/schemas/entities';
import { browserLogger } from '@/lib/browser-logger';

interface Category {
  id: string;
  name: string;
  categoryType: EntityType;
  path: string;
  level: number;
}

interface TagWithCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryId?: string;
  color?: string;
  isSystem: boolean;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

interface TagsListWithFiltersProps {
  tenantId: number;
  onCreateTag?: () => void;
  onEditTag?: (tagId: string) => void;
  onDeleteTag?: (tagId: string) => void;
}

/**
 * Enhanced Tags List with Advanced Filtering
 * 
 * Features:
 * - Filter by category and entity type
 * - Search by tag name/description
 * - Show category context for each tag
 * - Optimized for performance with server-side filtering
 */
export default function TagsListWithFilters({ 
  tenantId, 
  onCreateTag, 
  onEditTag, 
  onDeleteTag 
}: TagsListWithFiltersProps) {
  // Data state
  const [tags, setTags] = useState<TagWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    tagCategory: '' as EntityType | '',
    includeInactive: false,
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount and when filters change
  useEffect(() => {
    loadCategories();
  }, [tenantId]);

  useEffect(() => {
    loadTags();
  }, [tenantId, filters]);

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await fetch(`/api/v1/admin/categories/by-type?tenantId=${tenantId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load categories');
      }
      
      const data = await response.json();
      setCategories(data.data?.categories || []);
      
    } catch (error) {
      browserLogger.error('Failed to load categories', { error, tenantId });
      setError('Failed to load categories');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadTags = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams({
        tenantId: tenantId.toString(),
      });
      
      if (filters.search) params.append('search', filters.search);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.tagCategory) params.append('tagCategory', filters.tagCategory);
      if (filters.includeInactive) params.append('includeInactive', 'true');
      
      const response = await fetch(`/api/v1/admin/tags/with-categories?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load tags');
      }
      
      const data = await response.json();
      setTags(data.data?.tags || []);
      
      browserLogger.info('Tags loaded with filters', {
        tagsCount: data.data?.tags?.length || 0,
        filters,
        tenantId
      });
      
    } catch (error) {
      browserLogger.error('Failed to load tags', { error, filters, tenantId });
      setError('Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      categoryId: '',
      tagCategory: '',
      includeInactive: false,
    });
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/admin/tags/${tagId}?tenantId=${tenantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tag');
      }

      // Reload tags
      loadTags();
      
      browserLogger.userAction('Tag deleted', JSON.stringify({ tagId, tenantId }));
      
    } catch (error) {
      browserLogger.error('Failed to delete tag', { error, tagId, tenantId });
      setError('Failed to delete tag');
    }
  };

  const handleEntityTypeChange = (value: string) => {
    handleFilterChange('tagCategory', value);
    // Clear category filter when entity type changes
    if (filters.categoryId) {
      handleFilterChange('categoryId', '');
    }
  };

  // Filter categories by selected entity type
  const filteredCategories = filters.tagCategory 
    ? categories.filter(cat => cat.categoryType === filters.tagCategory)
    : categories;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tags Management</h2>
          <p className="text-gray-600">Manage tags with category assignments and filtering</p>
        </div>
        <Button onClick={onCreateTag} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Tag
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter tags by search, category, and entity type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search tags..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tag Category Filter */}
            <div className="space-y-2">
              <Label>Tag Category</Label>
              <Select 
                value={filters.tagCategory} 
                onValueChange={handleEntityTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All tag categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Tag Categories</SelectItem>
                  {Object.values(ENTITY_TYPES).map(entityType => {
                    const metadata = getEntityMetadata(entityType);
                    return (
                      <SelectItem key={entityType} value={entityType}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {metadata.displayName}
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label>Category</Label>
              {isLoadingCategories ? (
                <div className="flex items-center gap-2 p-2 border rounded">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : (
                <Select 
                  value={filters.categoryId} 
                  onValueChange={(value) => handleFilterChange('categoryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {filteredCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <span style={{ marginLeft: `${category.level * 12}px` }}>
                            {category.name}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {getEntityMetadata(category.categoryType).displayName}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Tags Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags ({tags.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading tags...</span>
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tags found matching your filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {tag.color && (
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: tag.color }}
                            />
                          )}
                          <div>
                            <div className="font-medium">{tag.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {tag.slug}
                            </div>
                            {tag.description && (
                              <div className="text-xs text-gray-400 mt-1">
                                {tag.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tag.category ? (
                          <div className="flex items-center gap-2">
                            <FolderTree className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium">{tag.category.name}</div>
                              <div className="text-xs text-gray-500">{tag.category.path}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No category</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tag.category ? (
                          <Badge variant="outline" className="text-xs">
                            {getEntityMetadata(tag.category.categoryType).displayName}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {tag.usageCount} uses
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={tag.isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {tag.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {tag.isSystem && (
                            <Badge variant="outline" className="text-xs">
                              System
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onEditTag?.(tag.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {!tag.isSystem && (
                              <DropdownMenuItem 
                                onClick={() => handleDeleteTag(tag.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 