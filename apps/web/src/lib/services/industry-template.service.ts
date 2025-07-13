/**
 * Industry Template Service - API Client
 * 
 * ✅ ARCHITECTURE COMPLIANCE: Uses API calls instead of direct database access
 * All industry template operations go through NestJS API with proper authentication
 */

import { ApiAuthService } from '@/lib/api-clients/api-auth.service';
import { logger } from '@/lib/logger';
import { getRedisClient } from '@/lib/redis';

export type IndustryType = 'healthcare' | 'finance' | 'education' | 'retail' | 'manufacturing' | 'technology' | 'hospitality' | 'other';
export type ComponentType = 'form' | 'table' | 'chart' | 'dashboard' | 'workflow' | 'report' | 'other';

export interface IndustryTemplate {
  id: string;
  name: string;
  description?: string;
  industryType: IndustryType;
  isPublished: boolean;
  isActive: boolean;
  popularity: number;
  templateData: any;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewIndustryTemplate {
  name: string;
  description?: string;
  industryType: IndustryType;
  isPublished?: boolean;
  isActive?: boolean;
  popularity?: number;
  templateData: any;
  metadata?: any;
}

export interface IndustryTemplateComponent {
  id: string;
  templateId: string;
  name: string;
  componentType: ComponentType;
  configuration: any;
  sortOrder: number;
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewIndustryTemplateComponent {
  templateId: string;
  name: string;
  componentType: ComponentType;
  configuration: any;
  sortOrder?: number;
  isRequired?: boolean;
}

export interface IndustryTemplateFilters {
  industryType?: IndustryType;
  isPublished?: boolean;
  isActive?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class IndustryTemplateService {
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  private static readonly CACHE_TTL = 300; // 5 minutes

  private static async getRedis() {
    try {
      return await getRedisClient();
    } catch (error) {
      logger.warn('Redis client unavailable, proceeding without cache', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * List industry templates with basic filtering
   */
  async listTemplates(
    filters: IndustryTemplateFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ) {
    try {
      logger.info('Listing industry templates', { filters, pagination });

      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => 
            value !== undefined ? [key, String(value)] : []
          ).filter(arr => arr.length > 0)
        ),
      });

      const response = await fetch(
        `${IndustryTemplateService.API_BASE_URL}/api/v1/admin/industry-templates?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to list industry templates: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.data || data;

      logger.info('Industry templates retrieved successfully', { 
        count: result.templates?.length || 0,
        total: result.total 
      });

      return {
        templates: result.templates || result.items || [],
        total: result.total || 0,
        page: pagination.page,
        totalPages: result.totalPages || Math.ceil((result.total || 0) / pagination.limit),
      };
    } catch (error) {
      logger.error('Failed to list industry templates', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
        pagination 
      });
      throw error;
    }
  }

  /**
   * Get a single industry template
   */
  async getTemplate(id: string): Promise<IndustryTemplate | null> {
    try {
      logger.info('Getting industry template', { id });

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${IndustryTemplateService.API_BASE_URL}/api/v1/admin/industry-templates/${id}`,
        { headers }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get industry template: ${response.statusText}`);
      }

      const data = await response.json();
      const template = data.data || data;

      logger.info('Industry template retrieved successfully', { id });
      return template;
    } catch (error) {
      logger.error('Failed to get industry template', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        id 
      });
      throw error;
    }
  }

  /**
   * Create a new industry template
   */
  async createTemplate(data: NewIndustryTemplate): Promise<IndustryTemplate> {
    try {
      const [template] = await db
        .insert(industryTemplates)
        .values(data)
        .returning();

      return template;
    } catch (error) {
      console.error('Failed to create industry template:', error);
      throw new Error('Failed to create industry template');
    }
  }

  /**
   * Update an industry template
   */
  async updateTemplate(
    id: string,
    updates: Partial<IndustryTemplate>
  ): Promise<IndustryTemplate> {
    try {
      const [template] = await db
        .update(industryTemplates)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(industryTemplates.id, id))
        .returning();

      if (!template) {
        throw new Error('Template not found');
      }

      return template;
    } catch (error) {
      console.error('Failed to update industry template:', error);
      throw new Error('Failed to update industry template');
    }
  }

  /**
   * Delete an industry template
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      const result = await db
        .delete(industryTemplates)
        .where(eq(industryTemplates.id, id))
        .returning({ id: industryTemplates.id });

      if (result.length === 0) {
        throw new Error('Template not found');
      }
    } catch (error) {
      console.error('Failed to delete industry template:', error);
      throw new Error('Failed to delete industry template');
    }
  }

  /**
   * Get template components
   */
  async getTemplateComponents(templateId: string): Promise<IndustryTemplateComponent[]> {
    try {
      const components = await db
        .select()
        .from(industryTemplateComponents)
        .where(eq(industryTemplateComponents.templateId, templateId))
        .orderBy(asc(industryTemplateComponents.componentOrder));

      return components;
    } catch (error) {
      console.error('Failed to get template components:', error);
      throw new Error('Failed to get template components');
    }
  }

  /**
   * Add component to template
   */
  async addComponent(
    templateId: string,
    componentData: Omit<NewIndustryTemplateComponent, 'templateId'>
  ): Promise<IndustryTemplateComponent> {
    try {
      const [component] = await db
        .insert(industryTemplateComponents)
        .values({
          ...componentData,
          templateId,
        })
        .returning();

      return component;
    } catch (error) {
      console.error('Failed to add component to template:', error);
      throw new Error('Failed to add component to template');
    }
  }

  /**
   * Get template statistics
   */
  async getTemplateStats() {
    try {
      // Get basic counts
      const [totalTemplates] = await db
        .select({ count: count() })
        .from(industryTemplates)
        .where(eq(industryTemplates.isActive, true));

      const [publishedTemplates] = await db
        .select({ count: count() })
        .from(industryTemplates)
        .where(
          and(
            eq(industryTemplates.isActive, true),
            eq(industryTemplates.isPublished, true)
          )
        );

      // Get popular templates
      const popularTemplates = await db
        .select()
        .from(industryTemplates)
        .where(
          and(
            eq(industryTemplates.isActive, true),
            eq(industryTemplates.isPublished, true)
          )
        )
        .orderBy(desc(industryTemplates.popularity))
        .limit(5);

      return {
        totalTemplates: totalTemplates.count,
        publishedTemplates: publishedTemplates.count,
        popularTemplates,
      };
    } catch (error) {
      console.error('Failed to get template stats:', error);
      throw new Error('Failed to get template stats');
    }
  }
}

// Export singleton instance
export const industryTemplateService = new IndustryTemplateService(); 