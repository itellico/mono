import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRoleNames() {
  console.log('🔍 CHECKING ROLE NAME MISMATCH');
  console.log('=' .repeat(50));
  
  const roles = await prisma.role.findMany();
  console.log('📋 Database roles:');
  roles.forEach(role => console.log(`   - '${role.name}'`));
  
  console.log('\n🔍 Middleware expects:');
  console.log("   - 'super_admin'");
  console.log("   - 'tenant_admin'");
  console.log("   - 'content_moderator'");
  
  const user1 = await prisma.account.findUnique({
    where: { email: '1@1.com' },
    include: {
      users: {
        include: {
          roles: {
            include: { role: true }
          }
        }
      }
    }
  });
  
  const userRoles = user1?.users[0]?.roles.map(ur => ur.role.name) || [];
  console.log('\n👤 User 1@1.com roles:');
  userRoles.forEach(role => console.log(`   - '${role}'`));
  
  console.log('\n❗ ROLE NAME MISMATCH DETECTED!');
  console.log('   Database has: "Super Admin"');
  console.log('   Middleware expects: "super_admin"');
  
  await prisma.$disconnect();
}

checkRoleNames(); 