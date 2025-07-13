import { db as prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

async function fixSuperAdminPermissions() {
  try {
    logger.info('🔧 Fixing Super Admin permissions...\n');

    // 1. Find the Super Admin role
    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'Super Admin' },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!superAdminRole) {
      logger.error('❌ Super Admin role not found!');
      return;
    }

    logger.info(`✅ Found Super Admin role (ID: ${superAdminRole.id})`);
    logger.info(`   Current permissions: ${superAdminRole.permissions.length}`);

    // 2. Get all permissions
    const allPermissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' }
    });

    logger.info(`   Total permissions in system: ${allPermissions.length}`);

    // 3. Find missing permissions
    const currentPermissionIds = superAdminRole.permissions.map(rp => rp.permissionId);
    const missingPermissions = allPermissions.filter(p => !currentPermissionIds.includes(p.id));

    if (missingPermissions.length === 0) {
      logger.info('✅ Super Admin already has all permissions!');
      return;
    }

    logger.info(`\n⚠️  Missing ${missingPermissions.length} permissions. Adding them now...`);

    // 4. Add missing permissions
    let addedCount = 0;
    for (const permission of missingPermissions) {
      try {
        await prisma.rolePermission.create({
          data: {
            roleId: superAdminRole.id,
            permissionId: permission.id
          }
        });
        logger.info(`   ✅ Added: ${permission.name}`);
        addedCount++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          logger.warn(`   ⚠️  Already exists: ${permission.name}`);
        } else {
          logger.error(`   ❌ Failed to add: ${permission.name}`, error.message);
        }
      }
    }

    logger.info(`\n✅ Successfully added ${addedCount} permissions to Super Admin role`);

    // 5. Verify final count
    const updatedRole = await prisma.role.findFirst({
      where: { id: superAdminRole.id },
      include: {
        permissions: true
      }
    });

    logger.info(`   Final permission count: ${updatedRole?.permissions.length}/${allPermissions.length}`);

    // 6. Also check role codes/names consistency
    logger.info('\n🔍 Checking role naming consistency...');
    const rolesWithCodes = await prisma.$queryRaw`
      SELECT id, name, code FROM "Role" WHERE code IS NOT NULL
    ` as any[];

    if (rolesWithCodes.length > 0) {
      logger.info('   Roles with code field:');
      rolesWithCodes.forEach((role: any) => {
        logger.info(`   - ${role.name} (code: ${role.code})`);
      });
    } else {
      logger.info('   ℹ️  No roles have a code field set');
    }

  } catch (error) {
    logger.error('Error fixing permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixSuperAdminPermissions();