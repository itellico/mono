import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * @openapi
 * /api/v1/admin/categories/import:
 *   post:
 *     tags:
 *       - Admin - Categories
 *     summary: Import categories
 *     description: Import categories from JSON data with validation and conflict resolution
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categories
 *             properties:
 *               categories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     description:
 *                       type: string
 *                     parentSlug:
 *                       type: string
 *                     color:
 *                       type: string
 *                     icon:
 *                       type: string
 *                     categoryType:
 *                       type: string
 *                     isSystem:
 *                       type: boolean
 *               conflictResolution:
 *                 type: string
 *                 enum: [skip, update, error]
 *                 default: skip
 *                 description: How to handle conflicts with existing categories
 *     responses:
 *       200:
 *         description: Categories imported successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API:categories/import] Starting category import');

    // Check authentication
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { categories: importCategories, conflictResolution = 'skip' } = body;

    // Validate required fields
    if (!importCategories || !Array.isArray(importCategories) || importCategories.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Categories array is required and must not be empty'
      }, { status: 400 });
    }

    const existingCategories = await prisma.category.findMany();
    const existingBySlug = new Map(existingCategories.map(cat => [cat.slug, cat]));

    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    };

    // Process categories in order (parents first)
    const processedSlugs = new Set();
    
    for (const importCat of importCategories) {
      try {
        // Validate required fields
        if (!importCat.name || !importCat.slug) {
          results.errors.push(`Category missing name or slug: ${JSON.stringify(importCat)}`);
          continue;
        }

        // Check for conflicts
        const existing = existingBySlug.get(importCat.slug);
        if (existing) {
          if (conflictResolution === 'error') {
            results.errors.push(`Category with slug '${importCat.slug}' already exists`);
            continue;
          } else if (conflictResolution === 'skip') {
            results.skipped++;
            continue;
          } else if (conflictResolution === 'update') {
            // Update existing category
            await prisma.category.update({
              where: { id: existing.id },
              data: {
                name: importCat.name,
                description: importCat.description || null,
                color: importCat.color || null,
                icon: importCat.icon || null,
                categoryType: importCat.categoryType || existing.categoryType,
                isSystem: importCat.isSystem !== undefined ? importCat.isSystem : existing.isSystem,
                updatedAt: new Date()
              },
            });
            
            results.updated++;
            continue;
          }
        }

        // Determine parent and inheritance
        let parentId = null;
        let level = 0;
        let path = importCat.slug;
        let finalCategoryType = importCat.categoryType;

        if (importCat.parentSlug) {
          const parentCategory = existingBySlug.get(importCat.parentSlug) || 
                               importCategories.find(cat => cat.slug === importCat.parentSlug && processedSlugs.has(cat.slug));
          
          if (parentCategory) {
            parentId = parentCategory.id;
            level = parentCategory.level + 1;
            path = `${parentCategory.path}/${importCat.slug}`;
            // Inherit category type from parent
            finalCategoryType = parentCategory.categoryType;
          } else {
            results.errors.push(`Parent category '${importCat.parentSlug}' not found for '${importCat.slug}'`);
            continue;
          }
        }

        // Validate category type for root categories
        if (level === 0 && !finalCategoryType) {
          results.errors.push(`Category type is required for root category '${importCat.slug}'`);
          continue;
        }

        // Get sort order
        const siblings = level === 0 
          ? existingCategories.filter(cat => cat.level === 0)
          : existingCategories.filter(cat => cat.parentId === parentId);
        
        const sortOrder = Math.max(...siblings.map(s => s.sortOrder || 0), 0) + 1;

        // Create new category
        const newCategory = await prisma.category.create({
          data: {
            tenantId: 1, // Default tenant
            name: importCat.name,
            slug: importCat.slug,
            description: importCat.description || null,
            parentId,
            level,
            path,
            sortOrder,
            color: importCat.color || null,
            icon: importCat.icon || null,
            categoryType: finalCategoryType,
            isSystem: importCat.isSystem || false,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
        });
        
        // Add to existing map for parent lookups
        existingBySlug.set(newCategory.slug, newCategory);
        processedSlugs.add(newCategory.slug);
        
        results.imported++;
        
        results.imported++;

      } catch (error) {
        results.errors.push(`Error processing category '${importCat.slug}': ${error}`);
      }
    }

    await sql.end();

    console.log('[API:categories/import] Import completed', results);

    return NextResponse.json({
      success: true,
      data: {
        results,
        message: `Import completed: ${results.imported} imported, ${results.updated} updated, ${results.skipped} skipped, ${results.errors.length} errors`
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[API:categories/import] Error importing categories', { error });

    return NextResponse.json({
      success: false,
      error: 'Failed to import categories',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 