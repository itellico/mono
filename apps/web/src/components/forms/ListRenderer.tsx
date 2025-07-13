'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  List, 
  Grid, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { browserLogger } from '@/lib/browser-logger';
import { cn } from '@/lib/utils';

/**
 * ListRenderer Component
 * 
 * Renders dynamic lists and tables based on model schemas.
 * Supports pagination, sorting, selection, and row actions.
 * 
 * @component
 * @param {ListRendererProps} props - The list renderer properties
 * @example
 * <ListRenderer
 *   schemaId="user-list-schema"
 *   data={users}
 *   onRowAction={(action, item) => console.log(action, item)}
 * />
 */

export interface ListColumn {
  field: string;
  label: string;
  type: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, item: any) => React.ReactNode;
}

export interface ListAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  condition?: (item: any) => boolean;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ListRendererProps {
  /** Schema ID to generate list from */
  schemaId: string;
  /** Optional tenant ID for multi-tenant support */
  tenantId?: number;
  /** Data to display */
  data: any[];
  /** Total number of items (for pagination) */
  totalItems?: number;
  /** Current page (0-based) */
  currentPage?: number;
  /** Items per page */
  pageSize?: number;
  /** Page change handler */
  onPageChange?: (page: number) => void;
  /** Page size change handler */
  onPageSizeChange?: (pageSize: number) => void;
  /** Sort change handler */
  onSortChange?: (sort: SortConfig) => void;
  /** Row action handler */
  onRowAction?: (action: string, item: any, selectedItems?: any[]) => void;
  /** Selection change handler */
  onSelectionChange?: (selectedItems: any[]) => void;
  /** Available actions for rows */
  actions?: ListAction[];
  /** Available bulk actions */
  bulkActions?: ListAction[];
  /** Whether list is in loading state */
  loading?: boolean;
  /** Whether list is disabled */
  disabled?: boolean;
  /** View mode (list or grid) */
  viewMode?: 'list' | 'grid';
  /** Allow view mode toggle */
  allowViewModeToggle?: boolean;
  /** Enable row selection */
  enableSelection?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom column overrides */
  columnOverrides?: Partial<Record<string, Partial<ListColumn>>>;
}

export function ListRenderer({
  schemaId,
  tenantId,
  data = [],
  totalItems,
  currentPage = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onRowAction,
  onSelectionChange,
  actions = [],
  bulkActions = [],
  loading = false,
  disabled = false,
  viewMode = 'list',
  allowViewModeToggle = true,
  enableSelection = false,
  className,
  emptyMessage = 'No items found',
  columnOverrides = {}
}: ListRendererProps) {
  const { toast } = useToast();
  const [listDefinition, setListDefinition] = useState<FormDefinition | null>(null);
  const [columns, setColumns] = useState<ListColumn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load list definition from schema using API
  React.useEffect(() => {
    let isCancelled = false;

    const loadListDefinition = async () => {
      try {
        setIsLoading(true);
        browserLogger.info('Loading list definition', { schemaId, tenantId });
        
        // Call API instead of using FormGenerationService directly
        const response = await fetch(`/api/v1/forms/generate-from-schema`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            schemaId,
            tenantId,
            context: 'search'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate form definition');
        }

        const definition = await response.json();
        
        if (!isCancelled) {
          setListDefinition(definition);
          
          // Generate columns from schema fields
          const generatedColumns: ListColumn[] = definition.fields.map(field => ({
            field: field.name,
            label: field.label,
            type: field.type,
            sortable: ['text', 'number', 'date', 'email'].includes(field.type),
            width: getColumnWidth(field.type),
            ...columnOverrides[field.name]
          }));
          
          setColumns(generatedColumns);
          setIsInitialized(true);
          
          browserLogger.info('List definition loaded successfully', {
            fieldsCount: definition.fields.length,
            columnsCount: generatedColumns.length,
            listName: definition.name
          });
        }
      } catch (error) {
        if (!isCancelled) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load list';
          browserLogger.error('Failed to load list definition', { error: errorMessage, schemaId });
          toast({
            title: 'Error Loading List',
            description: errorMessage,
            variant: 'destructive'
          });
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadListDefinition();

    return () => {
      isCancelled = true;
    };
  }, [schemaId, tenantId, columnOverrides, toast]);

  // Handle sort changes
  const handleSort = useCallback((field: string) => {
    const newDirection = sortConfig?.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    const newSortConfig = { field, direction: newDirection };
    
    setSortConfig(newSortConfig);
    onSortChange?.(newSortConfig);
    
    browserLogger.info('List sorted', { field, direction: newDirection });
  }, [sortConfig, onSortChange]);

  // Handle selection changes
  const handleSelectionChange = useCallback((item: any, checked: boolean) => {
    const newSelection = checked
      ? [...selectedItems, item]
      : selectedItems.filter(selected => selected.id !== item.id);
    
    setSelectedItems(newSelection);
    onSelectionChange?.(newSelection);
  }, [selectedItems, onSelectionChange]);

  // Handle select all
  const handleSelectAll = useCallback((checked: boolean) => {
    const newSelection = checked ? [...data] : [];
    setSelectedItems(newSelection);
    onSelectionChange?.(newSelection);
  }, [data, onSelectionChange]);

  // Handle bulk actions
  const handleBulkAction = useCallback((actionId: string) => {
    if (selectedItems.length === 0) {
      toast({
        title: 'No Items Selected',
        description: 'Please select items to perform bulk actions.',
        variant: 'destructive'
      });
      return;
    }

    onRowAction?.(actionId, null, selectedItems);
    
    browserLogger.info('Bulk action executed', { 
      action: actionId, 
      itemCount: selectedItems.length 
    });
  }, [selectedItems, onRowAction, toast]);

  // Get column width based on type
  const getColumnWidth = (type: string): string => {
    switch (type) {
      case 'checkbox':
        return '50px';
      case 'number':
        return '100px';
      case 'date':
        return '120px';
      case 'email':
        return '200px';
      default:
        return 'auto';
    }
  };

  // Render cell value
  const renderCellValue = useCallback((column: ListColumn, value: any, item: any) => {
    if (column.render) {
      return column.render(value, item);
    }

    switch (column.type) {
      case 'checkbox':
        return value ? '✓' : '✗';
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '';
      case 'email':
        return value ? <a href={`mailto:${value}`} className="text-blue-500 hover:underline">{value}</a> : '';
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      default:
        return String(value || '');
    }
  }, []);

  // Calculate pagination info
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : Math.ceil(data.length / pageSize);
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems || data.length);

  // Show loading state
  if (isLoading || !isInitialized) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <List className="h-4 w-4 animate-spin" />
            <span>Loading list...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state if no list definition
  if (!listDefinition) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <List className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Unable to load list definition. Please try again.</p>
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
              <List className="h-5 w-5" />
              <span>{listDefinition.name}</span>
            </CardTitle>
            {listDefinition.description && (
              <CardDescription className="mt-2">
                {listDefinition.description}
              </CardDescription>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Bulk actions */}
            {enableSelection && selectedItems.length > 0 && bulkActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Actions ({selectedItems.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {bulkActions.map((action) => (
                    <DropdownMenuItem
                      key={action.id}
                      onClick={() => handleBulkAction(action.id)}
                    >
                      {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* View mode toggle */}
            {allowViewModeToggle && (
              <div className="flex border rounded-md">
                <Button
                  variant={currentViewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentViewMode('list')}
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={currentViewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentViewMode('grid')}
                  className="rounded-l-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <>
            {/* Table view */}
            {currentViewMode === 'list' && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {enableSelection && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedItems.length === data.length}
                            onCheckedChange={handleSelectAll}
                            disabled={disabled}
                          />
                        </TableHead>
                      )}
                      
                      {columns.map((column) => (
                        <TableHead 
                          key={column.field}
                          style={{ width: column.width }}
                          className={column.sortable ? 'cursor-pointer hover:bg-muted/50' : undefined}
                          onClick={column.sortable ? () => handleSort(column.field) : undefined}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{column.label}</span>
                            {column.sortable && (
                              <div className="flex flex-col">
                                {sortConfig?.field === column.field ? (
                                  sortConfig.direction === 'asc' ? (
                                    <ArrowUp className="h-3 w-3" />
                                  ) : (
                                    <ArrowDown className="h-3 w-3" />
                                  )
                                ) : (
                                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                                )}
                              </div>
                            )}
                          </div>
                        </TableHead>
                      ))}
                      
                      {actions.length > 0 && (
                        <TableHead className="w-16">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  
                  <TableBody>
                    {data.map((item, index) => (
                      <TableRow key={item.id || index}>
                        {enableSelection && (
                          <TableCell>
                            <Checkbox
                              checked={selectedItems.some(selected => selected.id === item.id)}
                              onCheckedChange={(checked) => handleSelectionChange(item, !!checked)}
                              disabled={disabled}
                            />
                          </TableCell>
                        )}
                        
                        {columns.map((column) => (
                          <TableCell key={column.field}>
                            {renderCellValue(column, item[column.field], item)}
                          </TableCell>
                        ))}
                        
                        {actions.length > 0 && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {actions
                                  .filter(action => !action.condition || action.condition(item))
                                  .map((action) => (
                                    <DropdownMenuItem
                                      key={action.id}
                                      onClick={() => onRowAction?.(action.id, item)}
                                    >
                                      {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                                      {action.label}
                                    </DropdownMenuItem>
                                  ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Grid view */}
            {currentViewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.map((item, index) => (
                  <Card key={item.id || index} className="p-4">
                    <div className="space-y-2">
                      {columns.slice(0, 3).map((column) => (
                        <div key={column.field}>
                          <span className="text-sm font-medium text-muted-foreground">
                            {column.label}:
                          </span>
                          <div className="text-sm">
                            {renderCellValue(column, item[column.field], item)}
                          </div>
                        </div>
                      ))}
                      
                      {actions.length > 0 && (
                        <div className="flex space-x-2 pt-2">
                          {actions
                            .filter(action => !action.condition || action.condition(item))
                            .slice(0, 3)
                            .map((action) => (
                              <Button
                                key={action.id}
                                variant={action.variant || 'outline'}
                                size="sm"
                                onClick={() => onRowAction?.(action.id, item)}
                              >
                                {action.icon && <action.icon className="h-3 w-3 mr-1" />}
                                {action.label}
                              </Button>
                            ))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Showing {startItem}-{endItem} of {totalItems || data.length} items
                  </span>
                  
                  {onPageSizeChange && (
                    <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(currentPage - 1)}
                    disabled={currentPage === 0 || disabled}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <span className="text-sm">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange?.(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1 || disabled}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <List className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 