#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testAuth() {
  console.log('Testing authentication for 1@1.com...');
  
  try {
    // Find user through account since email is in Account model
    const account = await prisma.account.findUnique({
      where: { email: '1@1.com' },
      include: {
        users: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    console.log('Account found:', !!account);
    if (!account) {
      console.log('❌ Account not found');
      return;
    }

    console.log('Account active:', account.is_active);
    console.log('Users count:', account.users.length);
    
    if (account.users.length === 0) {
      console.log('❌ No users found for account');
      return;
    }

    const user = account.users[0];
    console.log('User active:', user.is_active);
    console.log('User roles count:', user.userRoles.length);
    
    // Test password
    const password = '12345678';
    console.log('Testing password...');
    console.log('Password hash exists:', !!account.password_hash);
    
    if (account.password_hash) {
      const isValid = await bcrypt.compare(password, account.password_hash);
      console.log('Password valid:', isValid);
    }

    // Check tenant_id conversion
    console.log('Tenant ID:', account.tenant_id);
    console.log('Tenant ID type:', typeof account.tenant_id);
    console.log('Tenant ID as string:', account.tenant_id?.toString());

    console.log('✅ Authentication test completed');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();