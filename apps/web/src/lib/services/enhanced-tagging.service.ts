/**
 * Enhanced Multi-Level Tagging Service - API Client
 * 
 * ✅ ARCHITECTURE COMPLIANCE: Uses API calls instead of direct database access
 * All enhanced tagging operations go through NestJS API with proper authentication
 */

import { ApiAuthService } from '@/lib/api-clients/api-auth.service';
import { logger } from '@/lib/logger';

export type EnhancedTagScope = 'platform' | 'tenant' | 'account' | 'user';
export type EnhancedTaggableEntityType = string;

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

export interface EnhancedTag {
  id: string;
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  categoryId?: string;
  scopeLevel: EnhancedTagScope;
  tenantId?: number;
  accountId?: number;
  userId?: number;
  isSystem: boolean;
  isActive: boolean;
  usageCount: number;
  metadata?: any;
  createdBy: number;
  updatedBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

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
  parent?: CategoryHierarchy;
  children?: CategoryHierarchy[];
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

export class EnhancedTaggingService {
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  /**
   * Create a new enhanced tag
   */
  static async createTag(params: CreateTagParams): Promise<EnhancedTag> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/enhanced-tags`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Failed to create enhanced tag: ${response.statusText}`);
      }

      const result = await response.json();
      const newTag = result.data || result;

      logger.info('Enhanced tag created', {
        id: newTag.id,
        name: newTag.name,
        scope: newTag.scopeLevel,
        tenantId: params.context.tenantId
      });

      return newTag;

    } catch (error) {
      logger.error('Failed to create enhanced tag', {
        error: error instanceof Error ? error.message : 'Unknown error',
        params
      });
      throw error;
    }
  }

  /**
   * Update an enhanced tag
   */
  static async updateTag(params: UpdateTagParams): Promise<EnhancedTag> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const { id, ...updateData } = params;
      
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/enhanced-tags/${id}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update enhanced tag: ${response.statusText}`);
      }

      const result = await response.json();
      const updatedTag = result.data || result;

      logger.info('Enhanced tag updated', {
        id: updatedTag.id,
        name: updatedTag.name
      });

      return updatedTag;

    } catch (error) {
      logger.error('Failed to update enhanced tag', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id: params.id
      });
      throw error;
    }
  }

  /**
   * Delete an enhanced tag
   */
  static async deleteTag(id: string, context: TaggingContext): Promise<boolean> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/enhanced-tags/${id}`, {
        method: 'DELETE',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete enhanced tag: ${response.statusText}`);
      }

      logger.info('Enhanced tag deleted', { id });

      return true;

    } catch (error) {
      logger.error('Failed to delete enhanced tag', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw error;
    }
  }

  /**
   * Get enhanced tags by scope
   */
  static async getTagsByScope(
    scope: EnhancedTagScope,
    context: TaggingContext,
    options: {
      includeInactive?: boolean;
      includeSystem?: boolean;
      categoryId?: string;
      search?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<TagWithScope[]> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        scope,
        ...Object.fromEntries(
          Object.entries({ ...context, ...options }).map(([key, value]) => 
            value !== undefined ? [key, String(value)] : []
          ).filter(arr => arr.length > 0)
        ),
      });

      const response = await fetch(
        `${this.API_BASE_URL}/api/v2/admin/enhanced-tags/by-scope?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tags by scope: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;

    } catch (error) {
      logger.error('Failed to fetch tags by scope', {
        error: error instanceof Error ? error.message : 'Unknown error',
        scope,
        context
      });
      throw error;
    }
  }

  /**
   * Get all available enhanced tags for a context
   */
  static async getAvailableTags(
    context: TaggingContext,
    entityType?: EnhancedTaggableEntityType,
    options: {
      includeInactive?: boolean;
      includeSystem?: boolean;
      categoryId?: string;
      search?: string;
    } = {}
  ): Promise<TagWithScope[]> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries({ ...context, entityType, ...options }).map(([key, value]) => 
            value !== undefined ? [key, String(value)] : []
          ).filter(arr => arr.length > 0)
        ),
      });

      const response = await fetch(
        `${this.API_BASE_URL}/api/v2/admin/enhanced-tags/available?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch available tags: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;

    } catch (error) {
      logger.error('Failed to fetch available tags', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
        entityType
      });
      throw error;
    }
  }

  /**
   * Tag an entity
   */
  static async tagEntity(
    entityType: EnhancedTaggableEntityType,
    entityId: string,
    tagIds: string[],
    context: TaggingContext,
    taggedBy: number
  ): Promise<void> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/enhanced-tags/tag-entity`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          entityId,
          tagIds,
          context,
          taggedBy,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to tag entity: ${response.statusText}`);
      }

      logger.info('Entity tagged', {
        entityType,
        entityId,
        tagIds,
        context
      });

    } catch (error) {
      logger.error('Failed to tag entity', {
        error: error instanceof Error ? error.message : 'Unknown error',
        entityType,
        entityId,
        tagIds
      });
      throw error;
    }
  }

  /**
   * Untag an entity
   */
  static async untagEntity(
    entityType: EnhancedTaggableEntityType,
    entityId: string,
    tagIds: string[],
    context: TaggingContext
  ): Promise<void> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/enhanced-tags/untag-entity`, {
        method: 'DELETE',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          entityId,
          tagIds,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to untag entity: ${response.statusText}`);
      }

      logger.info('Entity untagged', {
        entityType,
        entityId,
        tagIds,
        context
      });

    } catch (error) {
      logger.error('Failed to untag entity', {
        error: error instanceof Error ? error.message : 'Unknown error',
        entityType,
        entityId,
        tagIds
      });
      throw error;
    }
  }

  /**
   * Get tags for an entity
   */
  static async getEntityTags(
    entityType: EnhancedTaggableEntityType,
    entityId: string,
    context: TaggingContext
  ): Promise<TagWithScope[]> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        entityType,
        entityId,
        ...Object.fromEntries(
          Object.entries(context).map(([key, value]) => 
            value !== undefined ? [key, String(value)] : []
          ).filter(arr => arr.length > 0)
        ),
      });

      const response = await fetch(
        `${this.API_BASE_URL}/api/v2/admin/enhanced-tags/entity-tags?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch entity tags: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;

    } catch (error) {
      logger.error('Failed to fetch entity tags', {
        error: error instanceof Error ? error.message : 'Unknown error',
        entityType,
        entityId,
        context
      });
      throw error;
    }
  }

  /**
   * Get entities by tag
   */
  static async getEntitiesByTag(
    tagId: string,
    context: TaggingContext,
    options: {
      entityType?: EnhancedTaggableEntityType;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ entityType: string; entityId: string; taggedAt: Date; taggedBy: number }[]> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        tagId,
        ...Object.fromEntries(
          Object.entries({ ...context, ...options }).map(([key, value]) => 
            value !== undefined ? [key, String(value)] : []
          ).filter(arr => arr.length > 0)
        ),
      });

      const response = await fetch(
        `${this.API_BASE_URL}/api/v2/admin/enhanced-tags/entities-by-tag?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch entities by tag: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;

    } catch (error) {
      logger.error('Failed to fetch entities by tag', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tagId,
        context
      });
      throw error;
    }
  }

  /**
   * Search entities by tags
   */
  static async searchEntitiesByTags(
    tagIds: string[],
    entityType: EnhancedTaggableEntityType,
    context: TaggingContext,
    options: {
      matchAll?: boolean; // true = AND, false = OR
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ entityId: string; tags: TagWithScope[]; relevanceScore: number }[]> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/enhanced-tags/search-entities`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tagIds,
          entityType,
          context,
          ...options,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to search entities by tags: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;

    } catch (error) {
      logger.error('Failed to search entities by tags', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tagIds,
        entityType,
        context
      });
      throw error;
    }
  }

  /**
   * Get tag suggestions
   */
  static async getTagSuggestions(
    query: string,
    context: TaggingContext,
    entityType?: EnhancedTaggableEntityType,
    options: {
      limit?: number;
      includeInactive?: boolean;
    } = {}
  ): Promise<TagWithScope[]> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        q: query,
        ...Object.fromEntries(
          Object.entries({ ...context, entityType, ...options }).map(([key, value]) => 
            value !== undefined ? [key, String(value)] : []
          ).filter(arr => arr.length > 0)
        ),
      });

      const response = await fetch(
        `${this.API_BASE_URL}/api/v2/admin/enhanced-tags/suggestions?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tag suggestions: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;

    } catch (error) {
      logger.error('Failed to fetch tag suggestions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
        context
      });
      throw error;
    }
  }

  /**
   * Get tag usage statistics
   */
  static async getTagUsageStats(
    context: TaggingContext,
    options: {
      scope?: EnhancedTagScope;
      entityType?: EnhancedTaggableEntityType;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
    } = {}
  ): Promise<{
    totalTags: number;
    totalUsages: number;
    topTags: { tag: TagWithScope; usageCount: number; entities: string[] }[];
    scopeDistribution: Record<EnhancedTagScope, number>;
    entityTypeDistribution: Record<string, number>;
  }> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries({ ...context, ...options }).map(([key, value]) => 
            value !== undefined ? [key, String(value)] : []
          ).filter(arr => arr.length > 0)
        ),
      });

      const response = await fetch(
        `${this.API_BASE_URL}/api/v2/admin/enhanced-tags/usage-stats?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tag usage stats: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;

    } catch (error) {
      logger.error('Failed to fetch tag usage stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
        options
      });
      throw error;
    }
  }

  /**
   * Bulk tag entities
   */
  static async bulkTagEntities(
    operations: {
      entityType: EnhancedTaggableEntityType;
      entityId: string;
      tagIds: string[];
      operation: 'add' | 'remove' | 'replace';
    }[],
    context: TaggingContext,
    taggedBy: number
  ): Promise<{ successful: number; failed: number; errors: any[] }> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/enhanced-tags/bulk-tag`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operations,
          context,
          taggedBy,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to bulk tag entities: ${response.statusText}`);
      }

      const result = await response.json();
      const bulkResult = result.data || result;

      logger.info('Bulk tagging completed', {
        successful: bulkResult.successful,
        failed: bulkResult.failed,
        operationsCount: operations.length
      });

      return bulkResult;

    } catch (error) {
      logger.error('Failed to bulk tag entities', {
        error: error instanceof Error ? error.message : 'Unknown error',
        operationsCount: operations.length
      });
      throw error;
    }
  }

  /**
   * Get tag by ID
   */
  static async getTagById(id: string, context: TaggingContext): Promise<TagWithScope | null> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(context).map(([key, value]) => 
            value !== undefined ? [key, String(value)] : []
          ).filter(arr => arr.length > 0)
        ),
      });

      const response = await fetch(
        `${this.API_BASE_URL}/api/v2/admin/enhanced-tags/${id}?${queryParams}`,
        { headers }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch tag: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;

    } catch (error) {
      logger.error('Failed to fetch tag by ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        context
      });
      throw error;
    }
  }

  /**
   * Validate tagging operation
   */
  static async validateTaggingOperation(
    entityType: EnhancedTaggableEntityType,
    entityId: string,
    tagIds: string[],
    context: TaggingContext
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    allowedTags: string[];
    restrictedTags: string[];
  }> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v2/admin/enhanced-tags/validate`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          entityId,
          tagIds,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to validate tagging operation: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;

    } catch (error) {
      logger.error('Failed to validate tagging operation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        entityType,
        entityId,
        tagIds
      });
      throw error;
    }
  }
}

// Export singleton instance
export const enhancedTaggingService = new EnhancedTaggingService();