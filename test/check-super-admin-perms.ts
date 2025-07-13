import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkSuperAdminPermissions() {
  try {
    // Find super admin role
    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'Super Admin' },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!superAdminRole) {
      console.log('Super Admin role not found!');
      return;
    }

    console.log('Super Admin Role ID:', superAdminRole.id);
    console.log('Super Admin Permissions:');
    
    const permissions = superAdminRole.permissions.map(rp => rp.permission.name).sort();
    console.log('Total permissions:', permissions.length);
    
    // Check for categories permissions
    const categoryPerms = permissions.filter(p => p.includes('categories'));
    console.log('\nCategory permissions:', categoryPerms);
    
    // Check if categories:read exists
    console.log('\nHas categories:read?', permissions.includes('categories:read'));
    
    // Show first 20 permissions
    console.log('\nFirst 20 permissions:');
    permissions.slice(0, 20).forEach(p => console.log(' -', p));
    
    // Check for the new permission format
    const newFormatPerms = permissions.filter(p => p.includes('.'));
    console.log('\nNew format permissions (with dots):', newFormatPerms.length);
    if (newFormatPerms.length > 0) {
      console.log('Examples:', newFormatPerms.slice(0, 5));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdminPermissions();