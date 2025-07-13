#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Setting up test user 1@1.com...');
  
  try {
    // Check if tenant exists
    let tenant = await prisma.tenant.findFirst({
      where: { domain: 'test.itellico.com' }
    });
    
    if (!tenant) {
      console.log('📦 Creating test tenant...');
      tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant',
          domain: 'test.itellico.com',
          slug: 'test-tenant',
          is_active: true
        }
      });
      console.log('✅ Tenant created:', tenant.domain);
    }
    
    // Check if account exists
    const existingAccount = await prisma.account.findUnique({
      where: { email: '1@1.com' }
    });
    
    const hashedPassword = await bcrypt.hash('12345678', 12);
    
    if (existingAccount) {
      console.log('✅ Account found. Updating...');
      
      // Update password with snake_case field name
      await prisma.account.update({
        where: { email: '1@1.com' },
        data: {
          password_hash: hashedPassword,
          email_verified: true,
          is_active: true,
          is_verified: true
        }
      });
      
      // Ensure user exists
      const users = await prisma.user.findMany({
        where: { account_id: existingAccount.id }
      });
      
      if (users.length === 0) {
        console.log('⚠️  No user found. Creating...');
        const user = await prisma.user.create({
          data: {
            account_id: existingAccount.id,
            first_name: 'Super',
            last_name: 'Admin',
            username: 'superadmin_' + Date.now(),
            user_type: 'individual',
            is_active: true,
            is_verified: true,
            account_role: 'entity_owner'
          }
        });
        console.log('✅ User created:', user.username);
        
        // Assign super admin role
        const adminRole = await prisma.role.findFirst({
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
          console.log('✅ Super admin role assigned');
        }
      }
    } else {
      console.log('❌ Creating new account...');
      
      // Create account with snake_case fields
      const account = await prisma.account.create({
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
      console.log('✅ Account created');
      
      // Create user
      const user = await prisma.user.create({
        data: {
          account_id: account.id,
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
      
      // Find or create super admin role
      let adminRole = await prisma.role.findFirst({
        where: { code: 'platform_super_admin' }
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
    }
    
    // Add platform.admin.super permission if it doesn't exist
    let superPermission = await prisma.permission.findFirst({
      where: { name: 'platform.admin.super' }
    });
    
    if (!superPermission) {
      console.log('🔧 Creating super admin permission...');
      superPermission = await prisma.permission.create({
        data: {
          name: 'platform.admin.super',
          module: 'platform',
          resource: 'platform',
          action: 'super_admin',
          scope: 'platform',
          description: 'Super admin access to everything',
          is_system: true,
          priority: 1000
        }
      });
    }
    
    // Ensure the role has the permission
    const adminRole = await prisma.role.findFirst({
      where: { code: 'platform_super_admin' }
    });
    
    if (adminRole && superPermission) {
      const existingRolePerm = await prisma.rolePermission.findFirst({
        where: {
          role_id: adminRole.id,
          permission_id: superPermission.id
        }
      });
      
      if (!existingRolePerm) {
        await prisma.rolePermission.create({
          data: {
            role_id: adminRole.id,
            permission_id: superPermission.id
          }
        });
        console.log('✅ Super permission assigned to role');
      }
    }
    
    console.log('\n🎉 Setup complete!');
    console.log('📧 Email: 1@1.com');
    console.log('🔐 Password: 12345678');
    console.log('🏷️  Role: Platform Super Admin');
    console.log('🔑 Permission: platform.admin.super');
    
    // Verify the setup
    const finalCheck = await prisma.account.findUnique({
      where: { email: '1@1.com' },
      include: {
        users: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (finalCheck && finalCheck.users[0]) {
      console.log('\n✅ Verification:');
      console.log('- Account active:', finalCheck.is_active);
      console.log('- Email verified:', finalCheck.email_verified);
      console.log('- Password hash exists:', !!finalCheck.password_hash);
      console.log('- User active:', finalCheck.users[0].is_active);
      console.log('- Roles:', finalCheck.users[0].userRoles.map(ur => ur.role.name).join(', '));
      console.log('- Permissions:', finalCheck.users[0].userRoles.flatMap(ur => 
        ur.role.rolePermissions.map(rp => rp.permission.name)
      ).join(', '));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();