import { PrismaClient } from '@prisma/client';
import { FastifyRedis } from '@fastify/redis';
import { z } from 'zod';
import type { FastifyBaseLogger } from 'fastify';
import { getOrSetCache } from '../utils/cache-utils';

// Input validation schemas
const createFeatureSetSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().min(1).max(50),
  isActive: z.boolean().default(true),
  
  // Feature configuration
  features: z.record(z.any()),
  dependencies: z.array(z.string()).default([]),
  conflicts: z.array(z.string()).default([]),
  
  // Subscription tiers
  availableInTiers: z.array(z.string()).default(['free']),
  minimumTier: z.string().default('free'),
  
  // API and service configurations
  apiEndpoints: z.record(z.any()).optional(),
  serviceConfig: z.record(z.any()).optional(),
  databaseSchema: z.record(z.any()).optional(),
  
  // UI and permissions
  uiComponents: z.record(z.any()).optional(),
  permissions: z.array(z.string()).default([]),
  navigationItems: z.record(z.any()).optional(),
  
  // Metadata
  complexity: z.enum(['simple', 'medium', 'advanced']).default('medium'),
  resourceUsage: z.enum(['low', 'medium', 'high']).default('low'),
  setupRequired: z.boolean().default(false),
  version: z.string().default('1.0.0'),
});

const updateFeatureSetSchema = createFeatureSetSchema.partial();

const searchFeatureSetsSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  minimumTier: z.string().optional(),
  complexity: z.enum(['simple', 'medium', 'advanced']).optional(),
  resourceUsage: z.enum(['low', 'medium', 'high']).optional(),
  isActive: z.boolean().optional(),
  availableInTier: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['name', 'category', 'minimumTier', 'complexity', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const enableFeatureSetSchema = z.object({
  tenantId: z.number().int().positive(),
  featureSetId: z.number().int().positive(),
  config: z.record(z.any()).optional(),
});

const checkFeatureCompatibilitySchema = z.object({
  tenantId: z.number().int().positive(),
  featureSetIds: z.array(z.number().int().positive()),
});

export type CreateFeatureSetInput = z.infer<typeof createFeatureSetSchema>;
export type UpdateFeatureSetInput = z.infer<typeof updateFeatureSetSchema>;
export type SearchFeatureSetsInput = z.infer<typeof searchFeatureSetsSchema>;
export type EnableFeatureSetInput = z.infer<typeof enableFeatureSetSchema>;
export type CheckFeatureCompatibilityInput = z.infer<typeof checkFeatureCompatibilitySchema>;

export class FeatureSetService {
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
   * Create feature set
   */
  async createFeatureSet(input: CreateFeatureSetInput) {
    const validated = createFeatureSetSchema.parse(input);

    // Check if slug already exists
    const existingFeatureSet = await this.prisma.featureSet.findUnique({
      where: { slug: validated.slug },
    });

    if (existingFeatureSet) {
      throw new Error('Feature set with this slug already exists');
    }

    const featureSet = await this.prisma.featureSet.create({
      data: {
        ...validated,
        apiEndpoints: validated.apiEndpoints || {},
        serviceConfig: validated.serviceConfig || {},
        databaseSchema: validated.databaseSchema || {},
        uiComponents: validated.uiComponents || {},
        navigationItems: validated.navigationItems || {},
      },
    });

    // Invalidate feature set cache
    await this.invalidateFeatureSetCache();

    return featureSet;
  }

  /**
   * Update feature set
   */
  async updateFeatureSet(id: number, updates: UpdateFeatureSetInput) {
    const validated = updateFeatureSetSchema.parse(updates);

    const existingFeatureSet = await this.prisma.featureSet.findUnique({
      where: { id },
    });

    if (!existingFeatureSet) {
      throw new Error('Feature set not found');
    }

    // Check slug uniqueness if being updated
    if (validated.slug && validated.slug !== existingFeatureSet.slug) {
      const duplicateSlug = await this.prisma.featureSet.findFirst({
        where: {
          slug: validated.slug,
          id: { not: id },
        },
      });

      if (duplicateSlug) {
        throw new Error('Feature set with this slug already exists');
      }
    }

    const featureSet = await this.prisma.featureSet.update({
      where: { id },
      data: validated,
    });

    // Invalidate feature set cache
    await this.invalidateFeatureSetCache();

    return featureSet;
  }

  /**
   * Get feature set by ID or slug (cached)
   */
  async getFeatureSet(identifier: number | string) {
    const isNumeric = typeof identifier === 'number';
    const cacheKey = isNumeric 
      ? `feature-set:${identifier}`
      : `feature-set:slug:${identifier}`;

    return getOrSetCache(
      this.redis,
      cacheKey,
      1800, // 30 minutes
      async () => {
        const where = isNumeric 
          ? { id: identifier as number }
          : { slug: identifier as string };

        return this.prisma.featureSet.findUnique({
          where,
          include: {
            tenantFeatures: {
              where: { isActive: true },
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
   * Search feature sets
   */
  async searchFeatureSets(input: SearchFeatureSetsInput) {
    const validated = searchFeatureSetsSchema.parse(input);

    const where: any = {};

    if (validated.search) {
      where.OR = [
        { name: { contains: validated.search, mode: 'insensitive' } },
        { description: { contains: validated.search, mode: 'insensitive' } },
        { category: { contains: validated.search, mode: 'insensitive' } },
      ];
    }

    if (validated.category) {
      where.category = validated.category;
    }

    if (validated.minimumTier) {
      where.minimumTier = validated.minimumTier;
    }

    if (validated.complexity) {
      where.complexity = validated.complexity;
    }

    if (validated.resourceUsage) {
      where.resourceUsage = validated.resourceUsage;
    }

    if (validated.isActive !== undefined) {
      where.isActive = validated.isActive;
    }

    if (validated.availableInTier) {
      where.availableInTiers = {
        has: validated.availableInTier,
      };
    }

    const orderBy: any = {};
    orderBy[validated.sortBy] = validated.sortOrder;

    const [featureSets, total] = await Promise.all([
      this.prisma.featureSet.findMany({
        where,
        orderBy,
        skip: validated.offset,
        take: validated.limit,
        include: {
          _count: {
            select: {
              tenantFeatures: {
                where: { isActive: true },
              },
            },
          },
        },
      }),
      this.prisma.featureSet.count({ where }),
    ]);

    return {
      featureSets,
      total,
      hasMore: validated.offset + validated.limit < total,
    };
  }

  /**
   * Enable feature set for tenant
   */
  async enableFeatureSet(input: EnableFeatureSetInput) {
    const validated = enableFeatureSetSchema.parse(input);

    // Get feature set details
    const featureSet = await this.prisma.featureSet.findUnique({
      where: { id: validated.featureSetId },
    });

    if (!featureSet) {
      throw new Error('Feature set not found');
    }

    // Check if feature set is active
    if (!featureSet.isActive) {
      throw new Error('Feature set is not active');
    }

    // Check for dependency satisfaction
    if (featureSet.dependencies.length > 0) {
      const enabledDependencies = await this.prisma.tenantFeatureSet.findMany({
        where: {
          tenantId: validated.tenantId,
          isActive: true,
          featureSet: {
            uuid: { in: featureSet.dependencies },
          },
        },
      });

      if (enabledDependencies.length !== featureSet.dependencies.length) {
        const missingDeps = featureSet.dependencies.filter(dep => 
          !enabledDependencies.some(enabled => enabled.featureSet)
        );
        throw new Error(`Missing required dependencies: ${missingDeps.join(', ')}`);
      }
    }

    // Check for conflicts
    if (featureSet.conflicts.length > 0) {
      const conflictingFeatures = await this.prisma.tenantFeatureSet.findMany({
        where: {
          tenantId: validated.tenantId,
          isActive: true,
          featureSet: {
            uuid: { in: featureSet.conflicts },
          },
        },
        include: {
          featureSet: {
            select: { name: true },
          },
        },
      });

      if (conflictingFeatures.length > 0) {
        const conflictNames = conflictingFeatures.map(f => f.featureSet.name);
        throw new Error(`Conflicts with enabled features: ${conflictNames.join(', ')}`);
      }
    }

    // Enable feature set
    const result = await this.prisma.tenantFeatureSet.upsert({
      where: {
        tenantId_featureSetId: {
          tenantId: validated.tenantId,
          featureSetId: validated.featureSetId,
        },
      },
      update: {
        isActive: true,
        disabledAt: null,
        config: validated.config || {},
      },
      create: {
        tenantId: validated.tenantId,
        featureSetId: validated.featureSetId,
        config: validated.config || {},
        isActive: true,
      },
    });

    // Invalidate related caches
    await this.invalidateTenantCache(validated.tenantId);
    await this.invalidateFeatureSetCache();

    return result;
  }

  /**
   * Disable feature set for tenant
   */
  async disableFeatureSet(tenantId: number, featureSetId: number) {
    // Check if other features depend on this one
    const dependentFeatures = await this.prisma.tenantFeatureSet.findMany({
      where: {
        tenantId,
        isActive: true,
        featureSet: {
          dependencies: {
            has: (await this.prisma.featureSet.findUnique({
              where: { id: featureSetId },
              select: { uuid: true },
            }))?.uuid,
          },
        },
      },
      include: {
        featureSet: {
          select: { name: true },
        },
      },
    });

    if (dependentFeatures.length > 0) {
      const dependentNames = dependentFeatures.map(f => f.featureSet.name);
      throw new Error(`Cannot disable: Required by ${dependentNames.join(', ')}`);
    }

    const result = await this.prisma.tenantFeatureSet.update({
      where: {
        tenantId_featureSetId: {
          tenantId,
          featureSetId,
        },
      },
      data: {
        isActive: false,
        disabledAt: new Date(),
      },
    });

    // Invalidate related caches
    await this.invalidateTenantCache(tenantId);
    await this.invalidateFeatureSetCache();

    return result;
  }

  /**
   * Get tenant enabled features
   */
  async getTenantFeatures(tenantId: number) {
    const cacheKey = `tenant:${tenantId}:feature-sets`;

    return getOrSetCache(
      this.redis,
      cacheKey,
      900, // 15 minutes
      async () => {
        return this.prisma.tenantFeatureSet.findMany({
          where: {
            tenantId,
            isActive: true,
          },
          include: {
            featureSet: true,
          },
          orderBy: {
            enabledAt: 'desc',
          },
        });
      }
    );
  }

  /**
   * Check tenant feature access
   */
  async hasTenantFeature(tenantId: number, featureSlug: string): Promise<boolean> {
    const cacheKey = `tenant:${tenantId}:feature:${featureSlug}`;

    return getOrSetCache(
      this.redis,
      cacheKey,
      300, // 5 minutes
      async () => {
        const feature = await this.prisma.tenantFeatureSet.findFirst({
          where: {
            tenantId,
            isActive: true,
            featureSet: {
              slug: featureSlug,
            },
          },
        });

        return !!feature;
      }
    );
  }

  /**
   * Check feature compatibility
   */
  async checkFeatureCompatibility(input: CheckFeatureCompatibilityInput) {
    const validated = checkFeatureCompatibilitySchema.parse(input);

    // Get all requested feature sets
    const featureSets = await this.prisma.featureSet.findMany({
      where: {
        id: { in: validated.featureSetIds },
      },
    });

    if (featureSets.length !== validated.featureSetIds.length) {
      throw new Error('Some feature sets not found');
    }

    // Check for conflicts between requested features
    const conflicts: Array<{ feature1: string; feature2: string }> = [];

    for (let i = 0; i < featureSets.length; i++) {
      for (let j = i + 1; j < featureSets.length; j++) {
        const feature1 = featureSets[i];
        const feature2 = featureSets[j];

        if (feature1.conflicts.includes(feature2.uuid) || 
            feature2.conflicts.includes(feature1.uuid)) {
          conflicts.push({
            feature1: feature1.name,
            feature2: feature2.name,
          });
        }
      }
    }

    // Check dependency satisfaction
    const missingDependencies: Array<{ feature: string; missingDeps: string[] }> = [];
    const allFeatureUuids = featureSets.map(f => f.uuid);

    for (const feature of featureSets) {
      const missing = feature.dependencies.filter(dep => !allFeatureUuids.includes(dep));
      if (missing.length > 0) {
        missingDependencies.push({
          feature: feature.name,
          missingDeps: missing,
        });
      }
    }

    return {
      compatible: conflicts.length === 0 && missingDependencies.length === 0,
      conflicts,
      missingDependencies,
      featureSets: featureSets.map(f => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        minimumTier: f.minimumTier,
        complexity: f.complexity,
        resourceUsage: f.resourceUsage,
      })),
    };
  }

  /**
   * Get feature sets by category
   */
  async getFeaturesByCategory() {
    const cacheKey = 'feature-sets:by-category';

    return getOrSetCache(
      this.redis,
      cacheKey,
      3600, // 1 hour
      async () => {
        const categories = await this.prisma.featureSet.groupBy({
          by: ['category'],
          where: {
            isActive: true,
          },
          _count: {
            category: true,
          },
          orderBy: {
            category: 'asc',
          },
        });

        const result: Record<string, any[]> = {};

        for (const category of categories) {
          const features = await this.prisma.featureSet.findMany({
            where: {
              category: category.category,
              isActive: true,
            },
            orderBy: { name: 'asc' },
            include: {
              _count: {
                select: {
                  tenantFeatures: {
                    where: { isActive: true },
                  },
                },
              },
            },
          });

          result[category.category] = features;
        }

        return result;
      }
    );
  }

  /**
   * Get feature set statistics
   */
  async getFeatureSetStats() {
    const cacheKey = 'feature-sets:stats';

    return getOrSetCache(
      this.redis,
      cacheKey,
      1800, // 30 minutes
      async () => {
        const [totalFeatureSets, activeFeatureSets, totalActivations] = await Promise.all([
          this.prisma.featureSet.count(),
          this.prisma.featureSet.count({
            where: { isActive: true },
          }),
          this.prisma.tenantFeatureSet.count({
            where: { isActive: true },
          }),
        ]);

        // Get usage by category
        const categoryUsage = await this.prisma.featureSet.groupBy({
          by: ['category'],
          where: { isActive: true },
          _count: { category: true },
        });

        // Get usage by tier
        const tierUsage = await this.prisma.featureSet.groupBy({
          by: ['minimumTier'],
          where: { isActive: true },
          _count: { minimumTier: true },
        });

        return {
          totalFeatureSets,
          activeFeatureSets,
          totalActivations,
          categoryUsage: categoryUsage.reduce((acc, curr) => {
            acc[curr.category] = curr._count.category;
            return acc;
          }, {} as Record<string, number>),
          tierUsage: tierUsage.reduce((acc, curr) => {
            acc[curr.minimumTier] = curr._count.minimumTier;
            return acc;
          }, {} as Record<string, number>),
        };
      }
    );
  }

  /**
   * Private helper methods
   */
  private async invalidateFeatureSetCache() {
    const patterns = [
      'feature-set:*',
      'feature-sets:*',
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
      `tenant:${tenantId}:feature-sets`,
      `tenant:${tenantId}:feature:*`,
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