import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function verifySuperAdmin() {
  try {
    console.log('🔍 Verifying super admin account...');
    
    // Find the account
    const account = await prisma.account.findUnique({
      where: { email: '1@1.com' }
    });
    
    if (!account) {
      console.log('❌ No account found for 1@1.com');
      return;
    }
    
    console.log('✅ Account found:', account.email);
    console.log('📧 Email:', account.email);
    console.log('🔐 Has password:', !!account.passwordHash);
    
    // Test password
    if (account.passwordHash) {
      const isValid = await bcrypt.compare('Admin123!', account.passwordHash);
      console.log('🔑 Password "Admin123!" is valid:', isValid);
    }
    
    // Find the user
    const user = await prisma.user.findFirst({
      where: { accountId: account.id }
    });
    
    if (user) {
      console.log('\n👤 User details:');
      console.log('   Name:', user.firstName, user.lastName);
      console.log('   UUID:', user.uuid);
      console.log('   Active:', user.isActive);
      console.log('   Verified:', user.isVerified);
      
      // Get user roles without including the role details to avoid the issystem error
      const userRoles = await prisma.userRole.findMany({
        where: { userId: user.id }
      });
      
      if (userRoles.length > 0) {
        console.log('\n👑 User has', userRoles.length, 'role(s) assigned');
        
        // Get role details separately
        for (const ur of userRoles) {
          try {
            const role = await prisma.$queryRaw`
              SELECT name, code, description FROM "Role" WHERE id = ${ur.roleId}
            `;
            if (Array.isArray(role) && role.length > 0) {
              console.log(`   - ${role[0].name} (${role[0].code})`);
            }
          } catch (e) {
            console.log(`   - Role ID: ${ur.roleId}`);
          }
        }
      } else {
        console.log('\n⚠️  User has no roles assigned');
      }
    } else {
      console.log('❌ No user found for this account');
    }
    
    console.log('\n✨ Summary:');
    console.log('📧 Email: 1@1.com');
    console.log('🔒 Password: Admin123!');
    console.log('🌐 Login URL: http://localhost:3000/auth/signin');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySuperAdmin();