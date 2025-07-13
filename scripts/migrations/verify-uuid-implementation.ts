#!/usr/bin/env tsx

/**
 * UUID Implementation Verification Script
 * 
 * This script verifies that all models have proper UUID implementation:
 * - UUID field exists
 * - UUID is PostgreSQL UUID type (not string)
 * - UUID has proper constraints
 * - UUID is indexed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
}

interface ConstraintInfo {
  table_name: string;
  constraint_name: string;
  constraint_type: string;
}

interface IndexInfo {
  tablename: string;
  indexname: string;
  indexdef: string;
}

async function verifyUuidImplementation() {
  console.log('🔍 UUID Implementation Verification\n');
  
  try {
    // Get all tables
    const tables = await prisma.$queryRaw<Array<{table_name: string}>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log(`Found ${tables.length} tables to verify\n`);
    
    const issues: string[] = [];
    const warnings: string[] = [];
    let validTables = 0;
    
    for (const { table_name } of tables) {
      // Skip system tables
      if (table_name.startsWith('_') || table_name === 'migrations') {
        continue;
      }
      
      console.log(`Checking ${table_name}...`);
      
      // Check for UUID column
      const uuidColumns = await prisma.$queryRaw<ColumnInfo[]>`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = ${table_name}
        AND column_name = 'uuid';
      `;
      
      if (uuidColumns.length === 0) {
        issues.push(`❌ ${table_name}: Missing UUID column`);
        console.log(`  ❌ Missing UUID column`);
        continue;
      }
      
      const uuidCol = uuidColumns[0];
      
      // Check data type
      if (uuidCol.data_type !== 'uuid') {
        issues.push(`❌ ${table_name}: UUID column is ${uuidCol.data_type} (should be uuid)`);
        console.log(`  ❌ UUID is ${uuidCol.data_type} type (should be uuid)`);
      } else {
        console.log(`  ✅ UUID is proper PostgreSQL UUID type`);
      }
      
      // Check constraints
      const constraints = await prisma.$queryRaw<ConstraintInfo[]>`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = ${table_name}
        AND constraint_name LIKE '%uuid%';
      `;
      
      const hasUniqueConstraint = constraints.some(c => 
        c.constraint_type === 'UNIQUE' || c.constraint_type === 'PRIMARY KEY'
      );
      
      if (!hasUniqueConstraint) {
        warnings.push(`⚠️  ${table_name}: UUID has no unique constraint`);
        console.log(`  ⚠️  UUID has no unique constraint`);
      } else {
        console.log(`  ✅ UUID has unique constraint`);
      }
      
      // Check indexes
      const indexes = await prisma.$queryRaw<IndexInfo[]>`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = ${table_name}
        AND indexdef LIKE '%uuid%';
      `;
      
      if (indexes.length === 0) {
        warnings.push(`⚠️  ${table_name}: No index on UUID column`);
        console.log(`  ⚠️  No index on UUID column`);
      } else {
        console.log(`  ✅ UUID is indexed`);
      }
      
      // Check field order (UUID should be first)
      const allColumns = await prisma.$queryRaw<Array<{ordinal_position: number, column_name: string}>>`
        SELECT ordinal_position, column_name
        FROM information_schema.columns
        WHERE table_name = ${table_name}
        ORDER BY ordinal_position;
      `;
      
      if (allColumns[0]?.column_name !== 'uuid') {
        warnings.push(`⚠️  ${table_name}: UUID is not the first column (position ${allColumns.findIndex(c => c.column_name === 'uuid') + 1})`);
        console.log(`  ⚠️  UUID is not the first column`);
      } else {
        console.log(`  ✅ UUID is the first column`);
      }
      
      if (uuidCol.data_type === 'uuid' && uuidColumns.length > 0) {
        validTables++;
      }
      
      console.log('');
    }
    
    // Summary report
    console.log('\n📊 Verification Summary');
    console.log('======================');
    console.log(`Total tables checked: ${tables.length}`);
    console.log(`Tables with valid UUID: ${validTables}`);
    console.log(`Critical issues: ${issues.length}`);
    console.log(`Warnings: ${warnings.length}`);
    
    if (issues.length > 0) {
      console.log('\n❌ Critical Issues:');
      issues.forEach(issue => console.log(`  ${issue}`));
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach(warning => console.log(`  ${warning}`));
    }
    
    if (issues.length === 0 && warnings.length === 0) {
      console.log('\n✅ All tables have proper UUID implementation!');
    }
    
    // Generate SQL to fix issues
    if (issues.length > 0) {
      console.log('\n📝 SQL to fix critical issues:');
      console.log('================================');
      
      for (const issue of issues) {
        if (issue.includes('Missing UUID column')) {
          const tableName = issue.match(/^❌ ([^:]+):/)?.[1];
          if (tableName) {
            console.log(`\n-- Add UUID to ${tableName}`);
            console.log(`ALTER TABLE "${tableName}" ADD COLUMN "uuid" UUID DEFAULT gen_random_uuid() NOT NULL;`);
            console.log(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${tableName}_uuid_key" UNIQUE ("uuid");`);
            console.log(`CREATE INDEX "${tableName}_uuid_idx" ON "${tableName}" ("uuid");`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

// Run verification
async function main() {
  try {
    await prisma.$connect();
    await verifyUuidImplementation();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();