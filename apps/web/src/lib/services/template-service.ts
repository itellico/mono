import { db } from '@/lib/db';
import { modelSchemas, optionSets, optionValues } from '@/lib/schemas';
import { eq, and } from 'drizzle-orm';
import { TemplateCache } from '@/lib/redis';
import { logger } from '@/lib/logger';
import type { ModelSchema, SchemaDefinition, SchemaField } from '@/lib/schemas/model-schemas';
import type { OptionSet, OptionValue } from '@/lib/schemas/options';

// ============================
// 🏗️ TEMPLATE SERVICE
// ============================

export type TemplateContext = 'form' | 'search' | 'card' | 'list' | 'dashboard';

export interface ParsedSchema {
  id: string;
  tenantId: string | null;
  type: string;
  subType: string;
  displayName: Record<string, string>;
  description?: Record<string, string>;
  fields: ParsedSchemaField[];
  metadata: Record<string, any>;
  version: string;
}

export interface ParsedSchemaField extends Omit<SchemaField, 'options'> {
  options?: ParsedOption[];
}

export interface ParsedOption {
  value: string;
  label: string;
  metadata?: Record<string, any>;
}

export class TemplateService {

  // ============================
  // 🔄 CORE SCHEMA LOADER
  // ============================

  static async getSchema(
    type: string,
    subType: string,
    tenantId: string,
    context: TemplateContext = 'form'
  ): Promise<ParsedSchema | null> {
    const cacheKey = TemplateCache.getCacheKey(tenantId, type, subType, context);

    // Try cache first
    try {
      const cached = await TemplateCache.get<ParsedSchema>(cacheKey);
      if (cached) {
        logger.info(`📋 Template cache HIT: ${cacheKey}`);
        return cached;
      }
    } catch (error) {
      logger.warn('Cache read failed, falling back to database:', error);
    }

    logger.info(`📋 Template cache MISS: ${cacheKey}`);

    // Load from database with tenant fallback
    const schema = await this.loadSchemaFromDatabase(type, subType, tenantId);

    if (!schema) {
      logger.warn(`Schema not found: ${type}/${subType} for tenant ${tenantId}`);
      return null;
    }

    // Parse and enrich schema
    const parsedSchema = await this.parseSchema(schema, context);

    // Cache the result
    try {
      await TemplateCache.set(cacheKey, parsedSchema);
      logger.info(`📋 Template cached: ${cacheKey}`);
    } catch (error) {
      logger.warn('Failed to cache template:', error);
    }

    return parsedSchema;
  }

  // ============================
  // 🗄️ DATABASE OPERATIONS
  // ============================

  private static async loadSchemaFromDatabase(
    type: string,
    subType: string,
    tenantId: string
  ): Promise<any | null> {
    try {
      // Try tenant-specific schema first
      let result = await db
        .select()
        .from(modelSchemas)
        .where(
          and(
            eq(modelSchemas.type, type),
            eq(modelSchemas.subType, subType),
            eq(modelSchemas.tenantId, tenantId),
            eq(modelSchemas.isActive, true)
          )
        )
        .limit(1);

      // Fallback to platform-level schema
      if (result.length === 0) {
        result = await db
          .select()
          .from(modelSchemas)
          .where(
            and(
              eq(modelSchemas.type, type),
              eq(modelSchemas.subType, subType),
              eq(modelSchemas.tenantId, null), // Platform-level
              eq(modelSchemas.isActive, true)
            )
          )
          .limit(1);
      }

      return result[0] || null;
    } catch (error) {
      logger.error('Database schema load failed:', error);
      return null;
    }
  }

  // ============================
  // 🔧 SCHEMA PARSING
  // ============================

  private static async parseSchema(
    schema: any,
    context: TemplateContext
  ): Promise<ParsedSchema> {
    const definition = schema.schema as SchemaDefinition;

    // Parse fields with option sets
    const parsedFields = await Promise.all(
      definition.fields.map(field => this.parseField(field, context))
    );

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

  private static async parseField(
    field: SchemaField,
    context: TemplateContext
  ): Promise<ParsedSchemaField> {
    let options: ParsedOption[] | undefined;

    // Load options from option set if specified
    if (field.optionSetId) {
      options = await this.loadOptions(field.optionSetId);
    } else if (field.options) {
      // Use inline options (legacy)
      options = field.options.map(opt => ({
        value: opt.value,
        label: opt.label['en-US'] || opt.label[Object.keys(opt.label)[0]] || opt.value,
        metadata: opt.metadata
      }));
    }

    return {
      ...field,
      options
    };
  }

  // ============================
  // 🌍 OPTION SET LOADER
  // ============================

  static async loadOptions(
    optionSetId: number,
    region: string = 'GLOBAL'
  ): Promise<ParsedOption[]> {
    try {
      const values = await db
        .select()
        .from(optionValues)
        .where(eq(optionValues.optionSetId, optionSetId))
        .orderBy(optionValues.order);

      return values.map(value => ({
        value: value.value,
        label: this.getRegionalLabel(value, region),
        metadata: value.metadata || {}
      }));
    } catch (error) {
      logger.error(`Failed to load options for set ${optionSetId}:`, error);
      return [];
    }
  }

  private static getRegionalLabel(value: OptionValue, region: string): string {
    // Try regional mapping first
    if (value.regionalMappings && typeof value.regionalMappings === 'object') {
      const mappings = value.regionalMappings as Record<string, string>;
      if (mappings[region]) {
        return mappings[region];
      }
    }

    // Fallback to default label
    return value.label;
  }

  // ============================
  // 📐 FIELD SORTING
  // ============================

  private static sortFields(fields: ParsedSchemaField[]): ParsedSchemaField[] {
    return fields.sort((a, b) => {
      // Sort by tab first
      const tabA = a.tab || 'default';
      const tabB = b.tab || 'default';

      if (tabA !== tabB) {
        return tabA.localeCompare(tabB);
      }

      // Then by group
      const groupA = a.group || 'default';
      const groupB = b.group || 'default';

      if (groupA !== groupB) {
        return groupA.localeCompare(groupB);
      }

      // Finally by order
      return a.order - b.order;
    });
  }

  // ============================
  // 🔄 CACHE MANAGEMENT
  // ============================

  static async invalidateSchemaCache(
    tenantId: string,
    type?: string,
    subType?: string
  ): Promise<void> {
    await TemplateCache.invalidateSchema(tenantId, type, subType);
    logger.info(`🗑️ Cache invalidated for tenant ${tenantId}`);
  }

  // ============================
  // 📋 BULK OPERATIONS
  // ============================

  static async getSchemasByType(
    type: string,
    tenantId: string
  ): Promise<ParsedSchema[]> {
    try {
      const schemas = await db
        .select()
        .from(modelSchemas)
        .where(
          and(
            eq(modelSchemas.type, type),
            eq(modelSchemas.tenantId, tenantId),
            eq(modelSchemas.isActive, true)
          )
        );

      const parsedSchemas = await Promise.all(
        schemas.map(schema => this.parseSchema(schema, 'form'))
      );

      return parsedSchemas;
    } catch (error) {
      logger.error(`Failed to load schemas by type ${type}:`, error);
      return [];
    }
  }

  static async getAllOptionSets(tenantId?: string): Promise<OptionSet[]> {
    try {
      const query = tenantId
        ? db.select().from(optionSets).where(eq(optionSets.tenantId, parseInt(tenantId)))
        : db.select().from(optionSets);

      return await query;
    } catch (error) {
      logger.error('Failed to load option sets:', error);
      return [];
    }
  }
} 