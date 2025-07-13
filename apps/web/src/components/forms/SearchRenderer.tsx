'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { FieldRenderer } from './FieldRenderer';
import { useGenerateFormFromSchema, type FormDefinition } from '@/lib/hooks/useFormGeneration';
import { useToast } from '@/hooks/use-toast';
import { browserLogger } from '@/lib/browser-logger';
import { cn } from '@/lib/utils';

/**
 * SearchRenderer Component
 * 
 * Renders dynamic search interfaces based on model schemas.
 * Supports filters, ranges, and real-time search with debouncing.
 * 
 * @component
 * @param {SearchRendererProps} props - The search renderer properties
 * @example
 * <SearchRenderer
 *   schemaId="user-search-schema"
 *   onSearch={(filters) => console.log(filters)}
 *   placeholder="Search users..."
 * />
 */

export interface SearchFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between';
  value: any;
  label?: string;
}

export interface SearchRendererProps {
  /** Schema ID to generate search form from */
  schemaId: string;
  /** Optional tenant ID for multi-tenant support */
  tenantId?: number;
  /** Search results handler */
  onSearch?: (filters: SearchFilter[], query: string) => Promise<void> | void;
  /** Filter change handler */
  onFiltersChange?: (filters: SearchFilter[]) => void;
  /** Initial search query */
  initialQuery?: string;
  /** Initial filters */
  initialFilters?: SearchFilter[];
  /** Search placeholder text */
  placeholder?: string;
  /** Whether search is in loading state */
  loading?: boolean;
  /** Whether search is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show advanced filters toggle */
  showAdvancedFilters?: boolean;
  /** Debounce delay for search input (ms) */
  debounceDelay?: number;
}

export function SearchRenderer({
  schemaId,
  tenantId,
  onSearch,
  onFiltersChange,
  initialQuery = '',
  initialFilters = [],
  placeholder = 'Search...',
  loading = false,
  disabled = false,
  className,
  showAdvancedFilters = true,
  debounceDelay = 300
}: SearchRendererProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilter[]>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);

  // Load search definition using hook
  const { 
    data: searchDefinition, 
    isLoading, 
    error: loadError 
  } = useGenerateFormFromSchema(schemaId, tenantId, 'search');

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string, currentFilters: SearchFilter[]) => {
      if (onSearch) {
        try {
          await onSearch(currentFilters, query);
          browserLogger.info('Search executed', { 
            query, 
            filtersCount: currentFilters.length,
            schemaId 
          });
        } catch (error) {
          browserLogger.error('Search execution failed', { error, query });
        }
      }
    }, debounceDelay),
    [onSearch, debounceDelay, schemaId]
  );

  // Log when search definition loads
  React.useEffect(() => {
    if (searchDefinition) {
      browserLogger.userAction('search_definition_loaded', 'SearchRenderer', {
        fieldsCount: searchDefinition.fields.length,
        searchName: searchDefinition.name,
        schemaId
      });
    }
  }, [searchDefinition, schemaId]);

  // Log loading errors
  React.useEffect(() => {
    if (loadError) {
      const errorMessage = loadError instanceof Error ? loadError.message : 'Failed to load search';
      browserLogger.userAction('search_definition_load_error', 'SearchRenderer', { 
        error: errorMessage, 
        schemaId 
      });
      toast({
        title: 'Error Loading Search',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  }, [loadError, schemaId, toast]);

  // Handle search query changes
  const handleQueryChange = useCallback((newQuery: string) => {
    setSearchQuery(newQuery);
    debouncedSearch(newQuery, filters);
  }, [filters, debouncedSearch]);

  // Handle filter changes
  const handleFilterChange = useCallback((fieldName: string, value: any, operator: SearchFilter['operator'] = 'equals') => {
    const newFilters = filters.filter(f => f.field !== fieldName);
    
    if (value !== undefined && value !== null && value !== '') {
      const field = searchDefinition?.fields.find(f => f.name === fieldName);
      newFilters.push({
        field: fieldName,
        operator,
        value,
        label: field?.label || fieldName
      });
    }

    setFilters(newFilters);
    onFiltersChange?.(newFilters);
    debouncedSearch(searchQuery, newFilters);
  }, [filters, searchDefinition, onFiltersChange, searchQuery, debouncedSearch]);

  // Remove specific filter
  const handleRemoveFilter = useCallback((fieldName: string) => {
    const newFilters = filters.filter(f => f.field !== fieldName);
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
    debouncedSearch(searchQuery, newFilters);
  }, [filters, onFiltersChange, searchQuery, debouncedSearch]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters([]);
    setSearchQuery('');
    onFiltersChange?.([]);
    debouncedSearch('', []);
    
    browserLogger.info('Search filters cleared', { schemaId });
    toast({
      title: 'Filters Cleared',
      description: 'All search filters have been reset.',
      variant: 'default'
    });
  }, [onFiltersChange, debouncedSearch, schemaId, toast]);

  // Get filter value for field
  const getFilterValue = useCallback((fieldName: string) => {
    const filter = filters.find(f => f.field === fieldName);
    return filter?.value;
  }, [filters]);

  // Show loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Search className="h-4 w-4 animate-spin" />
            <span>Loading search...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state if no search definition
  if (!searchDefinition) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Unable to load search definition. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>{searchDefinition.name}</span>
            </CardTitle>
            {searchDefinition.description && (
              <CardDescription className="mt-2">
                {searchDefinition.description}
              </CardDescription>
            )}
          </div>
          
          {showAdvancedFilters && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {filters.length} filters
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || loading}
            className={cn(
              'w-full pl-10 pr-4 py-2 border border-input rounded-md',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
        </div>

        {/* Active filters display */}
        {filters.length > 0 && (
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {filters.map((filter) => (
              <Badge
                key={filter.field}
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <span>{filter.label}: {String(filter.value)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => handleRemoveFilter(filter.field)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="flex items-center space-x-1 text-muted-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Clear all</span>
            </Button>
          </div>
        )}

        {/* Advanced filters */}
        {showFilters && showAdvancedFilters && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
            <h4 className="font-medium flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Advanced Filters</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchDefinition.fields.map((field) => (
                <FieldRenderer
                  key={field.id}
                  field={{
                    ...field,
                    required: false // Filters are optional
                  }}
                  value={getFilterValue(field.name)}
                  onChange={(value) => handleFilterChange(field.name, value)}
                  disabled={disabled || loading}
                />
              ))}
            </div>
          </div>
        )}

        {/* Search status */}
        {loading && (
          <div className="flex items-center justify-center space-x-2 py-4">
            <Search className="h-4 w-4 animate-spin" />
            <span className="text-muted-foreground">Searching...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 