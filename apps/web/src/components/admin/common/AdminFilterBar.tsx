/**
 * Admin Filter Bar Component
 * 
 * Implements the optimal filtering pattern for admin interfaces:
 * - Button-based filtering (not instant)
 * - Visual feedback for unsaved changes
 * - Clear active filter count
 * - Professional admin UI design
 */

'use client';

import React, { useState } from 'react';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import { browserLogger } from '@/lib/browser-logger';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterField {
  key: string;
  label: string;
  type: 'search' | 'select';
  placeholder?: string;
  options?: FilterOption[];
}

export interface AdminFilterBarProps {
  fields: FilterField[];
  onFiltersApply: (filters: Record<string, any>) => void;
  loading?: boolean;
  initialFilters?: Record<string, any>;
  className?: string;
}

/**
 * Admin Filter Bar Component
 * 
 * Provides the standard admin filtering interface with button-based execution
 */
export function AdminFilterBar({
  fields,
  onFiltersApply,
  loading = false,
  initialFilters = {},
  className = ''
}: AdminFilterBarProps) {
  const t = useTranslations('admin-common');
  const { trackClick } = useAuditTracking();
  
  // Local filter state (not applied until button click)
  const [localFilters, setLocalFilters] = useState<Record<string, any>>(initialFilters);
  
  // Calculate active filters and changes
  const activeFilters = Object.entries(localFilters).filter(([key, value]) => {
    return value && value !== '' && value !== 'all';
  });
  
  const hasChanges = JSON.stringify(localFilters) !== JSON.stringify(initialFilters);
  
  const handleFilterChange = (key: string, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    trackClick('admin_filters_applied', { 
      activeFilters: activeFilters.length,
      hasChanges
    });
    
    browserLogger.userAction('Admin filters applied', `Applied ${activeFilters.length} filters`);
    onFiltersApply(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = Object.keys(localFilters).reduce((acc, key) => {
      acc[key] = '';
      return acc;
    }, {} as Record<string, any>);
    
    setLocalFilters(clearedFilters);
    trackClick('admin_filters_cleared');
    browserLogger.userAction('Admin filters cleared', 'Cleared all filters');
  };

  const renderFilterField = (field: FilterField) => {
    const value = localFilters[field.key] || '';

    switch (field.type) {
      case 'search':
        return (
          <div key={field.key} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={field.placeholder || `Search by ${field.label.toLowerCase()}...`}
              value={value}
              onChange={(e) => handleFilterChange(field.key, e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.key} className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{field.label}</span>
            <Select value={value} onValueChange={(val) => handleFilterChange(field.key, val)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {field.label}</SelectItem>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {option.count !== undefined && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {option.count}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white border rounded-lg p-4 space-y-4 ${className}`}>
      {/* Filter Fields Row */}
      <div className="flex items-center gap-4 flex-wrap">
        {fields.map(renderFilterField)}
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between pt-2 border-t">
        {/* Left: Clear + Active Count */}
        <div className="flex items-center gap-3">
          {activeFilters.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear ({activeFilters.length})
            </Button>
          )}
          
          {activeFilters.length === 0 && (
            <span className="text-sm text-gray-500">No filters applied</span>
          )}
        </div>

        {/* Right: Apply Button */}
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="outline" className="text-xs">
              Unsaved changes
            </Badge>
          )}
          
          <Button
            onClick={handleApplyFilters}
            disabled={loading || !hasChanges}
            className="flex items-center gap-2 min-w-[120px]"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Applying...
              </>
            ) : (
              <>
                <Filter className="h-4 w-4" />
                Apply Filters
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 