import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const email = '1@1.com';
    const newPassword = 'admin123';

    console.log(`🔧 Resetting password for ${email}...`);

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update the account password
    const updated = await prisma.account.update({
      where: { email },
      data: { passwordHash }
    });

    console.log(`✅ Password updated for account ID: ${updated.id}`);
    console.log(`   New password: ${newPassword}`);
    console.log(`   Hash: ${passwordHash}`);

  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();