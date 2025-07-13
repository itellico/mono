import { NextRequest, NextResponse } from 'next/server';
import { canAccessAPI, extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { logger } from '@/lib/logger';
import { getRedisClient } from '@/lib/redis';
import fs from 'fs/promises';
import path from 'path';

/**
 * @openapi
 * /api/v1/admin/templates/{templateId}:
 *   get:
 *     summary: Get detailed template information
 *     description: Retrieve comprehensive details about a specific template including all data components
 *     tags:
 *       - Admin Templates
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: The template ID to retrieve
 *       - in: query
 *         name: includeData
 *         schema:
 *           type: boolean
 *         description: Include actual template data (categories, option sets, attributes)
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: Check compatibility with specific tenant
 *     responses:
 *       200:
 *         description: Template details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     template:
 *                       type: object
 *                       properties:
 *                         templateId:
 *                           type: string
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         industry:
 *                           type: string
 *                         version:
 *                           type: string
 *                         features:
 *                           type: array
 *                           items:
 *                             type: string
 *                         businessValue:
 *                           type: array
 *                           items:
 *                             type: string
 *                         data:
 *                           type: object
 *                           properties:
 *                             categories:
 *                               type: array
 *                             optionSets:
 *                               type: array
 *                             attributeDefinitions:
 *                               type: array
 *                         compatibility:
 *                           type: object
 *                           properties:
 *                             isCompatible:
 *                               type: boolean
 *                             conflicts:
 *                               type: array
 *                             recommendations:
 *                               type: array
 *                 meta:
 *                   type: object
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    // Check permissions
    const userContext = await extractUserContext(request);
    const hasAccess = canAccessAPI(userContext, '/api/v1/admin/templates', 'GET');
    if (!hasAccess.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient permissions to access template details' 
        },
        { status: 403 }
      );
    }

    const { templateId } = params;
    const { searchParams } = new URL(request.url);
    const includeData = searchParams.get('includeData') === 'true';
    const tenantId = searchParams.get('tenantId');

    // Try to get from cache first
    const redis = await getRedisClient();
    const cacheKey = `cache:global:template:${templateId}:${includeData}:${tenantId || 'none'}`;
    
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.info('Template details retrieved from cache', { templateId, cacheKey });
          return NextResponse.json(JSON.parse(cached));
        }
      } catch (cacheError) {
        logger.warn('Redis cache error in template details', { error: cacheError });
      }
    }

    // Load template info
    const templatesDir = path.join(process.cwd(), 'src/data/templates');
    const templateDir = path.join(templatesDir, templateId);
    const templateInfoPath = path.join(templateDir, 'template-info.json');

    try {
      await fs.access(templateDir);
    } catch {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Template not found' 
        },
        { status: 404 }
      );
    }

    // Load template info
    const infoContent = await fs.readFile(templateInfoPath, 'utf-8');
    const templateInfo = JSON.parse(infoContent);

    // Load template data if requested
    const templateData: any = {};
    if (includeData) {
      try {
        // Load categories
        const categoriesPath = path.join(templateDir, 'categories.json');
        try {
          const categoriesContent = await fs.readFile(categoriesPath, 'utf-8');
          templateData.categories = JSON.parse(categoriesContent);
        } catch {
          templateData.categories = [];
        }

        // Load option sets
        const optionSetsPath = path.join(templateDir, 'option-sets.json');
        try {
          const optionSetsContent = await fs.readFile(optionSetsPath, 'utf-8');
          templateData.optionSets = JSON.parse(optionSetsContent);
        } catch {
          templateData.optionSets = [];
        }

        // Load attribute definitions
        const attributesPath = path.join(templateDir, 'attribute-definitions.json');
        try {
          const attributesContent = await fs.readFile(attributesPath, 'utf-8');
          templateData.attributeDefinitions = JSON.parse(attributesContent);
        } catch {
          templateData.attributeDefinitions = [];
        }
      } catch (error) {
        logger.warn('Failed to load some template data files', { templateId, error });
      }
    }

    // Check compatibility if tenant ID provided
    let compatibility: any = {};
    if (tenantId) {
      compatibility = await checkTemplateCompatibility(templateId, tenantId);
    }

    const template = {
      ...templateInfo,
      data: includeData ? templateData : undefined,
      compatibility: tenantId ? compatibility : undefined
    };

    const response = {
      success: true,
      data: {
        template
      },
      meta: {
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    };

    // Cache the response
    if (redis) {
      try {
        await redis.setex(cacheKey, 600, JSON.stringify(response)); // 10 minutes cache
      } catch (cacheError) {
        logger.warn('Failed to cache template details', { error: cacheError });
      }
    }

    logger.info('Template details retrieved successfully', {
      templateId,
      includeData,
      tenantId,
      dataSize: includeData ? Object.keys(templateData).length : 0
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Failed to retrieve template details', { templateId: params.templateId, error });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve template details' 
      },
      { status: 500 }
    );
  }
}

/**
 * Check template compatibility with tenant's existing data
 */
async function checkTemplateCompatibility(templateId: string, tenantId: string) {
  // TODO: Implement actual compatibility checking
  // This would check for conflicts with existing categories, option sets, etc.
  
  return {
    isCompatible: true,
    conflicts: [],
    recommendations: [
      'Consider backing up existing data before import',
      'Review category hierarchies for potential overlaps'
    ],
    riskLevel: 'low' // low, medium, high
  };
} 