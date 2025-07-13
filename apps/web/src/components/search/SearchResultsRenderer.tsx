'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Download, 
  Mail,
  Users,
  Grid,
  List
} from 'lucide-react';
import { browserLogger } from '@/lib/browser-logger';

/**
 * 🔍 SearchResultsRenderer - Schema-Driven Results Display
 * 
 * Features:
 * - Schema-driven result formatting
 * - Bulk actions and selection
 * - Standard pagination
 * - Multiple view modes (grid, list)
 * - Industry-specific actions
 */

interface ResultField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'badge' | 'image' | 'link';
  primary?: boolean; // Show prominently
  sortable?: boolean;
}

interface SearchResult {
  id: string;
  [key: string]: any;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SearchResultsRendererProps {
  // Data
  results: SearchResult[];
  pagination: PaginationInfo;
  fields: ResultField[];
  
  // Configuration
  schemaId: string;
  industryType: string;
  viewMode?: 'grid' | 'list';
  allowBulkActions?: boolean;
  
  // Actions
  onPageChange: (page: number) => void;
  onViewResult: (id: string) => void;
  onEditResult?: (id: string) => void;
  onDeleteResult?: (id: string) => void;
  onBulkAction?: (action: string, ids: string[]) => void;
  
  // Loading states
  loading?: boolean;
  className?: string;
}

export function SearchResultsRenderer({
  results,
  pagination,
  fields,
  schemaId,
  industryType,
  viewMode = 'grid',
  allowBulkActions = true,
  onPageChange,
  onViewResult,
  onEditResult,
  onDeleteResult,
  onBulkAction,
  loading = false,
  className
}: SearchResultsRendererProps) {
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [currentViewMode, setCurrentViewMode] = useState<'grid' | 'list'>(viewMode);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedResults(results.map(r => r.id));
    } else {
      setSelectedResults([]);
    }
  };

  const handleSelectResult = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedResults([...selectedResults, id]);
    } else {
      setSelectedResults(selectedResults.filter(rid => rid !== id));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedResults.length === 0) return;
    
    browserLogger.userAction('bulk_action_performed', {
      schemaId,
      industryType,
      action,
      itemCount: selectedResults.length,
    });

    onBulkAction?.(action, selectedResults);
    setSelectedResults([]);
  };

  const handleViewResult = (id: string) => {
    browserLogger.userAction('result_viewed', {
      schemaId,
      industryType,
      resultId: id,
    });
    onViewResult(id);
  };

  const formatFieldValue = (field: ResultField, value: any) => {
    if (!value) return '-';

    switch (field.type) {
      case 'badge':
        return <Badge variant="secondary">{value}</Badge>;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'image':
        return (
          <img 
            src={value} 
            alt={field.label}
            className="w-10 h-10 rounded-full object-cover"
          />
        );
      case 'link':
        return (
          <Button variant="link" className="p-0 h-auto">
            {value}
          </Button>
        );
      default:
        return value;
    }
  };

  const renderGridView = () => (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {results.map((result) => (
        <Card key={result.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {allowBulkActions && (
                  <Checkbox
                    checked={selectedResults.includes(result.id)}
                    onCheckedChange={(checked) => 
                      handleSelectResult(result.id, checked as boolean)
                    }
                  />
                )}
                <CardTitle className="text-lg">
                  {formatFieldValue(
                    fields.find(f => f.primary) || fields[0], 
                    result[fields.find(f => f.primary)?.id || fields[0].id]
                  )}
                </CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleViewResult(result.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  {onEditResult && (
                    <DropdownMenuItem onClick={() => onEditResult(result.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDeleteResult && (
                    <DropdownMenuItem 
                      onClick={() => onDeleteResult(result.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fields.slice(1, 4).map((field) => (
                <div key={field.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{field.label}:</span>
                  <span>{formatFieldValue(field, result[field.id])}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {results.map((result) => (
        <Card key={result.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {allowBulkActions && (
                  <Checkbox
                    checked={selectedResults.includes(result.id)}
                    onCheckedChange={(checked) => 
                      handleSelectResult(result.id, checked as boolean)
                    }
                  />
                )}
                <div className="flex items-center gap-4 flex-1">
                  {fields.slice(0, 4).map((field) => (
                    <div key={field.id} className="flex-1">
                      <div className="text-sm text-muted-foreground">{field.label}</div>
                      <div className="font-medium">
                        {formatFieldValue(field, result[field.id])}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleViewResult(result.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  {onEditResult && (
                    <DropdownMenuItem onClick={() => onEditResult(result.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDeleteResult && (
                    <DropdownMenuItem 
                      onClick={() => onDeleteResult(result.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading results...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">
            Search Results ({pagination.total})
          </h3>
          
          {selectedResults.length > 0 && allowBulkActions && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedResults.length} selected
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkAction('export')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('email')}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('delete')}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {allowBulkActions && (
            <Checkbox
              checked={selectedResults.length === results.length && results.length > 0}
              onCheckedChange={handleSelectAll}
            />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentViewMode(currentViewMode === 'grid' ? 'list' : 'grid')}
          >
            {currentViewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No results found. Try adjusting your search criteria.
          </CardContent>
        </Card>
      ) : (
        <>
          {currentViewMode === 'grid' ? renderGridView() : renderListView()}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => onPageChange(pagination.page - 1)}
                      className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => onPageChange(page)}
                          isActive={page === pagination.page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => onPageChange(pagination.page + 1)}
                      className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SearchResultsRenderer; 