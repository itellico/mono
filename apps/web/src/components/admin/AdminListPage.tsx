'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { browserLogger } from '@/lib/browser-logger';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { LoadSavedSearchDropdown } from '@/components/saved-searches/LoadSavedSearchDropdown';
import { MockLoadSavedSearchDropdown } from '@/components/saved-searches/MockLoadSavedSearchDropdown';
import { SaveSearchDialog } from '@/components/saved-searches/SaveSearchDialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Button,
} from '@/components/ui/button';
import {
  Input,
} from '@/components/ui/input';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Skeleton,
} from '@/components/ui/skeleton';
import {
  Checkbox,
} from '@/components/ui/checkbox';
import {
  Separator,
} from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Settings2,
  BookmarkIcon,
  StarIcon,
  PlusCircle,
  Search,
  X,
  Filter,
  Clock,
  Download,
  Mail,
  Trash,
  Eye,
  MoreHorizontal,
  Plus,
  Command,
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface StatCard {
  title: string;
  value: number | string;
  description?: string;
}

export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface FilterConfig {
  key: string;
  title: string;
  type: 'multiSelect' | 'select' | 'dateRange';
  options: FilterOption[];
  placeholder?: string;
}

export interface ColumnConfig<T = unknown> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  width?: string;
  className?: string;
  hideable?: boolean;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface BulkAction {
  key: string;
  label: string;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  permission?: {
    action: string;
    resource: string;
    context?: Record<string, any>;
  };
  onClick: (selectedIds: Set<any>) => void;
}

export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Saved search configuration for AdminListPage integration
 */
export interface SavedSearchConfig {
  /** The entity type for saved searches (e.g., 'tenants', 'users', 'categories') */
  entityType: string;
  /** Whether to enable saved search functionality */
  enabled: boolean;
  /** The name of the currently active saved search (if any) */
  activeSearchName?: string;
  /** Callback when a saved search is loaded */
  onLoadSearch?: (config: {
    filters: Record<string, string[]>;
    sortConfig: { column: string; direction: 'asc' | 'desc' | null } | null;
    columnVisibility: Record<string, boolean>;
    searchValue?: string;
    paginationLimit?: number;
    searchName: string;
  }) => void;
  /** Callback when a search is saved */
  onSaveSearch?: (searchData: {
    name: string;
    description?: string;
    isDefault: boolean;
    isPublic: boolean;
    filters: Record<string, string[]>;
    sortConfig: { column: string; direction: 'asc' | 'desc' | null } | null;
    columnVisibility: Record<string, boolean>;
    searchValue?: string;
    paginationLimit?: number;
  }) => void;
  /** Whether user has permission to save searches */
  canSave?: boolean;
  /** Whether user has permission to load searches */
  canLoad?: boolean;
  /** Mock data for development/demo purposes */
  mockData?: any[];
}

export interface AdminListPageProps<T = any> {
  // Basic configuration
  title?: string;
  description?: string;
  
  // Statistics cards (optional)
  statsCards?: StatCard[];
  
  // Add new functionality
  addConfig?: {
    label: string;
    href?: string;
    onClick?: () => void;
    permission?: {
      action: string;
      resource: string;
      context?: Record<string, any>;
    };
  };
  
  // Search configuration
  searchConfig?: {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
  };
  
  // Filters configuration
  filters?: FilterConfig[];
  activeFilters?: Record<string, string[]>;
  onFilterChange?: (key: string, values: string[]) => void;
  onClearFilters?: () => void;
  
  // Table configuration
  columns: ColumnConfig<T>[];
  data: T[];
  isLoading?: boolean;
  fetchError?: string | null;
  
  // Row selection
  selectedRows?: Set<any>;
  onRowSelect?: (id: any, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  getRowId?: (row: T) => any;
  
  // Bulk actions
  bulkActions?: BulkAction[];
  renderBulkActions?: () => React.ReactNode;
  
  // Pagination
  pagination?: PaginationConfig;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  
  // Sorting
  sortConfig?: {
    column: string;
    direction: 'asc' | 'desc' | null;
  };
  onSort?: (column: string) => void;
  
  // Column visibility
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  
  // Row interactions
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: (row: T, index: number) => string;
  
  // Custom renderers
  renderRowActions?: (row: T, index: number) => React.ReactNode;
  renderEmptyState?: () => React.ReactNode;
  renderLoadingState?: () => React.ReactNode;
  
  // Saved searches configuration
  savedSearchConfig?: SavedSearchConfig;
  
  // Permission context
  userContext?: {
    userId: string;
    adminRole: string;
    tenantId: string | null;
    permissions: string[];
  };
  
  // Additional props
  className?: string;
  children?: React.ReactNode;
}



// ============================================================================
// FILTER BAR COMPONENT
// ============================================================================

interface FilterBarProps {
  filters: FilterConfig[];
  activeFilters: Record<string, string[]>;
  onFilterChange: (key: string, values: string[]) => void;
  onClearFilters: () => void;
  searchConfig?: {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
  };
  savedSearchConfig?: SavedSearchConfig;
  sortConfig?: {
    column: string;
    direction: 'asc' | 'desc' | null;
  };
  columnVisibility?: Record<string, boolean>;
  paginationConfig?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPaginationChange?: (limit: number) => void;
}

function FilterBar({ 
  filters, 
  activeFilters, 
  onFilterChange, 
  onClearFilters, 
  searchConfig,
  savedSearchConfig,
  sortConfig,
  columnVisibility,
  paginationConfig,
  onPaginationChange
}: FilterBarProps) {
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);

  // Check if current state has any filters or customizations
  const hasActiveSearch = Boolean(
    searchConfig?.value || 
    Object.values(activeFilters).some(values => values.length > 0) || 
    sortConfig?.column ||
    (columnVisibility && Object.values(columnVisibility).some(visible => !visible))
  );

  const handleLoadSearch = (config: {
    filters: Record<string, string[]>;
    sortConfig: { column: string; direction: 'asc' | 'desc' | null } | null;
    columnVisibility: Record<string, boolean>;
    searchValue?: string;
    paginationLimit?: number;
    searchName: string;
  }) => {
    // Clear current filters first
    onClearFilters();
    
    // Apply loaded search configuration
    Object.entries(config.filters).forEach(([key, values]) => {
      if (values.length > 0) {
        onFilterChange(key, values);
      }
    });

    // Apply search value if provided and search config exists
    if (config.searchValue && searchConfig) {
      searchConfig.onChange(config.searchValue);
    }

    // Apply pagination limit if provided
    if (config.paginationLimit && onPaginationChange) {
      onPaginationChange(config.paginationLimit);
    }

    // Call the saved search config callback if provided
    savedSearchConfig?.onLoadSearch?.(config);
  };

  const handleSaveSearch = (searchData: {
    name: string;
    description?: string;
    isDefault: boolean;
    isPublic: boolean;
  }) => {
    // Construct the full saved search data including current state
    const fullSearchData = {
      ...searchData,
      filters: activeFilters,
      sortConfig: sortConfig || null,
      columnVisibility: columnVisibility || {},
      searchValue: searchConfig?.value,
      paginationLimit: paginationConfig?.limit
    };
    
    savedSearchConfig?.onSaveSearch?.(fullSearchData);
    setShowSaveDialog(false);
  };

  return (
    <div className="space-y-3">
      {/* Active Search Indicator Only */}
      {savedSearchConfig?.enabled && savedSearchConfig.activeSearchName && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted border border-border rounded-lg">
          <StarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Active Search: <span className="font-semibold">{savedSearchConfig.activeSearchName}</span>
          </span>
          <Button
            variant="outline"
            size="sm" 
            onClick={() => {
              onClearFilters();
              // Clear the active search name by calling onLoadSearch with empty config
              savedSearchConfig?.onLoadSearch?.({
                filters: {},
                sortConfig: null,
                columnVisibility: {},
                searchValue: '',
                paginationLimit: undefined,
                searchName: ''
              });
            }}
            className="h-6 px-2 py-1 text-xs"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Main Filter Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Saved Search Controls */}
        {savedSearchConfig?.enabled && (
          <div className="flex items-center gap-1">
            {/* Load Saved Search */}
            {savedSearchConfig.canLoad && savedSearchConfig.mockData ? (
              <MockLoadSavedSearchDropdown
                entityType={savedSearchConfig.entityType}
                onLoadSearch={handleLoadSearch}
                mockData={savedSearchConfig.mockData}
                className="gap-2"
              />
            ) : savedSearchConfig.canLoad ? (
              <LoadSavedSearchDropdown
                entityType={savedSearchConfig.entityType}
                onLoadSearch={handleLoadSearch}
              />
            ) : null}
            
            {/* Save Current Search */}
            {savedSearchConfig.canSave && hasActiveSearch && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                className="h-8 px-2 gap-1"
              >
                <BookmarkIcon className="h-3 w-3" />
                Save
              </Button>
            )}
          </div>
        )}

        {/* Search */}
        {searchConfig && (
          <div className="flex-1 min-w-0 max-w-xs">
            <Input
              placeholder={searchConfig.placeholder}
              value={searchConfig.value}
              onChange={(e) => searchConfig.onChange(e.target.value)}
              className="h-8"
            />
          </div>
        )}

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-1">
          {filters.map((filter) => {
            const activeValues = activeFilters[filter.key] || [];
            const isActive = activeValues.length > 0;

            return (
              <Popover key={filter.key}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 gap-1",
                      isActive && "bg-muted border-muted-foreground"
                    )}
                  >
                    <PlusCircle className="h-3 w-3" />
                    {filter.title}
                    {isActive && (
                      <Badge 
                        variant="secondary" 
                        className="ml-1 h-4 px-1 text-xs"
                      >
                        {activeValues.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="start">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">{filter.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Select {filter.title.toLowerCase()} to filter by
                      </p>
                    </div>
                    <div className="grid gap-2">
                      {filter.options.map((option) => {
                        const isSelected = activeValues.includes(option.value);
                        return (
                          <div 
                            key={option.value} 
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`${filter.key}-${option.value}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                const newValues = checked
                                  ? [...activeValues, option.value]
                                  : activeValues.filter(v => v !== option.value);
                                onFilterChange(filter.key, newValues);
                              }}
                            />
                            <label
                              htmlFor={`${filter.key}-${option.value}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {option.label}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>

        {/* Clear Filters */}
        {Object.values(activeFilters).some(values => values.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            Clear ({Object.values(activeFilters).reduce((count, values) => count + values.length, 0)})
          </Button>
        )}
      </div>

      {/* Save Search Dialog */}
      {savedSearchConfig?.enabled && savedSearchConfig.canSave && (
        <SaveSearchDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          entityType={savedSearchConfig.entityType}
          currentFilters={activeFilters}
          currentSort={sortConfig && sortConfig.direction ? {
            sortBy: sortConfig.column,
            sortOrder: sortConfig.direction
          } : undefined}
          currentSearch={searchConfig?.value}
          currentColumnConfig={columnVisibility}
          currentPagination={paginationConfig ? {
            limit: paginationConfig.limit
          } : undefined}
          onSaved={handleSaveSearch}
        />
      )}
    </div>
  );
}

// ============================================================================
// PAGINATION COMPONENT
// ============================================================================

interface PaginationControlsProps {
  pagination: PaginationConfig;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

function PaginationControls({ pagination, onPageChange, onLimitChange }: PaginationControlsProps) {
  const { page, limit, total, totalPages } = pagination;
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-16">
                {limit}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <DropdownMenuItem
                  key={pageSize}
                  onClick={() => onLimitChange(pageSize)}
                >
                  {pageSize}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {page} of {totalPages}
        </div>
        <div className="text-sm text-muted-foreground pr-4">
          {startItem}-{endItem} of {total} items
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={!canGoPrevious}
          className="hidden h-8 w-8 p-0 lg:flex"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrevious}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          className="hidden h-8 w-8 p-0 lg:flex"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * AdminListPage - Enterprise Admin List Component
 * 
 * A comprehensive, reusable component for admin list pages that provides:
 * - Statistics cards with icons and colors
 * - Search and multi-select filters
 * - Responsive table with row selection
 * - Bulk actions with permissions
 * - Sortable columns
 * - Pagination controls
 * - Loading and error states
 * - Customizable renderers
 * 
 * @component
 * @example
 * <AdminListPage
 *   title="User Management"
 *   description="Manage platform users"
 *   statsCards={[{ title: "Total Users", value: 150, icon: Users }]}
 *   searchConfig={{ placeholder: "Search users...", value: search, onChange: setSearch }}
 *   filters={[{ key: "status", title: "Status", type: "multiSelect", options: statusOptions }]}
 *   columns={userColumns}
 *   data={users}
 *   bulkActions={[{ key: "activate", label: "Activate", onClick: handleActivate }]}
 *   pagination={{ page: 1, limit: 20, total: 150, totalPages: 8 }}
 *   sortConfig={{ column: "name", direction: "asc" }}
 *   onSort={handleSort}
 * />
 */
export function AdminListPage<T = any>({
  title,
  description,
  statsCards,
  addConfig,
  searchConfig,
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  columns,
  data,
  isLoading = false,
  fetchError = null,
  selectedRows = new Set(),
  onRowSelect,
  onSelectAll,
  getRowId = (row: any) => row.id,
  bulkActions = [],
  renderBulkActions,
  pagination,
  onPageChange,
  onLimitChange,
  sortConfig,
  onSort,
  onRowClick,
  rowClassName,
  renderRowActions,
  renderEmptyState,
  renderLoadingState,
  userContext,
  className,
  children,
  columnVisibility,
  onColumnVisibilityChange,
  savedSearchConfig,
}: AdminListPageProps<T>) {
  const router = useRouter();
  
  // Calculate selection state
  const isAllSelected = data.length > 0 && data.every(row => selectedRows.has(getRowId(row)));
  const isIndeterminate = data.some(row => selectedRows.has(getRowId(row))) && !isAllSelected;
  
  // Handle add button click
  const handleAddClick = () => {
    if (addConfig?.onClick) {
      addConfig.onClick();
    } else if (addConfig?.href) {
      router.push(addConfig.href);
    }
    
    if (userContext) {
      browserLogger.userAction('admin_add_click', `Add button clicked: ${addConfig?.label}`);
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (onSelectAll) {
      onSelectAll(checked as boolean);
    }
  };
  
  // Handle row selection
  const handleRowSelect = (rowId: any, checked: boolean) => {
    if (onRowSelect) {
      onRowSelect(rowId, checked);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (key: string, values: string[]) => {
    if (onFilterChange) {
      onFilterChange(key, values);
    }
  };

  const clearAllFilters = () => {
    if (onClearFilters) {
      onClearFilters();
    }
  };

  // Handle column sorting
  const handleSort = (column: string) => {
    if (onSort) {
      onSort(column);
    }
  };

  // Get sort icon for column
  const getSortIcon = (column: ColumnConfig<T>) => {
    if (!column.sortable || !sortConfig) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    
    if (sortConfig.column === String(column.key)) {
      return sortConfig.direction === 'asc' 
        ? <ArrowUp className="ml-2 h-4 w-4" />
        : <ArrowDown className="ml-2 h-4 w-4" />;
    }
    
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      </div>

      {/* Statistics Cards */}
      {statsCards && statsCards.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-4">
          {/* Top Level - FilterBar and Action Buttons aligned */}
          <div className="flex items-start justify-between gap-4">
            {/* Left side - Search and Filters */}
            <div className="flex-1 min-w-0">
              {(searchConfig || filters.length > 0) && (
                <FilterBar
                  filters={filters}
                  activeFilters={activeFilters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={clearAllFilters}
                  searchConfig={searchConfig}
                  savedSearchConfig={savedSearchConfig}
                  sortConfig={sortConfig}
                  columnVisibility={columnVisibility}
                  paginationConfig={pagination}
                  onPaginationChange={onLimitChange}
                />
              )}
            </div>
            
            {/* Right side - Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Column Visibility Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings2 className="h-4 w-4" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {columns
                    .filter((column) => column.hideable !== false) // Only show hideable columns
                    .map((column) => {
                      const columnKey = String(column.key);
                      const isVisible = columnVisibility?.[columnKey] !== false;
                      return (
                        <DropdownMenuCheckboxItem
                          key={columnKey}
                          className="capitalize"
                          checked={isVisible}
                          onCheckedChange={(checked) => {
                            if (onColumnVisibilityChange) {
                              onColumnVisibilityChange({
                                ...columnVisibility,
                                [columnKey]: checked
                              });
                            }
                          }}
                        >
                          {column.title}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Add Button */}
              {addConfig && (
                <Button 
                  onClick={() => {
                    if (addConfig.onClick) {
                      addConfig.onClick();
                    } else if (addConfig.href) {
                      // Handle href navigation if needed
                      window.location.href = addConfig.href;
                    }
                  }} 
                  className="gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  {addConfig.label}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 relative">
          {/* Bulk Actions Toolbar - Appears above table when items selected */}
          {selectedRows.size > 0 && (
            <div className="sticky top-0 z-10 bg-muted/50 border-b border-border">
              <div className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                      <span className="text-sm font-medium text-foreground">
                        {selectedRows.size} selected
                      </span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectAll(false)}
                      className="h-6 px-2 text-muted-foreground hover:text-foreground"
                    >
                      Clear selection
                    </Button>
                  </div>
                  
                  {/* Bulk Action Buttons */}
                  <div className="flex items-center gap-2">
                    {renderBulkActions ? (
                      renderBulkActions()
                    ) : (
                      <div className="flex items-center gap-2">
                        {bulkActions.map((action) => (
                          <PermissionGate 
                            key={action.key}
                            permissions={[action.permission ? `${action.permission.resource}.${action.permission.action}` : 'admin.manage']}
                            fallback={null}
                          >
                            <Button 
                              variant={action.variant || 'outline'} 
                              size="sm" 
                              onClick={() => action.onClick(selectedRows)}
                              className="gap-2"
                            >
                              {action.label}
                            </Button>
                          </PermissionGate>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="border-b px-6">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {(onRowSelect || onSelectAll) && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                  )}
                  {columns
                    .filter((column) => columnVisibility?.[String(column.key)] !== false)
                    .map((column) => (
                      <TableHead 
                        key={String(column.key)} 
                        className={cn(column.className, column.sortable && "cursor-pointer select-none")}
                        style={column.width ? { width: column.width } : undefined}
                        onClick={() => column.sortable && handleSort(String(column.key))}
                      >
                        <div className="flex items-center">
                          {column.title}
                          {column.sortable && getSortIcon(column)}
                        </div>
                      </TableHead>
                    ))}
                  {renderRowActions && (
                    <TableHead className="w-12"></TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton
                  renderLoadingState ? renderLoadingState() : (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {(onRowSelect || onSelectAll) && (
                          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        )}
                        {columns
                          .filter((column) => columnVisibility?.[String(column.key)] !== false)
                          .map((column) => (
                            <TableCell key={String(column.key)}>
                              <Skeleton className="h-4 w-24" />
                            </TableCell>
                          ))}
                        {renderRowActions && (
                          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        )}
                      </TableRow>
                    ))
                  )
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={
                      columns.filter((column) => columnVisibility?.[String(column.key)] !== false).length + 
                      (onRowSelect ? 1 : 0) + 
                      (renderRowActions ? 1 : 0)
                    } className="h-24 text-center text-muted-foreground">
                      {renderEmptyState ? renderEmptyState() : (fetchError || 'No data found')}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, index) => {
                    const rowId = getRowId(row);
                    const isSelected = selectedRows.has(rowId);
                    
                    return (
                      <TableRow 
                        key={rowId}
                        className={cn(
                          "cursor-pointer",
                          isSelected && "bg-muted/50",
                          rowClassName && rowClassName(row, index)
                        )}
                        onClick={() => {
                          if (onRowClick) {
                            onRowClick(row, index);
                          }
                          if (userContext) {
                            browserLogger.info('Row clicked', { 
                              rowId,
                              userRole: userContext.adminRole
                            });
                          }
                        }}
                      >
                        {(onRowSelect || onSelectAll) && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked: boolean | "indeterminate") => 
                                handleRowSelect(rowId, checked as boolean)
                              }
                              aria-label={`Select row ${index + 1}`}
                            />
                          </TableCell>
                        )}
                        {columns
                          .filter((column) => columnVisibility?.[String(column.key)] !== false)
                          .map((column) => (
                            <TableCell 
                              key={String(column.key)}
                              className={column.className}
                              style={column.width ? { width: column.width } : undefined}
                            >
                              {column.render 
                                ? column.render(row[column.key], row, index)
                                : String(row[column.key] || '')
                              }
                            </TableCell>
                          ))}
                        {renderRowActions && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {renderRowActions(row, index)}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer */}
          {pagination && onPageChange && onLimitChange && (
            <div className="px-6 py-4">
              <div className="flex items-center justify-between gap-8">
                <div className="text-sm text-muted-foreground">
                  Showing {data.length} of {pagination.total} results
                </div>
                <div className="flex items-center gap-6">
                  <PaginationControls
                    pagination={pagination}
                    onPageChange={onPageChange}
                    onLimitChange={onLimitChange}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom children */}
      {children}
    </div>
  );
} 