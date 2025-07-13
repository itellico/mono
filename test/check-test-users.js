#!/usr/bin/env node

/**
 * Check for test users in the database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTestUsers() {
  try {
    console.log('🔍 Checking for test users...\n');

    // Get all accounts
    const accounts = await prisma.account.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        tenantId: true,
        tenant: {
          select: {
            name: true
          }
        }
      }
    });

    if (accounts.length === 0) {
      console.log('❌ No accounts found in database');
      console.log('\n💡 Run the seed script to create test data:');
      console.log('   npm run seed');
      return;
    }

    console.log('Found accounts:');
    accounts.forEach(account => {
      console.log(`\n📧 Email: ${account.email}`);
      console.log(`   ID: ${account.id}`);
      console.log(`   Tenant: ${account.tenant?.name || 'Unknown'} (ID: ${account.tenantId})`);
    });

    // Check for users
    const users = await prisma.user.findMany({
      take: 5,
      include: {
        account: {
          select: {
            email: true
          }
        },
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    console.log('\n\nFound users:');
    users.forEach(user => {
      console.log(`\n👤 Username: ${user.username || 'N/A'}`);
      console.log(`   Email: ${user.account.email}`);
      console.log(`   Roles: ${user.userRoles.map(ur => ur.role.name).join(', ') || 'None'}`);
      console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
    });

    // Show default test credentials
    console.log('\n\n💡 Default test credentials (if using seed data):');
    console.log('   Email: admin@example.com');
    console.log('   Password: Admin123!@#');
    console.log('\n   OR');
    console.log('\n   Email: 1@1.com');
    console.log('   Password: admin1@1.com');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestUsers();