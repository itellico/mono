#!/usr/bin/env node

/**
 * 🌟 COMPREHENSIVE DATABASE SEEDER
 * 
 * This script sets up EVERYTHING needed for the Mono platform:
 * - Creates tenant with proper data
 * - Creates ALL roles and permissions
 * - Creates test users with proper assignments
 * - Sets up ALL necessary data structures
 * 
 * Can be run multiple times safely - will skip existing data.
 * 
 * Usage: npx tsx scripts/comprehensive-seeder.ts
 */

import { db } from '../src/lib/db';
import { logger } from '../src/lib/logger';
import bcrypt from 'bcryptjs';

// ===== PERMISSION DEFINITIONS =====
const ALL_PERMISSIONS = [
  // Admin Permissions
  { name: 'admin.full_access', description: 'Full administrative access' },
  { name: 'admin.manage', description: 'General admin management' },
  { name: 'tenant.manage', description: 'Tenant management' },
  { name: 'users.manage', description: 'User management' },
  { name: 'users.impersonate', description: 'User impersonation' },
  { name: 'content.manage', description: 'Content management' },
  { name: 'models.approve', description: 'Model approval' },
  { name: 'pictures.review', description: 'Picture review' },
  { name: 'analytics.access', description: 'Analytics access' },
  
  // Tenant Permissions
  { name: 'tenants.create', description: 'Create tenants' },
  { name: 'tenants.read', description: 'Read tenants' },
  { name: 'tenants.update', description: 'Update tenants' },
  { name: 'tenants.delete', description: 'Delete tenants' },
  { name: 'tenants.manage', description: 'Manage tenants' },
  
  // User Permissions
  { name: 'users.create', description: 'Create users' },
  { name: 'users.read', description: 'Read users' },
  { name: 'users.update', description: 'Update users' },
  { name: 'users.delete', description: 'Delete users' },
  
  // Saved Search Permissions
  { name: 'saved_searches.create.own', description: 'Create own saved searches' },
  { name: 'saved_searches.read.own', description: 'Read own saved searches' },
  { name: 'saved_searches.update.own', description: 'Update own saved searches' },
  { name: 'saved_searches.delete.own', description: 'Delete own saved searches' },
  { name: 'saved_searches.read.global', description: 'Read all saved searches across tenants' },
  { name: 'saved_searches.manage.global', description: 'Manage all saved searches globally' },
  { name: 'saved_searches.bulk_delete.global', description: 'Bulk delete saved searches globally' },
  
  // Profile Permissions
  { name: 'profiles.create', description: 'Create profiles' },
  { name: 'profiles.read', description: 'Read profiles' },
  { name: 'profiles.update', description: 'Update profiles' },
  { name: 'profiles.delete', description: 'Delete profiles' },
  
  // Media Permissions
  { name: 'media.upload', description: 'Upload media' },
  { name: 'media.manage', description: 'Manage media' },
  
  // System Permissions
  { name: 'system.configure', description: 'System configuration' },
  { name: 'system.monitor', description: 'System monitoring' }
];

// ===== ROLE DEFINITIONS =====
const ALL_ROLES = [
  {
    name: 'super_admin',
    code: 'super_admin',
    description: 'Super Administrator - Full platform access',
    permissions: ALL_PERMISSIONS.map(p => p.name) // ALL PERMISSIONS
  },
  {
    name: 'tenant_admin',
    code: 'tenant_admin',
    description: 'Tenant Administrator - Tenant-specific admin access',
    permissions: [
      'admin.manage',
      'tenant.manage',
      'users.manage',
      'content.manage',
      'models.approve',
      'pictures.review',
      'analytics.access',
      'tenants.read',
      'tenants.update',
      'users.create',
      'users.read',
      'users.update',
      'users.delete',
      'saved_searches.create.own',
      'saved_searches.read.own',
      'saved_searches.update.own',
      'saved_searches.delete.own',
      'saved_searches.read.global',
      'saved_searches.manage.global',
      'profiles.create',
      'profiles.read',
      'profiles.update',
      'profiles.delete',
      'media.upload',
      'media.manage'
    ]
  },
  {
    name: 'content_moderator',
    code: 'CONTENT_MODERATOR',
    description: 'Content Moderator - Content review and moderation',
    permissions: [
      'content.manage',
      'models.approve',
      'pictures.review',
      'users.read',
      'saved_searches.create.own',
      'saved_searches.read.own',
      'saved_searches.update.own',
      'saved_searches.delete.own',
      'profiles.read',
      'profiles.update',
      'media.manage'
    ]
  },
  {
    name: 'approver',
    code: 'APPROVER',
    description: 'Application Approver - Model and application approval',
    permissions: [
      'models.approve',
      'saved_searches.create.own',
      'saved_searches.read.own',
      'saved_searches.update.own',
      'saved_searches.delete.own'
    ]
  },
  {
    name: 'support_agent',
    code: 'SUPPORT_AGENT',
    description: 'Support Agent - Customer support access',
    permissions: [
      'users.read',
      'users.impersonate',
      'saved_searches.create.own',
      'saved_searches.read.own',
      'saved_searches.update.own',
      'saved_searches.delete.own'
    ]
  },
  {
    name: 'analytics_viewer',
    code: 'ANALYTICS_VIEWER',
    description: 'Analytics Viewer - Read-only analytics access',
    permissions: [
      'analytics.access',
      'saved_searches.create.own',
      'saved_searches.read.own',
      'saved_searches.update.own',
      'saved_searches.delete.own'
    ]
  }
];

// ===== TEST USERS =====
const TEST_USERS = [
  {
    email: '1@1.com',
    password: '12345678',
    firstName: 'Super',
    lastName: 'Admin',
    roleName: 'super_admin'
  },
  {
    email: '2@2.com', 
    password: '123',
    firstName: 'Content',
    lastName: 'Moderator',
    roleName: 'content_moderator'
  },
  {
    email: '3@3.com',
    password: '123',
    firstName: 'Tenant',
    lastName: 'Admin',
    roleName: 'tenant_admin'
  }
];

async function comprehensiveSeeder() {
  try {
    logger.info('🌟 STARTING COMPREHENSIVE DATABASE SEEDER');
    logger.info('This will set up ALL required data for the Mono platform...\n');

    // ===== STEP 1: CREATE PERMISSIONS =====
    logger.info('📋 STEP 1: Creating ALL permissions...');
    let permissionsCreated = 0;
    let permissionsSkipped = 0;

    for (const permissionData of ALL_PERMISSIONS) {
      const existing = await db.permission.findUnique({
        where: { name: permissionData.name }
      });

      if (!existing) {
        await db.permission.create({
          data: {
            name: permissionData.name,
            description: permissionData.description
          }
        });
        logger.info(`   ✅ Created: ${permissionData.name}`);
        permissionsCreated++;
      } else {
        permissionsSkipped++;
      }
    }

    logger.info(`📋 Permissions: ${permissionsCreated} created, ${permissionsSkipped} existed\n`);

    // ===== STEP 2: CREATE ROLES =====
    logger.info('👥 STEP 2: Creating ALL roles...');
    let rolesCreated = 0;
    let rolesSkipped = 0;

    for (const roleData of ALL_ROLES) {
      let role = await db.role.findFirst({
        where: { name: roleData.name }
      });

      if (!role) {
        role = await db.role.create({
          data: {
            name: roleData.name,
            code: roleData.code,
            description: roleData.description
          }
        });
        logger.info(`   ✅ Created role: ${roleData.name}`);
        rolesCreated++;
      } else {
        rolesSkipped++;
      }

      // Assign permissions to role
      const currentPermissions = await db.rolePermission.findMany({
        where: { roleId: role.id },
        include: { permission: true }
      });
      
      const currentPermissionNames = new Set(
        currentPermissions.map(rp => rp.permission.name)
      );

      let permissionsAssigned = 0;
      for (const permissionName of roleData.permissions) {
        if (!currentPermissionNames.has(permissionName)) {
          const permission = await db.permission.findUnique({
            where: { name: permissionName }
          });

          if (permission) {
            await db.rolePermission.create({
              data: {
                roleId: role.id,
                permissionId: permission.id
              }
            });
            permissionsAssigned++;
          }
        }
      }

      if (permissionsAssigned > 0) {
        logger.info(`   📝 Assigned ${permissionsAssigned} permissions to ${roleData.name}`);
      }
    }

    logger.info(`👥 Roles: ${rolesCreated} created, ${rolesSkipped} existed\n`);

    // ===== STEP 3: CREATE TENANT =====
    logger.info('🏢 STEP 3: Creating test tenant...');
    let tenant = await db.tenant.findFirst({
      where: { name: 'Test Tenant' }
    });

    if (!tenant) {
      tenant = await db.tenant.create({
        data: {
          uuid: 'test-tenant-uuid',
          name: 'Test Tenant',
          slug: 'test',
          domain: 'test.localhost',
          settings: {},
          isActive: true
        }
      });
      logger.info('   ✅ Created test tenant');
    } else {
      logger.info('   ✅ Test tenant already exists');
    }

    // ===== STEP 4: CREATE TEST USERS =====
    logger.info('\n👤 STEP 4: Creating test users...');
    let usersCreated = 0;
    let usersSkipped = 0;

    for (const userData of TEST_USERS) {
      // Check if account exists
      let account = await db.account.findUnique({
        where: { email: userData.email }
      });

      if (!account) {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        account = await db.account.create({
          data: {
            tenantId: tenant.id,
            email: userData.email,
            passwordHash: hashedPassword,
            isVerified: true
          }
        });
        logger.info(`   ✅ Created account: ${userData.email}`);
      } else {
        logger.info(`   ✅ Account exists: ${userData.email}`);
      }

      // Check if user exists
      let user = await db.user.findFirst({
        where: { accountId: account.id }
      });

      if (!user) {
        user = await db.user.create({
          data: {
            accountId: account.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            username: userData.email.split('@')[0] + Date.now(),
            userHash: userData.email.split('@')[0] + Date.now(),
            isActive: true
          }
        });
        logger.info(`   ✅ Created user: ${userData.firstName} ${userData.lastName}`);
        usersCreated++;
      } else {
        logger.info(`   ✅ User exists: ${userData.firstName} ${userData.lastName}`);
        usersSkipped++;
      }

      // Assign role to user
      const role = await db.role.findFirst({
        where: { name: userData.roleName }
      });

      if (role) {
        const existingUserRole = await db.userRole.findFirst({
          where: {
            userId: user.id,
            roleId: role.id
          }
        });

        if (!existingUserRole) {
          await db.userRole.create({
            data: {
              userId: user.id,
              roleId: role.id
            }
          });
          logger.info(`   📝 Assigned ${userData.roleName} role to ${userData.email}`);
        }
      }
    }

    logger.info(`👤 Users: ${usersCreated} created, ${usersSkipped} existed\n`);

    // ===== STEP 5: VERIFICATION =====
    logger.info('🔍 STEP 5: Verifying setup...');
    
    const users = await db.user.findMany({
      include: {
        account: {
          select: { email: true }
        },
        userRoles: {
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
        }
      }
    });

    users.forEach(user => {
      const allPermissions = new Set<string>();
      user.userRoles.forEach(ur => {
        ur.role.permissions.forEach(rp => {
          allPermissions.add(rp.permission.name);
        });
      });

      const savedSearchPerms = Array.from(allPermissions).filter(p => p.includes('saved_search'));
      const roles = user.userRoles.map(ur => ur.role.name).join(', ');
      
      logger.info(`👤 ${user.account?.email} (ID: ${user.id})`);
      logger.info(`   - Roles: ${roles}`);
      logger.info(`   - Total permissions: ${allPermissions.size}`);
      logger.info(`   - Saved search permissions: ${savedSearchPerms.length}`);
      
      if (user.account?.email === '1@1.com') {
        logger.info(`   - Super Admin has ALL permissions: ${allPermissions.size === ALL_PERMISSIONS.length ? '✅' : '❌'}`);
      }
    });

    // Final counts
    const totalPermissions = await db.permission.count();
    const totalRoles = await db.role.count();
    const totalUsers = await db.user.count();
    const totalTenants = await db.tenant.count();

    logger.info('\n📊 FINAL SUMMARY:');
    logger.info(`   📋 Permissions: ${totalPermissions}`);
    logger.info(`   👥 Roles: ${totalRoles}`);
    logger.info(`   👤 Users: ${totalUsers}`);
    logger.info(`   🏢 Tenants: ${totalTenants}`);

    logger.info('\n🎉 COMPREHENSIVE SEEDER COMPLETED SUCCESSFULLY!');
    logger.info('You can now login with:');
    logger.info('   Super Admin: 1@1.com / 12345678');
    logger.info('   Content Moderator: 2@2.com / 123');
    logger.info('   Tenant Admin: 3@3.com / 123');

  } catch (error) {
    logger.error('❌ COMPREHENSIVE SEEDER FAILED:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the seeder
comprehensiveSeeder().catch((error) => {
  console.error('❌ Seeder failed:', error);
  process.exit(1);
}); 