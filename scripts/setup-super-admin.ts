import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupSuperAdmin() {
  try {
    // Check if super_admin role already exists
    let superAdminRole = await prisma.role.findFirst({
      where: { code: 'super_admin' }
    });

    if (!superAdminRole) {
      console.log('Creating super_admin role...');
      superAdminRole = await prisma.role.create({
        data: {
          id: 4, // Use next available ID
          name: 'super_admin',
          code: 'super_admin',
          description: 'Full system access with no restrictions',
          module: 'platform',
          is_system: true,
          level: 1000,
        },
      });
      console.log('✅ Super admin role created');
    } else {
      console.log('✅ Super admin role already exists');
    }

    // Check if wildcard permission exists
    let wildcardPermission = await prisma.permission.findFirst({
      where: { name: '*' }
    });

    if (!wildcardPermission) {
      console.log('Creating wildcard permission...');
      wildcardPermission = await prisma.permission.create({
        data: {
          name: '*',
          description: 'Wildcard permission - grants access to everything',
          pattern: '*',
          is_wildcard: true,
          is_system: true,
          priority: 1000,
        },
      });
      console.log('✅ Wildcard permission created');
    } else {
      console.log('✅ Wildcard permission already exists');
    }

    // Check if permission is already assigned to role
    const existingRolePermission = await prisma.rolePermission.findFirst({
      where: {
        role_id: superAdminRole.id,
        permission_id: wildcardPermission.id,
      }
    });

    if (!existingRolePermission) {
      await prisma.rolePermission.create({
        data: {
          role_id: superAdminRole.id,
          permission_id: wildcardPermission.id,
        },
      });
      console.log('✅ Permission assigned to role');
    }

    // Update user to have super_admin role
    await prisma.user.update({
      where: { id: 3 }, // User ID for 1@1.com
      data: {
        account_role_id: superAdminRole.id,
      },
    });

    // Check if user_role entry exists
    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        user_id: 3,
        role_id: superAdminRole.id,
      }
    });

    if (!existingUserRole) {
      await prisma.userRole.create({
        data: {
          user_id: 3,
          role_id: superAdminRole.id,
        },
      });
    }

    console.log('✅ User 1@1.com updated to super_admin');
    console.log('🎉 User 1@1.com now has full system access with * permissions!');
    
    // Verify the setup
    const updatedUser = await prisma.user.findUnique({
      where: { id: 3 },
      include: {
        account: true,
        roles_users_account_role_idToroles: true,
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
    
    console.log('\nUser setup complete:');
    console.log('- Email:', updatedUser?.account.email);
    console.log('- Account Role:', updatedUser?.roles_users_account_role_idToroles?.name);
    console.log('- Permissions:', updatedUser?.userRoles[0]?.role.rolePermissions[0]?.permission.name);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

setupSuperAdmin().finally(() => prisma.$disconnect());