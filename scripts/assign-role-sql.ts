import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignRoleSQL() {
  try {
    console.log('🔧 Using SQL to assign super_admin role to 1@1.com...');
    
    // Get tenant ID
    const tenant = await prisma.$queryRaw<[{ id: number }]>`
      SELECT id FROM "Tenant" WHERE domain = 'localhost' LIMIT 1
    `;
    
    if (!tenant || tenant.length === 0) {
      console.log('❌ Tenant not found');
      return;
    }
    
    const tenantId = tenant[0].id;
    console.log('✅ Tenant ID:', tenantId);
    
    // Get user ID
    const user = await prisma.$queryRaw<[{ id: number, firstName: string, lastName: string }]>`
      SELECT u.id, u."firstName", u."lastName" 
      FROM "User" u 
      JOIN "Account" a ON u."accountId" = a.id 
      WHERE a.email = '1@1.com' 
      LIMIT 1
    `;
    
    if (!user || user.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const userId = user[0].id;
    console.log('✅ User found:', user[0].firstName, user[0].lastName, 'ID:', userId);
    
    // Check if super_admin role exists
    const existingRole = await prisma.$queryRaw<[{ id: number }]>`
      SELECT id FROM "Role" WHERE name = 'super_admin' AND "tenantId" = ${tenantId} LIMIT 1
    `;
    
    let roleId: number;
    
    if (!existingRole || existingRole.length === 0) {
      console.log('⚠️  Creating super_admin role...');
      
      // Create role
      await prisma.$executeRaw`
        INSERT INTO "Role" ("name", "code", "description", "tenantId", "isSystem", "createdAt", "updatedAt")
        VALUES ('super_admin', 'super_admin', 'Full system access', ${tenantId}, true, NOW(), NOW())
      `;
      
      const newRole = await prisma.$queryRaw<[{ id: number }]>`
        SELECT id FROM "Role" WHERE name = 'super_admin' AND "tenantId" = ${tenantId} LIMIT 1
      `;
      
      if (!newRole || newRole.length === 0) {
        console.log('❌ Failed to create role');
        return;
      }
      
      roleId = newRole[0].id;
      console.log('✅ Super admin role created with ID:', roleId);
    } else {
      roleId = existingRole[0].id;
      console.log('✅ Super admin role found with ID:', roleId);
    }
    
    // Check if user already has the role
    const existingUserRole = await prisma.$queryRaw<Array<{ userId: number, roleId: number }>>`
      SELECT "userId", "roleId" FROM "UserRole" WHERE "userId" = ${userId} AND "roleId" = ${roleId} LIMIT 1
    `;
    
    if (!existingUserRole || existingUserRole.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO "UserRole" ("userId", "roleId", "createdAt", "updatedAt")
        VALUES (${userId}, ${roleId}, NOW(), NOW())
      `;
      console.log('✅ Role assigned to user');
    } else {
      console.log('✅ User already has super_admin role');
    }
    
    console.log('\n🎉 Super admin setup completed successfully!');
    console.log('📧 Email: 1@1.com');
    console.log('🔒 Password: 12345678');
    console.log('👑 Role: super_admin');
    console.log('\nYou can now login at: http://localhost:3000/auth/signin');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignRoleSQL();