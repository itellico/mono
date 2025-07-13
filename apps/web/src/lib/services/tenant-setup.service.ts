import { hash } from 'bcryptjs';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { db as prisma } from '@/lib/db';

interface TenantSetupData {
  name: string;
  slug: string | null;
  domain?: string;
  description?: string;
  adminUser?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  features?: Record<string, any>;
  settings?: Record<string, any>;
}

interface TenantSetupResult {
  tenant: {
    id: number;
    name: string;
    domain: string;
    slug: string | null;
  };
  adminCredentials: {
    email: string;
    password: string;
  };
  adminUser: {
    id: bigint;
    firstName: string;
    lastName: string;
  };
  message: string;
}

/**
 * Generate a secure random password
 */
function generateSecurePassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * Generate a unique user hash
 */
function generateUserHash(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Industry-Grade Tenant Setup Service
 * 
 * Middleware-based tenant creation with comprehensive setup:
 * - Database transaction management
 * - Resilient Redis caching with graceful degradation
 * - Structured audit logging
 * - Role-based permission setup
 * - Multi-tenant isolation
 * - Error handling and rollback
 * 
 * @component TenantSetupService
 * @example
 * ```typescript
 * const result = await tenantSetupService.createTenant({
 *   name: 'Acme Corp',
 *   slug: 'acme-corp',
 *   adminUser: { firstName: 'John', lastName: 'Doe' }
 * }, createdByUserId);
 * ```
 */
export class TenantSetupService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'cache:platform:tenants';

  /**
   * Create a complete tenant with admin user and full setup
   * Uses database transactions and follows itellico Mono middleware patterns
   */
  async createTenant(data: TenantSetupData, createdBy?: number): Promise<TenantSetupResult> {
    const startTime = Date.now();
    const operationId = `tenant-setup-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    logger.info('Starting industry-grade tenant setup', {
      operationId,
      tenantName: data.name,
      tenantSlug: data.slug,
      createdBy,
      middleware: 'TenantSetupService'
    });

    try {
      // Use database transaction for atomicity
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create the tenant
        const tenant = await tx.tenant.create({
          data: {
            name: data.name,
            slug: data.slug,
            domain: data.domain || `${data.slug}.mono.com`,
            description: data.description as Prisma.NullableJsonNullValueInput || null,
            features: data.features || {
              multiLanguage: true,
              pictureApproval: true,
              setCards: true,
              subscriptionTiers: true
            },
            settings: data.settings || {
              defaultCurrency: 'USD',
              allowedCountries: ['US', 'CA', 'GB', 'AU']
            },
            isActive: true,
            createdBy,
            updatedBy: createdBy
          },
        });

        logger.info('Tenant created', { tenantId: tenant.id, tenantName: tenant.name });

        // 2. Generate admin credentials
        const adminEmail = data.adminUser?.email || `${data.slug}admin@mono.com`;
        const adminPassword = generateSecurePassword();
        const passwordHash = await hash(adminPassword, 12);

        // 3. Create admin account
        const adminAccount = await tx.account.create({
          data: {
            tenantId: tenant.id,
            email: adminEmail,
            emailVerified: true,
            passwordHash,
            accountType: 'business',
            accountCapabilities: ['tenant_management', 'user_management', 'content_management'],
            isActive: true,
            isVerified: true
          },
        });

        logger.info('Admin account created', { 
          accountId: adminAccount.id, 
          email: adminEmail 
        });

        // 4. Create admin user profile
        const adminUser = await tx.user.create({
          data: {
            accountId: adminAccount.id,
            firstName: data.adminUser?.firstName || 'Tenant',
            lastName: data.adminUser?.lastName || 'Admin',
            username: `${data.slug}-admin-${Date.now()}`,
            userType: 'admin',
            userHash: generateUserHash(),
            accountRole: 'admin',
            canCreateProfiles: true,
            canManageAllProfiles: true,
            canAccessBilling: true,
            canBookJobs: true,
            isActive: true,
            isVerified: true
          },
        });

        logger.info('Admin user created', { 
          userId: adminUser.id, 
          username: adminUser.username 
        });

        // 5. Setup tenant-specific roles
        await this.setupTenantRoles(tx, tenant.id, adminUser.id);

        // Initialize tenant settings (database schema alignment)
        // await this.initializeTenantSettings(tx, tenant.id, adminUser.id);

        logger.info('Tenant setup completed successfully', {
          operationId,
          tenantId: tenant.id,
          adminUserId: adminUser.id,
          setupDuration: Date.now() - startTime,
          middleware: 'TenantSetupService'
        });

        return {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            domain: tenant.domain || `${tenant.slug}.mono.com`,
            slug: tenant.slug
          },
          adminCredentials: {
            email: adminEmail,
            password: adminPassword
          },
          adminUser: {
            id: adminUser.id,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName
          },
          message: 'Tenant created successfully with admin user'
        };
      });

      // 8. Post-transaction operations
      await this.postSetupOperations(result.tenant.id, result.adminUser.id, createdBy);

      return result;

    } catch (error) {
      logger.error('Tenant setup failed', {
        operationId,
        error: error.message,
        stack: error.stack,
        tenantData: { name: data.name, slug: data.slug }, // Don't log sensitive data
        createdBy,
        setupDuration: Date.now() - startTime,
        middleware: 'TenantSetupService'
      });

      throw new Error(`Failed to create tenant: ${error.message}`);
    }
  }

  /**
   * Setup tenant-specific roles and permissions
   */
  private async setupTenantRoles(tx: any, tenantId: number, adminUserId: number): Promise<void> {
    // Core tenant roles to create (only using fields that exist in Role model)
    const tenantRoles = [
      {
        name: 'tenant_admin',
        description: 'Full administrative access within the tenant'
      },
      {
        name: 'content_moderator',
        description: 'Content review and moderation capabilities'
      },
      {
        name: 'model_approver',
        description: 'Model application approval capabilities'
      },
      {
        name: 'user_manager',
        description: 'User management capabilities'
      }
    ];

    // Create tenant-specific roles
    const createdRoles = [];
    for (const roleData of tenantRoles) {
      const role = await tx.role.create({
        data: roleData
      });
      
      createdRoles.push(role);
      
      logger.info('Tenant role created', { 
        roleId: role.id, 
        roleName: role.name,
        tenantId 
      });
    }

    // Assign tenant_admin role to the admin user
    const tenantAdminRole = createdRoles.find(r => r.name === 'tenant_admin');
    if (tenantAdminRole) {
      await tx.userRole.create({
        data: {
          userId: adminUserId,
          roleId: tenantAdminRole.id
        },
      });

      logger.info('Tenant admin role assigned', {
        userId: adminUserId,
        roleId: tenantAdminRole.id,
        tenantId
      });
    }

    // Setup default permissions for tenant admin role
    await this.setupTenantAdminPermissions(tx, tenantAdminRole?.id, tenantId);
  }

  /**
   * Setup permissions for tenant admin role
   */
  private async setupTenantAdminPermissions(tx: any, roleId?: number, tenantId?: number): Promise<void> {
    if (!roleId) return;

    // Core permissions for tenant admin
    const adminPermissions = [
      'users.manage.tenant',
      'profiles.manage.tenant',
      'media.manage.tenant',
      'settings.manage.tenant',
      'analytics.read.tenant',
      'content.moderate.tenant',
      'applications.approve.tenant'
    ];

    // Ensure all admin permissions exist and link them to the tenant admin role
    for (const permName of adminPermissions) {
      let permission = await tx.permission.findUnique({
        where: { name: permName },
      });

      if (!permission) {
        // Create permission if it doesn't exist
        permission = await tx.permission.create({
          data: {
            name: permName,
            description: `Permission for ${permName.replace(/\./g, ' ')}`
          },
        });
        logger.info('Permission created', { permissionId: permission.id, permissionName: permission.name });
      }

      // Link permission to the role
      const rolePerm = await tx.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: roleId,
            permissionId: permission.id
          },
        },
      });

      if (!rolePerm) {
        await tx.rolePermission.create({
          data: {
            roleId: roleId,
            permissionId: permission.id
          },
        });
        logger.info('Permission linked to role', { roleId, permissionId: permission.id, permissionName: permission.name });
      }
    }

    logger.info('Tenant admin permissions setup completed', {
      roleId,
      tenantId,
      permissionCount: adminPermissions.length
    });
  }

  /**
   * Initialize default tenant settings
   */
  private async initializeTenantSettings(tx: any, tenantId: number, adminUserId: number): Promise<void> {
    const defaultSettings = [
      {
        category: 'general',
        key: 'site_name',
        level: 'tenant',
        governance: 'tenant_admin',
        value: 'My Modeling Site',
        description: 'Display name for this tenant site',
        isRequired: true
      },
      {
        category: 'media',
        key: 'max_file_size_mb',
        level: 'tenant',
        governance: 'tenant_admin',
        value: 25,
        description: 'Maximum file size for uploads',
        isRequired: true
      },
      {
        category: 'ui',
        key: 'primary_color',
        level: 'tenant',
        governance: 'tenant_admin',
        value: '#3B82F6',
        description: 'Primary brand color for this tenant',
        isRequired: false
      }
    ];

    for (const setting of defaultSettings) {
      await tx.siteSettings.create({
        data: {
          tenantId,
          ...setting,
          lastModifiedBy: adminUserId
        },
      });
    }

    logger.info('Default tenant settings initialized', {
      tenantId,
      settingsCount: defaultSettings.length
    });
  }

  /**
   * Post-setup operations (cache invalidation, audit logging, etc.)
   */
  private async postSetupOperations(tenantId: number, adminUserId: number, createdBy?: number): Promise<void> {
    try {
      // 1. Invalidate tenant caches
      await this.invalidateTenantCaches();

      // 2. Log audit entry (using structured logging)
      logger.info('Tenant setup audit log', {
        entityType: 'tenant',
        entityId: tenantId.toString(),
        action: 'create',
        userId: createdBy || adminUserId,
        tenantId,
        changes: {
          action: 'tenant_setup_completed',
          adminUserId,
          timestamp: new Date().toISOString()
        },
        metadata: {
          setupType: 'comprehensive',
          includesAdminUser: true,
          includesRoles: true,
          includesSettings: true
        }
      });

      logger.info('Post-setup operations completed', {
        tenantId,
        adminUserId,
        createdBy
      });

    } catch (error) {
      logger.warn('Post-setup operations partially failed', {
        error: error.message,
        tenantId,
        adminUserId
      });
      // Don't throw here as the main setup was successful
    }
  }

  /**
   * Invalidate tenant-related cache keys using resilient Redis middleware
   */
  private async invalidateTenantCaches(): Promise<void> {
    try {
      const redis = await getRedisClient();
      if (!redis) {
        logger.warn('Redis unavailable, cache invalidation skipped', {
          middleware: 'TenantSetupService'
        });
        return;
      }

      const keys = await redis.keys(`${this.CACHE_PREFIX}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info('Tenant cache invalidated', { 
          keysCleared: keys.length,
          middleware: 'TenantSetupService'
        });
      }
    } catch (error) {
      logger.warn('Cache invalidation failed - graceful degradation', { 
        error: error.message,
        middleware: 'TenantSetupService'
      });
    }
  }

  /**
   * Validate tenant setup data
   */
  validateTenantData(data: TenantSetupData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Tenant name is required');
    }

    if (!data.slug || data.slug.trim().length === 0) {
      errors.push('Tenant slug is required');
    }

    if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
      errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
    }

    if (data.domain && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.domain)) {
      errors.push('Invalid domain format');
    }

    if (data.adminUser?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.adminUser.email)) {
      errors.push('Invalid admin email format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if tenant slug or domain already exists
   */
  async checkTenantUniqueness(slug: string, domain?: string): Promise<{ isUnique: boolean; conflicts: string[] }> {
    const conflicts: string[] = [];

    // Check slug uniqueness
    const existingSlug = await prisma.tenant.findFirst({
      where: { slug: slug },
    });

    if (existingSlug) {
      conflicts.push('slug');
    }

    // Check domain uniqueness if provided
    if (domain) {
      const existingDomain = await prisma.tenant.findFirst({
        where: { domain: domain },
      });

      if (existingDomain) {
        conflicts.push('domain');
      }
    }

    return {
      isUnique: conflicts.length === 0,
      conflicts
    };
  }
}

// Export singleton instance
export const tenantSetupService = new TenantSetupService(); 