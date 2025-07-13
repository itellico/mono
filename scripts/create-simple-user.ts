import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Creating test user...');
    
    // First, create a tenant
    const tenant = await prisma.tenant.upsert({
      where: { slug: 'mono' },
      update: {},
      create: {
        name: 'Mono Platform',
        slug: 'mono',
        isActive: true,
      }
    });
    console.log('✅ Tenant created/found:', tenant.name);
    
    // Create an account
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const account = await prisma.account.create({
      data: {
        email: '1@1.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        accountType: 'individual',
        tenantId: tenant.id,
        isActive: true,
      }
    });
    console.log('✅ Account created:', account.email);
    
    // Create a user
    const user = await prisma.user.create({
      data: {
        accountId: account.id,
        tenantId: tenant.id,
        isActive: true,
        primaryContact: account.email,
      }
    });
    console.log('✅ User created with ID:', user.id);
    
    // Create role
    const role = await prisma.role.create({
      data: {
        code: 'admin',
        name: 'Admin',
        description: 'Administrator role',
        tenantId: tenant.id,
      }
    });
    console.log('✅ Admin role created');
    
    // Assign role to user
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        grantedAt: new Date(),
      }
    });
    console.log('✅ Role assigned to user');
    
    console.log('\n✅ Test user created successfully!');
    console.log('Email: 1@1.com');
    console.log('Password: Admin123!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();