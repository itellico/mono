#!/usr/bin/env tsx

/**
 * Script to reorder Prisma schema fields according to best practices:
 * 1. uuid (always first)
 * 2. id 
 * 3. Foreign keys (hierarchical order)
 * 4. Core business fields
 * 5. Status/type fields
 * 6. Configuration/metadata
 * 7. Flags (isActive, etc)
 * 8. Audit fields (createdBy, updatedBy, deletedBy)
 * 9. Timestamps (createdAt, updatedAt, deletedAt)
 * 10. Relations
 * 11. Indexes
 */

import * as fs from 'fs';
import * as path from 'path';

const SCHEMA_PATH = path.join(__dirname, '../prisma/schema.prisma');

// Field ordering rules
const FIELD_ORDER = {
  // Identifiers (1-2)
  uuid: 1,
  id: 2,
  
  // Foreign keys (10-30)
  tenantId: 10,
  accountId: 11,
  userId: 12,
  roleId: 13,
  permissionId: 14,
  
  // Core fields (40-60)
  name: 40,
  code: 41,
  slug: 42,
  email: 43,
  username: 44,
  title: 45,
  displayName: 46,
  description: 47,
  
  // Status/Type (70-80)
  status: 70,
  type: 71,
  level: 72,
  tier: 73,
  category: 74,
  
  // Configuration (90-100)
  settings: 90,
  metadata: 91,
  config: 92,
  options: 93,
  
  // Flags (110-120)
  isActive: 110,
  isSystem: 111,
  isDefault: 112,
  isPublic: 113,
  isVerified: 114,
  
  // Audit fields (130-140)
  createdBy: 130,
  updatedBy: 131,
  deletedBy: 132,
  approvedBy: 133,
  
  // Timestamps (150-160)
  createdAt: 150,
  updatedAt: 151,
  deletedAt: 152,
  publishedAt: 153,
  
  // Relations start at 200
  // Indexes start at 300
};

interface Field {
  name: string;
  definition: string;
  order: number;
  isRelation: boolean;
  isIndex: boolean;
}

function parseModel(modelContent: string): {
  name: string;
  fields: Field[];
  indexes: string[];
} {
  const lines = modelContent.split('\n');
  const modelNameMatch = lines[0].match(/^model\s+(\w+)\s*{/);
  const modelName = modelNameMatch ? modelNameMatch[1] : '';
  
  const fields: Field[] = [];
  const indexes: string[] = [];
  
  for (let i = 1; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('//')) continue;
    
    if (line.startsWith('@@')) {
      indexes.push(line);
      continue;
    }
    
    // Parse field
    const fieldMatch = line.match(/^(\w+)\s+(\w+.*?)$/);
    if (fieldMatch) {
      const fieldName = fieldMatch[1];
      const fieldDef = fieldMatch[2];
      
      // Check if it's a relation
      const isRelation = fieldDef.includes('@relation') || 
                        !fieldDef.includes('@') && 
                        (fieldDef.match(/^\w+(\[\])?$/) || fieldDef.includes('?'));
      
      const order = FIELD_ORDER[fieldName] || 
                   (isRelation ? 200 : 100) + fields.length;
      
      fields.push({
        name: fieldName,
        definition: line,
        order,
        isRelation,
        isIndex: false
      });
    }
  }
  
  return { name: modelName, fields, indexes };
}

function reorderModel(modelContent: string): string {
  const { name, fields, indexes } = parseModel(modelContent);
  
  // Separate fields by type
  const regularFields = fields.filter(f => !f.isRelation);
  const relations = fields.filter(f => f.isRelation);
  
  // Sort each group
  regularFields.sort((a, b) => a.order - b.order);
  relations.sort((a, b) => a.name.localeCompare(b.name));
  
  // Rebuild model
  let result = `model ${name} {\n`;
  
  // Add regular fields
  if (regularFields.length > 0) {
    regularFields.forEach(field => {
      result += `  ${field.definition}\n`;
    });
  }
  
  // Add blank line before relations if both exist
  if (regularFields.length > 0 && relations.length > 0) {
    result += '\n';
  }
  
  // Add relations
  if (relations.length > 0) {
    result += '  // Relations\n';
    relations.forEach(field => {
      result += `  ${field.definition}\n`;
    });
  }
  
  // Add blank line before indexes if they exist
  if (indexes.length > 0 && (regularFields.length > 0 || relations.length > 0)) {
    result += '\n';
  }
  
  // Add indexes
  if (indexes.length > 0) {
    result += '  // Indexes\n';
    indexes.forEach(index => {
      result += `  ${index}\n`;
    });
  }
  
  result += '}';
  
  return result;
}

function reorderPrismaSchema() {
  console.log('Reading Prisma schema...');
  const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  
  // Split schema into sections
  const modelRegex = /^model\s+\w+\s*{[\s\S]*?^}/gm;
  const models = schemaContent.match(modelRegex) || [];
  
  console.log(`Found ${models.length} models to reorder`);
  
  // Create backup
  const backupPath = SCHEMA_PATH + '.backup.' + Date.now();
  fs.writeFileSync(backupPath, schemaContent);
  console.log(`Created backup at: ${backupPath}`);
  
  // Reorder each model
  let newSchema = schemaContent;
  models.forEach(model => {
    const modelName = model.match(/^model\s+(\w+)/)?.[1] || '';
    console.log(`Reordering model: ${modelName}`);
    
    const reordered = reorderModel(model);
    newSchema = newSchema.replace(model, reordered);
  });
  
  // Write updated schema
  fs.writeFileSync(SCHEMA_PATH, newSchema);
  console.log('Schema reordering complete!');
  
  console.log('\nNext steps:');
  console.log('1. Review the changes: git diff prisma/schema.prisma');
  console.log('2. Run: pnpm prisma format');
  console.log('3. Run: pnpm prisma validate');
  console.log('4. Create migration: pnpm prisma migrate dev --name reorder_fields');
}

// Run the script
if (require.main === module) {
  try {
    reorderPrismaSchema();
  } catch (error) {
    console.error('Error reordering schema:', error);
    process.exit(1);
  }
}