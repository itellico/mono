import { PrismaClient } from '@prisma/client';
import { FastifyRedis } from '@fastify/redis';
import { z } from 'zod';
import type { FastifyBaseLogger } from 'fastify';
import { getOrSetCache } from '../utils/cache-utils';

// Input validation schemas
const createIndustryTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().min(1).max(50),
  industry: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  
  // Template configuration
  defaultSettings: z.record(z.any()).optional(),
  defaultCategories: z.array(z.any()).optional(),
  defaultTags: z.array(z.any()).optional(),
  defaultRoles: z.array(z.any()).optional(),
  defaultPermissions: z.array(z.any()).optional(),
  defaultWorkflows: z.array(z.any()).optional(),
  requiredFeatures: z.array(z.string()).default([]),
  recommendedFeatures: z.array(z.string()).default([]),
  
  // Branding and theming
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  customCss: z.string().optional(),
  emailTemplates: z.record(z.any()).optional(),
  
  // Metadata
  targetUserTypes: z.array(z.string()).default([]),
  complexity: z.enum(['simple', 'medium', 'advanced']).default('medium'),
  setupTimeMinutes: z.number().int().min(1).default(30),
  version: z.string().default('1.0.0'),
});

const updateIndustryTemplateSchema = createIndustryTemplateSchema.partial();

const searchIndustryTemplatesSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  industry: z.string().optional(),
  complexity: z.enum(['simple', 'medium', 'advanced']).optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['name', 'industry', 'popularity', 'usageCount', 'createdAt']).default('popularity'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const applyTemplateSchema = z.object({
  tenantId: z.number().int().positive(),
  templateId: z.number().int().positive(),
  customizations: z.record(z.any()).optional(),
  skipExisting: z.boolean().default(false),
});

export type CreateIndustryTemplateInput = z.infer<typeof createIndustryTemplateSchema>;
export type UpdateIndustryTemplateInput = z.infer<typeof updateIndustryTemplateSchema>;
export type SearchIndustryTemplatesInput = z.infer<typeof searchIndustryTemplatesSchema>;
export type ApplyTemplateInput = z.infer<typeof applyTemplateSchema>;

export class IndustryTemplateService {
  private prisma: PrismaClient;
  private redis: FastifyRedis;
  private logger?: FastifyBaseLogger;

  constructor(
    prisma: PrismaClient,
    redis: FastifyRedis,
    logger?: FastifyBaseLogger
  ) {
    this.prisma = prisma;
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Create industry template
   */
  async createIndustryTemplate(input: CreateIndustryTemplateInput) {
    const validated = createIndustryTemplateSchema.parse(input);

    // Check if slug already exists
    const existingTemplate = await this.prisma.industryTemplate.findUnique({
      where: { slug: validated.slug },
    });

    if (existingTemplate) {
      throw new Error('Industry template with this slug already exists');
    }

    const template = await this.prisma.industryTemplate.create({
      data: {
        ...validated,
        defaultSettings: validated.defaultSettings || {},
        defaultCategories: validated.defaultCategories || [],
        defaultTags: validated.defaultTags || [],
        defaultRoles: validated.defaultRoles || [],
        defaultPermissions: validated.defaultPermissions || [],
        defaultWorkflows: validated.defaultWorkflows || [],
        emailTemplates: validated.emailTemplates || {},
      },
    });

    // Invalidate template cache
    await this.invalidateTemplateCache();

    return template;
  }

  /**
   * Update industry template
   */
  async updateIndustryTemplate(id: number, updates: UpdateIndustryTemplateInput) {
    const validated = updateIndustryTemplateSchema.parse(updates);

    const existingTemplate = await this.prisma.industryTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      throw new Error('Industry template not found');
    }

    // Check slug uniqueness if being updated
    if (validated.slug && validated.slug !== existingTemplate.slug) {
      const duplicateSlug = await this.prisma.industryTemplate.findFirst({
        where: {
          slug: validated.slug,
          id: { not: id },
        },
      });

      if (duplicateSlug) {
        throw new Error('Industry template with this slug already exists');
      }
    }

    const template = await this.prisma.industryTemplate.update({
      where: { id },
      data: validated,
    });

    // Invalidate template cache
    await this.invalidateTemplateCache();

    return template;
  }

  /**
   * Get industry template by ID or slug (cached)
   */
  async getIndustryTemplate(identifier: number | string) {
    const isNumeric = typeof identifier === 'number';
    const cacheKey = isNumeric 
      ? `industry-template:${identifier}`
      : `industry-template:slug:${identifier}`;

    return getOrSetCache(
      this.redis,
      cacheKey,
      1800, // 30 minutes
      async () => {
        const where = isNumeric 
          ? { id: identifier as number }
          : { slug: identifier as string };

        return this.prisma.industryTemplate.findUnique({
          where,
          include: {
            tenants: {
              include: {
                tenant: {
                  select: {
                    id: true,
                    uuid: true,
                    name: true,
                    domain: true,
                  },
                },
              },
            },
          },
        });
      }
    );
  }

  /**
   * Search industry templates
   */
  async searchIndustryTemplates(input: SearchIndustryTemplatesInput) {
    const validated = searchIndustryTemplatesSchema.parse(input);

    const where: any = {};

    if (validated.search) {
      where.OR = [
        { name: { contains: validated.search, mode: 'insensitive' } },
        { description: { contains: validated.search, mode: 'insensitive' } },
        { industry: { contains: validated.search, mode: 'insensitive' } },
      ];
    }

    if (validated.category) {
      where.category = validated.category;
    }

    if (validated.industry) {
      where.industry = validated.industry;
    }

    if (validated.complexity) {
      where.complexity = validated.complexity;
    }

    if (validated.isActive !== undefined) {
      where.isActive = validated.isActive;
    }

    const orderBy: any = {};
    orderBy[validated.sortBy] = validated.sortOrder;

    const [templates, total] = await Promise.all([
      this.prisma.industryTemplate.findMany({
        where,
        orderBy,
        skip: validated.offset,
        take: validated.limit,
        include: {
          _count: {
            select: {
              tenants: true,
            },
          },
        },
      }),
      this.prisma.industryTemplate.count({ where }),
    ]);

    return {
      templates,
      total,
      hasMore: validated.offset + validated.limit < total,
    };
  }

  /**
   * Apply industry template to tenant
   */
  async applyIndustryTemplate(input: ApplyTemplateInput) {
    const validated = applyTemplateSchema.parse(input);

    // Get template details
    const template = await this.prisma.industryTemplate.findUnique({
      where: { id: validated.templateId },
    });

    if (!template) {
      throw new Error('Industry template not found');
    }

    // Check if already applied
    const existingApplication = await this.prisma.tenantIndustryTemplate.findFirst({
      where: {
        tenantId: validated.tenantId,
        industryTemplateId: validated.templateId,
      },
    });

    if (existingApplication && !validated.skipExisting) {
      throw new Error('Template already applied to this tenant');
    }

    // Apply template in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create or update template application
      const templateApplication = await tx.tenantIndustryTemplate.upsert({
        where: {
          tenantId_industryTemplateId: {
            tenantId: validated.tenantId,
            industryTemplateId: validated.templateId,
          },
        },
        update: {
          customizations: validated.customizations || {},
          isActive: true,
        },
        create: {
          tenantId: validated.tenantId,
          industryTemplateId: validated.templateId,
          customizations: validated.customizations || {},
          isActive: true,
        },
      });

      // Update tenant with template defaults (if not already set)
      const currentTenant = await tx.tenant.findUnique({
        where: { id: validated.tenantId },
      });

      if (currentTenant) {
        const updateData: any = {};

        // Apply default settings if tenant doesn't have them
        if (!currentTenant.settings && template.defaultSettings) {
          updateData.settings = template.defaultSettings;
        }

        // Apply default categories if tenant doesn't have them
        if (!currentTenant.categories && template.defaultCategories) {
          updateData.categories = template.defaultCategories;
        }

        // Apply default features if tenant doesn't have them
        if (!currentTenant.features && template.requiredFeatures.length > 0) {
          updateData.features = {
            enabled: template.requiredFeatures,
            recommended: template.recommendedFeatures,
          };
        }

        if (Object.keys(updateData).length > 0) {
          await tx.tenant.update({
            where: { id: validated.tenantId },
            data: updateData,
          });
        }
      }

      // Increment usage count
      await tx.industryTemplate.update({
        where: { id: validated.templateId },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });

      return templateApplication;
    });

    // Invalidate related caches
    await this.invalidateTenantCache(validated.tenantId);
    await this.invalidateTemplateCache();

    return result;
  }

  /**
   * Get templates applied to tenant
   */
  async getTenantTemplates(tenantId: number) {
    const cacheKey = `tenant:${tenantId}:industry-templates`;

    return getOrSetCache(
      this.redis,
      cacheKey,
      900, // 15 minutes
      async () => {
        return this.prisma.tenantIndustryTemplate.findMany({
          where: {
            tenantId,
            isActive: true,
          },
          include: {
            industryTemplate: true,
          },
          orderBy: {
            appliedAt: 'desc',
          },
        });
      }
    );
  }

  /**
   * Get popular templates
   */
  async getPopularTemplates(limit: number = 10) {
    const cacheKey = `industry-templates:popular:${limit}`;

    return getOrSetCache(
      this.redis,
      cacheKey,
      3600, // 1 hour
      async () => {
        return this.prisma.industryTemplate.findMany({
          where: {
            isActive: true,
          },
          orderBy: [
            { usageCount: 'desc' },
            { popularity: 'desc' },
          ],
          take: limit,
          include: {
            _count: {
              select: {
                tenants: true,
              },
            },
          },
        });
      }
    );
  }

  /**
   * Get template categories
   */
  async getTemplateCategories() {
    const cacheKey = 'industry-templates:categories';

    return getOrSetCache(
      this.redis,
      cacheKey,
      3600, // 1 hour
      async () => {
        const categories = await this.prisma.industryTemplate.groupBy({
          by: ['category'],
          where: {
            isActive: true,
          },
          _count: {
            category: true,
          },
          orderBy: {
            _count: {
              category: 'desc',
            },
          },
        });

        return categories.map(cat => ({
          name: cat.category,
          count: cat._count.category,
        }));
      }
    );
  }

  /**
   * Get template statistics
   */
  async getTemplateStats() {
    const cacheKey = 'industry-templates:stats';

    return getOrSetCache(
      this.redis,
      cacheKey,
      1800, // 30 minutes
      async () => {
        const [totalTemplates, activeTemplates, totalApplications, categoryCounts] = await Promise.all([
          this.prisma.industryTemplate.count(),
          this.prisma.industryTemplate.count({
            where: { isActive: true },
          }),
          this.prisma.tenantIndustryTemplate.count({
            where: { isActive: true },
          }),
          this.prisma.industryTemplate.groupBy({
            by: ['category'],
            _count: { category: true },
          }),
        ]);

        return {
          totalTemplates,
          activeTemplates,
          totalApplications,
          categoryCounts: categoryCounts.reduce((acc, curr) => {
            acc[curr.category] = curr._count.category;
            return acc;
          }, {} as Record<string, number>),
        };
      }
    );
  }

  /**
   * Private helper methods
   */
  private async invalidateTemplateCache() {
    const patterns = [
      'industry-template:*',
      'industry-templates:*',
    ];

    await Promise.all(
      patterns.map(pattern => this.redis.eval(
        `for _,k in ipairs(redis.call('keys', ARGV[1])) do redis.call('del', k) end`,
        0,
        pattern
      ))
    );
  }

  private async invalidateTenantCache(tenantId: number) {
    const patterns = [
      `tenant:${tenantId}:industry-templates`,
      `tenant:${tenantId}:*`,
    ];

    await Promise.all(
      patterns.map(pattern => this.redis.eval(
        `for _,k in ipairs(redis.call('keys', ARGV[1])) do redis.call('del', k) end`,
        0,
        pattern
      ))
    );
  }
}