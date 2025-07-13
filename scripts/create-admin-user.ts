import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user 1@1.com...');
    
    // Check if user already exists
    const existingAccount = await prisma.account.findUnique({
      where: { email: '1@1.com' },
      include: { users: true }
    });
    
    if (existingAccount && existingAccount.users.length > 0) {
      console.log('✅ User 1@1.com already exists');
      return;
    }
    
    let account = existingAccount;
    
    // Hash password
    const hashedPassword = await bcrypt.hash('12345678', 12);
    
    // Find or create tenant
    let tenant = await prisma.tenant.findUnique({
      where: { domain: 'localhost' }
    });
    
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          uuid: randomUUID(),
          name: 'Super Admin Tenant',
          slug: 'super-admin',
          domain: 'localhost',
          isActive: true,
        }
      });
      console.log('✅ Tenant created:', tenant.uuid);
    } else {
      console.log('✅ Using existing tenant:', tenant.uuid);
    }
    
    // Create account if it doesn't exist
    if (!account) {
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
      console.log('✅ Using existing account:', account.id);
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
          uuid: randomUUID(),
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
    
    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: 'Super',
        lastName: 'Admin',
        username: 'superadmin',
        userHash: randomUUID().replace(/-/g, ''),
        accountId: account.id,
        isActive: true,
      }
    });
    
    console.log('✅ User created:', user.uuid);
    
    // Assign role to user
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: superAdminRole.id,
      }
    });
    
    console.log('✅ Role assigned to user');
    console.log('\n🎉 Admin user created successfully!');
    console.log('📧 Email: 1@1.com');
    console.log('🔒 Password: 12345678');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();