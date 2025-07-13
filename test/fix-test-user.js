#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixTestUser() {
  try {
    console.log('🔧 Fixing test user setup...\n');

    // Get the account
    const account = await prisma.account.findUnique({
      where: { email: '1@1.com' },
      include: {
        users: true,
        tenant: true
      }
    });

    if (!account) {
      console.log('❌ Account 1@1.com not found');
      return;
    }

    // Create user if none exists
    if (account.users.length === 0) {
      console.log('📝 Creating user profile...');
      
      const user = await prisma.user.create({
        data: {
          accountId: account.id,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          userHash: Math.random().toString(36).substring(7),
          isActive: true,
        }
      });

      console.log(`✅ Created user: ${user.username} (ID: ${user.id})`);

      // Find or create admin role
      let role = await prisma.role.findFirst({
        where: {
          OR: [
            { name: 'Admin' },
            { name: 'Super Admin' },
            { code: 'admin' },
            { code: 'super_admin' }
          ]
        }
      });

      if (!role) {
        role = await prisma.role.create({
          data: {
            name: 'Admin',
            code: 'admin',
            description: 'Administrator role',
            tenantId: account.tenantId,
          }
        });
        console.log(`✅ Created admin role (ID: ${role.id})`);
      } else {
        console.log(`✅ Found existing role: ${role.name} (ID: ${role.id})`);
      }

      // Assign role to user
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          grantedBy: user.id,
        }
      });

      console.log(`✅ Assigned ${role.name} role to user`);
    } else {
      console.log('✅ User profile already exists');
    }

    // Ensure password is correct
    const testPassword = 'admin1@1.com';
    if (account.passwordHash) {
      const isValid = await bcrypt.compare(testPassword, account.passwordHash);
      if (!isValid) {
        console.log('🔑 Updating password...');
        const newHash = await bcrypt.hash(testPassword, 12);
        await prisma.account.update({
          where: { id: account.id },
          data: { passwordHash: newHash }
        });
        console.log('✅ Password updated');
      } else {
        console.log('✅ Password is correct');
      }
    }

    console.log('\n🎉 Test user is ready!');
    console.log('\n📧 Login credentials:');
    console.log('   Email: 1@1.com');
    console.log('   Password: admin1@1.com');
    console.log('\n🔗 Login at: http://localhost:3000/auth/signin');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixTestUser();