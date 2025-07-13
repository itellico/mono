import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../src/lib/logger';

const prisma = new PrismaClient();

/**
 * Complete RBAC System Seeder
 * Creates super admin user, ensures all permissions/roles are populated,
 * and sets up complete system for login
 */
async function seedCompleteRBACSystem() {
  logger.info('🌱 Starting complete RBAC system seeding...');

  try {
    // Step 1: Ensure tenant exists
    logger.info('Step 1: Setting up tenant...');
    
    let tenant = await prisma.tenant.findFirst({
      where: { domain: 'localhost' }
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'itellico Mono',
          domain: 'localhost',
          slug: 'mono-platform',
          description: { 
            en: 'Main itellico Mono tenant for development',
            title: 'itellico Mono Development'
          },
          isActive: true
        }
      });
      logger.info('✅ Created main tenant');
    } else {
      logger.info('✅ Main tenant exists');
    }

    // Step 2: Ensure account exists  
    logger.info('Step 2: Setting up admin account...');
    
    let account = await prisma.account.findFirst({
      where: { 
        email: '1@1.com',
        tenantId: tenant.id
      }
    });

    if (!account) {
      account = await prisma.account.create({
        data: {
          tenantId: tenant.id,
          email: '1@1.com',
          emailVerified: true,
          accountType: 'personal',
          isActive: true,
          isVerified: true
        }
      });
      logger.info('✅ Created admin account');
    } else {
      logger.info('✅ Admin account exists');
    }

    // Step 3: Create/update super admin user
    logger.info('Step 3: Setting up super admin user...');
    
    const passwordHash = await bcrypt.hash('123', 12);
    
    let user = await prisma.user.findFirst({
      where: { 
        username: 'superadmin',
        accountId: account.id
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          accountId: account.id,
          firstName: 'Super',
          lastName: 'Admin',
          username: 'superadmin',
          userType: 'admin',
          userHash: 'superadmin123',
          canCreateProfiles: true,
          canManageAllProfiles: true,
          canAccessBilling: true,
          canBookJobs: true,
          isActive: true,
          isVerified: true
        }
      });
      logger.info('✅ Created super admin user');
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: 'Super',
          lastName: 'Admin',
          isActive: true,
          isVerified: true,
          canCreateProfiles: true,
          canManageAllProfiles: true,
          canAccessBilling: true,
          canBookJobs: true
        }
      });
      logger.info('✅ Updated super admin user');
    }

    // Step 4: Ensure all permissions exist (re-run the permission seeder)
    logger.info('Step 4: Ensuring all permissions exist...');
    
    const permissionsToCreate = [
      // Platform Admin Permissions (15 total)
      { pattern: 'platform.*.global', description: 'Full platform control' },
      { pattern: 'tenants.*.global', description: 'Full tenant management' },
      { pattern: 'system.*.global', description: 'System operations' },
      { pattern: 'emergency.access.global', description: 'Emergency break-glass access' },
      { pattern: 'audit.*.global', description: 'Full audit access' },
      { pattern: 'config.*.global', description: 'All configuration management' },
      { pattern: 'integrations.*.global', description: 'All integrations' },
      { pattern: 'subscriptions.*.global', description: 'Subscription templates' },
      { pattern: 'security.*.global', description: 'Security policies' },
      { pattern: 'compliance.*.global', description: 'Compliance rules' },
      { pattern: 'users.*.global', description: 'Full user management across tenants' },
      { pattern: 'accounts.*.global', description: 'Full account management' },
      { pattern: 'impersonate.*.global', description: 'Impersonate any user/account' },
      { pattern: 'analytics.*.global', description: 'Platform-wide analytics' },
      { pattern: 'reports.*.global', description: 'All reporting capabilities' },

      // GUI/Sidebar specific permissions
      { pattern: 'sidebar.admin.global', description: 'Access admin sidebar' },
      { pattern: 'sidebar.analytics.global', description: 'Access analytics sidebar' },
      { pattern: 'sidebar.users.global', description: 'Access users sidebar' },
      { pattern: 'sidebar.tenants.global', description: 'Access tenants sidebar' },
      { pattern: 'sidebar.settings.global', description: 'Access settings sidebar' },
      
      // Page access permissions
      { pattern: 'pages.admin.global', description: 'Access admin pages' },
      { pattern: 'pages.dashboard.global', description: 'Access dashboard pages' },
      { pattern: 'pages.users.global', description: 'Access user management pages' },
      { pattern: 'pages.tenants.global', description: 'Access tenant management pages' },
      { pattern: 'pages.analytics.global', description: 'Access analytics pages' },
      { pattern: 'pages.settings.global', description: 'Access settings pages' },
      
      // API access permissions
      { pattern: 'api.admin.global', description: 'Access admin APIs' },
      { pattern: 'api.users.global', description: 'Access user management APIs' },
      { pattern: 'api.tenants.global', description: 'Access tenant management APIs' },
      { pattern: 'api.analytics.global', description: 'Access analytics APIs' },

      // Tenant Admin Permissions (25 total)
      { pattern: 'tenant.manage.tenant', description: 'Tenant settings, branding, domains' },
      { pattern: 'accounts.*.tenant', description: 'Full account management within tenant' },
      { pattern: 'users.*.tenant', description: 'Full user management within tenant' },
      { pattern: 'analytics.read.tenant', description: 'Tenant analytics access' },
      { pattern: 'billing.manage.tenant', description: 'Tenant billing management' },
      { pattern: 'content.*.tenant', description: 'All content types' },
      { pattern: 'moderation.*.tenant', description: 'All moderation capabilities' },
      { pattern: 'categories.manage.tenant', description: 'Categories and tags' },
      { pattern: 'schemas.manage.tenant', description: 'Model schemas and forms' },
      { pattern: 'templates.manage.tenant', description: 'Email and page templates' },
      { pattern: 'marketplace.*.tenant', description: 'Full marketplace control' },
      { pattern: 'bookings.*.tenant', description: 'All booking operations' },
      { pattern: 'payments.*.tenant', description: 'Payment and commission management' },
      { pattern: 'disputes.*.tenant', description: 'Dispute resolution' },
      { pattern: 'reviews.*.tenant', description: 'Review management' },
      { pattern: 'config.manage.tenant', description: 'Tenant configuration' },
      { pattern: 'workflows.*.tenant', description: 'Workflow management' },
      { pattern: 'integrations.*.tenant', description: 'Integration management' },
      { pattern: 'subscriptions.*.tenant', description: 'Subscription plans' },
      { pattern: 'compliance.*.tenant', description: 'Compliance settings' },
      { pattern: 'support.*.tenant', description: 'Support operations' },
      { pattern: 'impersonate.users.tenant', description: 'Impersonate tenant users' },
      { pattern: 'audit.read.tenant', description: 'Audit log access' },
      { pattern: 'reports.*.tenant', description: 'Reporting capabilities' },
      { pattern: 'export.*.tenant', description: 'Data export' },

      // Additional GUI permissions for tenant admin
      { pattern: 'sidebar.admin.tenant', description: 'Access tenant admin sidebar' },
      { pattern: 'pages.admin.tenant', description: 'Access tenant admin pages' },
      { pattern: 'api.admin.tenant', description: 'Access tenant admin APIs' }
    ];

    let createdPermissions = 0;
    for (const perm of permissionsToCreate) {
      const [resource, action, scope] = perm.pattern.split('.');
      
      const existing = await prisma.permission.findFirst({
        where: { pattern: perm.pattern }
      });

      if (!existing) {
        await prisma.permission.create({
          data: {
            name: perm.pattern,
            pattern: perm.pattern,
            resource,
            action,
            scope,
            description: perm.description,
            isWildcard: perm.pattern.includes('*'),
            priority: 100
          }
        });
        createdPermissions++;
      }
    }

    logger.info(`✅ Ensured ${permissionsToCreate.length} permissions exist (${createdPermissions} created)`);

    // Step 5: Ensure super admin role exists with all permissions
    logger.info('Step 5: Setting up super admin role...');
    
    let superAdminRole = await prisma.role.findFirst({
      where: { code: 'super_admin' }
    });

    if (!superAdminRole) {
      superAdminRole = await prisma.role.create({
        data: {
          name: 'Super Admin',
          code: 'super_admin',
          level: 5,
          description: 'Platform-wide administrator with full access',
          isSystem: true
        }
      });
      logger.info('✅ Created super admin role');
    }

    // Assign all global permissions to super admin
    const globalPermissions = await prisma.permission.findMany({
      where: { scope: 'global' }
    });

    for (const permission of globalPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: permission.id
          }
        },
        create: {
          roleId: superAdminRole.id,
          permissionId: permission.id
        },
        update: {}
      });
    }

    logger.info(`✅ Assigned ${globalPermissions.length} global permissions to super admin role`);

    // Step 6: Assign super admin role to user
    logger.info('Step 6: Assigning super admin role to user...');
    
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: superAdminRole.id
        }
      },
      create: {
        userId: user.id,
        roleId: superAdminRole.id,
        grantedBy: user.id, // Self-granted for initial setup
        grantReason: 'Initial super admin setup'
      },
      update: {
        validUntil: null, // Ensure it never expires
        grantReason: 'Updated during RBAC seeding'
      }
    });

    logger.info('✅ Assigned super admin role to user');

    // Step 7: Create other essential roles
    logger.info('Step 7: Creating other essential roles...');
    
    const rolesToCreate = [
      {
        name: 'Tenant Admin',
        code: 'tenant_admin',
        level: 4,
        description: 'Marketplace owner with full tenant access',
        permissions: ['tenant.*', 'content.*', 'marketplace.*'] // Will expand to actual permissions
      },
      {
        name: 'Content Moderator',
        code: 'content_moderator',
        level: 3,
        description: 'Content review and moderation specialist',
        permissions: ['moderation.*.tenant', 'content.read.tenant']
      }
    ];

    for (const roleData of rolesToCreate) {
      await prisma.role.upsert({
        where: { code: roleData.code },
        create: {
          name: roleData.name,
          code: roleData.code,
          level: roleData.level,
          description: roleData.description,
          isSystem: true
        },
        update: {
          name: roleData.name,
          description: roleData.description,
          level: roleData.level
        }
      });
    }

    logger.info('✅ Created essential roles');

    // Step 8: Verify setup
    logger.info('Step 8: Verifying setup...');
    
    const verification = await Promise.all([
      prisma.permission.count(),
      prisma.role.count(),
      prisma.userRole.count({ where: { userId: user.id } }),
      prisma.rolePermission.count({ where: { roleId: superAdminRole.id } })
    ]);

    const [permCount, roleCount, userRoleCount, rolePermCount] = verification;

    logger.info('✅ Setup verification:', {
      totalPermissions: permCount,
      totalRoles: roleCount,
      userRoleAssignments: userRoleCount,
      superAdminPermissions: rolePermCount,
      userId: user.id,
      userEmail: account.email,
      tenantDomain: tenant.domain
    });

    // Step 9: Test permission resolution
    logger.info('Step 9: Testing permission resolution...');
    
    const testPermissions = [
      'platform.manage.global',
      'sidebar.admin.global',
      'pages.admin.global',
      'api.admin.global',
      'users.read.global'
    ];

    for (const testPerm of testPermissions) {
      const hasPermission = await checkUserPermission(user.id, testPerm);
      logger.info(`Permission test: ${testPerm} = ${hasPermission}`);
    }

    logger.info('🎉 Complete RBAC system seeding completed successfully!');

    return {
      success: true,
      user: {
        id: user.id,
        email: account.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      },
      tenant: {
        id: tenant.id,
        domain: tenant.domain,
        name: tenant.name
      },
      stats: {
        permissions: permCount,
        roles: roleCount,
        userRoles: userRoleCount,
        superAdminPermissions: rolePermCount
      }
    };

  } catch (error) {
    logger.error('RBAC seeding failed', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Helper function to check if user has a specific permission
 */
async function checkUserPermission(userId: number, permissionPattern: string): Promise<boolean> {
  try {
    // Get user's roles
    const userRoles = await prisma.userRole.findMany({
      where: { 
        userId,
        OR: [
          { validUntil: null },
          { validUntil: { gt: new Date() } }
        ]
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    // Check if any role has the permission
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        const permission = rolePermission.permission;
        
        // Direct match
        if (permission.pattern === permissionPattern) {
          return true;
        }
        
        // Wildcard match
        if (permission.isWildcard && matchesWildcard(permission.pattern, permissionPattern)) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    logger.error('Permission check failed', { error, userId, permissionPattern });
    return false;
  }
}

/**
 * Helper function to check wildcard pattern matching
 */
function matchesWildcard(pattern: string, permission: string): boolean {
  const patternParts = pattern.split('.');
  const permParts = permission.split('.');
  
  if (patternParts.length !== permParts.length) return false;
  
  return patternParts.every((part, i) => 
    part === '*' || part === permParts[i]
  );
}

// Run the seeder
if (require.main === module) {
  seedCompleteRBACSystem()
    .then((result) => {
      console.log('\\n🎉 Complete RBAC System Seeding Successful!');
      console.log('\\n👤 Super Admin User Created:');
      console.log(`Email: ${result.user.email}`);
      console.log(`Username: ${result.user.username}`);
      console.log(`Password: 123`);
      console.log(`Name: ${result.user.firstName} ${result.user.lastName}`);
      
      console.log('\\n🏢 Tenant Information:');
      console.log(`Domain: ${result.tenant.domain}`);
      console.log(`Name: ${result.tenant.name}`);
      
      console.log('\\n📊 System Statistics:');
      console.log(`Total Permissions: ${result.stats.permissions}`);
      console.log(`Total Roles: ${result.stats.roles}`);
      console.log(`User Role Assignments: ${result.stats.userRoles}`);
      console.log(`Super Admin Permissions: ${result.stats.superAdminPermissions}`);
      
      console.log('\\n🚀 Ready to Login:');
      console.log('1. Frontend: http://localhost:3000');
      console.log('2. API: http://localhost:3001');
      console.log('3. Admin Panel: http://localhost:3000/admin');
      console.log('4. API Docs: http://localhost:3001/docs');
      
      console.log('\\nCredentials:');
      console.log('Email: 1@1.com');
      console.log('Password: 123');
      
      process.exit(0);
    })
    .catch((error) => {
      console.log('\\n❌ RBAC System Seeding Failed!');
      console.log('Error:', error.message);
      process.exit(1);
    });
}

export default seedCompleteRBACSystem;