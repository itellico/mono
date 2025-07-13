import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

interface TagFilters {
  search?: string;
  category?: string;
  scope?: string;
  tenantId?: number;
  accountId?: number;
  includeInherited?: boolean;
}

interface TagInheritanceRequest {
  sourceTagId: number;
  targetScope: 'tenant' | 'account';
  targetTenantIds?: number[];
  targetAccountIds?: number[];
  inheritedBy: number;
}

export class TagService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get tags with inheritance support
   */
  async getTags(
    scope: 'platform' | 'tenant' | 'account',
    scopeId: number | null,
    filters: TagFilters = {}
  ) {
    const { search, category, includeInherited = true } = filters;

    // Build base where clause
    const baseWhere: any = { scope };
    
    if (scope === 'tenant' && scopeId) {
      baseWhere.tenantId = scopeId;
    } else if (scope === 'account' && scopeId) {
      baseWhere.accountId = scopeId;
    } else if (scope === 'platform') {
      baseWhere.tenantId = null;
      baseWhere.accountId = null;
    }

    if (search) {
      baseWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      baseWhere.category = category;
    }

    // Get direct tags
    const directTags = await this.prisma.tag.findMany({
      where: baseWhere,
      orderBy: { name: 'asc' },
    });

    if (!includeInherited) {
      return directTags;
    }

    // Get inherited tags based on scope
    let inheritedTags: any[] = [];

    if (scope === 'tenant' && scopeId) {
      // Get platform tags inherited by this tenant
      const platformInheritances = await this.prisma.tagInheritance.findMany({
        where: {
          targetScope: 'tenant',
          targetTenantId: scopeId,
        },
        include: {
          sourceTag: true,
        },
      });

      inheritedTags = platformInheritances
        .map(i => ({ ...i.sourceTag, inheritedFrom: 'platform' }));
    } else if (scope === 'account' && scopeId) {
      // Get tenant and platform tags inherited by this account
      const accountInheritances = await this.prisma.tagInheritance.findMany({
        where: {
          targetScope: 'account',
          targetAccountId: scopeId,
        },
        include: {
          sourceTag: true,
        },
      });

      // Also get tenant's own tags (implicit inheritance)
      const account = await this.prisma.account.findUnique({
        where: { id: scopeId },
        select: { tenantId: true },
      });

      if (account) {
        const tenantTags = await this.prisma.tag.findMany({
          where: {
            scope: 'tenant',
            tenantId: account.tenantId,
            ...(search && {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
              ],
            }),
            ...(category && { category }),
          },
        });

        // Get platform tags inherited by the tenant
        const tenantInheritances = await this.prisma.tagInheritance.findMany({
          where: {
            targetScope: 'tenant',
            targetTenantId: account.tenantId,
          },
          include: {
            sourceTag: {
              where: {
                ...(search && {
                  OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { slug: { contains: search, mode: 'insensitive' } },
                  ],
                }),
                ...(category && { category }),
              },
            },
          },
        });

        inheritedTags = [
          ...accountInheritances.map(i => ({ ...i.sourceTag, inheritedFrom: i.sourceTag.scope })),
          ...tenantTags.map(t => ({ ...t, inheritedFrom: 'tenant' })),
          ...tenantInheritances.filter(i => i.sourceTag).map(i => ({ ...i.sourceTag, inheritedFrom: 'platform' })),
        ];
      }
    }

    // Combine and deduplicate tags
    const allTags = [...directTags, ...inheritedTags];
    const uniqueTags = Array.from(
      new Map(allTags.map(t => [t.slug, t])).values()
    );

    return uniqueTags;
  }

  /**
   * Create a new tag
   */
  async createTag(
    scope: 'platform' | 'tenant' | 'account',
    data: {
      name: string;
      slug?: string;
      description?: string;
      category?: string;
      isActive?: boolean;
      isSystem?: boolean;
      tenantId?: number;
      accountId?: number;
      createdBy: number;
    }
  ) {
    const slug = data.slug || data.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug already exists in the same scope
    const existingTag = await this.prisma.tag.findFirst({
      where: {
        slug,
        scope,
        ...(scope === 'tenant' && { tenantId: data.tenantId }),
        ...(scope === 'account' && { accountId: data.accountId }),
        ...(scope === 'platform' && { tenantId: null, accountId: null }),
      },
    });

    if (existingTag) {
      throw new Error('TAG_SLUG_EXISTS');
    }

    return await this.prisma.tag.create({
      data: {
        uuid: crypto.randomUUID(),
        name: data.name,
        slug,
        description: data.description,
        category: data.category,
        scope,
        tenantId: scope === 'platform' ? null : data.tenantId,
        accountId: scope === 'account' ? data.accountId : null,
        isActive: data.isActive ?? true,
        isSystem: data.isSystem ?? false,
        createdBy: data.createdBy,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Grant tag inheritance
   */
  async grantTagInheritance(request: TagInheritanceRequest) {
    const { sourceTagId, targetScope, targetTenantIds = [], targetAccountIds = [], inheritedBy } = request;

    const inheritances: any[] = [];

    if (targetScope === 'tenant' && targetTenantIds.length > 0) {
      for (const tenantId of targetTenantIds) {
        inheritances.push({
          sourceTagId,
          targetScope: 'tenant',
          targetTenantId: tenantId,
          inheritedBy,
        });
      }
    } else if (targetScope === 'account' && targetAccountIds.length > 0) {
      for (const accountId of targetAccountIds) {
        inheritances.push({
          sourceTagId,
          targetScope: 'account',
          targetAccountId: accountId,
          inheritedBy,
        });
      }
    }

    if (inheritances.length > 0) {
      const result = await this.prisma.tagInheritance.createMany({
        data: inheritances,
        skipDuplicates: true,
      });
      return result.count;
    }

    return 0;
  }

  /**
   * Revoke tag inheritance
   */
  async revokeTagInheritance(
    sourceTagId: number,
    targetScope: 'tenant' | 'account',
    targetIds: number[]
  ) {
    const deleteWhere: any = {
      sourceTagId,
      targetScope,
    };

    if (targetScope === 'tenant') {
      deleteWhere.targetTenantId = { in: targetIds };
    } else {
      deleteWhere.targetAccountId = { in: targetIds };
    }

    const result = await this.prisma.tagInheritance.deleteMany({
      where: deleteWhere,
    });

    return result.count;
  }

  /**
   * Get tag usage statistics
   */
  async getTagUsageStats(tagId: number) {
    const [entityCount, inheritanceCount] = await Promise.all([
      this.prisma.entityTag.count({ where: { tagId } }),
      this.prisma.tagInheritance.count({ where: { sourceTagId: tagId } }),
    ]);

    return {
      entityCount,
      inheritanceCount,
      totalUsage: entityCount + inheritanceCount,
    };
  }

  /**
   * Get tag by UUID
   */
  async getTagByUuid(uuid: string, scope?: string, scopeId?: number) {
    const where: any = { uuid };
    
    if (scope) {
      where.scope = scope;
      if (scope === 'tenant' && scopeId) {
        where.tenantId = scopeId;
      } else if (scope === 'account' && scopeId) {
        where.accountId = scopeId;
      }
    }

    return await this.prisma.tag.findFirst({ where });
  }

  /**
   * Update tag
   */
  async updateTag(tagId: number, data: Partial<{
    name: string;
    description: string;
    category: string;
    isActive: boolean;
  }>) {
    return await this.prisma.tag.update({
      where: { id: tagId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete tag
   */
  async deleteTag(tagId: number) {
    // Check if tag is in use
    const usageStats = await this.getTagUsageStats(tagId);
    
    if (usageStats.totalUsage > 0) {
      throw new Error('TAG_IN_USE');
    }

    return await this.prisma.tag.delete({
      where: { id: tagId },
    });
  }

  /**
   * Get distinct categories for a scope
   */
  async getCategories(scope: string, scopeId?: number) {
    const where: any = {
      scope,
      category: { not: null },
    };

    if (scope === 'tenant' && scopeId) {
      where.tenantId = scopeId;
    } else if (scope === 'account' && scopeId) {
      where.accountId = scopeId;
    } else if (scope === 'platform') {
      where.tenantId = null;
      where.accountId = null;
    }

    const categories = await this.prisma.tag.findMany({
      where,
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return categories.map(c => c.category).filter(Boolean);
  }
}