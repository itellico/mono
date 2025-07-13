import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testUserRoles() {
  console.log('🔍 Testing userRoles relationship...');

  try {
    // Try userRoles instead of roles
    console.log('\n1. Account with users and userRoles:');
    const result = await prisma.account.findUnique({
      where: { email: '1@1.com' },
      include: {
        users: {
          include: {
            userRoles: true
          }
        }
      }
    });
    console.log('   ✅ SUCCESS - UserRoles:', result?.users[0]?.userRoles?.length || 0);

    // Now try with full nesting
    console.log('\n2. Account with users, userRoles, and role details:');
    const fullResult = await prisma.account.findUnique({
      where: { email: '1@1.com' },
      include: {
        users: {
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });
    console.log('   ✅ SUCCESS - Full structure works!');
    const user = fullResult?.users[0];
    if (user?.userRoles) {
      user.userRoles.forEach(ur => {
        console.log(`   - Role: ${ur.role.name}`);
      });
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }

  await prisma.$disconnect();
}

testUserRoles().catch(console.error);