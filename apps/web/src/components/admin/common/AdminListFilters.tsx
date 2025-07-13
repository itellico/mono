/**
 * Reusable Admin List Filters Component
 * 
 * Implements button-based filtering pattern for admin interfaces
 * with proper state management and performance optimization.
 * 
 * @component
 * @example
 * ```tsx
 * <AdminListFilters
 *   filterConfig={usersFilterConfig}
 *   onFiltersApply={handleFiltersApply}
 *   loading={isLoading}
 * />
 * ```
 */

'use client';

import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { browserLogger } from '@/lib/browser-logger';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';

export interface FilterField {
  key: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'number';
  label: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string; count?: number }>;
  defaultValue?: any;
}

export interface FilterConfig {
  fields: FilterField[];
  defaultFilters: Record<string, any>;
  presets?: Array<{
    name: string;
    label: string;
    filters: Record<string, any>;
    description?: string;
  }>;
}

export interface AdminListFiltersProps {
  filterConfig: FilterConfig;
  onFiltersApply: (filters: Record<string, any>) => void;
  loading?: boolean;
  currentFilters?: Record<string, any>;
  showActiveCount?: boolean;
  className?: string;
}

/**
 * Admin List Filters Component
 * 
 * Provides a reusable filtering interface for admin list views
 * with button-based execution for optimal performance.
 */
export function AdminListFilters({
  filterConfig,
  onFiltersApply,
  loading = false,
  currentFilters = {},
  showActiveCount = true,
  className = ''
}: AdminListFiltersProps) {
  const t = useTranslations('admin-common');
  const { trackClick } = useAuditTracking();
  
  // Local filter state (not applied until button click)
  const [localFilters, setLocalFilters] = useState<Record<string, any>>(
    () => ({ ...filterConfig.defaultFilters, ...currentFilters })
  );
  
  // Track if filters have changed from applied state
  const filtersChanged = JSON.stringify(localFilters) !== JSON.stringify(currentFilters);
  
  // Count active filters (non-default values)
  const activeFilterCount = Object.entries(localFilters).filter(([key, value]) => {
    const defaultValue = filterConfig.defaultFilters[key];
    return value !== defaultValue && value !== '' && value !== 'all' && value !== null;
  }).length;

  const handleFieldChange = (fieldKey: string, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const handleApplyFilters = () => {
    trackClick('admin_filters_applied', { 
      activeFilters: activeFilterCount,
      changedFields: Object.keys(localFilters).filter(key => 
        localFilters[key] !== currentFilters[key]
      )
    });
    
    browserLogger.userAction('Admin filters applied', `Applied ${activeFilterCount} filters`);
    
    onFiltersApply(localFilters);
  };

  const handleResetFilters = () => {
    setLocalFilters(filterConfig.defaultFilters);
    trackClick('admin_filters_reset');
    browserLogger.userAction('Admin filters reset', 'Reset all filters to default');
  };

  const handlePresetApply = (preset: NonNullable<typeof filterConfig.presets>[0]) => {
    setLocalFilters({ ...filterConfig.defaultFilters, ...preset.filters });
    trackClick('admin_filter_preset_applied', { presetName: preset.name });
    browserLogger.userAction('Admin filter preset applied', `Applied preset: ${preset.name}`);
  };

  const renderFilterField = (field: FilterField) => {
    const value = localFilters[field.key];

    switch (field.type) {
      case 'text':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id={field.key}
                placeholder={field.placeholder || field.label}
                value={value || ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            <Select value={value || ''} onValueChange={(val) => handleFieldChange(field.key, val)}>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
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

      case 'date':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type="date"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
            />
          </div>
        );

      case 'number':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type="number"
              placeholder={field.placeholder || field.label}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <CardTitle className="text-lg">{t('filters.title')}</CardTitle>
            {showActiveCount && activeFilterCount > 0 && (
              <Badge variant="default" className="ml-2">
                {activeFilterCount} {t('filters.active')}
              </Badge>
            )}
          </div>
          
          {filtersChanged && (
            <Badge variant="outline" className="text-xs">
              {t('filters.unsavedChanges')}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filter Presets */}
        {filterConfig.presets && filterConfig.presets.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('filters.presets')}</Label>
            <div className="flex flex-wrap gap-2">
              {filterConfig.presets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetApply(preset)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {filterConfig.presets && filterConfig.presets.length > 0 && <Separator />}

        {/* Filter Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filterConfig.fields.map(renderFilterField)}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleResetFilters}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {t('filters.reset')}
          </Button>

          <div className="flex items-center gap-2">
            {filtersChanged && (
              <Badge variant="secondary" className="text-xs">
                {t('filters.clickApplyToFilter')}
              </Badge>
            )}
            <Button
              onClick={handleApplyFilters}
              disabled={loading || !filtersChanged}
              className="flex items-center gap-2 min-w-[120px]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('filters.applying')}
                </>
              ) : (
                <>
                  <Filter className="h-4 w-4" />
                  {t('filters.apply')}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 