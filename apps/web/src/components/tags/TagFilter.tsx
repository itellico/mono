'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Filter, 
  Hash, 
  X, 
  Check,
  ChevronsUpDown,
  Search
} from 'lucide-react';
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

interface TagFilterProps {
  selectedTags: number[];
  onTagsChange: (tagIds: number[]) => void;
  category?: string;
  placeholder?: string;
  matchMode?: 'any' | 'all';
  onMatchModeChange?: (mode: 'any' | 'all') => void;
  showMatchMode?: boolean;
  variant?: 'default' | 'inline' | 'popover';
  className?: string;
}

export function TagFilter({
  selectedTags,
  onTagsChange,
  category,
  placeholder = 'Filter by tags...',
  matchMode = 'any',
  onMatchModeChange,
  showMatchMode = false,
  variant = 'default',
  className,
}: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Search tags
  const { 
    data: searchResults = [], 
    isLoading: isSearching 
  } = useQuery({
    queryKey: ['tags-filter-search', searchTerm, category],
    queryFn: async () => {
      const params: any = {
        search: searchTerm,
        limit: 50,
      };
      if (category) {
        params.category = category;
      }
      
      const response = await apiClient.get('/api/v1/tags', { params });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to search tags');
      }
      return response.data.data.tags as TagData[];
    },
    enabled: searchTerm.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Get popular tags for initial display
  const { 
    data: popularTags = [] 
  } = useQuery({
    queryKey: ['tags-filter-popular', category],
    queryFn: async () => {
      const params: any = {
        popular: true,
        limit: 20,
      };
      if (category) {
        params.category = category;
      }
      
      const response = await apiClient.get('/api/v1/tags', { params });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch popular tags');
      }
      return response.data.data.tags as TagData[];
    },
    enabled: searchTerm.length < 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get selected tag details
  const { 
    data: selectedTagDetails = [] 
  } = useQuery({
    queryKey: ['tags-filter-selected', selectedTags],
    queryFn: async () => {
      if (selectedTags.length === 0) return [];
      
      // Fetch details for selected tags
      const promises = selectedTags.map(async (tagId) => {
        // This is a workaround - ideally we'd have a batch endpoint
        const response = await apiClient.get('/api/v1/tags', {
          params: { limit: 100 }
        });
        return response.data.data.tags.find((tag: TagData) => tag.id === tagId);
      });
      
      const results = await Promise.all(promises);
      return results.filter(Boolean) as TagData[];
    },
    enabled: selectedTags.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const displayTags = searchTerm.length >= 2 ? searchResults : popularTags;

  const handleToggleTag = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const handleClearAll = () => {
    onTagsChange([]);
    setSearchTerm('');
  };

  const renderSelectedTags = () => {
    if (selectedTags.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2">
        {selectedTagDetails.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="pr-1"
          >
            <Hash className="h-3 w-3 mr-1" />
            {tag.name}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleToggleTag(tag.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
    );
  };

  if (variant === 'inline') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          {selectedTags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
            >
              Clear ({selectedTags.length})
            </Button>
          )}
        </div>
        
        {renderSelectedTags()}
        
        {(searchTerm.length >= 2 || popularTags.length > 0) && (
          <ScrollArea className="h-48 border rounded-md p-2">
            <div className="space-y-1">
              {displayTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <div
                    key={tag.id}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent',
                      isSelected && 'bg-accent'
                    )}
                    onClick={() => handleToggleTag(tag.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{tag.name}</span>
                      {tag.category && (
                        <Badge variant="outline" className="text-xs">
                          {tag.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {tag.usageCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {tag.usageCount}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
        
        {showMatchMode && selectedTags.length > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <Label>Match:</Label>
            <Button
              variant={matchMode === 'any' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onMatchModeChange?.('any')}
            >
              Any Tag
            </Button>
            <Button
              variant={matchMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onMatchModeChange?.('all')}
            >
              All Tags
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'popover') {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className={cn('justify-between', className)}
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {selectedTags.length > 0 ? (
                <span>{selectedTags.length} tags selected</span>
              ) : (
                <span>{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput
              placeholder="Search tags..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                {searchTerm.length < 2
                  ? 'Type at least 2 characters to search'
                  : 'No tags found'
                }
              </CommandEmpty>
              
              {selectedTags.length > 0 && (
                <>
                  <CommandGroup heading="Selected Tags">
                    <div className="p-2">
                      {renderSelectedTags()}
                    </div>
                  </CommandGroup>
                  <Separator />
                </>
              )}
              
              {displayTags.length > 0 && (
                <CommandGroup heading={searchTerm.length >= 2 ? 'Search Results' : 'Popular Tags'}>
                  {displayTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <CommandItem
                        key={tag.id}
                        onSelect={() => handleToggleTag(tag.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            <span>{tag.name}</span>
                            {tag.category && (
                              <Badge variant="outline" className="text-xs">
                                {tag.category}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {tag.usageCount > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {tag.usageCount}
                              </span>
                            )}
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
            
            {showMatchMode && selectedTags.length > 1 && (
              <div className="p-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Label>Match:</Label>
                  <Button
                    variant={matchMode === 'any' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onMatchModeChange?.('any')}
                  >
                    Any Tag
                  </Button>
                  <Button
                    variant={matchMode === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onMatchModeChange?.('all')}
                  >
                    All Tags
                  </Button>
                </div>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  // Default variant
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-base flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter by Tags
        </Label>
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        )}
      </div>
      
      <Input
        placeholder="Search tags..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full"
      />
      
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Selected Tags ({selectedTags.length})
          </Label>
          {renderSelectedTags()}
        </div>
      )}
      
      {(searchTerm.length >= 2 || popularTags.length > 0) && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            {searchTerm.length >= 2 ? 'Search Results' : 'Popular Tags'}
          </Label>
          <ScrollArea className="h-64 border rounded-md p-3">
            <div className="space-y-1">
              {displayTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <div
                    key={tag.id}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent transition-colors',
                      isSelected && 'bg-accent'
                    )}
                    onClick={() => handleToggleTag(tag.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{tag.name}</span>
                      {tag.category && (
                        <Badge variant="outline" className="text-xs">
                          {tag.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {tag.usageCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {tag.usageCount} uses
                        </span>
                      )}
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {showMatchMode && selectedTags.length > 1 && (
        <div className="flex items-center gap-3 pt-2">
          <Label className="text-sm">Match Mode:</Label>
          <div className="flex gap-2">
            <Button
              variant={matchMode === 'any' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onMatchModeChange?.('any')}
            >
              Any Tag
            </Button>
            <Button
              variant={matchMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onMatchModeChange?.('all')}
            >
              All Tags
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}