import fs from 'fs';

const schemaContent = fs.readFileSync('prisma/schema.prisma', 'utf-8');
const lines = schemaContent.split('\n');

interface TableInfo {
  name: string;
  hasUuid: boolean;
  uuidPosition: number;
  hasUniqueUuid: boolean;
  fields: string[];
}

const tables: TableInfo[] = [];
let currentTable: TableInfo | null = null;
let fieldIndex = 0;

for (const line of lines) {
  if (line.includes('model ')) {
    if (currentTable) {
      tables.push(currentTable);
    }
    const tableName = line.split(' ')[1];
    currentTable = {
      name: tableName,
      hasUuid: false,
      uuidPosition: -1,
      hasUniqueUuid: false,
      fields: []
    };
    fieldIndex = 0;
  } else if (currentTable && line.trim() && !line.includes('}') && !line.includes('@@')) {
    const trimmedLine = line.trim();
    if (trimmedLine.includes(' ')) {
      fieldIndex++;
      currentTable.fields.push(trimmedLine);
      
      if (trimmedLine.includes('uuid') && trimmedLine.includes('String')) {
        currentTable.hasUuid = true;
        currentTable.uuidPosition = fieldIndex;
        currentTable.hasUniqueUuid = trimmedLine.includes('@unique');
      }
    }
  } else if (line.includes('}') && currentTable) {
    tables.push(currentTable);
    currentTable = null;
    fieldIndex = 0;
  }
}

console.log('=== UUID Audit Report ===\n');

console.log('Tables WITHOUT UUID (❌ Need UUID):');
const tablesWithoutUuid = tables.filter(t => !t.hasUuid);
tablesWithoutUuid.forEach(t => {
  console.log(`  - ${t.name}`);
});

console.log('\nTables WITH UUID but NOT in position 2 (⚠️ Need repositioning):');
const tablesWithWrongPosition = tables.filter(t => t.hasUuid && t.uuidPosition !== 2);
tablesWithWrongPosition.forEach(t => {
  console.log(`  - ${t.name} (current position: ${t.uuidPosition})`);
});

console.log('\nTables WITH UUID but NOT unique (⚠️ Need unique constraint):');
const tablesWithoutUnique = tables.filter(t => t.hasUuid && !t.hasUniqueUuid);
tablesWithoutUnique.forEach(t => {
  console.log(`  - ${t.name}`);
});

console.log('\nTables COMPLIANT (✅):');
const compliantTables = tables.filter(t => t.hasUuid && t.uuidPosition === 2 && t.hasUniqueUuid);
compliantTables.forEach(t => {
  console.log(`  - ${t.name}`);
});

// Generate migration SQL
console.log('\n=== Required Migrations ===\n');

// For User table specifically (as mentioned)
const userTable = tables.find(t => t.name === 'User');
if (userTable && (!userTable.hasUniqueUuid || userTable.uuidPosition !== 2)) {
  console.log('-- User table needs UUID as unique identifier in position 2');
  console.log('-- This requires table recreation due to column order requirement\n');
}

// Summary
console.log('\n=== Summary ===');
console.log(`Total tables: ${tables.length}`);
console.log(`Tables without UUID: ${tablesWithoutUuid.length}`);
console.log(`Tables with UUID in wrong position: ${tablesWithWrongPosition.length}`);
console.log(`Tables with UUID but not unique: ${tablesWithoutUnique.length}`);
console.log(`Compliant tables: ${compliantTables.length}`);