'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  X,
  Clock,
  Filter,
  ChevronDown,
  Plus,
  Bookmark,
} from 'lucide-react';
import { LoadSavedSearchDropdown } from '@/components/saved-searches/LoadSavedSearchDropdown';
import { SaveSearchDialog } from '@/components/saved-searches/SaveSearchDialog';
import { cn } from '@/lib/utils';

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'suggestion' | 'saved';
  count?: number;
}

export interface SavedSearchConfig {
  entityType: string;
  enabled: boolean;
  activeSearchName?: string;
  onLoadSearch?: (config: {
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
  onSaveSearch?: (data: {
    name: string;
    description?: string;
    filters: Record<string, unknown>;
    sortBy?: string;
    sortOrder?: string;
    columnConfig?: Record<string, boolean>;
    searchValue?: string;
    paginationLimit?: number;
    isDefault: boolean;
    isPublic: boolean;
  }) => void;
  canSave: boolean;
  canLoad: boolean;
}

export interface EnhancedSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  activeFilters?: Array<{
    key: string;
    label: string;
    values: string[];
    onRemove: (key: string, value?: string) => void;
  }>;
  showAdvancedFilters?: boolean;
  onToggleAdvancedFilters?: () => void;
  savedSearchConfig?: SavedSearchConfig;
  className?: string;
  disabled?: boolean;
}

/**
 * Modern Enhanced Search Bar Component
 * 
 * Features:
 * - Clean, borderless design with subtle shadows
 * - Command palette-style suggestions
 * - Floating filter badges
 * - Smooth animations and transitions
 * - Modern typography and spacing
 */
export function EnhancedSearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  suggestions = [],
  recentSearches = [],
  activeFilters = [],
  showAdvancedFilters = false,
  onToggleAdvancedFilters,
  savedSearchConfig,
  className,
  disabled = false,
}: EnhancedSearchBarProps) {
  const [suggestionsOpen, setSuggestionsOpen] = React.useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Show suggestions when there's input or recent searches available
  const showSuggestions = suggestionsOpen && (value.length > 0 || recentSearches.length > 0) && !disabled;
  
  // Filter suggestions based on input
  const filteredSuggestions = React.useMemo(() => {
    if (value.length === 0) return [];
    return suggestions.filter(s => 
      s.text.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 5);
  }, [suggestions, value]);
  
  // Recent searches to show
  const recentToShow = React.useMemo(() => {
    if (value.length > 0) return [];
    return recentSearches.slice(0, 3);
  }, [recentSearches, value]);

  const hasActiveFilters = activeFilters.some(filter => filter.values.length > 0);
  const totalActiveFilters = activeFilters.reduce((sum, filter) => sum + filter.values.length, 0);

  const handleSuggestionSelect = (text: string) => {
    onChange(text);
    setSuggestionsOpen(false);
    inputRef.current?.blur();
  };
  
  const handleInputFocus = () => {
    setSuggestionsOpen(true);
  };
  
  const handleInputBlur = () => {
    // Delay to allow click on suggestions
    setTimeout(() => setSuggestionsOpen(false), 150);
  };

  const handleClearAll = () => {
    onChange('');
    activeFilters.forEach(filter => {
      filter.onRemove(filter.key);
    });
    onClear?.();
  };

  const handleRemoveFilter = (filterKey: string, value?: string) => {
    const filter = activeFilters.find(f => f.key === filterKey);
    if (filter) {
      filter.onRemove(filterKey, value);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Professional Search Container */}
      <div className="relative">
        <div className={cn(
          "flex items-center gap-2 px-3 py-2",
          "border rounded-lg bg-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          "shadow-sm hover:shadow-md transition-all duration-200",
          disabled && "opacity-50 cursor-not-allowed"
        )}>
          {/* Search Icon */}
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        
          {/* Search Input */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={placeholder}
              disabled={disabled}
              className="border-0 shadow-none focus-visible:ring-0 bg-transparent p-0"
            />
          
            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
                <Command>
                  <CommandList className="max-h-[200px]">
                    {recentToShow.length > 0 && (
                      <CommandGroup>
                        <div className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2 bg-muted/50">
                          <Clock className="h-3 w-3" />
                          Recent
                        </div>
                        {recentToShow.map((search, index) => (
                          <CommandItem
                            key={`recent-${index}`}
                            onSelect={() => handleSuggestionSelect(search)}
                            className="cursor-pointer px-3 py-2 hover:bg-accent"
                          >
                            <span className="text-sm">{search}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    
                    {filteredSuggestions.length > 0 && (
                      <>
                        {recentToShow.length > 0 && <Separator />}
                        <CommandGroup>
                          {filteredSuggestions.map((suggestion) => (
                            <CommandItem
                              key={suggestion.id}
                              onSelect={() => handleSuggestionSelect(suggestion.text)}
                              className="cursor-pointer px-3 py-2 hover:bg-accent"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-sm">{suggestion.text}</span>
                                {suggestion.count && (
                                  <Badge variant="secondary" className="text-xs">
                                    {suggestion.count}
                                  </Badge>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Saved Search Dropdown */}
            {savedSearchConfig?.enabled && savedSearchConfig.canLoad && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2 text-muted-foreground hover:text-foreground",
                      savedSearchConfig.activeSearchName && "bg-accent text-accent-foreground"
                    )}
                    disabled={disabled}
                  >
                    <Bookmark className="h-4 w-4" />
                    {savedSearchConfig.activeSearchName && (
                      <span className="ml-1 text-xs font-medium max-w-20 truncate">
                        {savedSearchConfig.activeSearchName}
                      </span>
                    )}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="text-sm font-semibold">Saved Searches</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <LoadSavedSearchDropdown
                      entityType={savedSearchConfig.entityType}
                      onLoadSearch={(config) => {
                        if (savedSearchConfig.onLoadSearch) {
                          savedSearchConfig.onLoadSearch(config);
                        }
                      }}
                      autoLoadDefault={false}
                      className="w-full justify-start border-0 shadow-none"
                    />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Save Search Button */}
            {savedSearchConfig?.enabled && savedSearchConfig.canSave && (value || hasActiveFilters) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSaveDialogOpen(true)}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                disabled={disabled}
              >
                <Plus className="h-4 w-4" />
                <span className="ml-1 text-xs">Save</span>
              </Button>
            )}
            
            {/* Clear Button */}
            {(value || hasActiveFilters) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            {/* Advanced Filters Toggle */}
            {onToggleAdvancedFilters && (
              <Button
                variant={showAdvancedFilters ? "secondary" : "ghost"}
                size="sm"
                onClick={onToggleAdvancedFilters}
                className={cn(
                  "h-8 px-2",
                  !showAdvancedFilters && "text-muted-foreground hover:text-foreground"
                )}
                disabled={disabled}
              >
                <Filter className="h-4 w-4" />
                <span className="ml-1 text-xs">Filters</span>
                {totalActiveFilters > 0 && (
                  <Badge variant="outline" className="ml-1 h-4 px-1 text-xs">
                    {totalActiveFilters}
                  </Badge>
                )}
                <ChevronDown className={cn(
                  "ml-1 h-3 w-3 transition-transform",
                  showAdvancedFilters && "rotate-180"
                )} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) =>
            filter.values.map((value) => (
              <Badge
                key={`${filter.key}-${value}`}
                variant="secondary"
                className="gap-2"
              >
                <span className="text-xs">{filter.label}:</span>
                <span className="text-xs font-medium">{value}</span>
                <button
                  onClick={() => handleRemoveFilter(filter.key, value)}
                  className="ml-1 hover:bg-muted rounded-full"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      )}
      
      {/* Save Search Dialog */}
      {savedSearchConfig?.enabled && (
        <SaveSearchDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          entityType={savedSearchConfig.entityType}
          currentFilters={(() => {
            const filters: Record<string, unknown> = {};
            activeFilters.forEach(filter => {
              filters[filter.key] = filter.values;
            });
            return filters;
          })()}
          currentSearch={value}
          onSaved={(savedSearch) => {
            if (savedSearchConfig.onSaveSearch) {
              const currentFilters: Record<string, unknown> = {};
              activeFilters.forEach(filter => {
                currentFilters[filter.key] = filter.values;
              });
              
              savedSearchConfig.onSaveSearch({
                name: (savedSearch as { name: string }).name,
                filters: currentFilters,
                searchValue: value,
                isDefault: (savedSearch as { isDefault: boolean }).isDefault,
                isPublic: (savedSearch as { isPublic: boolean }).isPublic
              });
            }
          }}
        />
      )}
    </div>
  );
}