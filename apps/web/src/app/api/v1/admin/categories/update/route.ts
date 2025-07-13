import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { categories } from '@/lib/schemas';

/**
 * @openapi
 * /api/v1/admin/categories/update:
 *   put:
 *     tags:
 *       - Admin - Categories
 *     summary: Update an existing category
 *     description: Updates category details, with category type inheritance restrictions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: Category ID to update
 *               name:
 *                 type: string
 *                 description: Category name
 *               slug:
 *                 type: string
 *                 description: URL-friendly category identifier
 *               description:
 *                 type: string
 *                 description: Category description
 *               color:
 *                 type: string
 *                 description: Category color (hex code)
 *               icon:
 *                 type: string
 *                 description: Category icon identifier
 *               categoryType:
 *                 type: string
 *                 enum: [entity, classification, attribute, functional, location, general]
 *                 description: Category type (only editable for root categories)
 *               isSystem:
 *                 type: boolean
 *                 description: Whether this is a system category
 *               isActive:
 *                 type: boolean
 *                 description: Whether this category is active
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(request: NextRequest) {
  try {
    console.log('[API:categories/update] Updating category');

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
    const { id, name, slug, description, color, icon, categoryType, isSystem, isActive } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Category ID is required'
      }, { status: 400 });
    }

    const sql = postgres(process.env.DATABASE_URL || 'postgresql://developer:developer@localhost:5432/mono');
    const db = drizzle(sql, { schema: { categories } });

    // Get existing category
    const existingCategory = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (existingCategory.length === 0) {
      await sql.end();
      return NextResponse.json({
        success: false,
        error: 'Category not found'
      }, { status: 404 });
    }

    const category = existingCategory[0];

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    // Add fields that are provided
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (isSystem !== undefined) updateData.isSystem = isSystem;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Category type can only be changed for root categories
    if (categoryType !== undefined) {
      if (category.level === 0) {
        updateData.categoryType = categoryType;
      } else {
        await sql.end();
        return NextResponse.json({
          success: false,
          error: 'Category type cannot be changed for child categories (inherited from parent)'
        }, { status: 400 });
      }
    }

    // Update the category
    await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id));

    // If categoryType was changed for a root category, update all descendants
    if (categoryType !== undefined && category.level === 0 && categoryType !== category.categoryType) {
      await db
        .update(categories)
        .set({ 
          categoryType: categoryType,
          updatedAt: new Date()
        })
        .where(eq(categories.path, category.path)); // This will update all descendants
    }

    await sql.end();

    console.log('[API:categories/update] Category updated successfully', { 
      categoryId: id,
      updatedFields: Object.keys(updateData),
      categoryTypeChanged: categoryType !== undefined && category.level === 0
    });

    return NextResponse.json({
      success: true,
      data: {
        id,
        message: 'Category updated successfully',
        categoryTypeInherited: category.level > 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[API:categories/update] Error updating category', { error });

    return NextResponse.json({
      success: false,
      error: 'Failed to update category',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 