'use client';

import React from 'react';
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
  BookmarkIcon,
  StarIcon,
  ClockIcon,
} from 'lucide-react';

export interface MockLoadSavedSearchDropdownProps {
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
  mockData?: any[];
}

const formatRelativeTime = (date: Date): string => {
  try {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  } catch (error) {
    return 'unknown';
  }
};

/**
 * Mock version of LoadSavedSearchDropdown for demos that doesn't require authentication
 */
export function MockLoadSavedSearchDropdown({
  entityType,
  onLoadSearch,
  onManageSearches,
  className,
  mockData = []
}: MockLoadSavedSearchDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLoadSearch = (search: any) => {
    try {
      // Convert saved search to AdminListPage format
      const filters: Record<string, string[]> = {};
      
      // Map the mock data filters to AdminListPage filters
      if (search.filters.categories?.includes('development')) {
        filters.role = ['admin', 'moderator'];
        filters.status = ['active'];
      } else if (search.filters.categories?.includes('design')) {
        filters.status = ['pending'];
        filters.role = ['user'];
      } else if (search.filters.categories?.includes('marketing')) {
        filters.role = ['user'];
        filters.status = ['active'];
      }

      if (search.filters.priceRange && search.filters.priceRange[0] < 500) {
        filters.status = ['inactive'];
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

      console.log('Mock saved search loaded:', search.name);
    } catch (error) {
      console.error('Failed to load saved search', error);
    }
  };

  const handleManageSearches = () => {
    setIsOpen(false);
    if (onManageSearches) {
      onManageSearches();
      console.log('Navigate to saved searches management');
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <BookmarkIcon className="h-4 w-4" />
          Saved Searches
          {mockData && mockData.length > 0 && (
            <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
              {mockData.length}
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
        
        {(!mockData || mockData.length === 0) && (
          <DropdownMenuItem disabled className="text-muted-foreground">
            No saved searches found
          </DropdownMenuItem>
        )}
        
        {mockData && mockData.length > 0 && (
          <>
            {/* Default search first */}
            {mockData.filter(s => s.isDefault).map((search) => (
              <React.Fragment key={search.id}>
                <DropdownMenuItem
                  onClick={() => handleLoadSearch(search)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <StarIcon className="h-4 w-4 text-yellow-500" />
                      <div className="flex flex-col">
                        <span className="font-medium">{search.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(search.createdAt)}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Default
                    </Badge>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </React.Fragment>
            ))}
            
            {/* Other searches */}
            {mockData
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
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(search.createdAt)}
                        </span>
                      </div>
                    </div>
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