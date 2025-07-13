'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface TagData {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  category?: string;
  usageCount: number;
  isSystem: boolean;
}

interface TagDisplayProps {
  entityType: string;
  entityId: string;
  variant?: 'default' | 'compact' | 'minimal';
  maxTags?: number;
  showCategory?: boolean;
  linkable?: boolean;
  className?: string;
}

export function TagDisplay({
  entityType,
  entityId,
  variant = 'default',
  maxTags,
  showCategory = false,
  linkable = false,
  className,
}: TagDisplayProps) {
  // Fetch tags for the entity
  const { 
    data: tags = [], 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['entity-tags-display', entityType, entityId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/tags/entity/${entityType}/${entityId}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch entity tags');
      }
      return response.data.data.tags as TagData[];
    },
    enabled: !!entityId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-5 w-16" />
        ))}
      </div>
    );
  }

  if (error || tags.length === 0) {
    return null;
  }

  const displayTags = maxTags ? tags.slice(0, maxTags) : tags;
  const remainingCount = maxTags && tags.length > maxTags ? tags.length - maxTags : 0;

  const renderTag = (tag: TagData) => {
    const tagContent = (
      <>
        <Hash className="h-3 w-3" />
        <span>{tag.name}</span>
        {showCategory && tag.category && (
          <span className="text-xs opacity-70">({tag.category})</span>
        )}
      </>
    );

    const badgeElement = (
      <Badge
        key={tag.id}
        variant={variant === 'minimal' ? 'outline' : 'secondary'}
        className={cn(
          variant === 'minimal' && 'text-xs py-0 h-5',
          variant === 'compact' && 'text-xs py-0.5',
          linkable && 'cursor-pointer hover:bg-secondary/80'
        )}
      >
        {tagContent}
      </Badge>
    );

    if (linkable) {
      return (
        <Link
          key={tag.id}
          href={`/search?tag=${tag.slug}`}
          className="inline-block"
        >
          {badgeElement}
        </Link>
      );
    }

    return badgeElement;
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {displayTags.map(renderTag)}
      
      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}

// Standalone function to fetch tags for an entity
export async function fetchEntityTags(entityType: string, entityId: string): Promise<TagData[]> {
  try {
    const response = await apiClient.get(`/api/v1/tags/entity/${entityType}/${entityId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch entity tags');
    }
    return response.data.data.tags as TagData[];
  } catch (error) {
    console.error('Error fetching entity tags:', error);
    return [];
  }
}