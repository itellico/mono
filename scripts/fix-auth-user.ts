#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for user 1@1.com...');
  
  try {
    // Check if account exists
    const account = await prisma.account.findUnique({
      where: { email: '1@1.com' },
      include: {
        users: true,
        tenant: true
      }
    });
    
    if (!account) {
      console.log('❌ Account 1@1.com not found. Creating it...');
      
      // First, ensure we have a tenant
      let tenant = await prisma.tenant.findFirst({
        where: { domain: 'test.itellico.com' }
      });
      
      if (!tenant) {
        console.log('📦 Creating default tenant...');
        tenant = await prisma.tenant.create({
          data: {
            name: 'Test Tenant',
            domain: 'test.itellico.com',
            slug: 'test-tenant',
            is_active: true
          }
        });
      }
      
      // Create the account with proper field names
      const hashedPassword = await bcrypt.hash('12345678', 12);
      const newAccount = await prisma.account.create({
        data: {
          email: '1@1.com',
          password_hash: hashedPassword,
          email_verified: true,
          tenant_id: tenant.id,
          is_active: true,
          is_verified: true,
          account_type: 'personal'
        }
      });
      
      console.log('✅ Account created:', newAccount.email);
      
      // Create user for the account
      const user = await prisma.user.create({
        data: {
          account_id: newAccount.id,
          first_name: 'Super',
          last_name: 'Admin',
          username: 'superadmin',
          user_type: 'individual',
          is_active: true,
          is_verified: true,
          account_role: 'entity_owner'
        }
      });
      
      console.log('✅ User created:', user.username);
      
      // Find or create admin role
      let adminRole = await prisma.role.findFirst({
        where: { 
          code: 'platform_super_admin'
        }
      });
      
      if (!adminRole) {
        console.log('🔧 Creating platform super admin role...');
        adminRole = await prisma.role.create({
          data: {
            name: 'Platform Super Admin',
            code: 'platform_super_admin',
            description: 'Full platform access',
            level: 0,
            is_system: true,
            is_active: true,
            metadata: { color: 'red', icon: 'crown' }
          }
        });
      }
      
      // Assign role to user
      await prisma.userRole.create({
        data: {
          user_id: user.id,
          role_id: adminRole.id,
          is_active: true
        }
      });
      
      console.log('✅ Super admin role assigned');
      
    } else {
      console.log('✅ Account found. Updating password...');
      
      // Update password with proper field name
      const hashedPassword = await bcrypt.hash('12345678', 12);
      await prisma.account.update({
        where: { email: '1@1.com' },
        data: {
          password_hash: hashedPassword,
          email_verified: true,
          is_active: true,
          is_verified: true
        }
      });
      
      console.log('✅ Password updated');
      
      // Check if user exists
      if (account.users.length === 0) {
        console.log('⚠️  No user found for account. Creating one...');
        const user = await prisma.user.create({
          data: {
            account_id: account.id,
            first_name: 'Super',
            last_name: 'Admin',
            username: 'superadmin_' + Date.now(),
            user_type: 'individual',
            is_active: true,
            is_verified: true,
            account_role: 'entity_owner'
          }
        });
        
        // Assign super admin role
        let adminRole = await prisma.role.findFirst({
          where: { code: 'platform_super_admin' }
        });
        
        if (adminRole) {
          await prisma.userRole.create({
            data: {
              user_id: user.id,
              role_id: adminRole.id,
              is_active: true
            }
          });
          console.log('✅ Super admin role assigned to new user');
        }
      }
    }
    
    console.log('\n🎉 Setup complete!');
    console.log('📧 Email: 1@1.com');
    console.log('🔐 Password: 12345678');
    console.log('🏷️  Role: Platform Super Admin');
    
    // Verify the setup
    const finalCheck = await prisma.account.findUnique({
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
    
    if (finalCheck) {
      console.log('\n✅ Verification:');
      console.log('- Account active:', finalCheck.is_active);
      console.log('- Email verified:', finalCheck.email_verified);
      console.log('- Users:', finalCheck.users.length);
      if (finalCheck.users[0]) {
        console.log('- User active:', finalCheck.users[0].is_active);
        console.log('- User roles:', finalCheck.users[0].userRoles.map(ur => ur.role.name).join(', '));
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();