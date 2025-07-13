import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { modelSchemas } from '@/lib/schemas';
import { eq, asc, and } from 'drizzle-orm';
import { logApiRequest, logApiResponse, logError } from '@/lib/logger';

/**
 * @openapi
 * /api/v1/model-schemas:
 *   get:
 *     summary: Get all model schemas
 *     description: Retrieves all available model schemas with optional filtering
 *     tags:
 *       - Model Schemas
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: Filter by tenant ID (optional)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by schema type
 *       - in: query
 *         name: subType
 *         schema:
 *           type: string
 *         description: Filter by schema sub-type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Successful response
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                       subType:
 *                         type: string
 *                       displayName:
 *                         type: object
 *                       schema:
 *                         type: object
 *                       isActive:
 *                         type: boolean
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     timestamp:
 *                       type: string
 *       500:
 *         description: Internal server error
 */

export async function GET(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');
    const type = searchParams.get('type');
    const subType = searchParams.get('subType');
    const isActive = searchParams.get('isActive');

    logApiRequest('GET', '/api/v1/model-schemas', correlationId, { 
      tenantId, type, subType, isActive 
    });

    // Build query conditions
    const conditions = [];
    
    if (tenantId) {
      conditions.push(eq(modelSchemas.tenantId, tenantId));
    }
    
    if (type) {
      conditions.push(eq(modelSchemas.type, type));
    }
    
    if (subType) {
      conditions.push(eq(modelSchemas.subType, subType));
    }
    
    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(modelSchemas.isActive, isActive === 'true'));
    }

    // Fetch model schemas
    const schemasList = await db
      .select()
      .from(modelSchemas)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(modelSchemas.type), asc(modelSchemas.subType));

    const response = {
      success: true,
      data: schemasList,
      meta: {
        total: schemasList.length,
        timestamp: new Date().toISOString()
      }
    };

    const duration = Date.now() - startTime;
    logApiResponse('GET', '/api/v1/model-schemas', 200, correlationId, duration, { 
      total: schemasList.length 
    });

    return NextResponse.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logError(error instanceof Error ? error : new Error(String(error)), { correlationId });
    logApiResponse('GET', '/api/v1/model-schemas', 500, correlationId, duration, { error: errorMessage });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch model schemas'
      },
      { status: 500 }
    );
  }
} 