import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { LoggerService } from '@common/logging/logger.service';
import { RedisService } from '@common/redis/redis.service';

@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly redis: RedisService,
  ) {}
  async getTenants(query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    this.logger.logBusiness('Fetching tenants', { page, limit });

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              accounts: true,
            },
          },
        },
      }),
      this.prisma.tenant.count(),
    ]);

    // Get user counts for each tenant
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        const accountIds = await this.prisma.account.findMany({
          where: { tenant_id: tenant.id },
          select: { id: true },
        }).then(accounts => accounts.map(a => a.id));

        const userCount = await this.prisma.user.count({
          where: { account_id: { in: accountIds } },
        });

        return {
          id: tenant.id.toString(),
          name: tenant.name,
          domain: tenant.domain,
          status: tenant.is_active ? 'active' : 'inactive',
          accounts: tenant._count.accounts,
          users: userCount,
          created_at: tenant.created_at,
        };
      })
    );

    return {
      success: true,
      data: {
        items: tenantsWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async createTenant(tenantData: any) {
    this.logger.logBusiness('Creating new tenant', { name: tenantData.name, domain: tenantData.domain });

    const tenant = await this.prisma.$transaction(async (tx) => {
      // Create tenant
      const newTenant = await tx.tenant.create({
        data: {
          name: tenantData.name,
          domain: tenantData.domain,
          is_active: true,
        },
      });

      // Update tenant with settings
      await tx.tenant.update({
        where: { id: newTenant.id },
        data: {
          settings: {
            features: tenantData.features || ['basic'],
            maxAccounts: tenantData.maxAccounts || 10,
            maxUsers: tenantData.maxUsers || 100,
            storageQuotaMB: tenantData.storageQuotaMB || 10240,
          },
        },
      });

      // Create default admin account
      const adminAccount = await tx.account.create({
        data: {
          tenant_id: newTenant.id,
          email: tenantData.adminEmail,
          password_hash: tenantData.adminPasswordHash || '',
          is_active: true,
          account_type: 'BUSINESS',
        },
      });

      // Create admin user
      const adminUser = await tx.user.create({
        data: {
          account_id: adminAccount.id,
          first_name: 'Tenant',
          last_name: 'Admin',
          username: `admin_${newTenant.id}`,
          user_type: 'INDIVIDUAL', // Use valid enum value
          is_active: true,
          account_role_id: 3, // Admin role ID
        },
      });

      // Create platform admin role
      const adminRole = await tx.role.create({
        data: {
          tenant_id: newTenant.id,
          name: 'Tenant Admin',
          code: `tenant_admin_${newTenant.id}`,
          description: 'Default tenant administrator role',
          is_system: true,
        },
      });

      // Assign role to admin user
      await tx.userRole.create({
        data: {
          user_id: adminUser.id,
          role_id: adminRole.id,
        },
      });

      return newTenant;
    });

    // TODO: Queue welcome email (RabbitMQ disabled)
    // await this.rabbitmq.queueEmailJob({
    //   to: tenantData.adminEmail,
    //   subject: 'Welcome to itellico',
    //   template: 'tenant-welcome',
    //   data: {
    //     tenantName: tenant.name,
    //     tenantDomain: tenant.domain,
    //   },
    // });

    // Log platform event
    this.logger.logSecurity(`New tenant created: ${tenant.name}`, 'low', {
      tenant_id: tenant.id,
      domain: tenant.domain,
    });

    return {
      success: true,
      data: {
        id: tenant.id.toString(),
        name: tenant.name,
        domain: tenant.domain,
        status: 'active',
        created_at: tenant.created_at,
      },
    };
  }

  async getTenant(id: string) {
    const cacheKey = `platform:tenant:${id}`;
    
    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return { success: true, data: JSON.parse(cached as string) };
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            accounts: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Get user count
    const accountIds = await this.prisma.account.findMany({
      where: { tenant_id: tenant.id },
      select: { id: true },
    }).then(accounts => accounts.map(a => a.id));

    const userCount = await this.prisma.user.count({
      where: { account_id: { in: accountIds } },
    });

    const tenantData = {
      id: tenant.id.toString(),
      name: tenant.name,
      domain: tenant.domain,
      status: tenant.is_active ? 'active' : 'inactive',
      accounts: tenant._count.accounts,
      users: userCount,
      settings: {
        features: (tenant.settings as any)?.features || [],
        maxAccounts: (tenant.settings as any)?.maxAccounts || 10,
        maxUsers: (tenant.settings as any)?.maxUsers || 100,
        storageQuotaMB: (tenant.settings as any)?.storageQuotaMB || 10240,
      },
      subscription: {
        plan: 'enterprise', // TODO: Implement subscription model
        status: 'active',
        expiresAt: '2025-12-31T23:59:59Z',
      },
      created_at: tenant.created_at,
    };

    // Cache for 5 minutes
    await this.redis.set(cacheKey, JSON.stringify(tenantData), 300);

    return { success: true, data: tenantData };
  }

  async updateTenant(id: string, updateData: any) {
    this.logger.logBusiness('Updating tenant', { tenant_id: id });

    await this.prisma.$transaction(async (tx) => {
      // Update tenant
      if (updateData.name || updateData.domain || updateData.is_active !== undefined) {
        await tx.tenant.update({
          where: { id: parseInt(id) },
          data: {
            name: updateData.name,
            domain: updateData.domain,
            is_active: updateData.is_active,
          },
        });
      }

      // Update settings
      if (updateData.settings) {
        const tenant = await tx.tenant.findUnique({ where: { id: parseInt(id) } });
        await tx.tenant.update({
          where: { id: parseInt(id) },
          data: {
            settings: {
              ...(tenant.settings as any || {}),
              ...updateData.settings,
            },
          },
        });
      }
    });

    // Invalidate cache
    await this.redis.del(`platform:tenant:${id}`);

    // Log security event if tenant is deactivated
    if (updateData.is_active === false) {
      this.logger.logSecurity(`Tenant deactivated: ${id}`, 'medium', { tenant_id: id });
    }

    return this.getTenant(id);
  }

  async getSystemStatus() {
    this.logger.logSystem('Checking system status');

    const services = {
      api: 'healthy',
      database: 'unknown',
      redis: 'unknown',
      rabbitmq: 'unknown',
    };

    // Check database
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      services.database = 'healthy';
    } catch (error) {
      services.database = 'unhealthy';
      this.logger.logSecurity('Database health check failed', 'high', { error: error.message });
    }

    // Check Redis
    try {
      await this.redis.ping();
      services.redis = 'healthy';
    } catch (error) {
      services.redis = 'unhealthy';
      this.logger.logSecurity('Redis health check failed', 'high', { error: error.message });
    }

    // Check RabbitMQ (disabled)
    try {
      services.rabbitmq = 'disabled'; // RabbitMQ is disabled in development
    } catch (error) {
      services.rabbitmq = 'unhealthy';
      this.logger.logSecurity('RabbitMQ health check failed', 'high', { error: error.message });
    }

    const allHealthy = Object.values(services).every(status => status === 'healthy');

    return {
      success: true,
      data: {
        status: allHealthy ? 'operational' : 'degraded',
        services,
        uptime: process.uptime(),
        version: process.env.npm_package_version || '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getSystemMetrics() {
    const cacheKey = 'platform:metrics';
    
    // Check cache (short TTL for metrics)
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return { success: true, data: JSON.parse(cached as string) };
    }

    this.logger.logBusiness('Calculating system metrics');

    // Get counts in parallel
    const [tenantCount, accountCount, userCount] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.account.count(),
      this.prisma.user.count(),
    ]);

    // Get API request metrics from audit logs
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [todayRequests, weekRequests, monthRequests] = await Promise.all([
      Promise.resolve(0), // TODO: Implement audit log counts
      Promise.resolve(0), // TODO: Implement audit log counts
      Promise.resolve(0), // TODO: Implement audit log counts
    ]);
    
    // Calculate metrics
    const metrics = {
      tenants: {
        total: tenantCount,
        active: await this.prisma.tenant.count({ where: { is_active: true } }),
        inactive: await this.prisma.tenant.count({ where: { is_active: false } }),
      },
      accounts: {
        total: accountCount,
        active: await this.prisma.account.count({ where: { is_active: true } }),
      },
      users: {
        total: userCount,
        active: await this.prisma.user.count({ where: { is_active: true } }),
      },
      apiRequests: {
        today: todayRequests,
        week: weekRequests,
        month: monthRequests,
      },
      system: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        uptime: process.uptime(),
      },
    };

    // Cache for 30 seconds
    await this.redis.set(cacheKey, JSON.stringify(metrics), 30);

    return {
      success: true,
      data: metrics,
    };
  }

  async getSettings() {
    const cacheKey = 'platform:settings';
    
    // Check cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return { success: true, data: JSON.parse(cached as string) };
    }

    // TODO: Store these in database configuration table
    const settings = {
      platform: {
        name: 'itellico',
        version: process.env.npm_package_version || '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        baseUrl: process.env.BASE_URL || 'http://localhost:3001',
      },
      features: {
        multiTenant: true,
        apiAccess: true,
        customDomains: true,
        webhooks: true,
        audit: true,
        analytics: true,
      },
      limits: {
        maxTenantsPerPlatform: 1000,
        maxAccountsPerTenant: 100,
        maxUsersPerAccount: 500,
        maxApiRequestsPerMinute: 600,
        maxFileUploadSizeMB: 100,
      },
      security: {
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireNumbers: true,
        passwordRequireSpecial: true,
        sessionTimeoutMinutes: 1440, // 24 hours
        mfaRequired: false,
      },
      maintenance: {
        mode: false,
        message: null,
        scheduledAt: null,
      },
    };

    // Cache for 1 hour
    await this.redis.set(cacheKey, JSON.stringify(settings), 3600);

    return { success: true, data: settings };
  }

  async updateSettings(settings: any) {
    this.logger.logBusiness('Updating platform settings', { sections: Object.keys(settings) });

    // TODO: Persist to database configuration table
    // For now, just update cache
    
    const currentSettings = await this.getSettings();
    const updatedSettings = {
      ...currentSettings.data,
      ...settings,
      updated_at: new Date().toISOString(),
    };

    // Cache updated settings
    await this.redis.set('platform:settings', JSON.stringify(updatedSettings), 3600);

    // Log critical security changes
    if (settings.security) {
      this.logger.logSecurity('Platform security settings updated', 'high', { 
        changes: Object.keys(settings.security),
      });
    }

    // TODO: Queue notification to platform admins (RabbitMQ disabled)
    if (settings.maintenance?.mode === true) {
      // await this.rabbitmq.queueNotificationJob({
      //   user_id: 'platform', // TODO: Send to all platform admins
      //   type: 'platform.maintenance',
      //   title: 'Maintenance Mode Activated',
      //   message: settings.maintenance.message || 'The platform is entering maintenance mode',
      //   data: {
      //     maintenanceMode: true,
      //     message: settings.maintenance.message,
      //     scheduledAt: settings.maintenance.scheduledAt,
      //   },
      //   // priority: 10, // TODO: Add priority to notification job type
      // });
    }

    return { success: true, data: updatedSettings };
  }

  private async getPlatformAdmins() {
    // Get all users with platform admin permissions
    const platformAdmins = await this.prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              code: {
                startsWith: 'platform_',
              },
            },
          },
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        account: {
          select: {
            email: true,
          },
        },
      },
    });

    return platformAdmins.map(admin => ({
      id: admin.id,
      name: `${admin.first_name} ${admin.last_name}`,
      email: admin.account.email,
    }));
  }

  async getSubscriptions() {
    // TODO: Implement
    return {
      success: true,
      data: [],
    };
  }
}
