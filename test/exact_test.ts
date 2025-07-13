import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function exactTest() {
  console.log('🔍 Testing exact auth service query...');

  try {
    // This is the EXACT query from auth service that's failing
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

    console.log('✅ Query works!');
    console.log('Account found:', !!account);
    console.log('Users:', account?.users?.length || 0);
    console.log('First user roles:', account?.users[0]?.userRoles?.length || 0);
    if (account?.users[0]?.userRoles?.length) {
      const firstRole = account.users[0].userRoles[0];
      console.log('First role:', firstRole.role.name);
      console.log('Permissions:', firstRole.role.permissions?.length || 0);
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Code:', error.code);
  }

  await prisma.$disconnect();
}

exactTest().catch(console.error);