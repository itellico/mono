'use client';

import React, { useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem } from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { LanguageDisplay, getLanguageFlag } from './LanguageDisplay';

interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

interface SearchableLanguageSelectProps {
  languages: SupportedLanguage[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showAllOption?: boolean;
  allOptionLabel?: string;
}

export const SearchableLanguageSelect = function SearchableLanguageSelect({
  languages,
  value,
  onValueChange,
  placeholder = "Select language...",
  className = "",
  showAllOption = true,
  allOptionLabel = "All Languages"
}: SearchableLanguageSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedLanguage = Array.isArray(languages) ? languages.find(lang => lang.code === value) : undefined;
  const isAllSelected = value === '__all__';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isAllSelected ? (
              <span className="text-muted-foreground">{allOptionLabel}</span>
            ) : selectedLanguage ? (
              <>
                <span className="text-lg flex-shrink-0">
                  {getLanguageFlag(selectedLanguage.code)}
                </span>
                <div className="flex flex-col text-left min-w-0">
                  <span className="font-medium truncate">{selectedLanguage.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {selectedLanguage.code.toUpperCase()}
                  </span>
                </div>
                {selectedLanguage.isDefault && (
                  <Badge variant="secondary" className="text-xs ml-auto">
                    Default
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <Command>
          <CommandInput 
            placeholder="Search languages..." 
            className="h-9"
          />
          <CommandEmpty>No language found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {showAllOption && (
              <CommandItem
                value="__all__"
                onSelect={() => {
                  onValueChange('__all__');
                  setOpen(false);
                }}
                className="flex items-center gap-2"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    isAllSelected ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="text-muted-foreground">{allOptionLabel}</span>
              </CommandItem>
            )}

            {Array.isArray(languages) ? languages.map((language) => (
              <CommandItem
                key={language.code}
                value={`${language.name} ${language.nativeName} ${language.code}`}
                onSelect={() => {
                  onValueChange(language.code);
                  setOpen(false);
                }}
                className="flex items-center gap-2"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === language.code ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="text-lg flex-shrink-0">
                  {getLanguageFlag(language.code)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{language.name}</span>
                    {language.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-mono">{language.code.toUpperCase()}</span>
                    {language.nativeName && language.nativeName !== language.name && (
                      <>
                        <span>•</span>
                        <span className="truncate">{language.nativeName}</span>
                      </>
                    )}
                  </div>
                </div>
              </CommandItem>
            )) : []}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 