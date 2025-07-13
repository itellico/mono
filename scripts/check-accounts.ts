#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkAccounts() {
  try {
    // Find all accounts
    const accounts = await prisma.account.findMany({
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
      },
      orderBy: { created_at: 'asc' }
    });

    console.log('\n📊 Total accounts:', accounts.length);
    console.log('=====================================\n');

    for (const account of accounts) {
      console.log('Account ID:', account.id);
      console.log('Email:', account.email);
      console.log('Active:', account.is_active);
      console.log('Tenant ID:', account.tenant_id);
      
      if (account.users.length > 0) {
        const user = account.users[0];
        console.log('User ID:', user.id);
        console.log('Username:', user.username);
        console.log('Name:', `${user.first_name} ${user.last_name}`.trim());
        console.log('User Active:', user.is_active);
        
        const roles = user.userRoles.map(ur => ur.role.name);
        console.log('Roles:', roles.join(', ') || 'No roles');
      }
      
      console.log('-------------------------------------\n');
    }

    // Check if 1@1.com exists
    console.log('🔍 Looking for 1@1.com...');
    const superAdmin = await prisma.account.findUnique({
      where: { email: '1@1.com' }
    });

    if (superAdmin) {
      console.log('✅ Found super admin account!');
      console.log('Account is active:', superAdmin.is_active);
      
      // Test password
      const testPassword = '12345678';
      const isValid = await bcrypt.compare(testPassword, superAdmin.password_hash || '');
      console.log('Password "12345678" is valid:', isValid);
      
      if (!isValid) {
        console.log('\n🔧 Updating password to "12345678"...');
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        await prisma.account.update({
          where: { id: superAdmin.id },
          data: { 
            password_hash: hashedPassword,
            is_active: true 
          }
        });
        
        // Also activate the user
        const users = await prisma.user.findMany({
          where: { account_id: superAdmin.id }
        });
        
        if (users.length > 0) {
          await prisma.user.update({
            where: { id: users[0].id },
            data: { is_active: true }
          });
        }
        
        console.log('✅ Password updated and account activated!');
      }
    } else {
      console.log('❌ Super admin account 1@1.com not found!');
      console.log('\n📝 Creating super admin account...');
      
      // Create super admin account
      const hashedPassword = await bcrypt.hash('12345678', 10);
      
      const adminAccount = await prisma.account.create({
        data: {
          email: '1@1.com',
          password_hash: hashedPassword,
          tenant_id: 1,
          is_active: true
        }
      });
      
      // Create user
      const adminUser = await prisma.user.create({
        data: {
          account_id: adminAccount.id,
          first_name: 'Super',
          last_name: 'Admin',
          username: 'superadmin',
          user_hash: 'admin_' + Date.now(),
          is_active: true
        }
      });
      
      // Create or find admin role
      let adminRole = await prisma.role.findFirst({
        where: { name: 'admin' }
      });
      
      if (!adminRole) {
        adminRole = await prisma.role.create({
          data: {
            name: 'admin',
            code: 'ADMIN',
            tenant_id: 1
          }
        });
      }
      
      // Assign role
      await prisma.userRole.create({
        data: {
          user_id: adminUser.id,
          role_id: adminRole.id
        }
      });
      
      console.log('✅ Super admin account created!');
      console.log('Email: 1@1.com');
      console.log('Password: 12345678');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAccounts();