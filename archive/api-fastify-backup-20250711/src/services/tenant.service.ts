import { PrismaClient, Tenant, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { TenantInitializationService } from './tenant-initialization.service';
import { NotFoundError, BadRequestError } from '../lib/errors';

export interface CreateTenantData {
  name: string;
  domain: string;
  slug?: string;
  description?: any;
  industry?: string;
  plan?: 'standard' | 'pro' | 'enterprise';
  features?: any;
  settings?: any;
  categories?: any;
  allowedCountries?: any;
  defaultCurrency?: string;
}

export interface UpdateTenantData {
  name?: string;
  domain?: string;
  slug?: string;
  description?: any;
  features?: any;
  settings?: any;
  categories?: any;
  allowedCountries?: any;
  defaultCurrency?: string;
  isActive?: boolean;
}

export interface TenantListOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  industry?: string;
  plan?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'revenue';
  sortOrder?: 'asc' | 'desc';
}

export class TenantService {
  constructor(
    private prisma: PrismaClient,
    private tenantInitService: TenantInitializationService
  ) {}

  async create(data: CreateTenantData): Promise<Tenant> {
    // Validate unique constraints
    const existingTenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { domain: data.domain },
          { slug: data.slug }
        ]
      }
    });

    if (existingTenant) {
      if (existingTenant.domain === data.domain) {
        throw new BadRequestError('A tenant with this domain already exists');
      }
      if (existingTenant.slug === data.slug) {
        throw new BadRequestError('A tenant with this slug already exists');
      }
    }

    // Generate slug if not provided
    const slug = data.slug || data.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create tenant with transaction
    const tenant = await this.prisma.$transaction(async (tx) => {
      // Create the tenant
      const newTenant = await tx.tenant.create({
        data: {
          uuid: randomUUID(),
          name: data.name,
          domain: data.domain,
          slug,
          description: data.description || { industry: data.industry || 'general' },
          features: data.features || {},
          settings: data.settings || {
            plan: data.plan || 'standard',
            allowedCountries: data.allowedCountries || ['US'],
            defaultCurrency: data.defaultCurrency || 'USD'
          },
          categories: data.categories || [],
          allowedCountries: data.allowedCountries,
          defaultCurrency: data.defaultCurrency || 'USD',
          updatedAt: new Date()
        }
      });

      // Initialize tenant (create default data)
      await this.tenantInitService.initializeTenant(newTenant.id);

      return newTenant;
    });

    return tenant;
  }

  async update(id: number | string, data: UpdateTenantData): Promise<Tenant> {
    const where = typeof id === 'number' 
      ? { id } 
      : { uuid: id };

    // Check if tenant exists
    const existing = await this.prisma.tenant.findFirst({ where });
    if (!existing) {
      throw new NotFoundError('Tenant not found');
    }

    // Validate unique constraints if updating domain or slug
    if (data.domain || data.slug) {
      const conflicts = await this.prisma.tenant.findFirst({
        where: {
          AND: [
            { id: { not: existing.id } },
            {
              OR: [
                data.domain ? { domain: data.domain } : {},
                data.slug ? { slug: data.slug } : {}
              ]
            }
          ]
        }
      });

      if (conflicts) {
        if (conflicts.domain === data.domain) {
          throw new BadRequestError('A tenant with this domain already exists');
        }
        if (conflicts.slug === data.slug) {
          throw new BadRequestError('A tenant with this slug already exists');
        }
      }
    }

    return await this.prisma.tenant.update({
      where: { id: existing.id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async findById(id: number | string): Promise<Tenant | null> {
    const where = typeof id === 'number' 
      ? { id } 
      : { uuid: id };

    return await this.prisma.tenant.findFirst({ where });
  }

  async list(options: TenantListOptions = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      status = 'all',
      industry,
      plan,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const where: Prisma.TenantWhereInput = {};

    // Apply filters
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status !== 'all') {
      where.isActive = status === 'active';
    }

    if (industry) {
      where.description = {
        path: ['industry'],
        equals: industry
      };
    }

    if (plan) {
      where.settings = {
        path: ['plan'],
        equals: plan
      };
    }

    // Count total
    const total = await this.prisma.tenant.count({ where });

    // Fetch tenants with pagination
    const tenants = await this.prisma.tenant.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        _count: {
          select: {
            accounts: true,
            users: true
          }
        },
        subscriptions: {
          where: { isActive: true },
          select: {
            plan: true,
            monthlyRevenue: true,
            status: true
          }
        }
      }
    });

    // Calculate stats
    const stats = await this.getStats();

    return {
      items: tenants.map(tenant => ({
        ...tenant,
        industry: tenant.description?.industry || 'general',
        plan: tenant.settings?.plan || 'standard',
        userCount: tenant._count.users,
        accountCount: tenant._count.accounts,
        revenue: tenant.subscriptions[0]?.monthlyRevenue || 0,
        subscriptionStatus: tenant.subscriptions[0]?.status || 'trial'
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats
    };
  }

  async getStats() {
    const [
      totalTenants,
      activeThisMonth,
      newThisWeek,
      trialAccounts
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({
        where: {
          isActive: true,
          updatedAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        }
      }),
      this.prisma.tenant.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7))
          }
        }
      }),
      this.prisma.tenant.count({
        where: {
          subscriptions: {
            some: {
              status: 'trial',
              isActive: true
            }
          }
        }
      })
    ]);

    return {
      totalTenants,
      activeThisMonth,
      newThisWeek,
      trialAccounts
    };
  }

  async delete(id: number | string): Promise<void> {
    const where = typeof id === 'number' 
      ? { id } 
      : { uuid: id };

    const tenant = await this.prisma.tenant.findFirst({ where });
    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    // Use transaction for cleanup and deletion
    await this.prisma.$transaction(async (tx) => {
      // Cleanup tenant data
      await this.tenantInitService.cleanupTenant(tenant.id);

      // Delete the tenant
      await tx.tenant.delete({
        where: { id: tenant.id }
      });
    });
  }

  async suspend(id: number | string): Promise<Tenant> {
    return await this.update(id, { isActive: false });
  }

  async reactivate(id: number | string): Promise<Tenant> {
    return await this.update(id, { isActive: true });
  }
}