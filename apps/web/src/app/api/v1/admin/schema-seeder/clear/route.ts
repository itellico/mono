import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { modelSchemas, optionSets, optionValues, modules } from '@/lib/schemas';
import { isNull } from 'drizzle-orm';

/**
 * @openapi
 * /api/v1/admin/schema-seeder/clear:
 *   post:
 *     tags:
 *       - Admin - Schema Seeder
 *     summary: Clear demo schema data
 *     description: Removes all demo schema data from the database
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Demo data cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Demo data cleared successfully"
 *                 deletedCounts:
 *                   type: object
 *                   properties:
 *                     optionValues:
 *                       type: integer
 *                     optionSets:
 *                       type: integer
 *                     modelSchemas:
 *                       type: integer
 *                     modules:
 *                       type: integer
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */

async function clearDemoData() {
  // Delete in correct order due to foreign key constraints
  
  // Delete option values first (they reference option sets)
  const deletedOptionValues = await db
    .delete(optionValues)
    .where(isNull(optionSets.tenantId))
    .returning({ id: optionValues.id });

  // Delete option sets (platform-wide ones with null tenantId)
  const deletedOptionSets = await db
    .delete(optionSets)
    .where(isNull(optionSets.tenantId))
    .returning({ id: optionSets.id });

  // Delete model schemas (platform-wide ones with null tenantId)
  const deletedModelSchemas = await db
    .delete(modelSchemas)
    .where(isNull(modelSchemas.tenantId))
    .returning({ id: modelSchemas.id });

  // Delete modules
  const deletedModules = await db
    .delete(modules)
    .returning({ id: modules.id });

  return {
    optionValues: deletedOptionValues.length,
    optionSets: deletedOptionSets.length,
    modelSchemas: deletedModelSchemas.length,
    modules: deletedModules.length
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has admin permissions using enhanced role system
    const user = session.user as any;
    const enhancedRole = user.enhancedRole;
    const isAdmin = enhancedRole && ['super_admin', 'tenant_admin'].includes(enhancedRole.roleName);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin permissions required' },
        { status: 403 }
      );
    }

    // Clear the demo data
    const deletedCounts = await clearDemoData();

    const totalDeleted = Object.values(deletedCounts).reduce((sum, count) => sum + count, 0);

    return NextResponse.json({
      success: true,
      message: `Demo data cleared successfully. Removed ${totalDeleted} items total.`,
      deletedCounts
    });

  } catch (error) {
    console.error('Error clearing demo data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to clear demo data' 
      },
      { status: 500 }
    );
  }
} 