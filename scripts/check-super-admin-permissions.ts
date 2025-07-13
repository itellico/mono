import { db as prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

async function checkSuperAdminPermissions() {
  try {
    logger.info('🔍 Checking super_admin permissions and role assignments...\n');

    // 1. Check if super_admin role exists
    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'super_admin' },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!superAdminRole) {
      logger.error('❌ super_admin role not found!');
      return;
    }

    logger.info(`✅ super_admin role found: ${superAdminRole.name} (ID: ${superAdminRole.id})`);
    logger.info(`   Total permissions: ${superAdminRole.permissions.length}`);

    // 2. Check all available permissions
    const allPermissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' }
    });

    logger.info(`\n📋 Total permissions in system: ${allPermissions.length}`);

    // 3. Check which permissions super_admin has
    const superAdminPermissionIds = superAdminRole.permissions.map(rp => rp.permissionId);
    const missingPermissions = allPermissions.filter(p => !superAdminPermissionIds.includes(p.id));

    if (missingPermissions.length > 0) {
      logger.warn(`\n⚠️  super_admin is missing ${missingPermissions.length} permissions:`);
      missingPermissions.forEach(p => {
        logger.warn(`   - ${p.name}: ${p.description}`);
      });
    } else {
      logger.info('✅ super_admin has ALL permissions!');
    }

    // 4. Check 1@1.com user
    const account = await prisma.account.findFirst({
      where: { email: '1@1.com' },
      include: {
        users: {
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    if (!account) {
      logger.error('\n❌ Account 1@1.com not found!');
      return;
    }

    logger.info(`\n👤 Account 1@1.com found (ID: ${account.id})`);
    logger.info(`   Users: ${account.users.length}`);

    // Check each user's roles
    for (const user of account.users) {
      logger.info(`\n   User: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
      logger.info(`   Roles assigned: ${user.userRoles.length}`);
      
      const hasSuperAdmin = user.userRoles.some(ur => ur.role.name === 'super_admin');
      
      if (hasSuperAdmin) {
        logger.info('   ✅ Has super_admin role');
      } else {
        logger.error('   ❌ Does NOT have super_admin role!');
        
        // Show what roles they do have
        user.userRoles.forEach(ur => {
          logger.info(`   - ${ur.role.name} (${ur.role.code})`);
        });
      }
    }

    // 5. Check UserRole assignments for super_admin
    const superAdminUserRoles = await prisma.userRole.findMany({
      where: { roleId: superAdminRole.id },
      include: {
        user: {
          include: {
            account: true
          }
        }
      }
    });

    logger.info(`\n📊 Total users with super_admin role: ${superAdminUserRoles.length}`);
    superAdminUserRoles.forEach(ur => {
      logger.info(`   - ${ur.user.account.email}: ${ur.user.firstName} ${ur.user.lastName}`);
    });

    // 6. Fix missing permissions for super_admin if needed
    if (missingPermissions.length > 0) {
      logger.info('\n🔧 Fixing missing permissions for super_admin role...');
      
      for (const permission of missingPermissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: superAdminRole.id,
            permissionId: permission.id
          }
        });
        logger.info(`   ✅ Added permission: ${permission.name}`);
      }
    }

    // 7. Assign super_admin role to 1@1.com if missing
    if (account && account.users.length > 0) {
      const user = account.users[0];
      const hasSuperAdmin = user.userRoles.some(ur => ur.role.name === 'super_admin');
      
      if (!hasSuperAdmin) {
        logger.info('\n🔧 Assigning super_admin role to 1@1.com...');
        
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: superAdminRole.id,
            grantedBy: user.id,
            expiresAt: null
          }
        });
        
        logger.info('   ✅ super_admin role assigned!');
      }
    }

    logger.info('\n✅ Permission check complete!');
    
  } catch (error) {
    logger.error('Error checking permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkSuperAdminPermissions();