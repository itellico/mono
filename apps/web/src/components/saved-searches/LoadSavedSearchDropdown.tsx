'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { browserLogger } from '@/lib/browser-logger';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Button,
} from '@/components/ui/button';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Skeleton,
} from '@/components/ui/skeleton';
import {
  BookmarkIcon,
  StarIcon,
  ClockIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { extractUserContext } from '@/lib/permissions/client-permissions';

// Types
export interface SavedSearchData {
  id: number;
  uuid: string;
  userId: number;
  tenantId: number;
  name: string;
  description: string | null;
  entityType: string;
  filters: Record<string, unknown>;
  sortBy: string | null;
  sortOrder: string | null;
  columnConfig: Record<string, boolean> | null;
  searchValue?: string | null;
  paginationLimit?: number | null;
  isDefault: boolean;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoadSavedSearchDropdownProps {
  entityType: string;
  onLoadSearch: (searchConfig: {
    filters: Record<string, string[]>;
    sortConfig: {
      column: string;
      direction: 'asc' | 'desc' | null;
    } | null;
    columnVisibility: Record<string, boolean>;
    searchValue?: string;
    paginationLimit?: number;
    searchName: string;
  }) => void;
  onManageSearches?: () => void;
  className?: string;
  autoLoadDefault?: boolean; // Whether to automatically load default search on mount
}

/**
 * 🔍 LoadSavedSearchDropdown Component
 * 
 * ShadCN-based dropdown for loading saved searches in AdminListPage
 * 
 * @component
 * @param {LoadSavedSearchDropdownProps} props - Component props
 * @param {string} props.entityType - Entity type for filtering searches (e.g., 'tenants', 'users')
 * @param {Function} props.onLoadSearch - Callback when a search is loaded
 * @param {Function} props.onManageSearches - Optional callback to navigate to search management
 * @param {string} props.className - Optional CSS classes
 * @param {boolean} props.autoLoadDefault - Whether to automatically load default search on mount (default: true)
 * 
 * @example
 * <LoadSavedSearchDropdown
 *   entityType="tenants"
 *   onLoadSearch={handleLoadSearch}
 *   onManageSearches={() => router.push('/admin/saved-searches')}
 *   autoLoadDefault={true}
 * />
 */
export function LoadSavedSearchDropdown({
  entityType,
  onLoadSearch,
  onManageSearches,
  className,
  autoLoadDefault = true
}: LoadSavedSearchDropdownProps) {
  const { user } = useAuth();
  const userContext = extractUserContext(user);
  const [isOpen, setIsOpen] = useState(false);
  const [hasAutoLoadedDefault, setHasAutoLoadedDefault] = useState(false);

  // Fetch saved searches using TanStack Query
  const {
    data: savedSearches,
    isLoading,
    error
  } = useQuery({
    queryKey: ['saved-searches', userContext.userId, entityType],
    queryFn: async () => {
      if (!userContext.isAuthenticated || !userContext.userId) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`/api/v1/saved-searches?entityType=${entityType}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch saved searches');
      }

      const result = await response.json();
      
      // Transform the API response to match our expected format
      if (result.success && Array.isArray(result.data)) {
        const searches = result.data as SavedSearchData[];
        const defaultSearch = searches.find(s => s.isDefault);
        return { searches, defaultSearch };
      }
      
      throw new Error('Invalid response format');
    },
    enabled: !!userContext.isAuthenticated && !!userContext.userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // ✅ AUTOMATIC DEFAULT SEARCH LOADING - Three-layer caching integration
  useEffect(() => {
    if (
      autoLoadDefault &&
      savedSearches?.defaultSearch && 
      !hasAutoLoadedDefault && 
      !isLoading && 
      !error
    ) {
      try {
        browserLogger.info('🚀 Auto-loading default saved search', {
          defaultSearch: {
            id: savedSearches.defaultSearch.id,
            name: savedSearches.defaultSearch.name,
            entityType: savedSearches.defaultSearch.entityType,
            hasFilters: !!savedSearches.defaultSearch.filters,
            hasSortConfig: !!(savedSearches.defaultSearch.sortBy && savedSearches.defaultSearch.sortOrder),
            hasColumnConfig: !!savedSearches.defaultSearch.columnConfig
          },
          autoLoadDefault,
          hasAutoLoadedDefault,
          dataSource: savedSearches ? 'tanstack-query' : 'unknown'
        });

        // ✅ LAYER 1: Data already loaded via TanStack Query (client-side cache)
        // ✅ LAYER 2: TanStack Query fetched from Redis cache (if available)
        // ✅ LAYER 3: Redis fetched from Database (if cache miss)
        
        // Convert saved search to AdminListPage format
        const searchConfig = {
          filters: savedSearches.defaultSearch.filters as Record<string, string[]> || {},
          sortConfig: savedSearches.defaultSearch.sortBy ? {
            column: savedSearches.defaultSearch.sortBy,
            direction: (savedSearches.defaultSearch.sortOrder as 'asc' | 'desc') || 'asc'
          } : null,
          columnVisibility: savedSearches.defaultSearch.columnConfig as Record<string, boolean> || {},
          searchValue: savedSearches.defaultSearch.searchValue as string || undefined,
          paginationLimit: savedSearches.defaultSearch.paginationLimit as number || undefined,
          searchName: savedSearches.defaultSearch.name
        };

        browserLogger.info('✅ Auto-loading default search with config', {
          searchName: searchConfig.searchName,
          filters: searchConfig.filters,
          sortConfig: searchConfig.sortConfig,
          columnVisibility: searchConfig.columnVisibility,
          layersTraversed: ['TanStack Query', 'Redis', 'Database']
        });

        // Apply the default search configuration
        onLoadSearch(searchConfig);
        
        // Mark as auto-loaded to prevent duplicate loading
        setHasAutoLoadedDefault(true);

        browserLogger.userAction('load_saved_search', 'LoadSavedSearchDropdown', {
          searchName: savedSearches.defaultSearch.name,
          entityType: savedSearches.defaultSearch.entityType,
          source: 'default_auto_load',
          cacheLayersUsed: ['TanStack Query', 'Redis', 'Database']
        });

      } catch (autoLoadError) {
        browserLogger.error('❌ Failed to auto-load default saved search', {
          error: autoLoadError instanceof Error ? autoLoadError.message : 'Unknown error',
          defaultSearchId: savedSearches.defaultSearch?.id,
          defaultSearchName: savedSearches.defaultSearch?.name
        });
        
        // Don't throw error, just log it and continue
        setHasAutoLoadedDefault(true); // Prevent retry loops
      }
    }
  }, [autoLoadDefault, savedSearches, hasAutoLoadedDefault, isLoading, error, onLoadSearch]);

  // ✅ Enhanced error handling and loading states
  if (error) {
    browserLogger.error('❌ Failed to load saved searches', {
      error: error instanceof Error ? error.message : 'Unknown error',
      entityType,
      userId: userContext.userId
    });
    
    return (
      <div className="text-sm text-muted-foreground">
        Failed to load saved searches
      </div>
    );
  }

  const handleLoadSearch = (search: SavedSearchData) => {
    try {
      // Convert saved search to AdminListPage format
      const filters: Record<string, string[]> = {};
      
      if (search.filters && typeof search.filters === 'object') {
        Object.entries(search.filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            filters[key] = value.map(v => String(v));
          } else if (value !== null && value !== undefined) {
            filters[key] = [String(value)];
          }
        });
      }

      const sortConfig = search.sortBy ? {
        column: search.sortBy,
        direction: (search.sortOrder as 'asc' | 'desc') || 'asc'
      } : null;

      const columnVisibility = search.columnConfig || {};

      // Call the callback with the transformed data
      onLoadSearch({
        filters,
        sortConfig,
        columnVisibility,
        searchValue: search.searchValue as string || undefined,
        paginationLimit: search.paginationLimit as number || undefined,
        searchName: search.name
      });

      setIsOpen(false);

      // Log user action
      browserLogger.userAction('saved_search_loaded', `Loaded saved search: ${search.name}`, {
        searchId: search.id,
        entityType: search.entityType,
        hasFilters: Object.keys(filters).length > 0,
        hasSorting: !!sortConfig,
        hasColumnConfig: Object.keys(columnVisibility).length > 0
      });

    } catch (error) {
      browserLogger.error('Failed to load saved search', {
        searchId: search.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const handleManageSearches = () => {
    setIsOpen(false);
    if (onManageSearches) {
      onManageSearches();
      browserLogger.userAction('navigate_to_saved_searches_management', 'Navigated to saved searches management');
    }
  };

  if (!userContext.isAuthenticated) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <BookmarkIcon className="h-4 w-4" />
          Saved Searches
          {savedSearches?.searches && savedSearches.searches.length > 0 && (
            <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
              {savedSearches.searches.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <BookmarkIcon className="h-4 w-4" />
          Saved Searches
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {isLoading && (
          <div className="p-2 space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}
        
        {savedSearches?.searches && savedSearches.searches.length === 0 && (
          <DropdownMenuItem disabled className="text-muted-foreground">
            No saved searches found
          </DropdownMenuItem>
        )}
        
        {savedSearches?.searches && savedSearches.searches.length > 0 && (
          <>
            {/* Default search first */}
            {savedSearches.defaultSearch && (
              <>
                <DropdownMenuItem
                  onClick={() => handleLoadSearch(savedSearches.defaultSearch!)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <StarIcon className="h-4 w-4 text-yellow-500" />
                      <div className="flex flex-col">
                        <span className="font-medium">{savedSearches.defaultSearch.name}</span>
                        {savedSearches.defaultSearch.description && (
                          <span className="text-xs text-muted-foreground truncate">
                            {savedSearches.defaultSearch.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Default
                    </Badge>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            
            {/* Other searches */}
            {savedSearches.searches
              .filter(search => !search.isDefault)
              .map((search) => (
                <DropdownMenuItem
                  key={search.id}
                  onClick={() => handleLoadSearch(search)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium">{search.name}</span>
                        {search.description && (
                          <span className="text-xs text-muted-foreground truncate">
                            {search.description}
                          </span>
                        )}
                      </div>
                    </div>
                    {search.isPublic && (
                      <Badge variant="outline" className="text-xs">
                        Public
                      </Badge>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
          </>
        )}
        
        {onManageSearches && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleManageSearches}
              className="cursor-pointer text-primary"
            >
              <div className="flex items-center gap-2">
                <BookmarkIcon className="h-4 w-4" />
                Manage Saved Searches
              </div>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 