/**
 * Model Schemas Service - API Client
 * 
 * ✅ ARCHITECTURE COMPLIANCE: Uses API calls instead of direct database access
 * All model schema operations go through NestJS API with proper authentication
 */

import { ApiAuthService } from '@/lib/api-clients/api-auth.service';
import { logger } from '@/lib/logger';
import { unstable_cache } from 'next/cache';
import { getRedisClient } from '@/lib/redis';

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
  schema: any;
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

interface ModelSchema {
  id: string;
  uuid: string;
  type: string;
  subType: string;
  displayName: Record<string, string>;
  description?: Record<string, string>;
  schema: any;
  isActive: boolean;
  tenantId: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
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
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v1/admin/model-schemas`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch model schemas: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      logger.error('Failed to fetch all model schemas', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get model schemas by type
   */
  static async getModelSchemasByType(type: string): Promise<ModelSchema[]> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/model-schemas?type=${encodeURIComponent(type)}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch model schemas by type: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      logger.error('Failed to fetch model schemas by type', {
        error: error instanceof Error ? error.message : 'Unknown error',
        type
      });
      throw error;
    }
  }

  /**
   * Search model schemas with caching and tenant isolation
   */
  static async searchModelSchemas(
    params: ModelSchemaSearchParams,
    userContext?: any
  ): Promise<{ schemas: ModelSchema[]; total: number }> {
    const cacheKey = getCacheKey('search', userContext, params);

    try {
      // Try cache first
      const redis = await this.getRedis();
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Model schemas search cache hit', { cacheKey });
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache read failed, proceeding without cache', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/model-schemas/search?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to search model schemas: ${response.statusText}`);
      }

      const result = await response.json();
      const data = result.data || result;

      // Cache the result
      try {
        const redis = await this.getRedis();
        await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 minutes TTL
      } catch (error) {
        logger.warn('Cache write failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      return data;
    } catch (error) {
      logger.error('Failed to search model schemas', {
        error: error instanceof Error ? error.message : 'Unknown error',
        params
      });
      throw error;
    }
  }

  // ============================
  // 🔍 GET OPERATIONS
  // ============================

  /**
   * Get model schema by ID with caching
   */
  static async getModelSchemaById(id: string): Promise<ModelSchema | null> {
    const cacheKey = `model_schema:${id}`;

    try {
      // Try cache first
      const redis = await this.getRedis();
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Model schema cache hit', { id });
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache read failed, proceeding without cache', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v1/admin/model-schemas/${id}`, {
        headers,
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch model schema: ${response.statusText}`);
      }

      const data = await response.json();
      const schema = data.data || data;

      // Cache the result
      try {
        const redis = await this.getRedis();
        await redis.setex(cacheKey, 600, JSON.stringify(schema)); // 10 minutes TTL
      } catch (error) {
        logger.warn('Cache write failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      return schema;
    } catch (error) {
      logger.error('Failed to fetch model schema by ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw error;
    }
  }

  /**
   * Get model schema by type and subtype
   */
  static async getModelSchemaByTypeAndSubType(
    type: string,
    subType: string
  ): Promise<ModelSchema | null> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${this.API_BASE_URL}/api/v1/admin/model-schemas/by-type/${encodeURIComponent(type)}/${encodeURIComponent(subType)}`,
        { headers }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch model schema by type: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      logger.error('Failed to fetch model schema by type and subtype', {
        error: error instanceof Error ? error.message : 'Unknown error',
        type,
        subType
      });
      throw error;
    }
  }

  // ============================
  // ✏️ CREATE/UPDATE OPERATIONS
  // ============================

  /**
   * Create new model schema
   */
  static async createModelSchema(
    data: ModelSchemaCreateData,
    userContext?: any
  ): Promise<ModelSchema> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v1/admin/model-schemas`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create model schema: ${response.statusText}`);
      }

      const result = await response.json();
      const schema = result.data || result;

      // Invalidate related caches
      await this.invalidateCache(userContext);

      logger.info('Model schema created', {
        id: schema.id,
        type: schema.type,
        subType: schema.subType
      });

      return schema;
    } catch (error) {
      logger.error('Failed to create model schema', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data
      });
      throw error;
    }
  }

  /**
   * Update model schema
   */
  static async updateModelSchema(
    data: ModelSchemaUpdateData,
    userContext?: any
  ): Promise<ModelSchema> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const { id, ...updateData } = data;
      
      const response = await fetch(`${this.API_BASE_URL}/api/v1/admin/model-schemas/${id}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update model schema: ${response.statusText}`);
      }

      const result = await response.json();
      const schema = result.data || result;

      // Invalidate caches
      await this.invalidateCache(userContext);
      await this.invalidateSingleCache(id);

      logger.info('Model schema updated', { id });

      return schema;
    } catch (error) {
      logger.error('Failed to update model schema', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data
      });
      throw error;
    }
  }

  /**
   * Delete model schema
   */
  static async deleteModelSchema(id: string, userContext?: any): Promise<boolean> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v1/admin/model-schemas/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to delete model schema: ${response.statusText}`);
      }

      // Invalidate caches
      await this.invalidateCache(userContext);
      await this.invalidateSingleCache(id);

      logger.info('Model schema deleted', { id });

      return true;
    } catch (error) {
      logger.error('Failed to delete model schema', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
      throw error;
    }
  }

  // ============================
  // 🔄 BULK OPERATIONS
  // ============================

  /**
   * Bulk create model schemas
   */
  static async bulkCreateModelSchemas(
    schemas: ModelSchemaCreateData[],
    userContext?: any
  ): Promise<ModelSchema[]> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v1/admin/model-schemas/bulk/create`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schemas }),
      });

      if (!response.ok) {
        throw new Error(`Failed to bulk create model schemas: ${response.statusText}`);
      }

      const result = await response.json();
      const createdSchemas = result.data || result;

      // Invalidate caches
      await this.invalidateCache(userContext);

      logger.info('Model schemas bulk created', { count: createdSchemas.length });

      return createdSchemas;
    } catch (error) {
      logger.error('Failed to bulk create model schemas', {
        error: error instanceof Error ? error.message : 'Unknown error',
        count: schemas.length
      });
      throw error;
    }
  }

  /**
   * Bulk update model schemas
   */
  static async bulkUpdateModelSchemas(
    updates: ModelSchemaUpdateData[],
    userContext?: any
  ): Promise<ModelSchema[]> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v1/admin/model-schemas/bulk/update`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error(`Failed to bulk update model schemas: ${response.statusText}`);
      }

      const result = await response.json();
      const updatedSchemas = result.data || result;

      // Invalidate caches
      await this.invalidateCache(userContext);
      for (const update of updates) {
        await this.invalidateSingleCache(update.id);
      }

      logger.info('Model schemas bulk updated', { count: updatedSchemas.length });

      return updatedSchemas;
    } catch (error) {
      logger.error('Failed to bulk update model schemas', {
        error: error instanceof Error ? error.message : 'Unknown error',
        count: updates.length
      });
      throw error;
    }
  }

  /**
   * Bulk upsert model schemas
   */
  static async bulkUpsertModelSchemas(
    schemas: (ModelSchemaCreateData & { id?: string })[],
    userContext?: any
  ): Promise<ModelSchema[]> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v1/admin/model-schemas/bulk/upsert`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schemas }),
      });

      if (!response.ok) {
        throw new Error(`Failed to bulk upsert model schemas: ${response.statusText}`);
      }

      const result = await response.json();
      const upsertedSchemas = result.data || result;

      // Invalidate caches
      await this.invalidateCache(userContext);

      logger.info('Model schemas bulk upserted', { count: upsertedSchemas.length });

      return upsertedSchemas;
    } catch (error) {
      logger.error('Failed to bulk upsert model schemas', {
        error: error instanceof Error ? error.message : 'Unknown error',
        count: schemas.length
      });
      throw error;
    }
  }

  /**
   * Bulk delete model schemas
   */
  static async bulkDeleteModelSchemas(
    ids: string[],
    userContext?: any
  ): Promise<number> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v1/admin/model-schemas/bulk/delete`, {
        method: 'DELETE',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error(`Failed to bulk delete model schemas: ${response.statusText}`);
      }

      const result = await response.json();
      const deletedCount = result.count || 0;

      // Invalidate caches
      await this.invalidateCache(userContext);
      for (const id of ids) {
        await this.invalidateSingleCache(id);
      }

      logger.info('Model schemas bulk deleted', { count: deletedCount });

      return deletedCount;
    } catch (error) {
      logger.error('Failed to bulk delete model schemas', {
        error: error instanceof Error ? error.message : 'Unknown error',
        count: ids.length
      });
      throw error;
    }
  }

  // ============================
  // 📊 STATS OPERATIONS
  // ============================

  /**
   * Get model schema statistics
   */
  static async getModelSchemaStats(userContext?: any): Promise<ModelSchemaStats> {
    const cacheKey = getCacheKey('stats', userContext);

    try {
      // Try cache first
      const redis = await this.getRedis();
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Model schema stats cache hit');
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache read failed, proceeding without cache', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${this.API_BASE_URL}/api/v1/admin/model-schemas/stats`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch model schema stats: ${response.statusText}`);
      }

      const data = await response.json();
      const stats = data.data || data;

      // Cache the result
      try {
        const redis = await this.getRedis();
        await redis.setex(cacheKey, 300, JSON.stringify(stats)); // 5 minutes TTL
      } catch (error) {
        logger.warn('Cache write failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      return stats;
    } catch (error) {
      logger.error('Failed to fetch model schema stats', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // ============================
  // 🗑️ CACHE OPERATIONS
  // ============================

  /**
   * Invalidate all model schema caches
   */
  private static async invalidateCache(userContext?: any): Promise<void> {
    try {
      const redis = await this.getRedis();
      const patterns = [
        'platform:model_schemas:*',
        'tenant:*:model_schemas:*'
      ];

      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
          logger.debug('Model schema cache invalidated', { pattern, count: keys.length });
        }
      }
    } catch (error) {
      logger.warn('Failed to invalidate model schema cache', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Invalidate single model schema cache
   */
  private static async invalidateSingleCache(id: string): Promise<void> {
    try {
      const redis = await this.getRedis();
      const cacheKey = `model_schema:${id}`;
      await redis.del(cacheKey);
      logger.debug('Single model schema cache invalidated', { id });
    } catch (error) {
      logger.warn('Failed to invalidate single model schema cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        id
      });
    }
  }

  /**
   * Transform model schema data
   */
  private static transformModelSchema(schema: any): ModelSchema {
    return {
      ...schema,
      createdAt: new Date(schema.createdAt),
      updatedAt: new Date(schema.updatedAt),
    };
  }
}

// Export singleton instance
export const modelSchemasService = new ModelSchemasService();