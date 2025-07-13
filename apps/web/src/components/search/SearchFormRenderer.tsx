'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, X } from 'lucide-react';
import { browserLogger } from '@/lib/browser-logger';

/**
 * 🔍 SearchFormRenderer - Schema-Driven Search Component
 * 
 * Integrates with itellico Mono infrastructure:
 * - Uses model schemas to determine search fields
 * - Uses option sets for dropdown filters
 * - Lives within standard layout framework
 * - Optimized for performance (not dynamically generated)
 */

interface SearchField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'date';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

interface SearchFormRendererProps {
  // Schema-driven configuration
  schemaId: string;
  industryType: string;
  searchFields: SearchField[];
  
  // Search behavior
  onSearch: (filters: Record<string, any>) => void;
  onReset: () => void;
  loading?: boolean;
  
  // Layout configuration
  layout?: 'horizontal' | 'vertical' | 'sidebar';
  showAdvancedFilters?: boolean;
  
  // Results integration
  resultCount?: number;
  className?: string;
}

export function SearchFormRenderer({
  schemaId,
  industryType,
  searchFields,
  onSearch,
  onReset,
  loading = false,
  layout = 'horizontal',
  showAdvancedFilters = true,
  resultCount,
  className
}: SearchFormRendererProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // Generate dynamic Zod schema from search fields
  const searchSchema = z.object(
    searchFields.reduce((acc, field) => {
      switch (field.type) {
        case 'text':
          acc[field.id] = z.string().optional();
          break;
        case 'number':
          acc[field.id] = z.number().optional();
          break;
        case 'select':
          if (field.options) {
            const values = field.options.map(opt => opt.value);
            acc[field.id] = z.enum(values as [string, ...string[]]).optional();
          }
          break;
        default:
          acc[field.id] = z.string().optional();
      }
      return acc;
    }, {} as Record<string, z.ZodTypeAny>)
  );

  const form = useForm({
    resolver: zodResolver(searchSchema),
    defaultValues: searchFields.reduce((acc, field) => {
      acc[field.id] = '';
      return acc;
    }, {} as Record<string, any>),
  });

  const handleSearch = (data: Record<string, any>) => {
    // Filter out empty values
    const filters = Object.entries(data).reduce((acc, [key, value]) => {
      if (value && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    setActiveFilters(filters);
    
    browserLogger.userAction('search_performed', {
      schemaId,
      industryType,
      filters,
      filterCount: Object.keys(filters).length,
    });

    onSearch(filters);
  };

  const handleReset = () => {
    form.reset();
    setActiveFilters({});
    setShowAdvanced(false);
    
    browserLogger.userAction('search_reset', {
      schemaId,
      industryType,
    });

    onReset();
  };

  const removeFilter = (fieldId: string) => {
    form.setValue(fieldId, '');
    const newFilters = { ...activeFilters };
    delete newFilters[fieldId];
    setActiveFilters(newFilters);
    onSearch(newFilters);
  };

  // Split fields into basic and advanced
  const basicFields = searchFields.slice(0, 3);
  const advancedFields = searchFields.slice(3);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search {industryType} Profiles
          {resultCount !== undefined && (
            <span className="text-sm font-normal text-muted-foreground">
              ({resultCount} results)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4">
            {/* Basic Search Fields */}
            <div className={`grid gap-4 ${
              layout === 'horizontal' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'
            }`}>
              {basicFields.map((field) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={field.id}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
                      <FormControl>
                        {field.type === 'select' ? (
                          <Select 
                            onValueChange={formField.onChange} 
                            value={formField.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={field.placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={field.type}
                            placeholder={field.placeholder}
                            {...formField}
                          />
                        )}
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && advancedFields.length > 0 && (
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
                </Button>

                {showAdvanced && (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4 bg-muted/50 rounded-lg">
                    {advancedFields.map((field) => (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={field.id}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel>{field.label}</FormLabel>
                            <FormControl>
                              {field.type === 'select' ? (
                                <Select 
                                  onValueChange={formField.onChange} 
                                  value={formField.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={field.placeholder} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.options?.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  type={field.type}
                                  placeholder={field.placeholder}
                                  {...formField}
                                />
                              )}
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Active Filters */}
            {Object.keys(activeFilters).length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium">Active filters:</span>
                {Object.entries(activeFilters).map(([key, value]) => {
                  const field = searchFields.find(f => f.id === key);
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                    >
                      <span>{field?.label}: {value}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => removeFilter(key)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default SearchFormRenderer; 