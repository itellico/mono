'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Tag, 
  X, 
  Plus, 
  Check, 
  ChevronsUpDown,
  Hash,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
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

interface TagSelectorProps {
  entityType: string;
  entityId: string;
  category?: string;
  placeholder?: string;
  allowCreate?: boolean;
  maxTags?: number;
  variant?: 'default' | 'inline' | 'minimal';
  onChange?: (tags: TagData[]) => void;
  disabled?: boolean;
  className?: string;
}

export function TagSelector({
  entityType,
  entityId,
  category,
  placeholder = 'Add tags...',
  allowCreate = true,
  maxTags,
  variant = 'default',
  onChange,
  disabled = false,
  className,
}: TagSelectorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<TagData[]>([]);

  // Fetch existing tags for the entity
  const { 
    data: entityTags = [], 
    isLoading: isLoadingEntityTags 
  } = useQuery({
    queryKey: ['entity-tags', entityType, entityId],
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

  // Search available tags
  const { 
    data: availableTags = [], 
    isLoading: isSearching 
  } = useQuery({
    queryKey: ['tags-search', searchTerm, category],
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

  // Get popular tags if no search term
  const { 
    data: popularTags = [] 
  } = useQuery({
    queryKey: ['tags-popular', category],
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

  // Initialize selected tags from entity tags
  useEffect(() => {
    if (entityTags.length > 0 && selectedTags.length === 0) {
      setSelectedTags(entityTags);
    }
  }, [entityTags]);

  // Add tag mutation
  const addTagMutation = useMutation({
    mutationFn: async (tagId: number) => {
      const response = await apiClient.post('/api/v1/tags/entity', {
        tagId,
        entityType,
        entityId,
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to add tag');
      }
      
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-tags', entityType, entityId] });
      toast({
        title: 'Tag added',
        description: 'The tag has been added successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add tag',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Remove tag mutation
  const removeTagMutation = useMutation({
    mutationFn: async (tagId: number) => {
      const response = await apiClient.delete('/api/v1/tags/entity', {
        data: {
          tagId,
          entityType,
          entityId,
        },
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to remove tag');
      }
      
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-tags', entityType, entityId] });
      toast({
        title: 'Tag removed',
        description: 'The tag has been removed successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to remove tag',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create new tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiClient.post('/api/v1/tags', {
        name,
        category,
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create tag');
      }
      
      return response.data.data.tag as TagData;
    },
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ['tags-search'] });
      queryClient.invalidateQueries({ queryKey: ['tags-popular'] });
      handleSelectTag(newTag);
      setSearchTerm('');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create tag',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSelectTag = async (tag: TagData) => {
    if (maxTags && selectedTags.length >= maxTags) {
      toast({
        title: 'Maximum tags reached',
        description: `You can only add up to ${maxTags} tags.`,
        variant: 'destructive',
      });
      return;
    }

    if (!selectedTags.find(t => t.id === tag.id)) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      
      if (entityId) {
        await addTagMutation.mutateAsync(tag.id);
      }
      
      onChange?.(newTags);
    }
    
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleRemoveTag = async (tagId: number) => {
    const newTags = selectedTags.filter(t => t.id !== tagId);
    setSelectedTags(newTags);
    
    if (entityId) {
      await removeTagMutation.mutateAsync(tagId);
    }
    
    onChange?.(newTags);
  };

  const handleCreateTag = () => {
    if (searchTerm.trim() && allowCreate) {
      createTagMutation.mutate(searchTerm.trim());
    }
  };

  const displayTags = searchTerm.length >= 2 ? availableTags : popularTags;
  const filteredTags = displayTags.filter(tag => 
    !selectedTags.find(selected => selected.id === tag.id)
  );

  const isCreatingTag = createTagMutation.isPending;
  const canCreateTag = allowCreate && 
    searchTerm.trim().length > 0 && 
    !filteredTags.find(tag => tag.name.toLowerCase() === searchTerm.toLowerCase());

  if (variant === 'minimal') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="text-xs"
          >
            <Hash className="h-3 w-3 mr-1" />
            {tag.name}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        {!disabled && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search tags..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList>
                  <CommandEmpty>
                    {searchTerm.length < 2 ? (
                      'Type at least 2 characters to search'
                    ) : canCreateTag ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={handleCreateTag}
                        disabled={isCreatingTag}
                      >
                        {isCreatingTag ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Create "{searchTerm}"
                      </Button>
                    ) : (
                      'No tags found'
                    )}
                  </CommandEmpty>
                  {filteredTags.length > 0 && (
                    <CommandGroup>
                      {filteredTags.map((tag) => (
                        <CommandItem
                          key={tag.id}
                          onSelect={() => handleSelectTag(tag)}
                          className="cursor-pointer"
                        >
                          <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{tag.name}</span>
                          {tag.usageCount > 0 && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              {tag.usageCount}
                            </span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="pr-1"
          >
            <Hash className="h-3 w-3 mr-1" />
            {tag.name}
            {!disabled && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemoveTag(tag.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Badge>
        ))}
        {!disabled && (!maxTags || selectedTags.length < maxTags) && (
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && canCreateTag) {
                e.preventDefault();
                handleCreateTag();
              }
            }}
            className="h-7 w-32"
            disabled={disabled}
          />
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('space-y-2', className)}>
      <Label>Tags</Label>
      
      <div className="flex flex-wrap gap-2 min-h-[32px] p-2 border border-border rounded-md">
        {isLoadingEntityTags ? (
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-16" />
            ))}
          </div>
        ) : (
          <>
            {selectedTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="pr-1"
              >
                <Hash className="h-3 w-3 mr-1" />
                {tag.name}
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveTag(tag.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </Badge>
            ))}
            
            {!disabled && (!maxTags || selectedTags.length < maxTags) && (
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Tag
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search or create tags..."
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {searchTerm.length < 2 ? (
                          'Type at least 2 characters to search'
                        ) : canCreateTag ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={handleCreateTag}
                            disabled={isCreatingTag}
                          >
                            {isCreatingTag ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4 mr-2" />
                            )}
                            Create "{searchTerm}"
                          </Button>
                        ) : (
                          'No tags found'
                        )}
                      </CommandEmpty>
                      
                      {searchTerm.length < 2 && popularTags.length > 0 && (
                        <CommandGroup heading="Popular Tags">
                          {filteredTags.map((tag) => (
                            <CommandItem
                              key={tag.id}
                              onSelect={() => handleSelectTag(tag)}
                              className="cursor-pointer"
                            >
                              <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{tag.name}</span>
                              <span className="ml-auto text-xs text-muted-foreground">
                                {tag.usageCount} uses
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      
                      {searchTerm.length >= 2 && filteredTags.length > 0 && (
                        <CommandGroup heading="Search Results">
                          {filteredTags.map((tag) => (
                            <CommandItem
                              key={tag.id}
                              onSelect={() => handleSelectTag(tag)}
                              className="cursor-pointer"
                            >
                              <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{tag.name}</span>
                              {tag.category && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {tag.category}
                                </Badge>
                              )}
                              {tag.usageCount > 0 && (
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {tag.usageCount}
                                </span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </>
        )}
      </div>
      
      {maxTags && (
        <p className="text-xs text-muted-foreground">
          {selectedTags.length} / {maxTags} tags
        </p>
      )}
    </div>
  );
}