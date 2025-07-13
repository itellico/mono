/**
 * Industry Content Service
 * 
 * Manages industry-specific tags, categories, and content seeding
 * based on platform configuration and tenant industry selection.
 */

import { logger } from '@/lib/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Platform config interface for TypeScript
interface IndustryConfig {
  name: string;
  description: string;
  defaultCategories: Array<{
    slug: string;
    name: string;
    description: string;
    subcategories?: Array<{
      slug: string;
      name: string;
    }>;
  }>;
  defaultTags: Array<{
    slug: string;
    name: string;
    category: string;
    type: string;
  }>;
}

interface PlatformConfig {
  industries: Record<string, IndustryConfig>;
  features: {
    enableIndustrySpecificContent: boolean;
    enableAutoContentSeeding: boolean;
  };
}

// Load platform config (in production, this would be cached)
function getPlatformConfig(): PlatformConfig {
  try {
    // Dynamic import of platform config
    const config = require('../../../platform.config.js');
    return config;
  } catch (error) {
    logger.error('Failed to load platform config', { error });
    throw new Error('Platform configuration not available');
  }
}

export class IndustryContentService {
  
  /**
   * Get available industries from platform config
   */
  static getAvailableIndustries(): Array<{ key: string; name: string; description: string }> {
    const config = getPlatformConfig();
    
    return Object.entries(config.industries).map(([key, industry]) => ({
      key,
      name: industry.name,
      description: industry.description
    }));
  }

  /**
   * Get industry-specific configuration
   */
  static getIndustryConfig(industryKey: string): IndustryConfig | null {
    const config = getPlatformConfig();
    return config.industries[industryKey] || null;
  }

  /**
   * Seed categories for a specific industry and tenant
   */
  static async seedIndustryCategories(
    tenantId: number, 
    industryKey: string,
    options: { 
      replaceExisting?: boolean;
      includeGlobalCategories?: boolean;
    } = {}
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    const { replaceExisting = false, includeGlobalCategories = true } = options;
    const config = getPlatformConfig();
    const industry = config.industries[industryKey];
    
    if (!industry) {
      throw new Error(`Industry '${industryKey}' not found in platform configuration`);
    }

    if (!config.features.enableIndustrySpecificContent) {
      logger.warn('Industry-specific content is disabled in platform config');
      return { created: 0, updated: 0, errors: ['Industry-specific content is disabled'] };
    }

    const results = { created: 0, updated: 0, errors: [] as string[] };

    try {
      logger.info(`Seeding categories for industry '${industryKey}' in tenant ${tenantId}`);

      // Optional: Remove existing industry-specific categories if replacing
      if (replaceExisting) {
        await prisma.category.deleteMany({
          where: {
            tenantId,
            metadata: {
              path: ['industry'],
              equals: industryKey
            }
          }
        });
        logger.info(`Removed existing categories for industry '${industryKey}'`);
      }

      // Create categories from industry config
      for (const categoryConfig of industry.defaultCategories) {
        try {
          // Check if category already exists
          const existingCategory = await prisma.category.findFirst({
            where: {
              tenantId,
              slug: categoryConfig.slug
            }
          });

          if (existingCategory && !replaceExisting) {
            logger.debug(`Category '${categoryConfig.slug}' already exists, skipping`);
            continue;
          }

          // Create or update main category
          const category = await prisma.category.upsert({
            where: {
              tenantId_slug: {
                tenantId,
                slug: categoryConfig.slug
              }
            },
            create: {
              name: categoryConfig.name,
              slug: categoryConfig.slug,
              description: categoryConfig.description,
              tenantId,
              isActive: true,
              metadata: {
                industry: industryKey,
                source: 'industry_template',
                seededAt: new Date().toISOString()
              }
            },
            update: {
              name: categoryConfig.name,
              description: categoryConfig.description,
              metadata: {
                industry: industryKey,
                source: 'industry_template',
                updatedAt: new Date().toISOString()
              }
            }
          });

          if (existingCategory) {
            results.updated++;
          } else {
            results.created++;
          }

          logger.debug(`Created/updated category: ${category.name}`);

          // Create subcategories if they exist
          if (categoryConfig.subcategories && categoryConfig.subcategories.length > 0) {
            for (const subCategoryConfig of categoryConfig.subcategories) {
              try {
                const subCategory = await prisma.category.upsert({
                  where: {
                    tenantId_slug: {
                      tenantId,
                      slug: subCategoryConfig.slug
                    }
                  },
                  create: {
                    name: subCategoryConfig.name,
                    slug: subCategoryConfig.slug,
                    tenantId,
                    parentId: category.id,
                    isActive: true,
                    metadata: {
                      industry: industryKey,
                      source: 'industry_template',
                      parentCategory: categoryConfig.slug,
                      seededAt: new Date().toISOString()
                    }
                  },
                  update: {
                    name: subCategoryConfig.name,
                    parentId: category.id,
                    metadata: {
                      industry: industryKey,
                      source: 'industry_template',
                      parentCategory: categoryConfig.slug,
                      updatedAt: new Date().toISOString()
                    }
                  }
                });

                logger.debug(`Created/updated subcategory: ${subCategory.name}`);
                results.created++;
              } catch (error) {
                const errorMsg = `Failed to create subcategory '${subCategoryConfig.slug}': ${error instanceof Error ? error.message : 'Unknown error'}`;
                logger.error(errorMsg);
                results.errors.push(errorMsg);
              }
            }
          }

        } catch (error) {
          const errorMsg = `Failed to create category '${categoryConfig.slug}': ${error instanceof Error ? error.message : 'Unknown error'}`;
          logger.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }

      logger.info(`Category seeding completed for industry '${industryKey}' in tenant ${tenantId}`, {
        created: results.created,
        updated: results.updated,
        errors: results.errors.length
      });

      return results;

    } catch (error) {
      logger.error(`Failed to seed categories for industry '${industryKey}'`, { error, tenantId });
      throw error;
    }
  }

  /**
   * Seed tags for a specific industry and tenant
   */
  static async seedIndustryTags(
    tenantId: number,
    industryKey: string,
    options: {
      replaceExisting?: boolean;
      includeGlobalTags?: boolean;
    } = {}
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    const { replaceExisting = false, includeGlobalTags = true } = options;
    const config = getPlatformConfig();
    const industry = config.industries[industryKey];

    if (!industry) {
      throw new Error(`Industry '${industryKey}' not found in platform configuration`);
    }

    if (!config.features.enableIndustrySpecificContent) {
      logger.warn('Industry-specific content is disabled in platform config');
      return { created: 0, updated: 0, errors: ['Industry-specific content is disabled'] };
    }

    const results = { created: 0, updated: 0, errors: [] as string[] };

    try {
      logger.info(`Seeding tags for industry '${industryKey}' in tenant ${tenantId}`);

      // Optional: Remove existing industry-specific tags if replacing
      if (replaceExisting) {
        await prisma.tag.deleteMany({
          where: {
            tenantId,
            metadata: {
              path: ['industry'],
              equals: industryKey
            }
          }
        });
        logger.info(`Removed existing tags for industry '${industryKey}'`);
      }

      // Create tags from industry config
      for (const tagConfig of industry.defaultTags) {
        try {
          // Check if tag already exists
          const existingTag = await prisma.tag.findFirst({
            where: {
              tenantId,
              slug: tagConfig.slug
            }
          });

          if (existingTag && !replaceExisting) {
            logger.debug(`Tag '${tagConfig.slug}' already exists, skipping`);
            continue;
          }

          // Create or update tag
          const tag = await prisma.tag.upsert({
            where: {
              tenantId_slug: {
                tenantId,
                slug: tagConfig.slug
              }
            },
            create: {
              name: tagConfig.name,
              slug: tagConfig.slug,
              tenantId,
              isActive: true,
              metadata: {
                industry: industryKey,
                source: 'industry_template',
                type: tagConfig.type,
                category: tagConfig.category,
                seededAt: new Date().toISOString()
              }
            },
            update: {
              name: tagConfig.name,
              metadata: {
                industry: industryKey,
                source: 'industry_template',
                type: tagConfig.type,
                category: tagConfig.category,
                updatedAt: new Date().toISOString()
              }
            }
          });

          if (existingTag) {
            results.updated++;
          } else {
            results.created++;
          }

          logger.debug(`Created/updated tag: ${tag.name}`);

        } catch (error) {
          const errorMsg = `Failed to create tag '${tagConfig.slug}': ${error instanceof Error ? error.message : 'Unknown error'}`;
          logger.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }

      logger.info(`Tag seeding completed for industry '${industryKey}' in tenant ${tenantId}`, {
        created: results.created,
        updated: results.updated,
        errors: results.errors.length
      });

      return results;

    } catch (error) {
      logger.error(`Failed to seed tags for industry '${industryKey}'`, { error, tenantId });
      throw error;
    }
  }

  /**
   * Complete industry setup - seeds both categories and tags
   */
  static async setupIndustryContent(
    tenantId: number,
    industryKey: string,
    options: {
      replaceExisting?: boolean;
      includeGlobalContent?: boolean;
    } = {}
  ): Promise<{
    categories: { created: number; updated: number; errors: string[] };
    tags: { created: number; updated: number; errors: string[] };
    success: boolean;
  }> {
    logger.info(`Setting up complete industry content for '${industryKey}' in tenant ${tenantId}`);

    try {
      // Seed categories first
      const categoryResults = await this.seedIndustryCategories(tenantId, industryKey, options);
      
      // Then seed tags
      const tagResults = await this.seedIndustryTags(tenantId, industryKey, options);

      const success = categoryResults.errors.length === 0 && tagResults.errors.length === 0;

      logger.info(`Industry content setup completed for '${industryKey}'`, {
        tenantId,
        success,
        categories: categoryResults,
        tags: tagResults
      });

      return {
        categories: categoryResults,
        tags: tagResults,
        success
      };

    } catch (error) {
      logger.error(`Failed to setup industry content for '${industryKey}'`, { error, tenantId });
      throw error;
    }
  }

  /**
   * Get tags filtered by industry relevance
   */
  static async getIndustryRelevantTags(
    tenantId: number,
    industryKey: string,
    options: {
      includeGlobalTags?: boolean;
      tagType?: string;
    } = {}
  ): Promise<Array<{ id: number; name: string; slug: string; type: string; category: string }>> {
    const { includeGlobalTags = true, tagType } = options;

    try {
      const whereConditions: any = {
        tenantId,
        isActive: true
      };

      if (!includeGlobalTags) {
        whereConditions.metadata = {
          path: ['industry'],
          equals: industryKey
        };
      } else {
        whereConditions.OR = [
          {
            metadata: {
              path: ['industry'],
              equals: industryKey
            }
          },
          {
            metadata: {
              path: ['industry'],
              equals: null
            }
          }
        ];
      }

      if (tagType) {
        whereConditions.metadata = {
          ...whereConditions.metadata,
          path: ['type'],
          equals: tagType
        };
      }

      const tags = await prisma.tag.findMany({
        where: whereConditions,
        select: {
          id: true,
          name: true,
          slug: true,
          metadata: true
        },
        orderBy: [
          { name: 'asc' }
        ]
      });

      return tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        type: (tag.metadata as any)?.type || 'general',
        category: (tag.metadata as any)?.category || 'general'
      }));

    } catch (error) {
      logger.error('Failed to get industry-relevant tags', { error, tenantId, industryKey });
      throw error;
    }
  }

  /**
   * Get categories filtered by industry relevance
   */
  static async getIndustryRelevantCategories(
    tenantId: number,
    industryKey: string,
    options: {
      includeGlobalCategories?: boolean;
      includeSubcategories?: boolean;
    } = {}
  ): Promise<Array<{
    id: number;
    name: string;
    slug: string;
    description?: string;
    parentId?: number;
    subcategories?: Array<{ id: number; name: string; slug: string }>;
  }>> {
    const { includeGlobalCategories = true, includeSubcategories = true } = options;

    try {
      const whereConditions: any = {
        tenantId,
        isActive: true
      };

      if (!includeGlobalCategories) {
        whereConditions.metadata = {
          path: ['industry'],
          equals: industryKey
        };
      } else {
        whereConditions.OR = [
          {
            metadata: {
              path: ['industry'],
              equals: industryKey
            }
          },
          {
            metadata: {
              path: ['industry'],
              equals: null
            }
          }
        ];
      }

      const categories = await prisma.category.findMany({
        where: whereConditions,
        include: includeSubcategories ? {
          children: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        } : undefined,
        orderBy: [
          { name: 'asc' }
        ]
      });

      return categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || undefined,
        parentId: category.parentId || undefined,
        subcategories: includeSubcategories && category.children ? category.children.map(child => ({
          id: child.id,
          name: child.name,
          slug: child.slug
        })) : undefined
      }));

    } catch (error) {
      logger.error('Failed to get industry-relevant categories', { error, tenantId, industryKey });
      throw error;
    }
  }
}

export default IndustryContentService;