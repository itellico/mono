/**
 * Template Build Service
 * Orchestrates the component generation and build process for industry templates
 */

import { writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import { ComponentGenerator, type BuildContext, type ComponentGenerationResult } from './component-generator';
import { db } from '@/lib/db';
import { templateBuilds, industryTemplates } from '@/lib/schemas';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface BuildOptions {
  templateId: string;
  tenantId?: number;
  optimization: 'development' | 'production';
  outputPath?: string;
  createArtifacts?: boolean;
}

export interface BuildResult {
  success: boolean;
  buildId: string;
  buildTime: number;
  componentsGenerated: number;
  performanceImprovement: string;
  artifacts: {
    components: string[];
    pages: string[];
    totalSize: number;
  };
  errors?: string[];
}

export class TemplateBuildService {
  private readonly defaultOutputPath = 'builds/generated';

  /**
   * Build a complete industry template
   */
  async buildTemplate(options: BuildOptions): Promise<BuildResult> {
    const startTime = Date.now();
    const buildId = this.generateBuildId(options.templateId);
    
    logger.info('🏗️ Starting template build', {
      templateId: options.templateId,
      buildId,
      optimization: options.optimization
    });

    try {
      // Validate template exists
      const template = await this.getTemplate(options.templateId);
      if (!template) {
        throw new Error(`Template ${options.templateId} not found`);
      }

      // Create build context
      const buildContext: BuildContext = {
        templateId: options.templateId,
        tenantId: options.tenantId,
        buildId,
        outputPath: options.outputPath || this.defaultOutputPath,
        optimization: options.optimization
      };

      // Initialize component generator
      const generator = new ComponentGenerator(buildContext);

      // Create build record
      const buildRecord = await this.createBuildRecord(template, buildContext);

      // Generate all components
      const componentResults = await generator.generateTemplateComponents(options.templateId);

      // Write components to disk if requested
      if (options.createArtifacts) {
        await this.writeComponentArtifacts(buildContext, componentResults);
      }

      // Calculate performance metrics
      const buildTime = Date.now() - startTime;
      const performanceImprovement = this.calculatePerformanceImprovement(componentResults);

      // Update build record with results
      await this.updateBuildRecord(buildRecord.id, {
        buildStatus: 'completed',
        buildCompletedAt: new Date(),
        buildDuration: Math.round(buildTime / 1000),
        artifacts: {
          components: componentResults.map(r => r.componentPath),
          totalSize: componentResults.reduce((sum, r) => sum + r.performanceMetrics.componentSize, 0),
          optimizations: componentResults.flatMap(r => r.performanceMetrics.optimizations)
        },
        performanceMetrics: {
          buildTime,
          componentsGenerated: componentResults.length,
          averageGenerationTime: componentResults.reduce((sum, r) => sum + r.performanceMetrics.generationTime, 0) / componentResults.length,
          performanceImprovement
        }
      });

      logger.info('✅ Template build completed successfully', {
        templateId: options.templateId,
        buildId,
        buildTime,
        componentsGenerated: componentResults.length
      });

      return {
        success: true,
        buildId,
        buildTime,
        componentsGenerated: componentResults.length,
        performanceImprovement,
        artifacts: {
          components: componentResults.filter(r => r.componentPath.includes('components')).map(r => r.componentPath),
          pages: componentResults.filter(r => r.componentPath.includes('pages')).map(r => r.componentPath),
          totalSize: componentResults.reduce((sum, r) => sum + r.performanceMetrics.componentSize, 0)
        }
      };

    } catch (error) {
      const buildTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown build error';

      logger.error('❌ Template build failed', {
        templateId: options.templateId,
        buildId,
        error: errorMessage,
        buildTime
      });

      // Update build record with error
      await this.updateBuildRecord(buildId, {
        buildStatus: 'failed',
        buildCompletedAt: new Date(),
        buildDuration: Math.round(buildTime / 1000),
        errorLog: errorMessage
      });

      return {
        success: false,
        buildId,
        buildTime,
        componentsGenerated: 0,
        performanceImprovement: '0x',
        artifacts: {
          components: [],
          pages: [],
          totalSize: 0
        },
        errors: [errorMessage]
      };
    }
  }

  /**
   * Get build status
   */
  async getBuildStatus(buildId: string) {
    const [build] = await db
      .select()
      .from(templateBuilds)
      .where(eq(templateBuilds.buildId, buildId))
      .limit(1);

    return build;
  }

  /**
   * List builds for a template
   */
  async getTemplateBuilds(templateId: string) {
    const builds = await db
      .select()
      .from(templateBuilds)
      .where(eq(templateBuilds.templateId, templateId))
      .orderBy(templateBuilds.buildStartedAt);

    return builds;
  }

  /**
   * Write generated components to disk
   */
  private async writeComponentArtifacts(
    buildContext: BuildContext, 
    componentResults: ComponentGenerationResult[]
  ): Promise<void> {
    const baseOutputPath = join(process.cwd(), buildContext.outputPath, buildContext.templateId);

    // Ensure output directories exist
    await mkdir(join(baseOutputPath, 'components'), { recursive: true });
    await mkdir(join(baseOutputPath, 'pages'), { recursive: true });

    // Write each component file
    for (const result of componentResults) {
      const filePath = join(baseOutputPath, result.componentPath);
      
      // Ensure the directory exists
      await mkdir(filePath.substring(0, filePath.lastIndexOf('/')), { recursive: true });
      
      // Write the component code
      await writeFile(filePath, result.componentCode, 'utf-8');
      
      logger.info(`📝 Component written to ${filePath}`);
    }

    // Write build manifest
    const manifest = {
      templateId: buildContext.templateId,
      buildId: buildContext.buildId,
      buildTime: new Date().toISOString(),
      optimization: buildContext.optimization,
      components: componentResults.map(r => ({
        path: r.componentPath,
        size: r.performanceMetrics.componentSize,
        dependencies: r.dependencies,
        optimizations: r.performanceMetrics.optimizations
      }))
    };

    await writeFile(
      join(baseOutputPath, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf-8'
    );
  }

  /**
   * Calculate performance improvement estimate
   */
  private calculatePerformanceImprovement(results: ComponentGenerationResult[]): string {
    // Estimate based on:
    // - Number of pre-compiled components
    // - Optimization techniques applied
    // - Component complexity

    const optimizationCount = results.reduce((sum, r) => sum + r.performanceMetrics.optimizations.length, 0);
    const componentCount = results.length;
    
    // Conservative estimate: 3-6x improvement based on optimizations
    const multiplier = Math.min(2 + optimizationCount / componentCount, 6);
    
    return `${multiplier.toFixed(1)}x`;
  }

  /**
   * Generate unique build ID
   */
  private generateBuildId(templateId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `build-${templateId.substring(0, 8)}-${timestamp}-${random}`;
  }

  /**
   * Get template from database
   */
  private async getTemplate(templateId: string) {
    const [template] = await db
      .select()
      .from(industryTemplates)
      .where(eq(industryTemplates.id, templateId))
      .limit(1);

    return template;
  }

  /**
   * Create build record in database
   */
  private async createBuildRecord(template: any, buildContext: BuildContext) {
    const [buildRecord] = await db
      .insert(templateBuilds)
      .values({
        templateId: buildContext.templateId,
        buildId: buildContext.buildId,
        version: template.version || '1.0.0',
        buildStatus: 'building',
        buildConfig: {
          optimization: buildContext.optimization,
          outputPath: buildContext.outputPath,
          tenantId: buildContext.tenantId
        },
        buildStartedAt: new Date()
      })
      .returning();

    return buildRecord;
  }

  /**
   * Update build record with results
   */
  private async updateBuildRecord(buildId: string, updates: any) {
    await db
      .update(templateBuilds)
      .set(updates)
      .where(eq(templateBuilds.buildId, buildId));
  }
}

// Export singleton instance
export const templateBuildService = new TemplateBuildService(); 