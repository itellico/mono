/**
 * Check and Fix Invalid UUIDs Script
 * 
 * This script finds invalid UUIDs and fixes them before migration
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/lib/logger';

const prisma = new PrismaClient();

async function checkAndFixInvalidUUIDs() {
  try {
    logger.info('🔍 Checking for invalid UUIDs...');
    
    // Check Tenant table
    const invalidTenants = await prisma.$queryRaw<{ id: number; uuid: string }[]>`
      SELECT id, uuid 
      FROM "Tenant" 
      WHERE uuid !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    `;
    
    logger.info(`Found ${invalidTenants.length} invalid UUIDs in Tenant table`);
    
    if (invalidTenants.length > 0) {
      logger.info('Invalid UUIDs found:');
      invalidTenants.forEach(tenant => {
        logger.info(`  Tenant ID ${tenant.id}: "${tenant.uuid}"`);
      });
      
      // Fix invalid UUIDs
      for (const tenant of invalidTenants) {
        const newUuid = await prisma.$queryRaw<{ uuid: string }[]>`SELECT gen_random_uuid()::text as uuid`;
        const generatedUuid = newUuid[0].uuid;
        
        await prisma.$executeRaw`
          UPDATE "Tenant" 
          SET uuid = ${generatedUuid}::text 
          WHERE id = ${tenant.id}
        `;
        
        logger.info(`✅ Fixed Tenant ID ${tenant.id}: "${tenant.uuid}" → "${generatedUuid}"`);
      }
    }
    
    // Check other tables too
    const tables = [
      'Account', 'User', 'Role', 'Permission', 'PermissionAudit',
      'OptionSet', 'OptionValue', 'Category', 'Tag', 
      'SubscriptionPlan', 'Feature', 'SavedSearch'
    ];
    
    for (const table of tables) {
      const invalidRecords = await prisma.$queryRawUnsafe<{ id: number; uuid: string }[]>(`
        SELECT id, uuid 
        FROM "${table}" 
        WHERE uuid IS NOT NULL 
        AND uuid !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      `);
      
      if (invalidRecords.length > 0) {
        logger.info(`Found ${invalidRecords.length} invalid UUIDs in ${table} table`);
        
        for (const record of invalidRecords) {
          const newUuid = await prisma.$queryRaw<{ uuid: string }[]>`SELECT gen_random_uuid()::text as uuid`;
          const generatedUuid = newUuid[0].uuid;
          
          await prisma.$executeRawUnsafe(`
            UPDATE "${table}" 
            SET uuid = $1 
            WHERE id = $2
          `, generatedUuid, record.id);
          
          logger.info(`✅ Fixed ${table} ID ${record.id}: "${record.uuid}" → "${generatedUuid}"`);
        }
      } else {
        logger.info(`✅ ${table} table has valid UUIDs`);
      }
    }
    
    logger.info('🎉 All invalid UUIDs have been fixed!');
    
  } catch (error) {
    logger.error('❌ Failed to check/fix UUIDs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

async function main() {
  await checkAndFixInvalidUUIDs();
}