import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { LoggerService } from '@common/logging/logger.service';
import { RedisService } from '@common/redis/redis.service';

@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly redis: RedisService,
  ) {}
  
  async getAccounts(tenant_id: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    this.logger.logBusiness('Fetching accounts for tenant', { tenant_id, page, limit });

    const [accounts, total] = await Promise.all([
      this.prisma.account.findMany({
        where: { tenant_id: parseInt(tenant_id) },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      }),
      this.prisma.account.count({
        where: { tenant_id: parseInt(tenant_id) },
      }),
    ]);

    return {
      success: true,
      data: {
        items: accounts.map(account => ({
          id: account.id.toString(),
          name: account.email,
          email: account.email,
          users: account._count.users,
          status: account.is_active ? 'active' : 'inactive',
          created_at: account.created_at,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async createAccount(tenant_id: string, accountData: any) {
    this.logger.logBusiness('Creating account for tenant', { tenant_id, accountName: accountData.name });

    const account = await this.prisma.account.create({
      data: {
        tenant_id: parseInt(tenant_id),
        email: accountData.email,
        password_hash: accountData.passwordHash || '',
        account_type: accountData.type || 'business',
        is_active: true,
      },
    });

    // Invalidate tenant accounts cache
    await this.redis.del(`tenant:${tenant_id}:accounts:*`);

    return {
      success: true,
      data: {
        id: account.id.toString(),
        tenant_id: account.tenant_id.toString(),
        name: account.email,
        email: account.email,
        created_at: account.created_at,
      },
    };
  }

  async getUsers(tenant_id: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    this.logger.logBusiness('Fetching users for tenant', { tenant_id, page, limit });

    // Get all accounts for this tenant first
    const accounts = await this.prisma.account.findMany({
      where: { tenant_id: parseInt(tenant_id) },
      select: { id: true },
    });
    
    const accountIds = accounts.map(a => a.id);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { account_id: { in: accountIds } },
        skip,
        take: limit,
        include: {
          userRoles: {
            include: {
              role: {
                select: {
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({
        where: { account_id: { in: accountIds } },
      }),
    ]);

    return {
      success: true,
      data: {
        items: users.map(user => ({
          id: user.id.toString(),
          name: `${user.first_name} ${user.last_name}`,
          email: 'user@example.com', // TODO: Get from account
          account_id: user.account_id.toString(),
          accountName: 'Account', // TODO: Get from account
          roles: user.userRoles?.map(ur => ur.role.name) || [],
          status: user.is_active ? 'active' : 'inactive',
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async getSettings(tenant_id: string) {
    const cacheKey = `tenant:${tenant_id}:settings`;
    
    // Check cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return { success: true, data: JSON.parse(cached as string) };
    }

    this.logger.logBusiness('Fetching settings for tenant', { tenant_id });

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: parseInt(tenant_id) },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const settings = {
      tenant_id,
      features: [],
      maxAccounts: 10,
      maxUsers: 100,
      storageQuotaMB: 10240,
      customDomain: tenant.domain,
      status: tenant.is_active ? 'active' : 'inactive',
    };

    // Cache for 1 hour
    await this.redis.set(cacheKey, JSON.stringify(settings), 3600);

    return { success: true, data: settings };
  }

  async updateSettings(tenant_id: string, settings: any) {
    this.logger.logBusiness('Updating settings for tenant', { tenant_id });

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: parseInt(tenant_id) },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Update tenant settings
    await this.prisma.tenant.update({
      where: { id: parseInt(tenant_id) },
      data: {
        settings: {
          ...(tenant.settings as any || {}),
          ...settings,
        },
      },
    });

    // Invalidate cache
    await this.redis.del(`tenant:${tenant_id}:settings`);

    return this.getSettings(tenant_id);
  }

  async getAnalytics(tenant_id: string) {
    this.logger.logBusiness('Fetching analytics for tenant', { tenant_id });

    // Get all accounts for this tenant
    const accounts = await this.prisma.account.findMany({
      where: { tenant_id: parseInt(tenant_id) },
      select: { id: true },
    });
    
    const accountIds = accounts.map(a => a.id);

    // Get counts
    const [accountCount, userCount, activeUserCount] = await Promise.all([
      this.prisma.account.count({ where: { tenant_id: parseInt(tenant_id) } }),
      this.prisma.user.count({ where: { account_id: { in: accountIds } } }),
      this.prisma.user.count({ 
        where: { 
          account_id: { in: accountIds },
          is_active: true,
        },
      }),
    ]);

    // Calculate growth (mock data for now)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const newUsersLast30Days = await this.prisma.user.count({
      where: {
        account_id: { in: accountIds },
        created_at: { gte: thirtyDaysAgo },
      },
    });

    return {
      success: true,
      data: {
        accounts: {
          total: accountCount,
          growth: {
            percentage: 5.2, // Mock data
            trend: 'up',
          },
        },
        users: {
          total: userCount,
          active: activeUserCount,
          inactive: userCount - activeUserCount,
          newLast30Days: newUsersLast30Days,
          growth: {
            percentage: newUsersLast30Days > 0 ? 10.5 : 0, // Mock calculation
            trend: newUsersLast30Days > 0 ? 'up' : 'stable',
          },
        },
        activity: {
          dau: Math.floor(activeUserCount * 0.3), // Mock: 30% DAU
          wau: Math.floor(activeUserCount * 0.7), // Mock: 70% WAU
          mau: activeUserCount,
        },
        usage: {
          storage: {
            used: 1024, // Mock: 1GB
            limit: 10240, // Mock: 10GB
            percentage: 10,
          },
          apiCalls: {
            today: 1234, // Mock data
            month: 45678, // Mock data
            limit: 1000000,
          },
        },
      },
    };
  }
}