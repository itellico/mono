// ============================
// CATEGORIES & TAGS TYPES
// ============================
// 
// This file exports Prisma types for categories and tags

import type { 
  Category as PrismaCategory,
  Tag as PrismaTag,
  CategoryTag as PrismaCategoryTag
} from '@prisma/client';

// Re-export Prisma types with our naming convention
export type Category = PrismaCategory;
export type Tag = PrismaTag;
export type CategoryTag = PrismaCategoryTag;

// Create types for inserts (without auto-generated fields)
export type NewCategory = Omit<Category, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>;
export type NewTag = Omit<Tag, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>;
export type NewCategoryTag = CategoryTag; // No auto-generated fields

// Export the centralized Prisma client
export { db as prisma } from '@/lib/db';

// Legacy exports for backward compatibility
// These will be removed in a future version
export const categories = 'DEPRECATED: Use prisma.category instead';
export const tags = 'DEPRECATED: Use prisma.tag instead';
export const categoryTags = 'DEPRECATED: Use prisma.categoryTag instead'; 