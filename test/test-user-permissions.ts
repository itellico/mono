import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testUserPermissions() {
  try {
    // Find the super admin user
    const superAdminUser = await prisma.user.findFirst({
      where: {
        account: {
          email: '1@1.com'
        }
      },
      include: {
        account: true,
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

    if (!superAdminUser) {
      console.log('Super admin user not found!');
      return;
    }

    console.log('User:', superAdminUser.account.email);
    console.log('User UUID:', superAdminUser.uuid);
    console.log('Roles:', superAdminUser.userRoles.map(ur => ur.role.name).join(', '));
    
    // Extract permissions like the auth service does
    const permissions = new Set<string>();
    
    for (const userRole of superAdminUser.userRoles) {
      console.log(`\nRole: ${userRole.role.name} (${userRole.role.permissions.length} permissions)`);
      for (const rolePerm of userRole.role.permissions) {
        permissions.add(rolePerm.permission.name);
      }
    }
    
    const permArray = Array.from(permissions).sort();
    console.log('\nTotal unique permissions:', permArray.length);
    
    // Check for category permissions
    const categoryPerms = permArray.filter(p => p.includes('categor'));
    console.log('\nCategory permissions:', categoryPerms);
    
    // Show first 10 permissions
    console.log('\nFirst 10 permissions:');
    permArray.slice(0, 10).forEach(p => console.log(' -', p));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserPermissions();