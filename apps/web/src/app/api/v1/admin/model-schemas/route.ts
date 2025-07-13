import { NextRequest, NextResponse } from 'next/server';
import { withMiddleware } from '@/lib/api-middleware';
import { ModelSchemasService } from '@/lib/services/model-schemas.service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

/**
 * @openapi
 * /api/v1/admin/model-schemas:
 *   get:
 *     summary: Get model schemas
 *     description: Retrieve paginated list of model schemas with search and filtering
 *     tags:
 *       - Model Schemas
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for schema names
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, human_model, freelancer, profile, business]
 *         description: Filter by schema type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, inactive]
 *         description: Filter by schema status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of items per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of items to skip
 *     responses:
 *       200:
 *         description: Successfully retrieved model schemas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ModelSchema'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 *   post:
 *     summary: Create model schema
 *     description: Create a new model schema with validation
 *     tags:
 *       - Model Schemas
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - subType
 *               - displayName
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [human_model, freelancer, profile, business]
 *                 description: Schema type
 *               subType:
 *                 type: string
 *                 pattern: '^[a-zA-Z0-9_-]+$'
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Schema sub-type identifier
 *               displayName:
 *                 type: object
 *                 properties:
 *                   en-US:
 *                     type: string
 *                     minLength: 2
 *                     maxLength: 100
 *                 description: Localized display names
 *               description:
 *                 type: object
 *                 properties:
 *                   en-US:
 *                     type: string
 *                 description: Localized descriptions
 *               schema:
 *                 type: object
 *                 properties:
 *                   fields:
 *                     type: array
 *                     items:
 *                       type: object
 *                   version:
 *                     type: string
 *                 description: Schema field definitions
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether schema is active
 *     responses:
 *       201:
 *         description: Model schema created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ModelSchema'
 *                 meta:
 *                   $ref: '#/components/schemas/ResponseMeta'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Schema with this type/subType already exists
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */

// Validation schemas
const getModelSchemasSchema = z.object({
  search: z.string().optional(),
  type: z.enum(['all', 'human_model', 'freelancer', 'profile', 'business']).default('all'),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['name', 'type', 'created', 'updated']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const createModelSchemaSchema = z.object({
  type: z.enum(['human_model', 'freelancer', 'profile', 'business']),
  subType: z.string()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Sub-type can only contain letters, numbers, underscores, and hyphens'),
  displayName: z.record(z.string().min(2).max(100)),
  description: z.record(z.string()).optional(),
  schema: z.object({
    fields: z.array(z.any()).default([]),
    version: z.string().default('1.0.0'),
  }),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/v1/admin/model-schemas
 * Get model schemas with search and filtering
 */
async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const params = getModelSchemasSchema.parse({
      search: searchParams.get('search'),
      type: searchParams.get('type'),
      status: searchParams.get('status'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    logger.apiRequest('get_model_schemas', {
      params,
      userAgent: request.headers.get('user-agent'),
    });

    // Get data from service layer
    const schemas = await ModelSchemasService.getModelSchemas(params);

    logger.apiResponse('get_model_schemas', {
      resultCount: schemas.length,
      params,
    });

    return NextResponse.json({
      success: true,
      data: schemas,
      meta: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        pagination: {
          page: Math.floor(params.offset / params.limit) + 1,
          limit: params.limit,
          total: schemas.length,
          totalPages: Math.ceil(schemas.length / params.limit),
        },
      },
    });

  } catch (error) {
    logger.error('get_model_schemas_error', {
      error: error.message,
      stack: error.stack,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: error.issues,
          meta: {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        meta: {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/model-schemas
 * Create a new model schema
 */
async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createModelSchemaSchema.parse(body);

    logger.apiRequest('create_model_schema', {
      type: validatedData.type,
      subType: validatedData.subType,
      userAgent: request.headers.get('user-agent'),
    });

    // Create schema through service layer
    const newSchema = await ModelSchemasService.createModelSchema(validatedData);

    logger.apiResponse('create_model_schema', {
      schemaId: newSchema.id,
      type: validatedData.type,
      subType: validatedData.subType,
    });

    return NextResponse.json(
      {
        success: true,
        data: newSchema,
        meta: {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 201 }
    );

  } catch (error) {
    logger.error('create_model_schema_error', {
      error: error.message,
      stack: error.stack,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.issues,
          meta: {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    if (error.message.includes('already exists')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Schema with this type and sub-type already exists',
          meta: {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        meta: {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// Export handlers with unified middleware
export const { GET: wrappedGET, POST: wrappedPOST } = withMiddleware({
  GET,
  POST,
}, {
  requireAuth: true,
  permissions: {
    GET: {
      action: 'model_schemas.read.global',
      resource: 'admin',
    },
    POST: {
      action: 'model_schemas.create.global',
      resource: 'admin',
    },
  },
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,     // 100 requests per minute
  },
  cache: {
    GET: {
      ttl: 30 * 60, // 30 minutes
      tags: ['model-schemas'],
    },
  },
  audit: {
    logRequests: true,
    logResponses: true,
    sensitiveFields: [],
  },
});

// Export the wrapped handlers
export { wrappedGET as GET, wrappedPOST as POST }; 