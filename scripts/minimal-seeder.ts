import { PrismaClient } from '@prisma/client';
import { logger } from '../src/lib/logger';

const db = new PrismaClient();

async function minimalSeeder() {
  try {
    logger.info('🌱 Starting minimal seeder for saved searches testing...');

    // Create basic tenant
    const tenant = await db.tenant.create({
      data: {
        name: 'Mono Demo',
        domain: 'mono-demo.local',
        slug: 'mono-demo',
        isActive: true,
      },
    });

    // Create basic account
    const account = await db.account.create({
      data: {
        tenantId: tenant.id,
        email: '1@1.com',
        emailVerified: true,
        passwordHash: '$2b$10$K8BsCi0QhjZBHhqM.R0ZjOw8P5O3gQhS8DKjLCZy0JLXGqzN3qF1a', // password: 123
        isActive: true,
        isVerified: true,
      },
    });

    // Create basic user
    const user = await db.user.create({
      data: {
        accountId: account.id,
        firstName: 'Admin',
        lastName: 'User',
        username: 'admin',
        userHash: 'admin-hash',
        isActive: true,
        isVerified: true,
      },
    });

    // Create super admin role
    const superAdminRole = await db.role.create({
      data: {
        name: 'Super Admin',
        code: 'super_admin',
        level: 1000,
        description: 'System administrator with full access',
        issystem: true,
        tenantid: tenant.id,
      },
    });

    // Assign role to user
    await db.userRole.create({
      data: {
        userId: user.id,
        roleId: superAdminRole.id,
        grantedBy: user.id,
        grantReason: 'Initial admin setup',
      },
    });

    // Create basic categories
    const categories = [
      { name: 'Technology', slug: 'technology', description: 'Technology related content' },
      { name: 'Business', slug: 'business', description: 'Business related content' },
      { name: 'Art & Design', slug: 'art-design', description: 'Creative content' },
    ];

    for (const categoryData of categories) {
      await db.category.create({
        data: categoryData,
      });
    }

    // Create basic tags
    const tags = [
      { name: 'Featured', slug: 'featured', description: 'Featured content' },
      { name: 'Popular', slug: 'popular', description: 'Popular content' },
      { name: 'New', slug: 'new', description: 'New content' },
    ];

    for (const tagData of tags) {
      await db.tag.create({
        data: tagData,
      });
    }

    logger.info('✅ Minimal seeder completed successfully!');
    logger.info(`📧 Login with: 1@1.com / 123`);
    logger.info(`🏢 Tenant: ${tenant.name} (ID: ${tenant.id})`);
    logger.info(`👤 User: ${user.firstName} ${user.lastName} (ID: ${user.id})`);

  } catch (error) {
    logger.error('❌ Minimal seeder failed:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

minimalSeeder();