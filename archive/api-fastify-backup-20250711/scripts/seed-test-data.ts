import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test database...');

  try {
    // 1. Create default tenant
    const tenant = await prisma.tenant.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        uuid: crypto.randomUUID(),
        name: 'Test Tenant',
        domain: 'test.localhost',
        slug: 'test-tenant',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('✅ Created test tenant');

    // 2. Create default roles
    const roles = [
      { id: 1, code: 'super_admin', name: 'Super Admin', level: 100, isSystem: true },
      { id: 2, code: 'admin', name: 'Admin', level: 90, isSystem: true },
      { id: 3, code: 'user', name: 'User', level: 10, isSystem: true }
    ];

    for (const role of roles) {
      await prisma.role.upsert({
        where: { id: role.id },
        update: {},
        create: {
          ...role,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    console.log('✅ Created roles');

    // 3. Create test users with accounts
    const hashedPassword = await bcrypt.hash('Test123!', 10);
    const hashedAdminPassword = await bcrypt.hash('Admin123!', 10);
    const testUsers = [
      {
        email: 'superadmin@test.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        username: 'superadmin',
        roleId: 1
      },
      {
        email: 'admin@test.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        username: 'adminuser',
        roleId: 2
      },
      {
        email: '1@1.com',
        password: hashedAdminPassword,
        firstName: 'Admin',
        lastName: 'One',
        username: 'admin1',
        roleId: 2  // Admin role
      },
      {
        email: 'user1@test.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser1',
        roleId: 3
      }
    ];

    for (const testUser of testUsers) {
      // Create account first
      const account = await prisma.account.upsert({
        where: { email: testUser.email },
        update: {},
        create: {
          email: testUser.email,
          emailVerified: true,
          passwordHash: testUser.password,
          tenantId: tenant.id,
          isActive: true,
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Check if user already exists
      let user = await prisma.user.findFirst({
        where: { accountId: account.id }
      });

      if (!user) {
        // Create user
        user = await prisma.user.create({
          data: {
            accountId: account.id,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            username: testUser.username,
            uuid: crypto.randomUUID(),
            userHash: crypto.randomUUID(),
            isActive: true,
            isVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }

      // Check if role already assigned
      const existingRole = await prisma.userRole.findFirst({
        where: {
          userId: user.id,
          roleId: testUser.roleId
        }
      });

      if (!existingRole) {
        // Assign role
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: testUser.roleId
          }
        });
      }

      console.log(`✅ Created user: ${testUser.email} with role ${testUser.roleId}`);
    }

    // 4. Create basic permissions
    const permissions = [
      { name: 'admin.access', description: 'Access admin panel' },
      { name: 'users.read', description: 'Read users' },
      { name: 'users.write', description: 'Write users' },
      { name: 'users.delete', description: 'Delete users' }
    ];

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: {
          ...permission,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    console.log('✅ Created permissions');

    // 5. Assign permissions to roles
    // First get all permissions with their IDs
    const allPermissions = await prisma.permission.findMany();
    const permissionMap = Object.fromEntries(
      allPermissions.map(p => [p.name, p.id])
    );

    // Super admin gets all permissions
    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: 1,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: 1,
          permissionId: permission.id
        }
      });
    }

    // Admin gets admin access and read permissions
    const adminPermissions = ['admin.access', 'users.read'];
    for (const permName of adminPermissions) {
      const permId = permissionMap[permName];
      if (permId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: 2,
              permissionId: permId
            }
          },
          update: {},
          create: {
            roleId: 2,
            permissionId: permId
          }
        });
      }
    }

    console.log('✅ Assigned permissions to roles');

    console.log('🎉 Test data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });