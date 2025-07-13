'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Calendar,
  CalendarDays,
  Check,
  ChevronsUpDown,
  X,
  Filter,
  Settings2,
  Layers3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

export interface FilterConfig {
  key: string;
  title: string;
  type: 'multiSelect' | 'select' | 'dateRange';
  options: FilterOption[];
  placeholder?: string;
}

export interface AdvancedFiltersPanelProps {
  filters: FilterConfig[];
  activeFilters: Record<string, string[]>;
  onFilterChange: (key: string, values: string[]) => void;
  onClearAll: () => void;
  className?: string;
}

/**
 * Modern Advanced Filters Panel Component
 * 
 * Features:
 * - Clean, card-based design with subtle shadows
 * - Command palette-style multi-select filters
 * - Floating visual indicators
 * - Smooth animations and modern spacing
 * - Responsive grid layout
 */
export function AdvancedFiltersPanel({
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
  className,
}: AdvancedFiltersPanelProps) {
  const totalActiveFilters = React.useMemo(() => {
    return Object.values(activeFilters).reduce((sum, values) => sum + values.length, 0);
  }, [activeFilters]);

  const handleMultiSelectChange = (filterKey: string, value: string, checked: boolean) => {
    const currentValues = activeFilters[filterKey] || [];
    if (checked) {
      onFilterChange(filterKey, [...currentValues, value]);
    } else {
      onFilterChange(filterKey, currentValues.filter(v => v !== value));
    }
  };

  const handleSingleSelectChange = (filterKey: string, value: string) => {
    onFilterChange(filterKey, [value]);
  };

  const renderMultiSelectFilter = (filter: FilterConfig) => {
    const activeValues = activeFilters[filter.key] || [];
    const isActive = activeValues.length > 0;

    return (
      <Popover key={filter.key}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "justify-between h-11 px-4 border-border/60 hover:border-border transition-all duration-200",
              "bg-background hover:bg-muted/30 shadow-sm hover:shadow-md",
              isActive && "border-primary/60 bg-primary/5 shadow-md"
            )}
          >
            <div className="flex items-center gap-3 flex-1 text-left">
              <Layers3 className="h-4 w-4 text-muted-foreground/70" />
              <span className="truncate font-medium">
                {isActive 
                  ? `${filter.title}` 
                  : filter.placeholder || filter.title
                }
              </span>
            </div>
            {isActive && (
              <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                {activeValues.length}
              </Badge>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 shadow-xl border-0 bg-background/95 backdrop-blur-sm" align="start">
          <Command className="border-0">
            <CommandInput 
              placeholder={`Search ${filter.title.toLowerCase()}...`}
              className="border-0 border-b rounded-none focus:ring-0"
            />
            <CommandList>
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                <Settings2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No options found
              </CommandEmpty>
              <CommandGroup className="p-2">
                {filter.options.map((option) => {
                  const isSelected = activeValues.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => handleMultiSelectChange(filter.key, option.value, !isSelected)}
                      className="flex items-center gap-3 py-3 px-3 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border transition-all duration-200",
                        isSelected 
                          ? "bg-primary border-primary text-primary-foreground shadow-sm" 
                          : "border-border/60 hover:border-border"
                      )}>
                        <Check className={cn("h-3 w-3", !isSelected && "opacity-0")} />
                      </div>
                      {option.icon && <option.icon className="h-4 w-4 text-muted-foreground/70" />}
                      <span className="flex-1 font-medium">{option.label}</span>
                      {option.count && (
                        <Badge variant="outline" className="text-xs bg-muted/40 border-border/40 rounded-full px-2">
                          {option.count}
                        </Badge>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  const renderSingleSelectFilter = (filter: FilterConfig) => {
    const activeValue = activeFilters[filter.key]?.[0];
    const isActive = Boolean(activeValue);

    return (
      <Select
        key={filter.key}
        value={activeValue || ''}
        onValueChange={(value) => handleSingleSelectChange(filter.key, value)}
      >
        <SelectTrigger className={cn(
          "h-11 px-4 border-border/60 hover:border-border transition-all duration-200",
          "bg-background hover:bg-muted/30 shadow-sm hover:shadow-md",
          isActive && "border-primary/60 bg-primary/5 shadow-md"
        )}>
          <div className="flex items-center gap-3 flex-1">
            <Layers3 className="h-4 w-4 text-muted-foreground/70" />
            <SelectValue placeholder={filter.placeholder || filter.title} className="font-medium" />
          </div>
        </SelectTrigger>
        <SelectContent className="border-0 shadow-xl bg-background/95 backdrop-blur-sm">
          {filter.options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="py-3">
              <div className="flex items-center gap-3">
                {option.icon && <option.icon className="h-4 w-4 text-muted-foreground/70" />}
                <span className="font-medium">{option.label}</span>
                {option.count && (
                  <Badge variant="outline" className="ml-auto text-xs bg-muted/40 border-border/40 rounded-full px-2">
                    {option.count}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const renderDateRangeFilter = (filter: FilterConfig) => {
    const activeValues = activeFilters[filter.key] || [];
    const isActive = activeValues.length > 0;

    return (
      <Button
        key={filter.key}
        variant="outline"
        className={cn(
          "justify-start h-11 px-4 border-border/60 hover:border-border transition-all duration-200",
          "bg-background hover:bg-muted/30 shadow-sm hover:shadow-md",
          isActive && "border-primary/60 bg-primary/5 shadow-md"
        )}
      >
        <CalendarDays className="mr-3 h-4 w-4 text-muted-foreground/70" />
        <span className="font-medium">
          {isActive 
            ? `${filter.title}: ${activeValues.join(' - ')}` 
            : filter.placeholder || filter.title
          }
        </span>
        {isActive && (
          <Badge variant="secondary" className="ml-auto h-5 px-2 text-xs font-semibold bg-primary/10 text-primary rounded-full">
            {activeValues.length}
          </Badge>
        )}
      </Button>
    );
  };

  const renderFilter = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'multiSelect':
        return renderMultiSelectFilter(filter);
      case 'select':
        return renderSingleSelectFilter(filter);
      case 'dateRange':
        return renderDateRangeFilter(filter);
      default:
        return null;
    }
  };

  if (filters.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "space-y-5 p-6 rounded-xl border border-border/60 bg-background/50 backdrop-blur-sm shadow-sm",
      "animate-in slide-in-from-top-1 duration-300",
      className
    )}>
      {/* Modern Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted/50">
            <Filter className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Advanced Filters</h3>
            <p className="text-sm text-muted-foreground">Refine your search results</p>
          </div>
          {totalActiveFilters > 0 && (
            <Badge variant="secondary" className="h-6 px-3 text-sm font-semibold bg-primary/10 text-primary rounded-full">
              {totalActiveFilters} active
            </Badge>
          )}
        </div>
        
        {totalActiveFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-muted-foreground hover:text-foreground h-8 px-3 rounded-full transition-colors"
          >
            <X className="h-4 w-4 mr-1.5" />
            Clear all
          </Button>
        )}
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filters.map(renderFilter)}
      </div>

      {/* Active Filters Floating Summary */}
      {totalActiveFilters > 0 && (
        <div className="space-y-3 pt-2">
          <Separator className="opacity-60" />
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-muted-foreground mr-2">Applied:</span>
            {Object.entries(activeFilters).map(([key, values]) => {
              if (values.length === 0) return null;
              const filter = filters.find(f => f.key === key);
              if (!filter) return null;

              return values.map((value) => {
                const option = filter.options.find(opt => opt.value === value);
                return (
                  <Badge 
                    key={`${key}-${value}`} 
                    variant="secondary" 
                    className={cn(
                      "gap-2 pr-2 py-1.5 rounded-full transition-all duration-200",
                      "bg-muted/60 hover:bg-muted/80 border border-border/40 shadow-sm"
                    )}
                  >
                    <span className="text-xs font-medium text-muted-foreground">{filter.title}:</span>
                    <span className="text-xs font-semibold">{option?.label || value}</span>
                    <button
                      onClick={() => handleMultiSelectChange(key, value, false)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              });
            })}
          </div>
        </div>
      )}
    </div>
  );
}