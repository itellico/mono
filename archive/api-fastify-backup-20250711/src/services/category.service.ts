import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

interface CategoryFilters {
  search?: string;
  parentId?: number | null;
  scope?: string;
  tenantId?: number;
  accountId?: number;
  includeInherited?: boolean;
}

interface CategoryInheritanceRequest {
  sourceCategoryId: number;
  targetScope: 'tenant' | 'account';
  targetTenantIds?: number[];
  targetAccountIds?: number[];
  inheritedBy: number;
  includeChildren?: boolean;
}

interface CategoryNode {
  id: number;
  uuid: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
  children: CategoryNode[];
  _count?: {
    children: number;
    tags: number;
  };
  inheritedFrom?: string;
}

export class CategoryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get categories with inheritance support
   */
  async getCategories(
    scope: 'platform' | 'tenant' | 'account',
    scopeId: number | null,
    filters: CategoryFilters = {}
  ) {
    const { search, parentId, includeInherited = true } = filters;

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

    if (parentId !== undefined) {
      baseWhere.parentId = parentId;
    }

    // Get direct categories
    const directCategories = await this.prisma.category.findMany({
      where: baseWhere,
      include: {
        _count: {
          select: {
            children: true,
            tags: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    if (!includeInherited) {
      return directCategories;
    }

    // Get inherited categories based on scope
    let inheritedCategories: any[] = [];

    if (scope === 'tenant' && scopeId) {
      // Get platform categories inherited by this tenant
      const platformInheritances = await this.prisma.categoryInheritance.findMany({
        where: {
          targetScope: 'tenant',
          targetTenantId: scopeId,
        },
        include: {
          sourceCategory: {
            include: {
              _count: {
                select: {
                  children: true,
                  tags: true,
                },
              },
            },
          },
        },
      });

      inheritedCategories = platformInheritances
        .map(i => ({ ...i.sourceCategory, inheritedFrom: 'platform' }));
    } else if (scope === 'account' && scopeId) {
      // Note: Categories are not created at account level per user specification
      // But accounts can see tenant and platform categories
      const account = await this.prisma.account.findUnique({
        where: { id: scopeId },
        select: { tenantId: true },
      });

      if (account) {
        // Get tenant categories
        const tenantCategories = await this.prisma.category.findMany({
          where: {
            scope: 'tenant',
            tenantId: account.tenantId,
            ...(search && {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
              ],
            }),
            ...(parentId !== undefined && { parentId }),
          },
          include: {
            _count: {
              select: {
                children: true,
                tags: true,
              },
            },
          },
        });

        // Get platform categories inherited by the tenant
        const tenantInheritances = await this.prisma.categoryInheritance.findMany({
          where: {
            targetScope: 'tenant',
            targetTenantId: account.tenantId,
          },
          include: {
            sourceCategory: {
              where: {
                ...(search && {
                  OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { slug: { contains: search, mode: 'insensitive' } },
                  ],
                }),
                ...(parentId !== undefined && { parentId }),
              },
              include: {
                _count: {
                  select: {
                    children: true,
                    tags: true,
                  },
                },
              },
            },
          },
        });

        inheritedCategories = [
          ...tenantCategories.map(c => ({ ...c, inheritedFrom: 'tenant' })),
          ...tenantInheritances.filter(i => i.sourceCategory).map(i => ({ ...i.sourceCategory, inheritedFrom: 'platform' })),
        ];
      }
    }

    // Combine and deduplicate categories
    const allCategories = [...directCategories, ...inheritedCategories];
    const uniqueCategories = Array.from(
      new Map(allCategories.map(c => [c.slug, c])).values()
    );

    return uniqueCategories;
  }

  /**
   * Build category tree structure
   */
  async getCategoryTree(
    scope: 'platform' | 'tenant' | 'account',
    scopeId: number | null,
    includeInherited: boolean = true
  ): Promise<CategoryNode[]> {
    const categories = await this.getCategories(scope, scopeId, { includeInherited });
    
    const categoryMap = new Map<number, CategoryNode>();
    const rootCategories: CategoryNode[] = [];

    // First pass: create all nodes
    categories.forEach(category => {
      const node: CategoryNode = {
        id: category.id,
        uuid: category.uuid,
        slug: category.slug,
        name: category.name,
        description: category.description,
        isActive: category.isActive,
        isSystem: category.isSystem || false,
        children: [],
        _count: category._count,
        inheritedFrom: category.inheritedFrom,
      };
      categoryMap.set(category.id, node);
    });

    // Second pass: build tree structure
    categories.forEach(category => {
      const node = categoryMap.get(category.id)!;
      if (category.parentId && categoryMap.has(category.parentId)) {
        const parent = categoryMap.get(category.parentId)!;
        parent.children.push(node);
      } else if (!category.parentId) {
        rootCategories.push(node);
      }
    });

    // Sort children recursively
    const sortChildren = (node: CategoryNode) => {
      node.children.sort((a, b) => a.name.localeCompare(b.name));
      node.children.forEach(sortChildren);
    };

    rootCategories.sort((a, b) => a.name.localeCompare(b.name));
    rootCategories.forEach(sortChildren);

    return rootCategories;
  }

  /**
   * Create a new category
   */
  async createCategory(
    scope: 'platform' | 'tenant',
    data: {
      name: string;
      slug?: string;
      description?: string;
      parentId?: number;
      isActive?: boolean;
      isSystem?: boolean;
      tenantId?: number;
      createdBy: number;
    }
  ) {
    const slug = data.slug || data.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug already exists in the same scope
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        slug,
        scope,
        ...(scope === 'tenant' && { tenantId: data.tenantId }),
        ...(scope === 'platform' && { tenantId: null, accountId: null }),
      },
    });

    if (existingCategory) {
      throw new Error('CATEGORY_SLUG_EXISTS');
    }

    // Validate parent if provided
    if (data.parentId) {
      const parentCategory = await this.prisma.category.findFirst({
        where: {
          id: data.parentId,
          scope,
          ...(scope === 'tenant' && { tenantId: data.tenantId }),
          ...(scope === 'platform' && { tenantId: null }),
        },
      });

      if (!parentCategory) {
        throw new Error('INVALID_PARENT');
      }
    }

    return await this.prisma.category.create({
      data: {
        uuid: crypto.randomUUID(),
        name: data.name,
        slug,
        description: data.description,
        parentId: data.parentId,
        scope,
        tenantId: scope === 'platform' ? null : data.tenantId,
        accountId: null, // Categories are not created at account level
        isActive: data.isActive ?? true,
        isSystem: data.isSystem ?? false,
        createdBy: data.createdBy,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            children: true,
            tags: true,
          },
        },
      },
    });
  }

  /**
   * Grant category inheritance
   */
  async grantCategoryInheritance(request: CategoryInheritanceRequest) {
    const { 
      sourceCategoryId, 
      targetScope, 
      targetTenantIds = [], 
      targetAccountIds = [], 
      inheritedBy,
      includeChildren = true 
    } = request;

    // Get categories to grant (including children if requested)
    const categoriesToGrant = [sourceCategoryId];
    
    if (includeChildren) {
      const descendants = await this.getCategoryDescendants(sourceCategoryId);
      categoriesToGrant.push(...descendants);
    }

    const inheritances: any[] = [];

    if (targetScope === 'tenant' && targetTenantIds.length > 0) {
      for (const categoryId of categoriesToGrant) {
        for (const tenantId of targetTenantIds) {
          inheritances.push({
            sourceCategoryId: categoryId,
            targetScope: 'tenant',
            targetTenantId: tenantId,
            inheritedBy,
          });
        }
      }
    } else if (targetScope === 'account' && targetAccountIds.length > 0) {
      for (const categoryId of categoriesToGrant) {
        for (const accountId of targetAccountIds) {
          inheritances.push({
            sourceCategoryId: categoryId,
            targetScope: 'account',
            targetAccountId: accountId,
            inheritedBy,
          });
        }
      }
    }

    if (inheritances.length > 0) {
      const result = await this.prisma.categoryInheritance.createMany({
        data: inheritances,
        skipDuplicates: true,
      });
      return result.count;
    }

    return 0;
  }

  /**
   * Revoke category inheritance
   */
  async revokeCategoryInheritance(
    sourceCategoryId: number,
    targetScope: 'tenant' | 'account',
    targetIds: number[],
    includeChildren: boolean = true
  ) {
    // Get categories to revoke (including children if requested)
    const categoriesToRevoke = [sourceCategoryId];
    
    if (includeChildren) {
      const descendants = await this.getCategoryDescendants(sourceCategoryId);
      categoriesToRevoke.push(...descendants);
    }

    const deleteWhere: any = {
      sourceCategoryId: { in: categoriesToRevoke },
      targetScope,
    };

    if (targetScope === 'tenant') {
      deleteWhere.targetTenantId = { in: targetIds };
    } else {
      deleteWhere.targetAccountId = { in: targetIds };
    }

    const result = await this.prisma.categoryInheritance.deleteMany({
      where: deleteWhere,
    });

    return result.count;
  }

  /**
   * Get all descendant category IDs
   */
  private async getCategoryDescendants(parentId: number): Promise<number[]> {
    const children = await this.prisma.category.findMany({
      where: { parentId },
      select: { id: true },
    });

    const childIds = children.map(c => c.id);
    const descendantIds = await Promise.all(
      childIds.map(id => this.getCategoryDescendants(id))
    );

    return [...childIds, ...descendantIds.flat()];
  }

  /**
   * Check for circular reference
   */
  private async checkCircularReference(categoryId: number, newParentId: number): Promise<boolean> {
    if (categoryId === newParentId) return true;
    
    const parent = await this.prisma.category.findUnique({
      where: { id: newParentId },
      select: { parentId: true },
    });
    
    if (!parent || !parent.parentId) return false;
    
    return this.checkCircularReference(categoryId, parent.parentId);
  }

  /**
   * Get category by UUID
   */
  async getCategoryByUuid(uuid: string, scope?: string, scopeId?: number) {
    const where: any = { uuid };
    
    if (scope) {
      where.scope = scope;
      if (scope === 'tenant' && scopeId) {
        where.tenantId = scopeId;
      } else if (scope === 'account' && scopeId) {
        where.accountId = scopeId;
      }
    }

    return await this.prisma.category.findFirst({ 
      where,
      include: {
        _count: {
          select: {
            children: true,
            tags: true,
          },
        },
      },
    });
  }

  /**
   * Update category
   */
  async updateCategory(categoryId: number, data: Partial<{
    name: string;
    description: string;
    parentId: number | null;
    isActive: boolean;
  }>) {
    // If updating parentId, check for circular reference
    if (data.parentId !== undefined && data.parentId !== null) {
      const isCircular = await this.checkCircularReference(categoryId, data.parentId);
      if (isCircular) {
        throw new Error('CIRCULAR_REFERENCE');
      }
    }

    return await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            children: true,
            tags: true,
          },
        },
      },
    });
  }

  /**
   * Delete category
   */
  async deleteCategory(categoryId: number) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    if (!category) {
      throw new Error('CATEGORY_NOT_FOUND');
    }

    // Check if category has children
    if (category._count.children > 0) {
      throw new Error('CATEGORY_HAS_CHILDREN');
    }

    // Check if category has been inherited
    const inheritanceCount = await this.prisma.categoryInheritance.count({
      where: { sourceCategoryId: categoryId },
    });

    if (inheritanceCount > 0) {
      throw new Error('CATEGORY_INHERITED');
    }

    return await this.prisma.category.delete({
      where: { id: categoryId },
    });
  }

  /**
   * Manage category tags
   */
  async manageCategoryTags(
    categoryId: number,
    tagIds: number[],
    action: 'add' | 'remove' | 'set',
    scope: string,
    scopeId?: number,
    createdBy?: number
  ) {
    let added = 0;
    let removed = 0;

    if (action === 'set') {
      // Remove all existing tags
      const deleteResult = await this.prisma.categoryTag.deleteMany({
        where: {
          categoryId,
          scope,
          ...(scope === 'tenant' && scopeId ? { tenantId: scopeId } : {}),
          ...(scope === 'account' && scopeId ? { accountId: scopeId } : {}),
        },
      });
      removed = deleteResult.count;

      // Add new tags
      if (tagIds.length > 0) {
        const createResult = await this.prisma.categoryTag.createMany({
          data: tagIds.map(tagId => ({
            categoryId,
            tagId,
            scope,
            tenantId: scope === 'tenant' || scope === 'account' ? scopeId : null,
            accountId: scope === 'account' ? scopeId : null,
            createdBy,
          })),
          skipDuplicates: true,
        });
        added = createResult.count;
      }
    } else if (action === 'add') {
      const createResult = await this.prisma.categoryTag.createMany({
        data: tagIds.map(tagId => ({
          categoryId,
          tagId,
          scope,
          tenantId: scope === 'tenant' || scope === 'account' ? scopeId : null,
          accountId: scope === 'account' ? scopeId : null,
          createdBy,
        })),
        skipDuplicates: true,
      });
      added = createResult.count;
    } else if (action === 'remove') {
      const deleteResult = await this.prisma.categoryTag.deleteMany({
        where: {
          categoryId,
          tagId: { in: tagIds },
          scope,
        },
      });
      removed = deleteResult.count;
    }

    return { added, removed };
  }
}