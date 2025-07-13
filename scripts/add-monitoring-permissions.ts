#!/usr/bin/env npx tsx

/**
 * Add monitoring permissions to itellico Mono
 * Run with: npx tsx scripts/add-monitoring-permissions.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMonitoringPermissions() {
  console.log('🔧 Adding monitoring permissions...');

  try {
    // Define monitoring permissions
    const monitoringPermissions = [
      {
        name: 'View Monitoring Dashboard',
        pattern: 'monitoring.dashboard.view',
        resource: 'monitoring',
        action: 'view',
        scope: 'global',
        description: 'View the main monitoring dashboard',
        isWildcard: false,
        priority: 90
      },
      {
        name: 'Access System Metrics',
        pattern: 'monitoring.metrics.read',
        resource: 'monitoring',
        action: 'read',
        scope: 'global',
        description: 'Access system and API metrics',
        isWildcard: false,
        priority: 85
      },
      {
        name: 'Manage Monitoring Settings',
        pattern: 'monitoring.settings.manage',
        resource: 'monitoring',
        action: 'manage',
        scope: 'global',
        description: 'Configure monitoring settings and alerts',
        isWildcard: false,
        priority: 80
      },
      {
        name: 'Full Monitoring Access',
        pattern: 'monitoring.*',
        resource: 'monitoring',
        action: '*',
        scope: 'global',
        description: 'Complete access to monitoring features',
        isWildcard: true,
        priority: 95
      }
    ];

    // Add permissions
    for (const permission of monitoringPermissions) {
      const existing = await prisma.permission.findFirst({
        where: { pattern: permission.pattern }
      });

      if (!existing) {
        await prisma.permission.create({
          data: permission
        });
        console.log(`✅ Added permission: ${permission.name}`);
      } else {
        console.log(`⚠️  Permission already exists: ${permission.name}`);
      }
    }

    // Find Super Admin role
    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'Super Admin' }
    });

    if (superAdminRole) {
      // Get all monitoring permissions
      const permissions = await prisma.permission.findMany({
        where: { resource: 'monitoring' }
      });

      // Assign to Super Admin role
      for (const permission of permissions) {
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
          console.log(`✅ Assigned ${permission.name} to Super Admin`);
        }
      }
    } else {
      console.log('⚠️  Super Admin role not found');
    }

    console.log('🎉 Monitoring permissions setup complete!');

  } catch (error) {
    console.error('❌ Error setting up monitoring permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMonitoringPermissions();