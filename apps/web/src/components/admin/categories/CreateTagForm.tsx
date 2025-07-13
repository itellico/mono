'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, Hash, Palette, FolderTree } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { browserLogger } from '@/lib/browser-logger';
import { EntityType, ENTITY_TYPES, getEntityMetadata } from '@/lib/schemas/entities';

// Note: Replace with actual translation hook when available
const useTranslations = () => ({ t: (key: string) => key });

interface Category {
  id: string;
  name: string;
  categoryType: EntityType;
  path: string;
  level: number;
}

interface CreateTagFormProps {
  tenantId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Enhanced Tag Creation Form with Category Assignment
 * 
 * Features:
 * - Category selection dropdown with entity type filtering
 * - Real-time slug generation
 * - Color picker for tag styling
 * - Category type inheritance from selected category
 */
export default function CreateTagForm({ tenantId, onSuccess, onCancel }: CreateTagFormProps) {
  const { user } = useAuth();
  const { t } = useTranslations();
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    tagCategory: 'system' as EntityType,
    categoryId: '',
    color: '',
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType | ''>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [tenantId]);

  // Auto-generate slug when name changes
  useEffect(() => {
    if (formData.name && !formData.slug) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name]);

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await fetch(`/api/v1/admin/categories/by-type?tenantId=${tenantId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load categories');
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
      
      browserLogger.info('Categories loaded for tag creation', {
        categoriesCount: data.categories?.length || 0,
        tenantId
      });
      
    } catch (error) {
      browserLogger.error('Failed to load categories', { error, tenantId });
      setErrors({ general: 'Failed to load categories' });
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      setErrors({ general: 'Authentication required' });
      return;
    }

    // Validate required fields
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.tagCategory) {
      newErrors.tagCategory = 'Tag category is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});

      const response = await fetch('/api/v1/admin/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          ...formData,
          categoryId: formData.categoryId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create tag');
      }

      const result = await response.json();
      
      browserLogger.userAction('Tag created', JSON.stringify({
        tagId: result.data.id,
        tagName: formData.name,
        categoryId: formData.categoryId,
        tenantId
      }));

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/admin/categories?tab=tags');
      }

    } catch (error) {
      browserLogger.error('Failed to create tag', { error, formData, tenantId });
      setErrors({ 
        general: error instanceof Error ? error.message : 'Failed to create tag' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEntityTypeChange = (value: string) => {
    setSelectedEntityType(value as EntityType | '');
  };

  // Filter categories by selected entity type
  const filteredCategories = selectedEntityType 
    ? categories.filter(cat => cat.categoryType === selectedEntityType)
    : categories;

  // Get selected category info
  const selectedCategory = categories.find(cat => cat.id === formData.categoryId);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Create Tag
        </CardTitle>
        <CardDescription>
          Create a new tag and optionally assign it to a category
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {errors.general}
            </div>
          )}

          {/* Tag Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Tag Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter tag name"
              className={errors.name ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Tag Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-sm font-medium">
              Slug
            </Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="slug"
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                placeholder="auto-generated-slug"
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500">
              URL-friendly version of the name (auto-generated if empty)
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Optional description for this tag"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Tag Category */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Tag Category *
            </Label>
            <Select value={formData.tagCategory} onValueChange={(value) => handleInputChange('tagCategory', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select tag category" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ENTITY_TYPES).map(entityType => {
                  const metadata = getEntityMetadata(entityType);
                  return (
                    <SelectItem key={entityType} value={entityType}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {metadata.displayName}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {metadata.description}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Direct classification for this tag (independent of category assignment)
            </p>
          </div>

          {/* Entity Type Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Entity Type (Filter)
            </Label>
            <Select value={selectedEntityType} onValueChange={handleEntityTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select entity type to filter categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  All Entity Types
                </SelectItem>
                {Object.values(ENTITY_TYPES).map(entityType => {
                  const metadata = getEntityMetadata(entityType);
                  return (
                    <SelectItem key={entityType} value={entityType}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {metadata.displayName}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {metadata.description}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              <FolderTree className="inline h-4 w-4 mr-1" />
              Category
            </Label>
            {isLoadingCategories ? (
              <div className="flex items-center gap-2 p-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">
                  Loading categories...
                </span>
              </div>
            ) : (
              <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    No Category
                  </SelectItem>
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
            {selectedCategory && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <span>Category Path:</span>
                <code className="bg-gray-100 px-1 rounded">{selectedCategory.path}</code>
              </div>
            )}
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label htmlFor="color" className="text-sm font-medium">
              <Palette className="inline h-4 w-4 mr-1" />
              Color
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="color"
                type="color"
                value={formData.color || '#6366f1'}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="w-16 h-10 p-1 border rounded"
                disabled={isLoading}
              />
              <Input
                type="text"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                placeholder="#6366f1"
                className="flex-1"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Tag'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 