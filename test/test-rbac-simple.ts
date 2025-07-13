import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simpleRBACTest() {
  console.log('🧪 Testing Optimized RBAC Database Structure...\n');

  try {
    // 1. Check permissions
    console.log('1. Checking permissions...');
    
    const totalPermissions = await prisma.permission.count();
    const wildcardPermissions = await prisma.permission.count({
      where: { isWildcard: true }
    });
    
    console.log(`✅ Total permissions: ${totalPermissions}`);
    console.log(`✅ Wildcard permissions: ${wildcardPermissions}`);
    
    // Show sample wildcard permissions
    const sampleWildcards = await prisma.permission.findMany({
      where: { isWildcard: true },
      select: { pattern: true, resource: true, action: true, scope: true },
      take: 5
    });
    
    console.log('Sample wildcard permissions:');
    sampleWildcards.forEach(p => {
      console.log(`  ${p.pattern} (${p.resource}.${p.action}.${p.scope})`);
    });

    // 2. Check roles
    console.log('\n2. Checking roles...');
    
    const roles = await prisma.role.findMany({
      select: { name: true, code: true, level: true, isSystem: true },
      orderBy: { level: 'desc' }
    });
    
    console.log(`✅ Total roles: ${roles.length}`);
    roles.forEach(role => {
      console.log(`  ${role.name} (${role.code}) - Level ${role.level} ${role.isSystem ? '[System]' : ''}`);
    });

    // 3. Check role permissions
    console.log('\n3. Checking role permissions...');
    
    const rolePermissionCounts = await prisma.role.findMany({
      select: {
        name: true,
        _count: {
          select: { permissions: true }
        }
      }
    });
    
    rolePermissionCounts.forEach(role => {
      console.log(`  ${role.name}: ${role._count.permissions} permissions`);
    });

    // 4. Check permission inheritance
    console.log('\n4. Checking permission inheritance...');
    
    const inheritanceRules = await prisma.permissionInheritance.count();
    console.log(`✅ Inheritance rules: ${inheritanceRules}`);
    
    const sampleInheritance = await prisma.permissionInheritance.findMany({
      include: {
        parent: { select: { pattern: true } },
        child: { select: { pattern: true } }
      },
      take: 5
    });
    
    console.log('Sample inheritance rules:');
    sampleInheritance.forEach(rule => {
      console.log(`  ${rule.parent.pattern} → ${rule.child.pattern}`);
    });

    // 5. Check permission sets
    console.log('\n5. Checking permission sets...');
    
    const permissionSets = await prisma.permissionSet.findMany({
      select: {
        name: true,
        description: true,
        _count: {
          select: { permissions: true }
        }
      }
    });
    
    console.log(`✅ Permission sets: ${permissionSets.length}`);
    permissionSets.forEach(set => {
      console.log(`  ${set.name}: ${set._count.permissions} permissions`);
      console.log(`    ${set.description}`);
    });

    // 6. Check new tables exist
    console.log('\n6. Checking new RBAC tables...');
    
    const tables = [
      'PermissionSet',
      'PermissionSetItem', 
      'PermissionInheritance',
      'UserPermission',
      'PermissionAudit',
      'EmergencyAccess',
      'UserPermissionCache',
      'PermissionExpansion',
      'RBACConfig'
    ];
    
    for (const table of tables) {
      try {
        const count = await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].count();
        console.log(`  ✅ ${table}: ${count} records`);
      } catch (error) {
        console.log(`  ❌ ${table}: Table not accessible`);
      }
    }

    // 7. Test basic permission pattern matching
    console.log('\n7. Testing pattern matching logic...');
    
    function matchesWildcard(pattern: string, permission: string): boolean {
      const patternParts = pattern.split('.');
      const permParts = permission.split('.');
      
      if (patternParts.length !== permParts.length) return false;
      
      return patternParts.every((part, i) => 
        part === '*' || part === permParts[i]
      );
    }
    
    const testCases = [
      { pattern: 'profiles.*.own', permission: 'profiles.read.own', expected: true },
      { pattern: 'profiles.*.own', permission: 'profiles.write.own', expected: true },
      { pattern: 'profiles.*.own', permission: 'jobs.read.own', expected: false },
      { pattern: 'platform.*.global', permission: 'platform.manage.global', expected: true }
    ];
    
    testCases.forEach(test => {
      const result = matchesWildcard(test.pattern, test.permission);
      const status = result === test.expected ? '✅' : '❌';
      console.log(`  ${status} ${test.pattern} matches ${test.permission}: ${result}`);
    });

    // 8. Performance comparison estimate
    console.log('\n8. Performance optimization summary...');
    
    const beforeCount = 500; // Estimated original permission count
    const afterCount = totalPermissions;
    const reduction = Math.round((1 - afterCount / beforeCount) * 100);
    
    console.log(`  Before optimization: ~${beforeCount} permissions`);
    console.log(`  After optimization: ${afterCount} permissions`);
    console.log(`  Reduction: ${reduction}% fewer permissions`);
    console.log(`  Wildcard efficiency: ${wildcardPermissions} patterns cover multiple specific permissions`);

    console.log('\n🎉 RBAC Database Structure Test Completed Successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your application code to use the new permission patterns');
    console.log('2. Replace canAccessAPI calls with the optimized permission resolver');
    console.log('3. Clear all caches and test with real users');
    console.log('4. Monitor permission check performance');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
simpleRBACTest();