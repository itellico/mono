#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLE_PERMISSIONS = [
  {
    roleName: 'super_admin',
    permissions: [
      'saved_searches.create.own',
      'saved_searches.read.own',
      'saved_searches.update.own', 
      'saved_searches.delete.own',
      'saved_searches.read.global',
      'saved_searches.manage.global',
      'saved_searches.bulk_delete.global'
    ]
  },
  {
    roleName: 'tenant_admin',
    permissions: [
      'saved_searches.create.own',
      'saved_searches.read.own',
      'saved_searches.update.own',
      'saved_searches.delete.own',
      'saved_searches.read.global',
      'saved_searches.manage.global'
    ]
  },
  {
    roleName: 'content_moderator',
    permissions: [
      'saved_searches.create.own',
      'saved_searches.read.own',
      'saved_searches.update.own',
      'saved_searches.delete.own'
    ]
  },
  {
    roleName: 'user',
    permissions: [
      'saved_searches.create.own',
      'saved_searches.read.own',
      'saved_searches.update.own',
      'saved_searches.delete.own'
    ]
  }
];

async function assignSavedSearchPermissions() {
  console.log('🔑 Assigning saved search permissions to roles...\n');
  
  let assignedCount = 0;
  let skippedCount = 0;
  
  for (const rolePermission of ROLE_PERMISSIONS) {
    try {
      const role = await prisma.role.findFirst({
        where: { name: rolePermission.roleName },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });

      if (!role) {
        console.log(`   ⚠️  Role not found: ${rolePermission.roleName}`);
        skippedCount++;
        continue;
      }

      console.log(`\n📝 Processing role: ${role.name}`);
      const currentPermissionNames = role.permissions.map(rp => rp.permission.name);

      for (const permissionName of rolePermission.permissions) {
        if (currentPermissionNames.includes(permissionName)) {
          console.log(`   ⏭️  Permission ${permissionName} already assigned`);
          continue;
        }

        const permission = await prisma.permission.findUnique({
          where: { name: permissionName }
        });

        if (!permission) {
          console.log(`   ⚠️  Permission not found: ${permissionName}`);
          continue;
        }

        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id
          }
        });

        console.log(`   ✅ Assigned ${permissionName}`);
        assignedCount++;
      }
    } catch (error) {
      console.error(`   ❌ Failed to assign permissions to ${rolePermission.roleName}:`, error);
    }
  }
  
  console.log(`\n📋 Summary:`);
  console.log(`   ✅ Permissions assigned: ${assignedCount}`);
  console.log(`   ⚠️  Roles skipped: ${skippedCount}`);
  
  await prisma.$disconnect();
}

async function main() {
  try {
    await assignSavedSearchPermissions();
    console.log('\n🎉 Saved search permissions assignment completed!');
  } catch (error) {
    console.error('❌ Error assigning saved search permissions:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 