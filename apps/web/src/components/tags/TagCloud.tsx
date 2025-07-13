'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Hash, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

interface TagData {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  category?: string;
  usageCount: number;
  isSystem: boolean;
}

interface TagCloudProps {
  category?: string;
  limit?: number;
  onTagClick?: (tag: TagData) => void;
  variant?: 'default' | 'compact' | 'inline';
  showUsageCount?: boolean;
  className?: string;
}

export function TagCloud({
  category,
  limit = 30,
  onTagClick,
  variant = 'default',
  showUsageCount = true,
  className,
}: TagCloudProps) {
  // Fetch popular tags
  const { 
    data: tags = [], 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['tags-cloud', category, limit],
    queryFn: async () => {
      const params: any = {
        popular: true,
        limit,
      };
      if (category) {
        params.category = category;
      }
      
      const response = await apiClient.get('/api/v1/tags', { params });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch tags');
      }
      return response.data.data.tags as TagData[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const getTagSize = (tag: TagData) => {
    if (!tags.length) return 'text-sm';
    
    const maxCount = Math.max(...tags.map(t => t.usageCount));
    const minCount = Math.min(...tags.map(t => t.usageCount));
    const range = maxCount - minCount || 1;
    const percentage = ((tag.usageCount - minCount) / range) * 100;
    
    if (percentage >= 80) return 'text-lg font-semibold';
    if (percentage >= 60) return 'text-base font-medium';
    if (percentage >= 40) return 'text-sm';
    return 'text-xs';
  };

  const getTagOpacity = (tag: TagData) => {
    if (!tags.length) return '';
    
    const maxCount = Math.max(...tags.map(t => t.usageCount));
    const minCount = Math.min(...tags.map(t => t.usageCount));
    const range = maxCount - minCount || 1;
    const percentage = ((tag.usageCount - minCount) / range) * 100;
    
    if (percentage >= 80) return '';
    if (percentage >= 60) return 'opacity-90';
    if (percentage >= 40) return 'opacity-80';
    return 'opacity-70';
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {variant === 'default' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Popular Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-20" />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {variant === 'compact' && (
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Popular Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-5 w-16" />
              ))}
            </div>
          </div>
        )}
        
        {variant === 'inline' && (
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-14" />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        Failed to load tags
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        No tags available
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap gap-2 items-center', className)}>
        {tags.map((tag) => (
          <Button
            key={tag.id}
            variant="ghost"
            size="sm"
            className={cn(
              'h-auto py-1 px-2',
              getTagSize(tag),
              getTagOpacity(tag)
            )}
            onClick={() => onTagClick?.(tag)}
          >
            <Hash className="h-3 w-3 mr-1" />
            {tag.name}
            {showUsageCount && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({tag.usageCount})
              </span>
            )}
          </Button>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        <h3 className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Popular Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className={cn(
                'cursor-pointer hover:bg-secondary/80',
                getTagSize(tag),
                getTagOpacity(tag)
              )}
              onClick={() => onTagClick?.(tag)}
            >
              <Hash className="h-3 w-3 mr-1" />
              {tag.name}
              {showUsageCount && (
                <span className="ml-1 text-xs opacity-70">
                  {tag.usageCount}
                </span>
              )}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Popular Tags
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={cn(
                'inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors',
                getTagSize(tag),
                getTagOpacity(tag)
              )}
              onClick={() => onTagClick?.(tag)}
            >
              <Hash className="h-4 w-4" />
              <span>{tag.name}</span>
              {showUsageCount && (
                <span className="text-xs opacity-70">
                  ({tag.usageCount})
                </span>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}