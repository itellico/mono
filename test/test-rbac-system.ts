import { PrismaClient } from '@prisma/client';
import { OptimizedPermissionResolver } from './src/lib/permissions/optimized-permission-resolver';

const prisma = new PrismaClient();

async function testRBACSystem() {
  console.log('🧪 Testing Optimized RBAC System...\n');

  try {
    // Create a test user with super admin role
    console.log('1. Creating test user...');
    
    // First create or find a tenant
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant',
          domain: 'test.mono.local',
          slug: 'test'
        }
      });
    }

    // Create or find an account
    let account = await prisma.account.findFirst({
      where: { tenantId: tenant.id }
    });
    if (!account) {
      account = await prisma.account.create({
        data: {
          tenantId: tenant.id,
          email: 'test@example.com',
          accountType: 'personal'
        }
      });
    }

    // Create or find a test user
    let user = await prisma.user.findFirst({
      where: { accountId: account.id }
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          accountId: account.id,
          firstName: 'Test',
          lastName: 'User',
          username: 'testuser',
          userHash: 'testhash123'
        }
      });
    }

    // Find the super admin role
    const superAdminRole = await prisma.role.findFirst({
      where: { code: 'super_admin' }
    });

    if (superAdminRole) {
      // Assign super admin role to user
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: superAdminRole.id
          }
        },
        create: {
          userId: user.id,
          roleId: superAdminRole.id
        },
        update: {}
      });
      console.log('✅ Test user created and assigned Super Admin role');
    }

    // 2. Test permission resolution
    console.log('\n2. Testing permission resolution...');
    
    const resolver = OptimizedPermissionResolver.getInstance();
    
    const testContext = {
      userId: user.id,
      tenantId: tenant.id,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Runner',
      requestId: 'test-123'
    };

    // Test cases
    const testCases = [
      { permission: 'platform.*.global', expected: true, description: 'Super admin should have platform access' },
      { permission: 'tenants.*.global', expected: true, description: 'Super admin should have tenant management' },
      { permission: 'profiles.read.own', expected: true, description: 'Should inherit specific permissions from wildcards' },
      { permission: 'content.read.tenant', expected: true, description: 'Should inherit content permissions' },
      { permission: 'invalid.permission.test', expected: false, description: 'Should deny invalid permissions' }
    ];

    console.log('Running permission tests...');
    for (const testCase of testCases) {
      const startTime = Date.now();
      const result = await resolver.hasPermission(testContext, testCase.permission);
      const duration = Date.now() - startTime;
      
      const status = result.granted === testCase.expected ? '✅' : '❌';
      console.log(`${status} ${testCase.permission} - ${result.granted} (${duration}ms) - ${testCase.description}`);
      
      if (result.source) {
        console.log(`   Source: ${result.source}, Pattern: ${result.matchedPattern || 'N/A'}`);
      }
    }

    // 3. Test caching
    console.log('\n3. Testing caching performance...');
    
    const cacheTestPermission = 'platform.*.global';
    const iterations = 5;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await resolver.hasPermission(testContext, cacheTestPermission);
      times.push(Date.now() - startTime);
    }

    console.log(`Cache performance test (${iterations} iterations):`);
    console.log(`Times: ${times.join('ms, ')}ms`);
    console.log(`Average: ${(times.reduce((a, b) => a + b) / times.length).toFixed(2)}ms`);

    // 4. Test permission inheritance
    console.log('\n4. Testing permission inheritance...');
    
    const inheritanceTest = await prisma.permissionInheritance.findMany({
      include: {
        parent: true,
        child: true
      },
      take: 3
    });

    console.log('Inheritance rules found:');
    inheritanceTest.forEach(rule => {
      console.log(`  ${rule.parent.pattern} → ${rule.child.pattern}`);
    });

    // 5. Test permission sets
    console.log('\n5. Testing permission sets...');
    
    const permissionSets = await prisma.permissionSet.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      },
      take: 3
    });

    console.log('Permission sets found:');
    permissionSets.forEach(set => {
      console.log(`  ${set.name}: ${set.permissions.length} permissions`);
    });

    // 6. Check audit logs
    console.log('\n6. Checking audit logs...');
    
    const auditCount = await prisma.permissionAudit.count({
      where: { userId: user.id }
    });
    
    console.log(`Audit logs created: ${auditCount}`);

    // 7. Database statistics
    console.log('\n7. Database statistics...');
    
    const stats = await Promise.all([
      prisma.permission.count(),
      prisma.permission.count({ where: { isWildcard: true } }),
      prisma.role.count(),
      prisma.rolePermission.count(),
      prisma.permissionSet.count()
    ]);

    console.log(`Total permissions: ${stats[0]}`);
    console.log(`Wildcard permissions: ${stats[1]}`);
    console.log(`Roles: ${stats[2]}`);
    console.log(`Role-permission assignments: ${stats[3]}`);
    console.log(`Permission sets: ${stats[4]}`);

    console.log('\n🎉 RBAC System Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRBACSystem();