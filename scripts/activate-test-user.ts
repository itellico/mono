#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function activateTestUser() {
  try {
    // Find the test account
    const account = await prisma.account.findUnique({
      where: { email: 'test@example.com' },
      include: { users: true }
    });

    if (!account) {
      console.error('Test account not found');
      process.exit(1);
    }

    // Activate the account
    await prisma.account.update({
      where: { id: account.id },
      data: { is_active: true }
    });

    // Activate the user
    if (account.users[0]) {
      await prisma.user.update({
        where: { id: account.users[0].id },
        data: { is_active: true }
      });
    }

    console.log('✅ Test account activated successfully');
    console.log('Email: test@example.com');
    console.log('Password: Test123');
  } catch (error) {
    console.error('Error activating test user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

activateTestUser();