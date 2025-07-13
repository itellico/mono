import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugSession() {
  try {
    console.log('🔍 Debugging session data for user 1@1.com...');

    // Get the user with all related data
    const account = await prisma.account.findFirst({
      where: { email: '1@1.com' },
      include: {
        users: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!account) {
      console.log('❌ Account not found');
      return;
    }

    console.log('\n✅ Account found:');
    console.log('- Email:', account.email);
    console.log('- Account ID:', account.id);
    console.log('- Is active:', account.isActive);
    console.log('- Is verified:', account.isVerified);

    if (account.users.length > 0) {
      const user = account.users[0];
      console.log('\n👤 User details:');
      console.log('- User ID:', user.id);
      console.log('- Username:', user.username);
      console.log('- First name:', user.firstName);
      console.log('- Last name:', user.lastName);
      console.log('- User type:', user.userType);
      console.log('- Is active:', user.isActive);

      console.log('\n🔐 User roles:');
      if (user.roles && user.roles.length > 0) {
        user.roles.forEach((userRole, index) => {
          console.log(`${index + 1}. Role: ${userRole.role?.name}`);
          console.log(`   - Role ID: ${userRole.role?.id}`);
          console.log(`   - User Role ID: ${userRole.id}`);
          console.log(`   - Permissions: ${userRole.role?.permissions?.length || 0}`);
          if (userRole.role?.permissions && userRole.role.permissions.length > 0) {
            userRole.role.permissions.forEach((rp: any) => {
              console.log(`     * ${rp.permission?.name}`);
            });
          }
        });
      } else {
        console.log('   - No roles found');
      }

      // Show what the NextAuth session should contain
      console.log('\n📋 Expected NextAuth session structure:');
      console.log(JSON.stringify({
        user: {
          id: user.id.toString(),
          email: account.email,
          name: `${user.firstName} ${user.lastName}`,
          // This is what's missing:
          adminRole: user.roles?.[0]?.role?.name || null,
          userRole: user.roles?.[0]?.role?.name || null,
          enhancedRoles: user.roles?.map(ur => ur.role?.name) || [],
          tenantId: user.tenantId
        }
      }, null, 2));
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugSession().catch(console.error); 