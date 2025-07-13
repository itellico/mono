#!/usr/bin/env tsx

/**
 * Migration Script: Account.id BigInt → Int
 * 
 * Migrates Account.id and related foreign keys from BigInt to Int for better performance.
 * This is a high-priority optimization with low risk.
 * 
 * Usage: npx tsx scripts/migrate-account-id-to-int.ts
 * 
 * IMPORTANT: This script will modify the database schema. 
 * Always test on staging first and backup production data.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import { db as prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

const execAsync = promisify(exec);

const INT_MAX = 2147483647; // 2^31 - 1

interface MigrationResult {
  step: string;
  success: boolean;
  error?: string;
  timing?: number;
}

async function validatePreMigration(): Promise<boolean> {
  try {
    logger.info('🔍 Validating pre-migration conditions...');

    // Check max Account.id value
    const accountStats = await prisma.$queryRaw<Array<{max_id: bigint | null, count: bigint}>>`
      SELECT MAX(id) as max_id, COUNT(*) as count FROM "Account"
    `;

    const maxAccountId = accountStats[0].max_id ? Number(accountStats[0].max_id) : 0;
    const accountCount = Number(accountStats[0].count);

    logger.info('Account validation', { 
      maxId: maxAccountId, 
      count: accountCount, 
      intMax: INT_MAX 
    });

    if (maxAccountId > INT_MAX) {
      logger.error('❌ MIGRATION BLOCKED: Account.id exceeds Int max value', {
        maxAccountId,
        intMax: INT_MAX
      });
      return false;
    }

    // Check User.accountId values
    const userStats = await prisma.$queryRaw<Array<{max_account_id: bigint | null, count: bigint}>>`
      SELECT MAX("accountId") as max_account_id, COUNT(*) as count FROM "User"
    `;

    const maxUserAccountId = userStats[0].max_account_id ? Number(userStats[0].max_account_id) : 0;
    const userCount = Number(userStats[0].count);

    logger.info('User.accountId validation', { 
      maxAccountId: maxUserAccountId, 
      count: userCount 
    });

    if (maxUserAccountId > INT_MAX) {
      logger.error('❌ MIGRATION BLOCKED: User.accountId exceeds Int max value', {
        maxUserAccountId,
        intMax: INT_MAX
      });
      return false;
    }

    logger.info('✅ Pre-migration validation passed', {
      accountsToMigrate: accountCount,
      usersToMigrate: userCount,
      safetyMargin: `${((INT_MAX - Math.max(maxAccountId, maxUserAccountId)) / INT_MAX * 100).toFixed(1)}%`
    });

    return true;

  } catch (error) {
    logger.error('❌ Pre-migration validation failed', { error });
    return false;
  }
}

async function createMigrationFile(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
  const migrationName = `${timestamp}_migrate_account_id_to_int`;
  
  const migrationSQL = `-- Migration: Account.id BigInt → Int
-- Created: ${new Date().toISOString()}
-- Description: Optimize Account.id and User.accountId from BigInt to Int for better performance

BEGIN;

-- Step 1: Create new Int columns
ALTER TABLE "Account" ADD COLUMN "id_new" INTEGER;
ALTER TABLE "User" ADD COLUMN "accountId_new" INTEGER;

-- Step 2: Copy data to new columns
UPDATE "Account" SET "id_new" = "id"::INTEGER;
UPDATE "User" SET "accountId_new" = "accountId"::INTEGER;

-- Step 3: Verify data integrity
DO $$
DECLARE
    account_count_old INTEGER;
    account_count_new INTEGER;
    user_count_old INTEGER;
    user_count_new INTEGER;
BEGIN
    SELECT COUNT(*) INTO account_count_old FROM "Account" WHERE "id" IS NOT NULL;
    SELECT COUNT(*) INTO account_count_new FROM "Account" WHERE "id_new" IS NOT NULL;
    
    SELECT COUNT(*) INTO user_count_old FROM "User" WHERE "accountId" IS NOT NULL;
    SELECT COUNT(*) INTO user_count_new FROM "User" WHERE "accountId_new" IS NOT NULL;
    
    IF account_count_old != account_count_new THEN
        RAISE EXCEPTION 'Account migration data integrity check failed: % != %', account_count_old, account_count_new;
    END IF;
    
    IF user_count_old != user_count_new THEN
        RAISE EXCEPTION 'User migration data integrity check failed: % != %', user_count_old, user_count_new;
    END IF;
    
    RAISE NOTICE 'Data integrity check passed: Accounts=%, Users=%', account_count_new, user_count_new;
END $$;

-- Step 4: Drop foreign key constraints
ALTER TABLE "User" DROP CONSTRAINT "User_accountId_fkey";

-- Step 5: Drop old columns
ALTER TABLE "Account" DROP COLUMN "id";
ALTER TABLE "User" DROP COLUMN "accountId";

-- Step 6: Rename new columns
ALTER TABLE "Account" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "User" RENAME COLUMN "accountId_new" TO "accountId";

-- Step 7: Add constraints back
ALTER TABLE "Account" ADD CONSTRAINT "Account_pkey" PRIMARY KEY ("id");
ALTER TABLE "Account" ALTER COLUMN "id" SET NOT NULL;

ALTER TABLE "User" ALTER COLUMN "accountId" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_accountId_fkey" 
  FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 8: Create sequences for new Int columns
CREATE SEQUENCE IF NOT EXISTS "Account_id_seq" AS INTEGER;
SELECT setval('"Account_id_seq"', COALESCE(MAX("id"), 0) + 1, false) FROM "Account";
ALTER TABLE "Account" ALTER COLUMN "id" SET DEFAULT nextval('"Account_id_seq"');
ALTER SEQUENCE "Account_id_seq" OWNED BY "Account"."id";

-- Step 9: Recreate indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_accountId_idx" ON "User"("accountId");

COMMIT;

-- Verify final state
SELECT 
  'Account' as table_name,
  COUNT(*) as record_count,
  MAX("id") as max_id,
  pg_typeof(MAX("id")) as id_type
FROM "Account"
UNION ALL
SELECT 
  'User' as table_name,
  COUNT(*) as record_count,
  MAX("accountId") as max_id,
  pg_typeof(MAX("accountId")) as id_type
FROM "User";
`;

  const migrationDir = 'prisma/migrations';
  const migrationPath = `${migrationDir}/${migrationName}`;
  
  // Create migration directory
  await execAsync(`mkdir -p ${migrationPath}`);
  
  // Write migration file
  await fs.writeFile(`${migrationPath}/migration.sql`, migrationSQL);
  
  logger.info('📝 Migration file created', { path: `${migrationPath}/migration.sql` });
  
  return migrationPath;
}

async function validatePostMigration(): Promise<boolean> {
  try {
    logger.info('🔍 Validating post-migration state...');

    // Verify Account table structure
    const accountInfo = await prisma.$queryRaw<Array<{column_name: string, data_type: string}>>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Account' AND column_name = 'id'
    `;

    if (accountInfo[0]?.data_type !== 'integer') {
      logger.error('❌ Account.id is not integer type', { actualType: accountInfo[0]?.data_type });
      return false;
    }

    // Verify User table structure
    const userInfo = await prisma.$queryRaw<Array<{column_name: string, data_type: string}>>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User' AND column_name = 'accountId'
    `;

    if (userInfo[0]?.data_type !== 'integer') {
      logger.error('❌ User.accountId is not integer type', { actualType: userInfo[0]?.data_type });
      return false;
    }

    // Verify foreign key constraint exists
    const fkConstraint = await prisma.$queryRaw<Array<{constraint_name: string}>>`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'User' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%accountId%'
    `;

    if (fkConstraint.length === 0) {
      logger.error('❌ Foreign key constraint missing');
      return false;
    }

    // Verify data integrity
    const dataCheck = await prisma.$queryRaw<Array<{table_name: string, count: bigint, max_id: number}>>`
      SELECT 
        'Account' as table_name,
        COUNT(*) as count,
        MAX("id") as max_id
      FROM "Account"
      UNION ALL
      SELECT 
        'User' as table_name,
        COUNT(*) as count,
        MAX("accountId") as max_id
      FROM "User"
    `;

    logger.info('✅ Post-migration validation passed', { 
      accountIdType: accountInfo[0]?.data_type,
      userAccountIdType: userInfo[0]?.data_type,
      foreignKeyExists: fkConstraint.length > 0,
      dataIntegrity: dataCheck.map(row => ({
        table: row.table_name,
        records: Number(row.count),
        maxId: row.max_id
      }))
    });

    return true;

  } catch (error) {
    logger.error('❌ Post-migration validation failed', { error });
    return false;
  }
}

async function updatePrismaSchema(): Promise<void> {
  logger.info('🔧 Updating Prisma schema...');
  
  const schemaUpdates = `
IMPORTANT: Update your prisma/schema.prisma file:

1. Change Account.id from BigInt to Int:
   - id BigInt @id @default(autoincrement())
   + id Int @id @default(autoincrement())

2. Change User.accountId from BigInt to Int:
   - accountId BigInt
   + accountId Int

3. Run: npx prisma generate

After updating the schema, also update your TypeScript types if you have any 
custom interfaces that reference these ID fields.
`;

  console.log('\n📋 MANUAL STEPS REQUIRED:');
  console.log('=' + '='.repeat(50));
  console.log(schemaUpdates);
}

async function main() {
  const results: MigrationResult[] = [];

  try {
    logger.info('🚀 Starting Account.id BigInt → Int migration...');

    // Step 1: Validate pre-migration
    const preValidation = await validatePreMigration();
    if (!preValidation) {
      throw new Error('Pre-migration validation failed');
    }

    results.push({ step: 'Pre-migration Validation', success: true });

    // Step 2: Create migration file
    const migrationPath = await createMigrationFile();
    results.push({ step: 'Create Migration File', success: true });

    // Step 3: Confirmation prompt
    console.log('\n⚠️  MIGRATION READY');
    console.log('='.repeat(50));
    console.log('This will modify your database schema.');
    console.log('Make sure you have backups before proceeding.');
    console.log('\nTo apply the migration:');
    console.log('1. Review the migration file at:', migrationPath);
    console.log('2. Run: npx prisma migrate dev');
    console.log('3. Update Prisma schema manually (see instructions below)');
    
    // For safety, don't auto-run the migration
    logger.info('✅ Migration prepared successfully', { 
      migrationPath,
      nextSteps: 'Review and apply manually'
    });

    await updatePrismaSchema();

  } catch (error) {
    logger.error('❌ Migration preparation failed', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('Account.id migration script crashed', { error });
    process.exit(1);
  });
}

export { validatePreMigration, createMigrationFile, validatePostMigration }; 