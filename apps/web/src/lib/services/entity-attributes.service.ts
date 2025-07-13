import { PrismaClient } from '@prisma/client';
import type { Redis } from 'ioredis';
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
  constructor(
    private db: PrismaClient,
    private redis: Redis,
    private tenantId: number
  ) {}

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
      // For now, store in cache only since we don't have the entity_attributes table yet
      const attribute: EntityAttribute = {
        id: `${entityType}-${entityId}-${attributeKey}`,
        entityType,
        entityId,
        attributeKey,
        attributeValue,
        isSystem: options?.isSystem || false,
        expiresAt: options?.expiresAt || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: options?.userId,
        updatedBy: options?.userId
      };

      const cacheKey = this.getCacheKey(entityType, entityId, attributeKey);
      await this.redis.set(cacheKey, JSON.stringify(attribute), 'EX', 3600); // 1 hour TTL

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
      const cacheKey = this.getCacheKey(entityType, entityId, attributeKey);
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        const attribute = JSON.parse(cached) as EntityAttribute;
        
        // Check if expired
        if (attribute.expiresAt && new Date(attribute.expiresAt) < new Date()) {
          await this.redis.del(cacheKey);
          return null;
        }
        
        return attribute;
      }

      return null;
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
      const pattern = this.getCacheKey(entityType, entityId) + ':*';
      const keys = await this.redis.keys(pattern);
      
      const attributes: EntityAttribute[] = [];
      
      for (const key of keys) {
        const cached = await this.redis.get(key);
        if (cached) {
          const attribute = JSON.parse(cached) as EntityAttribute;
          
          // Skip expired unless requested
          if (!includeExpired && attribute.expiresAt && new Date(attribute.expiresAt) < new Date()) {
            await this.redis.del(key);
            continue;
          }
          
          attributes.push(attribute);
        }
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
      // For now, return empty result since we're using cache only
      // In production, this would query the database
      return {
        attributes: [],
        total: 0
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
      const cacheKey = this.getCacheKey(entityType, entityId, attributeKey);
      const result = await this.redis.del(cacheKey);
      return result > 0;
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
    const results: EntityAttribute[] = [];
    
    for (const attr of attributes) {
      try {
        const result = await this.setAttribute(
          attr.entityType,
          attr.entityId,
          attr.attributeKey,
          attr.attributeValue,
          {
            expiresAt: attr.expiresAt,
            userId: attr.userId || userId
          }
        );
        results.push(result);
      } catch (error) {
        logger.error('Failed to set attribute in bulk operation', {
          entityType: attr.entityType,
          entityId: attr.entityId,
          attributeKey: attr.attributeKey,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return results;
  }
}