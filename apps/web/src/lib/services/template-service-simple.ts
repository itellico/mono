import { db } from '@/lib/db';
import { modelSchemas } from '@/lib/schemas';
import { eq, and, asc } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import type { 
  TemplateContext, 
  ParsedSchema, 
  ParsedSchemaField 
} from '@/lib/types/template-types';

// ============================
// 🏗️ SIMPLE TEMPLATE SERVICE (NO REDIS)
// ============================

export class SimpleTemplateService {

  // ============================
  // 🔄 CORE SCHEMA LOADER (NO CACHE)
  // ============================

  static async getSchema(
    type: string,
    subType: string,
    tenantId: string | null = null,
    context: TemplateContext = 'form'
  ): Promise<ParsedSchema | null> {
    logger.info(`📋 Loading schema: ${type}/${subType} for tenant ${tenantId}`);

    // Load from database with tenant fallback
    const schema = await this.loadSchemaFromDatabase(type, subType, tenantId, false);

    if (!schema) {
      logger.warn(`Schema not found: ${type}/${subType} for tenant ${tenantId}`);
      return null;
    }

    // Parse and return schema
    const parsedSchema = this.parseSchema(schema, context);

    return parsedSchema;
  }

  static async getTemplate(
    type: string,
    subType: string,
    context: TemplateContext = 'form'
  ): Promise<ParsedSchema | null> {
    logger.info(`🔧 Loading template: ${type}/${subType}`);

    // Load template from database (templates are always platform-level)
    const template = await this.loadSchemaFromDatabase(type, subType, null, true);

    if (!template) {
      logger.warn(`Template not found: ${type}/${subType}`);
      return null;
    }

    // Parse and return template
    const parsedTemplate = this.parseSchema(template, context);

    return parsedTemplate;
  }

  // ============================
  // 🗄️ DATABASE OPERATIONS
  // ============================

  private static async loadSchemaFromDatabase(
    type: string,
    subType: string,
    tenantId: string | null,
    isTemplate: boolean = false
  ): Promise<any | null> {
    try {
      if (isTemplate) {
        // Load template (always platform-level with is_template = true)
        const templateResult = await db
          .select()
          .from(modelSchemas)
          .where(
            and(
              eq(modelSchemas.type, type),
              eq(modelSchemas.subType, subType),
              eq(modelSchemas.isTemplate, true),
              eq(modelSchemas.isActive, true)
            )
          )
          .limit(1);

        return templateResult[0] || null;
      } else {
        // Try tenant-specific schema first if tenantId provided
        if (tenantId) {
          const tenantResult = await db
            .select()
            .from(modelSchemas)
            .where(
              and(
                eq(modelSchemas.type, type),
                eq(modelSchemas.subType, subType),
                eq(modelSchemas.tenantId, tenantId),
                eq(modelSchemas.isTemplate, false),
                eq(modelSchemas.isActive, true)
              )
            )
            .limit(1);

          if (tenantResult.length > 0) {
            return tenantResult[0];
          }
        }

        // Fallback to platform-level schema (non-template)
        const platformResult = await db
          .select()
          .from(modelSchemas)
          .where(
            and(
              eq(modelSchemas.type, type),
              eq(modelSchemas.subType, subType),
              eq(modelSchemas.tenantId, null),
              eq(modelSchemas.isTemplate, false),
              eq(modelSchemas.isActive, true)
            )
          )
          .limit(1);

        return platformResult[0] || null;
      }
    } catch (error) {
      logger.error('Database schema load failed:', error);
      return null;
    }
  }

  // ============================
  // 🔧 SCHEMA PARSING
  // ============================

  private static parseSchema(
    schema: any,
    context: TemplateContext
  ): ParsedSchema {
    const definition = schema.schema;

    // Parse fields
    const parsedFields = definition.fields.map(field => this.parseField(field, context));

    // Sort fields by tab, group, order
    const sortedFields = this.sortFields(parsedFields);

    return {
      id: schema.id,
      tenantId: schema.tenantId,
      type: schema.type,
      subType: schema.subType,
      displayName: schema.displayName,
      description: schema.description,
      fields: sortedFields,
      metadata: schema.metadata,
      version: definition.version || '1.0.0'
    };
  }

  private static parseField(
    field: any,
    context: TemplateContext
  ): ParsedSchemaField {
    return {
      ...field,
      // Convert options if they exist
      options: field.options?.map(opt => ({
        value: opt.value,
        label: typeof opt.label === 'string' ? opt.label : opt.label['en-US'] || opt.value
      }))
    };
  }

  private static sortFields(fields: ParsedSchemaField[]): ParsedSchemaField[] {
    return fields.sort((a, b) => {
      // Sort by tab first
      if (a.tab !== b.tab) {
        return (a.tab || '').localeCompare(b.tab || '');
      }

      // Then by group
      if (a.group !== b.group) {
        return (a.group || '').localeCompare(b.group || '');
      }

      // Finally by order
      return (a.order || 0) - (b.order || 0);
    });
  }

  // ============================
  // 📋 LIST OPERATIONS
  // ============================

  static async getSchemasByType(
    type: string,
    tenantId: string | null = null
  ): Promise<ParsedSchema[]> {
    try {
      const results = await db
        .select()
        .from(modelSchemas)
        .where(
          and(
            eq(modelSchemas.type, type),
            tenantId ? eq(modelSchemas.tenantId, tenantId) : eq(modelSchemas.tenantId, null),
            eq(modelSchemas.isTemplate, false),
            eq(modelSchemas.isActive, true)
          )
        )
        .orderBy(asc(modelSchemas.subType));

      return results.map(schema => this.parseSchema(schema, 'form'));
    } catch (error) {
      logger.error('Failed to load schemas by type:', error);
      return [];
    }
  }

  static async getTemplatesByType(type: string): Promise<ParsedSchema[]> {
    try {
      const results = await db
        .select()
        .from(modelSchemas)
        .where(
          and(
            eq(modelSchemas.type, type),
            eq(modelSchemas.isTemplate, true),
            eq(modelSchemas.isActive, true)
          )
        )
        .orderBy(asc(modelSchemas.subType));

      return results.map(template => this.parseSchema(template, 'form'));
    } catch (error) {
      logger.error('Failed to load templates by type:', error);
      return [];
    }
  }

  static async getAllSchemas(tenantId: string | null = null): Promise<ParsedSchema[]> {
    try {
      const results = await db
        .select()
        .from(modelSchemas)
        .where(
          and(
            tenantId ? eq(modelSchemas.tenantId, tenantId) : eq(modelSchemas.tenantId, null),
            eq(modelSchemas.isTemplate, false),
            eq(modelSchemas.isActive, true)
          )
        )
        .orderBy(asc(modelSchemas.type), asc(modelSchemas.subType));

      return results.map(schema => this.parseSchema(schema, 'form'));
    } catch (error) {
      logger.error('Failed to load all schemas:', error);
      return [];
    }
  }

  static async getAllTemplates(): Promise<ParsedSchema[]> {
    try {
      const results = await db
        .select()
        .from(modelSchemas)
        .where(
          and(
            eq(modelSchemas.isTemplate, true),
            eq(modelSchemas.isActive, true)
          )
        )
        .orderBy(asc(modelSchemas.type), asc(modelSchemas.subType));

      return results.map(template => this.parseSchema(template, 'form'));
    } catch (error) {
      logger.error('Failed to load all templates:', error);
      return [];
    }
  }

  // ============================
  // 🔄 TEMPLATE CLONING
  // ============================

  static async cloneTemplateAsSchema(
    templateId: string,
    tenantId: string,
    overrides: Partial<{
      displayName: Record<string, string>;
      description: Record<string, string>;
      metadata: Record<string, any>;
    }> = {}
  ): Promise<string | null> {
    try {
      // Load the template
      const template = await db
        .select()
        .from(modelSchemas)
        .where(
          and(
            eq(modelSchemas.id, templateId),
            eq(modelSchemas.isTemplate, true)
          )
        )
        .limit(1);

      if (template.length === 0) {
        logger.error(`Template not found: ${templateId}`);
        return null;
      }

      const templateData = template[0];

      // Create new schema from template
      const newSchema = {
        tenantId,
        type: templateData.type,
        subType: templateData.subType,
        displayName: overrides.displayName || templateData.displayName,
        description: overrides.description || templateData.description,
        schema: templateData.schema, // Copy the entire schema structure
        isTemplate: false, // This is a schema, not a template
        isActive: true,
        metadata: Object.assign(
          {},
          templateData.metadata || {},
          overrides.metadata || {},
          {
            clonedFromTemplate: templateId,
            clonedAt: new Date().toISOString()
          }
        )
      };

      const result = await db
        .insert(modelSchemas)
        .values(newSchema)
        .returning({ id: modelSchemas.id });

      logger.info(`✅ Cloned template ${templateId} as schema ${result[0].id} for tenant ${tenantId}`);
      return result[0].id;

    } catch (error) {
      logger.error('Failed to clone template as schema:', error);
      return null;
    }
  }
} 