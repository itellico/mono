import { PrismaClient } from '@prisma/client';
import { FastifyRedis } from '@fastify/redis';
import { z } from 'zod';
import { generateSlug } from '../utils/slug';
import { invalidateRedisPattern } from '../utils/cache-utils';
import type { FastifyBaseLogger } from 'fastify';

// Input validation schemas
const createTagSchema = z.object({
  tenantId: z.number().int().positive(),
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50).optional(),
  isSystem: z.boolean().optional().default(false),
  createdBy: z.number().int().positive(),
});

const updateTagSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100).optional(),
  category: z.string().min(1).max(50).optional(),
  isSystem: z.boolean().optional(),
});

const addEntityTagSchema = z.object({
  tenantId: z.number().int().positive(),
  tagId: z.number().int().positive(),
  entityType: z.string().min(1).max(50),
  entityId: z.string().uuid(),
  addedBy: z.number().int().positive(),
});

const removeEntityTagSchema = z.object({
  tagId: z.number().int().positive(),
  entityType: z.string().min(1).max(50),
  entityId: z.string().uuid(),
});

const getEntityTagsSchema = z.object({
  entityType: z.string().min(1).max(50),
  entityId: z.string().uuid(),
  includeMetadata: z.boolean().optional().default(false),
});

const findEntitiesByTagsSchema = z.object({
  tenantId: z.number().int().positive(),
  entityType: z.string().min(1).max(50),
  tagIds: z.array(z.number().int().positive()).min(1),
  matchAll: z.boolean().optional().default(false),
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

const searchTagsSchema = z.object({
  tenantId: z.number().int().positive(),
  query: z.string().min(1),
  category: z.string().optional(),
  limit: z.number().int().positive().max(50).optional().default(20),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type AddEntityTagInput = z.infer<typeof addEntityTagSchema>;
export type RemoveEntityTagInput = z.infer<typeof removeEntityTagSchema>;
export type GetEntityTagsInput = z.infer<typeof getEntityTagsSchema>;
export type FindEntitiesByTagsInput = z.infer<typeof findEntitiesByTagsSchema>;
export type SearchTagsInput = z.infer<typeof searchTagsSchema>;

export class TagsService {
  private prisma: PrismaClient;
  private redis: FastifyRedis;
  private logger?: FastifyBaseLogger;

  constructor(prisma: PrismaClient, redis: FastifyRedis, logger?: FastifyBaseLogger) {
    this.prisma = prisma;
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Create a new tag
   */
  async createTag(input: CreateTagInput) {
    const validated = createTagSchema.parse(input);
    
    // Generate slug from name
    const slug = generateSlug(validated.name);
    
    // Check if tag already exists with same slug in tenant
    const existing = await this.prisma.tag.findFirst({
      where: {
        tenantId: validated.tenantId,
        slug,
      },
    });
    
    if (existing) {
      throw new Error('Tag with this name already exists');
    }
    
    const tag = await this.prisma.tag.create({
      data: {
        ...validated,
        slug,
      },
    });
    
    // Invalidate cache
    await this.invalidateTagCache(validated.tenantId);
    
    return tag;
  }
  
  /**
   * Update an existing tag
   */
  async updateTag(input: UpdateTagInput) {
    const validated = updateTagSchema.parse(input);
    
    const existing = await this.prisma.tag.findUnique({
      where: { id: validated.id },
    });
    
    if (!existing) {
      throw new Error('Tag not found');
    }
    
    // Generate new slug if name is being updated
    const updates: any = { ...validated };
    if (validated.name && validated.name !== existing.name) {
      updates.slug = generateSlug(validated.name);
      
      // Check for duplicate slug
      const duplicate = await this.prisma.tag.findFirst({
        where: {
          tenantId: existing.tenantId,
          slug: updates.slug,
          id: { not: validated.id },
        },
      });
      
      if (duplicate) {
        throw new Error('Tag with this name already exists');
      }
    }
    
    const tag = await this.prisma.tag.update({
      where: { id: validated.id },
      data: updates,
    });
    
    // Invalidate cache
    await this.invalidateTagCache(existing.tenantId);
    
    return tag;
  }
  
  /**
   * Get all tags for a tenant
   */
  async getTenantTags(tenantId: number, category?: string) {
    const where: any = { tenantId };
    if (category) {
      where.category = category;
    }
    
    return this.prisma.tag.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { name: 'asc' },
      ],
    });
  }
  
  /**
   * Get popular tags for a tenant (cached)
   */
  async getPopularTags(tenantId: number, limit: number = 20): Promise<any[]> {
    const cacheKey = `tenant:${tenantId}:tags:popular:${limit}`;
    
    // Try to get from cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Query database
    const tags = await this.prisma.tag.findMany({
      where: {
        tenantId,
        usageCount: { gt: 0 },
      },
      orderBy: { usageCount: 'desc' },
      take: limit,
      select: {
        id: true,
        uuid: true,
        name: true,
        slug: true,
        category: true,
        usageCount: true,
      },
    });
    
    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(tags));
    
    return tags;
  }
  
  /**
   * Add a tag to an entity
   */
  async addEntityTag(input: AddEntityTagInput) {
    const validated = addEntityTagSchema.parse(input);
    
    // Verify tag exists and belongs to tenant
    const tag = await this.prisma.tag.findFirst({
      where: {
        id: validated.tagId,
        tenantId: validated.tenantId,
      },
    });
    
    if (!tag) {
      throw new Error('Tag not found or does not belong to tenant');
    }
    
    // Create entity tag in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Check if already tagged
      const existing = await tx.entityTag.findFirst({
        where: {
          tagId: validated.tagId,
          entityType: validated.entityType,
          entityId: validated.entityId,
        },
      });
      
      if (existing) {
        return existing;
      }
      
      // Create entity tag
      const entityTag = await tx.entityTag.create({
        data: validated,
      });
      
      // Increment usage count
      await tx.tag.update({
        where: { id: validated.tagId },
        data: { usageCount: { increment: 1 } },
      });
      
      return entityTag;
    });
    
    // Invalidate caches
    await Promise.all([
      this.invalidateTagCache(validated.tenantId),
      this.invalidateEntityTagCache(validated.entityType, validated.entityId),
    ]);
    
    return result;
  }
  
  /**
   * Remove a tag from an entity
   */
  async removeEntityTag(input: RemoveEntityTagInput) {
    const validated = removeEntityTagSchema.parse(input);
    
    // Find and delete in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const entityTag = await tx.entityTag.findFirst({
        where: {
          tagId: validated.tagId,
          entityType: validated.entityType,
          entityId: validated.entityId,
        },
      });
      
      if (!entityTag) {
        throw new Error('Entity tag not found');
      }
      
      // Delete entity tag
      await tx.entityTag.delete({
        where: { id: entityTag.id },
      });
      
      // Decrement usage count
      await tx.tag.update({
        where: { id: validated.tagId },
        data: { usageCount: { decrement: 1 } },
      });
      
      return entityTag;
    });
    
    // Invalidate caches
    await Promise.all([
      this.invalidateTagCache(result.tenantId),
      this.invalidateEntityTagCache(validated.entityType, validated.entityId),
    ]);
    
    return result;
  }
  
  /**
   * Get all tags for an entity
   */
  async getEntityTags(input: GetEntityTagsInput) {
    const validated = getEntityTagsSchema.parse(input);
    
    const cacheKey = `entity:${validated.entityType}:${validated.entityId}:tags`;
    
    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached && !validated.includeMetadata) {
      return JSON.parse(cached);
    }
    
    // Query database
    const entityTags = await this.prisma.entityTag.findMany({
      where: {
        entityType: validated.entityType,
        entityId: validated.entityId,
      },
      include: {
        tag: true,
        ...(validated.includeMetadata && {
          addedByUser: {
            select: {
              id: true,
              uuid: true,
              firstName: true,
              lastName: true,
            },
          },
        }),
      },
      orderBy: { addedAt: 'desc' },
    });
    
    // Cache simple version for 5 minutes
    if (!validated.includeMetadata) {
      const simpleTags = entityTags.map(et => et.tag);
      await this.redis.setex(cacheKey, 300, JSON.stringify(simpleTags));
    }
    
    return entityTags;
  }
  
  /**
   * Find entities by tags
   */
  async findEntitiesByTags(input: FindEntitiesByTagsInput) {
    const validated = findEntitiesByTagsSchema.parse(input);
    
    // Build query
    const where: any = {
      tenantId: validated.tenantId,
      entityType: validated.entityType,
    };
    
    if (validated.matchAll) {
      // Find entities that have ALL specified tags
      const entityIds = await this.prisma.$queryRaw<{ entityId: string }[]>`
        SELECT "entityId"
        FROM "EntityTag"
        WHERE "tenantId" = ${validated.tenantId}
          AND "entityType" = ${validated.entityType}
          AND "tagId" IN (${validated.tagIds.join(',')})
        GROUP BY "entityId"
        HAVING COUNT(DISTINCT "tagId") = ${validated.tagIds.length}
        LIMIT ${validated.limit}
        OFFSET ${validated.offset}
      `;
      
      return entityIds.map(row => row.entityId);
    } else {
      // Find entities that have ANY of the specified tags
      where.tagId = { in: validated.tagIds };
      
      const entityTags = await this.prisma.entityTag.findMany({
        where,
        select: { entityId: true },
        distinct: ['entityId'],
        take: validated.limit,
        skip: validated.offset,
      });
      
      return entityTags.map(et => et.entityId);
    }
  }
  
  /**
   * Bulk add tags to multiple entities
   */
  async bulkAddTags(
    tenantId: number,
    entityType: string,
    entityIds: string[],
    tagIds: number[],
    addedBy: number
  ) {
    // Verify all tags belong to tenant
    const tags = await this.prisma.tag.findMany({
      where: {
        id: { in: tagIds },
        tenantId,
      },
    });
    
    if (tags.length !== tagIds.length) {
      throw new Error('Some tags not found or do not belong to tenant');
    }
    
    // Prepare bulk insert data
    const data: any[] = [];
    for (const entityId of entityIds) {
      for (const tagId of tagIds) {
        data.push({
          tenantId,
          tagId,
          entityType,
          entityId,
          addedBy,
        });
      }
    }
    
    // Bulk insert with conflict handling
    await this.prisma.$transaction(async (tx) => {
      // Insert entity tags, skipping duplicates
      await tx.$executeRaw`
        INSERT INTO "EntityTag" ("tenantId", "tagId", "entityType", "entityId", "addedBy")
        SELECT * FROM UNNEST(
          ${data.map(d => d.tenantId)}::int[],
          ${data.map(d => d.tagId)}::int[],
          ${data.map(d => d.entityType)}::text[],
          ${data.map(d => d.entityId)}::uuid[],
          ${data.map(d => d.addedBy)}::int[]
        )
        ON CONFLICT ("tagId", "entityType", "entityId") DO NOTHING
      `;
      
      // Update usage counts
      await tx.$executeRaw`
        UPDATE "Tag"
        SET "usageCount" = subquery.count
        FROM (
          SELECT "tagId", COUNT(*) as count
          FROM "EntityTag"
          WHERE "tagId" IN (${tagIds.join(',')})
          GROUP BY "tagId"
        ) AS subquery
        WHERE "Tag"."id" = subquery."tagId"
      `;
    });
    
    // Invalidate caches
    await Promise.all([
      this.invalidateTagCache(tenantId),
      ...entityIds.map(id => this.invalidateEntityTagCache(entityType, id)),
    ]);
  }
  
  /**
   * Search tags by name
   */
  async searchTags(input: SearchTagsInput) {
    const validated = searchTagsSchema.parse(input);
    
    const where: any = {
      tenantId: validated.tenantId,
      OR: [
        { name: { contains: validated.query, mode: 'insensitive' } },
        { slug: { contains: validated.query, mode: 'insensitive' } },
      ],
    };
    
    if (validated.category) {
      where.category = validated.category;
    }
    
    return this.prisma.tag.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { name: 'asc' },
      ],
      take: validated.limit,
    });
  }
  
  /**
   * Helper: Invalidate tag-related caches
   */
  private async invalidateTagCache(tenantId: number) {
    await invalidateRedisPattern(this.redis, `tenant:${tenantId}:tags:*`);
  }
  
  private async invalidateEntityTagCache(entityType: string, entityId: string) {
    await this.redis.del(`entity:${entityType}:${entityId}:tags`);
  }
}