/**
 * UUID Type Migration Script
 * 
 * This script safely migrates String UUID columns to proper PostgreSQL UUID type
 * 
 * IMPORTANT: 
 * 1. BACKUP YOUR DATABASE BEFORE RUNNING THIS SCRIPT
 * 2. Run this during a maintenance window
 * 3. This script validates all UUIDs before conversion
 * 
 * Usage: npx tsx scripts/migrate-uuid-types.ts
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/lib/logger';

const prisma = new PrismaClient();

interface UUIDMigration {
  table: string;
  column: string;
  hasIndex: boolean;
  isUnique: boolean;
}

const UUID_MIGRATIONS: UUIDMigration[] = [
  { table: 'Tenant', column: 'uuid', hasIndex: false, isUnique: true },
  { table: 'Account', column: 'uuid', hasIndex: true, isUnique: false },
  { table: 'User', column: 'uuid', hasIndex: true, isUnique: true },
  { table: 'Role', column: 'uuid', hasIndex: true, isUnique: true },
  { table: 'Permission', column: 'uuid', hasIndex: true, isUnique: true },
  { table: 'PermissionAudit', column: 'uuid', hasIndex: true, isUnique: true },
  { table: 'PermissionAudit', column: 'requestid', hasIndex: false, isUnique: false },
  { table: 'OptionSet', column: 'uuid', hasIndex: true, isUnique: false },
  { table: 'OptionValue', column: 'uuid', hasIndex: true, isUnique: false },
  { table: 'Category', column: 'uuid', hasIndex: true, isUnique: false },
  { table: 'Tag', column: 'uuid', hasIndex: true, isUnique: false },
  { table: 'SubscriptionPlan', column: 'uuid', hasIndex: false, isUnique: true },
  { table: 'Feature', column: 'uuid', hasIndex: false, isUnique: true },
  { table: 'saved_searches', column: 'uuid', hasIndex: false, isUnique: false },
  { table: 'user_activity_logs', column: 'sessionId', hasIndex: true, isUnique: false },
];

async function validateUUID(value: string | null): Promise<boolean> {
  if (!value) return true; // NULL is valid
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

async function migrateUUIDColumn(migration: UUIDMigration): Promise<void> {
  const { table, column, hasIndex, isUnique } = migration;
  
  try {
    logger.info(`Starting migration for ${table}.${column}`);
    
    // Step 1: Validate all existing UUIDs
    const invalidCount = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`
      SELECT COUNT(*) as count 
      FROM "${table}" 
      WHERE ${column} IS NOT NULL 
      AND ${column} !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    `);
    
    if (Number(invalidCount[0].count) > 0) {
      logger.error(`Found ${invalidCount[0].count} invalid UUIDs in ${table}.${column}`);
      throw new Error(`Invalid UUIDs found in ${table}.${column}`);
    }
    
    // Step 2: Create a temporary column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "${table}" 
      ADD COLUMN IF NOT EXISTS ${column}_new UUID
    `);
    
    // Step 3: Copy and convert data
    await prisma.$executeRawUnsafe(`
      UPDATE "${table}" 
      SET ${column}_new = ${column}::uuid 
      WHERE ${column} IS NOT NULL
    `);
    
    // Step 4: Drop old column and rename new one
    await prisma.$transaction([
      // Drop any indexes on the old column
      ...(hasIndex ? [prisma.$executeRawUnsafe(`
        DROP INDEX IF EXISTS "${table}_${column}_idx"
      `)] : []),
      
      // Drop the old column
      prisma.$executeRawUnsafe(`
        ALTER TABLE "${table}" 
        DROP COLUMN ${column}
      `),
      
      // Rename the new column
      prisma.$executeRawUnsafe(`
        ALTER TABLE "${table}" 
        RENAME COLUMN ${column}_new TO ${column}
      `),
      
      // Add constraints back
      ...(isUnique ? [prisma.$executeRawUnsafe(`
        ALTER TABLE "${table}" 
        ADD CONSTRAINT "${table}_${column}_key" UNIQUE (${column})
      `)] : []),
      
      // Recreate indexes
      ...(hasIndex ? [prisma.$executeRawUnsafe(`
        CREATE INDEX "${table}_${column}_idx" ON "${table}" (${column})
      `)] : []),
    ]);
    
    logger.info(`✅ Successfully migrated ${table}.${column}`);
    
  } catch (error) {
    logger.error(`❌ Failed to migrate ${table}.${column}:`, error);
    throw error;
  }
}

async function updateDefaultValues(): Promise<void> {
  logger.info('Updating default value generation...');
  
  // Update tables that use uuid() to use gen_random_uuid()
  const updates = [
    `ALTER TABLE "Tenant" ALTER COLUMN uuid SET DEFAULT gen_random_uuid()`,
    `ALTER TABLE "Account" ALTER COLUMN uuid SET DEFAULT gen_random_uuid()`,
    `ALTER TABLE "User" ALTER COLUMN uuid SET DEFAULT gen_random_uuid()`,
    `ALTER TABLE "OptionSet" ALTER COLUMN uuid SET DEFAULT gen_random_uuid()`,
    `ALTER TABLE "OptionValue" ALTER COLUMN uuid SET DEFAULT gen_random_uuid()`,
    `ALTER TABLE "Category" ALTER COLUMN uuid SET DEFAULT gen_random_uuid()`,
    `ALTER TABLE "Tag" ALTER COLUMN uuid SET DEFAULT gen_random_uuid()`,
    `ALTER TABLE "SubscriptionPlan" ALTER COLUMN uuid SET DEFAULT gen_random_uuid()`,
    `ALTER TABLE "Feature" ALTER COLUMN uuid SET DEFAULT gen_random_uuid()`,
    `ALTER TABLE "SavedSearch" ALTER COLUMN uuid SET DEFAULT gen_random_uuid()`,
  ];
  
  for (const update of updates) {
    try {
      await prisma.$executeRawUnsafe(update);
      logger.info(`✅ ${update}`);
    } catch (error) {
      logger.error(`❌ Failed: ${update}`, error);
    }
  }
}

async function main() {
  try {
    logger.info('🚀 Starting UUID type migration...');
    logger.info('⚠️  Make sure you have backed up your database!');
    
    // Check if we're in production
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Running in production mode. Please confirm you have a backup.');
      // In a real scenario, you might want to add a confirmation prompt here
    }
    
    // Run migrations
    for (const migration of UUID_MIGRATIONS) {
      await migrateUUIDColumn(migration);
    }
    
    // Update default values
    await updateDefaultValues();
    
    logger.info('✅ UUID migration completed successfully!');
    logger.info('📝 Next steps:');
    logger.info('1. Replace prisma/schema.prisma with prisma/schema-uuid-corrected.prisma');
    logger.info('2. Run: npx prisma generate');
    logger.info('3. Test your application thoroughly');
    
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});