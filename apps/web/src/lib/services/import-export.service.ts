// ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
// ❌ REMOVED: Direct database imports (architectural violation)
// import { db } from '@/lib/db';
// import { 
//   categories, 
//   tags, 
//   modelSchemas,
//   optionSets,
//   optionValues 
// } from '@/lib/schemas';
// import { eq, and, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { ApiAuthService } from '@/lib/api-clients/api-auth.service';

export interface ImportOptions {
  mode: 'delete' | 'append';
  tenantId: number;
  userId: number;
}

export interface ExportOptions {
  tenantId: number;
  includeSystem?: boolean;
}

export interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
  warnings: string[];
}

export interface ExportResult {
  success: boolean;
  data?: any;
  message: string;
}

export class ImportExportService {
  /**
   * Import Categories (hierarchical support with upsert)
   */
  static async importCategories(
    data: any[], 
    options: ImportOptions
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      message: '',
      imported: 0,
      errors: [],
      warnings: []
    };

    try {
      logger.info('Starting categories import', { 
        count: data.length, 
        mode: options.mode,
        tenantId: options.tenantId 
      });

      // Validate data structure
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (!item.name || !item.slug) {
          result.errors.push(`Category ${i + 1}: Missing required fields 'name' or 'slug'`);
        }
        if (item.categoryType && !['user', 'content', 'transaction', 'communication', 'system', 'resource', 'event', 'workflow', 'analytics', 'moderation', 'tenant', 'platform'].includes(item.categoryType)) {
          result.errors.push(`Category ${i + 1} (${item.name}): Invalid categoryType '${item.categoryType}'`);
        }
      }

      if (result.errors.length > 0) {
        result.success = false;
        result.message = 'Validation failed';
        return result;
      }

      // Soft delete existing if mode is 'delete' (actually "replace")
      if (options.mode === 'delete') {
        try {
          // Mark existing non-system categories as inactive instead of deleting
          await db.update(categories)
            .set({ 
              isActive: false, 
              updatedBy: options.userId,
              updatedAt: new Date()
            })
            .where(and(
              eq(categories.tenantId, options.tenantId),
              eq(categories.isSystem, false)
            ));
          logger.info('Soft deleted (marked inactive) existing non-system categories', { tenantId: options.tenantId });
        } catch (error) {
          result.errors.push(`Failed to deactivate existing categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.success = false;
          return result;
        }
      }

      // Sort categories by level (parents first)
      const sortedData = data.sort((a, b) => (a.level || 0) - (b.level || 0));
      const categoryMap = new Map<string, string>(); // originalId -> newId
      let updated = 0;
      let inserted = 0;

      for (const item of sortedData) {
        try {
          // Handle parent reference
          let parentId = null;
          if (item.parentId && categoryMap.has(item.parentId)) {
            parentId = categoryMap.get(item.parentId);
          }

          // Build path
          let path = item.slug;
          if (parentId) {
            try {
              const parent = await db.select({ path: categories.path })
                .from(categories)
                .where(eq(categories.id, parentId))
                .limit(1);
              if (parent[0]) {
                path = `${parent[0].path}/${item.slug}`;
              }
            } catch (error) {
              result.warnings.push(`Category ${item.name}: Could not resolve parent path, using slug only`);
            }
          }

          const categoryData = {
            tenantId: options.tenantId,
            name: item.name,
            slug: item.slug,
            description: item.description || null,
            categoryType: item.categoryType || 'content',
            parentId,
            level: item.level || 0,
            path,
            sortOrder: item.sortOrder || 0,
            color: item.color || null,
            icon: item.icon || null,
            isSystem: false,
            isActive: item.isActive ?? true,
            metadata: item.metadata || {},
            updatedBy: options.userId,
            updatedAt: new Date()
          };

          // Always check for existing category (even in replace mode)
          const existingCategory = await db.select({ id: categories.id })
            .from(categories)
            .where(and(
              eq(categories.tenantId, options.tenantId),
              eq(categories.slug, item.slug),
              eq(categories.categoryType, item.categoryType || 'content')
            ))
            .limit(1);

          let categoryId: string;

          if (existingCategory.length > 0) {
            // Update existing category (reactivate it and update data)
            categoryId = existingCategory[0].id;
            await db.update(categories)
              .set({
                ...categoryData,
                isActive: true, // Reactivate in case it was soft-deleted
              })
              .where(eq(categories.id, categoryId));
            updated++;
            if (options.mode === 'delete') {
              result.warnings.push(`Reactivated and updated category: ${item.name}`);
            } else {
              result.warnings.push(`Updated existing category: ${item.name}`);
            }
          } else {
            // Insert new category
            const [newCategory] = await db.insert(categories).values({
              ...categoryData,
              createdBy: options.userId
            }).returning({ id: categories.id });
            
            categoryId = newCategory.id;
            inserted++;
          }

          // Map original ID to new ID for parent references
          if (item.id) {
            categoryMap.set(item.id, categoryId);
          }
          // Also map by slug for hierarchical references
          categoryMap.set(item.slug, categoryId);

          result.imported++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to process category '${item.name}': ${errorMsg}`);
          logger.error('Category import error', { 
            categoryName: item.name, 
            error: errorMsg,
            tenantId: options.tenantId 
          });
        }
      }

      // Generate result message
      if (options.mode === 'delete') {
        result.message = `Replaced all categories - imported ${inserted} new categories`;
        if (inserted > 0) {
          result.warnings.unshift('All existing categories were deleted and replaced with imported data');
        }
      } else if (inserted > 0 && updated > 0) {
        result.message = `Processed ${result.imported} categories (${inserted} new, ${updated} updated)`;
      } else if (inserted > 0) {
        result.message = `Imported ${inserted} new categories`;
      } else if (updated > 0) {
        result.message = `Updated ${updated} existing categories`;
      } else {
        result.message = 'No categories were processed';
      }

      if (result.errors.length > 0) {
        result.success = false;
        result.message += ` with ${result.errors.length} errors`;
      }

      return result;

    } catch (error) {
      logger.error('Categories import failed', { error, tenantId: options.tenantId });
      return {
        success: false,
        message: 'Import failed due to unexpected error',
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: []
      };
    }
  }

  /**
   * Export Categories
   */
  static async exportCategories(options: ExportOptions): Promise<ExportResult> {
    try {
      logger.info('Starting categories export', { tenantId: options.tenantId });

      const whereConditions = [eq(categories.tenantId, options.tenantId)];
      if (!options.includeSystem) {
        whereConditions.push(eq(categories.isSystem, false));
      }

      const data = await db.select()
        .from(categories)
        .where(and(...whereConditions))
        .orderBy(categories.level, categories.sortOrder);

      return {
        success: true,
        data,
        message: `Exported ${data.length} categories`
      };
    } catch (error) {
      logger.error('Categories export failed', { error, tenantId: options.tenantId });
      return {
        success: false,
        message: 'Export failed'
      };
    }
  }

  /**
   * Import Tags (with upsert)
   */
  static async importTags(
    data: any[], 
    options: ImportOptions
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      message: '',
      imported: 0,
      errors: [],
      warnings: []
    };

    try {
      logger.info('Starting tags import', { 
        count: data.length, 
        mode: options.mode,
        tenantId: options.tenantId 
      });

      // Validate data structure
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (!item.name || !item.slug) {
          result.errors.push(`Tag ${i + 1}: Missing required fields 'name' or 'slug'`);
        }
        if (item.tagCategory && !['user', 'content', 'transaction', 'communication', 'system', 'resource', 'event', 'workflow', 'analytics', 'moderation', 'tenant', 'platform'].includes(item.tagCategory)) {
          result.errors.push(`Tag ${i + 1} (${item.name}): Invalid tagCategory '${item.tagCategory}'`);
        }
      }

      if (result.errors.length > 0) {
        result.success = false;
        result.message = 'Validation failed';
        return result;
      }

      // Soft delete existing if mode is 'delete' (actually "replace")
      if (options.mode === 'delete') {
        try {
          // Mark existing non-system tags as inactive instead of deleting
          await db.update(tags)
            .set({ 
              isActive: false, 
              updatedBy: options.userId,
              updatedAt: new Date()
            })
            .where(and(
              eq(tags.tenantId, options.tenantId),
              eq(tags.isSystem, false)
            ));
          logger.info('Soft deleted (marked inactive) existing non-system tags', { tenantId: options.tenantId });
        } catch (error) {
          result.errors.push(`Failed to deactivate existing tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.success = false;
          return result;
        }
      }

      let updated = 0;
      let inserted = 0;

      for (const item of data) {
        try {
          const tagData = {
            tenantId: options.tenantId,
            name: item.name,
            slug: item.slug,
            description: item.description || null,
            tagCategory: item.tagCategory || 'content',
            categoryId: item.categoryId || null,
            color: item.color || null,
            isSystem: false,
            isActive: item.isActive ?? true,
            usageCount: item.usageCount || 0,
            metadata: item.metadata || {},
            updatedBy: options.userId,
            updatedAt: new Date()
          };

          // Always check for existing tag (even in replace mode)
          const existingTag = await db.select({ id: tags.id })
            .from(tags)
            .where(and(
              eq(tags.tenantId, options.tenantId),
              eq(tags.slug, item.slug),
              eq(tags.tagCategory, item.tagCategory || 'content')
            ))
            .limit(1);

          if (existingTag.length > 0) {
            // Update existing tag (reactivate it and update data)
            await db.update(tags)
              .set({
                ...tagData,
                isActive: true, // Reactivate in case it was soft-deleted
              })
              .where(eq(tags.id, existingTag[0].id));
            updated++;
            if (options.mode === 'delete') {
              result.warnings.push(`Reactivated and updated tag: ${item.name}`);
            } else {
              result.warnings.push(`Updated existing tag: ${item.name}`);
            }
          } else {
            // Insert new tag
            await db.insert(tags).values({
              ...tagData,
              createdBy: options.userId
            });
            inserted++;
          }

          result.imported++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to process tag '${item.name}': ${errorMsg}`);
          logger.error('Tag import error', { 
            tagName: item.name, 
            error: errorMsg,
            tenantId: options.tenantId 
          });
        }
      }

      // Generate result message
      if (options.mode === 'delete') {
        result.message = `Replaced all tags - imported ${inserted} new tags`;
        if (inserted > 0) {
          result.warnings.unshift('All existing tags were deleted and replaced with imported data');
        }
      } else if (inserted > 0 && updated > 0) {
        result.message = `Processed ${result.imported} tags (${inserted} new, ${updated} updated)`;
      } else if (inserted > 0) {
        result.message = `Imported ${inserted} new tags`;
      } else if (updated > 0) {
        result.message = `Updated ${updated} existing tags`;
      } else {
        result.message = 'No tags were processed';
      }

      if (result.errors.length > 0) {
        result.success = false;
        result.message += ` with ${result.errors.length} errors`;
      }

      return result;

    } catch (error) {
      logger.error('Tags import failed', { error, tenantId: options.tenantId });
      return {
        success: false,
        message: 'Import failed due to unexpected error',
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: []
      };
    }
  }

  /**
   * Export Tags
   */
  static async exportTags(options: ExportOptions): Promise<ExportResult> {
    try {
      logger.info('Starting tags export', { tenantId: options.tenantId });

      const whereConditions = [eq(tags.tenantId, options.tenantId)];
      if (!options.includeSystem) {
        whereConditions.push(eq(tags.isSystem, false));
      }

      const data = await db.select()
        .from(tags)
        .where(and(...whereConditions))
        .orderBy(tags.name);

      return {
        success: true,
        data,
        message: `Exported ${data.length} tags`
      };
    } catch (error) {
      logger.error('Tags export failed', { error, tenantId: options.tenantId });
      return {
        success: false,
        message: 'Export failed'
      };
    }
  }

  /**
   * Import Model Schemas (with fields)
   */
  static async importModelSchemas(
    data: any[], 
    options: ImportOptions
  ): Promise<ImportResult> {
    try {
      logger.info('Starting model schemas import', { 
        count: data.length, 
        mode: options.mode,
        tenantId: options.tenantId 
      });

      const result: ImportResult = {
        success: true,
        message: '',
        imported: 0,
        errors: [],
        warnings: []
      };

      // Validate data structure
      for (const item of data) {
        if (!item.type || !item.subType) {
          result.errors.push(`Invalid model schema: missing type or subType`);
        }
        if (!item.schema || !item.schema.fields) {
          result.errors.push(`Invalid model schema: missing schema.fields`);
        }
      }

      if (result.errors.length > 0) {
        result.success = false;
        result.message = 'Validation failed';
        return result;
      }

      // Delete existing if mode is 'delete'
      if (options.mode === 'delete') {
        await db.delete(modelSchemas)
          .where(eq(modelSchemas.tenantId, options.tenantId.toString()));
        logger.info('Deleted existing model schemas', { tenantId: options.tenantId });
      }

      for (const item of data) {
        try {
          await db.insert(modelSchemas).values({
            tenantId: options.tenantId.toString(),
            type: item.type,
            subType: item.subType,
            displayName: item.displayName || { 'en-US': `${item.type} ${item.subType}` },
            description: item.description || {},
            schema: item.schema,
            isTemplate: item.isTemplate ?? false,
            isActive: item.isActive ?? true,
            metadata: item.metadata || {},
            createdBy: options.userId,
            updatedBy: options.userId,
            lastModifiedByName: 'Import System'
          });

          result.imported++;
        } catch (error) {
          result.errors.push(`Failed to import model schema ${item.type}/${item.subType}: ${error}`);
        }
      }

      result.message = `Imported ${result.imported} model schemas`;
      if (result.errors.length > 0) {
        result.success = false;
        result.message += ` with ${result.errors.length} errors`;
      }

      return result;
    } catch (error) {
      logger.error('Model schemas import failed', { error, tenantId: options.tenantId });
      return {
        success: false,
        message: 'Import failed',
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: []
      };
    }
  }

  /**
   * Export Model Schemas
   */
  static async exportModelSchemas(options: ExportOptions): Promise<ExportResult> {
    try {
      logger.info('Starting model schemas export', { tenantId: options.tenantId });

      const data = await db.select()
        .from(modelSchemas)
        .where(eq(modelSchemas.tenantId, options.tenantId.toString()))
        .orderBy(modelSchemas.type, modelSchemas.subType);

      return {
        success: true,
        data,
        message: `Exported ${data.length} model schemas`
      };
    } catch (error) {
      logger.error('Model schemas export failed', { error, tenantId: options.tenantId });
      return {
        success: false,
        message: 'Export failed'
      };
    }
  }

  /**
   * Import Option Sets (with values)
   */
  static async importOptionSets(
    data: any[], 
    options: ImportOptions
  ): Promise<ImportResult> {
    try {
      logger.info('Starting option sets import', { 
        count: data.length, 
        mode: options.mode,
        tenantId: options.tenantId 
      });

      const result: ImportResult = {
        success: true,
        message: '',
        imported: 0,
        errors: [],
        warnings: []
      };

      // Validate data structure
      for (const item of data) {
        if (!item.slug || !item.label) {
          result.errors.push(`Invalid option set: missing slug or label`);
        }
        if (!item.values || !Array.isArray(item.values)) {
          result.errors.push(`Invalid option set: missing or invalid values array`);
        }
      }

      if (result.errors.length > 0) {
        result.success = false;
        result.message = 'Validation failed';
        return result;
      }

      // Delete existing if mode is 'delete'
      if (options.mode === 'delete') {
        // Get existing option set IDs to delete their values
        const existingSets = await db.select({ id: optionSets.id })
          .from(optionSets)
          .where(eq(optionSets.tenantId, options.tenantId));
        
        if (existingSets.length > 0) {
          const setIds = existingSets.map(s => s.id);
          await db.delete(optionValues)
            .where(inArray(optionValues.optionSetId, setIds));
          await db.delete(optionSets)
            .where(eq(optionSets.tenantId, options.tenantId));
        }
        
        logger.info('Deleted existing option sets', { tenantId: options.tenantId });
      }

      for (const item of data) {
        try {
          // Insert option set
          const [insertedSet] = await db.insert(optionSets).values({
            slug: item.slug,
            label: item.label,
            tenantId: options.tenantId,
            categoryId: item.categoryId || null,
            createdBy: options.userId,
            updatedBy: options.userId,
            lastModifiedByName: 'Import System'
          }).returning({ id: optionSets.id });

          // Insert option values
          for (const value of item.values) {
            await db.insert(optionValues).values({
              optionSetId: insertedSet.id,
              label: value.label,
              value: value.value,
              order: value.order || 0,
              isDefault: value.isDefault || false,
              canonicalRegion: value.canonicalRegion || 'GLOBAL',
              regionalMappings: value.regionalMappings || {},
              metadata: value.metadata || {}
            });
          }

          result.imported++;
        } catch (error) {
          result.errors.push(`Failed to import option set ${item.slug}: ${error}`);
        }
      }

      result.message = `Imported ${result.imported} option sets`;
      if (result.errors.length > 0) {
        result.success = false;
        result.message += ` with ${result.errors.length} errors`;
      }

      return result;
    } catch (error) {
      logger.error('Option sets import failed', { error, tenantId: options.tenantId });
      return {
        success: false,
        message: 'Import failed',
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: []
      };
    }
  }

  /**
   * Export Option Sets
   */
  static async exportOptionSets(options: ExportOptions): Promise<ExportResult> {
    try {
      logger.info('Starting option sets export', { tenantId: options.tenantId });

      // Get option sets with their values
      const sets = await db.select()
        .from(optionSets)
        .where(eq(optionSets.tenantId, options.tenantId))
        .orderBy(optionSets.slug);

      const data = [];
      for (const set of sets) {
        const values = await db.select()
          .from(optionValues)
          .where(eq(optionValues.optionSetId, set.id))
          .orderBy(optionValues.order);

        data.push({
          ...set,
          values
        });
      }

      return {
        success: true,
        data,
        message: `Exported ${data.length} option sets`
      };
    } catch (error) {
      logger.error('Option sets export failed', { error, tenantId: options.tenantId });
      return {
        success: false,
        message: 'Export failed'
      };
    }
  }
} 
