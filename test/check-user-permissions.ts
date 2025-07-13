import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  const accounts = await prisma.account.findMany({
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
  
  console.log('Found accounts:', accounts.length);
  
  for (const account of accounts) {
    console.log('\nAccount:', account.email);
    console.log('Has password:', !!account.passwordHash);
    console.log('Users:', account.users.length);
    for (const user of account.users) {
      console.log('  - User:', user.uuid, 'Active:', user.isActive);
      console.log('    Roles:', user.userRoles.map(ur => ur.role.name).join(', '));
    }
  }
  
  // Check if test@example.com exists
  const testAccount = await prisma.account.findUnique({
    where: { email: 'test@example.com' }
  });
  
  if (testAccount) {
    console.log('\nTest account exists with password hash:', !!testAccount.passwordHash);
  } else {
    console.log('\nTest account does not exist');
  }
}

checkUsers().finally(() => prisma.$disconnect());