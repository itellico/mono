#!/usr/bin/env node

/**
 * 🔧 COMPREHENSIVE ROLE MERGE SCRIPT
 * 
 * This script handles all aspects of merging duplicate roles:
 * - Merges users from incorrect to correct roles
 * - Merges permissions from incorrect to correct roles  
 * - Safely deletes the duplicate incorrect roles
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map of incorrect names to correct names
const ROLE_MERGES = {
  'Super Admin': 'super_admin',
  'Tenant Admin': 'tenant_admin', 
  'Content Moderator': 'content_moderator'
};

async function main() {
  console.log('🔧 Starting Comprehensive Role Merge Process...\n');

  try {
    let totalUsersMerged = 0;
    let totalPermissionsMerged = 0;

    for (const [incorrectName, correctName] of Object.entries(ROLE_MERGES)) {
      console.log(`🔍 Processing: "${incorrectName}" → "${correctName}"`);

      // Find both roles with all relationships
      const incorrectRole = await prisma.role.findUnique({
        where: { name: incorrectName },
        include: { 
          users: true,
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });

      const correctRole = await prisma.role.findUnique({
        where: { name: correctName },
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      });

      if (!incorrectRole) {
        console.log(`   ℹ️  No role found with name "${incorrectName}"`);
        continue;
      }

      if (!correctRole) {
        console.log(`   ❌ Correct role "${correctName}" not found!`);
        continue;
      }

      console.log(`   📊 Incorrect role has: ${incorrectRole.users.length} users, ${incorrectRole.permissions.length} permissions`);
      console.log(`   📊 Correct role has: ${correctRole.permissions.length} permissions`);

      // 1. Merge users
      let mergedUsers = 0;
      for (const userRole of incorrectRole.users) {
        const existingCorrectRole = await prisma.userRole.findUnique({
          where: {
            userId_roleId: {
              userId: userRole.userId,
              roleId: correctRole.id
            }
          }
        });

        if (existingCorrectRole) {
          console.log(`   👤 User ${userRole.userId} already has correct role, removing duplicate`);
          await prisma.userRole.delete({
            where: {
              userId_roleId: {
                userId: userRole.userId,
                roleId: incorrectRole.id
              }
            }
          });
        } else {
          console.log(`   👤 Moving user ${userRole.userId} to correct role`);
          await prisma.userRole.update({
            where: {
              userId_roleId: {
                userId: userRole.userId,
                roleId: incorrectRole.id
              }
            },
            data: {
              roleId: correctRole.id
            }
          });
          mergedUsers++;
        }
      }

      // 2. Merge permissions
      let mergedPermissions = 0;
      for (const rolePermission of incorrectRole.permissions) {
        const existingPermission = await prisma.rolePermission.findUnique({
          where: {
            roleId_permissionId: {
              roleId: correctRole.id,
              permissionId: rolePermission.permissionId
            }
          }
        });

        if (!existingPermission) {
          console.log(`   🔐 Adding permission "${rolePermission.permission.name}" to correct role`);
          await prisma.rolePermission.create({
            data: {
              roleId: correctRole.id,
              permissionId: rolePermission.permissionId
            }
          });
          mergedPermissions++;
        } else {
          console.log(`   🔐 Permission "${rolePermission.permission.name}" already exists on correct role`);
        }

        // Delete the permission from incorrect role
        await prisma.rolePermission.delete({
          where: {
            roleId_permissionId: {
              roleId: incorrectRole.id,
              permissionId: rolePermission.permissionId
            }
          }
        });
      }

      // 3. Now safe to delete the incorrect role
      console.log(`   🗑️  Deleting incorrect role "${incorrectName}"`);
      await prisma.role.delete({
        where: { id: incorrectRole.id }
      });

      console.log(`   ✅ Merged ${mergedUsers} users and ${mergedPermissions} permissions from "${incorrectName}"\n`);
      totalUsersMerged += mergedUsers;
      totalPermissionsMerged += mergedPermissions;
    }

    // Verify final state
    console.log('📋 Final roles in database:');
    const finalRoles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { 
            users: true,
            permissions: true
          }
        }
      }
    });

    for (const role of finalRoles) {
      console.log(`   - ${role.name} (ID: ${role.id}, ${role._count.users} users, ${role._count.permissions} permissions)`);
    }

    console.log(`\n🎉 Role merge completed!`);
    console.log(`   📊 Total users merged: ${totalUsersMerged}`);
    console.log(`   📊 Total permissions merged: ${totalPermissionsMerged}`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
}); 