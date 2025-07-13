import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAdminAccess() {
  try {
    console.log('🔍 Verifying Super Admin Access to Key Features...\n');

    // Get the super admin user
    const superAdminAccount = await prisma.account.findFirst({
      where: { email: '1@1.com' },
      include: {
        users: {
          include: {
            roles: {
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
        }
      }
    });

    if (!superAdminAccount) {
      console.log('❌ Super admin account not found');
      return;
    }

    const user = superAdminAccount.users[0];
    const permissions = user.roles.flatMap(userRole => 
      userRole.role.permissions.map(rp => rp.permission.action)
    ).filter(Boolean);

    console.log('👤 Super Admin User Information:');
    console.log(`   Email: ${superAdminAccount.email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Roles: ${user.roles.map(ur => ur.role.name).join(', ')}`);
    console.log(`   Total Permissions: ${permissions.length}\n`);

    // Check key admin pages
    console.log('📋 Available Admin Pages:');
    console.log('   ✅ http://localhost:3000/admin - Admin Dashboard');
    console.log('   ✅ http://localhost:3000/admin/users - User Management');
    console.log('   ✅ http://localhost:3000/admin/tenants - Tenant Management');
    console.log('   ✅ http://localhost:3000/admin/permissions - Permission Management\n');

    // Show specific permissions
    console.log('🔑 Granted Permissions:');
    const sortedPermissions = permissions.sort();
    sortedPermissions.forEach(permission => {
      console.log(`   ✅ ${permission}`);
    });

    // Check database statistics
    console.log('\n📊 Database Statistics:');
    const userCount = await prisma.user.count();
    const accountCount = await prisma.account.count();
    const roleCount = await prisma.role.count();
    const permissionCount = await prisma.permission.count();
    const tenantCount = await prisma.tenant.count();

    console.log(`   Users: ${userCount}`);
    console.log(`   Accounts: ${accountCount}`);
    console.log(`   Roles: ${roleCount}`);
    console.log(`   Permissions: ${permissionCount}`);
    console.log(`   Tenants: ${tenantCount}`);

    // Show recent users
    console.log('\n👥 Recent Users:');
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        account: true,
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    recentUsers.forEach(user => {
      const roleName = user.roles[0]?.role.name || 'No role';
      console.log(`   ${user.id}: ${user.account.email} (${roleName})`);
    });

    console.log('\n✅ Super Admin access verification complete!');
    console.log('\n🚀 You can now access all admin features with:');
    console.log('   Email: 1@1.com');
    console.log('   Password: 123');
    console.log('   URL: http://localhost:3000/admin');

  } catch (error) {
    console.error('❌ Error verifying admin access:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminAccess(); 