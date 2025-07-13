#!/usr/bin/env node

/**
 * 🔧 MERGE DUPLICATE ROLES SCRIPT
 * 
 * This script handles the duplicate role issue by merging users from
 * incorrectly named roles to the correctly named ones.
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
  console.log('🔧 Starting Role Merge Process...\n');

  try {
    let totalMerged = 0;

    for (const [incorrectName, correctName] of Object.entries(ROLE_MERGES)) {
      console.log(`🔍 Processing: "${incorrectName}" → "${correctName}"`);

      // Find both roles
      const incorrectRole = await prisma.role.findUnique({
        where: { name: incorrectName },
        include: { users: true }
      });

      const correctRole = await prisma.role.findUnique({
        where: { name: correctName }
      });

      if (!incorrectRole) {
        console.log(`   ℹ️  No role found with name "${incorrectName}"`);
        continue;
      }

      if (!correctRole) {
        console.log(`   ❌ Correct role "${correctName}" not found!`);
        continue;
      }

      console.log(`   📊 Found ${incorrectRole.users.length} users with incorrect role`);

      // Merge users to correct role
      let mergedUsers = 0;
      for (const userRole of incorrectRole.users) {
        // Check if user already has the correct role
        const existingCorrectRole = await prisma.userRole.findUnique({
          where: {
            userId_roleId: {
              userId: userRole.userId,
              roleId: correctRole.id
            }
          }
        });

        if (existingCorrectRole) {
          console.log(`   ⚠️  User ${userRole.userId} already has correct role, removing duplicate`);
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

      // Delete the incorrect role
      console.log(`   🗑️  Deleting incorrect role "${incorrectName}"`);
      await prisma.role.delete({
        where: { id: incorrectRole.id }
      });

      console.log(`   ✅ Merged ${mergedUsers} users and deleted role "${incorrectName}"\n`);
      totalMerged += mergedUsers;
    }

    // Verify final state
    console.log('📋 Final roles in database:');
    const finalRoles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { users: true }
        }
      }
    });

    for (const role of finalRoles) {
      console.log(`   - ${role.name} (ID: ${role.id}, ${role._count.users} users)`);
    }

    console.log(`\n🎉 Role merge completed! Merged ${totalMerged} users total.`);

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