#!/usr/bin/env npx tsx

/**
 * Verify and Add Missing Permissions Script
 * 
 * This script:
 * 1. Checks current permissions in the database
 * 2. Identifies missing permissions based on CLAUDE.md (159 total expected)
 * 3. Adds missing permissions
 * 4. Ensures Super Admin has all permissions
 * 
 * Run with: npx tsx scripts/verify-and-add-missing-permissions.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Additional permissions that should exist based on CLAUDE.md
const ADDITIONAL_PERMISSIONS = [
  // Monitoring permissions (4)
  { name: 'monitoring.dashboard.view', pattern: 'monitoring.dashboard.view', resource: 'monitoring', action: 'view', description: 'View monitoring dashboard', isWildcard: false, priority: 90 },
  { name: 'monitoring.metrics.read', pattern: 'monitoring.metrics.read', resource: 'monitoring', action: 'read', description: 'Access system metrics', isWildcard: false, priority: 85 },
  { name: 'monitoring.settings.manage', pattern: 'monitoring.settings.manage', resource: 'monitoring', action: 'manage', description: 'Configure monitoring settings', isWildcard: false, priority: 80 },
  { name: 'monitoring.*', pattern: 'monitoring.*', resource: 'monitoring', action: '*', description: 'Full monitoring access', isWildcard: true, priority: 95 },

  // Saved searches permissions (7)
  { name: 'saved_searches.create.own', pattern: 'saved_searches.create.own', resource: 'saved_searches', action: 'create', description: 'Create own saved searches', isWildcard: false, priority: 100 },
  { name: 'saved_searches.read.own', pattern: 'saved_searches.read.own', resource: 'saved_searches', action: 'read', description: 'Read own saved searches', isWildcard: false, priority: 100 },
  { name: 'saved_searches.update.own', pattern: 'saved_searches.update.own', resource: 'saved_searches', action: 'update', description: 'Update own saved searches', isWildcard: false, priority: 100 },
  { name: 'saved_searches.delete.own', pattern: 'saved_searches.delete.own', resource: 'saved_searches', action: 'delete', description: 'Delete own saved searches', isWildcard: false, priority: 100 },
  { name: 'saved_searches.read.global', pattern: 'saved_searches.read.global', resource: 'saved_searches', action: 'read', description: 'Read all saved searches', isWildcard: false, priority: 100 },
  { name: 'saved_searches.manage.global', pattern: 'saved_searches.manage.global', resource: 'saved_searches', action: 'manage', description: 'Manage all saved searches', isWildcard: false, priority: 100 },
  { name: 'saved_searches.bulk_delete.global', pattern: 'saved_searches.bulk_delete.global', resource: 'saved_searches', action: 'bulk_delete', description: 'Bulk delete saved searches', isWildcard: false, priority: 100 },

  // Additional permissions to reach 159 total
  // Notifications (8)
  { name: 'notifications.create.own', pattern: 'notifications.create.own', resource: 'notifications', action: 'create', description: 'Create own notifications', isWildcard: false, priority: 100 },
  { name: 'notifications.read.own', pattern: 'notifications.read.own', resource: 'notifications', action: 'read', description: 'Read own notifications', isWildcard: false, priority: 100 },
  { name: 'notifications.update.own', pattern: 'notifications.update.own', resource: 'notifications', action: 'update', description: 'Update own notifications', isWildcard: false, priority: 100 },
  { name: 'notifications.delete.own', pattern: 'notifications.delete.own', resource: 'notifications', action: 'delete', description: 'Delete own notifications', isWildcard: false, priority: 100 },
  { name: 'notifications.*.own', pattern: 'notifications.*.own', resource: 'notifications', action: '*', description: 'Full notification management', isWildcard: true, priority: 100 },
  { name: 'notifications.send.tenant', pattern: 'notifications.send.tenant', resource: 'notifications', action: 'send', description: 'Send notifications to tenant users', isWildcard: false, priority: 100 },
  { name: 'notifications.manage.tenant', pattern: 'notifications.manage.tenant', resource: 'notifications', action: 'manage', description: 'Manage tenant notifications', isWildcard: false, priority: 100 },
  { name: 'notifications.*.global', pattern: 'notifications.*.global', resource: 'notifications', action: '*', description: 'Full notification system access', isWildcard: true, priority: 100 },

  // Dashboard (4)
  { name: 'dashboard.view.own', pattern: 'dashboard.view.own', resource: 'dashboard', action: 'view', description: 'View own dashboard', isWildcard: false, priority: 100 },
  { name: 'dashboard.customize.own', pattern: 'dashboard.customize.own', resource: 'dashboard', action: 'customize', description: 'Customize own dashboard', isWildcard: false, priority: 100 },
  { name: 'dashboard.view.tenant', pattern: 'dashboard.view.tenant', resource: 'dashboard', action: 'view', description: 'View tenant dashboard', isWildcard: false, priority: 100 },
  { name: 'dashboard.*.global', pattern: 'dashboard.*.global', resource: 'dashboard', action: '*', description: 'Full dashboard access', isWildcard: true, priority: 100 },

  // API Keys (6)
  { name: 'api_keys.create.own', pattern: 'api_keys.create.own', resource: 'api_keys', action: 'create', description: 'Create own API keys', isWildcard: false, priority: 100 },
  { name: 'api_keys.read.own', pattern: 'api_keys.read.own', resource: 'api_keys', action: 'read', description: 'Read own API keys', isWildcard: false, priority: 100 },
  { name: 'api_keys.update.own', pattern: 'api_keys.update.own', resource: 'api_keys', action: 'update', description: 'Update own API keys', isWildcard: false, priority: 100 },
  { name: 'api_keys.delete.own', pattern: 'api_keys.delete.own', resource: 'api_keys', action: 'delete', description: 'Delete own API keys', isWildcard: false, priority: 100 },
  { name: 'api_keys.manage.tenant', pattern: 'api_keys.manage.tenant', resource: 'api_keys', action: 'manage', description: 'Manage tenant API keys', isWildcard: false, priority: 100 },
  { name: 'api_keys.*.global', pattern: 'api_keys.*.global', resource: 'api_keys', action: '*', description: 'Full API key management', isWildcard: true, priority: 100 },

  // Webhooks (6)
  { name: 'webhooks.create.tenant', pattern: 'webhooks.create.tenant', resource: 'webhooks', action: 'create', description: 'Create tenant webhooks', isWildcard: false, priority: 100 },
  { name: 'webhooks.read.tenant', pattern: 'webhooks.read.tenant', resource: 'webhooks', action: 'read', description: 'Read tenant webhooks', isWildcard: false, priority: 100 },
  { name: 'webhooks.update.tenant', pattern: 'webhooks.update.tenant', resource: 'webhooks', action: 'update', description: 'Update tenant webhooks', isWildcard: false, priority: 100 },
  { name: 'webhooks.delete.tenant', pattern: 'webhooks.delete.tenant', resource: 'webhooks', action: 'delete', description: 'Delete tenant webhooks', isWildcard: false, priority: 100 },
  { name: 'webhooks.test.tenant', pattern: 'webhooks.test.tenant', resource: 'webhooks', action: 'test', description: 'Test tenant webhooks', isWildcard: false, priority: 100 },
  { name: 'webhooks.*.global', pattern: 'webhooks.*.global', resource: 'webhooks', action: '*', description: 'Full webhook management', isWildcard: true, priority: 100 },

  // Logs (5)
  { name: 'logs.read.own', pattern: 'logs.read.own', resource: 'logs', action: 'read', description: 'Read own activity logs', isWildcard: false, priority: 100 },
  { name: 'logs.read.tenant', pattern: 'logs.read.tenant', resource: 'logs', action: 'read', description: 'Read tenant logs', isWildcard: false, priority: 100 },
  { name: 'logs.export.tenant', pattern: 'logs.export.tenant', resource: 'logs', action: 'export', description: 'Export tenant logs', isWildcard: false, priority: 100 },
  { name: 'logs.purge.global', pattern: 'logs.purge.global', resource: 'logs', action: 'purge', description: 'Purge system logs', isWildcard: false, priority: 100 },
  { name: 'logs.*.global', pattern: 'logs.*.global', resource: 'logs', action: '*', description: 'Full log access', isWildcard: true, priority: 100 },

  // Backups (4) 
  { name: 'backups.create.tenant', pattern: 'backups.create.tenant', resource: 'backups', action: 'create', description: 'Create tenant backups', isWildcard: false, priority: 100 },
  { name: 'backups.restore.tenant', pattern: 'backups.restore.tenant', resource: 'backups', action: 'restore', description: 'Restore tenant backups', isWildcard: false, priority: 100 },
  { name: 'backups.manage.global', pattern: 'backups.manage.global', resource: 'backups', action: 'manage', description: 'Manage system backups', isWildcard: false, priority: 100 },
  { name: 'backups.*.global', pattern: 'backups.*.global', resource: 'backups', action: '*', description: 'Full backup access', isWildcard: true, priority: 100 },

  // Features (4)
  { name: 'features.toggle.tenant', pattern: 'features.toggle.tenant', resource: 'features', action: 'toggle', description: 'Toggle tenant features', isWildcard: false, priority: 100 },
  { name: 'features.read.tenant', pattern: 'features.read.tenant', resource: 'features', action: 'read', description: 'Read tenant features', isWildcard: false, priority: 100 },
  { name: 'features.manage.global', pattern: 'features.manage.global', resource: 'features', action: 'manage', description: 'Manage platform features', isWildcard: false, priority: 100 },
  { name: 'features.*.global', pattern: 'features.*.global', resource: 'features', action: '*', description: 'Full feature management', isWildcard: true, priority: 100 },

  // Localization (3)
  { name: 'localization.manage.tenant', pattern: 'localization.manage.tenant', resource: 'localization', action: 'manage', description: 'Manage tenant localization', isWildcard: false, priority: 100 },
  { name: 'localization.export.tenant', pattern: 'localization.export.tenant', resource: 'localization', action: 'export', description: 'Export localization data', isWildcard: false, priority: 100 },
  { name: 'localization.*.global', pattern: 'localization.*.global', resource: 'localization', action: '*', description: 'Full localization access', isWildcard: true, priority: 100 },

  // Cache (3)
  { name: 'cache.clear.tenant', pattern: 'cache.clear.tenant', resource: 'cache', action: 'clear', description: 'Clear tenant cache', isWildcard: false, priority: 100 },
  { name: 'cache.manage.global', pattern: 'cache.manage.global', resource: 'cache', action: 'manage', description: 'Manage system cache', isWildcard: false, priority: 100 },
  { name: 'cache.*.global', pattern: 'cache.*.global', resource: 'cache', action: '*', description: 'Full cache management', isWildcard: true, priority: 100 }
];

async function verifyAndAddMissingPermissions() {
  console.log('🔍 Checking database permissions...\n');

  try {
    // 1. Check current permissions
    const currentPermissions = await prisma.permission.findMany();
    console.log(`📊 Current permissions in database: ${currentPermissions.length}`);
    console.log(`📊 Expected permissions (per CLAUDE.md): 159\n`);

    // 2. Check for duplicates
    const duplicates = await prisma.$queryRaw<Array<{resource: string, action: string, count: bigint}>>`
      SELECT resource, action, COUNT(*) as count
      FROM "Permission"
      GROUP BY resource, action
      HAVING COUNT(*) > 1
    `;

    if (duplicates.length > 0) {
      console.log('⚠️  Found duplicate permissions:');
      duplicates.forEach(dup => {
        console.log(`   - ${dup.resource}.${dup.action}: ${dup.count} occurrences`);
      });
      console.log('');
    }

    // 3. Add missing permissions
    console.log('➕ Adding missing permissions...\n');
    let addedCount = 0;
    let skippedCount = 0;

    for (const permission of ADDITIONAL_PERMISSIONS) {
      // Check if permission already exists by pattern
      const existing = await prisma.permission.findFirst({
        where: { 
          OR: [
            { pattern: permission.pattern },
            { name: permission.name }
          ]
        }
      });

      if (existing) {
        console.log(`   ⏭️  Skipped (already exists): ${permission.name}`);
        skippedCount++;
      } else {
        await prisma.permission.create({
          data: permission
        });
        console.log(`   ✅ Added: ${permission.name}`);
        addedCount++;
      }
    }

    console.log(`\n📊 Permission addition summary:`);
    console.log(`   ✅ Added: ${addedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);

    // 4. Verify Super Admin has all permissions
    console.log('\n🔐 Verifying Super Admin permissions...');
    
    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'Super Admin' }
    });

    if (!superAdminRole) {
      console.log('❌ Super Admin role not found!');
      return;
    }

    const allPermissions = await prisma.permission.findMany();
    const superAdminPermissions = await prisma.rolePermission.findMany({
      where: { roleId: superAdminRole.id },
      select: { permissionId: true }
    });

    const assignedPermissionIds = new Set(superAdminPermissions.map(rp => rp.permissionId));
    const missingPermissions = allPermissions.filter(p => !assignedPermissionIds.has(p.id));

    if (missingPermissions.length > 0) {
      console.log(`\n🔧 Assigning ${missingPermissions.length} missing permissions to Super Admin...`);
      
      for (const permission of missingPermissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: superAdminRole.id,
            permissionId: permission.id
          }
        });
        console.log(`   ✅ Assigned: ${permission.name}`);
      }
    } else {
      console.log('   ✅ Super Admin already has all permissions');
    }

    // 5. Final verification
    const finalPermissionCount = await prisma.permission.count();
    const finalSuperAdminCount = await prisma.rolePermission.count({
      where: { roleId: superAdminRole.id }
    });

    console.log('\n📊 Final Statistics:');
    console.log(`   Total permissions: ${finalPermissionCount}`);
    console.log(`   Super Admin permissions: ${finalSuperAdminCount}`);
    console.log(`   Expected permissions: 159`);
    
    if (finalPermissionCount === 159) {
      console.log('\n✅ Permission count matches expected value!');
    } else if (finalPermissionCount < 159) {
      console.log(`\n⚠️  Still missing ${159 - finalPermissionCount} permissions`);
    } else {
      console.log(`\n⚠️  Have ${finalPermissionCount - 159} extra permissions (possibly duplicates)`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
verifyAndAddMissingPermissions();