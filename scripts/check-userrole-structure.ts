import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserRoleStructure() {
  try {
    console.log('🔍 Checking UserRole table structure...');
    
    // Check UserRole table columns
    const userRoleColumns = await prisma.$queryRaw<Array<{ column_name: string, data_type: string }>>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'UserRole' 
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 UserRole table columns:');
    userRoleColumns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRoleStructure();