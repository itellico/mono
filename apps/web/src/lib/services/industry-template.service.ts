/**
 * Industry Template Service
 * Simplified service for managing industry templates
 */

import { eq, and, desc, asc, count, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { 
  industryTemplates,
  industryTemplateComponents,
  type IndustryTemplate,
  type NewIndustryTemplate,
  type IndustryTemplateComponent,
  type NewIndustryTemplateComponent,
  type IndustryType,
  type ComponentType
} from '@/lib/schemas';

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
  /**
   * List industry templates with basic filtering
   */
  async listTemplates(
    filters: IndustryTemplateFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ) {
    try {
      // Build query conditions
      const conditions = [];
      
      if (filters.industryType) {
        conditions.push(eq(industryTemplates.industryType, filters.industryType));
      }
      
      if (filters.isPublished !== undefined) {
        conditions.push(eq(industryTemplates.isPublished, filters.isPublished));
      }
      
      if (filters.isActive !== undefined) {
        conditions.push(eq(industryTemplates.isActive, filters.isActive));
      }
      
      if (filters.search) {
        conditions.push(
          sql`${industryTemplates.name} ILIKE ${`%${filters.search}%`}`
        );
      }

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(industryTemplates)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = totalResult.count;
      const totalPages = Math.ceil(total / pagination.limit);
      const offset = (pagination.page - 1) * pagination.limit;

      // Get templates
      const templates = await db
        .select()
        .from(industryTemplates)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(industryTemplates.popularity))
        .limit(pagination.limit)
        .offset(offset);

      return {
        templates,
        total,
        page: pagination.page,
        totalPages,
      };
    } catch (error) {
      console.error('Failed to list industry templates:', error);
      throw new Error('Failed to list industry templates');
    }
  }

  /**
   * Get a single industry template
   */
  async getTemplate(id: string): Promise<IndustryTemplate | null> {
    try {
      const [template] = await db
        .select()
        .from(industryTemplates)
        .where(eq(industryTemplates.id, id))
        .limit(1);

      return template || null;
    } catch (error) {
      console.error('Failed to get industry template:', error);
      throw new Error('Failed to get industry template');
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