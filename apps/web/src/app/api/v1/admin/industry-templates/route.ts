/**
 * @openapi
 * /api/v1/admin/industry-templates:
 *   get:
 *     tags:
 *       - Industry Templates
 *     summary: List industry templates
 *     description: Retrieve a paginated list of industry templates with filtering options
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of templates per page
 *       - in: query
 *         name: industryType
 *         schema:
 *           type: string
 *           enum: [modeling, photography, fitness, entertainment, music, sports, corporate, healthcare, education, real_estate]
 *         description: Filter by industry type
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *         description: Filter by published status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in template names
 *     responses:
 *       200:
 *         description: List of industry templates
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 *   post:
 *     tags:
 *       - Industry Templates
 *     summary: Create industry template
 *     description: Create a new industry template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - displayName
 *               - industryType
 *               - configuration
 *             properties:
 *               name:
 *                 type: string
 *                 example: "fitness-pro-template"
 *               displayName:
 *                 type: object
 *                 example: { "en": "Fitness Pro Template" }
 *               industryType:
 *                 type: string
 *                 enum: [modeling, photography, fitness, entertainment, music, sports, corporate, healthcare, education, real_estate]
 *               configuration:
 *                 type: object
 *                 example: { "theme": { "primaryColor": "#007bff" } }
 *     responses:
 *       201:
 *         description: Industry template created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { industryTemplateService } from '@/lib/services/industry-template.service';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const industryType = searchParams.get('industryType');
    const isPublished = searchParams.get('isPublished');
    const search = searchParams.get('search');

    // Build filters
    const filters: any = {};
    if (industryType) filters.industryType = industryType;
    if (isPublished !== null) filters.isPublished = isPublished === 'true';
    if (search) filters.search = search;

    // Get templates
    const result = await industryTemplateService.listTemplates(filters, { page, limit });

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });

  } catch (error) {
    console.error('Error in GET /api/v1/admin/industry-templates:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { name, displayName, description, industryType, version, configuration } = body;

    // Validate required fields
    if (!name || !displayName || !industryType || !configuration) {
      return NextResponse.json(
        { success: false, error: 'Bad request', message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create template
    const template = await industryTemplateService.createTemplate({
      name,
      displayName,
      description: description || {},
      industryType,
      version: version || '1.0.0',
      configuration,
      isActive: true,
      isPublished: false
    });

    return NextResponse.json({
      success: true,
      data: template,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/v1/admin/industry-templates:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to create template' },
      { status: 500 }
    );
  }
} 