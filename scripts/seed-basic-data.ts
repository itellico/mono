import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedBasicData() {
  try {
    console.log('Creating default tenant...');
    const tenant = await prisma.tenant.create({
      data: {
        uuid: '00000000-0000-0000-0000-000000000001',
        name: 'Default Tenant',
        slug: 'default',
        domain: 'localhost',
        isActive: true
      }
    });
    console.log('✓ Tenant created');

    console.log('Creating super admin role...');
    const superAdminRole = await prisma.role.create({
      data: {
        uuid: '00000000-0000-0000-0000-000000000002',
        name: 'super_admin',
        code: 'super_admin',
        description: 'Full system access',
        issystem: true,
        level: 100
      }
    });
    console.log('✓ Super admin role created');

    console.log('Creating test account...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    const account = await prisma.account.create({
      data: {
        uuid: '00000000-0000-0000-0000-000000000003',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        tenantId: tenant.id,
        emailVerified: true,
        isActive: true,
        isVerified: true
      }
    });
    console.log('✓ Account created');

    console.log('Creating test user...');
    const user = await prisma.user.create({
      data: {
        uuid: '00000000-0000-0000-0000-000000000004',
        accountId: account.id,
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        userHash: bcrypt.hashSync('testuser-' + Date.now(), 10),
        isActive: true,
        isVerified: true
      }
    });
    console.log('✓ User created');

    console.log('Assigning role to user...');
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: superAdminRole.id,
        grantedBy: user.id,
        grantReason: 'Initial setup'
      }
    });
    console.log('✓ Role assigned');

    console.log('\n✅ Basic data seeded successfully!');
    console.log('\nYou can now login with:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBasicData();