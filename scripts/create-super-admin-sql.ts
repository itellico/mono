import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdminSQL() {
  try {
    console.log('🔧 Creating super admin user 1@1.com with SQL...');
    
    // Find tenant
    const tenant = await prisma.tenant.findFirst({
      where: { domain: 'localhost' }
    });
    
    if (!tenant) {
      console.log('❌ No tenant found');
      return;
    }
    
    console.log('✅ Using tenant:', tenant.uuid);
    
    // Find account
    const account = await prisma.account.findUnique({
      where: { email: '1@1.com' }
    });
    
    if (!account) {
      console.log('❌ No account found for 1@1.com');
      return;
    }
    
    console.log('✅ Account found:', account.email);
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { accountId: account.id }
    });
    
    if (existingUser) {
      console.log('✅ User already exists:', existingUser.firstName, existingUser.lastName);
    } else {
      // Create user with raw SQL to handle UUID generation
      const timestamp = Date.now();
      await prisma.$executeRaw`
        INSERT INTO "User" ("uuid", "accountId", "firstName", "lastName", "username", "userHash", "isActive", "isVerified", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${account.id}, 'Super', 'Admin', ${`superadmin${timestamp}`}, ${`superadmin${timestamp}`}, true, true, NOW(), NOW())
      `;
      
      console.log('✅ User created via SQL');
    }
    
    // Get user
    const user = await prisma.user.findFirst({
      where: { accountId: account.id }
    });
    
    if (!user) {
      console.log('❌ Failed to create or find user');
      return;
    }
    
    console.log('✅ User found:', user.uuid);
    
    // Create super admin role if it doesn't exist
    let superAdminRole = await prisma.role.findFirst({
      where: { 
        name: 'super_admin',
        tenantid: tenant.id 
      }
    });
    
    if (!superAdminRole) {
      // Create role with raw SQL
      await prisma.$executeRaw`
        INSERT INTO "Role" ("name", "code", "description", "tenantid", "issystem", "createdat", "updatedat")
        VALUES ('super_admin', 'super_admin', 'Full system access', ${tenant.id}, true, NOW(), NOW())
      `;
      
      superAdminRole = await prisma.role.findFirst({
        where: { 
          name: 'super_admin',
          tenantid: tenant.id 
        }
      });
      
      console.log('✅ Super admin role created');
    } else {
      console.log('✅ Super admin role exists');
    }
    
    if (!superAdminRole) {
      console.log('❌ Failed to create or find super admin role');
      return;
    }
    
    // Check if user already has the role
    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: superAdminRole.id,
      }
    });
    
    if (!existingUserRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: superAdminRole.id,
        }
      });
      console.log('✅ Role assigned to user');
    } else {
      console.log('✅ User already has super_admin role');
    }
    
    console.log('\n🎉 Super admin user setup completed!');
    console.log('📧 Email: 1@1.com');
    console.log('🔒 Password: 12345678');
    console.log('👑 Role: super_admin');
    
  } catch (error) {
    console.error('❌ Error creating super admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdminSQL();