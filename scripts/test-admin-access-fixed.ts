import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAdminAccess() {
  console.log('🧪 TESTING ADMIN ACCESS AFTER PERMISSION FIX');
  console.log('=' .repeat(60));

  try {
    // Test User 1 permissions
    const user1Account = await prisma.account.findUnique({
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

    if (!user1Account || !user1Account.users[0]) {
      console.error('❌ User 1 not found!');
      return;
    }

    const user = user1Account.users[0];
    console.log(`👤 User: ${user1Account.email} (ID: ${user.id})`);
    
    // Check roles
    const userRoles = user.roles.map(ur => ur.role.name);
    console.log(`🎭 Roles: ${userRoles.join(', ')}`);

    // Count total permissions
    const totalPermissions = user.roles.reduce((count, userRole) => 
      count + userRole.role.permissions.length, 0
    );

    console.log(`🔑 Total Permissions: ${totalPermissions}`);

    // Check for critical admin permissions
    const allUserPermissions = user.roles.flatMap(userRole => 
      userRole.role.permissions.map(rp => rp.permission.name)
    );

    const criticalPermissions = [
      'admin.full_access',
      'admin.manage',
      'platform.read.global',
      'platform.manage.global',
      'tenants.read.global',
      'tenant.read.tenant',
      'users.manage.tenant',
      'profiles.manage.tenant'
    ];

    console.log('\n🔍 CRITICAL PERMISSION CHECK:');
    criticalPermissions.forEach(permission => {
      const hasPermission = allUserPermissions.includes(permission);
      console.log(`   ${hasPermission ? '✅' : '❌'} ${permission}`);
    });

    // Get total permissions in database
    const totalInDb = await prisma.permission.count();
    console.log(`\n📊 PERMISSION COVERAGE:`);
    console.log(`   User has: ${totalPermissions} permissions`);
    console.log(`   Database total: ${totalInDb} permissions`);
    console.log(`   Coverage: ${((totalPermissions / totalInDb) * 100).toFixed(1)}%`);

    if (totalPermissions === totalInDb) {
      console.log('\n🎉 SUCCESS: User 1 has COMPLETE admin access!');
      console.log('✅ Should be able to access /admin/permissions');
      console.log('✅ Should be able to access all admin features');
    } else {
      console.log('\n❌ ISSUE: User 1 does not have complete access');
      console.log('⚠️ May still encounter "Access Denied" errors');
    }

    // Test specific admin permissions
    console.log('\n🧪 ADMIN FEATURE ACCESS TEST:');
    const adminFeatures = [
      'admin.permissions.read',
      'admin.roles.read', 
      'admin.users.read',
      'admin.tenants.read',
      'saved_searches.read'
    ];

    let accessibleFeatures = 0;
    adminFeatures.forEach(feature => {
      const hasAccess = allUserPermissions.some(p => 
        p.includes(feature) || 
        p.includes('admin.full_access') || 
        p.includes('platform.manage.global')
      );
      console.log(`   ${hasAccess ? '✅' : '❌'} ${feature}`);
      if (hasAccess) accessibleFeatures++;
    });

    console.log(`\n📈 Admin Features Accessible: ${accessibleFeatures}/${adminFeatures.length}`);

  } catch (error) {
    console.error('❌ Error testing admin access:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await testAdminAccess();
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default main; 