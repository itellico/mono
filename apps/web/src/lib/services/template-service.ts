// ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
// ❌ REMOVED: Direct database imports (architectural violation)
// import { db } from '@/lib/db';
// import { modelSchemas, optionSets, optionValues } from '@/lib/schemas';
// import { eq, and } from 'drizzle-orm';
import { TemplateCache } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { ApiAuthService } from '@/lib/api-clients/api-auth.service';
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
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
      logger.info('Loading schema from API', { type, subType, tenantId });

      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        type,
        subType,
        tenantId,
        isActive: 'true',
      });

      // Try tenant-specific schema first
      const response = await fetch(
        `${this.API_BASE_URL}/api/v2/admin/model-schemas?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to load schema: ${response.statusText}`);
      }

      const data = await response.json();
      const schemas = data.data || data;

      if (schemas && schemas.length > 0) {
        return schemas[0];
      }

      // Fallback to platform-level schema
      const platformParams = new URLSearchParams({
        type,
        subType,
        tenantId: 'null', // Platform-level
        isActive: 'true',
      });

      const platformResponse = await fetch(
        `${this.API_BASE_URL}/api/v2/admin/model-schemas?${platformParams}`,
        { headers }
      );

      if (platformResponse.ok) {
        const platformData = await platformResponse.json();
        const platformSchemas = platformData.data || platformData;
        
        if (platformSchemas && platformSchemas.length > 0) {
          return platformSchemas[0];
        }
      }

      return null;
    } catch (error) {
      logger.error('Schema load failed via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        type, 
        subType, 
        tenantId 
      });
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
      logger.info('Loading options from API', { optionSetId, region });

      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${this.API_BASE_URL}/api/v2/admin/option-values?optionSetId=${optionSetId}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to load options: ${response.statusText}`);
      }

      const data = await response.json();
      const values = data.data || data;

      return values.map((value: any) => ({
        value: value.value,
        label: this.getRegionalLabel(value, region),
        metadata: value.metadata || {}
      }));
    } catch (error) {
      logger.error('Failed to load options via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        optionSetId 
      });
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
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        type,
        tenantId,
        isActive: 'true',
      });

      const response = await fetch(
        `${this.API_BASE_URL}/api/v2/admin/model-schemas?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to load schemas: ${response.statusText}`);
      }

      const data = await response.json();
      const schemas = data.data || data;

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
      logger.info('Loading option sets from API', { tenantId });

      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams();
      if (tenantId) {
        queryParams.set('tenantId', tenantId);
      }

      const response = await fetch(
        `${this.API_BASE_URL}/api/v2/admin/option-sets?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to load option sets: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      logger.error('Failed to load option sets via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId 
      });
      return [];
    }
  }
} 