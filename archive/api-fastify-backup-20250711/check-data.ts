import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    // Basic counts
    const counts = {
      accounts: await prisma.account.count(),
      users: await prisma.user.count(),
      tenants: await prisma.tenant.count(),
      roles: await prisma.role.count(),
      permissions: await prisma.permission.count(),
      tags: await prisma.tag.count(),
      categories: await prisma.category.count()
    };

    console.log('📊 Database Summary:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}`);
    });

    // Check for specific test account
    try {
      const testAccount = await prisma.account.findFirst({
        where: { email: '1@1.com' }
      });
      console.log('\n🔍 Test account (1@1.com):', testAccount ? 'Found' : 'Not found');
    } catch (e) {
      console.log('\n🔍 Test account (1@1.com): Error checking');
    }

    // List some accounts if they exist
    if (counts.accounts > 0) {
      const accounts = await prisma.account.findMany({
        take: 3,
        select: {
          email: true,
          isActive: true,
          tenantId: true
        }
      });
      console.log('\n📧 Sample accounts:');
      accounts.forEach(a => console.log(`   - ${a.email} (Active: ${a.isActive}, Tenant: ${a.tenantId})`));
    }

    // Check roles
    if (counts.roles > 0) {
      const roles = await prisma.role.findMany({
        select: { name: true }
      });
      console.log('\n👥 Available roles:');
      roles.forEach(r => console.log(`   - ${r.name}`));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();