import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignAllPermissionsToSuperAdmin() {
  console.log('🔧 FIXING SUPER ADMIN: Assigning ALL permissions to Super Admin role...');
  console.log('=' .repeat(70));
  
  try {
    // Find Super Admin role
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'Super Admin' }
    });
    
    if (!superAdminRole) {
      throw new Error('Super Admin role not found!');
    }
    
    console.log(`✅ Found Super Admin role (ID: ${superAdminRole.id})`);
    
    // Get ALL permissions
    const allPermissions = await prisma.permission.findMany({
      select: { id: true, name: true }
    });
    
    console.log(`📋 Total permissions in database: ${allPermissions.length}`);
    
    // Clear existing permissions for Super Admin role
    await prisma.rolePermission.deleteMany({
      where: { roleId: superAdminRole.id }
    });
    
    console.log(`🗑️ Cleared existing Super Admin permissions`);
    
    // Assign ALL permissions to Super Admin
    const permissionAssignments = allPermissions.map(permission => ({
      roleId: superAdminRole.id,
      permissionId: permission.id
    }));
    
    await prisma.rolePermission.createMany({
      data: permissionAssignments,
      skipDuplicates: true
    });
    
    console.log(`✅ Assigned ALL ${allPermissions.length} permissions to Super Admin role`);
    
    // Verify the assignment
    const assignedCount = await prisma.rolePermission.count({
      where: { roleId: superAdminRole.id }
    });
    
    console.log(`🔍 Verification: Super Admin now has ${assignedCount} permissions`);
    
    if (assignedCount === allPermissions.length) {
      console.log('🎉 SUCCESS: Super Admin has ALL permissions!');
    } else {
      console.log('❌ ERROR: Permission count mismatch!');
    }
    
    // Show User 1 status
    const user1Account = await prisma.account.findUnique({
      where: { email: '1@1.com' },
      include: { 
        users: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (user1Account?.users[0]) {
      const user = user1Account.users[0];
      const totalUserPermissions = user.roles.reduce((count, userRole) => 
        count + userRole.role.permissions.length, 0
      );
      
      console.log(`\n👤 USER STATUS:`);
      console.log(`   Email: ${user1Account.email}`);
      console.log(`   Roles: ${user.roles.map(ur => ur.role.name).join(', ')}`);
      console.log(`   Total Permissions: ${totalUserPermissions}`);
      
      if (totalUserPermissions === allPermissions.length) {
        console.log(`   Status: ✅ FULL ACCESS - User has ALL permissions!`);
      } else {
        console.log(`   Status: ❌ LIMITED ACCESS - Missing permissions!`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing Super Admin permissions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 SUPER ADMIN FIX: Ensuring Complete Permission Access');
  console.log('=' .repeat(70));
  
  await assignAllPermissionsToSuperAdmin();
  
  console.log('\n🎯 SUMMARY:');
  console.log('   - Super Admin role now has ALL permissions');
  console.log('   - User 1@1.com should have complete admin access');
  console.log('   - No more "Access Denied" errors');
  console.log('\n✅ FIXED: Super Admin has complete access!');
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default main; 