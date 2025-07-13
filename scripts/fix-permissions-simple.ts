import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSuperAdminPermissions() {
  try {
    console.log('🔧 Fixing Super Admin permissions...\n');

    // 1. Find the Super Admin role
    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'Super Admin' }
    });

    if (!superAdminRole) {
      console.error('❌ Super Admin role not found!');
      return;
    }

    console.log(`✅ Found Super Admin role (ID: ${superAdminRole.id})`);

    // 2. Get current permissions count
    const currentPermissions = await prisma.rolePermission.count({
      where: { roleId: superAdminRole.id }
    });

    // 3. Get all permissions
    const allPermissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' }
    });

    console.log(`   Current permissions: ${currentPermissions}`);
    console.log(`   Total permissions in system: ${allPermissions.length}`);

    if (currentPermissions >= allPermissions.length) {
      console.log('✅ Super Admin already has all permissions!');
      return;
    }

    // 4. Find missing permissions
    const existingPermissionIds = await prisma.rolePermission.findMany({
      where: { roleId: superAdminRole.id },
      select: { permissionId: true }
    });
    
    const existingIds = existingPermissionIds.map(rp => rp.permissionId);
    const missingPermissions = allPermissions.filter(p => !existingIds.includes(p.id));

    console.log(`\n⚠️  Missing ${missingPermissions.length} permissions. Adding them now...`);

    // 5. Add missing permissions
    let addedCount = 0;
    for (const permission of missingPermissions) {
      try {
        await prisma.rolePermission.create({
          data: {
            roleId: superAdminRole.id,
            permissionId: permission.id
          }
        });
        console.log(`   ✅ Added: ${permission.name}`);
        addedCount++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`   ⚠️  Already exists: ${permission.name}`);
        } else {
          console.error(`   ❌ Failed to add: ${permission.name}`, error.message);
        }
      }
    }

    console.log(`\n✅ Successfully added ${addedCount} permissions to Super Admin role`);

    // 6. Verify final count
    const finalCount = await prisma.rolePermission.count({
      where: { roleId: superAdminRole.id }
    });

    console.log(`   Final permission count: ${finalCount}/${allPermissions.length}`);

    if (finalCount === allPermissions.length) {
      console.log('🎉 Super Admin now has ALL permissions!');
    } else {
      console.log('⚠️  There are still missing permissions.');
    }

  } catch (error) {
    console.error('Error fixing permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSuperAdminPermissions();