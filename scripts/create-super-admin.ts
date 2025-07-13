import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🔧 Creating super admin user 1@1.com...');
    
    // Find or create tenant
    let tenant = await prisma.tenant.findFirst({
      where: { domain: 'localhost' }
    });
    
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Super Admin Tenant',
          domain: 'localhost',
          slug: 'super-admin',
          isActive: true,
        }
      });
      console.log('✅ Tenant created:', tenant.uuid);
    } else {
      console.log('✅ Using existing tenant:', tenant.uuid);
    }
    
    // Check if account already exists
    let account = await prisma.account.findUnique({
      where: { email: '1@1.com' }
    });
    
    if (!account) {
      // Hash password
      const hashedPassword = await bcrypt.hash('12345678', 12);
      
      account = await prisma.account.create({
        data: {
          email: '1@1.com',
          passwordHash: hashedPassword,
          isActive: true,
          isVerified: true,
          tenantId: tenant.id,
        }
      });
      console.log('✅ Account created:', account.id);
    } else {
      console.log('✅ Account already exists:', account.email);
    }
    
    // Check if user already exists
    let user = await prisma.user.findFirst({
      where: { accountId: account.id }
    });
    
    if (!user) {
      // Generate unique username and userHash
      const timestamp = Date.now();
      user = await prisma.user.create({
        data: {
          firstName: 'Super',
          lastName: 'Admin',
          username: 'superadmin' + timestamp,
          userHash: 'superadmin' + timestamp,
          accountId: account.id,
          isActive: true,
          isVerified: true,
        }
      });
      console.log('✅ User created:', user.uuid);
    } else {
      console.log('✅ User already exists:', user.firstName, user.lastName);
    }
    
    // Create super admin role if it doesn't exist
    let superAdminRole = await prisma.role.findFirst({
      where: { 
        name: 'super_admin',
        tenantid: tenant.id 
      }
    });
    
    if (!superAdminRole) {
      superAdminRole = await prisma.role.create({
        data: {
          name: 'super_admin',
          code: 'super_admin',
          description: 'Full system access',
          tenantid: tenant.id,
          issystem: true,
        }
      });
      console.log('✅ Super admin role created');
    } else {
      console.log('✅ Super admin role exists');
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

createSuperAdmin();