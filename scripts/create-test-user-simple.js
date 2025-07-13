// Create a simple test user for login testing
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Creating test user for login testing...\n');
    
    // First, check if we have a tenant
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('📝 Creating default tenant...');
      tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant',
          domain: 'localhost',
          slug: 'test',
          isActive: true
        }
      });
      console.log(`✅ Created tenant: ${tenant.name} (ID: ${tenant.id})`);
    } else {
      console.log(`✅ Using existing tenant: ${tenant.name} (ID: ${tenant.id})`);
    }
    
    // Check if account already exists
    let account = await prisma.account.findUnique({
      where: { email: '1@1.com' }
    });
    
    if (account) {
      console.log('⚠️  Account 1@1.com already exists');
    } else {
      console.log('📝 Creating test account...');
      // Hash password
      const passwordHash = await bcrypt.hash('Admin123!', 10);
      
      account = await prisma.account.create({
        data: {
          email: '1@1.com',
          passwordHash: passwordHash,
          emailVerified: true,
          isActive: true,
          tenantId: tenant.id
        }
      });
      console.log(`✅ Created account: ${account.email} (ID: ${account.id})`);
    }
    
    // Check if user exists
    let user = await prisma.user.findFirst({
      where: { accountId: account.id }
    });
    
    if (user) {
      console.log('⚠️  User already exists for this account');
    } else {
      console.log('📝 Creating test user...');
      user = await prisma.user.create({
        data: {
          accountId: account.id,
          firstName: 'Test',
          lastName: 'Admin',
          username: 'testadmin',
          userType: 'individual',
          accountRole: 'admin',
          isActive: true,
          userHash: 'test_user_hash'
        }
      });
      console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.username})`);
    }
    
    console.log('\n🎉 Test user setup complete!');
    console.log('You can now login with:');
    console.log('  Email: 1@1.com');
    console.log('  Password: Admin123!');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();