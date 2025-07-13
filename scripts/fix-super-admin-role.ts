#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSuperAdminRole() {
  try {
    console.log('🔧 Fixing super admin role...\n');

    // 1. Find or create super_admin role
    let superAdminRole = await prisma.role.findFirst({
      where: { code: 'super_admin' }
    });

    if (!superAdminRole) {
      console.log('Creating super_admin role...');
      superAdminRole = await prisma.role.create({
        data: {
          name: 'super_admin',
          code: 'super_admin',
          description: 'Super Administrator with full system access',
          tenant_id: 1
        }
      });
      console.log('✅ Created super_admin role');
    }

    // 2. Copy all permissions from admin role to super_admin role
    const adminRole = await prisma.role.findFirst({
      where: { name: 'admin' },
      include: {
        rolePermissions: true
      }
    });

    if (adminRole) {
      console.log('Copying permissions from admin role...');
      for (const rp of adminRole.rolePermissions) {
        const exists = await prisma.rolePermission.findFirst({
          where: {
            role_id: superAdminRole.id,
            permission_id: rp.permission_id
          }
        });

        if (!exists) {
          await prisma.rolePermission.create({
            data: {
              role_id: superAdminRole.id,
              permission_id: rp.permission_id
            }
          });
        }
      }
      console.log('✅ Permissions copied');
    }

    // 3. Find super admin user
    const superAdminAccount = await prisma.account.findUnique({
      where: { email: '1@1.com' },
      include: {
        users: {
          include: {
            userRoles: true
          }
        }
      }
    });

    if (!superAdminAccount || !superAdminAccount.users[0]) {
      console.error('❌ Super admin account not found!');
      return;
    }

    const user = superAdminAccount.users[0];
    console.log(`Found super admin user: ${user.username} (ID: ${user.id})`);

    // 4. Remove old admin role
    const oldAdminRole = await prisma.userRole.findFirst({
      where: {
        user_id: user.id,
        role: {
          name: 'admin'
        }
      }
    });

    if (oldAdminRole) {
      console.log('Removing old admin role...');
      await prisma.userRole.delete({
        where: { id: oldAdminRole.id }
      });
    }

    // 5. Assign super_admin role
    const hasNewRole = await prisma.userRole.findFirst({
      where: {
        user_id: user.id,
        role_id: superAdminRole.id
      }
    });

    if (!hasNewRole) {
      console.log('Assigning super_admin role...');
      await prisma.userRole.create({
        data: {
          user_id: user.id,
          role_id: superAdminRole.id
        }
      });
      console.log('✅ Super admin role assigned!');
    } else {
      console.log('✅ User already has super_admin role');
    }

    // 6. Verify the change
    console.log('\n📊 Verifying changes...');
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
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
    });

    if (updatedUser) {
      console.log('\nUpdated roles:');
      updatedUser.userRoles.forEach(ur => {
        console.log(`- ${ur.role.name} (${ur.role.code})`);
        console.log(`  Permissions: ${ur.role.rolePermissions.length}`);
      });
    }

    console.log('\n✅ Super admin role fix complete!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSuperAdminRole();