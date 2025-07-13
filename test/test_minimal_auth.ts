import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testMinimalAuth() {
  console.log('🔍 Testing minimal auth logic...');

  const email = '1@1.com';
  const password = '123';

  try {
    // Step 1: Find account (basic)
    console.log('\n1. Finding account...');
    const account = await prisma.account.findUnique({
      where: { email }
    });
    
    if (!account) {
      console.log('❌ Account not found');
      return;
    }
    console.log('✅ Account found');

    // Step 2: Verify password
    console.log('\n2. Verifying password...');
    const isValid = await bcrypt.compare(password, account.passwordHash);
    console.log('✅ Password valid:', isValid);
    
    if (!isValid) {
      console.log('❌ Password invalid');
      return;
    }

    // Step 3: Find users for account
    console.log('\n3. Finding users...');
    const users = await prisma.user.findMany({
      where: { accountId: account.id, isActive: true }
    });
    console.log('✅ Active users found:', users.length);
    
    if (users.length === 0) {
      console.log('❌ No active users');
      return;
    }

    // Step 4: Test the problematic query step by step
    console.log('\n4. Testing full query step by step...');
    
    // First, just users
    const accountWithUsers = await prisma.account.findUnique({
      where: { email },
      include: { users: true }
    });
    console.log('✅ Account with users:', accountWithUsers?.users.length);

    // Then, try the nested query that's failing
    console.log('\n5. Testing nested userRoles query...');
    const fullAccount = await prisma.account.findUnique({
      where: { email },
      include: {
        users: {
          include: {
            userRoles: true
          }
        }
      }
    });
    console.log('✅ Account with userRoles:', fullAccount?.users[0]?.userRoles?.length);

    console.log('\n🎉 ALL TESTS PASSED - Authentication should work!');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
    }
  }

  await prisma.$disconnect();
}

testMinimalAuth().catch(console.error);