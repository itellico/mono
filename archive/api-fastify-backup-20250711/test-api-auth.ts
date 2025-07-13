import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function test() {
  const account = await prisma.account.findUnique({
    where: { email: 'test@example.com' },
    include: {
      users: {
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
  
  console.log('Account found:', account ? 'yes' : 'no');
  console.log('Has password:', account?.passwordHash ? 'yes' : 'no');
  console.log('Users count:', account?.users.length || 0);
  
  if (account?.passwordHash) {
    const isValid = await bcrypt.compare('password123', account.passwordHash);
    console.log('Password valid:', isValid);
    
    // Also log what the auth service would see
    if (account.users.length > 0) {
      const user = account.users[0];
      console.log('User active:', user.isActive);
      console.log('User roles:', user.userRoles.map(ur => ur.role.name));
    }
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());