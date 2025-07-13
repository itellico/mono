import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('🌱 Starting simple database seeding...');

    // 1. Create tenant
    console.log('📍 Creating tenant...');
    const tenant = await prisma.tenant.upsert({
      where: { domain: 'localhost' },
      update: {},
      create: {
        uuid: crypto.randomUUID(),
        name: 'itellico Mono Development',
        domain: 'localhost',
        slug: 'mono-dev',
        description: { en: 'Development tenant' },
        isActive: true,
        defaultCurrency: 'USD',
        features: {},
        settings: {},
        categories: {},
        allowedCountries: {}
      }
    });
    console.log(`✅ Tenant created: ${tenant.name} (ID: ${tenant.id})`);

    // 2. Create roles
    console.log('👑 Creating roles...');
    const superAdminRole = await prisma.role.upsert({
      where: { 
        name_tenantId: {
          name: 'super_admin',
          tenantId: tenant.id
        }
      },
      update: {},
      create: {
        uuid: crypto.randomUUID(),
        code: 'SUPER_ADMIN',
        name: 'super_admin',
        description: 'Full system access',
        tenantId: tenant.id,
        level: 100,
        isSystem: true
      }
    });

    const adminRole = await prisma.role.upsert({
      where: { 
        name_tenantId: {
          name: 'admin',
          tenantId: tenant.id
        }
      },
      update: {},
      create: {
        uuid: crypto.randomUUID(),
        code: 'ADMIN',
        name: 'admin',
        description: 'Admin access',
        tenantId: tenant.id,
        level: 90,
        isSystem: true
      }
    });

    const userRole = await prisma.role.upsert({
      where: { 
        name_tenantId: {
          name: 'user',
          tenantId: tenant.id
        }
      },
      update: {},
      create: {
        uuid: crypto.randomUUID(),
        code: 'USER',
        name: 'user',
        description: 'Basic user access',
        tenantId: tenant.id,
        level: 10,
        isSystem: true
      }
    });

    console.log(`✅ Created roles: super_admin, admin, user`);

    // 3. Create permissions
    console.log('🔐 Creating permissions...');
    const permissions = [
      'platform.manage',
      'tenant.manage',
      'user.create',
      'user.read',
      'user.update',
      'user.delete',
      'admin.access',
      'admin.users.manage',
      'admin.settings.manage'
    ];

    for (const permName of permissions) {
      await prisma.permission.upsert({
        where: {
          name_tenantId: {
            name: permName,
            tenantId: tenant.id
          }
        },
        update: {},
        create: {
          uuid: crypto.randomUUID(),
          name: permName,
          description: `Permission: ${permName}`,
          tenantId: tenant.id
        }
      });
    }
    console.log(`✅ Created ${permissions.length} permissions`);

    // 4. Assign permissions to super admin role
    console.log('🔗 Assigning permissions to roles...');
    const allPermissions = await prisma.permission.findMany({
      where: { tenantId: tenant.id }
    });

    // Assign all permissions to super admin
    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: permission.id
        }
      });
    }

    // Assign some permissions to admin
    const adminPermissions = allPermissions.filter(p => 
      p.name.includes('admin') || p.name.includes('user')
    );
    for (const permission of adminPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      });
    }

    console.log(`✅ Assigned permissions to roles`);

    // 5. Create account
    console.log('📧 Creating admin account...');
    const passwordHash = await bcrypt.hash('Admin123!', 12);
    
    const account = await prisma.account.upsert({
      where: { email: '1@1.com' },
      update: {},
      create: {
        uuid: crypto.randomUUID(),
        email: '1@1.com',
        passwordHash: passwordHash,
        tenantId: tenant.id,
        isActive: true,
        isVerified: true,
        emailVerified: true,
        accountType: 'personal'
      }
    });
    console.log(`✅ Account created: ${account.email}`);

    // 6. Create user
    console.log('👤 Creating admin user...');
    const user = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        uuid: crypto.randomUUID(),
        username: 'admin',
        firstName: 'Super',
        lastName: 'Admin',
        accountId: account.id,
        userHash: crypto.randomUUID(),
        isActive: true,
        isVerified: true
      }
    });
    console.log(`✅ User created: ${user.username}`);

    // 7. Assign role to user
    console.log('🎭 Assigning role to user...');
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: superAdminRole.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        roleId: superAdminRole.id,
        assignedAt: new Date()
      }
    });
    console.log(`✅ Assigned super_admin role to user`);

    // 8. Create some sample data
    console.log('📊 Creating sample data...');
    
    // Create sample categories
    const categories = ['Photography', 'Fashion', 'Music', 'Art'];
    for (const catName of categories) {
      await prisma.category.upsert({
        where: {
          name_tenantId: {
            name: catName,
            tenantId: tenant.id
          }
        },
        update: {},
        create: {
          uuid: crypto.randomUUID(),
          name: catName,
          description: `${catName} category`,
          tenantId: tenant.id,
          isActive: true
        }
      });
    }

    // Create sample tags
    const tags = ['professional', 'beginner', 'creative', 'technical'];
    for (const tagName of tags) {
      await prisma.tag.upsert({
        where: {
          tenantId_slug: {
            tenantId: tenant.id,
            slug: tagName.toLowerCase()
          }
        },
        update: {},
        create: {
          uuid: crypto.randomUUID(),
          name: tagName,
          slug: tagName.toLowerCase(),
          description: `${tagName} tag`,
          tenantId: tenant.id,
          createdBy: user.id,
          usageCount: 0,
          isSystem: true
        }
      });
    }

    console.log(`✅ Created sample categories and tags`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('📋 Summary:');
    console.log(`   - Tenant: ${tenant.name}`);
    console.log(`   - Account: ${account.email}`);
    console.log(`   - User: ${user.username} (${user.firstName} ${user.lastName})`);
    console.log(`   - Role: ${superAdminRole.name}`);
    console.log(`   - Permissions: ${allPermissions.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Tags: ${tags.length}`);
    console.log('\n🔐 Login credentials:');
    console.log(`   Email: 1@1.com`);
    console.log(`   Password: Admin123!`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();