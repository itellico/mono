'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { browserLogger } from '@/lib/browser-logger';
import { PermissionGate } from '@/components/auth/PermissionGate';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  TrendingUpIcon,
  UsersIcon,
  SearchIcon,
  ArrowRightIcon,
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  entityType: string;
  isDefault: boolean;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  user?: {
    name: string | null;
    email: string;
  };
}

interface SavedSearchesStats {
  totalSearches: number;
  userSearches: number;
  publicSearches: number;
  recentSearches: SavedSearch[];
  popularEntityTypes: {
    entityType: string;
    count: number;
  }[];
}

/**
 * Props for SavedSearchesWidget component
 */
export interface SavedSearchesWidgetProps {
  /** Whether to show the full widget or compact version */
  variant?: 'full' | 'compact';
  /** Maximum number of recent searches to display */
  maxRecentSearches?: number;
  /** CSS class name for styling */
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * SavedSearchesWidget - Dashboard widget for saved searches overview
 * 
 * Displays quick statistics and recent saved searches for admin dashboard.
 * Provides quick access to manage saved searches and view popular entity types.
 * 
 * @component
 * @example
 * <SavedSearchesWidget 
 *   variant="full" 
 *   maxRecentSearches={5} 
 * />
 * 
 * @param {SavedSearchesWidgetProps} props - Component props
 * @returns {React.ReactElement} Rendered widget component
 */
export function SavedSearchesWidget({
  variant = 'full',
  maxRecentSearches = 5,
  className = ''
}: SavedSearchesWidgetProps): React.ReactElement {
  
  // ============================================================================
  // QUERIES & DATA FETCHING
  // ============================================================================
  
  const { 
    data: stats, 
    isLoading, 
    error 
  } = useQuery<SavedSearchesStats>({
    queryKey: ['saved-searches', 'dashboard-stats'],
    queryFn: async () => {
      browserLogger.userAction('Dashboard widget loaded', 'saved_searches_widget', {
        variant,
        maxRecentSearches
      });
      
      const response = await fetch('/api/v1/admin/saved-searches?dashboard=true&limit=' + maxRecentSearches);
      if (!response.ok) {
        throw new Error('Failed to fetch saved searches stats');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  const handleViewAllClick = () => {
    browserLogger.userAction('View all saved searches clicked', 'dashboard_widget_navigation', {
      source: 'saved_searches_widget',
      destination: '/admin/saved-searches'
    });
  };
  
  const handleSearchClick = (search: SavedSearch) => {
    browserLogger.userAction('Recent search clicked', 'saved_search_navigation', {
      searchId: search.id,
      searchName: search.name,
      entityType: search.entityType,
      source: 'dashboard_widget'
    });
  };
  
  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  
  const renderLoadingState = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-12" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderErrorState = () => (
    <div className="text-center py-6">
      <SearchIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">
        Unable to load saved searches data
      </p>
      {error && (
        <p className="text-xs text-destructive mt-1">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      )}
    </div>
  );
  
  const renderStats = () => {
    if (!stats) return null;
    
    return (
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total Searches</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{stats.totalSearches}</span>
            <BookmarkIcon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Public Searches</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{stats.publicSearches}</span>
            <UsersIcon className="h-4 w-4 text-green-600" />
          </div>
        </div>
      </div>
    );
  };
  
  const renderRecentSearches = () => {
    if (!stats?.recentSearches?.length) {
      return (
        <div className="text-center py-4">
          <SearchIcon className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No recent searches</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {stats.recentSearches.map((search) => (
          <div
            key={search.id}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => handleSearchClick(search)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{search.name}</p>
                {search.isDefault && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    Default
                  </Badge>
                )}
                {search.isPublic && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    Public
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {search.entityType}
                </Badge>
                {search.user && (
                  <span className="text-xs text-muted-foreground">
                    by {search.user.name || search.user.email}
                  </span>
                )}
              </div>
            </div>
            <ArrowRightIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  };
  
  const renderPopularEntityTypes = () => {
    if (!stats?.popularEntityTypes?.length) return null;
    
    return (
      <div className="mt-4 pt-4 border-t">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <TrendingUpIcon className="h-4 w-4" />
          Popular Entity Types
        </h4>
        <div className="flex flex-wrap gap-1">
          {stats.popularEntityTypes.slice(0, 3).map((item) => (
            <Badge key={item.entityType} variant="secondary" className="text-xs">
              {item.entityType} ({item.count})
            </Badge>
          ))}
        </div>
      </div>
    );
  };
  
  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  
  return (
    <PermissionGate 
      permissions={['read:saved_searches']}
      fallback={null}
    >
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookmarkIcon className="h-5 w-5" />
              Saved Searches
            </CardTitle>
            <PermissionGate 
              permissions={['read:saved_searches_all']}
              fallback={null}
            >
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                onClick={handleViewAllClick}
              >
                <Link href="/admin/saved-searches">
                  View All
                </Link>
              </Button>
            </PermissionGate>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            renderLoadingState()
          ) : error ? (
            renderErrorState()
          ) : (
            <>
              {variant === 'full' && renderStats()}
              
              <div>
                <h4 className="text-sm font-medium mb-3">Recent Searches</h4>
                {renderRecentSearches()}
              </div>
              
              {variant === 'full' && renderPopularEntityTypes()}
            </>
          )}
        </CardContent>
      </Card>
    </PermissionGate>
  );
} 