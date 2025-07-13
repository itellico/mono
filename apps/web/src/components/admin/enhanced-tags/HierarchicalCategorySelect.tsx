'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CategoryHierarchy {
  id: string;
  name: string;
  slug: string;
  level: number;
  path: string;
  children?: CategoryHierarchy[];
}

interface HierarchicalCategorySelectProps {
  categories: CategoryHierarchy[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * 🌳 HierarchicalCategorySelect Component
 * 
 * Displays categories in a hierarchical tree structure with proper visual indentation
 * 
 * @param categories - Array of hierarchical categories
 * @param value - Selected category ID
 * @param onValueChange - Callback when selection changes
 * @param placeholder - Placeholder text
 * @param disabled - Whether the select is disabled
 * @example
 * <HierarchicalCategorySelect
 *   categories={categories}
 *   value={selectedCategoryId}
 *   onValueChange={setCategoryId}
 *   placeholder="Select a category"
 * />
 */
export function HierarchicalCategorySelect({
  categories,
  value,
  onValueChange,
  placeholder = "Select a category",
  disabled = false
}: HierarchicalCategorySelectProps) {

  const renderCategoryOption = (category: CategoryHierarchy, level: number = 0): React.ReactNode[] => {
    const indent = "  ".repeat(level); // Two spaces per level
    const prefix = level > 0 ? "└─ " : "";
    const displayName = `${indent}${prefix}${category.name}`;
    
    const items: React.ReactNode[] = [
      <SelectItem key={category.id} value={category.id}>
        <span className="font-mono text-sm">
          {displayName}
          {level > 0 && (
            <span className="text-muted-foreground ml-2">
              (Level {level})
            </span>
          )}
        </span>
      </SelectItem>
    ];

    // Recursively render children
    if (category.children && category.children.length > 0) {
      category.children.forEach(child => {
        items.push(...renderCategoryOption(child, level + 1));
      });
    }

    return items;
  };

  // Handle the "none" value conversion
  const handleValueChange = (newValue: string) => {
    onValueChange(newValue === "none" ? "" : newValue);
  };

  const displayValue = value === "" ? "none" : value;

  return (
    <Select 
      value={displayValue} 
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-80 overflow-y-auto">
        <SelectItem value="none">
          <span className="text-muted-foreground">None (No Category)</span>
        </SelectItem>
        {categories.map(category => renderCategoryOption(category, 0))}
      </SelectContent>
    </Select>
  );
} 