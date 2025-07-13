"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as LucideIcons from 'lucide-react';
import { browserLogger } from '@/lib/browser-logger';

interface LucideIconPickerProps {
  value?: string;
  onChange: (iconName: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface CategorizedIcon {
  name: string;
  component: React.ComponentType<{ className?: string; size?: number }>;
  category: string;
}

/**
 * Get all available Lucide icons dynamically from the package
 */
const getAllLucideIcons = (): CategorizedIcon[] => {
  const icons: CategorizedIcon[] = [];
  
  // Get all exports from lucide-react
  const allExports = Object.entries(LucideIcons);
  
  for (const [name, component] of allExports) {
    // Filter out non-icon exports (like createLucideIcon, Icon, etc.)
    // Lucide icons are objects, not functions in the latest version
    if (
      (typeof component === 'function' || typeof component === 'object') &&
      component &&
      name !== 'createLucideIcon' &&
      name !== 'Icon' &&
      name !== 'default' &&
      !name.startsWith('Lucide') &&
      !name.endsWith('Icon') && // Remove duplicate Icon suffix exports
      name[0] === name[0].toUpperCase() && // Icons start with uppercase
      name.length > 1 // Avoid single letter exports
    ) {
      icons.push({
        name,
        component: component as React.ComponentType<{ className?: string; size?: number }>,
        category: categorizeIcon(name)
      });
    }
  }
  
  return icons.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Categorize icons based on their names
 */
const categorizeIcon = (iconName: string): string => {
  const name = iconName.toLowerCase();
  
  if (name.includes('user') || name.includes('person') || name.includes('profile') || name.includes('account')) {
    return 'Users & People';
  }
  if (name.includes('building') || name.includes('office') || name.includes('store') || name.includes('shop') || name.includes('bank') || name.includes('dollar') || name.includes('money') || name.includes('credit') || name.includes('payment')) {
    return 'Business & Finance';
  }
  if (name.includes('phone') || name.includes('mail') || name.includes('message') || name.includes('chat') || name.includes('send') || name.includes('share') || name.includes('link') || name.includes('globe') || name.includes('wifi')) {
    return 'Communication';
  }
  if (name.includes('image') || name.includes('video') || name.includes('music') || name.includes('camera') || name.includes('play') || name.includes('pause') || name.includes('media') || name.includes('film') || name.includes('tv')) {
    return 'Media & Entertainment';
  }
  if (name.includes('file') || name.includes('folder') || name.includes('document') || name.includes('book') || name.includes('bookmark') || name.includes('page') || name.includes('text')) {
    return 'Files & Documents';
  }
  if (name.includes('arrow') || name.includes('navigation') || name.includes('compass') || name.includes('map') || name.includes('location') || name.includes('pin') || name.includes('route')) {
    return 'Navigation & Movement';
  }
  if (name.includes('settings') || name.includes('config') || name.includes('tool') || name.includes('wrench') || name.includes('hammer') || name.includes('gear') || name.includes('cog') || name.includes('edit') || name.includes('pencil')) {
    return 'Settings & Tools';
  }
  if (name.includes('lock') || name.includes('unlock') || name.includes('shield') || name.includes('key') || name.includes('security') || name.includes('alert') || name.includes('warning') || name.includes('danger')) {
    return 'Security & Safety';
  }
  if (name.includes('car') || name.includes('plane') || name.includes('train') || name.includes('bike') || name.includes('bus') || name.includes('transport') || name.includes('travel') || name.includes('vehicle')) {
    return 'Transport & Travel';
  }
  if (name.includes('monitor') || name.includes('computer') || name.includes('laptop') || name.includes('phone') || name.includes('tablet') || name.includes('device') || name.includes('screen') || name.includes('battery') || name.includes('power')) {
    return 'Technology & Devices';
  }
  if (name.includes('shopping') || name.includes('cart') || name.includes('bag') || name.includes('store') || name.includes('purchase') || name.includes('buy')) {
    return 'Shopping & Commerce';
  }
  if (name.includes('sun') || name.includes('moon') || name.includes('cloud') || name.includes('rain') || name.includes('snow') || name.includes('weather') || name.includes('temperature') || name.includes('tree') || name.includes('flower') || name.includes('leaf') || name.includes('nature')) {
    return 'Weather & Nature';
  }
  if (name.includes('coffee') || name.includes('food') || name.includes('drink') || name.includes('restaurant') || name.includes('kitchen') || name.includes('cook') || name.includes('eat')) {
    return 'Food & Dining';
  }
  if (name.includes('game') || name.includes('play') || name.includes('sport') || name.includes('ball') || name.includes('trophy') || name.includes('target') || name.includes('dice') || name.includes('controller')) {
    return 'Gaming & Sports';
  }
  if (name.includes('plus') || name.includes('minus') || name.includes('add') || name.includes('remove') || name.includes('delete') || name.includes('trash') || name.includes('save') || name.includes('download') || name.includes('upload') || name.includes('copy') || name.includes('cut') || name.includes('paste')) {
    return 'Actions & Interface';
  }
  if (name.includes('calendar') || name.includes('clock') || name.includes('time') || name.includes('date') || name.includes('schedule') || name.includes('timer') || name.includes('bell') || name.includes('alarm')) {
    return 'Time & Organization';
  }
  if (name.includes('heart') || name.includes('star') || name.includes('like') || name.includes('favorite') || name.includes('love') || name.includes('smile') || name.includes('happy') || name.includes('sad')) {
    return 'Emotions & General';
  }
  if (name.includes('cat') || name.includes('dog') || name.includes('animal') || name.includes('pet') || name.includes('bird') || name.includes('fish')) {
    return 'Animals & Pets';
  }
  
  return 'General & Misc';
};

export const LucideIconPicker: React.FC<LucideIconPickerProps> = ({
  value,
  onChange,
  placeholder = "Select an icon...",
  disabled = false,
  className = ""
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const allIcons = useMemo(() => {
    try {
      return getAllLucideIcons();
    } catch (error) {
      browserLogger.error('Failed to load Lucide icons', { error });
      return [];
    }
  }, []);

  const { filteredIcons, categories } = useMemo(() => {
    let filtered = allIcons;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = allIcons.filter(icon => 
        icon.name.toLowerCase().includes(search) ||
        icon.category.toLowerCase().includes(search)
      );
    }

    const categoryMap = new Map<string, CategorizedIcon[]>();
    filtered.forEach(icon => {
      if (!categoryMap.has(icon.category)) {
        categoryMap.set(icon.category, []);
      }
      categoryMap.get(icon.category)!.push(icon);
    });

    const sortedCategories = Array.from(categoryMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, icons]) => ({
        name: category,
        icons: icons.sort((a, b) => a.name.localeCompare(b.name))
      }));

    return {
      filteredIcons: filtered,
      categories: sortedCategories
    };
  }, [allIcons, searchTerm]);

  const selectedIcon = value ? allIcons.find(icon => icon.name === value) : null;
  const SelectedIconComponent = selectedIcon?.component;

  const handleIconSelect = (iconName: string) => {
    onChange(iconName);
    setOpen(false);
    setSearchTerm("");
    browserLogger.userAction('icon_selected', `Selected icon: ${iconName}`);
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              {SelectedIconComponent ? (
                <>
                  <SelectedIconComponent className="h-4 w-4" />
                  <span>{selectedIcon?.name}</span>
                </>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <LucideIcons.ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput 
              placeholder="Search icons..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandEmpty>No icons found.</CommandEmpty>
            <CommandList className="max-h-[300px]">
              <ScrollArea className="h-[300px] w-full">
                <div className="p-1">
                  {categories.map((category) => (
                    <CommandGroup key={category.name} heading={
                      <div className="flex items-center justify-between">
                        <span>{category.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {category.icons.length}
                        </Badge>
                      </div>
                    }>
                      <div className="grid grid-cols-6 gap-1 p-2">
                        {category.icons.map((icon) => {
                          const IconComponent = icon.component;
                          return (
                            <CommandItem
                              key={icon.name}
                              value={icon.name}
                              onSelect={() => handleIconSelect(icon.name)}
                              className="flex flex-col items-center justify-center p-2 h-12 cursor-pointer hover:bg-accent rounded-md"
                            >
                              <IconComponent className="h-4 w-4" />
                              <span className="text-xs mt-1 truncate w-full text-center">
                                {icon.name}
                              </span>
                            </CommandItem>
                          );
                        })}
                      </div>
                    </CommandGroup>
                  ))}
                </div>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
