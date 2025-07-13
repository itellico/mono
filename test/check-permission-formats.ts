import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkPermissionFormats() {
  try {
    // Get all permissions
    const permissions = await prisma.permission.findMany({
      select: {
        name: true
      }
    });

    console.log('Total permissions:', permissions.length);
    
    // Check permission formats
    const colonPermissions = permissions.filter(p => p.name.includes(':'));
    const dotPermissions = permissions.filter(p => p.name.includes('.'));
    
    console.log('\nPermission formats:');
    console.log('- With colons (:):', colonPermissions.length);
    console.log('- With dots (.):', dotPermissions.length);
    
    if (colonPermissions.length > 0) {
      console.log('\nExamples with colons:');
      colonPermissions.slice(0, 5).forEach(p => console.log(' -', p.name));
    }
    
    if (dotPermissions.length > 0) {
      console.log('\nExamples with dots:');
      dotPermissions.slice(0, 5).forEach(p => console.log(' -', p.name));
    }
    
    // Check for specific permissions
    console.log('\nChecking for specific permissions:');
    console.log('- categories:read exists?', permissions.some(p => p.name === 'categories:read'));
    console.log('- categories.read exists?', permissions.some(p => p.name === 'categories.read'));
    console.log('- categories.manage.tenant exists?', permissions.some(p => p.name === 'categories.manage.tenant'));
    console.log('- categories.manage.global exists?', permissions.some(p => p.name === 'categories.manage.global'));
    
    // List all category-related permissions
    const categoryPerms = permissions.filter(p => p.name.toLowerCase().includes('categor'));
    console.log('\nAll category-related permissions:');
    categoryPerms.forEach(p => console.log(' -', p.name));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissionFormats();