#!/usr/bin/env node

/**
 * 🔑 Add Saved Searches Permissions Script
 * 
 * Adds comprehensive permissions for saved searches functionality
 * and assigns them to appropriate user roles.
 * 
 * Usage: npx tsx scripts/add-saved-searches-permissions.ts
 */

import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

// Define the saved search permissions to create
const SAVED_SEARCH_PERMISSIONS = [
  {
    name: 'saved_searches.create.own',
    description: 'Create own saved searches'
  },
  {
    name: 'saved_searches.read.own',
    description: 'Read own saved searches'
  },
  {
    name: 'saved_searches.update.own',
    description: 'Update own saved searches'
  },
  {
    name: 'saved_searches.delete.own',
    description: 'Delete own saved searches'
  },
  {
    name: 'saved_searches.read.global',
    description: 'Read all saved searches across tenants'
  },
  {
    name: 'saved_searches.manage.global',
    description: 'Manage all saved searches globally'
  },
  {
    name: 'saved_searches.bulk_delete.global',
    description: 'Bulk delete saved searches globally'
  }
];

// Define role permissions mapping
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

/**
 * Create or update saved searches permissions
 */
async function createSavedSearchPermissions() {
  console.log('🔑 Creating saved search permissions...\n');
  
  let createdCount = 0;
  let skippedCount = 0;
  
  for (const permissionData of SAVED_SEARCH_PERMISSIONS) {
    try {
      const existingPermission = await prisma.permission.findUnique({
        where: { name: permissionData.name }
      });
      
      if (existingPermission) {
        console.log(`   ⏭️  Permission already exists: ${permissionData.name}`);
        skippedCount++;
        continue;
      }
      
      await prisma.permission.create({
        data: {
          name: permissionData.name,
          description: permissionData.description
        }
      });
      
      console.log(`   ✅ Created permission: ${permissionData.name}`);
      createdCount++;
    } catch (error) {
      console.error(`   ❌ Failed to create permission ${permissionData.name}:`, error);
    }
  }
  
  console.log(`\n📋 Permission Creation Summary:`);
  console.log(`   ✅ Permissions created: ${createdCount}`);
  console.log(`   ⏭️  Permissions skipped: ${skippedCount}`);
  
  return createdCount > 0 || skippedCount > 0;
}

/**
 * Assign permissions to roles
 */
async function assignSavedSearchPermissions() {
  console.log('\n🔑 Assigning saved search permissions to roles...\n');
  
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
  
  console.log(`\n📋 Assignment Summary:`);
  console.log(`   ✅ Permissions assigned: ${assignedCount}`);
  console.log(`   ⚠️  Roles skipped: ${skippedCount}`);
  
  await prisma.$disconnect();
}

/**
 * Main function
 */
async function main() {
  try {
    const permissionsReady = await createSavedSearchPermissions();
    
    if (permissionsReady) {
      await assignSavedSearchPermissions();
      console.log('\n🎉 Saved search permissions setup completed!');
    } else {
      console.log('\n❌ Failed to create permissions, skipping assignment');
    }
  } catch (error) {
    console.error('❌ Error setting up saved search permissions:', error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 