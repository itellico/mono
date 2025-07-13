'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Category {
  name: string;
  count: number;
  icon?: string;
  subcategories?: Array<{
    name: string;
    count: number;
  }>;
}

interface CategoryMonoProps {
  categories: Category[];
  onCategoryClick: (categoryName: string) => void;
  className?: string;
}

export function CategoryMono({ 
  categories, 
  onCategoryClick, 
  className 
}: CategoryMonoProps) {
  return (
    <div className={cn(
      'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4',
      className
    )}>
      {categories.map((category) => (
        <Card
          key={category.name}
          className="cursor-pointer hover:shadow-md transition-all duration-200 border-border/50 hover:border-border group"
          onClick={() => onCategoryClick(category.name)}
        >
          <CardContent className="p-6 text-center space-y-3">
            {/* Category Icon */}
            <div className="text-4xl group-hover:scale-110 transition-transform duration-200">
              {category.icon || '📁'}
            </div>
            
            {/* Category Name */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              
              {/* Service Count */}
              <Badge variant="secondary" className="text-xs">
                {category.count.toLocaleString()} services
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}