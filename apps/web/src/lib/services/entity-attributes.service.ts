/**
 * Entity Attributes Service - API Client
 * 
 * ✅ ARCHITECTURE COMPLIANCE: Uses API calls instead of direct database access
 * All entity attribute operations go through NestJS API with proper authentication
 */

import { ApiAuthService } from '@/lib/api-clients/api-auth.service';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';

export interface EntityAttribute {
  id: string;
  entityType: 'account' | 'user' | 'profile' | 'media_asset' | 'subscription' | 'tenant';
  entityId: number;
  attributeKey: string;
  attributeValue: any;
  isSystem: boolean;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  updatedBy?: number;
}

export interface AttributeFilters {
  entityType?: 'account' | 'user' | 'profile' | 'media_asset' | 'subscription' | 'tenant';
  entityId?: string;
  attributeKey?: string;
  includeExpired?: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class EntityAttributesService {
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  constructor(
    private tenantId: number
  ) {}

  private static async getRedis() {
    try {
      return await getRedisClient();
    } catch (error) {
      logger.warn('Redis client unavailable, proceeding without cache', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private getCacheKey(entityType: string, entityId: number, attributeKey?: string): string {
    const base = `tenant:${this.tenantId}:entity:${entityType}:${entityId}:attributes`;
    return attributeKey ? `${base}:${attributeKey}` : base;
  }

  async setAttribute(
    entityType: EntityAttribute['entityType'],
    entityId: number,
    attributeKey: string,
    attributeValue: any,
    options?: {
      isSystem?: boolean;
      expiresAt?: Date;
      userId?: number;
    }
  ): Promise<EntityAttribute> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(`${EntityAttributesService.API_BASE_URL}/api/v1/admin/entity-attributes`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: this.tenantId,
          entityType,
          entityId,
          attributeKey,
          attributeValue,
          isSystem: options?.isSystem || false,
          expiresAt: options?.expiresAt || null,
          userId: options?.userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to set entity attribute: ${response.statusText}`);
      }

      const result = await response.json();
      const attribute = result.data || result;

      // Update cache
      try {
        const redis = await EntityAttributesService.getRedis();
        const cacheKey = this.getCacheKey(entityType, entityId, attributeKey);
        await redis.set(cacheKey, JSON.stringify(attribute), 'EX', 3600); // 1 hour TTL
      } catch (redisError) {
        logger.warn('Failed to cache entity attribute', {
          error: redisError instanceof Error ? redisError.message : String(redisError)
        });
      }

      return attribute;
    } catch (error) {
      logger.error('Failed to set entity attribute', {
        entityType,
        entityId,
        attributeKey,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getAttribute(
    entityType: EntityAttribute['entityType'],
    entityId: number,
    attributeKey: string
  ): Promise<EntityAttribute | null> {
    try {
      // Try cache first
      try {
        const redis = await EntityAttributesService.getRedis();
        const cacheKey = this.getCacheKey(entityType, entityId, attributeKey);
        const cached = await redis.get(cacheKey);
        
        if (cached) {
          const attribute = JSON.parse(cached) as EntityAttribute;
          
          // Check if expired
          if (attribute.expiresAt && new Date(attribute.expiresAt) < new Date()) {
            await redis.del(cacheKey);
          } else {
            return attribute;
          }
        }
      } catch (redisError) {
        logger.warn('Cache read failed, proceeding with API call', {
          error: redisError instanceof Error ? redisError.message : String(redisError)
        });
      }

      // Fetch from API
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        tenantId: this.tenantId.toString(),
        entityType,
        entityId: entityId.toString(),
        attributeKey,
      });

      const response = await fetch(
        `${EntityAttributesService.API_BASE_URL}/api/v1/admin/entity-attributes/get?${queryParams}`,
        { headers }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get entity attribute: ${response.statusText}`);
      }

      const data = await response.json();
      const attribute = data.data || data;

      // Cache the result
      try {
        const redis = await EntityAttributesService.getRedis();
        const cacheKey = this.getCacheKey(entityType, entityId, attributeKey);
        await redis.set(cacheKey, JSON.stringify(attribute), 'EX', 3600);
      } catch (redisError) {
        logger.warn('Failed to cache entity attribute', {
          error: redisError instanceof Error ? redisError.message : String(redisError)
        });
      }

      return attribute;
    } catch (error) {
      logger.error('Failed to get entity attribute', {
        entityType,
        entityId,
        attributeKey,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getAttributes(
    entityType: EntityAttribute['entityType'],
    entityId: number,
    includeExpired = false
  ): Promise<EntityAttribute[]> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        tenantId: this.tenantId.toString(),
        entityType,
        entityId: entityId.toString(),
        includeExpired: includeExpired.toString(),
      });

      const response = await fetch(
        `${EntityAttributesService.API_BASE_URL}/api/v1/admin/entity-attributes/list?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to get entity attributes: ${response.statusText}`);
      }

      const data = await response.json();
      const attributes = data.data || data;

      // Update cache for each attribute
      try {
        const redis = await EntityAttributesService.getRedis();
        for (const attribute of attributes) {
          const cacheKey = this.getCacheKey(entityType, entityId, attribute.attributeKey);
          await redis.set(cacheKey, JSON.stringify(attribute), 'EX', 3600);
        }
      } catch (redisError) {
        logger.warn('Failed to cache entity attributes', {
          error: redisError instanceof Error ? redisError.message : String(redisError)
        });
      }

      return attributes;
    } catch (error) {
      logger.error('Failed to get entity attributes', {
        entityType,
        entityId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getAttributesPaginated(
    filters: AttributeFilters,
    pagination: PaginationOptions
  ): Promise<{ attributes: EntityAttribute[]; total: number }> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const queryParams = new URLSearchParams({
        tenantId: this.tenantId.toString(),
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [key, String(value)])
        ),
      });

      const response = await fetch(
        `${EntityAttributesService.API_BASE_URL}/api/v1/admin/entity-attributes/search?${queryParams}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to get paginated attributes: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        attributes: data.data?.items || data.items || [],
        total: data.data?.total || data.total || 0
      };
    } catch (error) {
      logger.error('Failed to get paginated attributes', {
        filters,
        pagination,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async removeAttribute(
    entityType: EntityAttribute['entityType'],
    entityId: number,
    attributeKey: string,
    userId?: number
  ): Promise<boolean> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${EntityAttributesService.API_BASE_URL}/api/v1/admin/entity-attributes/remove`,
        {
          method: 'DELETE',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenantId: this.tenantId,
            entityType,
            entityId,
            attributeKey,
            userId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to remove entity attribute: ${response.statusText}`);
      }

      // Remove from cache
      try {
        const redis = await EntityAttributesService.getRedis();
        const cacheKey = this.getCacheKey(entityType, entityId, attributeKey);
        await redis.del(cacheKey);
      } catch (redisError) {
        logger.warn('Failed to remove attribute from cache', {
          error: redisError instanceof Error ? redisError.message : String(redisError)
        });
      }

      return true;
    } catch (error) {
      logger.error('Failed to remove entity attribute', {
        entityType,
        entityId,
        attributeKey,
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async setBulkAttributes(
    attributes: Array<{
      entityType: EntityAttribute['entityType'];
      entityId: number;
      attributeKey: string;
      attributeValue: any;
      expiresAt?: Date;
      userId?: number;
    }>,
    userId: number
  ): Promise<EntityAttribute[]> {
    try {
      const headers = await ApiAuthService.getAuthHeaders();
      const response = await fetch(
        `${EntityAttributesService.API_BASE_URL}/api/v1/admin/entity-attributes/bulk`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenantId: this.tenantId,
            attributes: attributes.map(attr => ({
              ...attr,
              userId: attr.userId || userId
            })),
            userId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to set bulk attributes: ${response.statusText}`);
      }

      const result = await response.json();
      const createdAttributes = result.data || result;

      // Update cache for successful attributes
      try {
        const redis = await EntityAttributesService.getRedis();
        for (const attribute of createdAttributes) {
          const cacheKey = this.getCacheKey(
            attribute.entityType,
            attribute.entityId,
            attribute.attributeKey
          );
          await redis.set(cacheKey, JSON.stringify(attribute), 'EX', 3600);
        }
      } catch (redisError) {
        logger.warn('Failed to cache bulk attributes', {
          error: redisError instanceof Error ? redisError.message : String(redisError)
        });
      }

      return createdAttributes;
    } catch (error) {
      logger.error('Failed to set bulk attributes', {
        count: attributes.length,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}