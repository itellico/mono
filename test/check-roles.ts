import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkRoles() {
  try {
    // Find all roles
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            permissions: true,
            users: true
          }
        }
      }
    });

    console.log('All roles in database:');
    roles.forEach(role => {
      console.log(`- ${role.name} (ID: ${role.id}, Permissions: ${role._count.permissions}, Users: ${role._count.users})`);
    });
    
    // Check for super_admin role specifically
    const superAdminRole = await prisma.role.findFirst({
      where: { 
        OR: [
          { name: 'super_admin' },
          { name: 'Super Admin' },
          { name: 'Super_Admin' }
        ]
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (superAdminRole) {
      console.log('\nFound super admin role:', superAdminRole.name);
      const permissions = superAdminRole.permissions.map(rp => rp.permission.name).sort();
      console.log('Total permissions:', permissions.length);
      
      // Check for categories permissions
      const categoryPerms = permissions.filter(p => p.includes('categor'));
      console.log('\nCategory-related permissions:', categoryPerms);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles();