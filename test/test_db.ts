import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDB() {
  console.log('🔍 Testing database connection and data...');

  // Test account
  const account = await prisma.account.findUnique({
    where: { email: '1@1.com' }
  });
  console.log('Account found:', account ? 'YES' : 'NO');
  if (account) {
    console.log('  - Email:', account.email);
    console.log('  - Has password:', !!account.passwordHash);
    console.log('  - ID:', account.id);
  }

  // Test users for this account
  if (account) {
    const users = await prisma.user.findMany({
      where: { accountId: account.id }
    });
    console.log('Users found:', users.length);
    for (const user of users) {
      console.log(`  - User: ${user.firstName} ${user.lastName} (${user.username})`);
      console.log(`    - UUID: ${user.uuid}`);
      console.log(`    - Active: ${user.isActive}`);
    }
  }

  // Test roles
  const roles = await prisma.role.findMany();
  console.log('Total roles:', roles.length);
  roles.forEach(role => {
    console.log(`  - ${role.name} (${role.code})`);
  });

  // Test user roles
  const userRoles = await prisma.userRole.findMany({
    include: {
      user: true,
      role: true
    }
  });
  console.log('User-Role assignments:', userRoles.length);
  userRoles.forEach(ur => {
    console.log(`  - ${ur.user.username} has role ${ur.role.name}`);
  });

  // Test simple account query with users
  if (account) {
    try {
      const accountWithUsers = await prisma.account.findUnique({
        where: { email: '1@1.com' },
        include: {
          users: true
        }
      });
      console.log('Account with users query: SUCCESS');
      console.log('  - Users count:', accountWithUsers?.users.length || 0);
    } catch (e) {
      console.error('Account with users query: FAILED', e.message);
    }
  }

  await prisma.$disconnect();
}

testDB().catch(console.error);