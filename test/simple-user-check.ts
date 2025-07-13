import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  const testAccount = await prisma.account.findUnique({
    where: { email: 'test@example.com' },
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
  
  if (testAccount) {
    console.log('Test account exists');
    console.log('Email:', testAccount.email);
    console.log('Has password:', testAccount.passwordHash ? 'Yes' : 'No');
    console.log('Password hash:', testAccount.passwordHash);
    console.log('Users:', testAccount.users.length);
  } else {
    console.log('Test account does not exist');
  }
}

checkUsers().catch(console.error).finally(() => prisma.$disconnect());