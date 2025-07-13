import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testQueries() {
  console.log('🔍 Testing problematic queries step by step...');

  try {
    // Step 1: Account with users only
    console.log('\n1. Account with users:');
    const step1 = await prisma.account.findUnique({
      where: { email: '1@1.com' },
      include: {
        users: true
      }
    });
    console.log('   ✅ SUCCESS - Users count:', step1?.users.length);

    // Step 2: Find UserRole entries for this user
    console.log('\n2. UserRole entries:');
    const user = step1?.users[0];
    if (user) {
      const userRoles = await prisma.userRole.findMany({
        where: { userId: user.id }
      });
      console.log('   ✅ SUCCESS - UserRoles count:', userRoles.length);
    }

    // Step 3: Account with users and their roles (simple)
    console.log('\n3. Account with users and roles (simple):');
    const step3 = await prisma.account.findUnique({
      where: { email: '1@1.com' },
      include: {
        users: {
          include: {
            roles: true  // This might be the issue
          }
        }
      }
    });
    console.log('   ✅ SUCCESS - User roles:', step3?.users[0]?.roles?.length || 0);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.code === 'P2022') {
      console.error('   Missing column:', error.meta?.column);
    }
  }

  await prisma.$disconnect();
}

testQueries().catch(console.error);