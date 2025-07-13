#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPermissions() {
  try {
    console.log('🔍 Checking permissions system...\n');

    // 1. Check all roles
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        userRoles: {
          include: {
            user: {
              include: {
                account: true
              }
            }
          }
        }
      }
    });

    console.log('📋 ROLES IN SYSTEM:');
    console.log('==================');
    for (const role of roles) {
      console.log(`\nRole: ${role.name} (${role.code})`);
      console.log(`Tenant ID: ${role.tenant_id}`);
      console.log(`Users with this role: ${role.userRoles.length}`);
      
      if (role.rolePermissions.length > 0) {
        console.log('Permissions:');
        role.rolePermissions.forEach(rp => {
          console.log(`  - ${rp.permission.name} (${rp.permission.code})`);
        });
      } else {
        console.log('Permissions: None assigned');
      }

      if (role.userRoles.length > 0) {
        console.log('Users:');
        role.userRoles.forEach(ur => {
          console.log(`  - ${ur.user.account?.email} (User ID: ${ur.user.id})`);
        });
      }
    }

    // 2. Check all permissions
    console.log('\n\n📋 ALL PERMISSIONS:');
    console.log('===================');
    const permissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' }
    });

    permissions.forEach(p => {
      console.log(`- ${p.name} (${p.code}) - ${p.description || 'No description'}`);
    });

    // 3. Check super admin specifically
    console.log('\n\n👤 SUPER ADMIN CHECK:');
    console.log('=====================');
    const superAdminAccount = await prisma.account.findUnique({
      where: { email: '1@1.com' },
      include: {
        users: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (superAdminAccount && superAdminAccount.users[0]) {
      const user = superAdminAccount.users[0];
      console.log('Email:', superAdminAccount.email);
      console.log('User ID:', user.id);
      console.log('Username:', user.username);
      console.log('Active:', user.is_active);
      
      console.log('\nRoles:');
      user.userRoles.forEach(ur => {
        console.log(`- ${ur.role.name} (${ur.role.code})`);
        if (ur.role.rolePermissions.length > 0) {
          console.log('  Permissions:');
          ur.role.rolePermissions.forEach(rp => {
            console.log(`    - ${rp.permission.name} (${rp.permission.code})`);
          });
        }
      });
    }

    // 4. Create admin permissions if missing
    console.log('\n\n🔧 FIXING PERMISSIONS:');
    console.log('======================');
    
    // Check if admin role has permissions
    const adminRole = await prisma.role.findFirst({
      where: { name: 'admin' }
    });

    if (adminRole) {
      // Check if admin permission exists
      let adminPermission = await prisma.permission.findFirst({
        where: { code: 'admin.access' }
      });

      if (!adminPermission) {
        console.log('Creating admin.access permission...');
        adminPermission = await prisma.permission.create({
          data: {
            name: 'Admin Access',
            code: 'admin.access',
            description: 'Access to admin panel'
          }
        });
      }

      // Check if role has this permission
      const hasPermission = await prisma.rolePermission.findFirst({
        where: {
          role_id: adminRole.id,
          permission_id: adminPermission.id
        }
      });

      if (!hasPermission) {
        console.log('Assigning admin.access permission to admin role...');
        await prisma.rolePermission.create({
          data: {
            role_id: adminRole.id,
            permission_id: adminPermission.id
          }
        });
        console.log('✅ Permission assigned!');
      } else {
        console.log('✅ Admin role already has admin.access permission');
      }

      // Also add all platform permissions
      const platformPermissions = await prisma.permission.findMany({
        where: {
          OR: [
            { code: { startsWith: 'platform.' } },
            { code: { startsWith: 'admin.' } },
            { code: 'admin.access' }
          ]
        }
      });

      console.log(`\nFound ${platformPermissions.length} platform/admin permissions`);
      
      for (const perm of platformPermissions) {
        const exists = await prisma.rolePermission.findFirst({
          where: {
            role_id: adminRole.id,
            permission_id: perm.id
          }
        });

        if (!exists) {
          console.log(`Assigning ${perm.code} to admin role...`);
          await prisma.rolePermission.create({
            data: {
              role_id: adminRole.id,
              permission_id: perm.id
            }
          });
        }
      }
    }

    console.log('\n✅ Permission check complete!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissions();