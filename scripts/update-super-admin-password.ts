import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateSuperAdminPassword() {
  try {
    console.log('🔧 Updating super admin password for 1@1.com...');
    
    // Find the account
    const account = await prisma.account.findUnique({
      where: { email: '1@1.com' }
    });
    
    if (!account) {
      console.log('❌ No account found for 1@1.com');
      console.log('💡 Run create-super-admin.ts first to create the account');
      return;
    }
    
    console.log('✅ Account found:', account.email);
    
    // Update password to Admin123!
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    await prisma.account.update({
      where: { id: account.id },
      data: { passwordHash: hashedPassword }
    });
    
    console.log('✅ Password updated successfully!');
    
    // Find the user
    const user = await prisma.user.findFirst({
      where: { accountId: account.id },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
    
    if (!user) {
      console.log('❌ No user found for this account');
      return;
    }
    
    console.log('✅ User found:', user.firstName, user.lastName);
    console.log('📋 Current roles:');
    user.userRoles.forEach(ur => {
      console.log(`   - ${ur.role.name} (${ur.role.code})`);
    });
    
    // Find tenant
    const tenant = await prisma.tenant.findFirst({
      where: { domain: 'localhost' }
    });
    
    if (!tenant) {
      console.log('❌ No tenant found');
      return;
    }
    
    // Check for super_admin role
    const hasSuperAdmin = user.userRoles.some(ur => ur.role.code === 'super_admin');
    if (!hasSuperAdmin) {
      console.log('⚠️  User does not have super_admin role, attempting to add...');
      
      const superAdminRole = await prisma.role.findFirst({
        where: { 
          code: 'super_admin',
          tenantid: tenant.id 
        }
      });
      
      if (superAdminRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: superAdminRole.id,
          }
        });
        console.log('✅ super_admin role added');
      } else {
        console.log('❌ super_admin role not found in database');
      }
    }
    
    // Check for platform_admin role
    const hasPlatformAdmin = user.userRoles.some(ur => ur.role.code === 'platform_admin');
    if (!hasPlatformAdmin) {
      console.log('⚠️  User does not have platform_admin role, attempting to add...');
      
      const platformAdminRole = await prisma.role.findFirst({
        where: { 
          code: 'platform_admin',
          tenantid: tenant.id 
        }
      });
      
      if (platformAdminRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: platformAdminRole.id,
          }
        });
        console.log('✅ platform_admin role added');
      } else {
        console.log('❌ platform_admin role not found in database');
      }
    }
    
    console.log('\n🎉 Super admin account updated!');
    console.log('📧 Email: 1@1.com');
    console.log('🔒 Password: Admin123!');
    console.log('🌐 Login at: http://localhost:3000/auth/signin');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSuperAdminPassword();