'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  Clock, 
  Star, 
  Award,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketplaceFilters {
  page: number;
  limit: number;
  search: string;
  category: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  deliveryTime?: number;
  talentLevel?: string;
  avgRating?: number;
  sortBy: string;
  sortOrder?: string;
  featured?: boolean;
}

interface Category {
  name: string;
  count: number;
  icon?: string;
  subcategories?: Array<{
    name: string;
    count: number;
  }>;
}

interface GigFiltersProps {
  filters: MarketplaceFilters;
  onFilterChange: (key: keyof MarketplaceFilters, value: any) => void;
  categories: Category[];
  className?: string;
}

export function GigFilters({
  filters,
  onFilterChange,
  categories,
  className,
}: GigFiltersProps) {
  const [priceRange, setPriceRange] = React.useState([
    filters.minPrice || 0,
    filters.maxPrice || 1000
  ]);

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values);
    onFilterChange('minPrice', values[0] > 0 ? values[0] : undefined);
    onFilterChange('maxPrice', values[1] < 1000 ? values[1] : undefined);
  };

  const deliveryTimeOptions = [
    { label: 'Express (24 hours)', value: 1 },
    { label: 'Up to 3 days', value: 3 },
    { label: 'Up to 7 days', value: 7 },
    { label: 'Up to 14 days', value: 14 },
    { label: 'Up to 30 days', value: 30 },
  ];

  const talentLevelOptions = [
    { label: 'New Seller', value: 'beginner' },
    { label: 'Level 1', value: 'intermediate' },
    { label: 'Level 2', value: 'expert' },
    { label: 'Top Rated', value: 'top_rated' },
  ];

  const selectedCategory = categories.find(cat => cat.name === filters.category);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Category Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Category</Label>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.name}>
              <button
                type="button"
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-md text-left hover:bg-accent transition-colors',
                  filters.category === category.name && 'bg-accent'
                )}
                onClick={() => {
                  onFilterChange('category', 
                    filters.category === category.name ? '' : category.name
                  );
                  onFilterChange('subcategory', undefined);
                }}
              >
                <div className="flex items-center gap-2">
                  {category.icon && <span>{category.icon}</span>}
                  <span className="text-sm">{category.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {category.count}
                </Badge>
              </button>
              
              {/* Subcategories */}
              {filters.category === category.name && category.subcategories && (
                <div className="ml-4 mt-2 space-y-1">
                  {category.subcategories.map((subcategory) => (
                    <button
                      key={subcategory.name}
                      type="button"
                      className={cn(
                        'w-full flex items-center justify-between p-1 rounded text-left hover:bg-accent/50 transition-colors text-sm',
                        filters.subcategory === subcategory.name && 'bg-accent/50'
                      )}
                      onClick={() => onFilterChange('subcategory', 
                        filters.subcategory === subcategory.name ? '' : subcategory.name
                      )}
                    >
                      <span>{subcategory.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {subcategory.count}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Price Range
        </Label>
        <div className="space-y-4">
          <Slider
            value={priceRange}
            onValueChange={handlePriceRangeChange}
            max={1000}
            min={0}
            step={5}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}+</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Min</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minPrice || ''}
                onChange={(e) => onFilterChange('minPrice', 
                  e.target.value ? parseInt(e.target.value) : undefined
                )}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Max</Label>
              <Input
                type="number"
                placeholder="1000"
                value={filters.maxPrice || ''}
                onChange={(e) => onFilterChange('maxPrice', 
                  e.target.value ? parseInt(e.target.value) : undefined
                )}
                className="h-8"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Delivery Time */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Delivery Time
        </Label>
        <div className="space-y-2">
          {deliveryTimeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                'w-full flex items-center justify-between p-2 rounded-md text-left hover:bg-accent transition-colors',
                filters.deliveryTime === option.value && 'bg-accent'
              )}
              onClick={() => onFilterChange('deliveryTime', 
                filters.deliveryTime === option.value ? undefined : option.value
              )}
            >
              <span className="text-sm">{option.label}</span>
              {filters.deliveryTime === option.value && (
                <X className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Seller Level */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Award className="h-4 w-4" />
          Seller Level
        </Label>
        <div className="space-y-2">
          {talentLevelOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                'w-full flex items-center justify-between p-2 rounded-md text-left hover:bg-accent transition-colors',
                filters.talentLevel === option.value && 'bg-accent'
              )}
              onClick={() => onFilterChange('talentLevel', 
                filters.talentLevel === option.value ? '' : option.value
              )}
            >
              <span className="text-sm">{option.label}</span>
              {filters.talentLevel === option.value && (
                <X className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Rating Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Star className="h-4 w-4" />
          Minimum Rating
        </Label>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              type="button"
              className={cn(
                'w-full flex items-center justify-between p-2 rounded-md text-left hover:bg-accent transition-colors',
                filters.avgRating === rating && 'bg-accent'
              )}
              onClick={() => onFilterChange('avgRating', 
                filters.avgRating === rating ? undefined : rating
              )}
            >
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-muted-foreground'
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm">& up</span>
              </div>
              {filters.avgRating === rating && (
                <X className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Special Options */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Special Options</Label>
        <div className="space-y-2">
          <button
            type="button"
            className={cn(
              'w-full flex items-center justify-between p-2 rounded-md text-left hover:bg-accent transition-colors',
              filters.featured && 'bg-accent'
            )}
            onClick={() => onFilterChange('featured', !filters.featured)}
          >
            <span className="text-sm">Featured Services</span>
            {filters.featured && <X className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}