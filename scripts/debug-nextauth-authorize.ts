import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function debugNextAuthAuthorize() {
  console.log('🔍 DEBUGGING NEXTAUTH AUTHORIZE FUNCTION');
  console.log('=' .repeat(60));

  try {
    // Simulate exactly what NextAuth authorize() does
    console.log('\n📋 STEP 1: Simulating NextAuth authorize() logic');
    
    const email = '1@1.com';
    const password = '123';
    
    console.log(`   Testing credentials: ${email} / ${password}`);

    // Find account using Prisma (same as NextAuth)
    console.log('\n🔍 STEP 2: Database lookup');
    const accountData = await prisma.account.findFirst({
      where: { email: email },
      include: {
        users: {
          take: 1
        }
      }
    });

    console.log(`   Account found: ${!!accountData}`);
    console.log(`   Password hash exists: ${!!accountData?.passwordHash}`);
    console.log(`   Users count: ${accountData?.users.length || 0}`);

    if (!accountData) {
      console.log('❌ FAILED: Account not found');
      return;
    }

    if (!accountData.passwordHash) {
      console.log('❌ FAILED: No password hash stored');
      return;
    }

    if (accountData.users.length === 0) {
      console.log('❌ FAILED: No users associated with account');
      return;
    }

    const userData = accountData.users[0];
    console.log(`   User ID: ${userData.id}`);
    console.log(`   Username: ${userData.username}`);
    console.log(`   Is Active: ${userData.isActive}`);
    console.log(`   Is Verified: ${userData.isVerified}`);

    // Verify password (same as NextAuth)
    console.log('\n🔐 STEP 3: Password verification');
    const isValidPassword = await bcrypt.compare(password, accountData.passwordHash);
    console.log(`   Password valid: ${isValidPassword}`);

    if (!isValidPassword) {
      console.log('❌ FAILED: Invalid password');
      return;
    }

    // Check what NextAuth authorize() should return
    console.log('\n✅ STEP 4: Expected NextAuth return value');
    const expectedReturn = {
      id: userData.id.toString(),
      email: accountData.email,
      name: `${userData.firstName} ${userData.lastName}`,
      image: userData.profilePhotoUrl,
    };

    console.log('   Expected authorize() return:', JSON.stringify(expectedReturn, null, 2));

    // Check if user has the roles in database for JWT callback
    console.log('\n🔍 STEP 5: User roles for JWT callback');
    const userWithRoles = await prisma.user.findUnique({
      where: { id: parseInt(userData.id.toString()) },
      include: {
        account: {
          include: {
            tenant: true
          }
        },
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (userWithRoles) {
      const enhancedRoles = userWithRoles.roles.map(userRole => userRole.role.name);
      console.log(`   User roles found: [${enhancedRoles.join(', ')}]`);
      console.log(`   Tenant ID: ${userWithRoles.account.tenant.uuid}`);
      console.log(`   Account ID: ${userWithRoles.account.uuid}`);
      console.log(`   Expected JWT enhancedRoles: [${enhancedRoles.join(', ')}]`);
    } else {
      console.log('❌ FAILED: User not found for JWT callback');
    }

    // Check account status
    console.log('\n🔍 STEP 6: Account status checks');
    console.log(`   Account isActive: ${accountData.isActive}`);
    console.log(`   Account isVerified: ${accountData.isVerified}`);
    console.log(`   Account emailVerified: ${accountData.emailVerified}`);
    console.log(`   User isActive: ${userData.isActive}`);
    console.log(`   User isVerified: ${userData.isVerified}`);

    if (!accountData.isActive) {
      console.log('⚠️ WARNING: Account is not active');
    }
    if (!userData.isActive) {
      console.log('⚠️ WARNING: User is not active');
    }

    console.log('\n✅ SUCCESS: All NextAuth authorize() checks passed!');
    console.log('   The authorize function should work correctly.');
    console.log('   The issue might be in the NextAuth configuration itself.');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ ERROR in NextAuth authorize simulation:', errorMessage);
  } finally {
    await prisma.$disconnect();
  }
}

debugNextAuthAuthorize(); 