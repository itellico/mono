'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SearchFormRenderer } from './SearchFormRenderer';
import { SearchResultsRenderer } from './SearchResultsRenderer';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { browserLogger } from '@/lib/browser-logger';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';

/**
 * 🔍 SearchPageLayout - Complete Search Interface
 * 
 * This component integrates with your itellico Mono framework:
 * - Lives within StandardLayout (topbar + sidebar + content)
 * - Uses schemas and option sets from your infrastructure
 * - Provides search form + results in a single interface
 * - Handles URL state management for shareable searches
 * - Integrates with audit tracking system
 */

interface SearchConfig {
  schemaId: string;
  industryType: string;
  title: string;
  description?: string;
  searchFields: Array<{
    id: string;
    label: string;
    type: 'text' | 'select' | 'number' | 'date';
    options?: Array<{ value: string; label: string }>;
    placeholder?: string;
  }>;
  resultFields: Array<{
    id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'badge' | 'image' | 'link';
    primary?: boolean;
    sortable?: boolean;
  }>;
}

interface SearchPageLayoutProps {
  config: SearchConfig;
  
  // API integration
  onSearch: (filters: Record<string, any>, page?: number) => Promise<{
    results: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  
  // Actions
  onViewResult: (id: string) => void;
  onEditResult?: (id: string) => void;
  onDeleteResult?: (id: string) => void;
  onBulkAction?: (action: string, ids: string[]) => void;
  
  // Layout options
  showFiltersInSidebar?: boolean;
  defaultViewMode?: 'grid' | 'list';
  allowBulkActions?: boolean;
  
  className?: string;
}

export function SearchPageLayout({
  config,
  onSearch,
  onViewResult,
  onEditResult,
  onDeleteResult,
  onBulkAction,
  showFiltersInSidebar = false,
  defaultViewMode = 'grid',
  allowBulkActions = true,
  className
}: SearchPageLayoutProps) {
  // State management
  const [results, setResults] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});

  // URL state management
  const searchParams = useSearchParams();
  const router = useRouter();

  // Audit tracking
  const { trackPageView, trackSearch } = useAuditTracking();

  // Track page view on mount
  useEffect(() => {
    trackPageView(`search_${config.industryType}`, {
      schemaId: config.schemaId,
      industryType: config.industryType,
    });
  }, [config.schemaId, config.industryType, trackPageView]);

  // Load initial search from URL params
  useEffect(() => {
    const filters: Record<string, any> = {};
    const page = parseInt(searchParams.get('page') || '1');
    
    // Extract filters from URL
    config.searchFields.forEach(field => {
      const value = searchParams.get(field.id);
      if (value) {
        filters[field.id] = value;
      }
    });

    if (Object.keys(filters).length > 0) {
      setCurrentFilters(filters);
      handleSearch(filters, page);
    }
  }, [searchParams]);

  const handleSearch = async (filters: Record<string, any>, page = 1) => {
    setLoading(true);
    setCurrentFilters(filters);

    try {
      // Update URL with search parameters
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value.toString());
      });
      if (page > 1) params.set('page', page.toString());
      
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      router.replace(newUrl);

      // Perform search
      const searchResult = await onSearch(filters, page);
      
      setResults(searchResult.results);
      setPagination(searchResult.pagination);

      // Track search event
      trackSearch(config.schemaId, {
        filters,
        resultCount: searchResult.results.length,
        page,
        industryType: config.industryType,
      });

      browserLogger.userAction('search_completed', {
        schemaId: config.schemaId,
        industryType: config.industryType,
        filters,
        resultCount: searchResult.results.length,
        page,
      });

    } catch (error) {
      browserLogger.error('Search failed', {
        schemaId: config.schemaId,
        industryType: config.industryType,
        filters,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentFilters({});
    setResults([]);
    setPagination({
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0,
    });
    
    // Clear URL parameters
    router.replace(window.location.pathname);
  };

  const handlePageChange = (page: number) => {
    handleSearch(currentFilters, page);
  };

  // Sidebar layout (filters in sidebar)
  if (showFiltersInSidebar) {
    return (
      <div className={`flex gap-6 ${className}`}>
        {/* Sidebar with filters */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-4">
            <SearchFormRenderer
              schemaId={config.schemaId}
              industryType={config.industryType}
              searchFields={config.searchFields}
              onSearch={(filters) => handleSearch(filters, 1)}
              onReset={handleReset}
              loading={loading}
              layout="vertical"
              resultCount={pagination.total}
            />
          </div>
        </div>

        {/* Main content with results */}
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{config.title}</h1>
            {config.description && (
              <p className="text-muted-foreground mt-2">{config.description}</p>
            )}
          </div>

          <SearchResultsRenderer
            results={results}
            pagination={pagination}
            fields={config.resultFields}
            schemaId={config.schemaId}
            industryType={config.industryType}
            viewMode={defaultViewMode}
            allowBulkActions={allowBulkActions}
            onPageChange={handlePageChange}
            onViewResult={onViewResult}
            onEditResult={onEditResult}
            onDeleteResult={onDeleteResult}
            onBulkAction={onBulkAction}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  // Standard layout (filters above results)
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">{config.title}</h1>
        {config.description && (
          <p className="text-muted-foreground mt-2">{config.description}</p>
        )}
      </div>

      {/* Search Form */}
      <SearchFormRenderer
        schemaId={config.schemaId}
        industryType={config.industryType}
        searchFields={config.searchFields}
        onSearch={(filters) => handleSearch(filters, 1)}
        onReset={handleReset}
        loading={loading}
        layout="horizontal"
        resultCount={pagination.total}
      />

      {/* Separator */}
      {results.length > 0 && <Separator />}

      {/* Search Results */}
      <SearchResultsRenderer
        results={results}
        pagination={pagination}
        fields={config.resultFields}
        schemaId={config.schemaId}
        industryType={config.industryType}
        viewMode={defaultViewMode}
        allowBulkActions={allowBulkActions}
        onPageChange={handlePageChange}
        onViewResult={onViewResult}
        onEditResult={onEditResult}
        onDeleteResult={onDeleteResult}
        onBulkAction={onBulkAction}
        loading={loading}
      />
    </div>
  );
}

export default SearchPageLayout; 