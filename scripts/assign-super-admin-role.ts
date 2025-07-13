import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignSuperAdminRole() {
  try {
    console.log('🔧 Assigning super_admin role to 1@1.com...');
    
    // Find user
    const account = await prisma.account.findUnique({
      where: { email: '1@1.com' },
      include: { users: true }
    });
    
    if (!account || account.users.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = account.users[0];
    console.log('✅ User found:', user.firstName, user.lastName);
    
    // Find tenant
    const tenant = await prisma.tenant.findFirst({
      where: { domain: 'localhost' }
    });
    
    if (!tenant) {
      console.log('❌ Tenant not found');
      return;
    }
    
    // Try to find existing super_admin role
    let superAdminRole = await prisma.role.findFirst({
      where: { 
        name: 'super_admin',
        tenantid: tenant.id 
      }
    });
    
    if (!superAdminRole) {
      console.log('⚠️  Super admin role not found, creating it...');
      
      // Create role with raw SQL to avoid schema issues
      await prisma.$executeRaw`
        INSERT INTO "Role" ("uuid", "name", "code", "description", "tenantid", "issystem", "createdat", "updatedat")
        VALUES (gen_random_uuid(), 'super_admin', 'super_admin', 'Full system access', ${tenant.id}, true, NOW(), NOW())
      `;
      
      superAdminRole = await prisma.role.findFirst({
        where: { 
          name: 'super_admin',
          tenantid: tenant.id 
        }
      });
      
      console.log('✅ Super admin role created');
    } else {
      console.log('✅ Super admin role found');
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
    
    console.log('\n🎉 Super admin role assignment completed!');
    console.log('📧 Email: 1@1.com');
    console.log('🔒 Password: 12345678');
    console.log('👑 Role: super_admin');
    
  } catch (error) {
    console.error('❌ Error assigning super admin role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignSuperAdminRole();