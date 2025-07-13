import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { modules, type CreateModuleData, type ModuleConfiguration } from '@/lib/schemas/modules';
import { eq, and, desc, ilike, or } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { getAllModuleTypes, getModuleType } from '@/lib/config/module-types';

// Validation schemas
const createModuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  moduleType: z.enum(['profile_form', 'search_interface', 'detail_page', 'listing_page', 'application_form', 'card_component']),
  modelSchemaId: z.string().uuid().optional(),
  configuration: z.record(z.any()).default({}),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

const updateModuleSchema = createModuleSchema.partial();

const querySchema = z.object({
  search: z.string().optional(),
  moduleType: z.string().optional(),
  status: z.string().optional(),
  modelSchemaId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['name', 'created_at', 'updated_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/v1/admin/modules
 * Fetch modules with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { search, moduleType, status, modelSchemaId, limit, offset, sortBy, sortOrder } = querySchema.parse(queryParams);

    // Get tenant ID from session
    const tenantId = (session.user as any).tenant?.id || (session.user as any).tenantId || 4;

    logger.info('[API:modules] Fetching modules', { 
      userId: session.user.id,
      tenantId,
      filters: { search, moduleType, status, modelSchemaId }
    });

    // Build query conditions
    const conditions = [
      eq(modules.tenantId, tenantId)
    ];

    if (search) {
      conditions.push(
        or(
          ilike(modules.name, `%${search}%`),
          ilike(modules.description, `%${search}%`)
        )
      );
    }

    if (moduleType) {
      conditions.push(eq(modules.moduleType, moduleType as any));
    }

    if (status) {
      conditions.push(eq(modules.status, status as any));
    }

    if (modelSchemaId) {
      conditions.push(eq(modules.modelSchemaId, modelSchemaId));
    }

    // Execute query with relations
    const result = await (db as any).query.modules.findMany({
      where: and(...conditions),
      with: {
        modelSchema: true,
        createdByUser: {
          columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      limit,
      offset,
      orderBy: sortOrder === 'desc' ? desc(modules[sortBy]) : modules[sortBy],
    });

    // Get total count for pagination
    const totalCount = await db.$count(modules, and(...conditions));

    logger.info('[API:modules] Modules retrieved successfully', { 
      count: result.length,
      totalCount 
    });

    return NextResponse.json({
      success: true,
      data: result,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    logger.error('[API:modules] Failed to fetch modules', { error });
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/modules
 * Create a new module
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createModuleSchema.parse(body);

    // Get tenant ID from session
    const tenantId = (session.user as any).tenant?.id || (session.user as any).tenantId || 4;

    logger.info('[API:modules] Creating module', { 
      userId: session.user.id,
      tenantId,
      moduleName: validatedData.name,
      moduleType: validatedData.moduleType
    });

    // Get default configuration for module type
    const moduleTypeConfig = getModuleType(validatedData.moduleType);
    const defaultConfiguration = moduleTypeConfig?.defaultConfiguration || {};

    // Merge provided configuration with defaults
    const configuration = {
      ...defaultConfiguration,
      ...validatedData.configuration,
    } as ModuleConfiguration;

    // Create module
    const [newModule] = await db.insert(modules).values({
      tenantId,
      name: validatedData.name,
      description: validatedData.description,
      moduleType: validatedData.moduleType,
      modelSchemaId: validatedData.modelSchemaId,
      configuration,
      status: validatedData.status,
      createdBy: session.user.id,
    }).returning();

    // Fetch the created module with relations
    const moduleWithRelations = await (db as any).query.modules.findFirst({
      where: eq(modules.id, newModule.id),
      with: {
        modelSchema: true,
        createdByUser: {
          columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    logger.info('[API:modules] Module created successfully', { 
      moduleId: newModule.id,
      moduleName: newModule.name
    });

    return NextResponse.json({
      success: true,
      data: moduleWithRelations
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('[API:modules] Failed to create module', { error });
    return NextResponse.json(
      { error: 'Failed to create module' },
      { status: 500 }
    );
  }
} 