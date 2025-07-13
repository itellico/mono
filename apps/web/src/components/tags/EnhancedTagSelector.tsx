'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  CommandSeparator,
} from '@/components/ui/command';
import {
  Tag,
  Plus,
  X,
  Search,
  Filter,
  Star,
  TrendingUp,
  Clock,
  Users,
  Check,
  ChevronDown,
  Sparkles,
  Hash,
  Folder
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagData {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  usageCount: number;
  isActive: boolean;
  isSystem: boolean;
  isFeatured?: boolean;
  parentId?: number;
  children?: TagData[];
  createdAt: string;
  metadata?: {
    color?: string;
    icon?: string;
    aliases?: string[];
  };
}

interface TagSuggestion {
  id: number;
  name: string;
  category?: string;
  usageCount: number;
  reason: 'popular' | 'recent' | 'similar' | 'autocomplete';
  score: number;
}

interface EnhancedTagSelectorProps {
  /**
   * Currently selected tags
   */
  selectedTags: TagData[];
  /**
   * Available tags to choose from
   */
  availableTags?: TagData[];
  /**
   * Whether to allow creating new tags
   * @default true
   */
  allowCreate?: boolean;
  /**
   * Maximum number of tags that can be selected
   * @default unlimited
   */
  maxTags?: number;
  /**
   * Placeholder text for the input
   * @default "Search or add tags..."
   */
  placeholder?: string;
  /**
   * Whether to show suggestions
   * @default true
   */
  showSuggestions?: boolean;
  /**
   * Whether to show popular tags
   * @default true
   */
  showPopular?: boolean;
  /**
   * Whether to show recent tags
   * @default true
   */
  showRecent?: boolean;
  /**
   * Whether to group tags by category
   * @default true
   */
  groupByCategory?: boolean;
  /**
   * Size variant
   * @default "default"
   */
  size?: 'sm' | 'default' | 'lg';
  /**
   * Visual variant
   * @default "default"
   */
  variant?: 'default' | 'inline' | 'compact';
  /**
   * Whether the selector is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Callback when tags are selected/deselected
   */
  onTagsChange: (tags: TagData[]) => void;
  /**
   * Callback when a new tag is created
   */
  onCreateTag?: (name: string) => Promise<TagData>;
  /**
   * Callback for searching tags
   */
  onSearch?: (query: string) => Promise<TagData[]>;
  /**
   * Entity type for context-aware suggestions
   */
  entityType?: string;
  /**
   * Entity ID for context-aware suggestions
   */
  entityId?: string;
}

// Mock data for demonstration
const mockTags: TagData[] = [
  { id: 1, uuid: '1', name: 'Photography', slug: 'photography', category: 'content-type', usageCount: 156, isActive: true, isSystem: false, isFeatured: true, createdAt: '2024-01-15T10:00:00Z', metadata: { color: '#3B82F6', icon: 'camera' } },
  { id: 2, uuid: '2', name: 'Fashion', slug: 'fashion', category: 'style', usageCount: 134, isActive: true, isSystem: false, isFeatured: true, createdAt: '2024-01-15T11:00:00Z', metadata: { color: '#10B981', icon: 'sparkles' } },
  { id: 3, uuid: '3', name: 'Portrait', slug: 'portrait', category: 'content-type', usageCount: 98, isActive: true, isSystem: false, createdAt: '2024-01-15T12:00:00Z', metadata: { color: '#F59E0B' } },
  { id: 4, uuid: '4', name: 'Commercial', slug: 'commercial', category: 'project-type', usageCount: 87, isActive: true, isSystem: false, createdAt: '2024-01-15T13:00:00Z', metadata: { color: '#8B5CF6' } },
  { id: 5, uuid: '5', name: 'Editorial', slug: 'editorial', category: 'project-type', usageCount: 76, isActive: true, isSystem: false, createdAt: '2024-01-15T14:00:00Z', metadata: { color: '#EC4899' } },
  { id: 6, uuid: '6', name: 'Beauty', slug: 'beauty', category: 'style', usageCount: 65, isActive: true, isSystem: false, createdAt: '2024-01-15T15:00:00Z', metadata: { color: '#F97316' } },
  { id: 7, uuid: '7', name: 'Studio', slug: 'studio', category: 'location', usageCount: 54, isActive: true, isSystem: false, createdAt: '2024-01-15T16:00:00Z', metadata: { color: '#06B6D4' } },
  { id: 8, uuid: '8', name: 'Outdoor', slug: 'outdoor', category: 'location', usageCount: 43, isActive: true, isSystem: false, createdAt: '2024-01-15T17:00:00Z', metadata: { color: '#84CC16' } },
  { id: 9, uuid: '9', name: 'Lifestyle', slug: 'lifestyle', category: 'style', usageCount: 39, isActive: true, isSystem: false, createdAt: '2024-01-15T18:00:00Z', metadata: { color: '#EF4444' } },
  { id: 10, uuid: '10', name: 'Creative', slug: 'creative', category: 'style', usageCount: 32, isActive: true, isSystem: false, createdAt: '2024-01-15T19:00:00Z', metadata: { color: '#8B5CF6' } }
];

function useTagSearch(query: string, availableTags: TagData[], selectedTags: TagData[]) {
  return useMemo(() => {
    if (!query.trim()) return [];

    const selectedIds = new Set(selectedTags.map(tag => tag.id));
    const searchQuery = query.toLowerCase();

    return availableTags
      .filter(tag => !selectedIds.has(tag.id) && tag.isActive)
      .filter(tag => 
        tag.name.toLowerCase().includes(searchQuery) ||
        tag.slug.toLowerCase().includes(searchQuery) ||
        tag.description?.toLowerCase().includes(searchQuery) ||
        tag.metadata?.aliases?.some(alias => alias.toLowerCase().includes(searchQuery))
      )
      .sort((a, b) => {
        // Exact matches first
        const aExact = a.name.toLowerCase() === searchQuery ? 1 : 0;
        const bExact = b.name.toLowerCase() === searchQuery ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;

        // Starts with query
        const aStarts = a.name.toLowerCase().startsWith(searchQuery) ? 1 : 0;
        const bStarts = b.name.toLowerCase().startsWith(searchQuery) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;

        // Usage count
        return b.usageCount - a.usageCount;
      })
      .slice(0, 20);
  }, [query, availableTags, selectedTags]);
}

function useTagSuggestions(
  availableTags: TagData[], 
  selectedTags: TagData[], 
  entityType?: string,
  entityId?: string
): TagSuggestion[] {
  return useMemo(() => {
    const selectedIds = new Set(selectedTags.map(tag => tag.id));
    const suggestions: TagSuggestion[] = [];

    // Popular tags (not selected)
    availableTags
      .filter(tag => !selectedIds.has(tag.id) && tag.isActive)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .forEach(tag => {
        suggestions.push({
          id: tag.id,
          name: tag.name,
          category: tag.category,
          usageCount: tag.usageCount,
          reason: 'popular',
          score: tag.usageCount
        });
      });

    // Recent tags (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    availableTags
      .filter(tag => !selectedIds.has(tag.id) && tag.isActive && new Date(tag.createdAt) > weekAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .forEach(tag => {
        if (!suggestions.find(s => s.id === tag.id)) {
          suggestions.push({
            id: tag.id,
            name: tag.name,
            category: tag.category,
            usageCount: tag.usageCount,
            reason: 'recent',
            score: new Date(tag.createdAt).getTime()
          });
        }
      });

    // Similar tags (same category as selected)
    if (selectedTags.length > 0) {
      const selectedCategories = new Set(selectedTags.map(tag => tag.category).filter(Boolean));
      availableTags
        .filter(tag => 
          !selectedIds.has(tag.id) && 
          tag.isActive && 
          tag.category && 
          selectedCategories.has(tag.category)
        )
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 3)
        .forEach(tag => {
          if (!suggestions.find(s => s.id === tag.id)) {
            suggestions.push({
              id: tag.id,
              name: tag.name,
              category: tag.category,
              usageCount: tag.usageCount,
              reason: 'similar',
              score: tag.usageCount
            });
          }
        });
    }

    return suggestions.slice(0, 10);
  }, [availableTags, selectedTags, entityType, entityId]);
}

function TagBadge({ 
  tag, 
  onRemove, 
  size = 'default',
  variant = 'default',
  showUsage = false
}: { 
  tag: TagData; 
  onRemove?: () => void; 
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  showUsage?: boolean;
}) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    default: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge
      variant={variant}
      className={cn(
        'flex items-center gap-1 transition-all duration-200 hover:scale-105',
        sizeClasses[size]
      )}
      style={{
        backgroundColor: tag.metadata?.color ? `${tag.metadata.color}20` : undefined,
        borderColor: tag.metadata?.color,
        color: tag.metadata?.color
      }}
    >
      {tag.isFeatured && <Star className="h-3 w-3 fill-current" />}
      <span>{tag.name}</span>
      {showUsage && (
        <span className="text-xs opacity-60">({tag.usageCount})</span>
      )}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}

export function EnhancedTagSelector({
  selectedTags,
  availableTags = mockTags,
  allowCreate = true,
  maxTags,
  placeholder = "Search or add tags...",
  showSuggestions = true,
  showPopular = true,
  showRecent = true,
  groupByCategory = true,
  size = 'default',
  variant = 'default',
  disabled = false,
  className,
  onTagsChange,
  onCreateTag,
  onSearch,
  entityType,
  entityId
}: EnhancedTagSelectorProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchResults = useTagSearch(inputValue, availableTags, selectedTags);
  const suggestions = useTagSuggestions(availableTags, selectedTags, entityType, entityId);

  const handleSelectTag = (tag: TagData) => {
    if (maxTags && selectedTags.length >= maxTags) {
      return;
    }

    if (!selectedTags.find(t => t.id === tag.id)) {
      onTagsChange([...selectedTags, tag]);
    }
    setInputValue('');
    setIsOpen(false);
  };

  const handleRemoveTag = (tagId: number) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!inputValue.trim() || !allowCreate || !onCreateTag) return;

    setIsCreating(true);
    try {
      const newTag = await onCreateTag(inputValue.trim());
      handleSelectTag(newTag);
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleSelectTag(availableTags.find(tag => tag.id === searchResults[0].id)!);
      } else if (allowCreate && onCreateTag) {
        handleCreateTag();
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      handleRemoveTag(selectedTags[selectedTags.length - 1].id);
    }
  };

  // Group search results by category
  const groupedResults = useMemo(() => {
    if (!groupByCategory) {
      return { '': searchResults.map(tag => availableTags.find(t => t.id === tag.id)!).filter(Boolean) };
    }

    const groups: Record<string, TagData[]> = {};
    searchResults.forEach(result => {
      const tag = availableTags.find(t => t.id === result.id);
      if (tag) {
        const category = tag.category || 'Other';
        if (!groups[category]) groups[category] = [];
        groups[category].push(tag);
      }
    });

    return groups;
  }, [searchResults, availableTags, groupByCategory]);

  const sizeClasses = {
    sm: 'min-h-8 text-sm',
    default: 'min-h-10 text-sm',
    lg: 'min-h-12 text-base'
  };

  const variantClasses = {
    default: 'border border-input bg-background',
    inline: 'border-0 bg-transparent',
    compact: 'border border-input bg-background rounded-md'
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              size={size}
              onRemove={() => handleRemoveTag(tag.id)}
              showUsage={false}
            />
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="relative">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md cursor-text transition-colors',
                sizeClasses[size],
                variantClasses[variant],
                disabled && 'opacity-50 cursor-not-allowed',
                'hover:bg-accent/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'
              )}
              onClick={() => {
                if (!disabled) {
                  setIsOpen(true);
                  inputRef.current?.focus();
                }
              }}
            >
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={maxTags && selectedTags.length >= maxTags ? 'Maximum tags reached' : placeholder}
                disabled={disabled || (maxTags && selectedTags.length >= maxTags)}
                className="flex-1 bg-transparent border-0 outline-none placeholder:text-muted-foreground"
              />

              {(inputValue || selectedTags.length > 0) && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {maxTags && (
                    <span>{selectedTags.length}/{maxTags}</span>
                  )}
                  <ChevronDown className="h-3 w-3" />
                </div>
              )}
            </div>
          </PopoverTrigger>

          <PopoverContent 
            className="w-[--radix-popover-trigger-width] p-0" 
            side="bottom" 
            align="start"
          >
            <Command>
              <CommandList className="max-h-64">
                {/* Search Results */}
                {inputValue && (
                  <>
                    <CommandGroup heading="Search Results">
                      {Object.entries(groupedResults).map(([category, tags]) => (
                        <div key={category}>
                          {groupByCategory && category && (
                            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-b">
                              <div className="flex items-center gap-1">
                                <Folder className="h-3 w-3" />
                                {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                              </div>
                            </div>
                          )}
                          {tags.map((tag) => (
                            <CommandItem
                              key={tag.id}
                              value={tag.name}
                              onSelect={() => handleSelectTag(tag)}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <TagBadge tag={tag} size="sm" variant="outline" />
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {tag.usageCount}
                              </div>
                            </CommandItem>
                          ))}
                        </div>
                      ))}
                      
                      {searchResults.length === 0 && allowCreate && onCreateTag && (
                        <CommandItem onSelect={handleCreateTag} disabled={isCreating}>
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            <span>Create "{inputValue}"</span>
                            {isCreating && <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />}
                          </div>
                        </CommandItem>
                      )}
                    </CommandGroup>
                    
                    {(searchResults.length > 0 || (allowCreate && onCreateTag)) && <CommandSeparator />}
                  </>
                )}

                {/* Suggestions */}
                {!inputValue && showSuggestions && suggestions.length > 0 && (
                  <CommandGroup heading="Suggestions">
                    {suggestions.map((suggestion) => {
                      const tag = availableTags.find(t => t.id === suggestion.id);
                      if (!tag) return null;

                      const reasonIcons = {
                        popular: <TrendingUp className="h-3 w-3" />,
                        recent: <Clock className="h-3 w-3" />,
                        similar: <Sparkles className="h-3 w-3" />,
                        autocomplete: <Hash className="h-3 w-3" />
                      };

                      return (
                        <CommandItem
                          key={tag.id}
                          value={tag.name}
                          onSelect={() => handleSelectTag(tag)}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {reasonIcons[suggestion.reason]}
                            <TagBadge tag={tag} size="sm" variant="outline" />
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {tag.usageCount}
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}

                {/* Popular Tags */}
                {!inputValue && showPopular && (
                  <>
                    {showSuggestions && suggestions.length > 0 && <CommandSeparator />}
                    <CommandGroup heading="Popular Tags">
                      {availableTags
                        .filter(tag => 
                          !selectedTags.find(selected => selected.id === tag.id) && 
                          tag.isActive &&
                          tag.isFeatured
                        )
                        .sort((a, b) => b.usageCount - a.usageCount)
                        .slice(0, 5)
                        .map((tag) => (
                          <CommandItem
                            key={tag.id}
                            value={tag.name}
                            onSelect={() => handleSelectTag(tag)}
                            className="flex items-center justify-between"
                          >
                            <TagBadge tag={tag} size="sm" variant="outline" />
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {tag.usageCount}
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </>
                )}

                {/* Empty State */}
                {!inputValue && !showSuggestions && !showPopular && (
                  <CommandEmpty>
                    <div className="text-center py-6">
                      <Tag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Start typing to search tags</p>
                    </div>
                  </CommandEmpty>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

// Example usage component
export function TagSelectorExample() {
  const [selectedTags, setSelectedTags] = useState<TagData[]>([mockTags[0], mockTags[1]]);

  const handleCreateTag = async (name: string): Promise<TagData> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newTag: TagData = {
      id: Date.now(),
      uuid: `tag-${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: 'custom',
      usageCount: 0,
      isActive: true,
      isSystem: false,
      createdAt: new Date().toISOString(),
      metadata: {
        color: '#6B7280'
      }
    };

    return newTag;
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Enhanced Tag Selector Examples</h3>
        
        <div className="space-y-8">
          {/* Default */}
          <div className="space-y-2">
            <Label>Default Selector</Label>
            <EnhancedTagSelector
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              onCreateTag={handleCreateTag}
            />
          </div>

          {/* Compact */}
          <div className="space-y-2">
            <Label>Compact with Max Tags</Label>
            <EnhancedTagSelector
              selectedTags={selectedTags.slice(0, 3)}
              onTagsChange={setSelectedTags}
              onCreateTag={handleCreateTag}
              variant="compact"
              maxTags={3}
              size="sm"
            />
          </div>

          {/* Inline */}
          <div className="space-y-2">
            <Label>Inline Style</Label>
            <div className="border rounded-lg p-4">
              <EnhancedTagSelector
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                onCreateTag={handleCreateTag}
                variant="inline"
                placeholder="Add tags to this content..."
                showSuggestions={false}
              />
            </div>
          </div>

          {/* No grouping */}
          <div className="space-y-2">
            <Label>No Category Grouping</Label>
            <EnhancedTagSelector
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              onCreateTag={handleCreateTag}
              groupByCategory={false}
              showRecent={false}
            />
          </div>

          {/* Disabled */}
          <div className="space-y-2">
            <Label>Disabled</Label>
            <EnhancedTagSelector
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              onCreateTag={handleCreateTag}
              disabled={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedTagSelector;