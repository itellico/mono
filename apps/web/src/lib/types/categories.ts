import { EntityType } from '@/lib/schemas/entities';

/**
 * Category entity with hierarchical structure
 */
export interface Category {
  id: string;
  tenantId: number | null;
  name: string;
  slug: string;
  description?: string | null;
  categoryType: EntityType; // NEW: Entity type classification
  parentId?: string | null;
  level: number;
  path: string;
  sortOrder: number;
  color?: string | null;
  icon?: string | null;
  isSystem: boolean; // Direct system flag from database
  isEffectiveSystem: boolean; // Computed: direct OR inherited from parents
  systemInheritanceSource?: string; // ID of parent that provides system status
  isActive: boolean;
  metadata: Record<string, any> | null;
  createdBy: number;
  updatedBy: number; // Added missing field
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  parent?: Category;
  children?: Category[];
  tags?: Tag[]; // NEW: Category has many tags
  entityCount?: number;
}

/**
 * Tag entity with category assignment and direct classification
 */
export interface Tag {
  id: string;
  tenantId: number;
  name: string;
  slug: string;
  description?: string | null;
  tagCategory: EntityType; // NEW: Direct tag classification
  categoryId?: string | null; // Tag belongs to category
  color?: string | null;
  isSystem: boolean;
  isActive: boolean;
  usageCount: number;
  metadata: Record<string, any> | null;
  createdBy: number;
  updatedBy: number; // Added missing field
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  category?: Category; // Tag belongs to category
}

/**
 * Entity-Category association
 */
export interface EntityCategory {
  id: string;
  categoryId: string;
  entityType: EntityType; // Updated to use EntityType
  entityId: number;
  tenantId: number;
  createdBy: number;
  createdAt: Date;
  
  // Relations
  category: Category;
}

/**
 * Entity-Tag association
 */
export interface EntityTag {
  id: string;
  tagId: string;
  entityType: EntityType; // Updated to use EntityType
  entityId: number;
  tenantId: number;
  createdBy: number;
  createdAt: Date;
  
  // Relations
  tag: Tag;
}

/**
 * Category creation/update DTOs
 */
export interface CreateCategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  categoryType: EntityType; // NEW: Required entity type
  parentId?: string;
  color?: string;
  icon?: string;
  metadata?: Record<string, any>;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  categoryType?: EntityType; // NEW: Update entity type
  parentId?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Tag creation/update DTOs
 */
export interface CreateTagRequest {
  name: string;
  slug?: string;
  description?: string;
  tagCategory: EntityType; // NEW: Required direct tag classification
  categoryId?: string; // Assign tag to category
  color?: string;
  isSystem?: boolean; // NEW: Allow setting system status during creation
  metadata?: Record<string, any>;
}

export interface UpdateTagRequest {
  name?: string;
  slug?: string;
  description?: string;
  tagCategory?: EntityType; // NEW: Update direct tag classification
  categoryId?: string; // Assign tag to category
  color?: string;
  isSystem?: boolean; // NEW: Allow updating system status
  isActive?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Filter interfaces for enhanced search
 */
export interface CategoryFilters {
  tenantId: number;
  categoryType?: EntityType | EntityType[]; // Filter by entity type(s)
  parentId?: string;
  level?: number;
  isSystem?: boolean;
  isActive?: boolean;
  search?: string; // Search in name/description
}

export interface TagFilters {
  tenantId: number;
  tagCategory?: EntityType | EntityType[]; // NEW: Filter by direct tag category
  categoryId?: string | string[]; // Filter by category
  categoryType?: EntityType | EntityType[]; // Filter by category's entity type (derived)
  isSystem?: boolean;
  isActive?: boolean;
  search?: string; // Search in name/description
  minUsageCount?: number; // Filter by popularity
}

/**
 * Enhanced search results with category context
 */
export interface TagSearchResult extends Omit<Tag, 'category'> {
  category?: {
    id: string;
    name: string;
    categoryType: EntityType;
    path: string;
  };
  relevanceScore?: number; // For search ranking
}

export interface CategorySearchResult extends Category {
  tagCount?: number; // Number of tags in this category
  entityCount?: number; // Number of entities in this category
  relevanceScore?: number; // For search ranking
}

/**
 * Bulk operations
 */
export interface BulkCategoryOperation {
  action: 'activate' | 'deactivate' | 'delete' | 'move' | 'changeType';
  categoryIds: string[];
  targetParentId?: string; // For move operation
  targetCategoryType?: EntityType; // For changeType operation
}

export interface BulkTagOperation {
  action: 'activate' | 'deactivate' | 'delete' | 'assignCategory' | 'removeCategory' | 'changeTagCategory';
  tagIds: string[];
  targetCategoryId?: string; // For assignCategory operation
  targetTagCategory?: EntityType; // NEW: For changeTagCategory operation
}

/**
 * Analytics and insights
 */
export interface CategoryAnalytics {
  id: string;
  name: string;
  categoryType: EntityType;
  tagCount: number;
  entityCount: number;
  usageGrowth: number; // Percentage change in usage
  lastUsed?: Date;
  topTags: Array<{
    id: string;
    name: string;
    usageCount: number;
    tagCategory: EntityType; // NEW: Include tag category
  }>;
}

export interface TagAnalytics {
  id: string;
  name: string;
  tagCategory: EntityType; // NEW: Direct tag category
  categoryId?: string;
  categoryName?: string;
  categoryType?: EntityType;
  usageCount: number;
  usageGrowth: number; // Percentage change in usage
  lastUsed?: Date;
  entityTypes: Array<{
    entityType: EntityType;
    count: number;
  }>;
}

export interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  totalTags: number;
  activeTags: number;
  systemCategories: number;
  systemTags: number;
} 