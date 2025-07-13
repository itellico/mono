#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Creating test user 1@1.com directly...');
  
  try {
    // First, check if we have any tenants
    const tenants = await prisma.tenant.findMany();
    console.log('Existing tenants:', tenants.length);
    
    let tenant;
    if (tenants.length === 0) {
      console.log('📦 Creating test tenant...');
      // Create tenant using raw SQL to let DB generate UUID
      const result = await prisma.$executeRaw`
        INSERT INTO tenants (uuid, name, domain, slug, is_active, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Test Tenant', 'test.itellico.com', 'test-tenant', true, NOW(), NOW())
        ON CONFLICT (domain) DO NOTHING
        RETURNING id
      `;
      
      tenant = await prisma.tenant.findFirst({
        where: { domain: 'test.itellico.com' }
      });
    } else {
      tenant = tenants[0];
    }
    
    if (!tenant) {
      console.error('❌ Could not create or find tenant!');
      return;
    }
    
    console.log('✅ Using tenant:', tenant.name, '(ID:', tenant.id, ')');
    
    // Check if account exists
    const existingAccount = await prisma.account.findUnique({
      where: { email: '1@1.com' }
    });
    
    const hashedPassword = await bcrypt.hash('12345678', 12);
    console.log('🔐 Password hash generated');
    
    let account;
    if (existingAccount) {
      console.log('✅ Account found. Updating password...');
      account = await prisma.account.update({
        where: { email: '1@1.com' },
        data: {
          password_hash: hashedPassword,
          email_verified: true,
          is_active: true,
          is_verified: true
        }
      });
    } else {
      console.log('📦 Creating new account...');
      // Create account using raw SQL to let DB generate UUID
      const accountResult = await prisma.$executeRaw`
        INSERT INTO accounts (
          uuid, tenant_id, email, password_hash, 
          email_verified, is_active, is_verified, 
          account_type, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(), ${tenant.id}, '1@1.com', ${hashedPassword},
          true, true, true,
          'personal', NOW(), NOW()
        )
        RETURNING id
      `;
      
      account = await prisma.account.findUnique({
        where: { email: '1@1.com' }
      });
    }
    
    if (!account) {
      console.error('❌ Could not create or find account!');
      return;
    }
    
    console.log('✅ Account ready:', account.email);
    
    // Check if user exists
    const existingUsers = await prisma.user.findMany({
      where: { account_id: account.id }
    });
    
    let user;
    if (existingUsers.length === 0) {
      console.log('📦 Creating user...');
      // Create user using raw SQL
      const userResult = await prisma.$executeRaw`
        INSERT INTO users (
          uuid, account_id, first_name, last_name,
          username, user_type, is_active, is_verified,
          account_role, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(), ${account.id}, 'Super', 'Admin',
          ${'superadmin_' + Date.now()}, 'individual', true, true,
          'entity_owner', NOW(), NOW()
        )
        RETURNING id
      `;
      
      user = await prisma.user.findFirst({
        where: { account_id: account.id }
      });
    } else {
      user = existingUsers[0];
      console.log('✅ User found:', user.username);
    }
    
    if (!user) {
      console.error('❌ Could not create or find user!');
      return;
    }
    
    // Ensure role assignment
    const adminRole = await prisma.role.findFirst({
      where: { code: 'platform_super_admin' }
    });
    
    if (adminRole) {
      // Check if role is already assigned
      const existingUserRole = await prisma.userRole.findFirst({
        where: {
          user_id: user.id,
          role_id: adminRole.id
        }
      });
      
      if (!existingUserRole) {
        console.log('🏷️  Assigning platform_super_admin role...');
        await prisma.$executeRaw`
          INSERT INTO user_roles (uuid, user_id, role_id, is_active, assigned_at, created_at, updated_at)
          VALUES (gen_random_uuid(), ${user.id}, ${adminRole.id}, true, NOW(), NOW(), NOW())
          ON CONFLICT (user_id, role_id) DO UPDATE
          SET is_active = true, updated_at = NOW()
        `;
      } else {
        console.log('✅ Role already assigned');
      }
    }
    
    console.log('\n🎉 Setup complete!');
    console.log('📧 Email: 1@1.com');
    console.log('🔐 Password: 12345678');
    console.log('🏷️  Role: Platform Super Admin');
    console.log('🌐 Login URL: http://192.168.178.94:3000/auth/sign-in');
    
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
    
    if (finalCheck && finalCheck.users[0]) {
      console.log('\n✅ Verification:');
      console.log('- Tenant ID:', finalCheck.tenant_id);
      console.log('- Account active:', finalCheck.is_active);
      console.log('- Email verified:', finalCheck.email_verified);
      console.log('- Password hash exists:', !!finalCheck.password_hash);
      console.log('- User:', finalCheck.users[0].first_name, finalCheck.users[0].last_name);
      console.log('- Roles:', finalCheck.users[0].userRoles.map(ur => ur.role.name).join(', '));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();