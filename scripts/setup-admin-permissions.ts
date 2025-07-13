#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupAdminPermissions() {
  try {
    console.log('🔧 Setting up admin permissions for NestJS...\n');

    // 1. Find or create admin.access permission
    let adminAccessPermission = await prisma.permission.findFirst({
      where: { name: 'admin.access' }
    });

    if (!adminAccessPermission) {
      console.log('Creating admin.access permission...');
      adminAccessPermission = await prisma.permission.create({
        data: {
          name: 'admin.access',
          module: 'admin',
          resource: 'panel',
          action: 'access',
          scope: 'platform',
          description: 'Access to admin panel',
          is_system: true,
          priority: 1000
        }
      });
      console.log('✅ Created admin.access permission');
    }

    // 2. Find the admin role
    const adminRole = await prisma.role.findFirst({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      console.error('❌ Admin role not found!');
      return;
    }

    console.log(`Found admin role: ${adminRole.name} (ID: ${adminRole.id})`);

    // 3. Check if role already has the permission
    const existingPermission = await prisma.rolePermission.findFirst({
      where: {
        role_id: adminRole.id,
        permission_id: adminAccessPermission.id
      }
    });

    if (!existingPermission) {
      console.log('Assigning admin.access permission to admin role...');
      await prisma.rolePermission.create({
        data: {
          role_id: adminRole.id,
          permission_id: adminAccessPermission.id
        }
      });
      console.log('✅ Permission assigned!');
    } else {
      console.log('✅ Admin role already has admin.access permission');
    }

    // 4. Also add some essential platform permissions for admin
    const essentialPermissions = [
      {
        name: 'platform.users.read',
        module: 'platform',
        resource: 'users',
        action: 'read',
        scope: 'platform',
        description: 'View platform users'
      },
      {
        name: 'platform.users.manage',
        module: 'platform',
        resource: 'users',
        action: 'manage',
        scope: 'platform',
        description: 'Manage platform users'
      },
      {
        name: 'platform.settings.read',
        module: 'platform',
        resource: 'settings',
        action: 'read',
        scope: 'platform',
        description: 'View platform settings'
      },
      {
        name: 'platform.settings.manage',
        module: 'platform',
        resource: 'settings',
        action: 'manage',
        scope: 'platform',
        description: 'Manage platform settings'
      }
    ];

    for (const permData of essentialPermissions) {
      // Check if permission exists
      let permission = await prisma.permission.findFirst({
        where: { name: permData.name }
      });

      if (!permission) {
        console.log(`Creating ${permData.name} permission...`);
        permission = await prisma.permission.create({
          data: {
            ...permData,
            is_system: true,
            priority: 100
          }
        });
      }

      // Assign to admin role
      const hasPermission = await prisma.rolePermission.findFirst({
        where: {
          role_id: adminRole.id,
          permission_id: permission.id
        }
      });

      if (!hasPermission) {
        await prisma.rolePermission.create({
          data: {
            role_id: adminRole.id,
            permission_id: permission.id
          }
        });
        console.log(`✅ Assigned ${permData.name} to admin role`);
      }
    }

    // 5. Verify super admin account
    console.log('\n📊 Verifying super admin account...');
    const superAdmin = await prisma.account.findUnique({
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

    if (superAdmin && superAdmin.users[0]) {
      const user = superAdmin.users[0];
      console.log('\nSuper Admin Account:');
      console.log('Email:', superAdmin.email);
      console.log('User ID:', user.id);
      console.log('Roles:');
      
      user.userRoles.forEach(ur => {
        console.log(`- ${ur.role.name}`);
        console.log('  Permissions:');
        ur.role.rolePermissions.forEach(rp => {
          console.log(`    - ${rp.permission.name}`);
        });
      });
    }

    console.log('\n✅ Admin permissions setup complete!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminPermissions();