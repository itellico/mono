#!/usr/bin/env npx tsx

/**
 * Add Final Missing Permissions
 * 
 * Adds the last 5 permissions to reach 159 total
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FINAL_PERMISSIONS = [
  // Queue management (2)
  { name: 'queues.manage.tenant', pattern: 'queues.manage.tenant', resource: 'queues', action: 'manage', description: 'Manage tenant job queues', isWildcard: false, priority: 100 },
  { name: 'queues.*.global', pattern: 'queues.*.global', resource: 'queues', action: '*', description: 'Full queue management', isWildcard: true, priority: 100 },

  // Rate limiting (2)
  { name: 'rate_limits.configure.tenant', pattern: 'rate_limits.configure.tenant', resource: 'rate_limits', action: 'configure', description: 'Configure tenant rate limits', isWildcard: false, priority: 100 },
  { name: 'rate_limits.*.global', pattern: 'rate_limits.*.global', resource: 'rate_limits', action: '*', description: 'Full rate limit control', isWildcard: true, priority: 100 },

  // Health checks (1)
  { name: 'health.*.global', pattern: 'health.*.global', resource: 'health', action: '*', description: 'System health monitoring', isWildcard: true, priority: 100 }
];

async function addFinalPermissions() {
  console.log('➕ Adding final 5 permissions...\n');

  try {
    let addedCount = 0;

    for (const permission of FINAL_PERMISSIONS) {
      const existing = await prisma.permission.findFirst({
        where: { 
          OR: [
            { pattern: permission.pattern },
            { name: permission.name }
          ]
        }
      });

      if (!existing) {
        await prisma.permission.create({
          data: permission
        });
        console.log(`   ✅ Added: ${permission.name}`);
        addedCount++;
      } else {
        console.log(`   ⏭️  Skipped: ${permission.name} (already exists)`);
      }
    }

    // Assign to Super Admin
    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'Super Admin' }
    });

    if (superAdminRole) {
      const newPermissions = await prisma.permission.findMany({
        where: {
          pattern: {
            in: FINAL_PERMISSIONS.map(p => p.pattern)
          }
        }
      });

      for (const permission of newPermissions) {
        const existing = await prisma.rolePermission.findFirst({
          where: {
            roleId: superAdminRole.id,
            permissionId: permission.id
          }
        });

        if (!existing) {
          await prisma.rolePermission.create({
            data: {
              roleId: superAdminRole.id,
              permissionId: permission.id
            }
          });
          console.log(`   ✅ Assigned to Super Admin: ${permission.name}`);
        }
      }
    }

    // Final count
    const finalCount = await prisma.permission.count();
    console.log(`\n📊 Final permission count: ${finalCount}`);
    
    if (finalCount === 159) {
      console.log('✅ Successfully reached 159 permissions!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addFinalPermissions();