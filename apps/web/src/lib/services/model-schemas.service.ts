import { db as prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { unstable_cache } from 'next/cache';
import { auth } from '@/lib/auth';
import { AuditService } from '@/lib/services/audit.service';
import { getRedisClient } from '@/lib/redis';
import { type ModelSchema, type SchemaDefinition } from '@prisma/client';

// ============================
// 🏗️ MODEL SCHEMAS SERVICE
// ============================

interface ModelSchemaSearchParams {
  search?: string;
  type?: string;
  tenantId?: string;
  status?: 'active' | 'inactive' | 'all';
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'type' | 'created' | 'updated';
  sortOrder?: 'asc' | 'desc';
}

interface ModelSchemaCreateData {
  type: string;
  subType: string;
  displayName: Record<string, string>;
  description?: Record<string, string>;
  schema: SchemaDefinition;
  isActive?: boolean;
}

interface ModelSchemaUpdateData extends Partial<ModelSchemaCreateData> {
  id: string;
}

interface ModelSchemaStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  recent: number;
}

/**
 * Get cache key for model schemas with tenant isolation and super admin handling
 */
const getCacheKey = (key: string, userContext?: any, params?: any): string => {
  const isSuperAdmin = userContext?.roles?.includes('super_admin');
  const tenantId = userContext?.tenantId;
  
  if (isSuperAdmin) {
    // Super admin sees cross-tenant data
    const paramsHash = params ? JSON.stringify(params).slice(0, 20) : '';
    return `platform:model_schemas:super_admin:${key}:${paramsHash}`;
  } else if (tenantId) {
    // Regular tenant-specific caching
    const paramsHash = params ? JSON.stringify(params).slice(0, 20) : '';
    return `tenant:${tenantId}:model_schemas:${key}:${paramsHash}`;
  } else {
    // Fallback to platform cache (shouldn't happen in normal flow)
    return `platform:model_schemas:${key}`;
  }
};

/**
 * Model Schemas Service Class
 */
export class ModelSchemasService {
  private static async getRedis() {
    try {
      return await getRedisClient();
    } catch (error) {
      logger.warn('Redis client unavailable, proceeding without cache', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error; // Re-throw to be caught by the calling methods
    }
  }

  // ============================
  // 📋 LIST OPERATIONS
  // ============================

  /**
   * Get all model schemas (platform-level for super admin)
   */
  static async getAllModelSchemas(): Promise<ModelSchema[]> {
    const results = await prisma.modelSchema.findMany({
      where: { tenantId: null }, // Platform-level only
      orderBy: { createdAt: 'desc' },
    });

    return results.map(this.transformModelSchema);
  }

  /**
   * Get model schemas by type
   */
  static async getModelSchemasByType(type: string): Promise<ModelSchema[]> {
    const results = await prisma.modelSchema.findMany({
      where: {
        tenantId: null,
        type: type,
      },
      orderBy: { createdAt: 'desc' },
    });

    return results.map(this.transformModelSchema);
  }

  /**
   * Get a specific model schema by ID
   */
  static async getModelSchemaById(id: string): Promise<ModelSchema | null> {
    const result = await prisma.modelSchema.findFirst({
      where: {
        id: id,
        tenantId: null,
      },
    });

    return result ? this.transformModelSchema(result) : null;
  }

  /**
   * Get a model schema by type and subType
   */
  static async getModelSchemaByTypeAndSubType(
    type: string, 
    subType: string
  ): Promise<ModelSchema | null> {
    const result = await prisma.modelSchema.findFirst({
      where: {
        tenantId: null,
        type: type,
        subType: subType,
      },
    });

    return result ? this.transformModelSchema(result) : null;
  }

  /**
   * Get model schemas with search and filtering
   * Implements three-layer caching strategy
   */
  static async getModelSchemas(params: ModelSchemaSearchParams = {}): Promise<ModelSchema[]> {
    const startTime = performance.now();
    
    try {
      const session = await auth();
      const userContext = session?.user ? {
        userId: session.user.id,
        tenantId: (session.user as any).tenantId,
        roles: (session.user as any).roles || [],
      } : null;
      const cacheKey = getCacheKey('list', userContext, params);
      
      // Layer 3: Check Redis cache first
      try {
        const redis = await this.getRedis();
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
          logger.info('model_schemas_cache_hit', {
            cacheKey,
            responseTime: performance.now() - startTime,
            source: 'redis'
          });
          return JSON.parse(cachedData);
        }
      } catch (redisError) {
        logger.warn('Redis cache check failed, proceeding without cache', {
          error: redisError.message,
          cacheKey
        });
      }

      // Layer 1: Use Next.js unstable_cache for server components
      const fetchData = unstable_cache(
        async () => {
          const {
            search = '',
            type = 'all',
            status = 'all',
            limit = 50,
            offset = 0,
            sortBy = 'createdAt',
            sortOrder = 'desc'
          } = params;

          const whereConditions: any = {};

          // Tenant isolation - critical security requirement
          const isSuperAdmin = userContext?.roles?.includes('super_admin');
          if (!isSuperAdmin && userContext?.tenantId) {
            whereConditions.tenantId = userContext.tenantId;
          } else if (isSuperAdmin) {
            // Super admin can see all schemas, including global (tenantId: null)
            // No specific tenantId filter needed here for super admin
          }

          // Search conditions
          if (search) {
            whereConditions.OR = [
              { subType: { contains: search, mode: 'insensitive' } },
              { displayName: { path: ['en-US'], string_contains: search, mode: 'insensitive' } },
            ];
          }

          // Type filtering
          if (type !== 'all') {
            whereConditions.type = type;
          }

          // Status filtering
          if (status !== 'all') {
            whereConditions.isActive = status === 'active';
          }

          const orderBy: any = {};
          if (sortBy === 'name') {
            orderBy.subType = sortOrder;
          } else if (sortBy === 'type') {
            orderBy.type = sortOrder;
          } else if (sortBy === 'updated') {
            orderBy.updatedAt = sortOrder;
          } else {
            orderBy.createdAt = sortOrder;
          }

          const schemas = await prisma.modelSchema.findMany({
            where: whereConditions,
            orderBy: orderBy,
            skip: offset,
            take: limit,
          });

          return schemas;
        },
        [cacheKey],
        {
          revalidate: 30 * 60, // 30 minutes
          tags: ['model-schemas', `tenant:${userContext?.tenantId || 'super_admin'}`]
        }
      );

      const data = await fetchData();
      const transformedData = data.map(this.transformModelSchema);

      // Layer 2: Cache in Redis with TTL
      try {
        const redis = await this.getRedis();
        await redis.set(cacheKey, JSON.stringify(transformedData), 'EX', 30 * 60); // 30 minutes
      } catch (redisError) {
        logger.warn('Redis cache write failed', {
          error: redisError.message,
          cacheKey
        });
      }

      logger.info('model_schemas_cache_miss', {
        cacheKey,
        responseTime: performance.now() - startTime,
        resultCount: transformedData.length,
        source: 'database'
      });

      return transformedData;

    } catch (error) {
      logger.error('model_schemas_fetch_error', {
        error: error instanceof Error ? error.message : String(error),
        params,
        responseTime: performance.now() - startTime
      });
      
      // For critical errors, still throw to be handled by the calling code
      throw error;
    }
  }

  /**
   * Get model schema statistics with caching
   */
  static async getModelSchemasStats(): Promise<ModelSchemaStats> {
    const startTime = performance.now();
    
    try {
      const session = await auth();
      const userContext = session?.user ? {
        userId: session.user.id,
        tenantId: (session.user as any).tenantId,
        roles: (session.user as any).roles || [],
      } : null;
      const cacheKey = getCacheKey('stats', userContext);
      
      // Check Redis cache
      try {
        const redis = await this.getRedis();
        const cachedStats = await redis.get(cacheKey);
        if (cachedStats) {
          logger.info('model_schemas_stats_cache_hit', {
            cacheKey,
            responseTime: performance.now() - startTime
          });
          return JSON.parse(cachedStats);
        }
      } catch (redisError) {
        logger.warn('Redis stats cache check failed', {
          error: redisError.message,
          cacheKey
        });
      }

      // Generate stats from database
      const isSuperAdmin = userContext?.roles?.includes('super_admin');
      
      const whereConditions: any = {};
      if (!isSuperAdmin && userContext?.tenantId) {
        whereConditions.tenantId = userContext.tenantId;
      }

      const allSchemas = await prisma.modelSchema.findMany({
        where: whereConditions,
        select: { type: true, isActive: true, createdAt: true },
      });
      
      const stats: ModelSchemaStats = {
        total: allSchemas.length,
        byType: {},
        byStatus: {
          active: 0,
          inactive: 0
        },
        recent: 0
      };

      // Calculate statistics
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      for (const schema of allSchemas) {
        // Count by type
        stats.byType[schema.type] = (stats.byType[schema.type] || 0) + 1;
        
        // Count by status
        if (schema.isActive) {
          stats.byStatus.active++;
        } else {
          stats.byStatus.inactive++;
        }
        
        // Count recent (last 7 days)
        if (new Date(schema.createdAt) > oneWeekAgo) {
          stats.recent++;
        }
      }

      // Cache stats for 10 minutes
      try {
        const redis = await this.getRedis();
        await redis.set(cacheKey, JSON.stringify(stats), 'EX', 10 * 60);
      } catch (redisError) {
        logger.warn('Redis stats cache write failed', {
          error: redisError.message,
          cacheKey
        });
      }

      logger.info('model_schemas_stats_generated', {
        cacheKey,
        responseTime: performance.now() - startTime,
        stats
      });

      return stats;

    } catch (error) {
      logger.error('model_schemas_stats_error', {
        error: error instanceof Error ? error.message : String(error),
        responseTime: performance.now() - startTime
      });
      
      // For critical errors, still throw to be handled by the calling code
      throw error;
    }
  }

  // ============================
  // ✏️ CREATE/UPDATE OPERATIONS
  // ============================

  /**
   * Create a new model schema
   */
  static async createModelSchema(data: ModelSchemaCreateData): Promise<ModelSchema> {
    const startTime = performance.now();
    
    try {
      const session = await auth();
      const userContext = session?.user ? {
        id: session.user.id,
        userId: session.user.id,
        tenantId: (session.user as any).tenantId,
        roles: (session.user as any).roles || [],
      } : null;
      if (!userContext) {
        throw new Error('User context required for model schema creation');
      }

      // Prepare schema data with tenant isolation
      const schemaData = {
        ...data,
        tenantId: userContext.tenantId || null, // Super admin can create global schemas
        createdBy: userContext.id,
        updatedBy: userContext.id,
        isActive: data.isActive ?? true,
      };

      // Create schema in database transaction
      const newSchema = await prisma.modelSchema.create({
        data: schemaData,
      });

      // Audit logging
      await AuditService.logEntityChange({
        entityType: 'model_schema',
        entityId: newSchema.id,
        action: 'create',
        userId: userContext.id,
        tenantId: userContext.tenantId,
        changes: {
          created: schemaData
        },
        metadata: {
          type: data.type,
          subType: data.subType
        }
      });

      // Invalidate related caches
      await this.invalidateModelSchemasCaches(userContext);

      logger.userAction('model_schema_created', {
        schemaId: newSchema.id,
        type: data.type,
        subType: data.subType,
        userId: userContext.id,
        tenantId: userContext.tenantId,
        responseTime: performance.now() - startTime
      });

      return newSchema as ModelSchema;

    } catch (error) {
      logger.error('model_schema_create_error', {
        error: error.message,
        data,
        responseTime: performance.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Update an existing model schema
   */
  static async updateModelSchema(data: ModelSchemaUpdateData): Promise<ModelSchema> {
    const startTime = performance.now();
    
    try {
      const session = await auth();
      const userContext = session?.user ? {
        id: session.user.id,
        userId: session.user.id,
        tenantId: (session.user as any).tenantId,
        roles: (session.user as any).roles || [],
      } : null;
      if (!userContext) {
        throw new Error('User context required for model schema update');
      }

      // Get existing schema for audit comparison
      const existingSchema = await prisma.modelSchema.findUnique({
        where: { id: data.id },
      });

      if (!existingSchema) {
        throw new Error('Model schema not found');
      }

      // Tenant access validation
      const isSuperAdmin = userContext?.roles?.includes('super_admin');
      if (!isSuperAdmin && existingSchema.tenantId !== userContext.tenantId) {
        throw new Error('Access denied: Cannot modify schema from different tenant');
      }

      // Prepare update data
      const updateData = {
        ...data,
        updatedBy: userContext.id,
        updatedAt: new Date(),
      };
      delete (updateData as any).id;

      // Update in database
      const updatedSchema = await prisma.modelSchema.update({
        where: { id: data.id },
        data: updateData,
      });

      // Audit logging with change tracking
      await AuditService.logEntityChange({
        entityType: 'model_schema',
        entityId: data.id,
        action: 'update',
        userId: userContext.id,
        tenantId: userContext.tenantId,
        changes: {
          before: existingSchema,
          after: updatedSchema
        },
        metadata: {
          fieldsChanged: Object.keys(updateData)
        }
      });

      // Invalidate related caches
      await this.invalidateModelSchemasCaches(userContext);

      logger.userAction('model_schema_updated', {
        schemaId: data.id,
        userId: userContext.id,
        tenantId: userContext.tenantId,
        fieldsChanged: Object.keys(updateData),
        responseTime: performance.now() - startTime
      });

      return updatedSchema as ModelSchema;

    } catch (error) {
      logger.error('model_schema_update_error', {
        error: error.message,
        schemaId: data.id,
        responseTime: performance.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Update model schema fields only
   */
  static async updateModelSchemaFields(
    id: string,
    schemaDefinition: SchemaDefinition
  ): Promise<ModelSchema | null> {
    const result = await prisma.modelSchema.update({
      where: {
        id: id,
        tenantId: null, // Only update platform-level schemas
      },
      data: {
        schema: schemaDefinition as any,
        updatedAt: new Date(),
      },
    });

    return result ? this.transformModelSchema(result) : null;
  }

  // ============================
  // 🗑️ DELETE OPERATIONS
  // ============================

  /**
   * Delete a model schema
   */
  static async deleteModelSchema(schemaId: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      const session = await auth();
      const userContext = session?.user ? {
        id: session.user.id,
        userId: session.user.id,
        tenantId: (session.user as any).tenantId,
        roles: (session.user as any).roles || [],
      } : null;
      if (!userContext) {
        throw new Error('User context required for model schema deletion');
      }

      // Get existing schema for audit logging
      const existingSchema = await prisma.modelSchema.findUnique({
        where: { id: schemaId },
      });

      if (!existingSchema) {
        throw new Error('Model schema not found');
      }

      // Tenant access validation
      const isSuperAdmin = userContext?.roles?.includes('super_admin');
      if (!isSuperAdmin && existingSchema.tenantId !== userContext.tenantId) {
        throw new Error('Access denied: Cannot delete schema from different tenant');
      }

      // Soft delete (mark as inactive) instead of hard delete
      await prisma.modelSchema.update({
        where: { id: schemaId },
        data: {
          isActive: false,
          updatedBy: userContext.id,
          updatedAt: new Date(),
        },
      });

      // Audit logging
      await AuditService.logEntityChange(
        existingSchema.tenantId, // tenantId
        'model_schema', // entityType
        schemaId, // entityId
        'delete', // action
        userContext.id, // userId
        existingSchema, // oldData
        null, // newData (deleted)
        { deleteType: 'soft_delete' } // metadata
      );

      // Invalidate related caches
      await this.invalidateModelSchemasCaches(userContext);

      logger.userAction('model_schema_deleted', {
        schemaId,
        type: existingSchema.type,
        subType: existingSchema.subType,
        userId: userContext.id,
        tenantId: userContext.tenantId,
        responseTime: performance.now() - startTime
      });

    } catch (error) {
      logger.error('model_schema_delete_error', {
        error: error instanceof Error ? error.message : String(error),
        schemaId,
        responseTime: performance.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Soft delete (deactivate) a model schema
   */
  static async deactivateModelSchema(id: string): Promise<boolean> {
    const result = await prisma.modelSchema.update({
      where: {
        id: id,
        tenantId: null, // Only deactivate platform-level schemas
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return !!result;
  }

  // ============================
  // 🔧 UTILITY METHODS
  // ============================

  /**
   * Transform database result to ModelSchema interface
   */
  private static transformModelSchema(result: any): ModelSchema {
    return {
      id: result.id,
      tenantId: result.tenantId,
      type: result.type,
      subType: result.subType,
      displayName: result.displayName || {},
      description: result.description || {},
      schema: result.schema || { fields: [], version: '1.0.0' },
      isActive: result.isActive,
      metadata: result.metadata || {},
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };
  }

  /**
   * Validate schema definition
   */
  static validateSchemaDefinition(schema: SchemaDefinition): boolean {
    if (!schema.fields || !Array.isArray(schema.fields)) {
      return false;
    }

    if (!schema.version) {
      return false;
    }

    // Check for duplicate field names
    const fieldNames = schema.fields.map(f => f.name);
    const uniqueNames = new Set(fieldNames);
    if (fieldNames.length !== uniqueNames.size) {
      return false;
    }

    // Validate each field
    for (const field of schema.fields) {
      if (!field.id || !field.name || !field.type) {
        return false;
      }
    }

    return true;
  }

  /**
   * Invalidate all model schemas related caches
   */
  private static async invalidateModelSchemasCaches(userContext: any): Promise<void> {
    try {
      const isSuperAdmin = userContext?.roles?.includes('super_admin');
      const tenantId = userContext?.tenantId;

      // Redis cache keys to invalidate
      const cachePatterns = [];
      
      if (isSuperAdmin) {
        cachePatterns.push('cache:super_admin:model_schemas:*');
        // Super admin changes affect all tenant caches
        cachePatterns.push('cache:*:model_schemas:*');
      } else if (tenantId) {
        cachePatterns.push(`cache:${tenantId}:model_schemas:*`);
      }

      // Invalidate Redis caches
      const redis = await this.getRedis();
      for (const pattern of cachePatterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }

      logger.info('model_schemas_cache_invalidated', {
        patterns: cachePatterns,
        userContext: {
          userId: userContext.id,
          tenantId: userContext.tenantId,
          isSuperAdmin
        }
      });

    } catch (error) {
      logger.error('model_schemas_cache_invalidation_error', {
        error: error.message,
        userContext
      });
      // Don't throw - cache invalidation failure shouldn't break the operation
    }
  }
}