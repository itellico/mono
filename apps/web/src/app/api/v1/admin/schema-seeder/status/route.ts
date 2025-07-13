import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * @openapi
 * /api/v1/admin/schema-seeder/status:
 *   get:
 *     tags:
 *       - Admin - Schema Seeder
 *     summary: Get demo schema seeder status
 *     description: Returns the current status of the demo schema seeder including data counts
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Seeder status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSeeded:
 *                   type: boolean
 *                   description: Whether demo data has been seeded
 *                 lastSeededAt:
 *                   type: string
 *                   format: date-time
 *                   description: When data was last seeded
 *                 optionSetsCount:
 *                   type: integer
 *                   description: Number of existing option sets
 *                 modelSchemasCount:
 *                   type: integer
 *                   description: Number of existing model schemas
 *                 modulesCount:
 *                   type: integer
 *                   description: Number of existing UI modules
 *                 canSeed:
 *                   type: boolean
 *                   description: Whether seeding can be performed
 *                 warnings:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Any warnings about the current state
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */

export async function GET(request: NextRequest) {
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

    // Get counts of existing data
    const [optionSetsResult, modelSchemasResult, modulesResult] = await Promise.all([
      prisma.optionSet.count({
        where: { tenantId: null },
      }),
      prisma.modelSchema.count({
        where: { tenantId: null },
      }),
      prisma.module.count(),
    ]);

    const optionSetsCount = optionSetsResult || 0;
    const modelSchemasCount = modelSchemasResult || 0;
    const modulesCount = modulesResult || 0;

    // Determine if data has been seeded (heuristic: if we have demo data)
    const hasOptionSets = optionSetsCount >= 10; // We expect 11 option sets
    const hasModelSchemas = modelSchemasCount >= 2; // We expect 2 model schemas
    const hasModules = modulesCount >= 4; // We expect 4 modules

    const isSeeded = hasOptionSets && hasModelSchemas && hasModules;

    // Check if seeding can be performed
    // For now, allow seeding even if data exists (will update existing)
    const canSeed = true;

    // Generate warnings
    const warnings: string[] = [];
    if (optionSetsCount > 0 && !hasOptionSets) {
      warnings.push(`Found ${optionSetsCount} option sets but expected 11+ for complete demo data`);
    }
    if (modelSchemasCount > 0 && !hasModelSchemas) {
      warnings.push(`Found ${modelSchemasCount} model schemas but expected 2+ for complete demo data`);
    }
    if (modulesCount > 0 && !hasModules) {
      warnings.push(`Found ${modulesCount} modules but expected 4+ for complete demo data`);
    }

    return NextResponse.json({
      isSeeded,
      lastSeededAt: isSeeded ? new Date().toISOString() : undefined, // Would track this in metadata
      optionSetsCount,
      modelSchemasCount,
      modulesCount,
      canSeed,
      warnings
    });

  } catch (error) {
    console.error('Error checking seeder status:', error);
    return NextResponse.json(
      { error: 'Failed to check seeder status' },
      { status: 500 }
    );
  }
} 