#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function auditPermissionSystem() {
  try {
    console.log('🔍 COMPREHENSIVE PERMISSION SYSTEM AUDIT\n');
    console.log('================================================\n');

    // 1. Role Hierarchy Analysis
    console.log('📊 1. ROLE HIERARCHY AND STRUCTURE');
    console.log('==================================\n');
    
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        userRoles: {
          include: {
            user: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log('Total Roles:', roles.length);
    console.log('\nRole Hierarchy (by permission count):');
    
    const roleHierarchy = roles
      .map(role => ({
        name: role.name,
        code: role.code,
        permissionCount: role.rolePermissions.length,
        userCount: role.userRoles.length,
        description: role.description
      }))
      .sort((a, b) => b.permissionCount - a.permissionCount);

    roleHierarchy.forEach((role, index) => {
      console.log(`\n${index + 1}. ${role.name} (${role.code})`);
      console.log(`   Description: ${role.description || 'No description'}`);
      console.log(`   Permissions: ${role.permissionCount}`);
      console.log(`   Users: ${role.userCount}`);
    });

    // 2. Permission Matrix
    console.log('\n\n📋 2. PERMISSION MATRIX BY MODULE');
    console.log('==================================\n');

    const permissions = await prisma.permission.findMany({
      include: {
        rolePermissions: {
          include: {
            role: true
          }
        }
      },
      orderBy: [
        { module: 'asc' },
        { resource: 'asc' },
        { action: 'asc' }
      ]
    });

    // Group permissions by module
    const permissionsByModule = permissions.reduce((acc, perm) => {
      const module = perm.module || 'undefined';
      if (!acc[module]) acc[module] = [];
      acc[module].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>);

    Object.entries(permissionsByModule).forEach(([module, perms]) => {
      console.log(`\n${module.toUpperCase()} Module (${perms.length} permissions):`);
      console.log('----------------------------------------');
      
      perms.forEach(perm => {
        const roleNames = perm.rolePermissions.map(rp => rp.role.code).join(', ');
        console.log(`  ${perm.name}`);
        console.log(`    - Pattern: ${module}.${perm.resource}.${perm.action}`);
        console.log(`    - Scope: ${perm.scope || 'N/A'}`);
        console.log(`    - Roles: [${roleNames || 'None'}]`);
      });
    });

    // 3. NestJS Permission Implementation Check
    console.log('\n\n🏗️ 3. NESTJS IMPLEMENTATION PATTERNS');
    console.log('=====================================\n');

    // Check for consistent naming patterns
    const namingPatterns = {
      moduleResourceAction: 0,
      camelCase: 0,
      snakeCase: 0,
      other: 0
    };

    permissions.forEach(perm => {
      if (perm.name.match(/^[a-z]+\.[a-z]+\.[a-z]+$/)) {
        namingPatterns.moduleResourceAction++;
      } else if (perm.name.match(/^[a-z][a-zA-Z]*$/)) {
        namingPatterns.camelCase++;
      } else if (perm.name.match(/^[a-z]+_[a-z_]+$/)) {
        namingPatterns.snakeCase++;
      } else {
        namingPatterns.other++;
      }
    });

    console.log('Permission Naming Patterns:');
    Object.entries(namingPatterns).forEach(([pattern, count]) => {
      console.log(`  ${pattern}: ${count} (${((count / permissions.length) * 100).toFixed(1)}%)`);
    });

    // 4. API Endpoint Coverage
    console.log('\n\n🌐 4. API v2 ENDPOINT COVERAGE');
    console.log('==============================\n');

    // Analyze permission coverage by tier
    const tiers = ['platform', 'tenant', 'account', 'user', 'public'];
    const actions = ['read', 'create', 'update', 'delete', 'manage'];

    console.log('Permission Coverage Matrix:\n');
    console.log('Tier/Action  | ' + actions.map(a => a.padEnd(8)).join(' | '));
    console.log('-'.repeat(70));

    tiers.forEach(tier => {
      const row = [tier.padEnd(12)];
      actions.forEach(action => {
        const count = permissions.filter(p => 
          (p.module === tier || p.scope === tier) && 
          (p.action === action || p.name.includes(action))
        ).length;
        row.push(count.toString().padEnd(8));
      });
      console.log(row.join(' | '));
    });

    // 5. Security Analysis
    console.log('\n\n🔒 5. SECURITY ANALYSIS');
    console.log('=======================\n');

    // Check for wildcard permissions
    const wildcardPerms = permissions.filter(p => p.is_wildcard);
    console.log(`Wildcard Permissions: ${wildcardPerms.length}`);
    if (wildcardPerms.length > 0) {
      wildcardPerms.forEach(p => {
        console.log(`  - ${p.name} (${p.description || 'No description'})`);
      });
    }

    // Check for system permissions
    const systemPerms = permissions.filter(p => p.is_system);
    console.log(`\nSystem Permissions: ${systemPerms.length}`);

    // Check for orphaned permissions (no roles assigned)
    const orphanedPerms = permissions.filter(p => p.rolePermissions.length === 0);
    console.log(`\nOrphaned Permissions (no roles): ${orphanedPerms.length}`);
    if (orphanedPerms.length > 0) {
      console.log('  First 10 orphaned permissions:');
      orphanedPerms.slice(0, 10).forEach(p => {
        console.log(`  - ${p.name}`);
      });
    }

    // 6. Best Practices Compliance
    console.log('\n\n✅ 6. NESTJS BEST PRACTICES COMPLIANCE');
    console.log('======================================\n');

    const compliance = {
      consistentNaming: namingPatterns.moduleResourceAction / permissions.length > 0.9,
      roleHierarchy: roleHierarchy[0].code === 'super_admin',
      noOrphanedPerms: orphanedPerms.length === 0,
      properScopes: permissions.every(p => p.scope || p.module),
      systemPermsMarked: systemPerms.length > 0
    };

    Object.entries(compliance).forEach(([check, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${check}`);
    });

    // 7. Recommendations
    console.log('\n\n💡 7. RECOMMENDATIONS');
    console.log('====================\n');

    if (orphanedPerms.length > 0) {
      console.log('1. Assign orphaned permissions to appropriate roles or remove them');
    }
    
    if (namingPatterns.other > 0) {
      console.log('2. Standardize permission naming to module.resource.action pattern');
    }

    if (!compliance.consistentNaming) {
      console.log('3. Refactor permission names for consistency');
    }

    // 8. Sample NestJS Implementation
    console.log('\n\n📝 8. NESTJS IMPLEMENTATION EXAMPLE');
    console.log('===================================\n');

    console.log('Recommended Decorator Usage:');
    console.log(`
// Permission decorator
@RequirePermissions('platform.users.read')
@Get('users')
async getUsers() { ... }

// Role decorator
@RequireRoles('super_admin', 'tenant_admin')
@Post('users')
async createUser() { ... }

// Combined check
@RequirePermissions('tenant.users.manage')
@RequireRoles('tenant_admin')
@Put('users/:id')
async updateUser() { ... }
`);

    console.log('\n✅ Audit Complete!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditPermissionSystem();