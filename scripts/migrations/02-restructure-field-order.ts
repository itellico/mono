#!/usr/bin/env tsx

/**
 * Migration Script: Restructure Tables with Proper Field Ordering
 * 
 * This script restructures all tables to follow the standard field order:
 * 1. UUID (primary key)
 * 2. ID (unique auto-increment)
 * 3. Foreign keys (tenantId, accountId, userId)
 * 4. Core fields
 * 5. Timestamps
 * 
 * Phase 2 of the database standardization project.
 * 
 * WARNING: This is a MAJOR migration that recreates tables.
 * Must be run during maintenance window with full backup.
 */

import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface TableInfo {
  tableName: string;
  columns: ColumnInfo[];
  constraints: ConstraintInfo[];
  indexes: IndexInfo[];
  foreignKeys: ForeignKeyInfo[];
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
}

interface ConstraintInfo {
  constraint_name: string;
  constraint_type: string;
  column_name: string;
}

interface IndexInfo {
  indexname: string;
  indexdef: string;
}

interface ForeignKeyInfo {
  constraint_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
}

// Define proper field order
const FIELD_ORDER = [
  // 1. Identifiers
  'uuid',
  'id',
  
  // 2. Foreign keys (hierarchical order)
  'tenantId',
  'accountId', 
  'userId',
  'parentId',
  
  // 3. Core business fields
  'name',
  'code',
  'slug',
  'displayName',
  'title',
  'description',
  
  // 4. Type/Status fields
  'type',
  'status',
  'state',
  'tier',
  'level',
  'priority',
  
  // 5. Configuration
  'settings',
  'metadata',
  'config',
  'options',
  
  // 6. Flags
  'isActive',
  'isSystem',
  'isDefault',
  'isPublic',
  'isLocked',
  'isDeleted',
  
  // 7. Audit fields
  'createdBy',
  'updatedBy',
  'deletedBy',
  'approvedBy',
  
  // 8. Timestamps (always last)
  'createdAt',
  'updatedAt',
  'deletedAt',
  'publishedAt',
  'expiresAt'
];

async function getTableInfo(tableName: string): Promise<TableInfo> {
  // Get columns
  const columns = await prisma.$queryRaw<ColumnInfo[]>`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length
    FROM information_schema.columns
    WHERE table_name = ${tableName}
    ORDER BY ordinal_position;
  `;
  
  // Get constraints
  const constraints = await prisma.$queryRaw<ConstraintInfo[]>`
    SELECT 
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = ${tableName};
  `;
  
  // Get indexes
  const indexes = await prisma.$queryRaw<IndexInfo[]>`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = ${tableName};
  `;
  
  // Get foreign keys
  const foreignKeys = await prisma.$queryRaw<ForeignKeyInfo[]>`
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = ${tableName}
    AND tc.constraint_type = 'FOREIGN KEY';
  `;
  
  return { tableName, columns, constraints, indexes, foreignKeys };
}

function getFieldOrder(fieldName: string): number {
  const index = FIELD_ORDER.indexOf(fieldName);
  if (index !== -1) return index;
  
  // Check patterns
  if (fieldName.endsWith('Id')) return 5; // Foreign keys
  if (fieldName.startsWith('is')) return 50; // Flags
  if (fieldName.endsWith('At')) return 90; // Timestamps
  if (fieldName.endsWith('By')) return 80; // Audit fields
  
  return 60; // Default: middle
}

function sortColumns(columns: ColumnInfo[]): ColumnInfo[] {
  return columns.sort((a, b) => {
    const orderA = getFieldOrder(a.column_name);
    const orderB = getFieldOrder(b.column_name);
    
    if (orderA !== orderB) return orderA - orderB;
    
    // If same category, sort alphabetically
    return a.column_name.localeCompare(b.column_name);
  });
}

function generateCreateTableSQL(table: TableInfo, sortedColumns: ColumnInfo[]): string {
  let sql = `CREATE TABLE "${table.tableName}_new" (\n`;
  
  // Add columns in proper order
  const columnDefs = sortedColumns.map(col => {
    let def = `  "${col.column_name}" ${col.data_type}`;
    
    // Add length for varchar
    if (col.character_maximum_length) {
      def += `(${col.character_maximum_length})`;
    }
    
    // Add NOT NULL
    if (col.is_nullable === 'NO') {
      def += ' NOT NULL';
    }
    
    // Add DEFAULT
    if (col.column_default) {
      def += ` DEFAULT ${col.column_default}`;
    }
    
    return def;
  });
  
  sql += columnDefs.join(',\n');
  
  // Add constraints
  const primaryKey = table.constraints.find(c => c.constraint_type === 'PRIMARY KEY');
  if (primaryKey) {
    sql += `,\n  CONSTRAINT "${primaryKey.constraint_name}_new" PRIMARY KEY ("${primaryKey.column_name}")`;
  }
  
  // Add unique constraints
  const uniqueConstraints = table.constraints.filter(c => c.constraint_type === 'UNIQUE');
  for (const unique of uniqueConstraints) {
    sql += `,\n  CONSTRAINT "${unique.constraint_name}_new" UNIQUE ("${unique.column_name}")`;
  }
  
  sql += '\n);';
  
  return sql;
}

async function restructureTables() {
  console.log('🚀 Starting table restructuring migration...\n');
  
  const migrationSQL: string[] = [];
  const rollbackSQL: string[] = [];
  
  try {
    // Get all user tables
    const tables = await prisma.$queryRaw<Array<{table_name: string}>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '\\_%'
      ORDER BY table_name;
    `;
    
    console.log(`Found ${tables.length} tables to analyze\n`);
    
    for (const { table_name } of tables) {
      console.log(`Analyzing ${table_name}...`);
      
      const tableInfo = await getTableInfo(table_name);
      const sortedColumns = sortColumns(tableInfo.columns);
      
      // Check if reordering is needed
      const needsReorder = tableInfo.columns.some((col, index) => 
        col.column_name !== sortedColumns[index].column_name
      );
      
      if (!needsReorder) {
        console.log(`  ✅ ${table_name} already has correct field order\n`);
        continue;
      }
      
      console.log(`  ⚠️  ${table_name} needs field reordering`);
      
      // Generate migration SQL
      migrationSQL.push(`-- Restructure table: ${table_name}`);
      migrationSQL.push('BEGIN;');
      
      // 1. Create new table with correct structure
      const createSQL = generateCreateTableSQL(tableInfo, sortedColumns);
      migrationSQL.push(createSQL);
      
      // 2. Copy data
      const columnNames = sortedColumns.map(c => `"${c.column_name}"`).join(', ');
      migrationSQL.push(`INSERT INTO "${table_name}_new" (${columnNames})`);
      migrationSQL.push(`SELECT ${columnNames} FROM "${table_name}";`);
      
      // 3. Add foreign keys
      for (const fk of tableInfo.foreignKeys) {
        migrationSQL.push(
          `ALTER TABLE "${table_name}_new" ` +
          `ADD CONSTRAINT "${fk.constraint_name}_new" ` +
          `FOREIGN KEY ("${fk.column_name}") ` +
          `REFERENCES "${fk.foreign_table_name}"("${fk.foreign_column_name}");`
        );
      }
      
      // 4. Recreate indexes
      for (const index of tableInfo.indexes) {
        if (!index.indexname.includes('pkey') && !index.indexname.includes('key')) {
          const newIndexDef = index.indexdef.replace(table_name, `${table_name}_new`);
          migrationSQL.push(newIndexDef.replace(index.indexname, `${index.indexname}_new`) + ';');
        }
      }
      
      // 5. Rename tables
      migrationSQL.push(`ALTER TABLE "${table_name}" RENAME TO "${table_name}_old";`);
      migrationSQL.push(`ALTER TABLE "${table_name}_new" RENAME TO "${table_name}";`);
      
      // 6. Drop old table
      migrationSQL.push(`DROP TABLE "${table_name}_old" CASCADE;`);
      
      migrationSQL.push('COMMIT;\n');
      
      // Generate rollback SQL
      rollbackSQL.push(`-- Rollback for ${table_name}`);
      rollbackSQL.push(`ALTER TABLE "${table_name}" RENAME TO "${table_name}_new";`);
      rollbackSQL.push(`ALTER TABLE "${table_name}_old" RENAME TO "${table_name}";`);
      rollbackSQL.push(`DROP TABLE "${table_name}_new" CASCADE;\n`);
      
      console.log(`  ✅ Generated migration SQL for ${table_name}\n`);
    }
    
    // Write migration files
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (migrationSQL.length > 0) {
      const migrationFile = join(process.cwd(), `migration_${timestamp}.sql`);
      writeFileSync(migrationFile, migrationSQL.join('\n'));
      console.log(`📄 Migration SQL written to: ${migrationFile}`);
      
      const rollbackFile = join(process.cwd(), `rollback_${timestamp}.sql`);
      writeFileSync(rollbackFile, rollbackSQL.join('\n'));
      console.log(`📄 Rollback SQL written to: ${rollbackFile}`);
    } else {
      console.log('✅ All tables already have correct field ordering!');
    }
    
  } catch (error) {
    console.error('❌ Migration analysis failed:', error);
    throw error;
  }
}

// Generate field ordering report
async function generateFieldOrderReport() {
  console.log('\n📊 Field Order Analysis Report');
  console.log('==============================\n');
  
  const tables = await prisma.$queryRaw<Array<{table_name: string}>>`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE '\\_%'
    ORDER BY table_name;
  `;
  
  let correctTables = 0;
  let incorrectTables = 0;
  
  for (const { table_name } of tables) {
    const columns = await prisma.$queryRaw<Array<{column_name: string, ordinal_position: number}>>`
      SELECT column_name, ordinal_position
      FROM information_schema.columns
      WHERE table_name = ${table_name}
      ORDER BY ordinal_position;
    `;
    
    const firstColumn = columns[0]?.column_name;
    const secondColumn = columns[1]?.column_name;
    
    const isCorrect = firstColumn === 'uuid' && secondColumn === 'id';
    
    if (isCorrect) {
      correctTables++;
      console.log(`✅ ${table_name}: Correct order (uuid, id, ...)`);
    } else {
      incorrectTables++;
      console.log(`❌ ${table_name}: Wrong order (${firstColumn}, ${secondColumn}, ...)`);
    }
  }
  
  console.log('\n📈 Summary:');
  console.log(`  Correct field order: ${correctTables}`);
  console.log(`  Incorrect field order: ${incorrectTables}`);
  console.log(`  Total tables: ${tables.length}`);
}

// Main function
async function main() {
  console.log('🔍 Table Field Order Restructuring\n');
  
  try {
    await prisma.$connect();
    
    // First generate report
    await generateFieldOrderReport();
    
    // Then generate migration scripts
    console.log('\n⚙️  Generating migration scripts...\n');
    await restructureTables();
    
    console.log('\n⚠️  IMPORTANT: Review generated SQL files before executing!');
    console.log('This migration will recreate tables and requires downtime.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();