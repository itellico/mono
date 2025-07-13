/**
 * @openapi
 * /api/v1/admin/industry-templates/{id}/build:
 *   post:
 *     summary: Build an industry template
 *     description: Generate optimized React components from an industry template configuration
 *     tags:
 *       - Admin - Industry Templates
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Industry template ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               optimization:
 *                 type: string
 *                 enum: [development, production]
 *                 default: development
 *                 description: Build optimization level
 *               createArtifacts:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to create build artifacts on disk
 *               outputPath:
 *                 type: string
 *                 description: Custom output path for artifacts
 *     responses:
 *       200:
 *         description: Build completed successfully
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
 *                     buildId:
 *                       type: string
 *                     buildTime:
 *                       type: number
 *                     componentsGenerated:
 *                       type: number
 *                     performanceImprovement:
 *                       type: string
 *                     artifacts:
 *                       type: object
 *                       properties:
 *                         components:
 *                           type: array
 *                           items:
 *                             type: string
 *                         pages:
 *                           type: array
 *                           items:
 *                             type: string
 *                         totalSize:
 *                           type: number
 *                 meta:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *       400:
 *         description: Invalid request parameters
 *       404:
 *         description: Template not found
 *       500:
 *         description: Build failed
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     buildId:
 *                       type: string
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 */

import { NextRequest, NextResponse } from 'next/server';
import { templateBuildService, type BuildOptions } from '@/lib/build/template-build.service';
import { IndustryTemplateService } from '@/lib/services/industry-template.service';
import { logger } from '@/lib/logger';

interface BuildRequestBody {
  optimization?: 'development' | 'production';
  createArtifacts?: boolean;
  outputPath?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;

    // Validate template exists
    const templateService = new IndustryTemplateService();
    const template = await templateService.getTemplate(templateId);
    
    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template not found',
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        },
        { status: 404 }
      );
    }

    // Parse request body
    const body: BuildRequestBody = await request.json();

    // Validate build options
    if (body.optimization && !['development', 'production'].includes(body.optimization)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid optimization level. Must be "development" or "production"',
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        },
        { status: 400 }
      );
    }

    // Prepare build options
    const buildOptions: BuildOptions = {
      templateId,
      optimization: body.optimization || 'development',
      createArtifacts: body.createArtifacts !== false, // Default to true
      outputPath: body.outputPath
    };

    logger.info('🏗️ Starting template build via API', {
      templateId,
      templateName: template.name,
      buildOptions
    });

    // Execute build
    const buildResult = await templateBuildService.buildTemplate(buildOptions);

    if (buildResult.success) {
      logger.info('✅ Template build completed successfully', {
        templateId,
        buildId: buildResult.buildId,
        buildTime: buildResult.buildTime,
        componentsGenerated: buildResult.componentsGenerated
      });

      return NextResponse.json({
        success: true,
        data: {
          buildId: buildResult.buildId,
          buildTime: buildResult.buildTime,
          componentsGenerated: buildResult.componentsGenerated,
          performanceImprovement: buildResult.performanceImprovement,
          artifacts: buildResult.artifacts,
          template: {
            id: template.id,
            name: template.name,
            industryType: template.industryType,
            version: template.version
          }
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });

    } else {
      logger.error('❌ Template build failed', {
        templateId,
        buildId: buildResult.buildId,
        errors: buildResult.errors
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Build failed',
          data: {
            buildId: buildResult.buildId,
            buildTime: buildResult.buildTime,
            errors: buildResult.errors || ['Unknown build error']
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        },
        { status: 500 }
      );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('❌ Build API endpoint error', {
      templateId: params.id,
      error: errorMessage
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /api/v1/admin/industry-templates/{id}/build:
 *   get:
 *     summary: Get template build history
 *     description: Retrieve all builds for a specific industry template
 *     tags:
 *       - Admin - Industry Templates
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Industry template ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Build history retrieved successfully
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
 *                     builds:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           buildId:
 *                             type: string
 *                           version:
 *                             type: string
 *                           buildStatus:
 *                             type: string
 *                           buildStartedAt:
 *                             type: string
 *                             format: date-time
 *                           buildCompletedAt:
 *                             type: string
 *                             format: date-time
 *                           buildDuration:
 *                             type: number
 *                           performanceMetrics:
 *                             type: object
 *                     total:
 *                       type: number
 *       404:
 *         description: Template not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;

    // Validate template exists
    const templateService = new IndustryTemplateService();
    const template = await templateService.getTemplate(templateId);
    
    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template not found',
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        },
        { status: 404 }
      );
    }

    // Get build history
    const builds = await templateBuildService.getTemplateBuilds(templateId);

    logger.info('📋 Retrieved template build history', {
      templateId,
      buildsCount: builds.length
    });

    return NextResponse.json({
      success: true,
      data: {
        builds,
        total: builds.length,
        template: {
          id: template.id,
          name: template.name,
          industryType: template.industryType,
          version: template.version
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('❌ Build history API endpoint error', {
      templateId: params.id,
      error: errorMessage
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      },
      { status: 500 }
    );
  }
} 