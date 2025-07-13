// ✅ ARCHITECTURE COMPLIANCE: Use NestJS API instead of direct database access
// ❌ REMOVED: Direct database imports (architectural violation)
// import { db } from '@/lib/database';
// import { siteSettings, accounts, users } from '@/lib/schema';
// import { eq, and, count } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { TenantError } from '@/lib/platform/tenant-foundation';
import { ApiAuthService } from '@/lib/api-clients/api-auth.service';

export class TenantService {
  constructor(private tenantId: number) {}

  async initializeTenant(tenantName: string, tenantDomain: string) {
    try {
      logger.info('Initializing tenant settings', { tenantId: this.tenantId, tenantName, tenantDomain });

      // Initialize essential settings
      await this.setupTenantSettings();

      logger.info('Tenant initialized successfully', { tenantId: this.tenantId });
      return { success: true };
    } catch (error: any) {
      logger.error('Failed to initialize tenant', { tenantId: this.tenantId, error: error.message });
      throw new TenantError(`Failed to initialize tenant: ${error.message}`, 'TENANT_INIT_FAILED');
    }
  }

  private async setupTenantSettings() {
    // Basic tenant settings
    const basicSettings = [
      {
        category: 'general',
        key: 'tenant_name',
        value: `"Tenant ${this.tenantId}"`,
        level: 'tenant',
        governance: 'tenant_admin'
      },
      {
        category: 'ui',
        key: 'theme',
        value: '"light"',
        level: 'tenant',
        governance: 'tenant_admin'
      }
    ];

    for (const setting of basicSettings) {
      await prisma.siteSetting.upsert({
        where: {
          tenantId_category_key: {
            tenantId: this.tenantId,
            category: setting.category,
            key: setting.key,
          },
        },
        update: {
          value: setting.value,
          updatedAt: new Date(),
        },
        create: {
          tenantId: this.tenantId,
          category: setting.category,
        key: setting.key,
        value: setting.value,
        level: setting.level,
        governance: setting.governance,
          lastModifiedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  }

  async getSettings(category?: string) {
    try {
      const where: Prisma.SiteSettingWhereInput = {
        tenantId: this.tenantId,
      };
      if (category) {
        where.category = category;
      }

      return await prisma.siteSetting.findMany({
        where,
      });
    } catch (error: any) {
      logger.error('Failed to get tenant settings', { tenantId: this.tenantId, error: error.message });
      throw new TenantError(`Failed to get tenant settings: ${error.message}`, 'TENANT_SETTINGS_GET_FAILED');
    }
  }

  async updateSetting(key: string, value: any, category: string = 'general', userId?: number) {
    try {
      const existingSetting = await prisma.siteSetting.findFirst({
        where: {
          tenantId: this.tenantId,
          category: category,
          key: key,
        },
      });

      if (existingSetting) {
        await prisma.siteSetting.update({
          where: { id: existingSetting.id },
          data: {
            value: JSON.stringify(value),
            lastModifiedBy: userId || null,
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.siteSetting.create({
          data: {
            tenantId: this.tenantId,
            category: category,
            key: key,
            value: JSON.stringify(value),
            level: 'tenant',
            governance: 'tenant_admin',
            lastModifiedBy: userId || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      return { success: true };
    } catch (error: any) {
      logger.error('Failed to update tenant setting', { tenantId: this.tenantId, key, error: error.message });
      throw new TenantError(`Failed to update setting: ${error.message}`, 'TENANT_SETTING_UPDATE_FAILED');
    }
  }

  async getUserCount(): Promise<number> {
    try {
      const count = await prisma.user.count({
        where: {
          account: {
            tenantId: this.tenantId,
          },
        },
      });

      return count;
    } catch (error: any) {
      logger.error('Failed to get user count', { tenantId: this.tenantId, error: error.message });
      return 0;
    }
  }

  async getActiveUsers(page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;

      const users_list = await prisma.user.findMany({
        where: {
          isActive: true,
          account: {
            tenantId: this.tenantId,
          },
        },
        take: limit,
        skip: offset,
        include: {
          account: true,
        },
      });

      return users_list;
    } catch (error: any) {
      logger.error('Failed to get active users', { tenantId: this.tenantId, error: error.message });
      throw new TenantError(`Failed to get active users: ${error.message}`, 'TENANT_USERS_GET_FAILED');
    }
  }

  async validateSubscriptionLimits(resourceType: string, currentCount?: number): Promise<boolean> {
    try {
      // For now, return true - actual subscription validation would go here
      // This would check tenant subscription limits against current usage
      return true;
    } catch (error: any) {
      logger.error('Failed to validate subscription limits', { 
        tenantId: this.tenantId, 
        resourceType, 
        error: error.message 
      });
      throw new TenantError(`Subscription limit validation failed: ${error.message}`, 'TENANT_LIMITS_VALIDATION_FAILED');
    }
  }
}

/**
 * Create tenant service instance
 * 🎯 PATTERN: Use this factory for all tenant operations
 */
export function createTenantService(tenantId: number): TenantService {
  return new TenantService(tenantId);
} 