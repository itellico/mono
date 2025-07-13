// Fix the password hash for the test user
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function fixPasswordHash() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Fixing password hash for 1@1.com...');
    
    const password = 'Admin123!';
    const saltRounds = 10;
    
    // Generate a proper password hash
    console.log('Generating password hash...');
    const passwordHash = await bcrypt.hash(password, saltRounds);
    console.log('Generated hash:', passwordHash);
    
    // Verify the hash works
    const testVerification = await bcrypt.compare(password, passwordHash);
    console.log('Hash verification test:', testVerification);
    
    if (!testVerification) {
      console.log('❌ Hash verification failed!');
      return;
    }
    
    // Update the account with the correct hash
    console.log('Updating account password hash...');
    const updatedAccount = await prisma.account.update({
      where: { email: '1@1.com' },
      data: { passwordHash },
      select: { id: true, email: true }
    });
    
    console.log('✅ Password hash updated for account:', updatedAccount);
    
    // Test the updated hash
    console.log('\nTesting updated password...');
    const account = await prisma.account.findUnique({
      where: { email: '1@1.com' },
      select: { passwordHash: true }
    });
    
    const finalTest = await bcrypt.compare(password, account.passwordHash);
    console.log('Final password test:', finalTest);
    
    if (finalTest) {
      console.log('🎉 Password hash fixed! Login should now work.');
    } else {
      console.log('❌ Password hash still not working');
    }
    
  } catch (error) {
    console.error('❌ Error fixing password hash:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixPasswordHash();