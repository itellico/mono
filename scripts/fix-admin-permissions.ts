import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAdminPermissions() {
  try {
    console.log('🔧 Adding missing permissions for super_admin role...\n');

    // Get the super_admin role
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
      console.log('❌ super_admin role not found');
      return;
    }

    console.log(`✅ Found super_admin role (ID: ${superAdminRole.id})`);

    // List of all permissions that super_admin should have
    const requiredPermissions = [
      // Existing permissions
      'users.manage.tenant',
      'profiles.manage.tenant', 
      'media.manage.tenant',
      'settings.manage.tenant',
      'analytics.read.tenant',
      'content.moderate.tenant',
      'applications.approve.tenant',
      
      // Missing permissions needed for admin routes
      'platform.manage.global',      // Required for /admin, /admin/settings, /admin/translations, /admin/workflows, /admin/tenants
      'users.read.tenant',           // Required for /admin, /admin/users, /admin/applications, /admin/preferences  
      'platform.analytics.global',   // Required for /admin/analytics, /admin/audit
      'media.moderate.tenant',       // Required for /admin/media-review
      'media.approve.tenant',        // Required for /admin/media-review
      'profiles.moderate.tenant'     // Required for /admin/applications
    ];

    let addedCount = 0;
    let existingCount = 0;

    for (const permissionName of requiredPermissions) {
      // Check if permission exists
      let permission = await prisma.permission.findFirst({
        where: { name: permissionName }
      });

      // Create permission if it doesn't exist
      if (!permission) {
        permission = await prisma.permission.create({
          data: {
            name: permissionName,
            description: `Auto-generated permission: ${permissionName}`
          }
        });
        console.log(`  ➕ Created permission: ${permissionName}`);
      }

      // Check if role already has this permission
      const existingRolePermission = await prisma.rolePermission.findFirst({
        where: {
          roleId: superAdminRole.id,
          permissionId: permission.id
        }
      });

      if (existingRolePermission) {
        console.log(`  ✅ Already has: ${permissionName}`);
        existingCount++;
      } else {
        // Add permission to super_admin role
        await prisma.rolePermission.create({
          data: {
            roleId: superAdminRole.id,
            permissionId: permission.id
          }
        });
        console.log(`  🔗 Added permission: ${permissionName}`);
        addedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  - Permissions added: ${addedCount}`);
    console.log(`  - Permissions already existed: ${existingCount}`);
    console.log(`  - Total permissions: ${requiredPermissions.length}`);

    // Verify the current permissions
    const updatedRole = await prisma.role.findFirst({
      where: { name: 'super_admin' },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    console.log(`\n🔐 Super Admin now has ${updatedRole?.permissions.length} permissions:`);
    updatedRole?.permissions.forEach(rp => {
      console.log(`  - ${rp.permission.name}`);
    });

    console.log('\n✅ Admin permissions fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing admin permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPermissions(); 