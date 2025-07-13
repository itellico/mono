import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSuperAdmin() {
  try {
    console.log('🔍 Checking for existing user 1@1.com...');
    
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
        }
      }
    });
    
    if (account) {
      console.log('✅ Account found:', account.email);
      console.log('   - Account ID:', account.id);
      console.log('   - Is Active:', account.isActive);
      console.log('   - Is Verified:', account.isVerified);
      
      if (account.users.length > 0) {
        const user = account.users[0];
        console.log('✅ User found:', user.firstName, user.lastName);
        console.log('   - User ID:', user.id);
        console.log('   - Username:', user.username);
        console.log('   - Is Active:', user.isActive);
        
        if (user.userRoles.length > 0) {
          console.log('✅ User roles:');
          user.userRoles.forEach(userRole => {
            console.log(`   - ${userRole.role.name} (${userRole.role.code})`);
          });
        } else {
          console.log('⚠️  User has no roles assigned');
        }
      } else {
        console.log('⚠️  Account exists but no user profile created');
      }
    } else {
      console.log('❌ No account found for 1@1.com');
    }
    
  } catch (error) {
    console.error('❌ Error checking super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmin();