// Check if test users exist in database
const { PrismaClient } = require('@prisma/client');

async function checkUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking database for users...\n');
    
    // Check accounts with basic fields only
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        email: true,
        passwordHash: true,
        isActive: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            isActive: true
          }
        }
      }
    });
    
    console.log(`📊 Found ${accounts.length} accounts:`);
    accounts.forEach((account, i) => {
      console.log(`\nAccount ${i + 1}:`);
      console.log(`  Email: ${account.email}`);
      console.log(`  Has Password: ${!!account.passwordHash}`);
      console.log(`  Active: ${account.isActive}`);
      console.log(`  Users: ${account.users.length}`);
      
      account.users.forEach((user, j) => {
        console.log(`    User ${j + 1}: ${user.firstName} ${user.lastName} (${user.username})`);
        console.log(`      Active: ${user.isActive}`);
      });
    });
    
    // Check if email 1@1.com exists
    console.log('\n🔍 Checking for 1@1.com...');
    const testAccount = await prisma.account.findUnique({
      where: { email: '1@1.com' },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        isActive: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            isActive: true
          }
        }
      }
    });
    
    if (testAccount) {
      console.log('✅ Found 1@1.com account:');
      console.log(`  Has Password: ${!!testAccount.passwordHash}`);
      console.log(`  Active: ${testAccount.isActive}`);
      console.log(`  Users: ${testAccount.users.length}`);
    } else {
      console.log('❌ No account found for 1@1.com');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();