#!/usr/bin/env tsx
/**
 * Test Data Seeder
 * Creates consistent test data for automated testing
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Redis } from 'ioredis';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:testpass123@localhost:5433/mono_test'
    }
  }
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6380');

async function clearDatabase() {
  console.log('🧹 Clearing existing test data...');
  
  // Clear in correct order due to foreign keys
  await prisma.$transaction([
    prisma.audit_logs.deleteMany(),
    prisma.user_permissions.deleteMany(),
    prisma.permission_role.deleteMany(),
    prisma.user_role.deleteMany(),
    prisma.user_tenants.deleteMany(),
    prisma.user.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.role.deleteMany(),
    prisma.tenant.deleteMany(),
  ]);
  
  // Clear Redis
  await redis.flushdb();
  
  console.log('✅ Database cleared');
}

async function seedTestData() {
  console.log('🌱 Seeding test data...');
  
  // 1. Create test tenants
  const tenants = await prisma.$transaction([
    prisma.tenant.create({
      data: {
        uuid: 'tenant-test-default',
        name: 'Test Default Tenant',
        code: 'TEST-DEFAULT',
        isActive: true,
        isDefault: true,
        settings: {
          features: {
            api: true,
            uploads: true,
            notifications: true
          }
        }
      }
    }),
    prisma.tenant.create({
      data: {
        uuid: 'tenant-test-secondary',
        name: 'Test Secondary Tenant',
        code: 'TEST-SECONDARY',
        isActive: true,
        isDefault: false
      }
    }),
    prisma.tenant.create({
      data: {
        uuid: 'tenant-test-inactive',
        name: 'Test Inactive Tenant',
        code: 'TEST-INACTIVE',
        isActive: false,
        isDefault: false
      }
    })
  ]);
  
  console.log(`✅ Created ${tenants.length} test tenants`);
  
  // 2. Create roles
  const roles = await prisma.$transaction([
    prisma.role.create({
      data: {
        id: 1,
        name: 'super_admin',
        description: 'Super Administrator with full access',
        isSystem: true
      }
    }),
    prisma.role.create({
      data: {
        id: 2,
        name: 'admin',
        description: 'Administrator',
        isSystem: true
      }
    }),
    prisma.role.create({
      data: {
        id: 3,
        name: 'user',
        description: 'Regular User',
        isSystem: true
      }
    })
  ]);
  
  console.log(`✅ Created ${roles.length} roles`);
  
  // 3. Create permissions
  const permissions = [
    // Platform level
    { name: 'platform.users.read', description: 'View all platform users' },
    { name: 'platform.users.write', description: 'Manage platform users' },
    { name: 'platform.tenants.read', description: 'View all tenants' },
    { name: 'platform.tenants.write', description: 'Manage tenants' },
    { name: 'platform.audit.read', description: 'View platform audit logs' },
    
    // Tenant level
    { name: 'tenant.users.read', description: 'View tenant users' },
    { name: 'tenant.users.write', description: 'Manage tenant users' },
    { name: 'tenant.settings.read', description: 'View tenant settings' },
    { name: 'tenant.settings.write', description: 'Manage tenant settings' },
    
    // User level
    { name: 'user.profile.read', description: 'View own profile' },
    { name: 'user.profile.write', description: 'Edit own profile' },
    { name: 'user.settings.read', description: 'View own settings' },
    { name: 'user.settings.write', description: 'Edit own settings' },
  ];
  
  await prisma.permission.createMany({
    data: permissions
  });
  
  console.log(`✅ Created ${permissions.length} permissions`);
  
  // 4. Assign permissions to roles
  const allPermissions = await prisma.permission.findMany();
  
  // Super admin gets all permissions
  await prisma.permission_role.createMany({
    data: allPermissions.map(p => ({
      roleId: 1, // super_admin
      permissionId: p.id
    }))
  });
  
  // Admin gets tenant and user permissions
  const adminPermissions = allPermissions.filter(p => 
    p.name.startsWith('tenant.') || p.name.startsWith('user.')
  );
  await prisma.permission_role.createMany({
    data: adminPermissions.map(p => ({
      roleId: 2, // admin
      permissionId: p.id
    }))
  });
  
  // User gets only user permissions
  const userPermissions = allPermissions.filter(p => p.name.startsWith('user.'));
  await prisma.permission_role.createMany({
    data: userPermissions.map(p => ({
      roleId: 3, // user
      permissionId: p.id
    }))
  });
  
  console.log('✅ Assigned permissions to roles');
  
  // 5. Create test users
  const hashedPassword = await bcrypt.hash('Test123!', 10);
  const defaultTenant = tenants[0];
  
  const testUsers = [
    // Super Admin
    {
      email: 'superadmin@test.com',
      password: hashedPassword,
      name: 'Test Super Admin',
      uuid: 'user-test-superadmin',
      isActive: true,
      roleId: 1
    },
    // Admin
    {
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'Test Admin',
      uuid: 'user-test-admin',
      isActive: true,
      roleId: 2
    },
    // Regular Users
    {
      email: 'user1@test.com',
      password: hashedPassword,
      name: 'Test User 1',
      uuid: 'user-test-user1',
      isActive: true,
      roleId: 3
    },
    {
      email: 'user2@test.com',
      password: hashedPassword,
      name: 'Test User 2',
      uuid: 'user-test-user2',
      isActive: true,
      roleId: 3
    },
    // Inactive User
    {
      email: 'inactive@test.com',
      password: hashedPassword,
      name: 'Test Inactive User',
      uuid: 'user-test-inactive',
      isActive: false,
      roleId: 3
    },
    // User with weak password (for testing)
    {
      email: 'weakpass@test.com',
      password: await bcrypt.hash('weak', 10),
      name: 'Test Weak Password User',
      uuid: 'user-test-weakpass',
      isActive: true,
      roleId: 3
    }
  ];
  
  for (const userData of testUsers) {
    const { roleId, ...userInfo } = userData;
    
    await prisma.user.create({
      data: {
        ...userInfo,
        roles: {
          create: {
            roleId: roleId
          }
        },
        userTenants: {
          create: {
            tenantId: defaultTenant.uuid
          }
        }
      }
    });
  }
  
  console.log(`✅ Created ${testUsers.length} test users`);
  
  // 6. Create some audit logs for testing
  await prisma.audit_logs.createMany({
    data: [
      {
        userId: 'user-test-admin',
        tenantId: defaultTenant.uuid,
        action: 'user.login',
        entityType: 'user',
        entityId: 'user-test-admin',
        changes: { ip: '127.0.0.1' },
        context: { userAgent: 'Test Runner' },
        timestamp: new Date()
      },
      {
        userId: 'user-test-user1',
        tenantId: defaultTenant.uuid,
        action: 'user.profile.update',
        entityType: 'user',
        entityId: 'user-test-user1',
        changes: { name: { old: 'User 1', new: 'Test User 1' } },
        context: {},
        timestamp: new Date()
      }
    ]
  });
  
  console.log('✅ Created sample audit logs');
  
  // 7. Add some Redis test data
  await redis.set('test:key:1', 'test-value-1', 'EX', 3600);
  await redis.set('test:key:2', JSON.stringify({ test: 'data' }), 'EX', 3600);
  
  console.log('✅ Added Redis test data');
}

async function main() {
  try {
    await clearDatabase();
    await seedTestData();
    console.log('✅ Test data seeding completed successfully!');
    
    // Output test credentials
    console.log('\n📝 Test Credentials:');
    console.log('  Super Admin: superadmin@test.com / Test123!');
    console.log('  Admin: admin@test.com / Test123!');
    console.log('  User 1: user1@test.com / Test123!');
    console.log('  User 2: user2@test.com / Test123!');
    console.log('  Inactive: inactive@test.com / Test123!');
    console.log('  Weak Pass: weakpass@test.com / weak');
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await redis.quit();
  }
}

main();