'use client';

import React from 'react';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';

interface CategoryHierarchy {
  id: string;
  name: string;
  slug: string;
  level: number;
  path: string;
  children?: CategoryHierarchy[];
}

interface SearchableHierarchicalCategorySelectProps {
  categories: CategoryHierarchy[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  includeNone?: boolean;
}

/**
 * 🔍 SearchableHierarchicalCategorySelect Component
 * 
 * Displays categories in a hierarchical tree structure with search functionality.
 * Combines the visual hierarchy of the original component with the search capabilities
 * of the Combobox component.
 * 
 * @param categories - Array of hierarchical categories
 * @param value - Selected category ID
 * @param onValueChange - Callback when selection changes
 * @param placeholder - Placeholder text
 * @param disabled - Whether the select is disabled
 * @param includeNone - Whether to include a "None" option
 * @example
 * <SearchableHierarchicalCategorySelect
 *   categories={categories}
 *   value={selectedCategoryId}
 *   onValueChange={setCategoryId}
 *   placeholder="Search categories..."
 *   includeNone={true}
 * />
 */
export function SearchableHierarchicalCategorySelect({
  categories,
  value,
  onValueChange,
  placeholder = "Search categories...",
  disabled = false,
  includeNone = true
}: SearchableHierarchicalCategorySelectProps) {

  // Flatten categories into ComboboxOptions with hierarchical display
  const flattenCategories = (categories: CategoryHierarchy[], level: number = 0): ComboboxOption[] => {
    const options: ComboboxOption[] = [];
    
    categories.forEach(category => {
      const indent = "  ".repeat(level); // Two spaces per level
      const prefix = level > 0 ? "└─ " : "";
      const displayName = `${indent}${prefix}${category.name}`;
      
      // Create search terms including name, slug, path, and parent context
      const searchTerms = [
        category.name,
        category.slug,
        category.path,
        // Include parent names for better search
        ...category.path.split(' > ').filter(Boolean)
      ].join(' ');
      
      options.push({
        value: category.id,
        label: displayName,
        searchTerms
      });

      // Recursively add children
      if (category.children && category.children.length > 0) {
        options.push(...flattenCategories(category.children, level + 1));
      }
    });

    return options;
  };

  // Prepare options
  const categoryOptions = flattenCategories(categories);
  
  // Add "None" option if requested
  const allOptions: ComboboxOption[] = includeNone 
    ? [
        {
          value: 'none',
          label: 'None (No Category)',
          searchTerms: 'none no category uncategorized'
        },
        ...categoryOptions
      ]
    : categoryOptions;

  // Handle value changes
  const handleValueChange = (newValue: string) => {
    // Convert "none" back to empty string for consistency with existing code
    onValueChange(newValue === "none" ? "" : newValue);
  };

  // Convert empty string to "none" for display
  const displayValue = value === "" ? "none" : value;

  return (
    <Combobox
      options={allOptions}
      value={displayValue}
      onValueChange={handleValueChange}
      placeholder={placeholder}
      searchPlaceholder="Search categories..."
      emptyMessage="No categories found."
      disabled={disabled}
      className="font-mono text-sm"
    />
  );
} 