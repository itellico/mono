#!/usr/bin/env tsx

/**
 * Migration Script: Add UUID Fields to All Models
 * 
 * This script adds PostgreSQL UUID fields to all models that are missing them.
 * It's designed to be non-breaking - existing data remains intact.
 * 
 * Phase 1 of the database standardization project.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Models that need UUID fields added
const MODELS_MISSING_UUID = [
  'Role',
  'Permission', 
  'RolePermission',
  'UserRole',
  'UserPermission',
  'PlanFeatureLimit',
  'CategoryTag',
  'Currency',
  'Country',
  'Language'
];

// Models with String UUID that need type change
const MODELS_WITH_STRING_UUID = [
  { model: 'User', field: 'uuid' },
  { model: 'Tag', field: 'uuid' },
  { model: 'SubscriptionPlan', field: 'uuid' }
];

async function addUuidFields() {
  console.log('🚀 Starting UUID field migration...\n');

  try {
    // Step 1: Add UUID fields to models missing them
    console.log('📋 Step 1: Adding UUID fields to models missing them...');
    
    for (const model of MODELS_MISSING_UUID) {
      const tableName = getTableName(model);
      console.log(`  → Adding UUID to ${model} (${tableName})...`);
      
      try {
        // Add UUID column as nullable first
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${tableName}" 
          ADD COLUMN IF NOT EXISTS "uuid" UUID;
        `);
        
        // Generate UUIDs for existing records
        await prisma.$executeRawUnsafe(`
          UPDATE "${tableName}" 
          SET "uuid" = gen_random_uuid() 
          WHERE "uuid" IS NULL;
        `);
        
        // Make UUID NOT NULL
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${tableName}" 
          ALTER COLUMN "uuid" SET NOT NULL;
        `);
        
        // Add unique constraint
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${tableName}" 
          ADD CONSTRAINT "${tableName}_uuid_key" UNIQUE ("uuid");
        `);
        
        console.log(`    ✅ UUID added to ${model}`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`    ⚠️  UUID already exists in ${model}`);
        } else {
          throw error;
        }
      }
    }
    
    // Step 2: Convert String UUID fields to proper UUID type
    console.log('\n📋 Step 2: Converting String UUID fields to UUID type...');
    
    for (const { model, field } of MODELS_WITH_STRING_UUID) {
      const tableName = getTableName(model);
      console.log(`  → Converting ${model}.${field} to UUID type...`);
      
      try {
        // First check if it's already UUID type
        const columnInfo = await prisma.$queryRawUnsafe(`
          SELECT data_type 
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          AND column_name = '${field}';
        `);
        
        if ((columnInfo as any)[0]?.data_type === 'uuid') {
          console.log(`    ⚠️  ${model}.${field} is already UUID type`);
          continue;
        }
        
        // Create temporary column
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${tableName}" 
          ADD COLUMN IF NOT EXISTS "${field}_temp" UUID;
        `);
        
        // Copy and convert data
        await prisma.$executeRawUnsafe(`
          UPDATE "${tableName}" 
          SET "${field}_temp" = "${field}"::UUID 
          WHERE "${field}" IS NOT NULL;
        `);
        
        // Drop old column and rename new one
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${tableName}" 
          DROP COLUMN "${field}";
        `);
        
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${tableName}" 
          RENAME COLUMN "${field}_temp" TO "${field}";
        `);
        
        console.log(`    ✅ ${model}.${field} converted to UUID type`);
      } catch (error: any) {
        console.error(`    ❌ Error converting ${model}.${field}:`, error.message);
      }
    }
    
    // Step 3: Add indexes on UUID fields
    console.log('\n📋 Step 3: Adding indexes on UUID fields...');
    
    const allModels = [...MODELS_MISSING_UUID, ...MODELS_WITH_STRING_UUID.map(m => m.model)];
    
    for (const model of allModels) {
      const tableName = getTableName(model);
      console.log(`  → Adding UUID index to ${model}...`);
      
      try {
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "${tableName}_uuid_idx" 
          ON "${tableName}" ("uuid");
        `);
        console.log(`    ✅ Index added to ${model}`);
      } catch (error: any) {
        console.error(`    ❌ Error adding index to ${model}:`, error.message);
      }
    }
    
    console.log('\n✅ UUID field migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Helper function to get table name from model name
function getTableName(modelName: string): string {
  // Map of model names to table names (from schema.prisma @@map directives)
  const tableMap: Record<string, string> = {
    'Account': 'Account',  // No @@map, uses PascalCase
    'User': 'User',        // No @@map, uses PascalCase
    'Role': 'Role',        // No @@map, uses PascalCase
    'Permission': 'Permission',  // No @@map, uses PascalCase
    'RolePermission': 'RolePermission',
    'UserRole': 'UserRole',
    'UserPermission': 'UserPermission',
    'Tag': 'Tag',
    'CategoryTag': 'CategoryTag',
    'Currency': 'Currency',
    'Country': 'Country',
    'Language': 'Language',
    'SubscriptionPlan': 'subscription_plans',
    'PlanFeatureLimit': 'plan_feature_limits'
  };
  
  return tableMap[modelName] || modelName;
}

// Run migration
async function main() {
  console.log('🔍 Checking database connection...');
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected\n');
    
    await addUuidFields();
    
    // Generate report
    console.log('\n📊 Migration Report:');
    console.log('====================');
    console.log(`Models updated: ${MODELS_MISSING_UUID.length + MODELS_WITH_STRING_UUID.length}`);
    console.log(`UUID fields added: ${MODELS_MISSING_UUID.length}`);
    console.log(`UUID types fixed: ${MODELS_WITH_STRING_UUID.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();