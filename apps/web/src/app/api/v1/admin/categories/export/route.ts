import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { categories } from '@/lib/schemas';

/**
 * @openapi
 * /api/v1/admin/categories/export:
 *   get:
 *     tags:
 *       - Admin - Categories
 *     summary: Export categories
 *     description: Export categories in JSON or CSV format
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive categories
 *     responses:
 *       200:
 *         description: Categories exported successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API:categories/export] Exporting categories');

    // Check authentication
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const sql = postgres(process.env.DATABASE_URL || 'postgresql://developer:developer@localhost:5432/mono');
    const db = drizzle(sql, { schema: { categories } });

    // Build query
    let query = db
      .select()
      .from(categories);

    if (!includeInactive) {
      query = query.where(eq(categories.isActive, true));
    }

    // Order by level and sort order
    query = query.orderBy(categories.level, categories.sortOrder);

    const categoriesResult = await query;
    await sql.end();

    if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'ID', 'Name', 'Slug', 'Description', 'Parent ID', 'Level', 'Path', 
        'Sort Order', 'Color', 'Icon', 'Category Type', 'Is System', 'Is Active', 
        'Created At', 'Updated At'
      ];

      const csvRows = [
        headers.join(','),
        ...categoriesResult.map(cat => [
          cat.id,
          `"${cat.name.replace(/"/g, '""')}"`,
          cat.slug,
          `"${(cat.description || '').replace(/"/g, '""')}"`,
          cat.parentId || '',
          cat.level,
          cat.path,
          cat.sortOrder,
          cat.color || '',
          cat.icon || '',
          cat.categoryType,
          cat.isSystem,
          cat.isActive,
          cat.createdAt.toISOString(),
          cat.updatedAt.toISOString()
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="categories-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Return JSON format
    console.log('[API:categories/export] Categories exported successfully', { 
      format,
      count: categoriesResult.length 
    });

    return NextResponse.json({
      success: true,
      data: {
        categories: categoriesResult,
        exportInfo: {
          format,
          count: categoriesResult.length,
          includeInactive,
          exportedAt: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[API:categories/export] Error exporting categories', { error });

    return NextResponse.json({
      success: false,
      error: 'Failed to export categories',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 