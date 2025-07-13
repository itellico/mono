#!/usr/bin/env tsx

/**
 * Direct BigInt to Int Migration Script
 * 
 * Creates a proper migration to convert existing bigint columns to integer
 * in the current database structure.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import { logger } from '@/lib/logger';

const execAsync = promisify(exec);

async function createDirectMigration(): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
  const migrationName = `${timestamp}_optimize_account_id_bigint_to_int`;
  
  const migrationSQL = `-- Convert accounts.id from bigint to integer
-- Convert users.account_id from bigint to integer
-- This optimizes storage and performance for these key fields

BEGIN;

-- Step 1: Drop foreign key constraint
ALTER TABLE users DROP CONSTRAINT users_account_id_accounts_id_fk;

-- Step 2: Create new integer columns
ALTER TABLE accounts ADD COLUMN id_temp INTEGER;
ALTER TABLE users ADD COLUMN account_id_temp INTEGER;

-- Step 3: Copy existing data (convert bigint to int)
UPDATE accounts SET id_temp = id::INTEGER;
UPDATE users SET account_id_temp = account_id::INTEGER;

-- Step 4: Drop old sequences and create new ones
DROP SEQUENCE IF EXISTS accounts_id_seq CASCADE;
DROP SEQUENCE IF EXISTS users_id_seq CASCADE;

-- Step 5: Drop old columns and rename new ones
ALTER TABLE accounts DROP COLUMN id;
ALTER TABLE users DROP COLUMN account_id;

ALTER TABLE accounts RENAME COLUMN id_temp TO id;
ALTER TABLE users RENAME COLUMN account_id_temp TO account_id;

-- Step 6: Create new sequences with proper type
CREATE SEQUENCE accounts_id_seq AS INTEGER OWNED BY accounts.id;
CREATE SEQUENCE users_id_seq AS BIGINT OWNED BY users.id;

-- Step 7: Set sequence values and defaults
SELECT setval('accounts_id_seq', COALESCE(MAX(id), 0) + 1, false) FROM accounts;
ALTER TABLE accounts ALTER COLUMN id SET DEFAULT nextval('accounts_id_seq');

-- Step 8: Set NOT NULL constraints
ALTER TABLE accounts ALTER COLUMN id SET NOT NULL;
ALTER TABLE users ALTER COLUMN account_id SET NOT NULL;

-- Step 9: Recreate primary key and foreign key constraints
ALTER TABLE accounts ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);
ALTER TABLE users ADD CONSTRAINT users_account_id_accounts_id_fk 
  FOREIGN KEY (account_id) REFERENCES accounts(id);

COMMIT;

-- Verify the changes
SELECT 
  'accounts' as table_name,
  'id' as column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'accounts' AND column_name = 'id'
UNION ALL
SELECT 
  'users' as table_name,
  'account_id' as column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'account_id';
`;

  const migrationDir = 'prisma/migrations';
  const migrationPath = `${migrationDir}/${migrationName}`;
  
  // Create migration directory
  await execAsync(`mkdir -p ${migrationPath}`);
  
  // Write migration file
  await fs.writeFile(`${migrationPath}/migration.sql`, migrationSQL);
  
  logger.info('📝 Direct migration file created', { path: `${migrationPath}/migration.sql` });
  
  return migrationPath;
}

async function main() {
  try {
    logger.info('🚀 Creating direct BigInt to Int migration...');
    
    const migrationPath = await createDirectMigration();
    
    console.log('\n✅ DIRECT MIGRATION CREATED');
    console.log('='.repeat(50));
    console.log('Migration path:', migrationPath);
    console.log('\nTo apply this migration:');
    console.log('npx prisma migrate dev');
    
    logger.info('✅ Direct migration created successfully', { migrationPath });
    
  } catch (error) {
    logger.error('❌ Failed to create direct migration', { error });
    throw error;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('Direct migration script crashed', { error });
    process.exit(1);
  });
}

export { createDirectMigration }; 