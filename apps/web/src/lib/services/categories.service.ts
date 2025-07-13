/**
 * Categories Service - Standards-compliant implementation
 * 
 * Following itellico Mono architecture:
 * - Drizzle ORM queries (no raw SQL)
 * - Enhanced permission system integration
 * - Redis caching with proper TTL
 * - Tenant isolation
 * - Proper error handling and logging
 */

import { db as prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getRedisClient } from '@/lib/redis';
import { EntityType } from '@/lib/schemas/entities';
import type {
  Category,
  Tag,
  CategoryStats,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateTagRequest,
  UpdateTagRequest
} from '@/lib/types/categories';

// Prisma-specific imports
import { Prisma } from '@prisma/client';

// Drizzle-specific imports (to be removed after full migration)


export class CategoriesService {
  private static readonly CACHE_TTL = 300; // 5 minutes
  private static readonly CACHE_PREFIX = 'categories:';

  /**
   * Get all categories and tags with statistics
   */
  static async getCategoriesAndTags(
    tenantId: number,
    userId: number,
    options: {
      includeInactive?: boolean;
      includeSystem?: boolean;
    } = {}
  ): Promise<{
    categories: Category[];
    tags: Tag[];
    stats: CategoryStats;
  }> {
    const { includeInactive = false, includeSystem = true } = options;

    // Basic authentication check
    if (!userId) {
      throw new Error('Authentication required');
    }

    const cacheKey = `${this.CACHE_PREFIX}${tenantId}:${includeInactive}:${includeSystem}`;

    // Try cache first
    try {
      const redis = await getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Categories cache hit', { tenantId, cacheKey });
        return JSON.parse(cached);
      }
    } catch (redisError) {
      logger.warn('Redis unavailable for categories cache', {
        error: redisError instanceof Error ? redisError.message : String(redisError)
      });
    }

    try {
      // Build category filters for Prisma
      const categoryWhere: Prisma.CategoryWhereInput = {
        tenantId: tenantId,
      };
      if (!includeInactive) {
        categoryWhere.isActive = true;
      }
      if (!includeSystem) {
        categoryWhere.isSystem = false;
      }

      // Build tag filters for Prisma
      const tagWhere: Prisma.TagWhereInput = {
        tenantId: tenantId,
      };
      if (!includeInactive) {
        tagWhere.isActive = true;
      }
      if (!includeSystem) {
        tagWhere.isSystem = false;
      }

      // Fetch categories with entity counts using Prisma
      const categoriesWithCounts = await prisma.category.findMany({
        where: categoryWhere,
        include: {
          _count: {
            select: {
              entityCategories: true,
            },
          },
        },
        orderBy: [
          { level: 'asc' },
          { sortOrder: 'asc' },
          { name: 'asc' },
        ],
      });

      // Fetch tags using Prisma
      const tagsData = await prisma.tag.findMany({
        where: tagWhere,
        orderBy: [
          { usageCount: 'desc' },
          { name: 'asc' },
        ],
      });

      // Calculate statistics
      const stats = await this.calculateStats(tenantId);

      // Build hierarchical structure with system inheritance
      const categoriesWithInheritance = this.computeSystemInheritance(
        categoriesWithCounts.map(item => ({
          ...item.category,
          categoryType: item.category.categoryType || 'system' as EntityType, // Handle null values
          entityCount: item.entityCount
        }))
      );
      
      const hierarchicalCategories = this.buildCategoryHierarchy(categoriesWithInheritance);

      const result = {
        categories: hierarchicalCategories,
        tags: tagsData.map(tag => ({
          ...tag,
          tagCategory: tag.tagCategory || 'system' as EntityType, // Handle null values
        })) as Tag[],
        stats
      };

      // Cache the result
      try {
        const redis = await getRedisClient();
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
        logger.debug('Categories cached', { tenantId, cacheKey });
      } catch (redisError) {
        logger.warn('Failed to cache categories', {
          error: redisError instanceof Error ? redisError.message : String(redisError)
        });
      }

      return result;

    } catch (error) {
      logger.error('Failed to fetch categories and tags', {
        tenantId,
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to fetch categories and tags');
    }
  }

  /**
   * Create a new category
   */
  static async createCategory(
    tenantId: number,
    userId: number,
    data: CreateCategoryRequest
  ): Promise<Category> {
    try {
      // Generate slug if not provided
      const slug = data.slug || this.generateSlug(data.name);

      // Calculate level and path
      let level = 0;
      let path = slug;
      
      if (data.parentId) {
        const parent = await prisma.category.findFirst({
          where: {
            id: data.parentId,
            tenantId: tenantId,
          },
        });

        if (!parent) {
          throw new Error('Parent category not found');
        }

        level = parent.level + 1;
        path = `${parent.path}/${slug}`;
      }

      // Get next sort order
      const maxSortOrder = await prisma.category.aggregate({
        _max: {
          sortOrder: true,
        },
        where: {
          tenantId: tenantId,
          parentId: data.parentId || null,
        },
      });

      const sortOrder = (maxSortOrder._max.sortOrder || 0) + 1;

      // Create category
      const newCategory = await prisma.category.create({
        data: {
          tenantId,
          name: data.name,
          slug,
          description: data.description,
          categoryType: data.categoryType,
          parentId: data.parentId,
          level,
          path,
          sortOrder,
          color: data.color,
          icon: data.icon,
          metadata: data.metadata || Prisma.JsonNull,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Invalidate cache
      await this.invalidateCache(tenantId);

      logger.info('Category created', {
        categoryId: newCategory.id,
        tenantId,
        userId,
        name: data.name
      });

      return newCategory as Category;

    } catch (error) {
      logger.error('Failed to create category', {
        tenantId,
        userId,
        data,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Update a category
   */
  static async updateCategory(
    categoryId: string,
    tenantId: number,
    userId: number,
    data: UpdateCategoryRequest,
    userRole?: string // Add optional user role parameter
  ): Promise<Category> {
    try {
      // Check if category exists and belongs to tenant
      const existingCategory = await prisma.category.findFirst({
        where: {
          id: categoryId,
          tenantId: tenantId,
        },
      });

      if (!existingCategory) {
        throw new Error('Category not found');
      }

      // God Mode protection for system categories
      if (existingCategory.isSystem) {
        // Import the validation function dynamically to avoid circular imports
        const { validateGodModePermission } = await import('@/lib/hooks/useGodModeProtection');
        
        // Create a session-like object for validation
        const sessionLike = {
          user: {
            role: userRole,
            id: userId
          }
        };
        
        const godModeCheck = await validateGodModePermission(sessionLike, 'edit', true);
        if (!godModeCheck.canEditSystemEntity) {
          throw new Error(godModeCheck.error || 'God Mode required to edit system categories');
        }
      }

      // Build validated update data - only include allowed fields
      const updateData: any = {
        updatedAt: new Date()
      };

      // Update name if provided
      if (data.name !== undefined) {
        updateData.name = data.name;
      }

      // Update description if provided
      if (data.description !== undefined) {
        updateData.description = data.description;
      }

      // Update color if provided
      if (data.color !== undefined) {
        updateData.color = data.color;
      }

      // Update icon if provided
      if (data.icon !== undefined) {
        updateData.icon = data.icon;
      }

      // Update isActive if provided
      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
      }

      // Update metadata if provided
      if (data.metadata !== undefined) {
        updateData.metadata = data.metadata;
      }

      // Update categoryType if provided
      if (data.categoryType !== undefined) {
        updateData.categoryType = data.categoryType;
      }

      // Handle slug and path calculation
      let newSlug = existingCategory[0].slug;
      if (data.slug !== undefined) {
        newSlug = data.slug;
        updateData.slug = newSlug;
      } else if (data.name && data.name !== existingCategory[0].name) {
        // Auto-generate slug if name changed but slug not provided
        newSlug = this.generateSlug(data.name);
        updateData.slug = newSlug;
      }

      // Check for duplicate slug BEFORE database operation
      if (updateData.slug && updateData.slug !== existingCategory.slug) {
        const duplicateSlug = await prisma.category.findFirst({
          where: {
            slug: updateData.slug,
            tenantId: tenantId,
            NOT: {
              id: categoryId,
            },
          },
        });

        if (duplicateSlug) {
          throw new Error(`Category with slug "${updateData.slug}" already exists`);
        }
      }

      // Recalculate path if slug changed or parentId changed
      if (data.parentId !== undefined || (updateData.slug && updateData.slug !== existingCategory.slug)) {
        const parentId = data.parentId !== undefined ? data.parentId : existingCategory.parentId;
        updateData.parentId = parentId;
        
        if (parentId) {
          // Get parent category to build path
          const parentCategory = await prisma.category.findFirst({
            where: {
              id: parentId,
              tenantId: tenantId,
            },
          });

          if (!parentCategory) {
            throw new Error('Parent category not found');
          }

          // Check for circular reference
          if (parentId === categoryId) {
            throw new Error('Cannot set category as its own parent');
          }

          // Build new path: parent.path + '/' + slug
          const newPath = `${parentCategory.path}/${newSlug}`;
          updateData.path = newPath;
          updateData.level = parentCategory.level + 1;

          // Check for duplicate path
          const duplicatePath = await prisma.category.findFirst({
            where: {
              path: newPath,
              tenantId: tenantId,
              NOT: {
                id: categoryId,
              },
            },
          });

          if (duplicatePath) {
            throw new Error(`Category path "${newPath}" already exists`);
          }
        } else {
          // Root category: path = slug
          updateData.path = newSlug;
          updateData.level = 0;
        }
      }

      // Update category
      const updatedCategory = await prisma.category.update({
        where: {
          id: categoryId,
          tenantId: tenantId,
        },
        data: updateData,
      });

      if (!updatedCategory) {
        throw new Error('Failed to update category');
      }

      // If path changed, update child categories recursively
      if (updateData.path && updateData.path !== existingCategory.path) {
        await this.updateChildPaths(categoryId, updateData.path, tenantId);
      }

      // Invalidate cache
      await this.invalidateCache(tenantId);

      logger.info('Category updated', {
        categoryId,
        tenantId,
        userId,
        changes: Object.keys(data)
      });

      return updatedCategory as Category;

    } catch (error) {
      logger.error('Failed to update category', {
        categoryId,
        tenantId,
        userId,
        data,
        error: error instanceof Error ? error.message : String(error)
      });

      // Enhanced error handling for database constraints
      if (error instanceof Error) {
        // Handle PostgreSQL constraint violations
        if (error.message.includes('duplicate key value') || error.message.includes('unique constraint')) {
          if (error.message.includes('slug')) {
            throw new Error(`Category with this slug already exists`);
          }
          if (error.message.includes('path')) {
            throw new Error(`Category path already exists`);
          }
          if (error.message.includes('name')) {
            throw new Error(`Category with this name already exists in the same level`);
          }
          throw new Error('Category already exists with these values');
        }

        // Handle foreign key constraint violations
        if (error.message.includes('foreign key constraint') || error.message.includes('violates foreign key')) {
          if (error.message.includes('parent')) {
            throw new Error('Parent category not found or invalid');
          }
          throw new Error('Invalid reference to related data');
        }

        // Handle check constraint violations
        if (error.message.includes('check constraint')) {
          throw new Error('Invalid category data - please check all fields');
        }
      }

      throw error;
    }
  }

  /**
   * Update child category paths recursively when parent path changes
   */
  private static async updateChildPaths(
    parentId: string,
    newParentPath: string,
    tenantId: number
  ): Promise<void> {
    try {
      // Get all direct children
      const children = await prisma.category.findMany({
        where: {
          parentId: parentId,
          tenantId: tenantId,
        },
      });

      for (const child of children) {
        // Calculate new path for child
        const newChildPath = `${newParentPath}/${child.slug}`;
        
        // Update child path
        await prisma.category.update({
          where: {
            id: child.id,
          },
          data: {
            path: newChildPath,
            updatedAt: new Date(),
          },
        });

        // Recursively update grandchildren
        await this.updateChildPaths(child.id, newChildPath, tenantId);
      }
    } catch (error) {
      logger.error('Failed to update child paths', {
        parentId,
        newParentPath,
        tenantId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Delete a category with options for handling child categories
   */
  static async deleteCategory(
    categoryId: string,
    tenantId: number,
    userId: number,
    options: {
      cascadeDelete?: boolean; // If true, delete all child categories
      moveChildrenToParent?: boolean; // If true, move children to parent category
    } = {}
  ): Promise<void> {
    try {
      // Check if category exists and belongs to tenant
      const existingCategory = await prisma.category.findFirst({
        where: {
          id: categoryId,
          tenantId: tenantId,
        },
      });

      if (!existingCategory) {
        throw new Error('Category not found');
      }

      // God Mode protection for system categories
      if (existingCategory.isSystem) {
        // Import the validation function dynamically to avoid circular imports
        const { validateGodModePermission } = await import('@/lib/hooks/useGodModeProtection');
        
        // Create a session-like object for validation (we don't have userRole here, so use 'user')
        const sessionLike = {
          user: {
            role: 'user', // Default role, will be checked against super_admin in validation
            id: userId
          }
        };
        
        const godModeCheck = await validateGodModePermission(sessionLike, 'delete', true);
        if (!godModeCheck.canDeleteSystemEntity) {
          throw new Error(godModeCheck.error || 'God Mode required to delete system categories');
        }
      }

      // Check for child categories
      const childCategories = await prisma.category.findMany({
        where: {
          parentId: categoryId,
        },
      });

      if (childCategories.length > 0) {
        if (options.cascadeDelete) {
          // Delete all child categories recursively
          logger.info('Cascade deleting child categories', {
            parentId: categoryId,
            childCount: childCategories.length,
            childNames: childCategories.map(c => c.name)
          });
          
          for (const child of childCategories) {
            await this.deleteCategory(child.id, tenantId, userId, { cascadeDelete: true });
          }
        } else if (options.moveChildrenToParent) {
          // Move children to the parent's parent
          const newParentId = existingCategory.parentId;
          logger.info('Moving child categories to parent', {
            categoryId,
            childCount: childCategories.length,
            newParentId
          });
          
          for (const child of childCategories) {
            // Calculate new level and path based on new parent
            const newLevel = newParentId ? existingCategory.level : 0;
            let newPath: string;
            
            if (newParentId) {
              // Get the parent's path and append child slug
              const parentPath = existingCategory.path.split('/').slice(0, -1).join('/');
              newPath = parentPath ? `${parentPath}/${child.slug}` : child.slug;
            } else {
              // Moving to root level
              newPath = child.slug;
            }
            
            await prisma.category.update({
              where: { id: child.id },
              data: { 
                parentId: newParentId,
                level: newLevel,
                path: newPath,
                updatedAt: new Date()
              }
            });
              
            // Recursively update all descendants of this child
            await this.updateChildPaths(child.id, newPath, tenantId);
          }
        } else {
          // Default behavior - prevent deletion
          const childNames = childCategories.map(c => c.name).join(', ');
          const childCount = childCategories.length;
          throw new Error(
            `Cannot delete "${existingCategory.name}" because it has ${childCount} child categor${childCount === 1 ? 'y' : 'ies'}: ${childNames}. ` +
            `Please choose to either delete all children (cascade) or move them to the parent category.`
          );
        }
      }

      // Delete category (cascading will handle entity associations)
      await prisma.category.delete({
        where: {
          id: categoryId,
          tenantId: tenantId,
        },
      });

      // Invalidate cache
      await this.invalidateCache(tenantId);

      logger.info('Category deleted', {
        categoryId,
        tenantId,
        userId,
        name: existingCategory[0].name,
        hadChildren: childCategories.length > 0,
        cascadeDelete: options.cascadeDelete,
        moveChildrenToParent: options.moveChildrenToParent
      });

    } catch (error) {
      logger.error('Failed to delete category', {
        categoryId,
        tenantId,
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Create a new tag
   */
  static async createTag(
    tenantId: number,
    userId: number,
    data: CreateTagRequest
  ): Promise<Tag> {
    try {
      // Generate slug if not provided
      const slug = data.slug || this.generateSlug(data.name);

      // Create tag
      const newTag = await prisma.tag.create({
        data: {
          tenantId,
          name: data.name,
          slug,
          description: data.description,
          tagCategory: data.tagCategory,
          categoryId: data.categoryId,
          color: data.color,
          isSystem: data.isSystem,
          metadata: data.metadata || Prisma.JsonNull,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Invalidate cache
      await this.invalidateCache(tenantId);

      logger.info('Tag created', {
        tagId: newTag.id,
        tenantId,
        userId,
        name: data.name
      });

      return newTag as Tag;

    } catch (error) {
      logger.error('Failed to create tag', {
        tenantId,
        userId,
        data,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Update a tag
   */
  static async updateTag(
    tagId: string,
    tenantId: number,
    userId: number,
    data: UpdateTagRequest
  ): Promise<Tag> {
    try {
      // Check if tag exists and belongs to tenant
      const existingTag = await prisma.tag.findFirst({
        where: {
          id: tagId,
          tenantId: tenantId,
        },
      });

      if (!existingTag) {
        throw new Error('Tag not found');
      }

      // God Mode protection for system tags
      if (existingTag.isSystem) {
        // Import the validation function dynamically to avoid circular imports
        const { validateGodModePermission } = await import('@/lib/hooks/useGodModeProtection');
        
        // Create a session-like object for validation
        const sessionLike = {
          user: {
            role: 'user', // Default role, will be checked against super_admin in validation
            id: userId
          }
        };
        
        const godModeCheck = await validateGodModePermission(sessionLike, 'edit', true);
        if (!godModeCheck.canEditSystemEntity) {
          throw new Error(godModeCheck.error || 'God Mode required to edit system tags');
        }
      }

      // Build update data
      const updateData: any = {
        ...data,
        updatedAt: new Date(),
        updatedBy: userId
      };

      // Generate new slug if name changed
      if (data.name && data.name !== existingTag.name) {
        updateData.slug = data.slug || this.generateSlug(data.name);
      }

      // Update tag
      const updatedTag = await prisma.tag.update({
        where: {
          id: tagId,
          tenantId: tenantId,
        },
        data: updateData,
      });

      // Invalidate cache
      await this.invalidateCache(tenantId);

      logger.info('Tag updated', {
        tagId,
        tenantId,
        userId,
        changes: Object.keys(data)
      });

      return updatedTag[0] as Tag;

    } catch (error) {
      logger.error('Failed to update tag', {
        tagId,
        tenantId,
        userId,
        data,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get categories by entity type - for populating category dropdowns in tag creation
   */
  static async getCategoriesByType(
    tenantId: number,
    entityType?: EntityType,
    options: {
      includeInactive?: boolean;
      parentId?: string;
    } = {}
  ): Promise<Category[]> {
    const { includeInactive = false, parentId } = options;

    try {
      // Build filters
      const where: Prisma.CategoryWhereInput = {
        tenantId: tenantId,
      };

      if (entityType) {
        where.categoryType = entityType;
      }

      if (!includeInactive) {
        where.isActive = true;
      }

      if (parentId !== undefined) {
        where.parentId = parentId || null;
      }

      const result = await prisma.category.findMany({
        where,
        orderBy: [
          { level: 'asc' },
          { sortOrder: 'asc' },
          { name: 'asc' },
        ],
      });

      return result as Category[];

    } catch (error) {
      logger.error('Failed to get categories by type', {
        tenantId,
        entityType,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get tags with category information - for enhanced search
   */
  static async getTagsWithCategories(
    tenantId: number,
    filters: {
      tagCategory?: EntityType; // NEW: Filter by direct tag category
      categoryId?: string;
      categoryType?: EntityType;
      search?: string;
      includeInactive?: boolean;
    } = {}
  ): Promise<Array<Tag & { category?: Category }>> {
    const { tagCategory, categoryId, categoryType, search, includeInactive = false } = filters;

    try {
      const where: Prisma.TagWhereInput = {
        tenantId: tenantId,
      };
      
      if (!includeInactive) {
        where.isActive = true;
      }
      
      if (tagCategory) {
        where.tagCategory = tagCategory;
      }
      
      if (categoryId) {
        where.categoryId = categoryId;
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const result = await prisma.tag.findMany({
        where,
        include: {
          category: categoryType ? { where: { categoryType: categoryType } } : false,
        },
        orderBy: [
          { usageCount: 'desc' },
          { name: 'asc' },
        ],
      });

      return result.map(row => ({
        ...row,
        tagCategory: row.tagCategory || 'system' as EntityType, // Handle null values
        category: row.category || undefined
      })) as Array<Tag & { category?: Category }>;

    } catch (error) {
      logger.error('Failed to get tags with categories', {
        tenantId,
        filters,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get tags by tag category - optimized for direct tag category filtering
   */
  static async getTagsByCategory(
    tenantId: number,
    tagCategory?: EntityType,
    options: {
      includeInactive?: boolean;
      search?: string;
      limit?: number;
    } = {}
  ): Promise<Tag[]> {
    const { includeInactive = false, search, limit } = options;

    try {
      // Build filters
      const filters = [eq(tags.tenantId, tenantId)];
      
      if (tagCategory) {
        filters.push(eq(tags.tagCategory, tagCategory));
      }
      
      if (!includeInactive) {
        filters.push(eq(tags.isActive, true));
      }
      
      if (search) {
        filters.push(
          sql`(${tags.name} ILIKE ${`%${search}%`} OR ${tags.description} ILIKE ${`%${search}%`})`
        );
      }

      const query = db
        .select()
        .from(tags)
        .where(and(...filters))
        .orderBy(desc(tags.usageCount), asc(tags.name));

      const result = limit 
        ? await query.limit(limit)
        : await query;

      return result.map(tag => ({
        ...tag,
        tagCategory: tag.tagCategory || 'system' as EntityType, // Handle null values
      })) as Tag[];

    } catch (error) {
      logger.error('Failed to get tags by category', {
        tenantId,
        tagCategory,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Delete a tag
   */
  static async deleteTag(
    tagId: string,
    tenantId: number,
    userId: number
  ): Promise<void> {
    try {
      // Check if tag exists and belongs to tenant
      const existingTag = await db
        .select()
        .from(tags)
        .where(and(
          eq(tags.id, tagId),
          eq(tags.tenantId, tenantId)
        ))
        .limit(1);

      if (existingTag.length === 0) {
        throw new Error('Tag not found');
      }

      // God Mode protection for system tags
      if (existingTag.isSystem) {
        // Import the validation function dynamically to avoid circular imports
        const { validateGodModePermission } = await import('@/lib/hooks/useGodModeProtection');
        
        // Create a session-like object for validation
        const sessionLike = {
          user: {
            role: 'user', // Default role, will be checked against super_admin in validation
            id: userId
          }
        };
        
        const godModeCheck = await validateGodModePermission(sessionLike, 'delete', true);
        if (!godModeCheck.canDeleteSystemEntity) {
          throw new Error(godModeCheck.error || 'God Mode required to delete system tags');
        }
      }

      // Delete tag (cascading will handle entity associations)
      await db
        .delete(tags)
        .where(and(
          eq(tags.id, tagId),
          eq(tags.tenantId, tenantId)
        ));

      // Invalidate cache
      await this.invalidateCache(tenantId);

      logger.info('Tag deleted', {
        tagId,
        tenantId,
        userId,
        name: existingTag[0].name
      });

    } catch (error) {
      logger.error('Failed to delete tag', {
        tagId,
        tenantId,
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Calculate statistics for categories and tags
   */
  private static async calculateStats(tenantId: number): Promise<CategoryStats> {
    const [totalCategoriesResult, activeCategoriesResult, systemCategoriesResult, totalTagsResult, activeTagsResult, systemTagsResult] = await Promise.all([
      prisma.category.aggregate({
        _count: {
          id: true,
        },
        where: {
          tenantId: tenantId,
        },
      }),
      prisma.category.aggregate({
        _count: {
          id: true,
        },
        where: {
          tenantId: tenantId,
          isActive: true,
        },
      }),
      prisma.category.aggregate({
        _count: {
          id: true,
        },
        where: {
          tenantId: tenantId,
          isSystem: true,
        },
      }),
      prisma.tag.aggregate({
        _count: {
          id: true,
        },
        where: {
          tenantId: tenantId,
        },
      }),
      prisma.tag.aggregate({
        _count: {
          id: true,
        },
        where: {
          tenantId: tenantId,
          isActive: true,
        },
      }),
      prisma.tag.aggregate({
        _count: {
          id: true,
        },
        where: {
          tenantId: tenantId,
          isSystem: true,
        },
      }),
    ]);

    return {
      totalCategories: totalCategoriesResult._count.id || 0,
      activeCategories: activeCategoriesResult._count.id || 0,
      systemCategories: systemCategoriesResult._count.id || 0,
      totalTags: totalTagsResult._count.id || 0,
      activeTags: activeTagsResult._count.id || 0,
      systemTags: systemTagsResult._count.id || 0
    };
  }

  /**
   * Build hierarchical category structure
   */
  private static buildCategoryHierarchy(flatCategories: Category[]): Category[] {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // First pass: create map and initialize children arrays
    for (const category of flatCategories) {
      categoryMap.set(category.id, { ...category, children: [] });
    }

    // Second pass: build hierarchy
    for (const category of flatCategories) {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children!.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    }

    return rootCategories;
  }

  /**
   * Compute effective system status with inheritance
   */
  private static computeSystemInheritance(categories: Category[]): Category[] {
    // Create a map for quick parent lookup
    const categoryMap = new Map<string, Category>();
    categories.forEach(cat => categoryMap.set(cat.id, cat));

    // Function to check if a category or any of its parents is system
    const getEffectiveSystemStatus = (category: Category): { isEffective: boolean; source?: string } => {
      // If directly system, return true
      if (category.isSystem) {
        return { isEffective: true, source: category.id };
      }

      // Check parent hierarchy
      let currentCategory = category;
      while (currentCategory.parentId) {
        const parent = categoryMap.get(currentCategory.parentId);
        if (!parent) break;
        
        if (parent.isSystem) {
          return { isEffective: true, source: parent.id };
        }
        
        currentCategory = parent;
      }

      return { isEffective: false };
    };

    // Compute inheritance for all categories
    return categories.map(category => {
      const { isEffective, source } = getEffectiveSystemStatus(category);
      return {
        ...category,
        isEffectiveSystem: isEffective,
        systemInheritanceSource: source
      };
    });
  }

  /**
   * Generate URL-friendly slug from name
   */
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Invalidate cache for tenant
   */
  private static async invalidateCache(tenantId: number): Promise<void> {
    try {
      const redis = await getRedisClient();
      const pattern = `${this.CACHE_PREFIX}${tenantId}:*`;
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug('Categories cache invalidated', { tenantId, keysCount: keys.length });
      }
    } catch (error) {
      logger.warn('Failed to invalidate categories cache', {
        tenantId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
