import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTableStructure() {
  try {
    console.log('🔍 Checking table structures...');
    
    // Check Role table columns
    const roleColumns = await prisma.$queryRaw<Array<{ column_name: string, data_type: string }>>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Role' 
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Role table columns:');
    roleColumns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // Check if there are any roles
    const existingRoles = await prisma.$queryRaw<Array<{ id: number, name: string }>>`
      SELECT id, name FROM "Role" LIMIT 5
    `;
    
    console.log('\n👥 Existing roles:');
    if (existingRoles.length === 0) {
      console.log('   - No roles found');
    } else {
      existingRoles.forEach(role => {
        console.log(`   - ${role.name} (ID: ${role.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTableStructure();