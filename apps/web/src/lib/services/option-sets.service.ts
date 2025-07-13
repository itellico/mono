import { db as prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { OptionSetCache } from '@/lib/redis';
import { AVAILABLE_REGIONS, type RegionCode } from '@/lib/constants/regions';
import { AuditService } from '@/lib/services/audit.service';
import { type OptionSet, type OptionValue } from '@prisma/client';

export interface OptionSet {
  id: number;
  slug: string;
  label: string;
  tenantId: number | null;
  createdAt: string;
  values?: OptionValue[];
}

export interface OptionValue {
  id: number;
  optionSetId: number;
  label: string;
  value: string;
  order: number;
  isDefault: boolean;
  canonicalRegion: string;
  regionalMappings: Record<string, string>;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface CreateOptionSetData {
  slug: string;
  label: string;
  tenantId?: number | null;
}

export interface UpdateOptionSetData {
  slug?: string;
  label?: string;
}

export interface CreateOptionValueData {
  optionSetId: number;
  label: string;
  value: string;
  order?: number;
  isDefault?: boolean;
  canonicalRegion?: string;
  regionalMappings?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface UpdateOptionValueData {
  label?: string;
  value?: string;
  order?: number;
  isDefault?: boolean;
  canonicalRegion?: string;
  regionalMappings?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface RegionalMapping {
  region: string;
  value: string;
  displayName?: string;
  conversionFactor?: number;
  notes?: string;
}

export class OptionSetsService {
  /**
   * Get all option sets with optional filtering
   */
  static async getOptionSets(params: {
    tenantId?: number | null;
    search?: string;
    categoryId?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const { tenantId, search, categoryId, limit = 50, offset = 0 } = params;

    try {
      logger.info('[OptionSetsService] Fetching option sets', { tenantId, search, categoryId, limit, offset });

      const whereConditions: any = {};

      if (tenantId !== undefined) {
        if (tenantId === null) {
          whereConditions.tenantId = null;
        } else {
          whereConditions.tenantId = tenantId;
        }
      }
      if (search) {
        whereConditions.OR = [
          { label: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (categoryId) {
        whereConditions.categoryId = categoryId;
      }

      const results = await prisma.optionSet.findMany({
        where: whereConditions,
        include: {
          _count: {
            select: { optionValues: true },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              path: true,
              color: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const transformedResults = results.map(os => ({
        id: os.id,
        slug: os.slug,
        label: os.label,
        tenantId: os.tenantId,
        categoryId: os.categoryId,
        createdAt: os.createdAt.toISOString(),
        valueCount: os._count?.optionValues || 0,
        category: os.category ? {
          id: os.category.id.toString(),
          name: os.category.name,
          slug: os.category.slug,
          path: os.category.path,
          color: os.category.color,
        } : null,
      }));

      logger.info('[OptionSetsService] Option sets retrieved successfully', { 
        count: transformedResults.length,
        tenantId,
        search,
        categoryId
      });

      return transformedResults;
    } catch (error) {
      logger.error('[OptionSetsService] Error fetching option sets', { error, tenantId, search, categoryId });
      throw error;
    }
  }

  /**
   * Get a single option set by ID with its values
   */
  static async getOptionSetById(id: number, tenantId?: number | null) {
    try {
      logger.info('[OptionSetsService] Fetching option set by ID', { id, tenantId });

      // Check cache first
      const cacheKey = OptionSetCache.getCacheKey(tenantId, id.toString());
      const cached = await OptionSetCache.get<OptionSet>(cacheKey);
      if (cached) {
        logger.info('[OptionSetsService] Option set retrieved from cache', { id, tenantId });
        return cached;
      }

      const whereConditions: any = { id: id };
      if (tenantId !== undefined) {
        if (tenantId === null) {
          whereConditions.tenantId = null;
        } else {
          whereConditions.tenantId = tenantId;
        }
      }

      const result = await prisma.optionSet.findFirst({
        where: whereConditions,
      });

      if (!result) {
        logger.warn('[OptionSetsService] Option set not found', { id, tenantId });
        return null;
      }

      // Get the values for this option set
      const rawValues = await prisma.optionValue.findMany({
        where: { optionSetId: id },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' },
        ],
      });

      // Cast JSONB fields to proper types for each value
      const values = rawValues.map(value => ({
        ...value,
        regionalMappings: (value.regionalMappings as Record<string, string>) || {},
        metadata: (value.metadata as Record<string, any>) || {},
        createdAt: value.createdAt.toISOString()
      })) as OptionValue[];

      const optionSetWithValues = {
        ...result,
        createdAt: result.createdAt.toISOString(),
        values
      };

      // Cache the result
      await OptionSetCache.set(cacheKey, optionSetWithValues);

      logger.info('[OptionSetsService] Option set retrieved successfully', { id, tenantId });
      return optionSetWithValues;
    } catch (error) {
      logger.error('[OptionSetsService] Error fetching option set by ID', { error, id, tenantId });
      throw error;
    }
  }

  /**
   * Get option set by slug
   */
  static async getOptionSetBySlug(slug: string, tenantId?: number | null) {
    try {
      logger.info('[OptionSetsService] Fetching option set by slug', { slug, tenantId });

      const whereConditions: any = { slug: slug };
      if (tenantId !== undefined) {
        whereConditions.tenantId = tenantId;
      }

      const result = await prisma.optionSet.findFirst({
        where: whereConditions,
      });

      if (!result) {
        logger.warn('[OptionSetsService] Option set not found by slug', { slug, tenantId });
        return null;
      }

      // Get the values for this option set
      const rawValues = await prisma.optionValue.findMany({
        where: { optionSetId: result.id },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' },
        ],
      });

      // Cast JSONB fields to proper types for each value
      const values = rawValues.map(value => ({
        ...value,
        regionalMappings: (value.regionalMappings as Record<string, string>) || {},
        metadata: (value.metadata as Record<string, any>) || {},
        createdAt: value.createdAt.toISOString()
      })) as OptionValue[];

      const optionSetWithValues = {
        ...result,
        createdAt: result.createdAt.toISOString(),
        values
      };

      logger.info('[OptionSetsService] Option set retrieved by slug successfully', { slug, tenantId });
      return optionSetWithValues;
    } catch (error) {
      logger.error('[OptionSetsService] Error fetching option set by slug', { error, slug, tenantId });
      throw error;
    }
  }

  /**
   * Create a new option set
   */
  static async createOptionSet(data: CreateOptionSetData) {
    try {
      logger.info('[OptionSetsService] Creating option set', { data });

      // Check if slug already exists
      const existing = await this.getOptionSetBySlug(data.slug, data.tenantId);
      if (existing) {
        throw new Error(`Option set with slug "${data.slug}" already exists`);
      }

      const result = await prisma.optionSet.create({
        data: {
          slug: data.slug,
          label: data.label,
          tenantId: data.tenantId || null,
          createdAt: new Date()
        },
      });

      // Audit logging
      await AuditService.logEntityChange(
        data.tenantId || 0, // Assuming 0 for global or a default tenantId if null
        'option_set',
        result.id.toString(),
        'create',
        0, // TODO: Replace with actual userId
        null,
        result,
        { slug: data.slug, label: data.label }
      );

      logger.info('[OptionSetsService] Option set created successfully', { 
        id: result.id,
        slug: data.slug,
        tenantId: data.tenantId 
      });

      return result;
    } catch (error) {
      logger.error('[OptionSetsService] Error creating option set', { error, data });
      throw error;
    }
  }

  /**
   * Update an option set
   */
  static async updateOptionSet(id: number, data: UpdateOptionSetData, tenantId?: number | null) {
    try {
      logger.info('[OptionSetsService] Updating option set', { id, data, tenantId });

      // Check if slug already exists (if updating slug)
      if (data.slug) {
        const existing = await this.getOptionSetBySlug(data.slug, tenantId);
        if (existing && existing.id !== id) {
          throw new Error(`Option set with slug "${data.slug}" already exists`);
        }
      }

      const whereConditions: any = { id: id };
      if (tenantId !== undefined) {
        whereConditions.tenantId = tenantId;
      }

      const existingOptionSet = await prisma.optionSet.findFirst({
        where: whereConditions,
      });

      if (!existingOptionSet) {
        throw new Error('Option set not found or access denied');
      }

      const updatedOptionSet = await prisma.optionSet.update({
        where: whereConditions,
        data: data,
      });

      // Audit logging
      await AuditService.logEntityChange(
        tenantId || 0, // Assuming 0 for global or a default tenantId if null
        'option_set',
        id.toString(),
        'update',
        0, // TODO: Replace with actual userId
        existingOptionSet,
        updatedOptionSet,
        { slug: data.slug, label: data.label }
      );

      logger.info('[OptionSetsService] Option set updated successfully', { id, tenantId });
      return updatedOptionSet;
    } catch (error) {
      logger.error('[OptionSetsService] Error updating option set', { error, id, data, tenantId });
      throw error;
    }
  }

  /**
   * Delete an option set and all its values
   */
  static async deleteOptionSet(id: number, tenantId?: number | null) {
    try {
      logger.info('[OptionSetsService] Deleting option set', { id, tenantId });

      const whereConditions: any = { id: id };
      if (tenantId !== undefined) {
        whereConditions.tenantId = tenantId;
      }

      const existingOptionSet = await prisma.optionSet.findFirst({
        where: whereConditions,
      });

      if (!existingOptionSet) {
        throw new Error('Option set not found or access denied');
      }

      // Delete all values first
      await prisma.optionValue.deleteMany({
        where: { optionSetId: id },
      });

      // Delete the option set
      const deletedOptionSet = await prisma.optionSet.delete({
        where: whereConditions,
      });

      // Audit logging
      await AuditService.logEntityChange(
        tenantId || 0, // Assuming 0 for global or a default tenantId if null
        'option_set',
        id.toString(),
        'delete',
        0, // TODO: Replace with actual userId
        existingOptionSet,
        null,
        { slug: existingOptionSet.slug, label: existingOptionSet.label }
      );

      logger.info('[OptionSetsService] Option set deleted successfully', { id, tenantId });
      return deletedOptionSet;
    } catch (error) {
      logger.error('[OptionSetsService] Error deleting option set', { error, id, tenantId });
      throw error;
    }
  }

  /**
   * Create a new option value
   */
  static async createOptionValue(data: CreateOptionValueData) {
    try {
      logger.info('[OptionSetsService] Creating option value', { data });

      // Get the next order if not provided
      let order = data.order;
      if (order === undefined) {
        const maxOrderResult = await prisma.optionValue.aggregate({
          _max: { order: true },
          where: { optionSetId: data.optionSetId },
        });
        order = (maxOrderResult._max.order || 0) + 1;
      }

      const result = await prisma.optionValue.create({
        data: {
          optionSetId: data.optionSetId,
          label: data.label,
          value: data.value,
          order: order,
          isDefault: data.isDefault || false,
          canonicalRegion: data.canonicalRegion || 'GLOBAL',
          regionalMappings: data.regionalMappings || {},
          metadata: data.metadata || {}
        },
      });

      logger.info('[OptionSetsService] Option value created successfully', { 
        id: result.id,
        optionSetId: data.optionSetId 
      });

      // Cast JSONB fields to proper types
      return {
        ...result,
        regionalMappings: (result.regionalMappings as Record<string, string>) || {},
        metadata: (result.metadata as Record<string, any>) || {},
        createdAt: result.createdAt.toISOString()
      } as OptionValue;
    } catch (error) {
      logger.error('[OptionSetsService] Error creating option value', { error, data });
      throw error;
    }
  }

  /**
   * Update an option value
   */
  static async updateOptionValue(id: number, data: UpdateOptionValueData): Promise<OptionValue> {
    logger.info('[OptionSetsService] Updating option value', { id, data });

    try {
      const updatedValue = await prisma.optionValue.update({
        where: { id: id },
        data: data,
      });

      if (!updatedValue) {
        throw new Error('Option value not found');
      }

      logger.info('[OptionSetsService] Option value updated successfully', { id });

      // Cast JSONB fields to proper types
      return {
        ...updatedValue,
        regionalMappings: (updatedValue.regionalMappings as Record<string, string>) || {},
        metadata: (updatedValue.metadata as Record<string, any>) || {},
        createdAt: updatedValue.createdAt.toISOString()
      } as OptionValue;
    } catch (error) {
      logger.error('[OptionSetsService] Error updating option value', { error, id });
      throw error;
    }
  }

  /**
   * Delete an option value
   */
  static async deleteOptionValue(id: number) {
    try {
      logger.info('[OptionSetsService] Deleting option value', { id });

      const deletedValue = await prisma.optionValue.delete({
        where: { id: id },
      });

      if (!deletedValue) {
        throw new Error('Option value not found');
      }

      logger.info('[OptionSetsService] Option value deleted successfully', { id });
      return deletedValue;
    } catch (error) {
      logger.error('[OptionSetsService] Error deleting option value', { error, id });
      throw error;
    }
  }

  /**
   * Reorder option values
   */
  static async reorderOptionValues(optionSetId: number, valueOrders: { id: number; order: number }[]) {
    try {
      logger.info('[OptionSetsService] Reordering option values', { optionSetId, valueOrders });

      await prisma.$transaction(
        valueOrders.map(({ id, order }) =>
          prisma.optionValue.update({
            where: { id: id },
            data: { order: order },
          })
        )
      );

      logger.info('[OptionSetsService] Option values reordered successfully', { optionSetId });
      return true;
    } catch (error) {
      logger.error('[OptionSetsService] Error reordering option values', { error, optionSetId, valueOrders });
      throw error;
    }
  }

  /**
   * Get option sets for use in model schema field configuration
   */
  static async getOptionSetsForModelSchemas(tenantId?: number | null) {
    try {
      logger.info('[OptionSetsService] Fetching option sets for model schemas', { tenantId });

      const whereConditions: any = {};
      if (tenantId !== undefined) {
        if (tenantId === null) {
          // Get platform-wide option sets
          whereConditions.tenantId = null;
        } else {
          // Get both tenant-specific and platform-wide option sets
          whereConditions.OR = [
            { tenantId: tenantId },
            { tenantId: null },
          ];
        }
      }

      const results = await prisma.optionSet.findMany({
        where: whereConditions,
        select: {
          id: true,
          slug: true,
          label: true,
          tenantId: true,
          _count: {
            select: { optionValues: true },
          },
        },
        orderBy: { label: 'asc' },
      });

      const transformedResults = results.map(os => ({
        id: os.id,
        slug: os.slug,
        label: os.label,
        tenantId: os.tenantId,
        valueCount: os._count?.optionValues || 0,
      }));

      logger.info('[OptionSetsService] Option sets for model schemas retrieved successfully', { 
        count: transformedResults.length,
        tenantId 
      });

      return transformedResults;
    } catch (error) {
      logger.error('[OptionSetsService] Error fetching option sets for model schemas', { error, tenantId });
      throw error;
    }
  }

  /**
   * Get option set with values by ID for model schema field rendering
   */
  static async getOptionSetForField(id: number, tenantId?: number | null) {
    try {
      logger.info('[OptionSetsService] Fetching option set for field', { id, tenantId });

      const optionSet = await this.getOptionSetById(id, tenantId);

      if (!optionSet) {
        logger.warn('[OptionSetsService] Option set not found for field', { id, tenantId });
        return null;
      }

      // Return in a format suitable for form field rendering
      return {
        id: optionSet.id,
        slug: optionSet.slug,
        label: optionSet.label,
        options: optionSet.values.map(value => ({
          value: value.value,
          label: value.label,
          isDefault: value.isDefault
        }))
      };
    } catch (error) {
      logger.error('[OptionSetsService] Error fetching option set for field', { error, id, tenantId });
      throw error;
    }
  }

  /**
   * Get comprehensive statistics for option sets
   */
  static async getStatistics() {
    try {
      logger.info('[OptionSetsService] Fetching statistics');

      // Get total counts
      const optionSetsCount = await prisma.optionSet.count();
      const optionValuesCount = await prisma.optionValue.count();

      // Get counts by tenant
      const tenantCounts = await prisma.optionSet.groupBy({
        by: ['tenantId'],
        _count: { id: true },
      });

      // Get top option sets by value count
      const topOptionSets = await prisma.optionSet.findMany({
        select: {
          id: true,
          slug: true,
          label: true,
          _count: {
            select: { optionValues: true },
          },
        },
        orderBy: {
          optionValues: {
            _count: 'desc',
          },
        },
        take: 10,
      });

      const statistics = {
        totals: {
          optionSets: optionSetsCount,
          optionValues: optionValuesCount,
          mappingsCoverage: 0, // Simplified for now
          mappingsCoveragePercent: 0 // Simplified for now
        },
        byTenant: tenantCounts.map(tc => ({
          tenantId: tc.tenantId,
          isGlobal: tc.tenantId === null,
          count: tc._count.id
        })),
        topOptionSets: topOptionSets.map(os => ({
          id: os.id,
          slug: os.slug,
          label: os.label,
          valueCount: os._count.optionValues || 0,
        })),
        recentActivity: {
          newOptionSets: 0, // Simplified for now
          newOptionValues: 0 // Simplified for now
        },
        availableRegions: AVAILABLE_REGIONS.length
      };

      logger.info('[OptionSetsService] Statistics retrieved successfully', { 
        totalOptionSets: statistics.totals.optionSets,
        totalValues: statistics.totals.optionValues 
      });

      return statistics;
    } catch (error) {
      logger.error('[OptionSetsService] Error fetching statistics', { error });
      throw error;
    }
  }
} 