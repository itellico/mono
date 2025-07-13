import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { optionSets, optionValues } from '@/lib/schemas';
import { eq, asc, inArray, and } from 'drizzle-orm';
import { logApiRequest, logApiResponse, logError } from '@/lib/logger';

/**
 * @openapi
 * /api/v1/option-sets:
 *   get:
 *     summary: Get all option sets with their values
 *     description: Retrieves all available option sets along with their option values
 *     tags:
 *       - Option Sets
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: Filter by tenant ID (optional)
 *       - in: query
 *         name: slug
 *         schema:
 *           type: string
 *         description: Filter by specific option set slug
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
 *                         type: integer
 *                       slug:
 *                         type: string
 *                       label:
 *                         type: string
 *                       tenantId:
 *                         type: integer
 *                         nullable: true
 *                       values:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             label:
 *                               type: string
 *                             value:
 *                               type: string
 *                             order:
 *                               type: integer
 *                             isDefault:
 *                               type: boolean
 *                             regionalMappings:
 *                               type: object
 *                             metadata:
 *                               type: object
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     timestamp:
 *                       type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 */
export async function GET(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');
    const slug = searchParams.get('slug');

    logApiRequest('GET', '/api/v1/option-sets', correlationId, { tenantId, slug });

    // Build query conditions
    const conditions = [];
    
    if (tenantId) {
      conditions.push(eq(optionSets.tenantId, parseInt(tenantId)));
    }
    
    if (slug) {
      conditions.push(eq(optionSets.slug, slug));
    }

    // Fetch option sets
    const optionSetsList = await db
      .select()
      .from(optionSets)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(optionSets.label));

    // Fetch all option values for the retrieved option sets
    const optionSetIds = optionSetsList.map(os => os.id);
    
    let optionValuesList: typeof optionValues.$inferSelect[] = [];
    if (optionSetIds.length > 0) {
      optionValuesList = await db
        .select()
        .from(optionValues)
        .where(inArray(optionValues.optionSetId, optionSetIds))
        .orderBy(asc(optionValues.order), asc(optionValues.label));
    }

    // Group values by option set
    const optionSetsWithValues = optionSetsList.map(optionSet => ({
      ...optionSet,
      values: optionValuesList.filter(val => val.optionSetId === optionSet.id)
    }));

    const response = {
      success: true,
      data: optionSetsWithValues,
      meta: {
        total: optionSetsWithValues.length,
        timestamp: new Date().toISOString()
      }
    };

    const duration = Date.now() - startTime;
    logApiResponse('GET', '/api/v1/option-sets', 200, correlationId, duration, { total: optionSetsWithValues.length });

    return NextResponse.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logError(error instanceof Error ? error : new Error(String(error)), { correlationId });
    logApiResponse('GET', '/api/v1/option-sets', 500, correlationId, duration, { error: errorMessage });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch option sets'
      },
      { status: 500 }
    );
  }
} 