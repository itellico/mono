'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Search,
  X,
  Filter,
  Settings2,
  Bookmark,
  Plus,
  ChevronDown,
  Clock,
} from 'lucide-react';
import { LoadSavedSearchDropdown } from '@/components/saved-searches/LoadSavedSearchDropdown';
import { SaveSearchDialog } from '@/components/saved-searches/SaveSearchDialog';
import { cn } from '@/lib/utils';

export interface FilterConfig {
  key: string;
  title: string;
  type: 'multiSelect' | 'select';
  options: Array<{ label: string; value: string }>;
}

export interface TableHeaderProps {
  // Search
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchSuggestions?: string[];
  
  // Filters
  filters: FilterConfig[];
  activeFilters: Record<string, string[]>;
  onFilterChange: (key: string, values: string[]) => void;
  onClearFilters: () => void;
  
  // Columns
  columns: Array<{ key: string; title: string; hideable?: boolean }>;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void;
  
  // Saved Searches
  savedSearchConfig?: {
    entityType: string;
    enabled: boolean;
    activeSearchName?: string;
    onLoadSearch: (config: any) => void;
    onSaveSearch: (data: any) => void;
    canSave: boolean;
    canLoad: boolean;
  };
  
  // Actions
  onAdd?: () => void;
  addLabel?: string;
  addPermission?: { action: string; resource: string };
  
  className?: string;
}

/**
 * Unified Table Header Component
 * 
 * Clean, professional header for admin tables with:
 * - Search with suggestions
 * - Save/Load search functionality
 * - Filters
 * - Column visibility
 * - Add button
 * 
 * No duplications, clean ShadCN design
 */
export function TableHeader({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  searchSuggestions = [],
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  columns = [],
  columnVisibility = {},
  onColumnVisibilityChange,
  savedSearchConfig,
  onAdd,
  addLabel = "Add Item",
  addPermission,
  className,
}: TableHeaderProps) {
  const [showFilters, setShowFilters] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);

  // Count active filters
  const activeFilterCount = Object.values(activeFilters).reduce(
    (sum, values) => sum + values.length, 
    0
  );

  // Has any content to save
  const hasContent = searchValue.length > 0 || activeFilterCount > 0;

  // Filter suggestions based on search
  const filteredSuggestions = React.useMemo(() => {
    if (!searchValue || searchSuggestions.length === 0) return [];
    return searchSuggestions
      .filter(s => s.toLowerCase().includes(searchValue.toLowerCase()))
      .slice(0, 5);
  }, [searchValue, searchSuggestions]);

  const handleClearAll = () => {
    onSearchChange('');
    onClearFilters();
  };

  const handleSuggestionSelect = (suggestion: string) => {
    onSearchChange(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Header Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Search + Filters */}
        <div className="flex items-center gap-2 flex-1 max-w-2xl">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder={searchPlaceholder}
                className="pl-10 pr-10"
              />
              {searchValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSearchChange('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {/* Search Suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50">
                <Command>
                  <CommandList className="max-h-48">
                    <CommandGroup>
                      {filteredSuggestions.map((suggestion, index) => (
                        <CommandItem
                          key={index}
                          onSelect={() => handleSuggestionSelect(suggestion)}
                          className="cursor-pointer"
                        >
                          <Clock className="mr-2 h-3 w-3 text-muted-foreground" />
                          {suggestion}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            )}
          </div>

          {/* Filters Button */}
          {filters.length > 0 && (
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronDown className={cn(
                "h-3 w-3 transition-transform",
                showFilters && "rotate-180"
              )} />
            </Button>
          )}

          {/* Clear All Button */}
          {hasContent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Saved Searches */}
          {savedSearchConfig?.enabled && savedSearchConfig.canLoad && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Bookmark className="h-4 w-4" />
                  {savedSearchConfig.activeSearchName || "Saved"}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Saved Searches</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <LoadSavedSearchDropdown
                    entityType={savedSearchConfig.entityType}
                    onLoadSearch={savedSearchConfig.onLoadSearch}
                    autoLoadDefault={false}
                    className="w-full justify-start border-0 shadow-none"
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Save Search */}
          {savedSearchConfig?.enabled && savedSearchConfig.canSave && hasContent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSaveDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Save
            </Button>
          )}

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {columns
                .filter(col => col.hideable !== false)
                .map((column) => {
                  const isVisible = columnVisibility[column.key] !== false;
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.key}
                      checked={isVisible}
                      onCheckedChange={(checked) => {
                        onColumnVisibilityChange({
                          ...columnVisibility,
                          [column.key]: checked
                        });
                      }}
                    >
                      {column.title}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Button */}
          {onAdd && (
            <Button onClick={onAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              {addLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && filters.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filters.map((filter) => {
              const activeValues = activeFilters[filter.key] || [];
              
              return (
                <div key={filter.key} className="space-y-2">
                  <label className="text-sm font-medium">{filter.title}</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-between"
                      >
                        <span className="truncate">
                          {activeValues.length === 0
                            ? `Select ${filter.title.toLowerCase()}`
                            : `${activeValues.length} selected`
                          }
                        </span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0" align="start">
                      <Command>
                        <CommandList>
                          <CommandGroup>
                            {filter.options.map((option) => {
                              const isSelected = activeValues.includes(option.value);
                              return (
                                <CommandItem
                                  key={option.value}
                                  onSelect={() => {
                                    const newValues = isSelected
                                      ? activeValues.filter(v => v !== option.value)
                                      : [...activeValues, option.value];
                                    onFilterChange(filter.key, newValues);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center space-x-2">
                                    <div className={cn(
                                      "h-4 w-4 border rounded flex items-center justify-center",
                                      isSelected ? "bg-primary border-primary" : "border-input"
                                    )}>
                                      {isSelected && <div className="h-2 w-2 bg-white rounded-sm" />}
                                    </div>
                                    <span>{option.label}</span>
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Filter Pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([filterKey, values]) => {
            const filter = filters.find(f => f.key === filterKey);
            if (!filter || values.length === 0) return null;
            
            return values.map((value) => {
              const option = filter.options.find(o => o.value === value);
              return (
                <Badge key={`${filterKey}-${value}`} variant="secondary" className="gap-1">
                  <span className="text-xs text-muted-foreground">{filter.title}:</span>
                  <span className="text-xs font-medium">{option?.label || value}</span>
                  <button
                    onClick={() => {
                      const newValues = values.filter(v => v !== value);
                      onFilterChange(filterKey, newValues);
                    }}
                    className="ml-1 hover:bg-muted rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            });
          })}
        </div>
      )}

      {/* Save Search Dialog */}
      {savedSearchConfig?.enabled && (
        <SaveSearchDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          entityType={savedSearchConfig.entityType}
          currentFilters={activeFilters}
          currentSearch={searchValue}
          onSaved={(savedSearch) => {
            savedSearchConfig.onSaveSearch(savedSearch);
          }}
        />
      )}
    </div>
  );
}