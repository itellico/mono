#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating superadmin user...');

  // Check if platform tenant exists
  let platformTenant = await prisma.tenant.findFirst({
    where: { domain: 'platform.itellico.com' }
  });

  if (!platformTenant) {
    console.log('Creating platform tenant...');
    platformTenant = await prisma.tenant.create({
      data: {
        uuid: crypto.randomUUID(),
        name: 'Platform Administration',
        domain: 'platform.itellico.com',
        slug: 'platform',
        isActive: true
      }
    });
  }

  // Create superadmin account
  const email = 'admin@itellico.com';
  const password = 'Admin123!@#'; // Strong default password
  
  // Check if account exists
  const existingAccount = await prisma.account.findUnique({
    where: { email }
  });

  if (existingAccount) {
    console.log('Superadmin account already exists, updating password...');
    
    // Update password
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: { 
        passwordHash: hashedPassword,
        isActive: true,
        emailVerified: true,
        isVerified: true
      }
    });
    
    // Ensure user exists
    let user = await prisma.user.findFirst({
      where: { accountId: existingAccount.id }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          uuid: crypto.randomUUID(),
          accountId: existingAccount.id,
          firstName: 'Super',
          lastName: 'Admin',
          username: 'superadmin',
          userHash: crypto.randomUUID(),
          isActive: true
        }
      });
    }
    
    // Ensure platform admin role
    let platformRole = await prisma.role.findFirst({
      where: { 
        name: 'Platform Administrator',
        tenantId: platformTenant.id 
      }
    });
    
    if (!platformRole) {
      platformRole = await prisma.role.create({
        data: {
          name: 'Platform Administrator',
          tenantId: platformTenant.id,
          code: 'platform_admin',
          level: 100,
          isSystem: true,
          updatedAt: new Date()
        }
      });
    }
    
    // Check if role is assigned
    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: platformRole.id
      }
    });
    
    if (!existingUserRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: platformRole.id
        }
      });
    }
    
    console.log('Superadmin updated successfully!');
  } else {
    // Create new superadmin
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const account = await prisma.account.create({
      data: {
        tenantId: platformTenant.id,
        email,
        passwordHash: hashedPassword,
        emailVerified: true,
        isActive: true,
        isVerified: true,
        accountType: 'platform'
      }
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        uuid: crypto.randomUUID(),
        accountId: account.id,
        firstName: 'Super',
        lastName: 'Admin',
        username: 'superadmin',
        userHash: crypto.randomUUID(),
        isActive: true
      }
    });

    // Create platform admin role
    const platformRole = await prisma.role.create({
      data: {
        name: 'Platform Administrator',
        tenantId: platformTenant.id,
        code: 'platform_admin',
        level: 100,
        isSystem: true,
        updatedAt: new Date()
      }
    });

    // Assign role
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: platformRole.id
      }
    });

    console.log('Superadmin created successfully!');
  }

  console.log('\n🔐 SUPERADMIN CREDENTIALS:');
  console.log('========================');
  console.log('Email: admin@itellico.com');
  console.log('Password: Admin123!@#');
  console.log('========================');
  console.log('\n⚠️  IMPORTANT: Change this password after first login!');
  
  // Also create a regular admin for testing
  console.log('\nCreating regular admin user...');
  
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123456';
  
  const adminAccount = await prisma.account.findUnique({
    where: { email: adminEmail }
  });
  
  if (!adminAccount) {
    // Find or create a test tenant
    let testTenant = await prisma.tenant.findFirst({
      where: { domain: 'test.itellico.com' }
    });
    
    if (!testTenant) {
      testTenant = await prisma.tenant.create({
        data: {
          uuid: crypto.randomUUID(),
          name: 'Test Tenant',
          domain: 'test.itellico.com',
          slug: 'test',
          isActive: true
        }
      });
    }
    
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    
    const newAdminAccount = await prisma.account.create({
      data: {
        tenantId: testTenant.id,
        email: adminEmail,
        passwordHash: hashedAdminPassword,
        emailVerified: true,
        isActive: true,
        isVerified: true
      }
    });
    
    const adminUser = await prisma.user.create({
      data: {
        uuid: crypto.randomUUID(),
        accountId: newAdminAccount.id,
        firstName: 'Admin',
        lastName: 'User',
        username: 'admin_' + Date.now(),
        userHash: crypto.randomUUID(),
        isActive: true
      }
    });
    
    // Create tenant admin role
    let tenantAdminRole = await prisma.role.findFirst({
      where: { 
        name: 'Tenant Administrator',
        tenantId: testTenant.id 
      }
    });
    
    if (!tenantAdminRole) {
      tenantAdminRole = await prisma.role.create({
        data: {
          name: 'Tenant Administrator',
          tenantId: testTenant.id,
          code: 'tenant_admin',
          level: 80,
          isSystem: true,
          updatedAt: new Date()
        }
      });
    }
    
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: tenantAdminRole.id
      }
    });
    
    console.log('\n📋 REGULAR ADMIN CREDENTIALS:');
    console.log('============================');
    console.log('Email: admin@example.com');
    console.log('Password: admin123456');
    console.log('============================');
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });