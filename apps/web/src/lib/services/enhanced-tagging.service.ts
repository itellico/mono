/**
 * Enhanced Multi-Level Tagging Service for itellico Mono
 * 
 * This service demonstrates the multi-level tagging system concept
 * supporting Platform → Tenant → Account → User scope hierarchy
 */

import { eq, and, or, sql, inArray, isNull, desc, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { 
  enhancedTags, 
  enhancedEntityTags, 
  type EnhancedTag, 
  type EnhancedTagScope, 
  type EnhancedTaggableEntityType 
} from '@/lib/schemas';
import { categories } from '@/lib/schemas';
import { logger } from '@/lib/logger';

export interface TaggingContext {
  tenantId?: number;
  accountId?: number;
  userId?: number;
  userRole?: string;
}

export interface CreateTagParams {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  categoryId?: string;
  scope: EnhancedTagScope;
  context: TaggingContext;
  createdBy: number;
}

export interface UpdateTagParams {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
  icon?: string;
  categoryId?: string;
  scopeLevel?: string;
  isSystem?: boolean;
  isActive?: boolean;
  context: TaggingContext;
  updatedBy: number;
}

/**
 * Entity Type Registry - Defines which entities can be tagged and their allowed scopes
 */
export const ENHANCED_TAGGABLE_ENTITIES = {
  // User & Account Entities
  'user_profile': { scopes: ['tenant', 'account', 'user'] as EnhancedTagScope[] },
  'account': { scopes: ['tenant'] as EnhancedTagScope[] },
  
  // Content & Configuration
  'model_schema': { scopes: ['platform', 'tenant'] as EnhancedTagScope[] },
  'option_set': { scopes: ['platform', 'tenant'] as EnhancedTagScope[] },
  'email_template': { scopes: ['platform', 'tenant'] as EnhancedTagScope[] },
  'industry_template': { scopes: ['platform', 'tenant'] as EnhancedTagScope[] },
  'form': { scopes: ['tenant', 'account'] as EnhancedTagScope[] },
  'zone': { scopes: ['tenant', 'account'] as EnhancedTagScope[] },
  'module': { scopes: ['platform', 'tenant'] as EnhancedTagScope[] },
  
  // System & Workflow
  'translation': { scopes: ['platform', 'tenant'] as EnhancedTagScope[] },
  'subscription': { scopes: ['tenant'] as EnhancedTagScope[] },
  'workflow': { scopes: ['tenant', 'account'] as EnhancedTagScope[] },
  
  // Marketplace
  'job_posting': { scopes: ['tenant', 'account'] as EnhancedTagScope[] },
  'application': { scopes: ['account', 'user'] as EnhancedTagScope[] },
  
  // Analytics & Reporting
  'report': { scopes: ['tenant', 'account'] as EnhancedTagScope[] },
  'dashboard': { scopes: ['tenant', 'account', 'user'] as EnhancedTagScope[] }
} as const;

export interface TagWithScope extends EnhancedTag {
  scopeLevel: EnhancedTagScope;
  category?: {
    id: string;
    name: string;
    slug: string;
    path: string;
  } | null;
}

export interface CategoryHierarchy {
  id: string;
  name: string;
  slug: string;
  path: string;
  level: number;
  parentId: string | null;
  children?: CategoryHierarchy[];
}

export class EnhancedTaggingService {
  
  /**
   * Get available categories for dropdown selection
   */
  async getAvailableCategories(context: TaggingContext): Promise<CategoryHierarchy[]> {
    try {
      if (!context.tenantId) {
        return [];
      }

      const categoryList = await db.select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        path: categories.path,
        level: categories.level,
        parentId: categories.parentId,
        sortOrder: categories.sortOrder
      })
      .from(categories)
      .where(
        and(
          eq(categories.tenantId, context.tenantId),
          eq(categories.isActive, true)
        )
      )
      .orderBy(asc(categories.level), asc(categories.sortOrder), asc(categories.name));

      // Build hierarchy
      const categoryMap = new Map<string, CategoryHierarchy>();
      const rootCategories: CategoryHierarchy[] = [];

      // First pass: create all category objects
      categoryList.forEach(cat => {
        categoryMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          path: cat.path,
          level: cat.level,
          parentId: cat.parentId,
          children: []
        });
      });

      // Second pass: build hierarchy
      categoryList.forEach(cat => {
        const categoryObj = categoryMap.get(cat.id)!;
        if (cat.parentId && categoryMap.has(cat.parentId)) {
          const parent = categoryMap.get(cat.parentId)!;
          parent.children = parent.children || [];
          parent.children.push(categoryObj);
        } else {
          rootCategories.push(categoryObj);
        }
      });

      return rootCategories;
      
    } catch (error) {
      logger.error('Failed to get available categories', { error, context });
      throw new Error('Failed to retrieve categories');
    }
  }

  /**
   * Get available tags with scope awareness and category information
   */
  async getAvailableTags(
    context: TaggingContext, 
    entityType?: EnhancedTaggableEntityType
  ): Promise<TagWithScope[]> {
    try {
      const conditions = [];
      
      // Platform tags (accessible to everyone)
      conditions.push(eq(enhancedTags.scopeLevel, 'platform'));
      
      // Configuration tags (super admin only)
      if (context.userRole === 'super_admin') {
        conditions.push(eq(enhancedTags.scopeLevel, 'configuration'));
      }
      
      // Tenant-level tags
      if (context.tenantId) {
        conditions.push(
          and(
            eq(enhancedTags.scopeLevel, 'tenant'),
            eq(enhancedTags.tenantId, context.tenantId)
          )
        );
      }
      
      // Account-level tags
      if (context.accountId) {
        conditions.push(
          and(
            eq(enhancedTags.scopeLevel, 'account'),
            eq(enhancedTags.accountId, context.accountId)
          )
        );
      }
      
      // User-level tags
      if (context.userId) {
        conditions.push(
          and(
            eq(enhancedTags.scopeLevel, 'user'),
            eq(enhancedTags.userId, context.userId)
          )
        );
      }
      
      if (conditions.length === 0) {
        return [];
      }
      
      const results = await db.select({
        id: enhancedTags.id,
        name: enhancedTags.name,
        slug: enhancedTags.slug,
        description: enhancedTags.description,
        color: enhancedTags.color,
        icon: enhancedTags.icon,
        categoryId: enhancedTags.categoryId,
        scopeLevel: enhancedTags.scopeLevel,
        tenantId: enhancedTags.tenantId,
        accountId: enhancedTags.accountId,
        userId: enhancedTags.userId,
        isSystem: enhancedTags.isSystem,
        isActive: enhancedTags.isActive,
        usageCount: enhancedTags.usageCount,
        metadata: enhancedTags.metadata,
        createdBy: enhancedTags.createdBy,
        updatedBy: enhancedTags.updatedBy,
        createdAt: enhancedTags.createdAt,
        updatedAt: enhancedTags.updatedAt,
        // Category information
        categoryName: categories.name,
        categorySlug: categories.slug,
        categoryPath: categories.path
      })
      .from(enhancedTags)
      .leftJoin(categories, eq(enhancedTags.categoryId, categories.id))
      .where(
        and(
          or(...conditions),
          eq(enhancedTags.isActive, true)
        )
      )
      .orderBy(desc(enhancedTags.usageCount), asc(enhancedTags.name));
      
      return results.map(tag => ({
        ...tag,
        scopeLevel: tag.scopeLevel as EnhancedTagScope,
        category: tag.categoryName ? {
          id: tag.categoryId!,
          name: tag.categoryName,
          slug: tag.categorySlug!,
          path: tag.categoryPath!
        } : null
      }));
      
    } catch (error) {
      logger.error('Failed to get available enhanced tags', { error, context, entityType });
      throw new Error('Failed to retrieve enhanced tags');
    }
  }
  
  /**
   * Tag an entity with proper scope validation
   */
  async tagEntity(params: {
    tagId: string;
    entityType: EnhancedTaggableEntityType;
    entityId: string;
    context: TaggingContext;
    createdBy: number;
  }): Promise<void> {
    try {
      logger.info('Tagging entity with enhanced tag', params);
      
      // Validate entity type is taggable
      const entityConfig = ENHANCED_TAGGABLE_ENTITIES[params.entityType];
      if (!entityConfig) {
        throw new Error(`Entity type ${params.entityType} is not taggable`);
      }
      
      // Get tag and validate it exists and is active
      const tag = await db.select().from(enhancedTags).where(eq(enhancedTags.id, params.tagId)).limit(1);
      if (!tag.length || !tag[0].isActive) {
        throw new Error('Tag not found or inactive');
      }
      
      // Validate scope access
      const hasAccess = await this.validateTagAccess(tag[0], params.context);
      if (!hasAccess) {
        throw new Error('Insufficient permissions to use this tag');
      }
      
      // Check if tag is already applied to this entity
      const existingTag = await db.select()
        .from(enhancedEntityTags)
        .where(
          and(
            eq(enhancedEntityTags.tagId, params.tagId),
            eq(enhancedEntityTags.entityType, params.entityType),
            eq(enhancedEntityTags.entityId, params.entityId)
          )
        )
        .limit(1);
        
      if (existingTag.length > 0) {
        throw new Error('Tag already applied to this entity');
      }
      
      // Create tag association in transaction
      await db.transaction(async (tx) => {
        // Create the tag association
        await tx.insert(enhancedEntityTags).values({
          tagId: params.tagId,
          entityType: params.entityType,
          entityId: params.entityId,
          tenantId: params.context.tenantId!,
          accountId: params.context.accountId,
          createdBy: params.createdBy,
        });
        
        // Update usage count
        await tx.update(enhancedTags)
          .set({ 
            usageCount: sql`${enhancedTags.usageCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(enhancedTags.id, params.tagId));
      });
      
      logger.info('Entity tagged successfully with enhanced tag', params);
      
    } catch (error) {
      logger.error('Failed to tag entity with enhanced tag', { error, params });
      throw error;
    }
  }
  
  /**
   * Remove a tag from an entity
   */
  async untagEntity(params: {
    tagId: string;
    entityType: EnhancedTaggableEntityType;
    entityId: string;
    context: TaggingContext;
  }): Promise<void> {
    try {
      logger.info('Untagging entity', params);
      
      // Remove tag association in transaction
      await db.transaction(async (tx) => {
        // Remove the tag association
        const result = await tx.delete(enhancedEntityTags)
          .where(
            and(
              eq(enhancedEntityTags.tagId, params.tagId),
              eq(enhancedEntityTags.entityType, params.entityType),
              eq(enhancedEntityTags.entityId, params.entityId),
              eq(enhancedEntityTags.tenantId, params.context.tenantId!)
            )
          );
        
        // Update usage count if tag was removed
        if (result.rowCount && result.rowCount > 0) {
          await tx.update(enhancedTags)
            .set({ 
              usageCount: sql`GREATEST(${enhancedTags.usageCount} - 1, 0)`,
              updatedAt: new Date()
            })
            .where(eq(enhancedTags.id, params.tagId));
        }
      });
      
      logger.info('Entity untagged successfully', params);
      
    } catch (error) {
      logger.error('Failed to untag entity', { error, params });
      throw error;
    }
  }
  
  /**
   * Get tags associated with a specific entity
   */
  async getEntityTags(
    entityType: EnhancedTaggableEntityType,
    entityId: string,
    context: TaggingContext
  ): Promise<TagWithScope[]> {
    try {
      if (!context.tenantId) {
        return [];
      }
      
      const entityTagList = await db.select({
        id: enhancedTags.id,
        name: enhancedTags.name,
        slug: enhancedTags.slug,
        description: enhancedTags.description,
        color: enhancedTags.color,
        icon: enhancedTags.icon,
        categoryId: enhancedTags.categoryId,
        scopeLevel: enhancedTags.scopeLevel,
        tenantId: enhancedTags.tenantId,
        accountId: enhancedTags.accountId,
        userId: enhancedTags.userId,
        isSystem: enhancedTags.isSystem,
        isActive: enhancedTags.isActive,
        usageCount: enhancedTags.usageCount,
        metadata: enhancedTags.metadata,
        createdBy: enhancedTags.createdBy,
        updatedBy: enhancedTags.updatedBy,
        createdAt: enhancedTags.createdAt,
        updatedAt: enhancedTags.updatedAt,
        taggedAt: enhancedEntityTags.createdAt,
        // Category information
        categoryName: categories.name,
        categorySlug: categories.slug,
        categoryPath: categories.path
      })
      .from(enhancedTags)
      .innerJoin(enhancedEntityTags, eq(enhancedTags.id, enhancedEntityTags.tagId))
      .leftJoin(categories, eq(enhancedTags.categoryId, categories.id))
      .where(
        and(
          eq(enhancedEntityTags.entityType, entityType),
          eq(enhancedEntityTags.entityId, entityId),
          eq(enhancedEntityTags.tenantId, context.tenantId!),
          eq(enhancedTags.isActive, true)
        )
      )
      .orderBy(enhancedTags.name);
      
      return entityTagList.map(tag => ({
        ...tag,
        scopeLevel: tag.scopeLevel as EnhancedTagScope,
        category: tag.categoryName ? {
          id: tag.categoryId!,
          name: tag.categoryName,
          slug: tag.categorySlug!,
          path: tag.categoryPath!
        } : null
      }));
      
    } catch (error) {
      logger.error('Failed to get entity enhanced tags', { error, entityType, entityId, context });
      throw new Error('Failed to retrieve entity tags');
    }
  }
  
  /**
   * Create a new enhanced tag
   */
  async createTag(params: CreateTagParams): Promise<string> {
    try {
      // Validate permissions
      if (!this.canCreateTagAtScope(params.scope, params.context)) {
        throw new Error(`Insufficient permissions to create ${params.scope} level tag`);
      }
      
      // Determine scope-specific IDs
      let tenantId: number | null = null;
      let accountId: number | null = null;
      let userId: number | null = null;
      
      switch (params.scope) {
        case 'platform':
        case 'configuration':
          // Platform and configuration tags have no tenant/account/user constraints
          break;
        case 'tenant':
          tenantId = params.context.tenantId!;
          break;
        case 'account':
          tenantId = params.context.tenantId!;
          accountId = params.context.accountId!;
          break;
        case 'user':
          tenantId = params.context.tenantId!;
          accountId = params.context.accountId!;
          userId = params.context.userId!;
          break;
      }
      
      const [newTag] = await db.insert(enhancedTags).values({
        name: params.name,
        slug: params.slug,
        description: params.description,
        color: params.color,
        icon: params.icon,
        categoryId: params.categoryId,
        scopeLevel: params.scope,
        tenantId: tenantId,
        accountId: accountId,
        userId: userId,
        isSystem: false,
        isActive: true,
        usageCount: 0,
        createdBy: params.createdBy,
        updatedBy: params.createdBy,
      }).returning({ id: enhancedTags.id });
      
      logger.info('Enhanced tag created successfully', { tagId: newTag.id, params });
      return newTag.id;
      
    } catch (error) {
      logger.error('Failed to create enhanced tag', { error, params });
      throw error;
    }
  }
  
  /**
   * Update an enhanced tag
   */
  async updateTag(params: UpdateTagParams): Promise<void> {
    try {
      // Get existing tag to check permissions
      const [existingTag] = await db.select()
        .from(enhancedTags)
        .where(eq(enhancedTags.id, params.id))
        .limit(1);

      if (!existingTag) {
        throw new Error('Tag not found');
      }

      // Validate access
      if (!await this.validateTagAccess(existingTag, params.context)) {
        throw new Error('Insufficient permissions to update this tag');
      }

      // Prevent editing system tags unless super admin
      if (existingTag.isSystem && params.context.userRole !== 'super_admin') {
        throw new Error('System tags can only be edited by super administrators');
      }

      const updateData: Partial<typeof enhancedTags.$inferInsert> = {
        updatedBy: params.updatedBy,
        updatedAt: new Date()
      };

      if (params.name !== undefined) updateData.name = params.name;
      if (params.slug !== undefined) updateData.slug = params.slug;
      if (params.description !== undefined) updateData.description = params.description;
      if (params.color !== undefined) updateData.color = params.color;
      if (params.icon !== undefined) updateData.icon = params.icon;
      if (params.categoryId !== undefined) updateData.categoryId = params.categoryId;
      if (params.isActive !== undefined) updateData.isActive = params.isActive;
      
      // Only super admin can change scope level
      if (params.scopeLevel !== undefined && params.context.userRole === 'super_admin') {
        updateData.scopeLevel = params.scopeLevel as EnhancedTagScope;
      }
      
      // Only super admin can change system flag
      if (params.isSystem !== undefined && params.context.userRole === 'super_admin') {
        updateData.isSystem = params.isSystem;
      }

      await db.update(enhancedTags)
        .set(updateData)
        .where(eq(enhancedTags.id, params.id));

      logger.info('Enhanced tag updated successfully', { tagId: params.id, updateData });
      
    } catch (error) {
      logger.error('Failed to update enhanced tag', { error, params });
      throw error;
    }
  }
  
  /**
   * Delete an enhanced tag
   */
  async deleteTag(tagId: string, context: TaggingContext): Promise<void> {
    try {
      // Get existing tag to check permissions
      const [existingTag] = await db.select()
        .from(enhancedTags)
        .where(eq(enhancedTags.id, tagId))
        .limit(1);

      if (!existingTag) {
        throw new Error('Tag not found');
      }

      // Validate access
      if (!await this.validateTagAccess(existingTag, context)) {
        throw new Error('Insufficient permissions to delete this tag');
      }

      // Prevent deleting system tags unless super admin
      if (existingTag.isSystem && context.userRole !== 'super_admin') {
        throw new Error('System tags can only be deleted by super administrators');
      }

      // Check if tag is in use
      if (existingTag.usageCount > 0) {
        throw new Error('Cannot delete tag that is currently in use');
      }

      await db.delete(enhancedTags)
        .where(eq(enhancedTags.id, tagId));

      logger.info('Enhanced tag deleted successfully', { tagId });
      
    } catch (error) {
      logger.error('Failed to delete enhanced tag', { error, tagId, context });
      throw error;
    }
  }
  
  /**
   * Get tag usage statistics by scope
   */
  async getTagStatsByScope(context: TaggingContext): Promise<{
    platform: number;
    tenant: number;
    account: number;
    user: number;
    configuration: number;
    total: number;
  }> {
    try {
      const conditions = [];
      
      // Platform tags
      if (this.hasPlatformAccess(context)) {
        conditions.push(eq(enhancedTags.scopeLevel, 'platform'));
      }
      
      // Configuration tags (super admin only)
      if (context.userRole === 'super_admin') {
        conditions.push(eq(enhancedTags.scopeLevel, 'configuration'));
      }
      
      // Tenant tags
      if (context.tenantId) {
        conditions.push(
          and(
            eq(enhancedTags.scopeLevel, 'tenant'),
            eq(enhancedTags.tenantId, context.tenantId)
          )
        );
      }
      
      // Account tags
      if (context.accountId) {
        conditions.push(
          and(
            eq(enhancedTags.scopeLevel, 'account'),
            eq(enhancedTags.accountId, context.accountId)
          )
        );
      }
      
      // User tags
      if (context.userId) {
        conditions.push(
          and(
            eq(enhancedTags.scopeLevel, 'user'),
            eq(enhancedTags.userId, context.userId)
          )
        );
      }
      
      if (conditions.length === 0) {
        return { platform: 0, tenant: 0, account: 0, user: 0, configuration: 0, total: 0 };
      }
      
      const [stats] = await db.select({
        platform: sql<number>`COUNT(*) FILTER (WHERE scope_level = 'platform')`,
        tenant: sql<number>`COUNT(*) FILTER (WHERE scope_level = 'tenant')`,
        account: sql<number>`COUNT(*) FILTER (WHERE scope_level = 'account')`,
        user: sql<number>`COUNT(*) FILTER (WHERE scope_level = 'user')`,
        configuration: sql<number>`COUNT(*) FILTER (WHERE scope_level = 'configuration')`,
        total: sql<number>`COUNT(*)`,
      })
      .from(enhancedTags)
      .where(
        and(
          or(...conditions),
          eq(enhancedTags.isActive, true)
        )
      );
      
      return stats;
      
    } catch (error) {
      logger.error('Failed to get enhanced tag stats', { error, context });
      throw new Error('Failed to retrieve tag statistics');
    }
  }
  
  /**
   * Search entities by tags with scope awareness
   */
  async searchEntitiesByTags(params: {
    tagIds: string[];
    entityType: EnhancedTaggableEntityType;
    context: TaggingContext;
    matchAll?: boolean;
  }): Promise<string[]> {
    try {
      if (params.tagIds.length === 0) {
        return [];
      }
      
      let results;
      
      if (params.matchAll) {
        // For AND logic, group by entityId and count distinct tags
        results = await db.select({
          entityId: enhancedEntityTags.entityId
        })
        .from(enhancedEntityTags)
        .where(
          and(
            inArray(enhancedEntityTags.tagId, params.tagIds),
            eq(enhancedEntityTags.entityType, params.entityType),
            eq(enhancedEntityTags.tenantId, params.context.tenantId!)
          )
        )
        .groupBy(enhancedEntityTags.entityId)
        .having(sql`COUNT(DISTINCT ${enhancedEntityTags.tagId}) = ${params.tagIds.length}`);
      } else {
        // For OR logic, just get all matching entities
        results = await db.select({
          entityId: enhancedEntityTags.entityId
        })
        .from(enhancedEntityTags)
        .where(
          and(
            inArray(enhancedEntityTags.tagId, params.tagIds),
            eq(enhancedEntityTags.entityType, params.entityType),
            eq(enhancedEntityTags.tenantId, params.context.tenantId!)
          )
        );
      }
      return results.map(r => r.entityId);
      
    } catch (error) {
      logger.error('Failed to search entities by enhanced tags', { error, params });
      throw new Error('Failed to search entities by tags');
    }
  }
  
  /**
   * Private helper methods
   */
  
  private hasPlatformAccess(context: TaggingContext): boolean {
    return context.userRole === 'super_admin' || context.userRole === 'platform_admin';
  }
  
  private async validateTagAccess(tag: EnhancedTag, context: TaggingContext): Promise<boolean> {
    switch (tag.scopeLevel) {
      case 'platform':
        return true; // Platform tags are accessible to everyone
        
      case 'configuration':
        return context.userRole === 'super_admin'; // Configuration tags only for super admin
        
      case 'tenant':
        return tag.tenantId === context.tenantId;
        
      case 'account':
        return tag.tenantId === context.tenantId && 
               tag.accountId === context.accountId;
               
      case 'user':
        return tag.tenantId === context.tenantId && 
               tag.accountId === context.accountId && 
               tag.userId === context.userId;
               
      default:
        return false;
    }
  }
  
  private canCreateTagAtScope(scope: EnhancedTagScope, context: TaggingContext): boolean {
    switch (scope) {
      case 'platform':
        return this.hasPlatformAccess(context);
      case 'configuration':
        return context.userRole === 'super_admin';
      case 'tenant':
        return !!context.tenantId && (
          context.userRole === 'tenant_admin' || 
          this.hasPlatformAccess(context)
        );
      case 'account':
        return !!context.accountId && !!context.tenantId;
      case 'user':
        return !!context.userId && !!context.accountId && !!context.tenantId;
      default:
        return false;
    }
  }
}

// Export singleton instance
export const enhancedTaggingService = new EnhancedTaggingService(); 