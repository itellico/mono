import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAdminFinal() {
  try {
    console.log('🔍 Final verification of super admin setup...');
    
    // Get user info with role
    const result = await prisma.$queryRaw<Array<{
      email: string,
      firstName: string,
      lastName: string,
      isActive: boolean,
      roleName: string
    }>>`
      SELECT 
        a.email,
        u."firstName",
        u."lastName", 
        u."isActive",
        r.name as "roleName"
      FROM "Account" a
      JOIN "User" u ON u."accountId" = a.id
      JOIN "UserRole" ur ON ur."userId" = u.id
      JOIN "Role" r ON r.id = ur."roleId"
      WHERE a.email = '1@1.com'
    `;
    
    if (result.length > 0) {
      const user = result[0];
      console.log('\n✅ Super admin user verified!');
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Name: ${user.firstName} ${user.lastName}`);
      console.log(`   🟢 Active: ${user.isActive}`);
      console.log(`   👑 Role: ${user.roleName}`);
      console.log(`   🔒 Password: 12345678`);
      console.log('\n🎯 Ready to login at: http://localhost:3000/auth/signin');
    } else {
      console.log('❌ Super admin user not found or not properly configured');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminFinal();