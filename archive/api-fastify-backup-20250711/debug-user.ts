import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const account = await prisma.account.findUnique({
      where: { email: '1@1.com' },
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
    
    if (!account) {
      console.log('❌ No account found for 1@1.com');
      
      // Check what accounts exist
      const allAccounts = await prisma.account.findMany({
        select: { email: true, id: true }
      });
      console.log('Available accounts:', allAccounts);
    } else {
      console.log('✅ Account found:', {
        id: account.id,
        email: account.email,
        hasPassword: !!account.passwordHash,
        usersCount: account.users.length,
        users: account.users.map(u => ({
          id: u.id,
          uuid: u.uuid,
          isActive: u.isActive,
          roleCount: u.userRoles.length
        }))
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();