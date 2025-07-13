import { NextRequest, NextResponse } from 'next/server';
import { canAccessAPI, extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { logger } from '@/lib/logger';
import { getRedisClient } from '@/lib/redis';
import fs from 'fs/promises';
import path from 'path';

/**
 * @openapi
 * /api/v1/admin/templates:
 *   get:
 *     summary: List all available industry templates
 *     description: Retrieve all industry templates with optional filtering and search
 *     tags:
 *       - Admin Templates
 *     parameters:
 *       - in: query
 *         name: industry
 *         schema:
 *           type: string
 *         description: Filter by industry type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search templates by name or description
 *       - in: query
 *         name: includeStats
 *         schema:
 *           type: boolean
 *         description: Include usage statistics
 *     responses:
 *       200:
 *         description: List of templates retrieved successfully
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
 *                     templates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           templateId:
 *                             type: string
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           industry:
 *                             type: string
 *                           subIndustry:
 *                             type: string
 *                           version:
 *                             type: string
 *                           includes:
 *                             type: object
 *                             properties:
 *                               categories:
 *                                 type: number
 *                               optionSets:
 *                                 type: number
 *                               attributeDefinitions:
 *                                 type: number
 *                           tags:
 *                             type: array
 *                             items:
 *                               type: string
 *                           targetAudience:
 *                             type: array
 *                             items:
 *                               type: string
 *                           compatibility:
 *                             type: object
 *                           stats:
 *                             type: object
 *                             properties:
 *                               totalImports:
 *                                 type: number
 *                               lastImported:
 *                                 type: string
 *                               popularityScore:
 *                                 type: number
 *                     meta:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         industries:
 *                           type: array
 *                           items:
 *                             type: string
 *                 meta:
 *                   type: object
 *                   properties:
 *                     version:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // Check permissions
    const userContext = await extractUserContext(request);
    const hasAccess = canAccessAPI(userContext, '/api/v1/admin/templates', 'GET');
    if (!hasAccess.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient permissions to access templates' 
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const industryFilter = searchParams.get('industry');
    const searchQuery = searchParams.get('search');
    const includeStats = searchParams.get('includeStats') === 'true';

    // Try to get from cache first
    const redis = await getRedisClient();
    const cacheKey = `cache:global:templates:list:${industryFilter || 'all'}:${searchQuery || 'all'}:${includeStats}`;
    
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.info('Templates list retrieved from cache', { cacheKey });
          return NextResponse.json(JSON.parse(cached));
        }
      } catch (cacheError) {
        logger.warn('Redis cache error in templates list', { error: cacheError });
      }
    }

    // Load template registry
    const templatesDir = path.join(process.cwd(), 'src/data/templates');
    const registryPath = path.join(templatesDir, 'template-registry.json');
    
    const registryContent = await fs.readFile(registryPath, 'utf-8');
    const registry = JSON.parse(registryContent);

    // Load detailed info for each template
    const templatesWithDetails = await Promise.all(
      registry.templates.map(async (template: any) => {
        try {
          const templateInfoPath = path.join(templatesDir, template.templateId, 'template-info.json');
          const infoContent = await fs.readFile(templateInfoPath, 'utf-8');
          const templateInfo = JSON.parse(infoContent);

          // Merge registry info with detailed info
          const fullTemplate = {
            ...template,
            ...templateInfo,
            stats: includeStats ? await getTemplateStats(template.templateId) : undefined
          };

          return fullTemplate;
        } catch (error) {
          logger.warn('Failed to load template details', { 
            templateId: template.templateId, 
            error 
          });
          return {
            ...template,
            stats: includeStats ? { totalImports: 0, lastImported: null, popularityScore: 0 } : undefined
          };
        }
      })
    );

    // Apply filters
    let filteredTemplates = templatesWithDetails;

    if (industryFilter) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.industry === industryFilter
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredTemplates = filteredTemplates.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    // Get unique industries for metadata
    const allIndustries = [...new Set(templatesWithDetails.map(t => t.industry))];

    const response = {
      success: true,
      data: {
        templates: filteredTemplates,
        meta: {
          total: filteredTemplates.length,
          industries: allIndustries,
          registryVersion: registry.templateRegistry.version
        }
      },
      meta: {
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    };

    // Cache the response
    if (redis) {
      try {
        await redis.setex(cacheKey, 300, JSON.stringify(response)); // 5 minutes cache
      } catch (cacheError) {
        logger.warn('Failed to cache templates list', { error: cacheError });
      }
    }

    logger.info('Templates list retrieved successfully', {
      total: filteredTemplates.length,
      industryFilter,
      searchQuery,
      includeStats
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Failed to retrieve templates list', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve templates' 
      },
      { status: 500 }
    );
  }
}

/**
 * Get template usage statistics
 */
async function getTemplateStats(templateId: string) {
  // TODO: Implement actual stats from database
  // For now, return mock data
  return {
    totalImports: Math.floor(Math.random() * 100),
    lastImported: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    popularityScore: Math.floor(Math.random() * 10)
  };
} 