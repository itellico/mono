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
        `${IndustryTemplateService.API_BASE_URL}/api/v2/admin/industry-templates?${queryParams}`,
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
        `${IndustryTemplateService.API_BASE_URL}/api/v2/admin/industry-templates/${id}`,
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
      logger.info('Creating industry template', { name: data.name, industryType: data.industryType });

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${IndustryTemplateService.API_BASE_URL}/api/v2/admin/industry-templates`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create industry template: ${response.statusText}`);
      }

      const result = await response.json();
      const template = result.data || result;

      logger.info('Industry template created successfully', { 
        id: template.id, 
        name: data.name 
      });

      return template;
    } catch (error) {
      logger.error('Failed to create industry template', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        data 
      });
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
      logger.info('Updating industry template', { id, updates: Object.keys(updates) });

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${IndustryTemplateService.API_BASE_URL}/api/v2/admin/industry-templates/${id}`,
        {
          method: 'PUT',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (response.status === 404) {
        throw new Error('Template not found');
      }

      if (!response.ok) {
        throw new Error(`Failed to update industry template: ${response.statusText}`);
      }

      const result = await response.json();
      const template = result.data || result;

      logger.info('Industry template updated successfully', { id });

      return template;
    } catch (error) {
      logger.error('Failed to update industry template', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        id,
        updates 
      });
      throw new Error('Failed to update industry template');
    }
  }

  /**
   * Delete an industry template
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      logger.info('Deleting industry template', { id });

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${IndustryTemplateService.API_BASE_URL}/api/v2/admin/industry-templates/${id}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (response.status === 404) {
        throw new Error('Template not found');
      }

      if (!response.ok) {
        throw new Error(`Failed to delete industry template: ${response.statusText}`);
      }

      logger.info('Industry template deleted successfully', { id });
    } catch (error) {
      logger.error('Failed to delete industry template', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        id 
      });
      throw new Error('Failed to delete industry template');
    }
  }

  /**
   * Get template components
   */
  async getTemplateComponents(templateId: string): Promise<IndustryTemplateComponent[]> {
    try {
      logger.info('Getting template components', { templateId });

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${IndustryTemplateService.API_BASE_URL}/api/v2/admin/industry-templates/${templateId}/components`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to get template components: ${response.statusText}`);
      }

      const data = await response.json();
      const components = data.data || data;

      logger.info('Template components retrieved successfully', { 
        templateId, 
        count: components.length 
      });

      return components;
    } catch (error) {
      logger.error('Failed to get template components', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId 
      });
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
      logger.info('Adding component to template', { templateId, componentName: componentData.name });

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${IndustryTemplateService.API_BASE_URL}/api/v2/admin/industry-templates/${templateId}/components`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(componentData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add component to template: ${response.statusText}`);
      }

      const result = await response.json();
      const component = result.data || result;

      logger.info('Component added to template successfully', { 
        templateId, 
        componentId: component.id,
        componentName: componentData.name 
      });

      return component;
    } catch (error) {
      logger.error('Failed to add component to template', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId,
        componentData 
      });
      throw new Error('Failed to add component to template');
    }
  }

  /**
   * Get template statistics
   */
  async getTemplateStats() {
    try {
      logger.info('Getting template statistics');

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${IndustryTemplateService.API_BASE_URL}/api/v2/admin/industry-templates/stats`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to get template stats: ${response.statusText}`);
      }

      const data = await response.json();
      const stats = data.data || data;

      logger.info('Template statistics retrieved successfully', { 
        totalTemplates: stats.totalTemplates,
        publishedTemplates: stats.publishedTemplates 
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get template stats', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to get template stats');
    }
  }
}

// Export singleton instance
export const industryTemplateService = new IndustryTemplateService(); 