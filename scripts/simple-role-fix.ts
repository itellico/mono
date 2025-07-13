#!/usr/bin/env node

/**
 * 🔧 SIMPLE ROLE STANDARDIZATION SCRIPT
 * 
 * This script fixes role name inconsistencies to match the fixed role constants.
 * It's simpler and more focused than the comprehensive migration script.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fixed role mappings
const ROLE_FIXES = {
  'Super Admin': 'super_admin',
  'Tenant Admin': 'tenant_admin', 
  'Content Moderator': 'content_moderator',
  'User Manager': 'user_manager',
  'Analytics Viewer': 'analytics_viewer',
  'User': 'user'
};

async function main() {
  console.log('🔧 Starting Role Standardization...\n');

  try {
    // Check current roles
    console.log('📋 Current roles in database:');
    const currentRoles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true
      }
    });

    for (const role of currentRoles) {
      console.log(`   - ${role.name} (ID: ${role.id})`);
    }

    console.log('\n🔧 Fixing role names...');

    let fixCount = 0;

    for (const role of currentRoles) {
      const fixedName = ROLE_FIXES[role.name as keyof typeof ROLE_FIXES];
      
      if (fixedName && fixedName !== role.name) {
        console.log(`   📝 Fixing: "${role.name}" → "${fixedName}"`);
        
        // Check if correct role already exists
        const existingRole = await prisma.role.findUnique({
          where: { name: fixedName }
        });

        if (existingRole) {
          console.log(`   ⚠️  Target role "${fixedName}" already exists. Manual intervention needed.`);
          continue;
        }

        // Update the role name
        await prisma.role.update({
          where: { id: role.id },
          data: { name: fixedName }
        });

        fixCount++;
        console.log(`   ✅ Updated role to "${fixedName}"`);
      }
    }

    // Verify results
    console.log('\n📋 Updated roles in database:');
    const updatedRoles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true
      }
    });

    for (const role of updatedRoles) {
      const isValid = Object.values(ROLE_FIXES).includes(role.name);
      console.log(`   ${isValid ? '✅' : '❌'} ${role.name} (ID: ${role.id})`);
    }

    console.log(`\n🎉 Role standardization completed! Fixed ${fixCount} roles.`);

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