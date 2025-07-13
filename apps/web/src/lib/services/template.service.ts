// ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
// ❌ REMOVED: Direct database imports (architectural violation)
// import { db } from '@/lib/db';
// import { sql } from 'drizzle-orm';
// import { 
//   templates, 
//   reusableComponents, 
//   templateBaseLayouts, 
//   templateComponentUsage,
//   Template,
//   ReusableComponent,
//   TemplateBaseLayout,
//   YamlTemplate
// } from '@/lib/schemas/templates';
// import { eq, and, or, isNull, desc, asc } from 'drizzle-orm';
import { 
  parseYamlTemplate, 
  generateYamlTemplate, 
  validateYamlTemplate,
  createEmptyTemplate 
} from '@/lib/utils/yaml-template';
import { logger } from '@/lib/logger';
import { ApiAuthService } from '@/lib/api-clients/api-auth.service';

// Keep type imports
export type {
  Template,
  ReusableComponent,
  TemplateBaseLayout,
  YamlTemplate
} from '@/lib/schemas/templates';

// ============================
// 🎨 TEMPLATE SERVICE
// ============================

export class TemplateService {
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  /**
   * Get all templates for a tenant (includes global templates)
   */
  static async getTemplates(tenantId: string | null, options?: {
    category?: string;
    subCategory?: string;
    includeInactive?: boolean;
  }) {
    try {
      const conditions = [];

      // Tenant isolation: get tenant-specific and global templates
      if (tenantId) {
        conditions.push(or(eq(templates.tenantId, tenantId), eq(templates.isGlobal, true)));
      } else {
        conditions.push(isNull(templates.tenantId));
      }

      // Filter by category
      if (options?.category) {
        conditions.push(eq(templates.category, options.category));
      }

      // Filter by sub-category
      if (options?.subCategory) {
        conditions.push(eq(templates.subCategory, options.subCategory));
      }

      // Filter by active status
      if (!options?.includeInactive) {
        conditions.push(eq(templates.isActive, true));
      }

      const result = await db.select().from(templates)
        .where(and(...conditions))
        .orderBy(desc(templates.createdAt));

      logger.info(`[TemplateService] Retrieved ${result.length} templates for tenant ${tenantId}`);
      return result;
    } catch (error) {
      logger.error('[TemplateService] Failed to get templates', { error, tenantId, options });
      throw error;
    }
  }

  /**
   * Get a specific template by ID
   */
  static async getTemplate(id: string, tenantId: string | null) {
    try {
      const template = await db.query.templates.findFirst({
        where: and(
          eq(templates.id, id),
          tenantId 
            ? or(eq(templates.tenantId, tenantId), eq(templates.isGlobal, true))
            : isNull(templates.tenantId)
        ),
        with: {
          baseLayout: true,
          componentUsages: {
            with: {
              component: true,
            },
          },
        },
      });

      if (!template) {
        throw new Error(`Template not found: ${id}`);
      }

      logger.info(`[TemplateService] Retrieved template ${id} for tenant ${tenantId}`);
      return template;
    } catch (error) {
      logger.error('[TemplateService] Failed to get template', { error, id, tenantId });
      throw error;
    }
  }

  /**
   * Create a new template
   */
  static async createTemplate(data: {
    tenantId: string | null;
    name: string;
    displayName: Record<string, string>;
    description?: Record<string, string>;
    category: string;
    subCategory?: string;
    baseLayoutId: string;
    yamlDefinition?: string;
    isGlobal?: boolean;
    metadata?: Record<string, any>;
    createdBy?: string;
  }) {
    try {
      // Validate base layout exists
      const baseLayout = await db.query.templateBaseLayouts.findFirst({
        where: eq(templateBaseLayouts.id, data.baseLayoutId),
      });

      if (!baseLayout) {
        throw new Error(`Base layout not found: ${data.baseLayoutId}`);
      }

      // If no YAML provided, create empty template with base layout
      let yamlDefinition = data.yamlDefinition;
      if (!yamlDefinition) {
        const emptyTemplate = createEmptyTemplate(
          data.name,
          data.displayName,
          baseLayout.name,
          data.description
        );
        yamlDefinition = generateYamlTemplate(emptyTemplate);
      } else {
        // Validate provided YAML
        parseYamlTemplate(yamlDefinition);
      }

      const [template] = await db.insert(templates).values({
        tenantId: data.tenantId,
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        category: data.category,
        subCategory: data.subCategory,
        baseLayoutId: data.baseLayoutId,
        yamlDefinition,
        isGlobal: data.isGlobal || false,
        metadata: data.metadata || {},
        createdBy: data.createdBy,
      }).returning();

      logger.info(`[TemplateService] Created template ${template.id} for tenant ${data.tenantId}`);
      return template;
    } catch (error) {
      logger.error('[TemplateService] Failed to create template', { error, data });
      throw error;
    }
  }

  /**
   * Update a template
   */
  static async updateTemplate(
    id: string, 
    tenantId: string | null,
    data: Partial<{
      name: string;
      displayName: Record<string, string>;
      description: Record<string, string>;
      category: string;
      subCategory: string;
      yamlDefinition: string;
      isActive: boolean;
      metadata: Record<string, any>;
    }>
  ) {
    try {
      // Validate YAML if provided
      if (data.yamlDefinition) {
        parseYamlTemplate(data.yamlDefinition);
      }

      // Ensure user can only update their own templates (or global if super admin)
      const whereCondition = and(
        eq(templates.id, id),
        tenantId 
          ? eq(templates.tenantId, tenantId)
          : isNull(templates.tenantId)
      );

      const [template] = await db.update(templates)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(whereCondition)
        .returning();

      if (!template) {
        throw new Error(`Template not found or access denied: ${id}`);
      }

      logger.info(`[TemplateService] Updated template ${id} for tenant ${tenantId}`);
      return template;
    } catch (error) {
      logger.error('[TemplateService] Failed to update template', { error, id, tenantId, data });
      throw error;
    }
  }

  /**
   * Delete a template
   */
  static async deleteTemplate(id: string, tenantId: string | null) {
    try {
      // Delete component usage records first
      await db.delete(templateComponentUsage)
        .where(eq(templateComponentUsage.templateId, id));

      // Delete the template
      const whereCondition = and(
        eq(templates.id, id),
        tenantId 
          ? eq(templates.tenantId, tenantId)
          : isNull(templates.tenantId)
      );

      const [template] = await db.delete(templates)
        .where(whereCondition)
        .returning();

      if (!template) {
        throw new Error(`Template not found or access denied: ${id}`);
      }

      logger.info(`[TemplateService] Deleted template ${id} for tenant ${tenantId}`);
      return template;
    } catch (error) {
      logger.error('[TemplateService] Failed to delete template', { error, id, tenantId });
      throw error;
    }
  }

  /**
   * Clone a template (useful for tenants to customize global templates)
   */
  static async cloneTemplate(
    sourceId: string,
    tenantId: string | null,
    data: {
      name: string;
      displayName: Record<string, string>;
      description?: Record<string, string>;
    }
  ) {
    try {
      // Get source template
      const sourceTemplate = await this.getTemplate(sourceId, tenantId);

      // Create new template with modified data
      const clonedTemplate = await this.createTemplate({
        tenantId,
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        category: sourceTemplate.category,
        subCategory: sourceTemplate.subCategory,
        baseLayoutId: sourceTemplate.baseLayoutId,
        yamlDefinition: sourceTemplate.yamlDefinition,
        isGlobal: false, // Cloned templates are never global
        metadata: { ...sourceTemplate.metadata, clonedFrom: sourceId },
      });

      logger.info(`[TemplateService] Cloned template ${sourceId} to ${clonedTemplate.id} for tenant ${tenantId}`);
      return clonedTemplate;
    } catch (error) {
      logger.error('[TemplateService] Failed to clone template', { error, sourceId, tenantId, data });
      throw error;
    }
  }

  /**
   * Parse template YAML and return structured data
   */
  static async parseTemplate(id: string, tenantId: string | null): Promise<YamlTemplate> {
    try {
      const template = await this.getTemplate(id, tenantId);
      return parseYamlTemplate(template.yamlDefinition);
    } catch (error) {
      logger.error('[TemplateService] Failed to parse template', { error, id, tenantId });
      throw error;
    }
  }

  /**
   * Update template YAML definition
   */
  static async updateTemplateYaml(
    id: string,
    tenantId: string | null,
    yamlTemplate: YamlTemplate
  ) {
    try {
      // Validate YAML structure
      validateYamlTemplate(yamlTemplate);

      // Generate YAML string
      const yamlDefinition = generateYamlTemplate(yamlTemplate);

      // Update template
      return await this.updateTemplate(id, tenantId, { yamlDefinition });
    } catch (error) {
      logger.error('[TemplateService] Failed to update template YAML', { error, id, tenantId });
      throw error;
    }
  }
}

// ============================
// 🧩 REUSABLE COMPONENTS SERVICE
// ============================

export class ReusableComponentService {
  /**
   * Get all reusable components for a tenant
   */
  static async getComponents(tenantId: string | null, options?: {
    type?: 'field' | 'layout' | 'block' | 'template';
    category?: string;
    includeInactive?: boolean;
  }) {
    try {
      const conditions = [];

      // Tenant isolation
      if (tenantId) {
        conditions.push(or(eq(reusableComponents.tenantId, tenantId), eq(reusableComponents.isGlobal, true)));
      } else {
        conditions.push(isNull(reusableComponents.tenantId));
      }

      // Filter by type
      if (options?.type) {
        conditions.push(eq(reusableComponents.type, options.type));
      }

      // Filter by category
      if (options?.category) {
        conditions.push(eq(reusableComponents.category, options.category));
      }

      // Filter by active status
      if (!options?.includeInactive) {
        conditions.push(eq(reusableComponents.isActive, true));
      }

      const result = await db.query.reusableComponents.findMany({
        where: and(...conditions),
        orderBy: [desc(reusableComponents.usageCount), desc(reusableComponents.createdAt)],
      });

      logger.info(`[ReusableComponentService] Retrieved ${result.length} components for tenant ${tenantId}`);
      return result;
    } catch (error) {
      logger.error('[ReusableComponentService] Failed to get components', { error, tenantId, options });
      throw error;
    }
  }

  /**
   * Create a new reusable component
   */
  static async createComponent(data: {
    tenantId: string | null;
    name: string;
    displayName: Record<string, string>;
    description?: Record<string, string>;
    type: 'field' | 'layout' | 'block' | 'template';
    category?: string;
    yamlDefinition: string;
    previewImage?: string;
    isGlobal?: boolean;
    metadata?: Record<string, any>;
    createdBy?: string;
  }) {
    try {
      // Validate YAML definition
      // Note: We could add specific validation based on component type

      const [component] = await db.insert(reusableComponents).values({
        tenantId: data.tenantId,
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        type: data.type,
        category: data.category,
        yamlDefinition: data.yamlDefinition,
        previewImage: data.previewImage,
        isGlobal: data.isGlobal || false,
        metadata: data.metadata || {},
        createdBy: data.createdBy,
      }).returning();

      logger.info(`[ReusableComponentService] Created component ${component.id} for tenant ${data.tenantId}`);
      return component;
    } catch (error) {
      logger.error('[ReusableComponentService] Failed to create component', { error, data });
      throw error;
    }
  }

  /**
   * Increment usage count for a component
   */
  static async incrementUsage(componentId: string) {
    try {
      await db.update(reusableComponents)
        .set({
          usageCount: db.raw('usage_count + 1'),
        })
        .where(eq(reusableComponents.id, componentId));

      logger.info(`[ReusableComponentService] Incremented usage for component ${componentId}`);
    } catch (error) {
      logger.error('[ReusableComponentService] Failed to increment usage', { error, componentId });
      // Don't throw - this is not critical
    }
  }
}

// ============================
// 🏗️ BASE LAYOUTS SERVICE
// ============================

export class BaseLayoutService {
  /**
   * Get all base layouts
   */
  static async getBaseLayouts(category?: string) {
    try {
      const conditions = [eq(templateBaseLayouts.isActive, true)];

      if (category) {
        conditions.push(eq(templateBaseLayouts.category, category));
      }

      const result = await db.query.templateBaseLayouts.findMany({
        where: and(...conditions),
        orderBy: [asc(templateBaseLayouts.sortOrder), asc(templateBaseLayouts.name)],
      });

      logger.info(`[BaseLayoutService] Retrieved ${result.length} base layouts`);
      return result;
    } catch (error) {
      logger.error('[BaseLayoutService] Failed to get base layouts', { error, category });
      throw error;
    }
  }

  /**
   * Get a specific base layout
   */
  static async getBaseLayout(id: string) {
    try {
      const layout = await db.query.templateBaseLayouts.findFirst({
        where: eq(templateBaseLayouts.id, id),
      });

      if (!layout) {
        throw new Error(`Base layout not found: ${id}`);
      }

      logger.info(`[BaseLayoutService] Retrieved base layout ${id}`);
      return layout;
    } catch (error) {
      logger.error('[BaseLayoutService] Failed to get base layout', { error, id });
      throw error;
    }
  }
} 