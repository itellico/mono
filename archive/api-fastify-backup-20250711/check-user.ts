import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    // First find the account
    const account = await prisma.account.findUnique({
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
        },
        tenant: true
      }
    });
    
    console.log('Account found:', account ? {
      id: account.id,
      email: account.email,
      tenantId: account.tenantId,
      tenant: account.tenant?.name,
      isActive: account.isActive,
      users: account.users.map(u => ({
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        roles: u.userRoles.map(ur => ur.role.name)
      }))
    } : 'Not found');
    
    // Check if any accounts exist
    const accountCount = await prisma.account.count();
    console.log('\nTotal accounts in database:', accountCount);
    
    if (accountCount > 0) {
      const accounts = await prisma.account.findMany({
        take: 5,
        include: { 
          users: {
            include: {
              userRoles: {
                include: {
                  role: true
                }
              }
            }
          },
          tenant: true 
        }
      });
      console.log('\nFirst 5 accounts:');
      accounts.forEach(a => {
        console.log(`- ${a.email} (Tenant: ${a.tenant?.name || 'No tenant'})`);
        a.users.forEach(u => {
          const roles = u.userRoles.map(ur => ur.role.name).join(', ');
          console.log(`  └─ User: ${u.username} (${u.firstName} ${u.lastName}) - Roles: ${roles || 'No roles'}`);
        });
      });
    }
    
    // Check roles
    const roles = await prisma.role.findMany();
    console.log('\nAvailable roles:');
    roles.forEach(r => console.log(`- ${r.name}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();