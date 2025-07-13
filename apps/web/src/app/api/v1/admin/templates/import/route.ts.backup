import { NextRequest, NextResponse } from 'next/server';
import { canAccessAPI, extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { logger } from '@/lib/logger';
import { getRedisClient } from '@/lib/redis';
import fs from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';
import { categories, optionSets, attributeDefinitions } from '@/lib/schemas';
import { eq, and } from 'drizzle-orm';

/**
 * @openapi
 * /api/v1/admin/templates/import:
 *   post:
 *     summary: Import template data into tenant
 *     description: Import selected components from an industry template into a specific tenant
 *     tags:
 *       - Admin Templates
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateId
 *               - tenantId
 *             properties:
 *               templateId:
 *                 type: string
 *                 description: ID of the template to import
 *               tenantId:
 *                 type: string
 *                 description: Target tenant ID
 *               components:
 *                 type: object
 *                 description: Which components to import
 *                 properties:
 *                   categories:
 *                     type: boolean
 *                     default: true
 *                   optionSets:
 *                     type: boolean
 *                     default: true
 *                   attributeDefinitions:
 *                     type: boolean
 *                     default: true
 *               conflictResolution:
 *                 type: string
 *                 enum: [update, skip, error]
 *                 default: update
 *                 description: How to handle existing data conflicts
 *               dryRun:
 *                 type: boolean
 *                 default: false
 *                 description: Preview import without making changes
 *     responses:
 *       200:
 *         description: Template imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     importId:
 *                       type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         categoriesImported:
 *                           type: number
 *                         optionSetsImported:
 *                           type: number
 *                         attributeDefinitionsImported:
 *                           type: number
 *                         conflicts:
 *                           type: array
 *                         errors:
 *                           type: array
 *                     preview:
 *                       type: object
 *                       description: Preview data for dry runs
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Template not found
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Check permissions
    const userContext = await extractUserContext(request);
    const hasAccess = canAccessAPI(userContext, '/api/v1/admin/templates/import', 'POST');
    if (!hasAccess.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient permissions to import templates' 
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      templateId,
      tenantId,
      components = { categories: true, optionSets: true, attributeDefinitions: true },
      conflictResolution = 'update',
      dryRun = false
    } = body;

    // Validate required parameters
    if (!templateId || !tenantId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'templateId and tenantId are required' 
        },
        { status: 400 }
      );
    }

    // Validate conflict resolution strategy
    if (!['update', 'skip', 'error'].includes(conflictResolution)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'conflictResolution must be one of: update, skip, error' 
        },
        { status: 400 }
      );
    }

    // Load template data
    const templatesDir = path.join(process.cwd(), 'src/data/templates');
    const templateDir = path.join(templatesDir, templateId);

    try {
      await fs.access(templateDir);
    } catch {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Template not found' 
        },
        { status: 404 }
      );
    }

    const importId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const summary = {
      categoriesImported: 0,
      optionSetsImported: 0,
      attributeDefinitionsImported: 0,
      conflicts: [] as any[],
      errors: [] as any[]
    };

    // Start database transaction
    const result = await db.transaction(async (tx) => {
      const preview: any = {};

      // Import categories if requested
      if (components.categories) {
        try {
          const categoriesPath = path.join(templateDir, 'categories.json');
          const categoriesContent = await fs.readFile(categoriesPath, 'utf-8');
          const templateCategories = JSON.parse(categoriesContent);

          if (dryRun) {
            preview.categories = templateCategories;
          } else {
            const importResult = await importCategories(tx, templateCategories, tenantId, conflictResolution);
            summary.categoriesImported = importResult.imported;
            summary.conflicts.push(...importResult.conflicts);
            summary.errors.push(...importResult.errors);
          }
        } catch (error) {
          logger.warn('Failed to import categories', { templateId, error });
          summary.errors.push({ component: 'categories', error: 'Failed to load or import categories' });
        }
      }

      // Import option sets if requested
      if (components.optionSets) {
        try {
          const optionSetsPath = path.join(templateDir, 'option-sets.json');
          const optionSetsContent = await fs.readFile(optionSetsPath, 'utf-8');
          const templateOptionSets = JSON.parse(optionSetsContent);

          if (dryRun) {
            preview.optionSets = templateOptionSets;
          } else {
            const importResult = await importOptionSets(tx, templateOptionSets, tenantId, conflictResolution);
            summary.optionSetsImported = importResult.imported;
            summary.conflicts.push(...importResult.conflicts);
            summary.errors.push(...importResult.errors);
          }
        } catch (error) {
          logger.warn('Failed to import option sets', { templateId, error });
          summary.errors.push({ component: 'optionSets', error: 'Failed to load or import option sets' });
        }
      }

      // Import attribute definitions if requested
      if (components.attributeDefinitions) {
        try {
          const attributesPath = path.join(templateDir, 'attribute-definitions.json');
          const attributesContent = await fs.readFile(attributesPath, 'utf-8');
          const templateAttributes = JSON.parse(attributesContent);

          if (dryRun) {
            preview.attributeDefinitions = templateAttributes;
          } else {
            const importResult = await importAttributeDefinitions(tx, templateAttributes, tenantId, conflictResolution);
            summary.attributeDefinitionsImported = importResult.imported;
            summary.conflicts.push(...importResult.conflicts);
            summary.errors.push(...importResult.errors);
          }
        } catch (error) {
          logger.warn('Failed to import attribute definitions', { templateId, error });
          summary.errors.push({ component: 'attributeDefinitions', error: 'Failed to load or import attribute definitions' });
        }
      }

      return { summary, preview: dryRun ? preview : undefined };
    });

    // Clear related caches
    if (!dryRun) {
      const redis = await getRedisClient();
      if (redis) {
        try {
          const cacheKeys = [
            `cache:${tenantId}:categories:*`,
            `cache:${tenantId}:option-sets:*`,
            `cache:${tenantId}:attribute-definitions:*`
          ];
          
          for (const pattern of cacheKeys) {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
              await redis.del(...keys);
            }
          }
        } catch (cacheError) {
          logger.warn('Failed to clear caches after import', { error: cacheError });
        }
      }
    }

    const response = {
      success: true,
      data: {
        importId,
        summary: result.summary,
        preview: result.preview
      },
      meta: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        dryRun
      }
    };

    logger.info('Template import completed', {
      templateId,
      tenantId,
      importId,
      dryRun,
      summary: result.summary
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Failed to import template', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to import template' 
      },
      { status: 500 }
    );
  }
}

/**
 * Import categories with conflict resolution
 */
async function importCategories(tx: any, templateCategories: any[], tenantId: string, conflictResolution: string) {
  const result = { imported: 0, conflicts: [], errors: [] };

  for (const category of templateCategories) {
    try {
      // Check if category already exists
      const existing = await tx.select().from(categories)
        .where(and(
          eq(categories.tenantId, tenantId),
          eq(categories.slug, category.slug)
        ))
        .limit(1);

      if (existing.length > 0) {
        result.conflicts.push({
          type: 'category',
          slug: category.slug,
          action: conflictResolution
        });

        if (conflictResolution === 'skip') {
          continue;
        } else if (conflictResolution === 'error') {
          throw new Error(`Category conflict: ${category.slug} already exists`);
        }
        // For 'update', continue with upsert
      }

      // Insert or update category
      await tx.insert(categories).values({
        ...category,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: [categories.tenantId, categories.slug],
        set: {
          ...category,
          updatedAt: new Date()
        }
      });

      result.imported++;
    } catch (error) {
      result.errors.push({
        type: 'category',
        slug: category.slug,
        error: error.message
      });
    }
  }

  return result;
}

/**
 * Import option sets with conflict resolution
 */
async function importOptionSets(tx: any, templateOptionSets: any[], tenantId: string, conflictResolution: string) {
  const result = { imported: 0, conflicts: [], errors: [] };

  for (const optionSet of templateOptionSets) {
    try {
      // Check if option set already exists
      const existing = await tx.select().from(optionSets)
        .where(and(
          eq(optionSets.tenantId, tenantId),
          eq(optionSets.slug, optionSet.slug)
        ))
        .limit(1);

      if (existing.length > 0) {
        result.conflicts.push({
          type: 'optionSet',
          slug: optionSet.slug,
          action: conflictResolution
        });

        if (conflictResolution === 'skip') {
          continue;
        } else if (conflictResolution === 'error') {
          throw new Error(`Option set conflict: ${optionSet.slug} already exists`);
        }
      }

      // Insert or update option set
      await tx.insert(optionSets).values({
        ...optionSet,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: [optionSets.tenantId, optionSets.slug],
        set: {
          ...optionSet,
          updatedAt: new Date()
        }
      });

      result.imported++;
    } catch (error) {
      result.errors.push({
        type: 'optionSet',
        slug: optionSet.slug,
        error: error.message
      });
    }
  }

  return result;
}

/**
 * Import attribute definitions with conflict resolution
 */
async function importAttributeDefinitions(tx: any, templateAttributes: any[], tenantId: string, conflictResolution: string) {
  const result = { imported: 0, conflicts: [], errors: [] };

  for (const attribute of templateAttributes) {
    try {
      // Check if attribute already exists
      const existing = await tx.select().from(attributeDefinitions)
        .where(and(
          eq(attributeDefinitions.tenantId, tenantId),
          eq(attributeDefinitions.slug, attribute.slug)
        ))
        .limit(1);

      if (existing.length > 0) {
        result.conflicts.push({
          type: 'attributeDefinition',
          slug: attribute.slug,
          action: conflictResolution
        });

        if (conflictResolution === 'skip') {
          continue;
        } else if (conflictResolution === 'error') {
          throw new Error(`Attribute definition conflict: ${attribute.slug} already exists`);
        }
      }

      // Insert or update attribute definition
      await tx.insert(attributeDefinitions).values({
        ...attribute,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: [attributeDefinitions.tenantId, attributeDefinitions.slug],
        set: {
          ...attribute,
          updatedAt: new Date()
        }
      });

      result.imported++;
    } catch (error) {
      result.errors.push({
        type: 'attributeDefinition',
        slug: attribute.slug,
        error: error.message
      });
    }
  }

  return result;
} 