// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserPermissions() {
  try {
    console.log('Checking user permissions for 1@1.com...');

    // First find the account by email
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
      console.log('❌ Account not found for 1@1.com');
      return;
    }

    console.log('✅ Account found:');
    console.log('- Email:', account.email);
    console.log('- Is active:', account.isActive);
    console.log('- Is verified:', account.isVerified);
    console.log('- Users count:', account.users.length);

    if (account.users.length === 0) {
      console.log('❌ No users found for this account');
      return;
    }

    // Check the first user (should be the main user)
    const user = account.users[0];
    console.log('\n👤 User details:');
    console.log('- ID:', user.id);
    console.log('- Username:', user.username);
    console.log('- Name:', `${user.firstName} ${user.lastName}`);
    console.log('- User type:', user.userType);
    console.log('- Is active:', user.isActive);
    console.log('- Is verified:', user.isVerified);
    
    if (user.roles && user.roles.length > 0) {
      console.log('\n📋 User roles and permissions:');
      user.roles.forEach((ur, index) => {
        console.log(`${index + 1}. Role: ${ur.role?.name}`);
        if (ur.role?.permissions && ur.role.permissions.length > 0) {
          console.log('   Permissions:');
          ur.role.permissions.forEach((rp) => {
            console.log(`   - ${rp.permission?.name}`);
          });
        } else {
          console.log('   - No permissions found for this role');
        }
      });
    } else {
      console.log('\n❌ No user roles found');
      console.log('This is likely why the admin panel shows "Checking permissions..."');
    }

    // Check if user has admin roles
    const hasAdminRoles = user.roles?.some((ur) => 
      ['super_admin', 'tenant_admin', 'content_moderator'].includes(ur.role?.name || '')
    );
    
    console.log('\n🔐 Admin access check:');
    console.log('- Has admin roles:', hasAdminRoles);
    if (hasAdminRoles) {
      const adminRoles = user.roles
        ?.filter((ur) => ['super_admin', 'tenant_admin', 'content_moderator'].includes(ur.role?.name || ''))
        ?.map((ur) => ur.role?.name);
      console.log('- Admin roles:', adminRoles);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPermissions().catch(console.error); 