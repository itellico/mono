'use client';
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronsUpDown,
  Filter,
  X,
  Search,
  Settings2,
  MoreHorizontal,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
export type SortDirection = 'asc' | 'desc' | null;
export interface FilterConfig {
  type: 'text' | 'select' | 'badge' | 'number' | 'date';
  placeholder?: string;
  options?: { value: string; label: string }[];
  className?: string;
}
export interface ColumnConfig<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  filterConfig?: FilterConfig;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  width?: string | number;
  hidden?: boolean;
}
export interface EnhancedDataTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  isLoading?: boolean;
  loadingRows?: number;
  emptyMessage?: string;
  searchPlaceholder?: string;
  className?: string;
  enableGlobalSearch?: boolean;
  enableColumnVisibility?: boolean;
  enableAdvancedFilters?: boolean;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  title?: string;
  description?: string;
  onRefresh?: () => void;
}
interface SortConfig {
  key: string;
  direction: SortDirection;
}
interface FilterState {
  [key: string]: string;
}
export const EnhancedDataTable = function EnhancedDataTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  loadingRows = 5,
  emptyMessage = 'No data available',
  searchPlaceholder = 'Search across all columns...',
  className,
  enableGlobalSearch = true,
  enableColumnVisibility = true,
  enableAdvancedFilters = true,
  onRowClick,
  rowClassName,
  title,
  description,
  onRefresh }: EnhancedDataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => ({ ...acc, [col.key as string]: !col.hidden }), {})
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  // Helper function to get nested property value
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((value, key) => value?.[key], obj);
  };
  // Get visible columns
  const visibleColumns = columns.filter(col => columnVisibility[col.key as string] !== false);

  // Apply global filter first
  const globallyFilteredData = globalFilter
    ? data.filter(row =>
        visibleColumns.some(column => {
          const value = getNestedValue(row, column.key as string);
          return String(value || '').toLowerCase().includes(globalFilter.toLowerCase());
        })
      )
    : data;

  // Apply column-specific filters
  const filteredData = globallyFilteredData.filter(row => {
    return Object.entries(filters).every(([key, filterValue]) => {
      if (!filterValue) return true;
      const value = getNestedValue(row, key);
      return String(value || '').toLowerCase().includes(filterValue.toLowerCase());
    });
  });

  // Apply sorting
  const sortedData = sortConfig
    ? [...filteredData].sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      })
    : filteredData;

  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        } else if (current.direction === 'desc') {
          return null; // Remove sorting
        }
      }
      return { key, direction: 'asc' };
    });
  };
  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    setFilters(current => ({
      ...current,
      [key]: value
    }));
  };
  // Clear filter
  const clearFilter = (key: string) => {
    setFilters(current => {
      const newFilters = { ...current };
      delete newFilters[key];
      return newFilters;
    });
  };
  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setGlobalFilter('');
  };
  // Handle column visibility
  const toggleColumnVisibility = (columnKey: string) => {
    setColumnVisibility(current => ({
      ...current,
      [columnKey]: !current[columnKey]
    }));
  };
  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value) || globalFilter;
  const activeFilterCount = Object.values(filters).filter(value => value).length;
  // Render filter input based on config
  const renderFilterInput = (column: ColumnConfig<T>) => {
    const key = column.key as string;
    const config = column.filterConfig;
    const currentValue = filters[key] || '';
    if (!config) {
      return (
        <Input
          placeholder={`Filter ${column.title.toLowerCase()}...`}
          value={currentValue}
          onChange={(e) => handleFilterChange(key, e.target.value)}
          className="h-8 text-xs"
        />
      );
    }
    switch (config.type) {
      case 'select':
        return (
          <Select 
            value={currentValue || 'all'} 
            onValueChange={(value) => handleFilterChange(key, value === 'all' ? '' : value)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={config.placeholder || 'All'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {config.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'text':
      default:
        return (
          <div className="relative">
            <Input
              placeholder={config.placeholder || `Filter ${column.title.toLowerCase()}...`}
              value={currentValue}
              onChange={(e) => handleFilterChange(key, e.target.value)}
              className="h-8 text-xs pr-6"
            />
            {currentValue && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-transparent"
                onClick={() => clearFilter(key)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
    }
  };
  // Render sort icon
  const renderSortIcon = (key: string) => {
    if (sortConfig?.key === key) {
      return sortConfig.direction === 'asc' ? (
        <SortAsc className="h-4 w-4" />
      ) : (
        <SortDesc className="h-4 w-4" />
      );
    }
    return <ChevronsUpDown className="h-4 w-4 opacity-50" />;
  };
  return (
    <Card className={cn("w-full", className)}>
      {/* Card Header with Title and Controls */}
      {(title || description || enableGlobalSearch || enableColumnVisibility || onRefresh) && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {title && <CardTitle className="text-xl font-semibold">{title}</CardTitle>}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="h-8"
                >
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
              )}
              {enableColumnVisibility && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Settings2 className="h-4 w-4 mr-2" />
                      Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {columns.map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.key as string}
                        className="capitalize"
                        checked={columnVisibility[column.key as string] !== false}
                        onCheckedChange={() => toggleColumnVisibility(column.key as string)}
                      >
                        {column.title}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          {/* Global Search and Filter Controls */}
          <div className="flex items-center gap-4 pt-4">
            {enableGlobalSearch && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-8"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              {enableAdvancedFilters && (
                <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                          {activeFilterCount}
                        </Badge>
                      )}
                      {showAdvancedFilters ? (
                        <ChevronUp className="h-4 w-4 ml-2" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-2" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              )}
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearAllFilters} className="h-8">
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          {/* Advanced Filters */}
          {enableAdvancedFilters && (
            <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
              <CollapsibleContent className="space-y-2 pt-4">
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                  {visibleColumns
                    .filter(column => column.filterable)
                    .map((column) => (
                      <div key={column.key as string} className="space-y-2">
                        <label className="text-sm font-medium">{column.title}</label>
                        {renderFilterInput(column)}
                      </div>
                    ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardHeader>
      )}
      <CardContent className="p-0">
        {/* Enhanced Data Table */}
        <div className="enhanced-data-table border-0 rounded-none overflow-hidden">
          <Table>
            {/* Table Header */}
            <TableHeader>
              <TableRow className="enhanced-table-header hover:bg-transparent">
                {visibleColumns.map((column) => (
                  <TableHead 
                    key={column.key as string} 
                    className={cn(
                      "enhanced-table-header-cell",
                      column.headerClassName
                    )}
                    style={{ width: column.width }}
                  >
                    <div className="flex items-center justify-between space-x-2">
                      {/* Column Title and Sort */}
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{column.title}</span>
                        {column.sortable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-white/10"
                            onClick={() => handleSort(column.key as string)}
                          >
                            {renderSortIcon(column.key as string)}
                          </Button>
                        )}
                      </div>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
              {/* Inline Filter Row - Only show when advanced filters are collapsed */}
              {!showAdvancedFilters && (
                <TableRow className="enhanced-table-filter-row hover:bg-transparent">
                  {visibleColumns.map((column) => (
                    <TableHead 
                      key={`filter-${column.key as string}`}
                      className="enhanced-table-filter-cell p-2"
                    >
                      {column.filterable && renderFilterInput(column)}
                    </TableHead>
                  ))}
                </TableRow>
              )}
            </TableHeader>
            {/* Table Body */}
            <TableBody>
              {isLoading ? (
                // Loading skeleton rows
                Array.from({ length: loadingRows }).map((_, index) => (
                  <TableRow key={index} className="enhanced-table-row">
                    {visibleColumns.map((column) => (
                      <TableCell key={column.key as string} className="enhanced-table-cell">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sortedData.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} className="h-24 p-0">
                    <Alert className="border-0 bg-transparent">
                      <AlertDescription className="text-center py-8 text-muted-foreground">
                        {emptyMessage}
                      </AlertDescription>
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : (
                // Data rows
                sortedData.map((row, index) => (
                  <TableRow 
                    key={index}
                    className={cn(
                      "enhanced-table-row",
                      index % 2 === 0 ? "enhanced-table-row-even" : "enhanced-table-row-odd",
                      onRowClick && "cursor-pointer hover:bg-accent/50",
                      rowClassName?.(row)
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {visibleColumns.map((column) => {
                      const value = getNestedValue(row, column.key as string);
                      const content = column.render ? column.render(value, row) : value;
                      return (
                        <TableCell 
                          key={column.key as string}
                          className={cn("enhanced-table-cell", column.className)}
                        >
                          {content}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {/* Results Summary */}
        {!isLoading && (
          <div className="flex items-center justify-between text-sm text-muted-foreground p-4 border-t bg-muted/30">
            <div className="flex items-center gap-4">
              <span>
                Showing <span className="font-medium">{sortedData.length}</span> of{' '}
                <span className="font-medium">{data.length}</span> results
                {hasActiveFilters && <span className="text-orange-600"> (filtered)</span>}
              </span>
              {sortConfig && (
                <Badge variant="outline" className="text-xs">
                  Sorted by {columns.find(c => c.key === sortConfig.key)?.title} 
                  {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                </Badge>
              )}
            </div>
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <span>Active filters:</span>
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount}
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 