import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { categories } from '@/lib/schemas';
import crypto from 'crypto';

/**
 * @openapi
 * /api/v1/admin/categories/upsert:
 *   post:
 *     tags:
 *       - Admin - Categories
 *     summary: Create or update a category
 *     description: Creates a new category or updates an existing one based on ID presence
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               id:
 *                 type: string
 *                 description: Category ID (if updating existing category)
 *               name:
 *                 type: string
 *                 description: Category name
 *               slug:
 *                 type: string
 *                 description: URL-friendly category identifier
 *               description:
 *                 type: string
 *                 description: Category description
 *               parentId:
 *                 type: string
 *                 description: Parent category ID (null for root categories)
 *               color:
 *                 type: string
 *                 description: Category color (hex code)
 *               icon:
 *                 type: string
 *                 description: Category icon identifier
 *               categoryType:
 *                 type: string
 *                 enum: [entity, classification, attribute, functional, location, general]
 *                 description: Category type (auto-inherited for child categories)
 *               isSystem:
 *                 type: boolean
 *                 description: Whether this is a system category
 *               isActive:
 *                 type: boolean
 *                 description: Whether this category is active
 *     responses:
 *       200:
 *         description: Category upserted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API:categories/upsert] Upserting category');

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
    const { id, name, slug, description, parentId, color, icon, categoryType, isSystem, isActive } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json({
        success: false,
        error: 'Name and slug are required'
      }, { status: 400 });
    }

    const sql = postgres(process.env.DATABASE_URL || 'postgresql://developer:developer@localhost:5432/mono');
    const db = drizzle(sql, { schema: { categories } });

    let isUpdate = false;
    let existingCategory = null;

    // Check if this is an update (ID provided and category exists)
    if (id) {
      const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.id, id))
        .limit(1);

      if (existing.length > 0) {
        isUpdate = true;
        existingCategory = existing[0];
      }
    }

    if (isUpdate && existingCategory) {
      // UPDATE LOGIC
      const updateData: any = {
        name,
        slug,
        description: description || null,
        color: color || null,
        icon: icon || null,
        isSystem: isSystem !== undefined ? isSystem : existingCategory.isSystem,
        isActive: isActive !== undefined ? isActive : existingCategory.isActive,
        updatedAt: new Date()
      };

      // Category type can only be changed for root categories
      if (categoryType !== undefined) {
        if (existingCategory.level === 0) {
          updateData.categoryType = categoryType;
        } else {
          await sql.end();
          return NextResponse.json({
            success: false,
            error: 'Category type cannot be changed for child categories (inherited from parent)'
          }, { status: 400 });
        }
      }

      await db
        .update(categories)
        .set(updateData)
        .where(eq(categories.id, id));

      await sql.end();

      console.log('[API:categories/upsert] Category updated successfully', { 
        categoryId: id,
        name: updateData.name
      });

      return NextResponse.json({
        success: true,
        data: {
          id,
          operation: 'update',
          message: 'Category updated successfully'
        },
        timestamp: new Date().toISOString()
      });

    } else {
      // CREATE LOGIC
      let level = 0;
      let path = slug;
      let sortOrder = 1;
      let finalCategoryType = categoryType;

      if (parentId && parentId !== '__root__') {
        // Get parent category
        const parentCategory = await db
          .select()
          .from(categories)
          .where(eq(categories.id, parentId))
          .limit(1);

        if (parentCategory.length === 0) {
          await sql.end();
          return NextResponse.json({
            success: false,
            error: 'Parent category not found'
          }, { status: 400 });
        }

        level = parentCategory[0].level + 1;
        path = `${parentCategory[0].path}/${slug}`;
        
        // INHERIT CATEGORY TYPE from parent for child categories
        finalCategoryType = parentCategory[0].categoryType;
        
        // Get next sort order for siblings
        const siblings = await db
          .select()
          .from(categories)
          .where(eq(categories.parentId, parentId));
        
        sortOrder = Math.max(...siblings.map(s => s.sortOrder || 0), 0) + 1;
      } else {
        // For root categories, categoryType is required
        if (!categoryType) {
          await sql.end();
          return NextResponse.json({
            success: false,
            error: 'Category type is required for root categories'
          }, { status: 400 });
        }
        
        // Get next sort order for root categories
        const rootCategories = await db
          .select()
          .from(categories)
          .where(eq(categories.level, 0));
        
        sortOrder = Math.max(...rootCategories.map(s => s.sortOrder || 0), 0) + 1;
      }

      // Create new category
      const newCategoryId = id || crypto.randomUUID();
      const newCategory = {
        id: newCategoryId,
        tenantId: 1, // Default tenant for now
        name,
        slug,
        description: description || null,
        parentId: parentId && parentId !== '__root__' ? parentId : null,
        level,
        path,
        sortOrder,
        color: color || null,
        icon: icon || null,
        categoryType: finalCategoryType,
        isSystem: isSystem || false,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.insert(categories).values(newCategory);
      await sql.end();

      console.log('[API:categories/upsert] Category created successfully', { 
        categoryId: newCategoryId, 
        name: newCategory.name,
        categoryType: finalCategoryType,
        inherited: parentId && parentId !== '__root__'
      });

      return NextResponse.json({
        success: true,
        data: {
          id: newCategoryId,
          operation: 'create',
          categoryType: finalCategoryType,
          inherited: parentId && parentId !== '__root__',
          message: 'Category created successfully'
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('[API:categories/upsert] Error upserting category', { error });

    return NextResponse.json({
      success: false,
      error: 'Failed to upsert category',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 