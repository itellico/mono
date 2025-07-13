import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';
import { CreateTenantDto, TenantStatus, TenantType } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getTenants(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    plan?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { domain: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status && query.status !== 'all') {
      where.is_active = query.status === 'active';
    }

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          accounts: {
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              accounts: true,
            },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      success: true,
      data: {
        items: tenants,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async getTenant(tenantId: string) {
    const tenant_id = tenantId;
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: parseInt(tenant_id) },
      include: {
        accounts: {
          take: 10,
          orderBy: { created_at: 'desc' },
          include: {
            users: {
              take: 1,
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
        _count: {
          select: {
            accounts: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Extract limits from settings JSON
    const settings = tenant.settings as any || {};
    const limits = settings.limits || {};
    
    // Get actual counts
    const userCount = tenant.accounts.reduce((sum, acc) => sum + acc.users.length, 0);
    const accountCount = tenant._count.accounts;
    const schemaCount = 0; // TODO: Implement when schema model exists
    const storageUsed = 0; // TODO: Implement storage tracking

    return {
      success: true,
      data: {
        ...tenant,
        users: {
          count: userCount,
          limit: limits.users || 0,
          percentage: limits.users 
            ? Math.round((userCount / limits.users) * 100) 
            : 0,
        },
        accounts: {
          count: accountCount,
        },
        schemas: {
          count: schemaCount,
        },
        storage: {
          used: storageUsed,
          limit: limits.storage || 0,
          percentage: limits.storage 
            ? Math.round((storageUsed / limits.storage) * 100) 
            : 0,
        },
      },
    };
  }

  async getTenantUsage(tenant_id: string, query: {
    metric?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = { tenant_id };

    if (query.metric) {
      where.metric = query.metric;
    }

    if (query.startDate || query.endDate) {
      where.recordedAt = {};
      if (query.startDate) where.recordedAt.gte = new Date(query.startDate);
      if (query.endDate) where.recordedAt.lte = new Date(query.endDate);
    }

    const usage = []; // []; // await this.prisma.usageRecord.findMany(...);

    return {
      success: true,
      data: usage,
    };
  }

  async getTenantSubscription(tenant_id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: parseInt(tenant_id) },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Extract plan and subscription info from settings
    const settings = tenant.settings as any || {};
    const plan = settings.plan || null;
    const subscription = settings.subscription || null;
    const customLimits = settings.limits || {};

    return {
      success: true,
      data: {
        plan,
        subscription,
        customLimits,
      },
    };
  }

  async updateTenantSubscription(tenant_id: string, data: {
    planId: string;
    expiresAt?: string;
    customLimits?: Record<string, number>;
  }) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: parseInt(tenant_id) },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const plan = null; // null; // await this.prisma.plan.findUnique(...);

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    await this.prisma.tenant.update({
      where: { id: parseInt(tenant_id) },
      data: {
        settings: {
          ...(tenant.settings as any || {}),
          plan: { id: data.planId },
          limits: data.customLimits || {},
          expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
        },
      },
    });

    return {
      success: true,
      data: {
        message: 'Subscription updated successfully',
      },
    };
  }

  async getTenantFeatures(tenant_id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: parseInt(tenant_id) },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Extract features from settings and features JSON fields
    const settings = tenant.settings as any || {};
    const features = tenant.features as any || {};
    const planFeatures = settings.planFeatures || [];
    const customFeatures = features.enabled || [];

    return {
      success: true,
      data: {
        planFeatures,
        customFeatures,
        allFeatures: [...planFeatures, ...customFeatures],
      },
    };
  }

  async enableFeature(tenant_id: string, featureId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: parseInt(tenant_id) },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // await this.prisma.tenantFeature.create({
    //   data: {
    //     tenant_id,
    //     featureId,
    //     enabledBy: 'platform',
    //   },
    // });

    // Clear cache
    await this.redis.del(`tenant:${tenant_id}:features`);

    return {
      success: true,
      data: {
        message: 'Feature enabled successfully',
      },
    };
  }

  async disableFeature(tenant_id: string, featureId: string) {
    // await this.prisma.tenantFeature.deleteMany({
    //   where: {
    //     tenant_id,
    //     featureId,
    //   },
    // });

    // Clear cache
    await this.redis.del(`tenant:${tenant_id}:features`);

    return {
      success: true,
      data: {
        message: 'Feature disabled successfully',
      },
    };
  }

  async getTenantSettings(tenant_id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: parseInt(tenant_id) },
      select: { settings: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return {
      success: true,
      data: tenant.settings,
    };
  }

  async createTenant(userId: string, createTenantDto: CreateTenantDto) {
    // Check if tenant with this name already exists
    const existing = await this.prisma.tenant.findFirst({
      where: { name: createTenantDto.name },
    });

    if (existing) {
      throw new ConflictException('Tenant with this name already exists');
    }

    // Check if domain (subdomain) already exists
    const existingDomain = await this.prisma.tenant.findFirst({
      where: { domain: createTenantDto.subdomain },
    });

    if (existingDomain) {
      throw new ConflictException('Subdomain already in use');
    }

    // Merge all settings into one object
    const defaultSettings = {
      features: [],
      max_accounts: 10,
      max_users: 100,
      storage_quota_mb: 10240,
      timezone: 'UTC',
      language: 'en',
      currency: 'USD',
      dateFormat: 'YYYY-MM-DD',
    };

    const settings = {
      ...defaultSettings,
      ...(createTenantDto.settings || {}),
      limits: createTenantDto.limits || {
        users: 100,
        storage: 10240,
        apiCalls: 1000000,
        customFields: 50,
      },
      metadata: createTenantDto.metadata || {},
      status: createTenantDto.status || TenantStatus.TRIAL,
      type: createTenantDto.type || TenantType.STANDARD,
      planId: createTenantDto.planId,
    };

    const tenant = await this.prisma.tenant.create({
      data: {
        name: createTenantDto.name,
        domain: createTenantDto.subdomain,
        description: createTenantDto.description ? { text: createTenantDto.description } : null,
        is_active: createTenantDto.status !== TenantStatus.SUSPENDED,
        settings,
        default_currency: createTenantDto.settings?.currency || 'USD',
      },
    });

    // Create admin account for the tenant
    const adminAccount = await this.prisma.account.create({
      data: {
        tenant_id: tenant.id,
        email: createTenantDto.adminEmail,
        email_verified: false,
        account_type: 'BUSINESS',
        is_active: true,
      },
    });

    // Hash a temporary password
    const tempPassword = randomUUID();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Update account with password
    await this.prisma.account.update({
      where: { id: adminAccount.id },
      data: { password_hash: passwordHash },
    });

    // Create admin user
    const [firstName, ...lastNameParts] = createTenantDto.adminName.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    await this.prisma.user.create({
      data: {
        account_id: adminAccount.id,
        first_name: firstName,
        last_name: lastName,
        username: createTenantDto.adminEmail.split('@')[0] + '_' + tenant.id,
        user_type: 'INDIVIDUAL', // Use valid enum value
        account_role_id: 1, // Assuming admin role has ID 1
        is_active: true,
      },
    });

    return {
      success: true,
      data: {
        tenant,
        adminAccount: {
          email: adminAccount.email,
          tempPassword, // Send this via email in production
        },
      },
    };
  }

  async updateTenant(tenantId: string, updateTenantDto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: parseInt(tenantId) },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const updated = await this.prisma.tenant.update({
      where: { id: parseInt(tenantId) },
      data: updateTenantDto,
    });

    // Clear cache
    await this.redis.del(`tenant:${tenantId}:*`);

    return {
      success: true,
      data: updated,
    };
  }

  async deleteTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: parseInt(tenantId) },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Soft delete by setting is_active to false
    await this.prisma.tenant.update({
      where: { id: parseInt(tenantId) },
      data: { is_active: false },
    });

    // Clear cache
    await this.redis.del(`tenant:${tenantId}:*`);

    return {
      success: true,
      data: { message: 'Tenant deleted successfully' },
    };
  }

  async suspendTenant(tenantId: string, data: { reason?: string }) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: parseInt(tenantId) },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    await this.prisma.tenant.update({
      where: { id: parseInt(tenantId) },
      data: {
        is_active: false,
        settings: {
          ...(tenant.settings as any || {}),
          suspended: true,
          suspendedAt: new Date().toISOString(),
          suspendReason: data.reason,
        },
      },
    });

    return {
      success: true,
      data: { message: 'Tenant suspended successfully' },
    };
  }

  async activateTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: parseInt(tenantId) },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    await this.prisma.tenant.update({
      where: { id: parseInt(tenantId) },
      data: {
        is_active: true,
        settings: {
          ...(tenant.settings as any || {}),
          suspended: false,
          activatedAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      data: { message: 'Tenant activated successfully' },
    };
  }

  async getTenantStats(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: parseInt(tenantId) },
      include: {
        accounts: {
          include: {
            users: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const stats = {
      accounts: tenant.accounts.length,
      users: tenant.accounts.reduce((sum, acc) => sum + acc.users.length, 0),
      status: tenant.is_active ? 'active' : 'inactive',
      created_at: tenant.created_at,
    };

    return {
      success: true,
      data: stats,
    };
  }

  async updateTenantSettings(tenant_id: string, settings: Record<string, any>) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: parseInt(tenant_id) },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    await this.prisma.tenant.update({
      where: { id: parseInt(tenant_id) },
      data: {
        settings: {
          ...tenant.settings as any,
          ...settings,
        },
      },
    });

    // Clear cache
    await this.redis.del(`tenant:${tenant_id}:settings`);

    return {
      success: true,
      data: {
        message: 'Settings updated successfully',
      },
    };
  }

  async createTenantBackup(tenant_id: string, options: {
    includeMedia?: boolean;
    compress?: boolean;
  }) {
    // TODO: Implement backup logic
    return {
      success: true,
      data: {
        message: 'Backup initiated',
        backupId: randomUUID(),
        status: 'in_progress',
      },
    };
  }

  async exportTenantData(tenant_id: string, query: {
    format?: 'json' | 'csv' | 'sql';
  }) {
    // TODO: Implement export logic
    return {
      success: true,
      data: {
        message: 'Export initiated',
        exportId: randomUUID(),
        format: query.format || 'json',
      },
    };
  }

  async cloneTenant(sourceId: string, userId: string, data: {
    name: string;
    subdomain: string;
    cloneData?: boolean;
    cloneUsers?: boolean;
    cloneSettings?: boolean;
  }) {
    const source = await this.prisma.tenant.findUnique({
      where: { id: parseInt(sourceId) },
    });

    if (!source) {
      throw new NotFoundException('Source tenant not found');
    }

    const sourceSettings = source.settings as any || {};
    const clonedSettings = data.cloneSettings ? {
      ...sourceSettings,
      clonedFrom: sourceId,
      clonedAt: new Date().toISOString(),
    } : {
      clonedFrom: sourceId,
      clonedAt: new Date().toISOString(),
    };

    // Create new tenant
    const newTenant = await this.createTenant(userId, {
      name: data.name,
      subdomain: data.subdomain,
      adminEmail: 'admin@' + data.subdomain + '.com', // TODO: Get from user input
      adminName: 'Admin',
      description: `Clone of ${source.name}`,
      status: TenantStatus.TRIAL,
      settings: clonedSettings,
    });

    // TODO: Clone data if requested

    return {
      success: true,
      data: newTenant.data,
    };
  }
}