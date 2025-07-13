import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRoleNameMismatch() {
  console.log('🔧 FIXING ROLE NAME MISMATCH');
  console.log('=' .repeat(50));

  try {
    // Get user 1@1.com
    const account = await prisma.account.findUnique({
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

    if (!account || !account.users[0]) {
      console.error('❌ User 1@1.com not found!');
      return;
    }

    const user = account.users[0];
    console.log(`📋 Current user roles:`);
    user.roles.forEach(ur => console.log(`   - '${ur.role.name}' (ID: ${ur.role.id})`));

    // Find the correct super_admin role (with underscore)
    const correctSuperAdminRole = await prisma.role.findUnique({
      where: { name: 'super_admin' }
    });

    if (!correctSuperAdminRole) {
      console.error('❌ super_admin role not found!');
      return;
    }

    console.log(`\n🎯 Target role: '${correctSuperAdminRole.name}' (ID: ${correctSuperAdminRole.id})`);

    // Check if user already has the correct role
    const hasCorrectRole = user.roles.some(ur => ur.role.name === 'super_admin');
    
    if (hasCorrectRole) {
      console.log('✅ User already has super_admin role!');
    } else {
      // Remove incorrect roles and add correct one
      console.log('\n🔄 Updating user roles...');
      
      // Remove all existing roles
      await prisma.userRole.deleteMany({
        where: { userId: user.id }
      });
      console.log('   ✅ Removed old roles');

      // Add correct super_admin role
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: correctSuperAdminRole.id
        }
      });
      console.log('   ✅ Added super_admin role');
    }

    // Verify the fix
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          include: { role: true }
        }
      }
    });

    console.log('\n📊 VERIFICATION:');
    console.log('✅ Updated user roles:');
    updatedUser?.roles.forEach(ur => console.log(`   - '${ur.role.name}'`));

    // Check middleware compatibility
    const middlewareRoles = ['super_admin', 'tenant_admin', 'content_moderator'];
    const userRoleNames = updatedUser?.roles.map(ur => ur.role.name) || [];
    const hasAdminRole = userRoleNames.some(role => middlewareRoles.includes(role));

    console.log(`\n🔍 Middleware compatibility check:`);
    console.log(`   Expected: [${middlewareRoles.join(', ')}]`);
    console.log(`   User has: [${userRoleNames.join(', ')}]`);
    console.log(`   Compatible: ${hasAdminRole ? '✅ YES' : '❌ NO'}`);

    if (hasAdminRole) {
      console.log('\n🎉 SUCCESS! Role mismatch fixed!');
      console.log('   User 1@1.com should now have admin access');
      console.log('   The middleware should accept the super_admin role');
    } else {
      console.log('\n❌ FAILED! Role mismatch not fixed');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ ERROR fixing role mismatch:', errorMessage);
  } finally {
    await prisma.$disconnect();
  }
}

fixRoleNameMismatch(); 