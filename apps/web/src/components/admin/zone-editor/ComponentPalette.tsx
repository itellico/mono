/**
 * Component Palette for Zone Editor
 * 
 * Displays available zone components that can be added to the canvas.
 * Integrates with itellico Mono's TanStack Query system and permission checking.
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Package, 
  Tag, 
  Plus, 
  Eye, 
  AlertTriangle,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';

import { useZoneComponents } from '@/lib/hooks/useZoneComponents';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import type { ZoneComponent } from '@/lib/zone-component-registry';

interface ComponentPaletteProps {
  viewMode?: 'palette' | 'library';
  onComponentSelect?: (component: ZoneComponent) => void;
  selectedCategory?: string;
}

/**
 * Component Card for displaying individual zone components
 */
function ComponentCard({ 
  component, 
  onSelect, 
  viewMode = 'palette' 
}: {
  component: ZoneComponent;
  onSelect?: (component: ZoneComponent) => void;
  viewMode?: 'palette' | 'library';
}) {
  const { trackClick } = useAuditTracking();

  const handleSelect = () => {
    trackClick('component_palette_select', {
      componentId: component.id,
      componentName: component.name,
      componentType: component.componentType
    });

    if (onSelect) {
      onSelect(component);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      marketing: 'bg-blue-100 text-blue-800',
      content: 'bg-green-100 text-green-800',
      interactive: 'bg-purple-100 text-purple-800',
      layout: 'bg-orange-100 text-orange-800',
      media: 'bg-pink-100 text-pink-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (componentType: string) => {
    switch (componentType) {
      case 'standard':
        return <Package className="h-3 w-3" />;
      case 'premium':
        return <Tag className="h-3 w-3" />;
      case 'custom':
        return <Grid3X3 className="h-3 w-3" />;
      default:
        return <Package className="h-3 w-3" />;
    }
  };

  return (
    <Card 
      className={`group transition-all hover:shadow-md ${
        viewMode === 'palette' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      }`}
      onClick={viewMode === 'library' ? handleSelect : undefined}
      draggable={viewMode === 'palette'}
      onDragStart={(e) => {
        if (viewMode === 'palette') {
          e.dataTransfer.setData('application/json', JSON.stringify({
            id: component.id,
            name: component.name,
            displayName: component.displayName,
            type: component.name,
            category: component.category,
            componentType: component.componentType,
            configSchema: component.configSchema,
            defaultConfig: component.defaultConfig
          }));
          e.dataTransfer.effectAllowed = 'copy';
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium leading-none">
              {component.displayName}
            </CardTitle>
            <CardDescription className="text-xs line-clamp-2">
              {component.description}
            </CardDescription>
          </div>
          {viewMode === 'library' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                // Preview functionality - to be implemented
                trackClick('component_preview', {
                  componentId: component.id,
                  componentName: component.name
                });
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`text-xs ${getCategoryColor(component.category)}`}
            >
              {component.category}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTypeIcon(component.componentType)}
              {component.componentType}
            </div>
          </div>
          {viewMode === 'palette' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleSelect}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          )}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          v{component.version}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Component Palette Main Component
 */
export function ComponentPalette({ 
  viewMode = 'palette', 
  onComponentSelect,
  selectedCategory 
}: ComponentPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(selectedCategory || '');
  const [typeFilter, setTypeFilter] = useState('');

  const { trackView } = useAuditTracking();

  // Fetch components with filters
  const { 
    data: components = [], 
    isLoading, 
    error,
    refetch 
  } = useZoneComponents({
    search: searchQuery || undefined,
    category: categoryFilter || undefined,
    componentType: typeFilter || undefined,
    status: 'active',
    limit: 100
  });

  // Track component palette view
  React.useEffect(() => {
    trackView('component_palette', {
      viewMode,
      totalComponents: components.length,
      filters: { searchQuery, categoryFilter, typeFilter }
    });
  }, [trackView, viewMode, components.length, searchQuery, categoryFilter, typeFilter]);

  // Filter components by category for tabs
  const categorizedComponents = React.useMemo(() => {
    const categories: Record<string, ZoneComponent[]> = {
      all: components,
      marketing: components.filter(c => c.category === 'marketing'),
      content: components.filter(c => c.category === 'content'),
      interactive: components.filter(c => c.category === 'interactive'),
      layout: components.filter(c => c.category === 'layout'),
      media: components.filter(c => c.category === 'media'),
    };
    return categories;
  }, [components]);

  const categories = [
    { key: 'all', label: 'All Components', count: categorizedComponents.all.length },
    { key: 'marketing', label: 'Marketing', count: categorizedComponents.marketing.length },
    { key: 'content', label: 'Content', count: categorizedComponents.content.length },
    { key: 'interactive', label: 'Interactive', count: categorizedComponents.interactive.length },
    { key: 'layout', label: 'Layout', count: categorizedComponents.layout.length },
    { key: 'media', label: 'Media', count: categorizedComponents.media.length },
  ];

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load zone components. {error.message}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm border border-input bg-background px-3 py-1 rounded-md"
          >
            <option value="">All Types</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      {/* Component Categories */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full h-auto">
          {categories.map((category) => (
            <TabsTrigger
              key={category.key}
              value={category.key}
              className="text-xs flex-col h-auto py-2 px-1 gap-1"
            >
              <span className="text-xs font-medium truncate max-w-full">
                {category.label}
              </span>
              {category.count > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 min-w-[16px]">
                  {category.count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.key} value={category.key} className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : categorizedComponents[category.key].length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No components found</p>
                <p className="text-sm">
                  {searchQuery || typeFilter 
                    ? 'Try adjusting your search or filters' 
                    : `No ${category.label.toLowerCase()} components available`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {categorizedComponents[category.key].map((component) => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    onSelect={onComponentSelect}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Summary */}
      {!isLoading && components.length > 0 && (
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          {components.length} component{components.length !== 1 ? 's' : ''} available
        </div>
      )}
    </div>
  );
} 