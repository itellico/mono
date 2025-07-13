#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating test user...');

  // Check if tenant exists
  let tenant = await prisma.tenant.findFirst({
    where: { domain: 'test.itellico.com' }
  });

  if (!tenant) {
    console.log('Creating test tenant...');
    tenant = await prisma.tenant.create({
      data: {
        uuid: crypto.randomUUID(),
        name: 'Test Tenant',
        domain: 'test.itellico.com',
        slug: 'test-tenant',
        isActive: true
      }
    });
  }

  // Check if account exists
  const existingAccount = await prisma.account.findUnique({
    where: { email: 'test@example.com' }
  });

  if (existingAccount) {
    console.log('Test account already exists');
    
    // Update password
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: { passwordHash: hashedPassword }
    });
    
    console.log('Password updated for test@example.com');
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { accountId: existingAccount.id }
    });
    
    if (!existingUser) {
      console.log('Creating user for existing account...');
      const user = await prisma.user.create({
        data: {
          uuid: crypto.randomUUID(),
          accountId: existingAccount.id,
          firstName: 'Test',
          lastName: 'User',
          username: 'testuser_' + Date.now(), // Unique username
          userHash: crypto.randomUUID(),
          isActive: true
        }
      });
      
      // Create or find role
      let role = await prisma.role.findFirst({
        where: { name: 'admin', tenantId: existingAccount.tenantId }
      });
      
      if (!role) {
        role = await prisma.role.create({
          data: {
            name: 'admin',
            tenantId: existingAccount.tenantId,
            permissions: ['*'],
            updatedAt: new Date()
          }
        });
      }
      
      // Assign role
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id
        }
      });
      
      console.log('User created successfully!');
    } else {
      console.log('User already exists');
    }
  } else {
    // Create new account
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    
    const account = await prisma.account.create({
      data: {
        tenantId: tenant.id,
        email: 'test@example.com',
        passwordHash: hashedPassword,
        emailVerified: true,
        isActive: true,
        isVerified: true
      }
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        uuid: crypto.randomUUID(),
        accountId: account.id,
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        userHash: crypto.randomUUID(),
        isActive: true
      }
    });

    // Create role
    const role = await prisma.role.create({
      data: {
        name: 'admin',
        tenantId: tenant.id,
        permissions: ['*'],
        updatedAt: new Date()
      }
    });

    // Assign role
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id
      }
    });

    console.log('Test user created successfully!');
  }

  console.log('\nCredentials:');
  console.log('Email: test@example.com');
  console.log('Password: testpassword123');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });