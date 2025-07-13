import { db as prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';

/**
 * Seed Auth System
 * 
 * Creates essential roles, permissions, and the SuperAdmin user
 * for the Mono platform.
 */

async function seedAuth() {
  try {
    logger.info('🔐 Starting auth system seeding...');

    // 1. Create Roles
    logger.info('📝 Creating roles...');
    
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'super_admin' },
      update: {},
      create: {
        name: 'super_admin',
        description: 'Full system access with all permissions',
      },
    });

    const tenantAdminRole = await prisma.role.upsert({
      where: { name: 'tenant_admin' },
      update: {},
      create: {
        name: 'tenant_admin',
        description: 'Full access within tenant scope',
      },
    });

    const moderatorRole = await prisma.role.upsert({
      where: { name: 'content_moderator' },
      update: {},
      create: {
        name: 'content_moderator',
        description: 'Content moderation and user management',
      },
    });

    const userRole = await prisma.role.upsert({
      where: { name: 'user' },
      update: {},
      create: {
        name: 'user',
        description: 'Standard user with basic permissions',
      },
    });

    // 2. Create Permissions
    logger.info('🔑 Creating permissions...');
    
    const permissions = [
      // Admin permissions
      { name: 'admin.manage', description: 'Full admin dashboard access' },
      { name: 'admin.view', description: 'View admin dashboard' },
      
      // User management
      { name: 'users.create', description: 'Create new users' },
      { name: 'users.read', description: 'View user information' },
      { name: 'users.update', description: 'Update user information' },
      { name: 'users.delete', description: 'Delete users' },
      
      // Tenant management
      { name: 'tenants.create', description: 'Create new tenants' },
      { name: 'tenants.read', description: 'View tenant information' },
      { name: 'tenants.update', description: 'Update tenant settings' },
      { name: 'tenants.delete', description: 'Delete tenants' },
      
      // Content moderation
      { name: 'content.moderate', description: 'Moderate user content' },
      { name: 'content.approve', description: 'Approve pending content' },
      { name: 'content.reject', description: 'Reject inappropriate content' },
      
      // System settings
      { name: 'settings.manage', description: 'Manage system settings' },
      { name: 'settings.view', description: 'View system settings' },
    ];

    const createdPermissions = [];
    for (const perm of permissions) {
      const permission = await prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: {
          name: perm.name,
          description: perm.description,
        },
      });
      createdPermissions.push(permission);
    }

    // 3. Assign Permissions to Roles
    logger.info('🔗 Assigning permissions to roles...');
    
    // Super Admin gets all permissions
    for (const permission of createdPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      });
    }

    // Tenant Admin gets most permissions (excluding tenant creation/deletion)
    const tenantAdminPerms = createdPermissions.filter(p => 
      !p.name.includes('tenants.create') &&
      !p.name.includes('tenants.delete')
    );
    
    for (const permission of tenantAdminPerms) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: tenantAdminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: tenantAdminRole.id,
          permissionId: permission.id,
        },
      });
    }

    // Content Moderator gets content and user read permissions
    const moderatorPerms = createdPermissions.filter(p => 
      p.name.includes('content.') ||
      p.name.includes('users.read') ||
      p.name.includes('users.update') ||
      p.name.includes('admin.view')
    );
    
    for (const permission of moderatorPerms) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: moderatorRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: moderatorRole.id,
          permissionId: permission.id,
        },
      });
    }

    // 4. Create a default tenant first (required for account)
    logger.info('🏢 Creating default tenant...');
    
    const defaultTenant = await prisma.tenant.upsert({
      where: { domain: 'mono.platform' },
      update: {},
      create: {
        uuid: '00000000-0000-0000-0000-000000000001',
        name: 'itellico Mono',
        domain: 'mono.platform',
        slug: 'mono-platform',
        description: {},
        features: {},
        settings: {},
        categories: {},
        allowedCountries: {},
        defaultCurrency: 'USD',
        isActive: true,
      },
    });

    // 5. Create SuperAdmin Account and User
    logger.info('👑 Creating SuperAdmin user...');
    
    const hashedPassword = await bcrypt.hash('123', 10);
    
    // Create Account
    const superAdminAccount = await prisma.account.upsert({
      where: { email: '1@1.com' },
      update: {},
      create: {
        uuid: '10000000-0000-0000-0000-000000000001',
        email: '1@1.com',
        passwordHash: hashedPassword,
        tenantId: defaultTenant.id,
        emailVerified: true,
        accountType: 'personal',
        timezone: 'UTC',
        countryCode: 'US',
        languageLocale: 'en-US',
        currencyCode: 'USD',
        emailNotifications: true,
        smsNotifications: false,
        themePreference: 'system',
        isActive: true,
        isVerified: true,
      },
    });

    // Create User
    const superAdminUser = await prisma.user.upsert({
      where: { username: 'superadmin' },
      update: {},
      create: {
        uuid: '20000000-0000-0000-0000-000000000001',
        accountId: superAdminAccount.id,
        firstName: 'Super',
        lastName: 'Admin',
        username: 'superadmin',
        userType: 'individual',
        accountRole: 'entity_viewer',
        canCreateProfiles: true,
        canManageAllProfiles: true,
        canAccessBilling: true,
        canBookJobs: true,
        userHash: 'superadmin_hash',
        isActive: true,
        isVerified: true,
      },
    });

    // Assign SuperAdmin role to user
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: superAdminUser.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
      },
    });

    // 6. Create Moderator Account and User
    logger.info('👮 Creating Moderator user...');
    
    // Create Moderator Account
    const moderatorAccount = await prisma.account.upsert({
      where: { email: '2@2.com' },
      update: {},
      create: {
        uuid: '10000000-0000-0000-0000-000000000002',
        email: '2@2.com',
        passwordHash: hashedPassword, // Same password as SuperAdmin
        tenantId: defaultTenant.id,
        emailVerified: true,
        accountType: 'personal',
        timezone: 'UTC',
        countryCode: 'US',
        languageLocale: 'en-US',
        currencyCode: 'USD',
        emailNotifications: true,
        smsNotifications: false,
        themePreference: 'system',
        isActive: true,
        isVerified: true,
      },
    });

    // Create Moderator User
    const moderatorUser = await prisma.user.upsert({
      where: { username: 'moderator' },
      update: {},
      create: {
        uuid: '20000000-0000-0000-0000-000000000002',
        accountId: moderatorAccount.id,
        firstName: 'Content',
        lastName: 'Moderator',
        username: 'moderator',
        userType: 'individual',
        accountRole: 'entity_viewer',
        canCreateProfiles: false,
        canManageAllProfiles: false,
        canAccessBilling: false,
        canBookJobs: false,
        userHash: 'moderator_hash',
        isActive: true,
        isVerified: true,
      },
    });

    // Assign Moderator role to user
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: moderatorUser.id,
          roleId: moderatorRole.id,
        },
      },
      update: {},
      create: {
        userId: moderatorUser.id,
        roleId: moderatorRole.id,
      },
    });

    logger.info('✅ Auth system seeding completed successfully!');
    logger.info('👑 SuperAdmin user created:');
    logger.info('   Email: 1@1.com');
    logger.info('   Password: 123');
    logger.info(`   Role: ${superAdminRole.name}`);
    logger.info('👮 Moderator user created:');
    logger.info('   Email: 2@2.com');
    logger.info('   Password: 123');
    logger.info(`   Role: ${moderatorRole.name}`);
    logger.info(`   Permissions: ${createdPermissions.length} permissions assigned`);
    logger.info(`   Tenant: ${defaultTenant.name}`);

    return {
      roles: [superAdminRole, tenantAdminRole, moderatorRole, userRole],
      permissions: createdPermissions,
      superAdminUser,
      moderatorUser,
      superAdminAccount,
      moderatorAccount,
      defaultTenant,
    };

  } catch (error) {
    logger.error('❌ Auth seeding failed:', error);
    throw error;
  }
}

export { seedAuth };

// Run if called directly
if (require.main === module) {
  seedAuth()
    .then(() => {
      logger.info('🎉 Auth seeding script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Auth seeding script failed:', error);
      process.exit(1);
    });
} 