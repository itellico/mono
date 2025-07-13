import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if we have any accounts
    const accountCount = await prisma.account.count();
    console.log(`Total accounts in database: ${accountCount}`);

    // Try to find admin account
    const adminAccount = await prisma.account.findFirst({
      where: {
        email: 'admin@monoplatform.com'
      },
      include: {
        users: true
      }
    });

    if (adminAccount) {
      console.log('Admin account found:', adminAccount.email);
      console.log('Associated users:', adminAccount.users.length);
    } else {
      console.log('Admin account not found, creating...');
      
      // First ensure we have a tenant
      let tenant = await prisma.tenant.findFirst();
      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            name: 'Default Tenant',
            domain: 'localhost',
            isActive: true,
          }
        });
        console.log('Created default tenant');
      }
      
      // Create admin account
      const hashedPassword = await bcrypt.hash('Admin123!@#', 10);
      const newAdmin = await prisma.account.create({
        data: {
          email: 'admin@monoplatform.com',
          passwordHash: hashedPassword,
          emailVerified: true,
          tenantId: tenant.id,
          users: {
            create: {
              firstName: 'Admin',
              lastName: 'User',
              username: 'admin',
              accountRole: 'super_admin',
              canCreateProfiles: true,
              canManageAllProfiles: true,
              canAccessBilling: true,
              isActive: true,
              userHash: Buffer.from(`admin${Date.now()}`).toString('base64'),
            }
          }
        },
        include: {
          users: true
        }
      });
      
      console.log('Admin account created:', newAdmin.email);
      console.log('Admin user created:', newAdmin.users[0].username);
    }

    // List all accounts
    const allAccounts = await prisma.account.findMany({
      select: {
        id: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        users: {
          select: {
            username: true,
            accountRole: true,
          }
        }
      }
    });

    console.log('\nAll accounts:');
    allAccounts.forEach(account => {
      console.log(`- ${account.email} (ID: ${account.id}, Verified: ${account.emailVerified})`);
      account.users.forEach(user => {
        console.log(`  └─ User: ${user.username} (Role: ${user.accountRole})`);
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();