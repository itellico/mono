#!/usr/bin/env tsx

import { db } from '../apps/web/src/lib/db';

async function debugUserPermissions() {
  try {
    console.log('🔍 Debugging user permissions...');
    
    // Find the super admin user
    const superAdminUser = await db.user.findFirst({
      where: {
        Account: {
          email: '1@1.com'
        }
      },
      include: {
        Account: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!superAdminUser) {
      console.error('❌ Super admin user not found');
      return;
    }

    console.log('✅ Super admin user found:', {
      userId: superAdminUser.id,
      email: superAdminUser.Account.email,
      firstName: superAdminUser.firstName,
      lastName: superAdminUser.lastName
    });

    // Extract all permissions
    const allPermissions = new Set<string>();
    
    superAdminUser.userRoles.forEach(userRole => {
      console.log('📝 Role:', userRole.role.name);
      userRole.role.permissions.forEach(rolePermission => {
        allPermissions.add(rolePermission.permission.name);
      });
    });

    const permissionsArray = Array.from(allPermissions).sort();
    
    console.log('🔑 User permissions:', {
      count: permissionsArray.length,
      permissions: permissionsArray
    });

    // Check specific saved search permissions
    const savedSearchPermissions = permissionsArray.filter(p => p.includes('saved_search'));
    console.log('💾 Saved search permissions:', {
      count: savedSearchPermissions.length,
      permissions: savedSearchPermissions
    });

    // Check for specific required permissions
    const requiredPermissions = [
      'saved_searches.create.own',
      'saved_searches.read.own',
      'saved_searches.read.global',
      'saved_searches.manage.global',
      'tenants.read',
      'tenants.create',
      'admin.manage'
    ];

    console.log('🎯 Required permission checks:');
    requiredPermissions.forEach(perm => {
      const hasPermission = permissionsArray.includes(perm);
      console.log(`  ${hasPermission ? '✅' : '❌'} ${perm}: ${hasPermission}`);
    });

    console.log('✅ Permission debugging completed');

  } catch (error) {
    console.error('❌ Error debugging permissions:', error);
  } finally {
    await db.$disconnect();
  }
}

debugUserPermissions(); 